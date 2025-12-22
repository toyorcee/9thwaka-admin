import { SocketEvents } from "../constants/socketEvents.js";
import Order from "../models/Order.js";
import RiderLocation from "../models/RiderLocation.js";
import RiderPayout from "../models/RiderPayout.js";
import User from "../models/User.js";
import { io } from "../server.js";
import { createAndSendNotification } from "../services/notificationService.js";
import {
  initializePayment,
  verifyPayment,
  verifyWebhookSignature,
} from "../services/paystackService.js";

// Get current week range (Sunday to Saturday)
function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

// Get payment due date (Saturday 11:59 PM - end of the week)
function getPaymentDueDate(weekEnd) {
  const dueDate = new Date(weekEnd);
  dueDate.setDate(dueDate.getDate() - 1); // Saturday
  dueDate.setHours(23, 59, 59, 999);
  return dueDate;
}

// Get payment grace deadline (Monday 11:59 PM - 2 days after due date)
function getPaymentGraceDeadline(weekEnd) {
  const dueDate = getPaymentDueDate(weekEnd);
  const graceDeadline = new Date(dueDate);
  graceDeadline.setDate(graceDeadline.getDate() + 2); // Monday
  graceDeadline.setHours(23, 59, 59, 999);
  return graceDeadline;
}

function isPaymentOverdue(payout, weekEnd) {
  if (payout.status === "paid") return false;
  const graceDeadline = getPaymentGraceDeadline(weekEnd);
  return new Date() > graceDeadline;
}

export const getEarnings = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "rider") {
      return res.status(403).json({ success: false, error: "Rider only" });
    }

    const { start, end } = getWeekRange();

    const weekOrders = await Order.find({
      riderId: req.user._id,
      status: "delivered",
      "delivery.deliveredAt": { $gte: start, $lt: end },
    })
      .select(
        "_id price financial delivery.deliveredAt pickup dropoff items createdAt"
      )
      .sort({ "delivery.deliveredAt": -1 });

    const weeklyTotals = weekOrders.reduce(
      (acc, order) => {
        const fin = order.financial || {
          grossAmount: order.price || 0,
          commissionAmount: 0,
          riderNetAmount: order.price || 0,
        };
        acc.gross += fin.grossAmount || 0;
        acc.commission += fin.commissionAmount || 0;
        acc.riderNet += fin.riderNetAmount || 0;
        acc.count += 1;
        return acc;
      },
      { gross: 0, commission: 0, riderNet: 0, count: 0 }
    );

    // Get all-time totals (for history)
    const allTimeOrders = await Order.find({
      riderId: req.user._id,
      status: "delivered",
    }).select("financial price");

    const allTimeTotals = allTimeOrders.reduce(
      (acc, order) => {
        const fin = order.financial || {
          grossAmount: order.price || 0,
          commissionAmount: 0,
          riderNetAmount: order.price || 0,
        };
        acc.gross += fin.grossAmount || 0;
        acc.commission += fin.commissionAmount || 0;
        acc.riderNet += fin.riderNetAmount || 0;
        acc.count += 1;
        return acc;
      },
      { gross: 0, commission: 0, riderNet: 0, count: 0 }
    );

    const currentPayout = await RiderPayout.findOne({
      riderId: req.user._id,
      weekStart: start,
    });

    const mostRecentPendingPayout = await RiderPayout.findOne({
      riderId: req.user._id,
      status: "pending",
    })
      .sort({ weekStart: -1 })
      .lean();

    const paymentDueDate = getPaymentDueDate(end);
    const graceDeadline = getPaymentGraceDeadline(end);

    let pendingPayoutDueDate = null;
    let pendingPayoutGraceDeadline = null;
    let pendingPayoutIsOverdue = false;
    let pendingPayoutDaysUntilDue = 0;
    let pendingPayoutDaysUntilGraceDeadline = 0;
    let pendingPayoutIsPaymentDue = false;
    let pendingPayoutIsInGracePeriod = false;

    if (
      mostRecentPendingPayout &&
      mostRecentPendingPayout.weekStart.getTime() !== start.getTime()
    ) {
      const pendingWeekEnd = mostRecentPendingPayout.weekEnd;
      pendingPayoutDueDate = getPaymentDueDate(pendingWeekEnd);
      pendingPayoutGraceDeadline = getPaymentGraceDeadline(pendingWeekEnd);
      pendingPayoutIsOverdue = isPaymentOverdue(
        mostRecentPendingPayout,
        pendingWeekEnd
      );
      pendingPayoutDaysUntilDue = Math.ceil(
        (pendingPayoutDueDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );
      pendingPayoutDaysUntilGraceDeadline = Math.ceil(
        (pendingPayoutGraceDeadline.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );
      pendingPayoutIsPaymentDue =
        (mostRecentPendingPayout.totals?.commission || 0) > 0 &&
        pendingPayoutDaysUntilDue <= 0;
      pendingPayoutIsInGracePeriod =
        (mostRecentPendingPayout.totals?.commission || 0) > 0 &&
        pendingPayoutDaysUntilDue <= 0 &&
        pendingPayoutDaysUntilGraceDeadline > 0;
    }

    const isOverdue = currentPayout
      ? isPaymentOverdue(currentPayout, end)
      : false;
    const daysUntilDue = Math.ceil(
      (paymentDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUntilGraceDeadline = Math.ceil(
      (graceDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const isPaymentDue = weeklyTotals.commission > 0 && daysUntilDue <= 0;
    const isInGracePeriod =
      weeklyTotals.commission > 0 &&
      daysUntilDue <= 0 &&
      daysUntilGraceDeadline > 0;

    const rider = await User.findById(req.user._id).select(
      "paymentBlocked paymentBlockedAt paymentBlockedReason"
    );

    const { getWalletBalance } = await import("../utils/walletUtils.js");
    const walletBalance = await getWalletBalance(req.user._id);

    const trips = weekOrders.map((order) => {
      const fin = order.financial || {
        grossAmount: order.price || 0,
        commissionAmount: 0,
        riderNetAmount: order.price || 0,
      };
      return {
        orderId: order._id.toString(),
        deliveredAt: order.delivery?.deliveredAt || order.createdAt,
        pickup: order.pickup?.address || "",
        dropoff: order.dropoff?.address || "",
        items: order.items || "",
        grossAmount: fin.grossAmount || 0,
        commissionAmount: fin.commissionAmount || 0,
        riderNetAmount: fin.riderNetAmount || 0,
        price: order.price || 0,
      };
    });

    // Determine if we should include pendingPayout
    const shouldIncludePendingPayout =
      mostRecentPendingPayout &&
      mostRecentPendingPayout.weekStart.getTime() !== start.getTime();

    res.json({
      success: true,
      currentWeek: {
        weekStart: start,
        weekEnd: end,
        totals: weeklyTotals,
        trips,
        payout: currentPayout
          ? {
              id: currentPayout._id.toString(),
              status: currentPayout.status,
              paidAt: currentPayout.paidAt,
              markedPaidBy: currentPayout.markedPaidBy,
              paymentReferenceCode: currentPayout.paymentReferenceCode,
              paystackPayment: currentPayout.paystackPayment,
            }
          : null,
        paymentDueDate,
        graceDeadline,
        isPaymentDue,
        isOverdue,
        isInGracePeriod,
        daysUntilDue,
        daysUntilGraceDeadline,
      },
      // Include most recent pending payout if it's from a previous week
      pendingPayout: shouldIncludePendingPayout
        ? {
            id: mostRecentPendingPayout._id.toString(),
            weekStart: mostRecentPendingPayout.weekStart,
            weekEnd: mostRecentPendingPayout.weekEnd,
            status: mostRecentPendingPayout.status,
            totals: mostRecentPendingPayout.totals,
            paidAt: mostRecentPendingPayout.paidAt,
            markedPaidBy: mostRecentPendingPayout.markedPaidBy,
            paymentReferenceCode: mostRecentPendingPayout.paymentReferenceCode,
            paystackPayment: mostRecentPendingPayout.paystackPayment,
            paymentDueDate: pendingPayoutDueDate,
            graceDeadline: pendingPayoutGraceDeadline,
            isPaymentDue: pendingPayoutIsPaymentDue,
            isOverdue: pendingPayoutIsOverdue,
            isInGracePeriod: pendingPayoutIsInGracePeriod,
            daysUntilDue: pendingPayoutDaysUntilDue,
            daysUntilGraceDeadline: pendingPayoutDaysUntilGraceDeadline,
          }
        : null,
      allTime: {
        totals: allTimeTotals,
      },
      paymentStatus: {
        isBlocked: rider?.paymentBlocked || false,
        blockedAt: rider?.paymentBlockedAt || null,
        blockedReason: rider?.paymentBlockedReason || null,
        accountDeactivated: rider?.accountDeactivated || false,
        accountDeactivatedAt: rider?.accountDeactivatedAt || null,
        accountDeactivatedReason: rider?.accountDeactivatedReason || null,
      },
      walletBalance: walletBalance,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const generatePayoutsForWeek = async (req, res) => {
  try {
    const { weekStart } = req.query || {};
    const { start, end } = weekStart
      ? getWeekRange(new Date(weekStart))
      : getWeekRange();

    const delivered = await Order.find({
      status: "delivered",
      "delivery.deliveredAt": { $gte: start, $lt: end },
      riderId: { $ne: null },
    }).select("riderId delivery.deliveredAt financial price");

    const byRider = new Map();
    for (const o of delivered) {
      const key = String(o.riderId);
      const fin = o.financial || {
        grossAmount: o.price || 0,
        commissionAmount: 0,
        riderNetAmount: o.price || 0,
      };
      if (!byRider.has(key)) byRider.set(key, []);
      byRider.get(key).push({
        orderId: o._id,
        deliveredAt: o.delivery?.deliveredAt || new Date(),
        grossAmount: fin.grossAmount || 0,
        commissionAmount: fin.commissionAmount || 0,
        riderNetAmount: fin.riderNetAmount || 0,
      });
    }

    const allRiders = await User.find({
      role: "rider",
      isVerified: true,
    }).select("_id");

    const results = [];
    const riderIdsWithOrders = new Set();

    for (const [riderId, orders] of byRider.entries()) {
      riderIdsWithOrders.add(riderId);
      const totals = orders.reduce(
        (acc, x) => {
          acc.gross += x.grossAmount;
          acc.commission += x.commissionAmount;
          acc.riderNet += x.riderNetAmount;
          acc.count += 1;
          return acc;
        },
        { gross: 0, commission: 0, riderNet: 0, count: 0 }
      );

      // Generate unique payment reference code if not exists
      let paymentReferenceCode = null;
      const existingPayout = await RiderPayout.findOne({
        riderId,
        weekStart: start,
      });
      if (!existingPayout || !existingPayout.paymentReferenceCode) {
        // Format: 9W + Rider ID (last 6 chars) + Week timestamp (last 6 digits) + Random (2 chars)
        const riderIdShort = String(riderId).slice(-6).toUpperCase();
        const weekTimestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 4).toUpperCase();
        paymentReferenceCode = `9W${riderIdShort}${weekTimestamp}${random}`;
      } else {
        paymentReferenceCode = existingPayout.paymentReferenceCode;
      }

      const doc = await RiderPayout.findOneAndUpdate(
        { riderId, weekStart: start },
        {
          riderId,
          weekStart: start,
          weekEnd: end,
          orders,
          totals,
          paymentReferenceCode: paymentReferenceCode || undefined,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push(doc);
    }

    // Create payout records for riders with no orders (so they see pending in the table)
    for (const rider of allRiders) {
      const riderIdStr = String(rider._id);
      if (!riderIdsWithOrders.has(riderIdStr)) {
        // Generate unique payment reference code if not exists
        let paymentReferenceCode = null;
        const existingPayout = await RiderPayout.findOne({
          riderId: rider._id,
          weekStart: start,
        });
        if (!existingPayout || !existingPayout.paymentReferenceCode) {
          // Format: 9W + Rider ID (last 6 chars) + Week timestamp (last 6 digits) + Random (2 chars)
          const riderIdShort = String(rider._id).slice(-6).toUpperCase();
          const weekTimestamp = Date.now().toString().slice(-6);
          const random = Math.random()
            .toString(36)
            .substring(2, 4)
            .toUpperCase();
          paymentReferenceCode = `9W${riderIdShort}${weekTimestamp}${random}`;
        } else {
          paymentReferenceCode = existingPayout.paymentReferenceCode;
        }

        const doc = await RiderPayout.findOneAndUpdate(
          { riderId: rider._id, weekStart: start },
          {
            riderId: rider._id,
            weekStart: start,
            weekEnd: end,
            orders: [],
            totals: {
              gross: 0,
              commission: 0,
              riderNet: 0,
              count: 0,
            },
            paymentReferenceCode: paymentReferenceCode || undefined,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        results.push(doc);
      }
    }

    const response = {
      success: true,
      weekStart: start,
      weekEnd: end,
      payouts: results,
    };
    try {
      for (const p of results) {
        // Notify rider
        try {
          await createAndSendNotification(p.riderId, {
            type: "payout_generated",
            title: "Weekly payout generated",
            message: `Your weekly earnings of ₦${p.totals.riderNet.toLocaleString()} have been calculated and are ready for payment`,
          });
        } catch {}

        io.to(`user:${p.riderId}`).emit(SocketEvents.PAYOUT_GENERATED, {
          payoutId: p._id.toString(),
          weekStart: p.weekStart,
          weekEnd: p.weekEnd,
        });
      }
    } catch {}
    return res.json(response);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const listPayouts = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "User is not defined",
      });
    }

    const { riderId, status, weekStart } = req.query || {};
    const query = {};

    const isAdmin = req.user.role === "admin";
    if (!isAdmin) {
      query.riderId = req.user._id;
    } else if (riderId) {
      query.riderId = riderId;
    }

    if (status) query.status = status;
    if (weekStart) query.weekStart = new Date(weekStart);
    const payouts = await RiderPayout.find(query)
      .sort({ weekStart: -1 })
      .populate("riderId", "fullName email")
      .lean();

    const formattedPayouts = payouts.map((payout) => ({
      _id: payout._id.toString(),
      weekStart: payout.weekStart,
      weekEnd: payout.weekEnd,
      totals: payout.totals || {
        gross: 0,
        commission: 0,
        riderNet: 0,
        count: 0,
      },
      orders: payout.orders || [],
      status: payout.status,
      paidAt: payout.paidAt,
      markedPaidBy: payout.markedPaidBy,
      paymentProofScreenshot: payout.paymentProofScreenshot,
      createdAt: payout.createdAt,
    }));

    res.json({ success: true, payouts: formattedPayouts });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Mark payout as paid - Riders can mark their own, Admins can mark any
 * This automatically unblocks riders whether payment is within grace period or overdue.
 * Riders mark their own payment when they make it, reducing admin workload.
 * Admins can verify later and manually block if payment wasn't actually received.
 *
 * IMPORTANT: When payout is marked as paid, the rider will NOT be blocked by the Monday cron job
 * because the blocking job only processes payouts with status "pending".
 */
export const markPayoutPaid = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "User is not defined",
      });
    }

    const payout = await RiderPayout.findById(req.params.id);
    if (!payout)
      return res
        .status(404)
        .json({ success: false, error: "Payout not found" });

    const isAdmin = req.user.role === "admin";
    const isRiderOwner = String(payout.riderId) === String(req.user._id);

    if (!isAdmin && !isRiderOwner) {
      return res.status(403).json({
        success: false,
        error: "You can only mark your own payout as paid",
      });
    }

    if (payout.status === "paid") {
      return res.json({
        success: true,
        message: "Payout already marked as paid",
        payout,
      });
    }

    let rewardsUsed = 0;
    const rewardsAmount = req.body?.rewardsAmount
      ? parseFloat(req.body.rewardsAmount)
      : 0;

    if (rewardsAmount > 0) {
      const { getWalletBalance, deductWalletBalance } = await import(
        "../utils/walletUtils.js"
      );
      const walletBalance = await getWalletBalance(payout.riderId);

      if (rewardsAmount > walletBalance) {
        return res.status(400).json({
          success: false,
          error: `Insufficient rewards balance. You have ₦${walletBalance.toLocaleString()} available.`,
        });
      }

      const commissionAmount = payout.totals.commission;
      const actualRewardsToUse = Math.min(rewardsAmount, commissionAmount);
      const { debitWallet } = await import("../utils/walletUtils.js");
      await debitWallet(payout.riderId, actualRewardsToUse, {
        type: "commission_payment",
        payoutId: payout._id.toString(),
        description: `Used rewards for payout payment`,
        createTransactionRecord: true,
      });
      rewardsUsed = actualRewardsToUse;

      console.log(
        `💰 Rewards used for payout ${
          payout._id
        }: ₦${actualRewardsToUse.toLocaleString()}`
      );
    }

    payout.status = "paid";
    payout.paidAt = new Date();
    payout.markedPaidBy = isAdmin ? "admin" : "rider";
    payout.markedPaidByUserId = req.user._id;

    if (req.file) {
      payout.paymentProofScreenshot = `/api/uploads/${req.file.filename}`;
    }

    if (rewardsUsed > 0) {
      payout.rewardsUsed = rewardsUsed;
    }

    await payout.save();

    const User = (await import("../models/User.js")).default;
    await User.findByIdAndUpdate(payout.riderId, {
      paymentBlocked: false,
      paymentBlockedAt: null,
      paymentBlockedReason: null,
    });

    try {
      await createAndSendNotification(payout.riderId, {
        type: "payout_paid",
        title: "Payment received",
        message: `Your weekly earnings of ₦${payout.totals.riderNet.toLocaleString()} have been paid`,
      });
    } catch {}

    try {
      io.to(`user:${payout.riderId}`).emit(SocketEvents.PAYOUT_PAID, {
        payoutId: payout._id.toString(),
      });
    } catch {}
    res.json({ success: true, payout });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Initialize Paystack payment for rider commission
 * POST /api/payouts/:id/paystack/initialize
 */
export const initializePaystackPayment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "User is not defined",
      });
    }

    const payout = await RiderPayout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({
        success: false,
        error: "Payout not found",
      });
    }

    const isRiderOwner = String(payout.riderId) === String(req.user._id);
    if (!isRiderOwner) {
      return res.status(403).json({
        success: false,
        error: "You can only pay your own commission",
      });
    }

    if (payout.status === "paid") {
      return res.status(400).json({
        success: false,
        error: "This payout has already been paid",
      });
    }

    const rider = await User.findById(payout.riderId).select("email fullName");
    if (!rider || !rider.email) {
      return res.status(400).json({
        success: false,
        error: "Rider email not found. Please update your profile.",
      });
    }

    if (
      payout.paystackPayment?.reference &&
      payout.paystackPayment?.status === "pending"
    ) {
      return res.json({
        success: true,
        authorization_url: payout.paystackPayment.authorization_url,
        reference: payout.paystackPayment.reference,
        message: "Payment already initialized",
      });
    }

    const reference = payout.paymentReferenceCode
      ? `PAY-${payout.paymentReferenceCode}`
      : `PAY-${payout._id.toString()}-${Date.now()}`;

    const baseUrl =
      process.env.SERVER_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    const callbackUrl = `${baseUrl}/api/payouts/paystack/callback`;

    let rewardsUsed = 0;
    let amountToPay = payout.totals.commission;
    const rewardsAmount = req.body?.rewardsAmount
      ? parseFloat(req.body.rewardsAmount)
      : 0;

    if (rewardsAmount > 0) {
      const { getWalletBalance, debitWallet } = await import(
        "../utils/walletUtils.js"
      );
      const walletBalance = await getWalletBalance(payout.riderId);

      if (rewardsAmount > walletBalance) {
        return res.status(400).json({
          success: false,
          error: `Insufficient rewards balance. You have ₦${walletBalance.toLocaleString()} available.`,
        });
      }

      const actualRewardsToUse = Math.min(rewardsAmount, amountToPay);

      if (actualRewardsToUse >= amountToPay) {
        await debitWallet(payout.riderId, actualRewardsToUse, {
          type: "commission_payment",
          payoutId: payout._id.toString(),
          description: `Used rewards for payout payment`,
          createTransactionRecord: true,
        });
        payout.status = "paid";
        payout.paidAt = new Date();
        payout.markedPaidBy = "rider";
        payout.markedPaidByUserId = req.user._id;
        payout.rewardsUsed = actualRewardsToUse;
        await payout.save();

        const User = (await import("../models/User.js")).default;
        await User.findByIdAndUpdate(payout.riderId, {
          paymentBlocked: false,
          paymentBlockedAt: null,
          paymentBlockedReason: null,
        });

        return res.json({
          success: true,
          message: "Payment completed using rewards",
          paidWithRewards: true,
          rewardsUsed: actualRewardsToUse,
          payout,
        });
      }

      rewardsUsed = actualRewardsToUse;
      amountToPay = amountToPay - actualRewardsToUse;

      console.log(
        `💰 [PAYSTACK] Rewards reserved (not deducted yet) for payout ${
          payout._id
        }: ₦${actualRewardsToUse.toLocaleString()}, Paystack amount: ₦${amountToPay.toLocaleString()}`
      );
    }

    const result = await initializePayment({
      amount: amountToPay,
      email: rider.email,
      reference,
      metadata: {
        payoutId: payout._id.toString(),
        riderId: payout.riderId.toString(),
        paymentReferenceCode: payout.paymentReferenceCode || null,
        type: "rider_commission",
        rewardsUsed: rewardsUsed > 0 ? rewardsUsed : undefined,
      },
      callback_url: callbackUrl,
    });

    if (!result.success) {
      console.error(
        `❌ [PAYSTACK] Payment initialization failed for payout ${payout._id}. Rewards NOT deducted (atomic).`
      );
      return res.status(400).json({
        success: false,
        error: result.error || "Failed to initialize payment",
      });
    }

    payout.paystackPayment = {
      reference: result.reference,
      authorization_url: result.authorization_url,
      status: "pending",
      amount: amountToPay,
    };
    if (rewardsUsed > 0) {
      payout.rewardsUsed = rewardsUsed; // Store intended amount, will deduct on payment confirmation
    }
    await payout.save();

    console.log(
      `✅ [PAYSTACK] Payment initialized successfully. Rewards reserved: ₦${rewardsUsed.toLocaleString()}, will deduct on payment confirmation.`
    );

    res.json({
      success: true,
      authorization_url: result.authorization_url,
      reference: result.reference,
      access_code: result.access_code,
    });
  } catch (e) {
    console.error("[PAYOUT] Initialize Paystack payment error:", e);
    console.error(
      "❌ [PAYSTACK] Error occurred. Rewards were NOT deducted (atomic transaction preserved)."
    );

    // Provide user-friendly error messages
    let errorMessage = "Payment initialization failed. Please try again.";
    if (
      e.message?.includes("Invalid key") ||
      e.message?.includes("invalid_Key")
    ) {
      errorMessage =
        "Payment service configuration error. Please contact support.";
    } else if (
      e.message?.includes("network") ||
      e.message?.includes("timeout")
    ) {
      errorMessage =
        "Network error. Please check your connection and try again.";
    } else if (e.message) {
      errorMessage = e.message;
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? e.message : undefined,
    });
  }
};

/**
 * Paystack webhook handler
 * POST /api/payouts/paystack/webhook
 */
export const paystackWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];
    if (!signature) {
      return res
        .status(400)
        .json({ success: false, error: "Missing signature" });
    }

    // Parse body (it's raw JSON from express.raw middleware)
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // Verify webhook signature
    const isValid = verifyWebhookSignature(signature, body);
    if (!isValid) {
      console.error("[PAYSTACK] Invalid webhook signature");
      return res
        .status(400)
        .json({ success: false, error: "Invalid signature" });
    }

    const event = body;
    console.log("[PAYSTACK] Webhook event:", event.event);

    // Handle charge.success event
    if (event.event === "charge.success") {
      const transaction = event.data;
      const reference = transaction.reference;

      // Find payout by Paystack reference
      const payout = await RiderPayout.findOne({
        "paystackPayment.reference": reference,
      });

      if (!payout) {
        console.error("[PAYSTACK] Payout not found for reference:", reference);
        return res
          .status(404)
          .json({ success: false, error: "Payout not found" });
      }

      // Verify payment with Paystack
      const verification = await verifyPayment(reference);
      if (!verification.success || verification.data.status !== "success") {
        console.error("[PAYSTACK] Payment verification failed:", verification);
        return res.status(400).json({
          success: false,
          error: "Payment verification failed",
        });
      }

      // Deduct rewards now that payment is confirmed (atomic transaction)
      if (payout.rewardsUsed && payout.rewardsUsed > 0) {
        console.log(
          `💰 [PAYSTACK] Payment confirmed. Deducting rewards: ₦${payout.rewardsUsed.toLocaleString()}`
        );
        const { debitWallet } = await import("../utils/walletUtils.js");
        try {
          await debitWallet(payout.riderId, payout.rewardsUsed, {
            type: "commission_payment",
            payoutId: payout._id.toString(),
            riderId: payout.riderId.toString(),
            description: `Used rewards for partial payout payment (Paystack confirmed)`,
            createTransactionRecord: true,
          });
          console.log(
            `✅ [PAYSTACK] Rewards deducted successfully: ₦${payout.rewardsUsed.toLocaleString()}`
          );
        } catch (walletError) {
          console.error(
            `❌ [PAYSTACK] Failed to deduct rewards:`,
            walletError.message
          );
          // Don't fail the payment - rewards deduction can be retried manually
        }
      }

      // Update payout status
      if (payout.status !== "paid") {
        payout.status = "paid";
        payout.paidAt = new Date(verification.data.paid_at || new Date());
        payout.markedPaidBy = "paystack";
        payout.markedPaidByUserId = payout.riderId; // System marked
      }

      // Update Paystack payment details
      payout.paystackPayment.status = "success";
      payout.paystackPayment.paidAt = new Date(
        verification.data.paid_at || new Date()
      );
      payout.paystackPayment.gateway_response =
        verification.data.gateway_response;
      await payout.save();

      // Unblock rider if blocked
      const User = (await import("../models/User.js")).default;
      await User.findByIdAndUpdate(payout.riderId, {
        paymentBlocked: false,
        paymentBlockedAt: null,
        paymentBlockedReason: null,
      });

      // Notify rider
      try {
        await createAndSendNotification(payout.riderId, {
          type: "payout_paid",
          title: "✅ Payment Successful",
          message: `Your commission payment of ₦${payout.totals.commission.toLocaleString()} has been received via Paystack`,
        });
      } catch (notifError) {
        console.error("[PAYSTACK] Notification error:", notifError);
      }

      // Emit socket event
      try {
        io.to(`user:${payout.riderId}`).emit(SocketEvents.PAYOUT_PAID, {
          payoutId: payout._id.toString(),
          method: "paystack",
        });
      } catch (socketError) {
        console.error("[PAYSTACK] Socket error:", socketError);
      }

      console.log(
        "[PAYSTACK] Payment verified and payout updated:",
        payout._id
      );
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (e) {
    console.error("[PAYSTACK] Webhook error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Paystack payment callback (redirect after payment)
 * GET /api/payouts/paystack/callback
 */
export const paystackCallback = async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) {
      return res
        .status(400)
        .json({ success: false, error: "Missing reference" });
    }

    // Verify payment
    const verification = await verifyPayment(reference);
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        error: verification.error || "Payment verification failed",
      });
    }

    // Find payout
    const payout = await RiderPayout.findOne({
      "paystackPayment.reference": reference,
    });

    if (!payout) {
      return res
        .status(404)
        .json({ success: false, error: "Payout not found" });
    }

    // Update payout if payment successful
    if (verification.data.status === "success" && payout.status !== "paid") {
      // Deduct rewards now that payment is confirmed (atomic transaction)
      if (payout.rewardsUsed && payout.rewardsUsed > 0) {
        console.log(
          `💰 [PAYSTACK] Payment confirmed via callback. Deducting rewards: ₦${payout.rewardsUsed.toLocaleString()}`
        );
        const { debitWallet } = await import("../utils/walletUtils.js");
        try {
          await debitWallet(payout.riderId, payout.rewardsUsed, {
            type: "commission_payment",
            payoutId: payout._id.toString(),
            riderId: payout.riderId.toString(),
            description: `Used rewards for partial payout payment (Paystack confirmed)`,
            createTransactionRecord: true,
          });
          console.log(
            `✅ [PAYSTACK] Rewards deducted successfully: ₦${payout.rewardsUsed.toLocaleString()}`
          );
        } catch (walletError) {
          console.error(
            `❌ [PAYSTACK] Failed to deduct rewards:`,
            walletError.message
          );
          // Don't fail the payment - rewards deduction can be retried manually
        }
      }

      payout.status = "paid";
      payout.paidAt = new Date(verification.data.paid_at || new Date());
      payout.markedPaidBy = "paystack";
      payout.markedPaidByUserId = payout.riderId;

      payout.paystackPayment.status = "success";
      payout.paystackPayment.paidAt = new Date(
        verification.data.paid_at || new Date()
      );
      payout.paystackPayment.gateway_response =
        verification.data.gateway_response;
      await payout.save();

      // Unblock rider
      const User = (await import("../models/User.js")).default;
      await User.findByIdAndUpdate(payout.riderId, {
        paymentBlocked: false,
        paymentBlockedAt: null,
        paymentBlockedReason: null,
      });

      // Notify rider
      try {
        await createAndSendNotification(payout.riderId, {
          type: "payout_paid",
          title: "✅ Payment Successful",
          message: `Your commission payment of ₦${payout.totals.commission.toLocaleString()} has been received`,
        });
      } catch {}

      try {
        io.to(`user:${payout.riderId}`).emit(SocketEvents.PAYOUT_PAID, {
          payoutId: payout._id.toString(),
          method: "paystack",
        });
      } catch {}
    }

    // Redirect to success page or return JSON
    if (req.headers.accept?.includes("text/html")) {
      // HTML redirect for web
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Successful</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                backdrop-filter: blur(10px);
              }
              h1 { margin: 0 0 1rem 0; }
              p { margin: 0.5rem 0; opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✅ Payment Successful!</h1>
              <p>Your commission payment has been received.</p>
              <p>You can close this window and return to the app.</p>
            </div>
          </body>
        </html>
      `);
    } else {
      // JSON response for API
      res.json({
        success: true,
        message: "Payment verified",
        payout: {
          id: payout._id.toString(),
          status: payout.status,
        },
      });
    }
  } catch (e) {
    console.error("[PAYSTACK] Callback error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getBlockedRiders = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const blockedRiders = await User.find({
      role: "rider",
      paymentBlocked: true,
    })
      .select(
        "fullName email phoneNumber paymentBlockedAt paymentBlockedReason strikes strikeHistory accountDeactivated"
      )
      .sort({ paymentBlockedAt: -1 })
      .lean();

    const { start, end } = getWeekRange();
    const riderIds = blockedRiders.map((r) => r._id);
    const currentPayouts = await RiderPayout.find({
      riderId: { $in: riderIds },
      weekStart: start,
    })
      .select("riderId totals status")
      .lean();

    const payoutMap = new Map();
    currentPayouts.forEach((p) => {
      payoutMap.set(String(p.riderId), p);
    });

    const ridersWithPayouts = blockedRiders.map((rider) => {
      const payout = payoutMap.get(String(rider._id));
      return {
        ...rider,
        currentWeekPayout: payout
          ? {
              commission: payout.totals.commission,
              status: payout.status,
            }
          : null,
      };
    });

    res.json({ success: true, riders: ridersWithPayouts });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Unblock a rider (admin only) - confirms payment for overdue riders (past grace period)
 * This endpoint is ONLY for riders who are blocked after the grace period has passed.
 * Riders who pay within the grace period are automatically unblocked when payout is marked as paid.
 * PATCH /api/admin/riders/:riderId/unblock
 */
export const unblockRider = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const { riderId } = req.params;
    const { markPayoutPaid, payoutId } = req.body || {};

    const rider = await User.findById(riderId);
    if (!rider) {
      return res.status(404).json({ success: false, error: "Rider not found" });
    }

    if (rider.role !== "rider") {
      return res
        .status(400)
        .json({ success: false, error: "User is not a rider" });
    }

    if (!rider.paymentBlocked) {
      return res
        .status(400)
        .json({ success: false, error: "Rider is not blocked" });
    }

    // Check if rider was blocked after grace period (overdue)
    // If paymentBlockedAt exists and is after grace period, this is an overdue case
    if (!rider.paymentBlockedAt) {
      return res.status(400).json({
        success: false,
        error:
          "Cannot determine if rider is overdue. Please use payout mark-paid endpoint for grace period payments.",
      });
    }

    // Unblock the rider
    await User.findByIdAndUpdate(riderId, {
      paymentBlocked: false,
      paymentBlockedAt: null,
      paymentBlockedReason: null,
    });

    // Optionally mark payout as paid if provided
    if (markPayoutPaid && payoutId) {
      const payout = await RiderPayout.findById(payoutId);
      if (payout && payout.riderId.toString() === riderId) {
        payout.status = "paid";
        payout.paidAt = new Date();
        await payout.save();
      }
    }

    // Set rider offline if they're online (they need to go online again after unblocking)
    await RiderLocation.findOneAndUpdate({ riderId }, { online: false });

    // Notify rider
    try {
      await createAndSendNotification(riderId, {
        type: "payment_unblocked",
        title: "✅ Account Unblocked",
        message:
          "Your account has been unblocked. You can now go online and accept orders.",
      });
    } catch {}

    try {
      io.to(`user:${riderId}`).emit(SocketEvents.PAYOUT_PAID, {
        riderId: riderId.toString(),
        unblocked: true,
      });
    } catch {}

    res.json({
      success: true,
      message: "Rider unblocked successfully",
      rider: {
        id: rider._id,
        fullName: rider.fullName,
        email: rider.email,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Manually deactivate a rider account (admin only)
 * PATCH /api/admin/riders/:riderId/deactivate
 */
export const deactivateRiderAccount = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const { riderId } = req.params;
    const { reason } = req.body || {};

    const rider = await User.findById(riderId);
    if (!rider) {
      return res.status(404).json({ success: false, error: "Rider not found" });
    }

    if (rider.role !== "rider") {
      return res
        .status(400)
        .json({ success: false, error: "User is not a rider" });
    }

    if (rider.accountDeactivated) {
      return res
        .status(400)
        .json({ success: false, error: "Account is already deactivated" });
    }

    // Deactivate the account
    await User.findByIdAndUpdate(riderId, {
      accountDeactivated: true,
      accountDeactivatedAt: new Date(),
      accountDeactivatedReason:
        reason ||
        `Account manually deactivated by admin ${
          req.user.email || req.user._id
        }`,
      paymentBlocked: true, // Also block payment
      paymentBlockedAt: new Date(),
    });

    // Set rider offline
    await RiderLocation.findOneAndUpdate({ riderId }, { online: false });

    // Notify rider
    try {
      await createAndSendNotification(riderId, {
        type: "account_deactivated",
        title: "🚫 Account Deactivated",
        message:
          reason ||
          "Your account has been deactivated by an administrator. Please contact support for more information.",
      });
    } catch {}

    res.json({
      success: true,
      message: "Rider account deactivated successfully",
      rider: {
        id: rider._id,
        fullName: rider.fullName,
        email: rider.email,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Reactivate a deactivated rider account (admin only)
 * PATCH /api/admin/riders/:riderId/reactivate
 */
export const reactivateRiderAccount = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const { riderId } = req.params;

    const rider = await User.findById(riderId);
    if (!rider) {
      return res.status(404).json({ success: false, error: "Rider not found" });
    }

    if (rider.role !== "rider") {
      return res
        .status(400)
        .json({ success: false, error: "User is not a rider" });
    }

    if (!rider.accountDeactivated) {
      return res
        .status(400)
        .json({ success: false, error: "Account is not deactivated" });
    }

    // Reactivate the account (but keep payment blocked if it was blocked)
    const updateData = {
      accountDeactivated: false,
      accountDeactivatedAt: null,
      accountDeactivatedReason: null,
    };

    // Only unblock payment if admin explicitly wants to
    const { unblockPayment } = req.body || {};
    if (unblockPayment) {
      updateData.paymentBlocked = false;
      updateData.paymentBlockedAt = null;
      updateData.paymentBlockedReason = null;
    }

    await User.findByIdAndUpdate(riderId, updateData);

    // Notify rider
    try {
      await createAndSendNotification(riderId, {
        type: "account_reactivated",
        title: "✅ Account Reactivated",
        message:
          "Your account has been reactivated. You can now access the platform.",
      });
    } catch {}

    res.json({
      success: true,
      message: "Rider account reactivated successfully",
      rider: {
        id: rider._id,
        fullName: rider.fullName,
        email: rider.email,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

import { SocketEvents } from "../constants/socketEvents.js";
import Order from "../models/Order.js";
import RiderLocation from "../models/RiderLocation.js";
import RiderPayout from "../models/RiderPayout.js";
import User from "../models/User.js";
import Referral from "../models/Referral.js";
import { io } from "../server.js";
import { createAndSendNotification } from "../services/notificationService.js";
import {
  getPaymentDueDate,
  getPaymentGraceDeadline,
  getWeekRange,
} from "../utils/weekUtils.js";
import { getPromoConfig } from "../utils/promoConfigUtils.js";

/**
 * Get admin dashboard statistics
 * GET /api/admin/stats
 */
export const getAdminStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    // Get order statistics
    const [
      totalOrders,
      pendingOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      todayOrders,
    ] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({
        status: { $in: ["assigned", "picked_up", "delivering"] },
      }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
      Order.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
    ]);

    // Get rider statistics
    const [totalRiders, onlineRiders, blockedRiders, verifiedRiders] =
      await Promise.all([
        User.countDocuments({ role: "rider" }),
        RiderLocation.countDocuments({ online: true }),
        User.countDocuments({ role: "rider", paymentBlocked: true }),
        User.countDocuments({
          role: "rider",
          driverLicenseVerified: true,
        }),
      ]);

    // Get customer statistics
    const totalCustomers = await User.countDocuments({ role: "customer" });

    // Calculate today's revenue
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayRevenue = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          "payment.status": "paid",
          updatedAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$price" },
        },
      },
    ]);

    const revenue = todayRevenue[0]?.total || 0;

    // Get pending payouts count
    const { start, end } = getWeekRange();
    const pendingPayouts = await RiderPayout.countDocuments({
      status: "pending",
      weekStart: start,
    });

    // Get overdue payouts (past grace period)
    const overduePayouts = await RiderPayout.countDocuments({
      status: "pending",
      weekStart: { $lt: start },
    });

    res.json({
      success: true,
      stats: {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          active: activeOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
          today: todayOrders,
        },
        riders: {
          total: totalRiders,
          online: onlineRiders,
          blocked: blockedRiders,
          verified: verifiedRiders,
        },
        customers: {
          total: totalCustomers,
        },
        revenue: {
          today: revenue,
        },
        payouts: {
          pending: pendingPayouts,
          overdue: overduePayouts,
        },
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get initial online status of all riders
 * GET /api/admin/riders/online-status
 */
export const getInitialRidersOnlineStatus = async (req, res) => {
  try {
    const onlineRiders = await RiderLocation.find({ online: true }).select("riderId").lean();
    const onlineRiderIds = onlineRiders.map(rider => rider.riderId.toString());
    res.json({ success: true, onlineRiderIds });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get a single order by ID (admin only)
 * GET /api/admin/orders/:id
 */
export const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId", "fullName email phoneNumber")
      .populate("riderId", "fullName email phoneNumber vehicleType")
      .lean({ virtuals: true });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get all orders (admin only)
 * GET /api/admin/orders
 */
export const getAllOrders = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(10, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;
    const search = req.query.search?.toString().trim() || "";
    const status = req.query.status?.toString().trim() || "";
    const serviceType = req.query.serviceType?.toString().trim() || "";

    const query = {};

    if (search) {
      const searchRegex = new RegExp(search, "i");

      const userIds = await User.find({
        $or: [
          { fullName: searchRegex },
          { email: searchRegex },
          { phoneNumber: searchRegex },
        ],
      }).select('_id');

      const userObjectIds = userIds.map((user) => user._id);

      query.$or = [
        { items: searchRegex },
        { "pickup.address": searchRegex },
        { "dropoff.address": searchRegex },
        { _id: searchRegex },
        { customerId: { $in: userObjectIds } },
        { riderId: { $in: userObjectIds } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (serviceType) {
      query.serviceType = serviceType;
    }

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate("customerId", "fullName email phoneNumber")
      .populate("riderId", "fullName email phoneNumber vehicleType")
      .select("orderId customerId riderId serviceType status price createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get all riders (admin only)
 * GET /api/admin/riders
 */
export const getAllRiders = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(10, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;
    const search = req.query.search?.toString().trim() || "";
    const blocked = req.query.blocked === "true";
    const verified = req.query.verified === "true";

    const query = { role: "rider" };

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
      ];
    }

    if (blocked) {
      query.paymentBlocked = true;
    }

    if (verified) {
      query.driverLicenseVerified = true;
    }

    const total = await User.countDocuments(query);

    const riders = await User.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "riderlocations",
          localField: "_id",
          foreignField: "riderId",
          as: "location",
        },
      },
      {
        $unwind: {
          path: "$location",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          online: { $ifNull: ["$location.online", false] },
        },
      },
      {
        $project: {
          fullName: 1,
          email: 1,
          phoneNumber: 1,
          vehicleType: 1,
          driverLicenseVerified: 1,
          paymentBlocked: 1,
          paymentBlockedAt: 1,
          strikes: 1,
          accountDeactivated: 1,
          averageRating: 1,
          totalRatings: 1,
          searchRadiusKm: 1,
          createdAt: 1,
          isVerified: 1,
          nin: 1,
          driverLicenseNumber: 1,
          bankName: 1,
          bankAccountNumber: 1,
          bankAccountName: 1,
          profilePicture: 1,
          vehiclePicture: 1,
          ninVerified: 1,
          driverLicensePicture: 1,
          preferredService: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      riders: riders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get all customers (admin only)
 * GET /api/admin/customers
 */
export const getAllCustomers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(10, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;
    const search = req.query.search?.toString().trim() || "";

    const query = { role: "customer" };

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
      ];
    }

    const total = await User.countDocuments(query);

    const customers = await User.find(query)
      .select(
        "fullName email phoneNumber defaultAddress createdAt accountDeactivated role isVerified"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get order statistics for each customer
    const customerIds = customers.map((c) => c._id);
    const orderStats = await Order.aggregate([
      {
        $match: {
          customerId: { $in: customerIds },
        },
      },
      {
        $group: {
          _id: "$customerId",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$price" },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap = new Map();
    orderStats.forEach((stat) => {
      statsMap.set(String(stat._id), {
        totalOrders: stat.totalOrders,
        totalSpent: stat.totalSpent,
        completedOrders: stat.completedOrders,
      });
    });

    const customersWithStats = customers.map((customer) => ({
      ...customer,
      stats: statsMap.get(String(customer._id)) || {
        totalOrders: 0,
        totalSpent: 0,
        completedOrders: 0,
      },
    }));

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      customers: customersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Admin: Get rider earnings history
 * GET /api/admin/riders/:riderId/earnings
 */
export const getRiderEarnings = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const { riderId } = req.params;
    if (!riderId) {
      return res
        .status(400)
        .json({ success: false, error: "Rider ID required" });
    }

    const rider = await User.findById(riderId).select(
      "fullName email phoneNumber"
    );
    if (!rider || rider.role !== "rider") {
      return res.status(404).json({ success: false, error: "Rider not found" });
    }

    const { start, end } = getWeekRange();

    // Get current week orders
    const weekOrders = await Order.find({
      riderId: riderId,
      status: "delivered",
      "delivery.deliveredAt": { $gte: start, $lt: end },
    })
      .select(
        "_id price financial delivery.deliveredAt pickup dropoff items createdAt serviceType"
      )
      .sort({ "delivery.deliveredAt": -1 })
      .lean();

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

    // Get all-time totals
    const allTimeOrders = await Order.find({
      riderId: riderId,
      status: "delivered",
    })
      .select("financial price")
      .lean();

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

    // Get current week payout
    const currentPayout = await RiderPayout.findOne({
      riderId: riderId,
      weekStart: start,
    }).lean();

    // Get all payouts for this rider
    const allPayouts = await RiderPayout.find({ riderId: riderId })
      .sort({ weekStart: -1 })
      .lean();

    // Format trip earnings
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
        serviceType: order.serviceType || "",
        grossAmount: fin.grossAmount || 0,
        commissionAmount: fin.commissionAmount || 0,
        riderNetAmount: fin.riderNetAmount || 0,
        price: order.price || 0,
      };
    });

    // Calculate payment due date and status
    const paymentDueDate = getPaymentDueDate(end);
    const graceDeadline = getPaymentGraceDeadline(end);
    const isOverdue = currentPayout
      ? new Date() > graceDeadline && currentPayout.status === "pending"
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

    // Check if rider is blocked
    const riderDetails = await User.findById(riderId).select(
      "paymentBlocked paymentBlockedAt paymentBlockedReason strikes strikeHistory accountDeactivated accountDeactivatedAt accountDeactivatedReason"
    );

    res.json({
      success: true,
      rider: {
        _id: rider._id.toString(),
        fullName: rider.fullName,
        email: rider.email,
        phoneNumber: rider.phoneNumber,
      },
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
      allTime: {
        totals: allTimeTotals,
      },
      payoutHistory: allPayouts.map((payout) => ({
        _id: payout._id.toString(),
        weekStart: payout.weekStart,
        weekEnd: payout.weekEnd,
        totals: payout.totals,
        status: payout.status,
        paidAt: payout.paidAt,
        markedPaidBy: payout.markedPaidBy,
        createdAt: payout.createdAt,
      })),
      paymentStatus: {
        isBlocked: riderDetails?.paymentBlocked || false,
        blockedAt: riderDetails?.paymentBlockedAt || null,
        blockedReason: riderDetails?.paymentBlockedReason || null,
        strikes: riderDetails?.strikes || 0,
        strikeHistory: riderDetails?.strikeHistory || [],
        accountDeactivated: riderDetails?.accountDeactivated || false,
        accountDeactivatedAt: riderDetails?.accountDeactivatedAt || null,
        accountDeactivatedReason:
          riderDetails?.accountDeactivatedReason || null,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Admin: Cancel any order
 * PATCH /api/admin/orders/:id/cancel
 */
export const adminCancelOrder = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (order.status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, error: "Order already cancelled" });
    }

    if (order.status === "delivered") {
      return res
        .status(400)
        .json({ success: false, error: "Cannot cancel delivered order" });
    }

    order.status = "cancelled";
    appendTimeline(order, "cancelled", "Cancelled by admin");

    await order.save();

    res.json({
      success: true,
      order,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

const appendTimeline = (order, status, note) => {
  order.timeline.push({ status, note, at: new Date() });
};

/**
 * Admin: Update order price (highest priority - overrides all price negotiations)
 * PATCH /api/admin/orders/:id/price
 */
export const adminUpdateOrderPrice = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const { price, reason } = req.body || {};
    if (!price || typeof price !== "number" || price <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid price is required",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (order.status === "delivered") {
      return res.status(400).json({
        success: false,
        error: "Cannot change price of delivered order",
      });
    }

    const oldPrice = order.price;
    const roundedPrice = Math.round(price);

    // Admin price update is the source of truth - clear any pending negotiations
    order.originalPrice = order.originalPrice || oldPrice; // Preserve original if not set
    order.price = roundedPrice;
    order.riderRequestedPrice = null; // Clear any pending rider request
    order.priceNegotiation = {
      status: "admin_updated",
      requestedAt: null,
      reason: reason || null,
      respondedAt: new Date(),
      adminUpdated: true,
    };

    appendTimeline(
      order,
      order.status,
      `Admin updated price: ₦${oldPrice.toLocaleString()} → ₦${roundedPrice.toLocaleString()}${
        reason ? ` (${reason})` : ""
      }`
    );

    // If order is already delivered, recalculate financials
    // Note: Commission will be recalculated automatically on next delivery verification
    // or we can recalculate here if needed

    await order.save();

    // Notify customer
    try {
      await createAndSendNotification(order.customerId, {
        type: "price_updated",
        title: "Order price updated",
        message: `Order price updated to ₦${roundedPrice.toLocaleString()}${
          reason ? ` - ${reason}` : ""
        }`,
        metadata: { orderId: order._id.toString() },
      });
    } catch {}

    // Notify rider if assigned
    if (order.riderId) {
      try {
        await createAndSendNotification(order.riderId, {
          type: "price_updated",
          title: "Order price updated",
          message: `Order price updated to ₦${roundedPrice.toLocaleString()}${
            reason ? ` - ${reason}` : ""
          }`,
          metadata: { orderId: order._id.toString() },
        });
      } catch {}
    }

    // Emit socket events

    io.to(`user:${order.customerId}`).emit(SocketEvents.ORDER_STATUS_UPDATED, {
      id: order._id.toString(),
      status: order.status,
      price: roundedPrice,
      adminUpdated: true,
    });

    if (order.riderId) {
      io.to(`user:${order.riderId}`).emit(SocketEvents.ORDER_STATUS_UPDATED, {
        id: order._id.toString(),
        status: order.status,
        price: roundedPrice,
        adminUpdated: true,
      });
    }

    res.json({
      success: true,
      order,
      message: `Price updated from ₦${oldPrice.toLocaleString()} to ₦${roundedPrice.toLocaleString()}`,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get pending referral rewards (completedTrips >= 2 but not paid)
 * GET /api/admin/referrals/pending
 */
export const getPendingReferralRewards = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const pendingReferrals = await Referral.find({
      completedTrips: { $gte: 2 },
      rewardPaid: false,
    })
      .populate("referrerId", "fullName email phoneNumber referralCode role")
      .populate("referredUserId", "fullName email phoneNumber role")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = pendingReferrals.map((ref) => ({
      id: ref._id.toString(),
      referrer: {
        id: ref.referrerId._id.toString(),
        name: ref.referrerId.fullName,
        email: ref.referrerId.email,
        phone: ref.referrerId.phoneNumber,
        referralCode: ref.referrerId.referralCode,
        role: ref.referrerId.role,
      },
      referredUser: {
        id: ref.referredUserId._id.toString(),
        name: ref.referredUserId.fullName,
        email: ref.referredUserId.email,
        phone: ref.referredUserId.phoneNumber,
        role: ref.referredUserId.role,
      },
      completedTrips: ref.completedTrips,
      rewardAmount: ref.rewardAmount || 1000,
      rewardPaid: ref.rewardPaid,
      createdAt: ref.createdAt,
      updatedAt: ref.updatedAt,
    }));

    res.json({
      success: true,
      count: formatted.length,
      referrals: formatted,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get all paid referral rewards (for tracking)
 * GET /api/admin/referrals/paid
 */
export const getPaidReferralRewards = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const paidReferrals = await Referral.find({
      rewardPaid: true,
    })
      .populate("referrerId", "fullName email phoneNumber referralCode role")
      .populate("referredUserId", "fullName email phoneNumber role")
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Referral.countDocuments({ rewardPaid: true });

    const formatted = paidReferrals.map((ref) => ({
      id: ref._id.toString(),
      referrer: {
        id: ref.referrerId._id.toString(),
        name: ref.referrerId.fullName,
        email: ref.referrerId.email,
        phone: ref.referrerId.phoneNumber,
        referralCode: ref.referrerId.referralCode,
        role: ref.referrerId.role,
      },
      referredUser: {
        id: ref.referredUserId._id.toString(),
        name: ref.referredUserId.fullName,
        email: ref.referredUserId.email,
        phone: ref.referredUserId.phoneNumber,
        role: ref.referredUserId.role,
      },
      completedTrips: ref.completedTrips,
      rewardAmount: ref.rewardAmount || 1000,
      rewardPaid: ref.rewardPaid,
      paidAt: ref.paidAt,
      transactionId: ref.transactionId?.toString(),
      createdAt: ref.createdAt,
    }));

    res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      referrals: formatted,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get all referral statistics
 * GET /api/admin/referrals/stats
 */
export const getReferralStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const [totalReferrals, pendingRewards, paidRewards, totalRewardAmount] =
      await Promise.all([
        Referral.countDocuments({}),
        Referral.countDocuments({
          completedTrips: { $gte: 2 },
          rewardPaid: false,
        }),
        Referral.countDocuments({ rewardPaid: true }),
        Referral.aggregate([
          { $match: { rewardPaid: true } },
          {
            $group: {
              _id: null,
              total: { $sum: "$rewardAmount" },
            },
          },
        ]),
      ]);

    res.json({
      success: true,
      stats: {
        totalReferrals,
        pendingRewards,
        paidRewards,
        totalRewardAmountPaid: totalRewardAmount[0]?.total || 0,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getReferralsByReferrer = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const { referrerId } = req.params;

    if (!referrerId) {
      return res
        .status(400)
        .json({ success: false, error: "referrerId is required" });
    }

    const promoConfig = await getPromoConfig();
    const requiredTrips = promoConfig.referral?.requiredTrips || 2;
    const rewardAmount = promoConfig.referral?.rewardAmount || 1000;

    const referrals = await Referral.find({ referrerId })
      .populate(
        "referrerId",
        "fullName email phoneNumber referralCode role"
      )
      .populate("referredUserId", "fullName email phoneNumber role")
      .sort({ createdAt: -1 })
      .lean();

    if (!referrals.length) {
      const referrer = await User.findById(referrerId).select(
        "fullName email phoneNumber referralCode role"
      );

      if (!referrer) {
        return res
          .status(404)
          .json({ success: false, error: "Referrer not found" });
      }

      return res.json({
        success: true,
        referrer: {
          id: referrer._id.toString(),
          name: referrer.fullName,
          email: referrer.email,
          phone: referrer.phoneNumber,
          referralCode: referrer.referralCode,
          role: referrer.role,
        },
        requiredTrips,
        rewardAmount,
        referrals: [],
      });
    }

    const referrer = referrals[0].referrerId;

    const formattedReferrer = {
      id: referrer._id.toString(),
      name: referrer.fullName,
      email: referrer.email,
      phone: referrer.phoneNumber,
      referralCode: referrer.referralCode,
      role: referrer.role,
    };

    const formattedReferrals = referrals.map((ref) => ({
      id: ref._id.toString(),
      referredUser: {
        id: ref.referredUserId._id.toString(),
        name: ref.referredUserId.fullName,
        email: ref.referredUserId.email,
        phone: ref.referredUserId.phoneNumber,
        role: ref.referredUserId.role,
      },
      completedTrips: ref.completedTrips,
      rewardPaid: ref.rewardPaid,
      rewardAmount: ref.rewardAmount || rewardAmount,
      paidAt: ref.paidAt,
      createdAt: ref.createdAt,
    }));

    res.json({
      success: true,
      referrer: formattedReferrer,
      requiredTrips,
      rewardAmount,
      referrals: formattedReferrals,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

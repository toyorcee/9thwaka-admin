import mongoose from "mongoose";
import Order from "../models/Order.js";
import Referral from "../models/Referral.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import {
  createAndSendNotification,
  createAndSendNotificationToAdmins,
} from "../services/notificationService.js";
import {
  getPromoConfig,
  isReferralPromoEnabled,
} from "../utils/promoConfigUtils.js";

const REFERRAL_REWARD_AMOUNT = 1000;
const REQUIRED_TRIPS = 2;

/**
 * Get user's referral code
 * GET /api/referral/code
 */
export const getReferralCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("referralCode");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({
      success: true,
      referralCode: user.referralCode || null,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Use a referral code during signup
 * POST /api/referral/use
 */
export const useReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.body || {};

    if (!referralCode || typeof referralCode !== "string") {
      return res.status(400).json({
        success: false,
        error: "Referral code is required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Check if user already has a referrer
    if (user.referredBy) {
      return res.status(400).json({
        success: false,
        error: "You have already used a referral code",
      });
    }

    // Find referrer by code
    const referrer = await User.findOne({
      referralCode: referralCode.toUpperCase(),
    });

    if (!referrer) {
      return res.status(404).json({
        success: false,
        error: "Invalid referral code",
      });
    }

    // Can't refer yourself
    if (String(referrer._id) === String(user._id)) {
      return res.status(400).json({
        success: false,
        error: "You cannot use your own referral code",
      });
    }

    // Link user to referrer
    user.referredBy = referrer._id;
    await user.save();

    // Create referral record
    await Referral.create({
      referrerId: referrer._id,
      referredUserId: user._id,
      referralCode: referralCode.toUpperCase(),
      completedTrips: 0,
      rewardPaid: false,
    });

    res.json({
      success: true,
      message: "Referral code applied successfully",
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get referral statistics
 * GET /api/referral/stats
 */
export const getReferralStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get promo config for dynamic values
    const promoConfig = await getPromoConfig();
    const REQUIRED_TRIPS = promoConfig.referral?.requiredTrips || 2;
    const REFERRAL_REWARD_AMOUNT = promoConfig.referral?.rewardAmount || 1000;

    // Get all referrals made by this user
    const referrals = await Referral.find({ referrerId: userId }).populate(
      "referredUserId",
      "fullName email role completedTrips"
    );

    // Count stats
    const totalReferred = referrals.length;
    const completedReferrals = referrals.filter(
      (r) => r.completedTrips >= REQUIRED_TRIPS && r.rewardPaid
    ).length;
    const pendingReferrals = referrals.filter(
      (r) => r.completedTrips >= REQUIRED_TRIPS && !r.rewardPaid
    ).length;
    const inProgressReferrals = referrals.filter(
      (r) => r.completedTrips > 0 && r.completedTrips < REQUIRED_TRIPS
    ).length;

    // Calculate total rewards earned
    const totalRewardsEarned = referrals
      .filter((r) => r.rewardPaid)
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

    // Get user's referral code
    const user = await User.findById(userId).select("referralCode");
    const referralCode = user?.referralCode || null;

    res.json({
      success: true,
      stats: {
        referralCode,
        totalReferred,
        completedReferrals,
        pendingReferrals,
        inProgressReferrals,
        totalRewardsEarned,
        requiredTrips: REQUIRED_TRIPS,
        rewardAmount: REFERRAL_REWARD_AMOUNT,
        referrals: referrals.map((r) => ({
          id: r._id,
          referredUser: {
            id: r.referredUserId._id,
            name: r.referredUserId.fullName,
            email: r.referredUserId.email,
            role: r.referredUserId.role,
          },
          completedTrips: r.completedTrips,
          rewardPaid: r.rewardPaid,
          rewardAmount: r.rewardAmount,
          paidAt: r.paidAt,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Check and award referral bonus when order is completed
 * This should be called when an order status changes to "delivered"
 */
export const checkAndAwardReferralBonus = async (order) => {
  try {
    // Check if referral promo is enabled
    const isEnabled = await isReferralPromoEnabled();
    if (!isEnabled) {
      console.log("[REFERRAL] Referral promo is disabled");
      return;
    }

    // Get promo config for dynamic values
    const promoConfig = await getPromoConfig();
    const REQUIRED_TRIPS = promoConfig.referral?.requiredTrips || 2;
    const REFERRAL_REWARD_AMOUNT = promoConfig.referral?.rewardAmount || 1000;

    // Check both customer and rider separately - either could be referred
    const usersToCheck = [];

    if (order.customerId) {
      usersToCheck.push({ userId: order.customerId, role: "customer" });
    }

    if (order.riderId && String(order.riderId) !== String(order.customerId)) {
      usersToCheck.push({ userId: order.riderId, role: "rider" });
    }

    // Process each user who might be referred
    for (const { userId, role } of usersToCheck) {
      const user = await User.findById(userId);
      if (!user || !user.referredBy) {
        continue;
      }

      // Count completed trips based on user's role
      let completedTrips;
      if (role === "customer") {
        completedTrips = await Order.countDocuments({
          customerId: user._id,
          status: "delivered",
        });
      } else {
        completedTrips = await Order.countDocuments({
          riderId: user._id,
          status: "delivered",
        });
      }

      user.completedTrips = completedTrips;
      await user.save();

      const referral = await Referral.findOne({
        referredUserId: user._id,
        referrerId: user.referredBy,
      });

      if (!referral) {
        continue;
      }

      referral.completedTrips = completedTrips;
      await referral.save();

      if (referral.completedTrips >= REQUIRED_TRIPS && !referral.rewardPaid) {
        const referrer = await User.findById(user.referredBy);
        if (!referrer) {
          continue;
        }

        console.log(
          `🔄 [REFERRAL] Awarding referral bonus: ₦${REFERRAL_REWARD_AMOUNT} to referrer ${referrer._id} for referred user ${user._id}`
        );

        const session = await mongoose.startSession();
        let transaction = null;
        let wallet = null;

        try {
          await session.withTransaction(async () => {
            const walletUtilsModule = await import("../utils/walletUtils.js");
            if (!walletUtilsModule || !walletUtilsModule.creditWallet) {
              throw new Error(
                `creditWallet not found in walletUtils module. Available exports: ${Object.keys(
                  walletUtilsModule || {}
                ).join(", ")}`
              );
            }
            const { creditWallet } = walletUtilsModule;

            // Credit wallet (within transaction)
            wallet = await creditWallet(
              referrer._id,
              REFERRAL_REWARD_AMOUNT,
              {
                type: "referral_reward",
                orderId: order._id,
                referralId: referral._id,
                description: `Referral reward: ${
                  user.fullName || user.email
                } completed ${REQUIRED_TRIPS} trips`,
                metadata: {
                  referredUserId: user._id.toString(),
                  referralId: referral._id.toString(),
                },
              },
              session
            );

            // Create transaction record (within transaction)
            const [tx] = await Transaction.create(
              [
                {
                  orderId: order._id,
                  customerId: order.customerId,
                  riderId: order.riderId,
                  type: "referral_reward",
                  amount: REFERRAL_REWARD_AMOUNT,
                  currency: "NGN",
                  status: "completed",
                  description: `Referral reward (wallet credit): ${
                    user.fullName || user.email
                  } completed ${REQUIRED_TRIPS} trips`,
                  metadata: {
                    referrerId: referrer._id.toString(),
                    referredUserId: user._id.toString(),
                    referralId: referral._id.toString(),
                    walletId: wallet._id.toString(),
                    creditedToWallet: true,
                  },
                  processedAt: new Date(),
                },
              ],
              { session }
            );
            transaction = tx;

            // Mark referral as paid (within transaction)
            referral.rewardAmount = REFERRAL_REWARD_AMOUNT;
            referral.rewardPaid = true;
            referral.paidAt = new Date();
            referral.transactionId = transaction._id;
            await referral.save({ session });

            // Update referrer's stats (within transaction)
            referrer.referralRewardEarned =
              (referrer.referralRewardEarned || 0) + REFERRAL_REWARD_AMOUNT;
            referrer.referralRewardPaid =
              (referrer.referralRewardPaid || 0) + REFERRAL_REWARD_AMOUNT;
            await referrer.save({ session });

            console.log(
              `✅ [REFERRAL] Referral bonus awarded successfully: ₦${REFERRAL_REWARD_AMOUNT} to referrer ${referrer._id}`
            );
          });

          // Transaction committed successfully - send notification (non-critical)
          if (transaction && wallet) {
            try {
              await createAndSendNotification(referrer._id, {
                type: "referral_reward",
                title: "🎉 Referral Reward Earned!",
                message: `You earned ₦${REFERRAL_REWARD_AMOUNT.toLocaleString()} wallet credit! ${
                  user.fullName || user.email
                } completed ${REQUIRED_TRIPS} trips. Use it on your next order or commission payment.`,
                metadata: {
                  referralId: referral._id.toString(),
                  transactionId: transaction._id.toString(),
                  walletBalance: wallet.balance,
                },
              });
            } catch (notifError) {
              console.error(
                "[REFERRAL] Failed to send notification:",
                notifError
              );
            }
            try {
              await createAndSendNotificationToAdmins({
                type: "referral_reward",
                title: "Referral reward granted",
                message: `Referral reward of ₦${REFERRAL_REWARD_AMOUNT.toLocaleString()} granted to ${
                  referrer.fullName || referrer._id.toString()
                } because ${
                  user.fullName || user.email
                } completed ${REQUIRED_TRIPS} trips.`,
                metadata: {
                  referrerId: referrer._id.toString(),
                  referredUserId: user._id.toString(),
                  referralId: referral._id.toString(),
                  transactionId: transaction._id.toString(),
                  walletId: wallet._id.toString(),
                  rewardAmount: REFERRAL_REWARD_AMOUNT,
                  requiredTrips: REQUIRED_TRIPS,
                  completedTrips: referral.completedTrips,
                },
              });
            } catch (adminNotifError) {
              console.error(
                "[REFERRAL] Failed to send admin referral notification:",
                adminNotifError
              );
            }
          }
        } catch (error) {
          console.error(
            `❌ [REFERRAL] Failed to award referral bonus (transaction rolled back):`,
            error
          );
          // Don't throw - we don't want to break order completion if referral check fails
        } finally {
          // Ensure session is always closed
          await session.endSession();
        }
      }
    }
  } catch (error) {
    console.error("[REFERRAL] Failed to check/award referral bonus:", error);
    // Don't fail the order completion if referral check fails
  }
};

import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import {
  createAndSendNotification,
  createAndSendNotificationToAdmins,
} from "../services/notificationService.js";
import {
  getPromoConfig,
  isStreakPromoEnabled,
} from "../utils/promoConfigUtils.js";

const STREAK_BONUS_AMOUNT = 1000;
const STREAK_REQUIRED = 3;

/**
 * Check and award streak bonus when order is accepted
 * This should be called when a rider accepts an order
 * @param {Object} order - The order object
 * @param {Object} riderId - The rider's user ID
 */
export const checkAndAwardStreakBonus = async (order, riderId) => {
  try {
    if (!riderId || !order) {
      return;
    }

    // Check if streak promo is enabled
    const isEnabled = await isStreakPromoEnabled();
    if (!isEnabled) {
      console.log("[STREAK] Streak bonus promo is disabled");
      return;
    }

    const rider = await User.findById(riderId);
    if (!rider || rider.role !== "rider") {
      return;
    }

    // Get promo config for dynamic values
    const promoConfig = await getPromoConfig();
    const STREAK_REQUIRED = promoConfig.streak?.requiredStreak || 3;
    const STREAK_BONUS_AMOUNT = promoConfig.streak?.bonusAmount || 1000;

    // Increment current streak
    const newStreak = (rider.currentStreak || 0) + 1;
    rider.currentStreak = newStreak;

    // Check if streak reaches required count
    if (newStreak >= STREAK_REQUIRED) {
      console.log(
        `🔄 [STREAK] Awarding streak bonus: ₦${STREAK_BONUS_AMOUNT} to rider ${rider._id} for ${newStreak} consecutive orders`
      );

      const session = await mongoose.startSession();

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

          const wallet = await creditWallet(
            rider._id,
            STREAK_BONUS_AMOUNT,
            {
              type: "streak_bonus",
              orderId: order._id,
              description: `Streak bonus: ${newStreak} consecutive orders accepted`,
              metadata: {
                streakCount: newStreak,
                bonusAmount: STREAK_BONUS_AMOUNT,
              },
            },
            session
          );

          // Create transaction record (within transaction)
          await Transaction.create(
            [
              {
                orderId: order._id,
                customerId: order.customerId,
                riderId: rider._id,
                type: "streak_bonus",
                amount: STREAK_BONUS_AMOUNT,
                currency: "NGN",
                status: "completed",
                description: `Streak bonus: ${newStreak} consecutive orders accepted`,
                metadata: {
                  streakCount: newStreak,
                  bonusAmount: STREAK_BONUS_AMOUNT,
                  walletId: wallet._id.toString(),
                  creditedToWallet: true,
                },
                processedAt: new Date(),
              },
            ],
            { session }
          );

          // Update rider's streak stats (within transaction)
          rider.totalStreakBonuses = (rider.totalStreakBonuses || 0) + 1;
          rider.lastStreakBonusAt = new Date();

          // Add to streak history
          if (!rider.streakHistory) {
            rider.streakHistory = [];
          }
          rider.streakHistory.push({
            streakCount: newStreak,
            bonusAmount: STREAK_BONUS_AMOUNT,
            earnedAt: new Date(),
            orderId: order._id,
          });

          // Reset streak after awarding bonus (so they need to build up again)
          rider.currentStreak = 0;

          await rider.save({ session });

          console.log(
            `✅ [STREAK] Streak bonus awarded successfully: ₦${STREAK_BONUS_AMOUNT} to rider ${rider._id}`
          );
        });
      } catch (error) {
        // Transaction automatically rolled back by withTransaction
        // Revert streak increment since transaction failed (in-memory object still has incremented value)
        rider.currentStreak = (rider.currentStreak || 0) - 1;
        console.error(
          `❌ [STREAK] Failed to award streak bonus (transaction rolled back):`,
          error
        );
        // Don't throw - we don't want to break order acceptance if streak bonus fails
      } finally {
        // Ensure session is always closed
        await session.endSession();
      }

      // Send notification to rider
      try {
        await createAndSendNotification(rider._id, {
          type: "streak_bonus",
          title: "🎉 Streak Bonus Earned!",
          message: `Congratulations! You earned ₦${STREAK_BONUS_AMOUNT.toLocaleString()} streak bonus for accepting ${newStreak} consecutive orders!`,
          metadata: {
            orderId: order._id.toString(),
            bonusAmount: STREAK_BONUS_AMOUNT,
            streakCount: newStreak,
          },
        });
      } catch (notifError) {
        console.error("[STREAK] Failed to send notification:", notifError);
      }

      try {
        await createAndSendNotificationToAdmins({
          type: "streak_bonus",
          title: "Streak bonus awarded",
          message: `Streak bonus of ₦${STREAK_BONUS_AMOUNT.toLocaleString()} awarded to rider ${
            rider.fullName || rider._id.toString()
          } for ${newStreak} consecutive orders.`,
          metadata: {
            riderId: rider._id.toString(),
            orderId: order._id.toString(),
            streakCount: newStreak,
            bonusAmount: STREAK_BONUS_AMOUNT,
          },
        });
      } catch (adminNotifError) {
        console.error(
          "[STREAK] Failed to send admin streak bonus notification:",
          adminNotifError
        );
      }

      console.log(
        `✅ [STREAK] Rider ${rider._id} earned streak bonus: ₦${STREAK_BONUS_AMOUNT} for ${newStreak} consecutive accepts`
      );
    } else {
      // Just save the incremented streak
      await rider.save();
    }
  } catch (error) {
    console.error("[STREAK] Failed to check/award streak bonus:", error);
    // Don't throw - we don't want to break order acceptance if streak bonus fails
  }
};

/**
 * Reset streak when order is declined or cancelled
 * This should be called when a rider declines an order or cancels an accepted order
 * @param {Object} riderId - The rider's user ID
 */
export const resetStreak = async (riderId) => {
  try {
    if (!riderId) {
      return;
    }

    const rider = await User.findById(riderId);
    if (!rider || rider.role !== "rider") {
      return;
    }

    // Reset streak to 0
    if (rider.currentStreak > 0) {
      rider.currentStreak = 0;
      await rider.save();
      console.log(`🔄 [STREAK] Reset streak for rider ${rider._id}`);
    }
  } catch (error) {
    console.error("[STREAK] Failed to reset streak:", error);
  }
};

/**
 * Get rider streak statistics
 * GET /api/streak/stats
 */
export const getStreakStats = async (req, res) => {
  try {
    const rider = await User.findById(req.user._id).select(
      "currentStreak totalStreakBonuses lastStreakBonusAt streakHistory role"
    );

    if (!rider || rider.role !== "rider") {
      const promoConfig = await getPromoConfig();
      const STREAK_REQUIRED = promoConfig.streak?.requiredStreak || 3;
      const STREAK_BONUS_AMOUNT = promoConfig.streak?.bonusAmount || 1000;

      return res.json({
        success: true,
        stats: {
          currentStreak: 0,
          totalStreakBonuses: 0,
          lastStreakBonusAt: null,
          streakHistory: [],
          requiredStreak: STREAK_REQUIRED,
          bonusAmount: STREAK_BONUS_AMOUNT,
          progress: "0%",
        },
      });
    }

    // Get promo config for dynamic values
    const promoConfig = await getPromoConfig();
    const STREAK_REQUIRED = promoConfig.streak?.requiredStreak || 3;
    const STREAK_BONUS_AMOUNT = promoConfig.streak?.bonusAmount || 1000;

    res.json({
      success: true,
      stats: {
        currentStreak: rider.currentStreak || 0,
        totalStreakBonuses: rider.totalStreakBonuses || 0,
        lastStreakBonusAt: rider.lastStreakBonusAt || null,
        streakHistory: rider.streakHistory || [],
        requiredStreak: STREAK_REQUIRED,
        bonusAmount: STREAK_BONUS_AMOUNT,
        progress: `${rider.currentStreak || 0}/${STREAK_REQUIRED}`,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get any user's streak statistics (Admin only)
 * GET /api/admin/streak/:userId
 */
export const getAdminStreakStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const promoConfig = await getPromoConfig();
    const STREAK_REQUIRED = promoConfig.streak?.requiredStreak || 3;
    const STREAK_BONUS_AMOUNT = promoConfig.streak?.bonusAmount || 1000;

    const targetUser = await User.findById(userId).select(
      "currentStreak totalStreakBonuses lastStreakBonusAt streakHistory fullName email phoneNumber role"
    );

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Only return streak stats for riders (customers don't have streaks)
    if (targetUser.role !== "rider") {
      return res.json({
        success: true,
        stats: {
          currentStreak: 0,
          totalStreakBonuses: 0,
          lastStreakBonusAt: null,
          streakHistory: [],
          requiredStreak: STREAK_REQUIRED,
          bonusAmount: STREAK_BONUS_AMOUNT,
          progress: `0/${STREAK_REQUIRED}`,
        },
        user: {
          id: targetUser._id.toString(),
          fullName: targetUser.fullName,
          email: targetUser.email,
          phoneNumber: targetUser.phoneNumber || null,
          role: targetUser.role,
        },
      });
    }

    res.json({
      success: true,
      stats: {
        currentStreak: targetUser.currentStreak || 0,
        totalStreakBonuses: targetUser.totalStreakBonuses || 0,
        lastStreakBonusAt: targetUser.lastStreakBonusAt || null,
        streakHistory: targetUser.streakHistory || [],
        requiredStreak: STREAK_REQUIRED,
        bonusAmount: STREAK_BONUS_AMOUNT,
        progress: `${targetUser.currentStreak || 0}/${STREAK_REQUIRED}`,
      },
      user: {
        id: targetUser._id.toString(),
        fullName: targetUser.fullName,
        email: targetUser.email,
        phoneNumber: targetUser.phoneNumber || null,
        role: targetUser.role,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * List riders with streak bonus information (Admin only)
 * GET /api/admin/streak
 */
export const listAdminStreakUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const status = req.query.status || "all"; // all | eligible | rewarded

    const skip = (page - 1) * limit;

    const promoConfig = await getPromoConfig();
    const STREAK_REQUIRED = promoConfig.streak?.requiredStreak || 3;
    const STREAK_BONUS_AMOUNT = promoConfig.streak?.bonusAmount || 1000;

    const match = { role: "rider" };

    if (status === "eligible") {
      match.currentStreak = { $gte: STREAK_REQUIRED };
    } else if (status === "rewarded") {
      match.totalStreakBonuses = { $gt: 0 };
    }

    const [items, totalDocs, eligibleCount, rewardedCount] = await Promise.all([
      User.find(match)
        .select(
          "fullName email phoneNumber currentStreak totalStreakBonuses lastStreakBonusAt"
        )
        .sort({ currentStreak: -1, lastStreakBonusAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(match),
      User.countDocuments({
        role: "rider",
        currentStreak: { $gte: STREAK_REQUIRED },
      }),
      User.countDocuments({
        role: "rider",
        totalStreakBonuses: { $gt: 0 },
      }),
    ]);

    const formattedItems =
      items?.map((u) => ({
        userId: u._id.toString(),
        fullName: u.fullName,
        email: u.email,
        phoneNumber: u.phoneNumber || null,
        currentStreak: u.currentStreak || 0,
        requiredStreak: STREAK_REQUIRED,
        totalStreakBonuses: u.totalStreakBonuses || 0,
        lastStreakBonusAt: u.lastStreakBonusAt || null,
        eligible: (u.currentStreak || 0) >= STREAK_REQUIRED,
        bonusAmount: STREAK_BONUS_AMOUNT,
      })) || [];

    const totalPages = Math.max(1, Math.ceil(totalDocs / limit));

    res.json({
      success: true,
      items: formattedItems,
      pagination: {
        page,
        limit,
        totalPages,
        totalDocs,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: {
        eligibleCount,
        rewardedCount,
        requiredStreak: STREAK_REQUIRED,
        bonusAmount: STREAK_BONUS_AMOUNT,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

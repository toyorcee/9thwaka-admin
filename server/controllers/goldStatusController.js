import Order from "../models/Order.js";
import User from "../models/User.js";
import {
  createAndSendNotification,
  createAndSendNotificationToAdmins,
} from "../services/notificationService.js";
import {
  getPromoConfig,
  isGoldStatusPromoEnabled,
} from "../utils/promoConfigUtils.js";

// Default fallback values (used when promo config is not available)
const DEFAULT_REQUIRED_RIDES = 7;
const DEFAULT_WINDOW_DAYS = 10;
const DEFAULT_DURATION_DAYS = 30;
const DEFAULT_DISCOUNT_PERCENT = 5;

/**
 * Check and unlock Gold Status when ride is completed
 * This should be called when a ride order (serviceType === "ride") is delivered
 * @param {Object} order - The order object
 * @param {Object} riderId - The rider's user ID
 */
export const checkAndUnlockGoldStatus = async (order, riderId) => {
  try {
    if (!riderId || !order) {
      return;
    }

    // Check if Gold Status promo is enabled
    const isEnabled = await isGoldStatusPromoEnabled();
    if (!isEnabled) {
      console.log("[GOLD_STATUS] Gold Status promo is disabled");
      return;
    }

    if (order.serviceType !== "ride") {
      return;
    }

    const rider = await User.findById(riderId);
    if (!rider || rider.role !== "rider") {
      return;
    }

    // Get promo config for dynamic values
    const promoConfig = await getPromoConfig();
    const GOLD_STATUS_REQUIRED_RIDES =
      promoConfig.goldStatus?.requiredRides || DEFAULT_REQUIRED_RIDES;
    const GOLD_STATUS_WINDOW_DAYS =
      promoConfig.goldStatus?.windowDays || DEFAULT_WINDOW_DAYS;
    const GOLD_STATUS_DURATION_DAYS =
      promoConfig.goldStatus?.durationDays || DEFAULT_DURATION_DAYS;
    const GOLD_STATUS_DISCOUNT_PERCENT =
      promoConfig.goldStatus?.discountPercent || DEFAULT_DISCOUNT_PERCENT;

    if (
      rider.goldStatus?.isActive &&
      rider.goldStatus?.expiresAt &&
      new Date() < new Date(rider.goldStatus.expiresAt)
    ) {
      return;
    }

    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - GOLD_STATUS_WINDOW_DAYS);

    const completedRides = await Order.countDocuments({
      riderId: rider._id,
      serviceType: "ride",
      status: "delivered",
      "delivery.deliveredAt": {
        $gte: windowStart,
        $lte: now,
      },
    });

    if (completedRides >= GOLD_STATUS_REQUIRED_RIDES) {
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + GOLD_STATUS_DURATION_DAYS);

      const wasFirstUnlock =
        !rider.goldStatus?.totalUnlocks || rider.goldStatus.totalUnlocks === 0;
      const previousTotalUnlocks = rider.goldStatus?.totalUnlocks || 0;

      rider.goldStatus = {
        isActive: true,
        unlockedAt: now,
        expiresAt: expiresAt,
        discountPercent: GOLD_STATUS_DISCOUNT_PERCENT,
        totalUnlocks: previousTotalUnlocks + 1,
      };

      if (!rider.goldStatusHistory) {
        rider.goldStatusHistory = [];
      }
      rider.goldStatusHistory.push({
        unlockedAt: now,
        expiresAt: expiresAt,
        ridesCompleted: completedRides,
        orderId: order._id,
      });

      // Atomic save - if this fails, nothing is updated
      try {
        await rider.save();
        console.log(
          `✅ [GOLD_STATUS] Rider ${
            rider._id
          } unlocked Gold Status successfully: ${completedRides} rides completed, expires ${expiresAt.toISOString()}`
        );

        // Send notification (non-critical, won't rollback if it fails)
        if (wasFirstUnlock) {
          try {
            await createAndSendNotification(rider._id, {
              type: "gold_status",
              title: "🌟 Gold Status Unlocked!",
              message: `Congratulations! You've completed ${completedRides} rides in 10 days. You now have Gold Rider status with ${GOLD_STATUS_DISCOUNT_PERCENT}% commission discount for the next 30 days!`,
              metadata: {
                orderId: order._id.toString(),
                discountPercent: GOLD_STATUS_DISCOUNT_PERCENT,
                expiresAt: expiresAt.toISOString(),
              },
            });
            console.log(
              `✅ [GOLD_STATUS] Notification sent to rider ${rider._id}`
            );
          } catch (notifError) {
            console.error(
              "[GOLD_STATUS] Failed to send notification (non-critical):",
              notifError
            );
          }
        }

        try {
          await createAndSendNotificationToAdmins({
            type: "gold_status",
            title: "Gold Status unlocked",
            message: `Rider ${
              rider.fullName || rider._id.toString()
            } unlocked Gold Status with ${completedRides} rides in ${GOLD_STATUS_WINDOW_DAYS} days.`,
            metadata: {
              riderId: rider._id.toString(),
              orderId: order._id.toString(),
              discountPercent: GOLD_STATUS_DISCOUNT_PERCENT,
              unlockedAt: now.toISOString(),
              expiresAt: expiresAt.toISOString(),
              totalUnlocks: previousTotalUnlocks + 1,
              wasFirstUnlock,
            },
          });
        } catch (adminNotifError) {
          console.error(
            "[GOLD_STATUS] Failed to send admin unlock notification:",
            adminNotifError
          );
        }
      } catch (saveError) {
        console.error(
          `❌ [GOLD_STATUS] Failed to save Gold Status unlock for rider ${rider._id}:`,
          saveError
        );
        // Revert the changes to rider object (though save failed, so DB wasn't updated)
        rider.goldStatus = {
          isActive: rider.goldStatus?.isActive || false,
          unlockedAt: rider.goldStatus?.unlockedAt || null,
          expiresAt: rider.goldStatus?.expiresAt || null,
          discountPercent:
            rider.goldStatus?.discountPercent || GOLD_STATUS_DISCOUNT_PERCENT,
          totalUnlocks: previousTotalUnlocks,
        };
        if (rider.goldStatusHistory && rider.goldStatusHistory.length > 0) {
          rider.goldStatusHistory.pop(); // Remove the entry we just added
        }
        throw saveError; // Re-throw to be caught by outer try-catch
      }
    }
  } catch (error) {
    console.error("[GOLD_STATUS] Failed to check/unlock Gold Status:", error);
    // Don't throw - we don't want to break order completion if Gold Status check fails
  }
};

/**
 * Check if Gold Status has expired and deactivate it
 * This should be called periodically or when checking Gold Status
 * @param {Object} riderId - The rider's user ID
 */
export const checkGoldStatusExpiry = async (riderId) => {
  try {
    if (!riderId) {
      return;
    }

    const rider = await User.findById(riderId);
    if (!rider || rider.role !== "rider") {
      return;
    }

    if (
      rider.goldStatus?.isActive &&
      rider.goldStatus?.expiresAt &&
      new Date() >= new Date(rider.goldStatus.expiresAt)
    ) {
      rider.goldStatus.isActive = false;
      await rider.save();
      console.log(
        `🔄 [GOLD_STATUS] Gold Status expired for rider ${
          rider._id
        } at ${new Date().toISOString()}`
      );

      if (!rider.goldStatus?.expiryNotified) {
        try {
          await createAndSendNotification(rider._id, {
            type: "gold_status_expired",
            title: "Gold Status Expired",
            message:
              "Your Gold Rider status has expired. Thank you for being a valued rider!",
            metadata: {
              expiresAt: rider.goldStatus.expiresAt.toISOString(),
            },
          });
          rider.goldStatus.expiryNotified = true;
          await rider.save();
        } catch (notifError) {
          console.error(
            "[GOLD_STATUS] Failed to send expiry notification:",
            notifError
          );
        }

        try {
          await createAndSendNotificationToAdmins({
            type: "gold_status_expired",
            title: "Gold Status expired for rider",
            message: `Gold Status expired for rider ${
              rider.fullName || rider._id.toString()
            }.`,
            metadata: {
              riderId: rider._id.toString(),
              expiresAt: rider.goldStatus.expiresAt.toISOString(),
              totalUnlocks: rider.goldStatus.totalUnlocks || 0,
            },
          });
        } catch (adminNotifError) {
          console.error(
            "[GOLD_STATUS] Failed to send admin expiry notification:",
            adminNotifError
          );
        }
      }
    }
  } catch (error) {
    console.error("[GOLD_STATUS] Failed to check expiry:", error);
  }
};

/**
 * Get any user's Gold Status statistics (Admin only)
 * GET /api/admin/gold-status/:userId
 */
export const getAdminGoldStatusStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const promoConfig = await getPromoConfig();
    const GOLD_STATUS_REQUIRED_RIDES =
      promoConfig.goldStatus?.requiredRides || DEFAULT_REQUIRED_RIDES;
    const GOLD_STATUS_WINDOW_DAYS =
      promoConfig.goldStatus?.windowDays || DEFAULT_WINDOW_DAYS;

    const targetUser = await User.findById(userId).select(
      "goldStatus goldStatusHistory fullName email role"
    );

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (targetUser.role !== "rider") {
      const GOLD_STATUS_DISCOUNT_PERCENT =
        promoConfig.goldStatus?.discountPercent || DEFAULT_DISCOUNT_PERCENT;

      return res.json({
        success: true,
        stats: {
          isActive: false,
          unlockedAt: null,
          expiresAt: null,
          discountPercent: GOLD_STATUS_DISCOUNT_PERCENT,
          totalUnlocks: 0,
          history: [],
          progress: {
            completed: 0,
            required: GOLD_STATUS_REQUIRED_RIDES,
            percentage: 0,
            windowDays: GOLD_STATUS_WINDOW_DAYS,
          },
        },
        user: {
          id: targetUser._id.toString(),
          fullName: targetUser.fullName,
          email: targetUser.email,
          role: targetUser.role,
        },
      });
    }

    // Check expiry before returning stats
    await checkGoldStatusExpiry(targetUser._id);

    // Refresh user data after expiry check
    const updatedUser = await User.findById(userId).select(
      "goldStatus goldStatusHistory"
    );

    // Calculate progress
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - GOLD_STATUS_WINDOW_DAYS);

    const completedRides = await Order.countDocuments({
      riderId: targetUser._id,
      serviceType: "ride",
      status: "delivered",
      "delivery.deliveredAt": {
        $gte: windowStart,
        $lte: now,
      },
    });

    const progress = Math.min(
      (completedRides / GOLD_STATUS_REQUIRED_RIDES) * 100,
      100
    );

    res.json({
      success: true,
      stats: {
        isActive: updatedUser.goldStatus?.isActive || false,
        unlockedAt: updatedUser.goldStatus?.unlockedAt || null,
        expiresAt: updatedUser.goldStatus?.expiresAt || null,
        discountPercent: updatedUser.goldStatus?.discountPercent || 0,
        totalUnlocks: updatedUser.goldStatus?.totalUnlocks || 0,
        history: updatedUser.goldStatusHistory || [],
        progress: {
          completed: completedRides,
          required: GOLD_STATUS_REQUIRED_RIDES,
          percentage: Math.round(progress),
          windowDays: GOLD_STATUS_WINDOW_DAYS,
        },
      },
      user: {
        id: targetUser._id.toString(),
        fullName: targetUser.fullName,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * List riders with Gold Status information (Admin only)
 * GET /api/admin/gold-status
 */
export const listAdminGoldStatusUsers = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const status = req.query.status || "all";

    const skip = (page - 1) * limit;

    const promoConfig = await getPromoConfig();
    const GOLD_STATUS_REQUIRED_RIDES =
      promoConfig.goldStatus?.requiredRides || DEFAULT_REQUIRED_RIDES;
    const GOLD_STATUS_WINDOW_DAYS =
      promoConfig.goldStatus?.windowDays || DEFAULT_WINDOW_DAYS;

    const match = { role: "rider" };

    if (status === "active") {
      match["goldStatus.isActive"] = true;
    } else if (status === "inactive") {
      match["goldStatus.isActive"] = { $ne: true };
    }

    const [items, totalDocs, activeCount] = await Promise.all([
      User.find(match)
        .select(
          "fullName email phoneNumber goldStatus goldStatusHistory role"
        )
        .sort({
          "goldStatus.isActive": -1,
          "goldStatus.expiresAt": 1,
          fullName: 1,
        })
        .skip(skip)
        .limit(limit),
      User.countDocuments(match),
      User.countDocuments({
        role: "rider",
        "goldStatus.isActive": true,
      }),
    ]);

    const now = new Date();

    const itemsWithProgress = await Promise.all(
      items.map(async (u) => {
        const expiresAt = u.goldStatus?.expiresAt
          ? new Date(u.goldStatus.expiresAt)
          : null;

        let isActive =
          !!u.goldStatus?.isActive &&
          !!expiresAt &&
          now < new Date(expiresAt);

        const remainingSeconds =
          isActive && expiresAt
            ? Math.max(
                0,
                Math.floor((new Date(expiresAt).getTime() - now.getTime()) / 1000)
              )
            : 0;

        const windowStart = new Date(now);
        windowStart.setDate(windowStart.getDate() - GOLD_STATUS_WINDOW_DAYS);

        const completedRides = await Order.countDocuments({
          riderId: u._id,
          serviceType: "ride",
          status: "delivered",
          "delivery.deliveredAt": {
            $gte: windowStart,
            $lte: now,
          },
        });

        const percentage = Math.min(
          (completedRides / GOLD_STATUS_REQUIRED_RIDES) * 100,
          100
        );

        return {
          userId: u._id.toString(),
          fullName: u.fullName,
          email: u.email,
          phoneNumber: u.phoneNumber || null,
          isActive,
          unlockedAt: u.goldStatus?.unlockedAt || null,
          expiresAt: u.goldStatus?.expiresAt || null,
          discountPercent: u.goldStatus?.discountPercent || 0,
          totalUnlocks: u.goldStatus?.totalUnlocks || 0,
          remainingSeconds,
          progress: {
            completed: completedRides,
            required: GOLD_STATUS_REQUIRED_RIDES,
            percentage: Math.round(percentage),
            windowDays: GOLD_STATUS_WINDOW_DAYS,
          },
        };
      })
    );

    const totalPages = Math.max(1, Math.ceil(totalDocs / limit));

    res.json({
      success: true,
      items: itemsWithProgress,
      pagination: {
        page,
        limit,
        totalPages,
        totalDocs,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: {
        activeCount,
        requiredRides: GOLD_STATUS_REQUIRED_RIDES,
        windowDays: GOLD_STATUS_WINDOW_DAYS,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get rider Gold Status information
 * GET /api/gold-status/stats
 */
export const getGoldStatusStats = async (req, res) => {
  try {
    const rider = await User.findById(req.user._id).select(
      "goldStatus goldStatusHistory role"
    );

    if (!rider || rider.role !== "rider") {
      const promoConfig = await getPromoConfig();
      const GOLD_STATUS_REQUIRED_RIDES =
        promoConfig.goldStatus?.requiredRides || DEFAULT_REQUIRED_RIDES;
      const GOLD_STATUS_WINDOW_DAYS =
        promoConfig.goldStatus?.windowDays || DEFAULT_WINDOW_DAYS;
      const GOLD_STATUS_DISCOUNT_PERCENT =
        promoConfig.goldStatus?.discountPercent || DEFAULT_DISCOUNT_PERCENT;

      return res.json({
        success: true,
        stats: {
          isActive: false,
          unlockedAt: null,
          expiresAt: null,
          discountPercent: GOLD_STATUS_DISCOUNT_PERCENT,
          totalUnlocks: 0,
          history: [],
          progress: {
            completed: 0,
            required: GOLD_STATUS_REQUIRED_RIDES,
            percentage: 0,
            windowDays: GOLD_STATUS_WINDOW_DAYS,
          },
        },
      });
    }

    // Get promo config for dynamic values
    const promoConfig = await getPromoConfig();
    const GOLD_STATUS_REQUIRED_RIDES =
      promoConfig.goldStatus?.requiredRides || DEFAULT_REQUIRED_RIDES;
    const GOLD_STATUS_WINDOW_DAYS =
      promoConfig.goldStatus?.windowDays || DEFAULT_WINDOW_DAYS;

    // Check expiry before returning stats
    await checkGoldStatusExpiry(rider._id);

    // Refresh rider data after expiry check
    const updatedRider = await User.findById(req.user._id).select(
      "goldStatus goldStatusHistory"
    );

    // Calculate progress towards next Gold Status unlock
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - GOLD_STATUS_WINDOW_DAYS);

    const completedRides = await Order.countDocuments({
      riderId: rider._id,
      serviceType: "ride",
      status: "delivered",
      "delivery.deliveredAt": {
        $gte: windowStart,
        $lte: now,
      },
    });

    const progress = Math.min(
      (completedRides / GOLD_STATUS_REQUIRED_RIDES) * 100,
      100
    );

    res.json({
      success: true,
      stats: {
        isActive: updatedRider.goldStatus?.isActive || false,
        unlockedAt: updatedRider.goldStatus?.unlockedAt || null,
        expiresAt: updatedRider.goldStatus?.expiresAt || null,
        discountPercent: updatedRider.goldStatus?.discountPercent || 0,
        totalUnlocks: updatedRider.goldStatus?.totalUnlocks || 0,
        history: updatedRider.goldStatusHistory || [],
        progress: {
          completed: completedRides,
          required: GOLD_STATUS_REQUIRED_RIDES,
          percentage: Math.round(progress),
          windowDays: GOLD_STATUS_WINDOW_DAYS,
        },
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Apply Gold Status discount to commission (rider benefit)
 * This reduces the commission amount so riders with Gold Status keep more earnings
 * @param {Number} commissionAmount - The original commission amount
 * @param {Object} riderId - The rider's user ID
 * @returns {Number} - The discounted commission amount (rider pays less commission)
 */
export const applyGoldStatusDiscount = async (commissionAmount, riderId) => {
  try {
    if (!riderId || !commissionAmount) {
      return commissionAmount;
    }

    // Check if Gold Status promo is enabled
    const isEnabled = await isGoldStatusPromoEnabled();
    if (!isEnabled) {
      return commissionAmount;
    }

    const rider = await User.findById(riderId).select("goldStatus");
    if (!rider || rider.role !== "rider") {
      return commissionAmount;
    }

    // Get promo config for dynamic discount percent
    const promoConfig = await getPromoConfig();
    const GOLD_STATUS_DISCOUNT_PERCENT =
      promoConfig.goldStatus?.discountPercent || DEFAULT_DISCOUNT_PERCENT;

    const now = new Date();

    // Check if Gold Status has expired (atomic check and update)
    if (
      rider.goldStatus?.isActive &&
      rider.goldStatus?.expiresAt &&
      now >= new Date(rider.goldStatus.expiresAt)
    ) {
      console.log(
        `🔄 [GOLD_STATUS] Gold Status expired for rider ${riderId}, deactivating`
      );
      try {
        rider.goldStatus.isActive = false;
        await rider.save();
        console.log(
          `✅ [GOLD_STATUS] Gold Status deactivated for rider ${riderId}`
        );
      } catch (saveError) {
        console.error(
          `❌ [GOLD_STATUS] Failed to deactivate expired Gold Status for rider ${riderId}:`,
          saveError
        );
        // Don't throw - return original commission amount (no discount applied)
      }
      return commissionAmount;
    }

    // Apply discount if Gold Status is active
    if (
      rider.goldStatus?.isActive &&
      rider.goldStatus?.expiresAt &&
      now < new Date(rider.goldStatus.expiresAt)
    ) {
      const discountPercent =
        rider.goldStatus.discountPercent || GOLD_STATUS_DISCOUNT_PERCENT;
      const discountAmount = (commissionAmount * discountPercent) / 100;
      const discountedCommission = Math.max(
        0,
        commissionAmount - discountAmount
      );
      const finalCommission = Math.round(discountedCommission * 100) / 100;

      console.log(
        `💰 [GOLD_STATUS] Applied ${discountPercent}% discount to rider ${riderId}: ₦${commissionAmount} → ₦${finalCommission} (saved ₦${discountAmount.toFixed(
          2
        )})`
      );

      return finalCommission;
    }

    return commissionAmount;
  } catch (error) {
    console.error("[GOLD_STATUS] Failed to apply discount:", error);
    // Return original commission amount on error (fail-safe)
    return commissionAmount;
  }
};

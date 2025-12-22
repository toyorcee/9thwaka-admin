import PromoConfig from "../models/PromoConfig.js";
import { clearPromoConfigCache } from "../utils/promoConfigUtils.js";

/**
 * Get current promo configuration
 * GET /api/admin/promos
 */
export const getPromoConfig = async (req, res) => {
  try {
    const config = await PromoConfig.getConfig();
    res.json({
      success: true,
      config: {
        referral: config.referral,
        streak: config.streak,
        goldStatus: config.goldStatus,
      },
    });
  } catch (error) {
    console.error("[PROMO_CONFIG] Failed to get config:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Update referral promo settings
 * PUT /api/admin/promos/referral
 */
export const updateReferralPromo = async (req, res) => {
  try {
    const { enabled, rewardAmount, requiredTrips } = req.body;

    // Validation
    if (enabled !== undefined && typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "enabled must be a boolean",
      });
    }
    if (rewardAmount !== undefined) {
      if (
        typeof rewardAmount !== "number" ||
        rewardAmount < 0 ||
        rewardAmount > 100000
      ) {
        return res.status(400).json({
          success: false,
          error: "rewardAmount must be a number between 0 and 100,000",
        });
      }
    }
    if (requiredTrips !== undefined) {
      if (
        typeof requiredTrips !== "number" ||
        requiredTrips < 1 ||
        requiredTrips > 100
      ) {
        return res.status(400).json({
          success: false,
          error: "requiredTrips must be a number between 1 and 100",
        });
      }
    }

    const config = await PromoConfig.getConfig();

    if (typeof enabled === "boolean") {
      config.referral.enabled = enabled;
    }
    if (
      typeof rewardAmount === "number" &&
      rewardAmount >= 0 &&
      rewardAmount <= 100000
    ) {
      config.referral.rewardAmount = rewardAmount;
    }
    if (
      typeof requiredTrips === "number" &&
      requiredTrips >= 1 &&
      requiredTrips <= 100
    ) {
      config.referral.requiredTrips = requiredTrips;
    }

    config.referral.updatedAt = new Date();
    config.referral.updatedBy = req.user._id;

    await config.save();
    clearPromoConfigCache(); // Clear cache after update

    res.json({
      success: true,
      message: "Referral promo updated successfully",
      config: config.referral,
    });
  } catch (error) {
    console.error("[PROMO_CONFIG] Failed to update referral promo:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Update streak bonus promo settings
 * PUT /api/admin/promos/streak
 */
export const updateStreakPromo = async (req, res) => {
  try {
    const { enabled, bonusAmount, requiredStreak } = req.body;

    // Validation
    if (enabled !== undefined && typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "enabled must be a boolean",
      });
    }
    if (bonusAmount !== undefined) {
      if (
        typeof bonusAmount !== "number" ||
        bonusAmount < 0 ||
        bonusAmount > 100000
      ) {
        return res.status(400).json({
          success: false,
          error: "bonusAmount must be a number between 0 and 100,000",
        });
      }
    }
    if (requiredStreak !== undefined) {
      if (
        typeof requiredStreak !== "number" ||
        requiredStreak < 1 ||
        requiredStreak > 100
      ) {
        return res.status(400).json({
          success: false,
          error: "requiredStreak must be a number between 1 and 100",
        });
      }
    }

    const config = await PromoConfig.getConfig();

    if (typeof enabled === "boolean") {
      config.streak.enabled = enabled;
    }
    if (
      typeof bonusAmount === "number" &&
      bonusAmount >= 0 &&
      bonusAmount <= 100000
    ) {
      config.streak.bonusAmount = bonusAmount;
    }
    if (
      typeof requiredStreak === "number" &&
      requiredStreak >= 1 &&
      requiredStreak <= 100
    ) {
      config.streak.requiredStreak = requiredStreak;
    }

    config.streak.updatedAt = new Date();
    config.streak.updatedBy = req.user._id;

    await config.save();
    clearPromoConfigCache(); // Clear cache after update

    res.json({
      success: true,
      message: "Streak bonus promo updated successfully",
      config: config.streak,
    });
  } catch (error) {
    console.error("[PROMO_CONFIG] Failed to update streak promo:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Update Gold Status promo settings
 * PUT /api/admin/promos/gold-status
 */
export const updateGoldStatusPromo = async (req, res) => {
  try {
    const {
      enabled,
      requiredRides,
      windowDays,
      durationDays,
      discountPercent,
    } = req.body;

    // Validation
    if (enabled !== undefined && typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "enabled must be a boolean",
      });
    }
    if (requiredRides !== undefined) {
      if (
        typeof requiredRides !== "number" ||
        requiredRides < 1 ||
        requiredRides > 100
      ) {
        return res.status(400).json({
          success: false,
          error: "requiredRides must be a number between 1 and 100",
        });
      }
    }
    if (windowDays !== undefined) {
      if (
        typeof windowDays !== "number" ||
        windowDays < 1 ||
        windowDays > 365
      ) {
        return res.status(400).json({
          success: false,
          error: "windowDays must be a number between 1 and 365",
        });
      }
    }
    if (durationDays !== undefined) {
      if (
        typeof durationDays !== "number" ||
        durationDays < 1 ||
        durationDays > 365
      ) {
        return res.status(400).json({
          success: false,
          error: "durationDays must be a number between 1 and 365",
        });
      }
    }
    if (discountPercent !== undefined) {
      if (
        typeof discountPercent !== "number" ||
        discountPercent < 0 ||
        discountPercent > 100
      ) {
        return res.status(400).json({
          success: false,
          error: "discountPercent must be a number between 0 and 100",
        });
      }
    }

    const config = await PromoConfig.getConfig();

    if (typeof enabled === "boolean") {
      config.goldStatus.enabled = enabled;
    }
    if (
      typeof requiredRides === "number" &&
      requiredRides >= 1 &&
      requiredRides <= 100
    ) {
      config.goldStatus.requiredRides = requiredRides;
    }
    if (
      typeof windowDays === "number" &&
      windowDays >= 1 &&
      windowDays <= 365
    ) {
      config.goldStatus.windowDays = windowDays;
    }
    if (
      typeof durationDays === "number" &&
      durationDays >= 1 &&
      durationDays <= 365
    ) {
      config.goldStatus.durationDays = durationDays;
    }
    if (
      typeof discountPercent === "number" &&
      discountPercent >= 0 &&
      discountPercent <= 100
    ) {
      config.goldStatus.discountPercent = discountPercent;
    }

    config.goldStatus.updatedAt = new Date();
    config.goldStatus.updatedBy = req.user._id;

    await config.save();
    clearPromoConfigCache(); // Clear cache after update

    res.json({
      success: true,
      message: "Gold Status promo updated successfully",
      config: config.goldStatus,
    });
  } catch (error) {
    console.error("[PROMO_CONFIG] Failed to update Gold Status promo:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Toggle all promos on/off
 * PUT /api/admin/promos/toggle-all
 */
export const toggleAllPromos = async (req, res) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "enabled must be a boolean",
      });
    }

    const config = await PromoConfig.getConfig();

    config.referral.enabled = enabled;
    config.referral.updatedAt = new Date();
    config.referral.updatedBy = req.user._id;

    config.streak.enabled = enabled;
    config.streak.updatedAt = new Date();
    config.streak.updatedBy = req.user._id;

    config.goldStatus.enabled = enabled;
    config.goldStatus.updatedAt = new Date();
    config.goldStatus.updatedBy = req.user._id;

    await config.save();
    clearPromoConfigCache(); // Clear cache after update

    res.json({
      success: true,
      message: `All promos ${enabled ? "enabled" : "disabled"} successfully`,
      config: {
        referral: config.referral.enabled,
        streak: config.streak.enabled,
        goldStatus: config.goldStatus.enabled,
      },
    });
  } catch (error) {
    console.error("[PROMO_CONFIG] Failed to toggle all promos:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

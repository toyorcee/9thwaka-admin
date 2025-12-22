import PromoConfig from "../models/PromoConfig.js";

/**
 * Get promo configuration with caching
 * This is used by controllers to check if promos are enabled
 */
let configCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60000;

export const getPromoConfig = async () => {
  try {
    const now = Date.now();
    if (
      configCache &&
      cacheTimestamp &&
      now - cacheTimestamp < CACHE_DURATION
    ) {
      return configCache;
    }

    const config = await PromoConfig.getConfig();
    configCache = {
      referral: config.referral,
      streak: config.streak,
      goldStatus: config.goldStatus,
    };
    cacheTimestamp = now;

    return configCache;
  } catch (error) {
    console.error("[PROMO_CONFIG] Failed to get config:", error);
    return {
      referral: { enabled: true },
      streak: { enabled: true },
      goldStatus: { enabled: true },
    };
  }
};

/**
 * Clear config cache (call after updating config)
 */
export const clearPromoConfigCache = () => {
  configCache = null;
  cacheTimestamp = null;
};

/**
 * Check if referral promo is enabled
 */
export const isReferralPromoEnabled = async () => {
  const config = await getPromoConfig();
  return config.referral?.enabled !== false;
};

/**
 * Check if streak promo is enabled
 */
export const isStreakPromoEnabled = async () => {
  const config = await getPromoConfig();
  return config.streak?.enabled !== false;
};

/**
 * Check if Gold Status promo is enabled
 */
export const isGoldStatusPromoEnabled = async () => {
  const config = await getPromoConfig();
  return config.goldStatus?.enabled !== false;
};

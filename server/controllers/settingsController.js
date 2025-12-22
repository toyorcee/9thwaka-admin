import Settings from "../models/Settings.js";

/**
 * Get current system settings (including rates)
 * GET /api/admin/settings
 */
export const getSettings = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const settings = await Settings.getSettings();

    res.json({
      success: true,
      settings,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get commission rate (public endpoint)
 * GET /api/settings/commission-rate
 */
export const getCommissionRate = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const commissionRate =
      settings.commissionRate ||
      Number(process.env.COMMISSION_RATE_PERCENT || 10);

    res.json({
      success: true,
      commissionRate,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get payment account details (public endpoint for riders)
 * GET /api/settings/payment-account
 * Falls back to env variables if not set in database
 * Returns both primary and secondary accounts
 */
export const getPaymentAccount = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    // Get from database or fallback to env
    const paymentAccounts = {
      primary: {
        bankName:
          settings.paymentAccounts?.primary?.bankName ||
          process.env.PAYMENT_BANK_NAME_PRIMARY ||
          null,
        accountNumber:
          settings.paymentAccounts?.primary?.accountNumber ||
          process.env.PAYMENT_ACCOUNT_NUMBER_PRIMARY ||
          null,
        accountName:
          settings.paymentAccounts?.primary?.accountName ||
          process.env.PAYMENT_ACCOUNT_NAME_PRIMARY ||
          null,
      },
      secondary: {
        bankName:
          settings.paymentAccounts?.secondary?.bankName ||
          process.env.PAYMENT_BANK_NAME_SECONDARY ||
          null,
        accountNumber:
          settings.paymentAccounts?.secondary?.accountNumber ||
          process.env.PAYMENT_ACCOUNT_NUMBER_SECONDARY ||
          null,
        accountName:
          settings.paymentAccounts?.secondary?.accountName ||
          process.env.PAYMENT_ACCOUNT_NAME_SECONDARY ||
          null,
      },
    };

    res.json({ success: true, paymentAccounts });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get vehicle requirements (public endpoint for riders)
 * GET /api/settings/vehicle-requirements
 */
export const getVehicleRequirements = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    const requirements = {
      car_standard: {
        minYear:
          settings.vehicleRequirements?.car_standard?.minYear ||
          Number(process.env.CAR_STANDARD_MIN_YEAR || 2010),
        requireAirConditioning:
          settings.vehicleRequirements?.car_standard?.requireAirConditioning ||
          false,
      },
      car_comfort: {
        minYear:
          settings.vehicleRequirements?.car_comfort?.minYear ||
          Number(process.env.CAR_COMFORT_MIN_YEAR || 2010),
        requireAirConditioning:
          settings.vehicleRequirements?.car_comfort?.requireAirConditioning ||
          false,
      },
      car_premium: {
        minYear:
          settings.vehicleRequirements?.car_premium?.minYear ||
          Number(process.env.CAR_PREMIUM_MIN_YEAR || 2015),
        requireAirConditioning:
          settings.vehicleRequirements?.car_premium?.requireAirConditioning ||
          true,
      },
    };

    res.json({
      success: true,
      vehicleRequirements: requirements,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Update system settings (admin only)
 * PUT /api/admin/settings
 */
export const updateSettings = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const settings = await Settings.getSettings();

    // Update pricing rates
    if (req.body.pricing) {
      if (req.body.pricing.minFare !== undefined) {
        settings.pricing.minFare = Number(req.body.pricing.minFare);
      }
      if (req.body.pricing.perKmShort !== undefined) {
        settings.pricing.perKmShort = Number(req.body.pricing.perKmShort);
      }
      if (req.body.pricing.perKmMedium !== undefined) {
        settings.pricing.perKmMedium = Number(req.body.pricing.perKmMedium);
      }
      if (req.body.pricing.perKmLong !== undefined) {
        settings.pricing.perKmLong = Number(req.body.pricing.perKmLong);
      }
      if (req.body.pricing.shortDistanceMax !== undefined) {
        settings.pricing.shortDistanceMax = Number(
          req.body.pricing.shortDistanceMax
        );
      }
      if (req.body.pricing.mediumDistanceMax !== undefined) {
        settings.pricing.mediumDistanceMax = Number(
          req.body.pricing.mediumDistanceMax
        );
      }
      if (req.body.pricing.vehicleMultipliers) {
        Object.keys(req.body.pricing.vehicleMultipliers).forEach((vehicle) => {
          if (
            settings.pricing.vehicleMultipliers[vehicle] !== undefined &&
            req.body.pricing.vehicleMultipliers[vehicle] !== undefined
          ) {
            settings.pricing.vehicleMultipliers[vehicle] = Number(
              req.body.pricing.vehicleMultipliers[vehicle]
            );
          }
        });
      }
    }

    // Update commission rate
    if (req.body.commissionRate !== undefined) {
      settings.commissionRate = Number(req.body.commissionRate);
    }

    // Update payment account details
    if (req.body.paymentAccount) {
      if (req.body.paymentAccount.bankName !== undefined) {
        settings.paymentAccount.bankName =
          req.body.paymentAccount.bankName || null;
      }
      if (req.body.paymentAccount.accountNumber !== undefined) {
        settings.paymentAccount.accountNumber =
          req.body.paymentAccount.accountNumber || null;
      }
      if (req.body.paymentAccount.accountName !== undefined) {
        settings.paymentAccount.accountName =
          req.body.paymentAccount.accountName || null;
      }
      if (req.body.paymentAccount.bankCode !== undefined) {
        settings.paymentAccount.bankCode =
          req.body.paymentAccount.bankCode || null;
      }
      if (req.body.paymentAccount.instructions !== undefined) {
        settings.paymentAccount.instructions =
          req.body.paymentAccount.instructions || null;
      }
    }

    // Update system settings
    if (req.body.system) {
      if (req.body.system.useDatabaseRates !== undefined) {
        settings.system.useDatabaseRates =
          req.body.system.useDatabaseRates === true;
      }
      if (req.body.system.defaultSearchRadiusKm !== undefined) {
        settings.system.defaultSearchRadiusKm = Number(
          req.body.system.defaultSearchRadiusKm
        );
      }
      if (req.body.system.maxAllowedRadiusKm !== undefined) {
        settings.system.maxAllowedRadiusKm = Number(
          req.body.system.maxAllowedRadiusKm
        );
      }
    }

    // Update vehicle requirements for ride services
    if (req.body.vehicleRequirements) {
      const tiers = ["car_standard", "car_comfort", "car_premium"];
      tiers.forEach((tier) => {
        if (req.body.vehicleRequirements[tier]) {
          const tierReq = req.body.vehicleRequirements[tier];
          if (tierReq.minYear !== undefined) {
            settings.vehicleRequirements[tier].minYear = Number(
              tierReq.minYear
            );
          }
          if (tierReq.requireAirConditioning !== undefined) {
            settings.vehicleRequirements[tier].requireAirConditioning =
              tierReq.requireAirConditioning === true;
          }
        }
      });
    }

    // Update payment account details
    if (req.body.paymentAccount) {
      if (req.body.paymentAccount.bankName !== undefined) {
        settings.paymentAccount.bankName =
          req.body.paymentAccount.bankName || null;
      }
      if (req.body.paymentAccount.accountNumber !== undefined) {
        settings.paymentAccount.accountNumber =
          req.body.paymentAccount.accountNumber || null;
      }
      if (req.body.paymentAccount.accountName !== undefined) {
        settings.paymentAccount.accountName =
          req.body.paymentAccount.accountName || null;
      }
      if (req.body.paymentAccount.bankCode !== undefined) {
        settings.paymentAccount.bankCode =
          req.body.paymentAccount.bankCode || null;
      }
      if (req.body.paymentAccount.instructions !== undefined) {
        settings.paymentAccount.instructions =
          req.body.paymentAccount.instructions || null;
      }
    }

    await settings.save();

    res.json({
      success: true,
      settings,
      message: "Settings updated successfully",
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

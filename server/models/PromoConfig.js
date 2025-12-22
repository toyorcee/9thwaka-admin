import mongoose from "mongoose";

/**
 * Promo Configuration Model
 * Allows admins to enable/disable individual reward promotions
 */
const promoConfigSchema = new mongoose.Schema(
  {
    // Referral Rewards
    referral: {
      enabled: { type: Boolean, default: true },
      rewardAmount: { type: Number, default: 1000, min: 0, max: 100000 },
      requiredTrips: { type: Number, default: 2, min: 1, max: 100 },
      updatedAt: { type: Date, default: Date.now },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    // Streak Bonus
    streak: {
      enabled: { type: Boolean, default: true },
      bonusAmount: { type: Number, default: 1000, min: 0, max: 100000 },
      requiredStreak: { type: Number, default: 3, min: 1, max: 100 },
      updatedAt: { type: Date, default: Date.now },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    // Gold Status
    goldStatus: {
      enabled: { type: Boolean, default: true },
      requiredRides: { type: Number, default: 7, min: 1, max: 100 },
      windowDays: { type: Number, default: 10, min: 1, max: 365 },
      durationDays: { type: Number, default: 30, min: 1, max: 365 },
      discountPercent: { type: Number, default: 5, min: 0, max: 100 },
      updatedAt: { type: Date, default: Date.now },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
  },
  { timestamps: true }
);

// Ensure only one config document exists
promoConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

const PromoConfig = mongoose.model("PromoConfig", promoConfigSchema);
export default PromoConfig;


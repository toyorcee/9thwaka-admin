import mongoose from "mongoose";

const ReferralSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
    },
    completedTrips: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
ReferralSchema.index({ referrerId: 1, createdAt: -1 });
ReferralSchema.index({ referredUserId: 1 });

const Referral = mongoose.model("Referral", ReferralSchema);

export default Referral;

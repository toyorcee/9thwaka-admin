import mongoose from "mongoose";

const WalletTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "referral_reward",
        "streak_bonus",
        "order_payment",
        "commission_payment",
        "refund",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral",
      default: null,
    },
    payoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RiderPayout",
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true, _id: false }
);

const WalletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactions: {
      type: [WalletTransactionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes
WalletSchema.index({ userId: 1 });

const Wallet = mongoose.model("Wallet", WalletSchema);

export default Wallet;

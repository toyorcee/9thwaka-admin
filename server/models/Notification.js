import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        // Payment
        "payment_reminder",
        "payment_day",
        "payment_status",
        // Orders
        "order_created",
        "order_assigned",
        "order_status_updated",
        "order_cancelled",
        "order_payment",
        "order_payment_confirmed",
        "new_order_available",
        // Delivery
        "delivery_otp",
        "delivery_verified",
        "delivery_proof_updated",
        // Account
        "auth_verified",
        "profile_updated",
        "account_deactivated",
        "account_reactivated",
        // Legacy (for backward compatibility)
        "verification",
        "welcome",
        "order",
        "system",
        // Payouts
        "payout_generated",
        "payout_paid",
        // Price negotiation
        "price_change_requested",
        "price_change_accepted",
        "price_change_rejected",
        "price_updated",
        // Rewards
        "referral_reward",
        "streak_bonus",
        "gold_status",
        "gold_status_expired",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    metadata: { type: Object, default: {} },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;

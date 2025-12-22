import mongoose from "mongoose";

/**
 * BlockedCredentials Model
 * Tracks blocked NIN, email, and phone numbers to prevent fraudulent users
 * from re-registering with the same credentials
 */
const blockedCredentialsSchema = new mongoose.Schema(
  {
    // Blocked NIN (National Identification Number)
    nin: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    // Blocked email address
    email: {
      type: String,
      default: null,
      sparse: true,
      lowercase: true,
      index: true,
    },
    // Blocked phone number
    phoneNumber: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    // Original user ID that was blocked
    originalUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Reason for blocking
    reason: {
      type: String,
      required: true,
    },
    // When the credentials were blocked
    blockedAt: {
      type: Date,
      default: Date.now,
    },
    // Additional metadata
    metadata: {
      fullName: String,
      role: String,
      commissionAmount: Number,
      weekStart: Date,
      weekEnd: Date,
    },
  },
  { timestamps: true }
);

// Compound index for faster lookups
blockedCredentialsSchema.index({ nin: 1, email: 1, phoneNumber: 1 });

// Index for finding by any credential
blockedCredentialsSchema.index({ nin: 1 });
blockedCredentialsSchema.index({ email: 1 });
blockedCredentialsSchema.index({ phoneNumber: 1 });

const BlockedCredentials = mongoose.model(
  "BlockedCredentials",
  blockedCredentialsSchema
);
export default BlockedCredentials;

import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
      select: false,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["customer", "rider", "admin"],
      default: "customer",
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    fullName: {
      type: String,
      default: null,
    },
    // Default address for customers (KYC)
    defaultAddress: {
      type: String,
      default: null,
    },
    // Address for riders
    address: {
      type: String,
      default: null,
    },
    // Last known location (for both customers and riders)
    lastKnownLocation: {
      lat: {
        type: Number,
        default: null,
      },
      lng: {
        type: Number,
        default: null,
      },
      address: {
        type: String,
        default: null,
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },
    vehicleType: {
      type: String,
      enum: [
        "bicycle",
        "motorbike",
        "tricycle",
        "car",
        "car_standard",
        "car_comfort",
        "car_premium",
        "van",
        null,
      ],
      default: null,
    },
    preferredService: {
      type: String,
      default: "courier",
    },
    supportedServices: {
      type: [String],
      default: function () {
        return this.role === "rider" ? ["courier", "ride"] : [];
      },
    },
    vehiclePicture: {
      type: String,
      default: null,
    },
    // Vehicle details for ride services (car_standard, car_comfort, car_premium)
    vehicleYear: {
      type: Number,
      default: null,
      min: 1990,
      max: new Date().getFullYear() + 1,
    },
    hasAirConditioning: {
      type: Boolean,
      default: null,
    },
    searchRadiusKm: {
      type: Number,
      default: 7,
      min: 1,
      max: 20,
    },
    // KYC fields for riders
    nin: {
      type: String,
      default: null,
    },
    driverLicenseNumber: {
      type: String,
      default: null,
    },
    driverLicensePicture: {
      type: String,
      default: null,
    },
    driverLicenseVerified: {
      type: Boolean,
      default: false,
    },
    ninVerified: {
      type: Boolean,
      default: false,
    },
    // Bank account details for riders (required for payments)
    bankAccountNumber: {
      type: String,
      default: null,
    },
    bankName: {
      type: String,
      default: null,
    },
    bankAccountName: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Payment blocking (for overdue commission payments)
    paymentBlocked: {
      type: Boolean,
      default: false,
    },
    paymentBlockedAt: {
      type: Date,
      default: null,
    },
    paymentBlockedReason: {
      type: String,
      default: null,
    },
    // Strike system for late payment offenders
    strikes: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    strikeHistory: [
      {
        strikeNumber: { type: Number, required: true },
        reason: { type: String, required: true },
        weekStart: { type: Date, required: true },
        weekEnd: { type: Date, required: true },
        commissionAmount: { type: Number, required: true },
        issuedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    accountDeactivated: {
      type: Boolean,
      default: false,
    },
    accountDeactivatedAt: {
      type: Date,
      default: null,
    },
    accountDeactivatedReason: {
      type: String,
      default: null,
    },
    // Rating fields (for riders)
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Email verification fields
    verificationCode: {
      type: String,
      default: null,
    },
    verificationExpires: {
      type: Date,
      default: null,
    },
    // Password reset fields
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },
    resetPasswordCode: {
      type: String,
      default: null,
    },
    resetPasswordCodeExpires: {
      type: Date,
      default: null,
    },
    // Expo push notification token
    expoPushToken: {
      type: String,
      default: null,
    },
    // Firebase Cloud Messaging token
    fcmToken: {
      type: String,
      default: null,
    },
    // Terms acceptance
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    termsAcceptedAt: {
      type: Date,
      default: null,
    },
    // Notification preferences
    notificationPreferences: {
      type: {
        // Payment notifications
        payment_reminder: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        payment_day: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        // Order notifications
        order_created: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        order_assigned: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        order_status_updated: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        // Delivery notifications
        delivery_otp: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        delivery_verified: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        delivery_proof_updated: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        // Account notifications
        auth_verified: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        profile_updated: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        // Payout notifications
        payout_generated: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        payout_paid: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        // Price negotiation
        price_change_requested: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        price_change_accepted: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        price_change_rejected: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        referral_reward: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        streak_bonus: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        gold_status: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        gold_status_expired: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        // Order notifications (additional)
        order_cancelled: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        order_payment: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        order_payment_confirmed: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
        new_order_available: {
          inApp: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
        },
      },
      default: {},
    },
    // Referral system fields
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    completedTrips: {
      type: Number,
      default: 0,
      min: 0,
    },
    referralRewardEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    referralRewardPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Streak bonus system fields
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastStreakBonusAt: {
      type: Date,
      default: null,
    },
    totalStreakBonuses: {
      type: Number,
      default: 0,
      min: 0,
    },
    streakHistory: [
      {
        streakCount: { type: Number, required: true },
        bonusAmount: { type: Number, required: true },
        earnedAt: { type: Date, default: Date.now },
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
          default: null,
        },
        _id: false,
      },
    ],
    // Gold Status system fields
    goldStatus: {
      isActive: {
        type: Boolean,
        default: false,
      },
      unlockedAt: {
        type: Date,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
      discountPercent: {
        type: Number,
        default: 5,
        min: 0,
        max: 100,
      },
      totalUnlocks: {
        type: Number,
        default: 0,
        min: 0,
      },
      expiryNotified: {
        type: Boolean,
        default: false,
      },
    },
    goldStatusHistory: [
      {
        unlockedAt: { type: Date, required: true },
        expiresAt: { type: Date, required: true },
        ridesCompleted: { type: Number, required: true },
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
          default: null,
        },
        _id: false,
      },
    ],
    // PIN for app unlock/login
    pinHash: {
      type: String,
      default: null,
      select: false,
    },
    pinEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.referralCode && this.role !== "admin") {
    let code;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 100;

    while (exists && attempts < maxAttempts) {
      code = crypto.randomBytes(4).toString("hex").toUpperCase();
      const UserModel = mongoose.model("User");
      const existingUser = await UserModel.findOne({
        referralCode: code,
      });
      exists = !!existingUser;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return next(new Error("Failed to generate unique referral code"));
    }

    this.referralCode = code;
  }

  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

export default User;

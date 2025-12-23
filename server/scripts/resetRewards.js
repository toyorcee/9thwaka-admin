import dotenv from "dotenv";
import mongoose from "mongoose";
import Referral from "../models/Referral.js";
import Transaction from "../models/Transaction.js";
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import RiderPayout from "../models/RiderPayout.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/9thwaka";

async function resetRewards() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    const referralsResult = await Referral.deleteMany({});

    const ordersResult = await Order.deleteMany({});

    const payoutsResult = await RiderPayout.deleteMany({});

    const transactionsResult = await Transaction.deleteMany({});

    const wallets = await Wallet.find({});

    let walletsUpdated = 0;

    for (const wallet of wallets) {
      wallet.transactions = [];
      wallet.balance = 0;
      await wallet.save();
      walletsUpdated += 1;
    }

    const userUpdateResult = await User.updateMany(
      {},
      {
        $set: {
          referralRewardEarned: 0,
          referralRewardPaid: 0,
          currentStreak: 0,
          lastStreakBonusAt: null,
          totalStreakBonuses: 0,
          streakHistory: [],
          "goldStatus.isActive": false,
          "goldStatus.unlockedAt": null,
          "goldStatus.expiresAt": null,
          "goldStatus.totalUnlocks": 0,
          "goldStatus.expiryNotified": false,
          paymentBlocked: false,
          paymentBlockedAt: null,
          paymentBlockedReason: null,
          strikes: 0,
          strikeHistory: [],
        },
        $unset: {
          goldStatusHistory: "",
        },
      }
    );

    console.log("Rewards and earnings reset complete");
    console.log(`Referrals deleted: ${referralsResult.deletedCount || 0}`);
    console.log(`Orders deleted: ${ordersResult.deletedCount || 0}`);
    console.log(`Payouts deleted: ${payoutsResult.deletedCount || 0}`);
    console.log(
      `Transactions deleted: ${transactionsResult.deletedCount || 0}`
    );
    console.log(`Wallets reset: ${walletsUpdated}`);
    console.log(`Users updated: ${userUpdateResult.modifiedCount || 0}`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting rewards:", error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
}

resetRewards();

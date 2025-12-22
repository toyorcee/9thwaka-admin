/**
 * Test Script: Make Payment Due Today
 *
 * This script adjusts the payout week dates so that payment is due TODAY
 * This allows you to test the payment logic and "Pay Commission" button
 *
 * Usage: node server/scripts/makePaymentDueToday.js
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import RiderPayout from "../models/RiderPayout.js";
import User from "../models/User.js";
import { getPaymentDueDate, getWeekRange } from "../utils/weekUtils.js";

dotenv.config();

async function makePaymentDueToday() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/9thwaka",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ Connected to MongoDB");

    // Find a rider
    const rider = await User.findOne({ role: "rider" });
    if (!rider) {
      console.error("❌ No rider found. Please create a rider account first.");
      process.exit(1);
    }

    console.log(`\n👤 Found rider: ${rider.fullName} (${rider.email})`);
    console.log(`   ID: ${rider._id}`);

    // Find the payout - try current week first, then most recent unpaid
    const { start, end } = getWeekRange();
    let payout = await RiderPayout.findOne({
      riderId: rider._id,
      weekStart: start,
    });

    // If not found by current week, find the most recent unpaid payout
    if (!payout) {
      payout = await RiderPayout.findOne({
        riderId: rider._id,
        status: { $ne: "paid" },
      }).sort({ weekStart: -1 });
    }

    if (!payout) {
      console.error("❌ No payout found. Run setupTestEarnings.js first.");
      process.exit(1);
    }

    console.log("\n📅 Current payout dates:");
    console.log(`   Week Start: ${payout.weekStart.toLocaleDateString()}`);
    console.log(`   Week End: ${payout.weekEnd.toLocaleDateString()}`);

    // Calculate new dates so payment is due TODAY (0 days)
    // Payment is due on Saturday 11:59 PM (end of week)
    // Week runs Sunday to Saturday, so weekEnd is Sunday 00:00:00
    // Payment due date = weekEnd - 1 day = Saturday 11:59 PM
    // To make payment due TODAY, we need: paymentDueDate = today
    // So: weekEnd - 1 day = today
    // Therefore: weekEnd = today + 1 day

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Set weekEnd to tomorrow (Sunday 00:00:00)
    // This makes payment due date (Saturday) = today
    const newWeekEnd = new Date(today);
    newWeekEnd.setDate(newWeekEnd.getDate() + 1); // Tomorrow
    newWeekEnd.setHours(0, 0, 0, 0); // Sunday 00:00:00

    // Set weekStart to 7 days before weekEnd (last Sunday)
    const newWeekStart = new Date(newWeekEnd);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    newWeekStart.setHours(0, 0, 0, 0);

    // Update payout
    payout.weekStart = newWeekStart;
    payout.weekEnd = newWeekEnd;
    await payout.save();

    const paymentDueDate = getPaymentDueDate(newWeekEnd);
    const now = new Date();
    const daysUntilDue = Math.ceil(
      (paymentDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log("\n✅ Updated payout dates:");
    console.log(`   New Week Start: ${newWeekStart.toLocaleDateString()}`);
    console.log(`   New Week End: ${newWeekEnd.toLocaleDateString()}`);
    console.log(
      `   Payment Due Date: ${paymentDueDate.toLocaleDateString()} ${paymentDueDate.toLocaleTimeString()}`
    );
    console.log(
      `   Today: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
    );
    console.log(`   Days Until Due: ${daysUntilDue}`);

    if (daysUntilDue <= 0) {
      console.log("\n🎉 Payment is now DUE TODAY (or overdue)!");
      console.log("   You should see 'Pay Commission' button in the app");
    } else if (daysUntilDue === 1) {
      console.log(
        "\n⚠️ Payment due in 1 day - adjusting to make it due today..."
      );
      // Adjust weekEnd to make payment due today
      const adjustedWeekEnd = new Date(now);
      adjustedWeekEnd.setDate(adjustedWeekEnd.getDate() + 1);
      adjustedWeekEnd.setHours(0, 0, 0, 0);

      const adjustedPaymentDueDate = getPaymentDueDate(adjustedWeekEnd);
      const adjustedDaysUntilDue = Math.ceil(
        (adjustedPaymentDueDate.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (adjustedDaysUntilDue <= 0) {
        payout.weekStart = new Date(adjustedWeekEnd);
        payout.weekStart.setDate(payout.weekStart.getDate() - 7);
        payout.weekStart.setHours(0, 0, 0, 0);
        payout.weekEnd = adjustedWeekEnd;
        await payout.save();

        console.log(
          `   ✅ Adjusted! Payment is now due in ${adjustedDaysUntilDue} day(s)`
        );
        console.log(
          `   New Payment Due Date: ${adjustedPaymentDueDate.toLocaleDateString()} ${adjustedPaymentDueDate.toLocaleTimeString()}`
        );
      }
    } else {
      console.log(`\n⚠️ Payment due in ${daysUntilDue} day(s)`);
    }

    console.log("\n💡 You can now test the payment modal in the app!");
    console.log("=".repeat(50) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

makePaymentDueToday();

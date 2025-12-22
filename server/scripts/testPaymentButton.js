import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  getPaymentDueDate,
  getPaymentGraceDeadline,
  getWeekRange,
} from "../utils/weekUtils.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/9thwaka";

async function testPaymentButton() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    const User = (await import("../models/User.js")).default;
    const RiderPayout = (await import("../models/RiderPayout.js")).default;

    // Find a test rider
    const rider = await User.findOne({ role: "rider" }).select(
      "_id email fullName"
    );

    if (!rider) {
      console.log("❌ No rider found in database");
      process.exit(1);
    }

    console.log(`📋 Testing for rider: ${rider.fullName || rider.email}`);
    console.log(`   Rider ID: ${rider._id}\n`);

    // Get current week range
    const { start, end } = getWeekRange();
    console.log("📅 Current Week:");
    console.log(`   Start: ${start.toLocaleString()}`);
    console.log(`   End: ${end.toLocaleString()}\n`);

    // Get last week (the week that just ended Saturday)
    const lastWeekDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { start: lastWeekStart, end: lastWeekEnd } =
      getWeekRange(lastWeekDate);
    console.log("📅 Last Week (that ended Saturday):");
    console.log(`   Start: ${lastWeekStart.toLocaleString()}`);
    console.log(`   End: ${lastWeekEnd.toLocaleString()}\n`);

    // Check current week payout
    const currentPayout = await RiderPayout.findOne({
      riderId: rider._id,
      weekStart: start,
    });

    console.log("💰 Current Week Payout:");
    if (currentPayout) {
      console.log(`   Status: ${currentPayout.status}`);
      console.log(
        `   Commission: ₦${
          currentPayout.totals?.commission?.toLocaleString() || 0
        }`
      );
      console.log(`   Count: ${currentPayout.totals?.count || 0}`);
    } else {
      console.log("   No payout found for current week");
    }
    console.log();

    // Check for pending payout from previous weeks
    const mostRecentPendingPayout = await RiderPayout.findOne({
      riderId: rider._id,
      status: "pending",
    })
      .sort({ weekStart: -1 })
      .lean();

    console.log("💰 Most Recent Pending Payout:");
    if (mostRecentPendingPayout) {
      console.log(
        `   Week Start: ${new Date(
          mostRecentPendingPayout.weekStart
        ).toLocaleString()}`
      );
      console.log(
        `   Week End: ${new Date(
          mostRecentPendingPayout.weekEnd
        ).toLocaleString()}`
      );
      console.log(`   Status: ${mostRecentPendingPayout.status}`);
      console.log(
        `   Commission: ₦${
          mostRecentPendingPayout.totals?.commission?.toLocaleString() || 0
        }`
      );
      console.log(`   Count: ${mostRecentPendingPayout.totals?.count || 0}`);

      // Check if it's from a different week than current
      const isFromPreviousWeek =
        mostRecentPendingPayout.weekStart.getTime() !== start.getTime();
      console.log(`   Is from previous week: ${isFromPreviousWeek}`);

      if (isFromPreviousWeek) {
        const pendingWeekEnd = mostRecentPendingPayout.weekEnd;
        const pendingPayoutDueDate = getPaymentDueDate(pendingWeekEnd);
        const pendingPayoutGraceDeadline =
          getPaymentGraceDeadline(pendingWeekEnd);
        const now = new Date();

        console.log(
          `   Payment Due Date: ${pendingPayoutDueDate.toLocaleString()}`
        );
        console.log(
          `   Grace Deadline: ${pendingPayoutGraceDeadline.toLocaleString()}`
        );
        console.log(`   Now: ${now.toLocaleString()}`);

        const daysUntilDue = Math.ceil(
          (pendingPayoutDueDate.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const daysUntilGraceDeadline = Math.ceil(
          (pendingPayoutGraceDeadline.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        console.log(`   Days until due: ${daysUntilDue}`);
        console.log(`   Days until grace deadline: ${daysUntilGraceDeadline}`);

        const isPaymentDue =
          (mostRecentPendingPayout.totals?.commission || 0) > 0 &&
          daysUntilDue <= 0;
        const isInGracePeriod =
          (mostRecentPendingPayout.totals?.commission || 0) > 0 &&
          daysUntilDue <= 0 &&
          daysUntilGraceDeadline > 0;
        const isOverdue = now > pendingPayoutGraceDeadline;

        console.log(`   Is payment due: ${isPaymentDue}`);
        console.log(`   Is in grace period: ${isInGracePeriod}`);
        console.log(`   Is overdue: ${isOverdue}`);

        console.log("\n🎯 PAYMENT BUTTON LOGIC:");
        const shouldShowButton =
          mostRecentPendingPayout.status === "pending" &&
          (mostRecentPendingPayout.totals?.commission || 0) > 0;
        console.log(
          `   Should show payment button: ${
            shouldShowButton ? "✅ YES" : "❌ NO"
          }`
        );

        if (shouldShowButton) {
          console.log(
            "\n   ✅ The rider SHOULD see the 'Pay Previous Week Commission' button!"
          );
          console.log(`   Button text: "Pay Previous Week Commission"`);
        } else {
          console.log("\n   ❌ The rider should NOT see the payment button");
          if (mostRecentPendingPayout.status !== "pending") {
            console.log(
              `   Reason: Payout status is "${mostRecentPendingPayout.status}", not "pending"`
            );
          }
          if ((mostRecentPendingPayout.totals?.commission || 0) === 0) {
            console.log(`   Reason: Commission is 0`);
          }
        }
      }
    } else {
      console.log("   No pending payout found");
      console.log(
        "\n❌ The rider should NOT see the payment button (no pending payout)"
      );
    }

    // Check all payouts for this rider
    const allPayouts = await RiderPayout.find({ riderId: rider._id })
      .sort({ weekStart: -1 })
      .limit(5)
      .lean();

    console.log("\n📊 Last 5 Payouts:");
    allPayouts.forEach((payout, index) => {
      console.log(
        `\n   ${index + 1}. Week ${new Date(
          payout.weekStart
        ).toLocaleDateString()}`
      );
      console.log(`      Status: ${payout.status}`);
      console.log(
        `      Commission: ₦${payout.totals?.commission?.toLocaleString() || 0}`
      );
      console.log(`      Count: ${payout.totals?.count || 0}`);
    });

    await mongoose.disconnect();
    console.log("\n✅ Test completed");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

testPaymentButton();

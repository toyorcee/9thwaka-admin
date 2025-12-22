/**
 * Test script to verify earnings API responses for all filters
 * Run with: node server/scripts/testEarningsApi.js
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import RiderPayout from "../models/RiderPayout.js";
import User from "../models/User.js";
import { getWeekRange } from "../utils/weekUtils.js";

dotenv.config();

async function testEarningsApi() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/9thwaka",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ Connected to MongoDB\n");

    // Get a test rider
    const testRider = await User.findOne({ role: "rider" });
    if (!testRider) {
      console.error("❌ No rider found in database");
      process.exit(1);
    }

    console.log(
      `📋 Testing with rider: ${testRider.fullName} (${testRider._id})\n`
    );

    // Test 1: Current Week Earnings
    console.log("=".repeat(60));
    console.log("TEST 1: Current Week Earnings");
    console.log("=".repeat(60));
    const { start: currentWeekStart, end: currentWeekEnd } = getWeekRange();
    const currentWeekOrders = await Order.find({
      riderId: testRider._id,
      status: "delivered",
      "delivery.deliveredAt": { $gte: currentWeekStart, $lt: currentWeekEnd },
    }).select("_id price financial delivery.deliveredAt");

    const currentWeekTotals = currentWeekOrders.reduce(
      (acc, order) => {
        const fin = order.financial || {
          grossAmount: order.price || 0,
          commissionAmount: 0,
          riderNetAmount: order.price || 0,
        };
        acc.gross += fin.grossAmount || 0;
        acc.commission += fin.commissionAmount || 0;
        acc.riderNet += fin.riderNetAmount || 0;
        acc.count += 1;
        return acc;
      },
      { gross: 0, commission: 0, riderNet: 0, count: 0 }
    );

    console.log(
      `Week Range: ${currentWeekStart.toISOString()} to ${currentWeekEnd.toISOString()}`
    );
    console.log(`Orders Found: ${currentWeekOrders.length}`);
    console.log(`Totals:`, currentWeekTotals);
    console.log(
      `✅ Current Week Test: ${
        currentWeekOrders.length > 0 ? "PASS" : "NO DATA"
      }\n`
    );

    // Test 2: This Month Earnings
    console.log("=".repeat(60));
    console.log("TEST 2: This Month Earnings");
    console.log("=".repeat(60));
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(
      currentYear,
      currentMonth + 1,
      0,
      23,
      59,
      59,
      999
    );

    const monthPayouts = await RiderPayout.find({
      riderId: testRider._id,
      weekStart: { $gte: monthStart, $lte: monthEnd },
    }).lean();

    const monthTotals = monthPayouts.reduce(
      (acc, payout) => {
        const totals = payout.totals || {
          gross: 0,
          commission: 0,
          riderNet: 0,
          count: 0,
        };
        acc.gross += totals.gross || 0;
        acc.commission += totals.commission || 0;
        acc.riderNet += totals.riderNet || 0;
        acc.count += totals.count || 0;
        return acc;
      },
      { gross: 0, commission: 0, riderNet: 0, count: 0 }
    );

    console.log(
      `Month Range: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`
    );
    console.log(`Payouts Found: ${monthPayouts.length}`);
    console.log(`Totals:`, monthTotals);
    console.log(
      `✅ This Month Test: ${monthPayouts.length > 0 ? "PASS" : "NO DATA"}\n`
    );

    // Test 3: All Time Earnings
    console.log("=".repeat(60));
    console.log("TEST 3: All Time Earnings");
    console.log("=".repeat(60));
    const allTimeOrders = await Order.find({
      riderId: testRider._id,
      status: "delivered",
    }).select("financial price");

    const allTimeTotals = allTimeOrders.reduce(
      (acc, order) => {
        const fin = order.financial || {
          grossAmount: order.price || 0,
          commissionAmount: 0,
          riderNetAmount: order.price || 0,
        };
        acc.gross += fin.grossAmount || 0;
        acc.commission += fin.commissionAmount || 0;
        acc.riderNet += fin.riderNetAmount || 0;
        acc.count += 1;
        return acc;
      },
      { gross: 0, commission: 0, riderNet: 0, count: 0 }
    );

    console.log(`Total Orders: ${allTimeOrders.length}`);
    console.log(`Totals:`, allTimeTotals);
    console.log(
      `✅ All Time Test: ${allTimeOrders.length > 0 ? "PASS" : "NO DATA"}\n`
    );

    // Test 4: Payment History
    console.log("=".repeat(60));
    console.log("TEST 4: Payment History");
    console.log("=".repeat(60));
    const allPayouts = await RiderPayout.find({
      riderId: testRider._id,
    })
      .sort({ weekStart: -1 })
      .lean();

    console.log(`Total Payouts: ${allPayouts.length}`);

    if (allPayouts.length > 0) {
      const samplePayout = allPayouts[0];
      console.log(`\nSample Payout:`);
      console.log(
        `  Week: ${new Date(
          samplePayout.weekStart
        ).toISOString()} to ${new Date(samplePayout.weekEnd).toISOString()}`
      );
      console.log(`  Status: ${samplePayout.status}`);
      console.log(`  Totals:`, samplePayout.totals);
      console.log(`  Orders Count: ${samplePayout.orders?.length || 0}`);

      if (samplePayout.orders && samplePayout.orders.length > 0) {
        console.log(`  Sample Order:`, {
          orderId: samplePayout.orders[0].orderId,
          riderNet: samplePayout.orders[0].riderNetAmount,
          commission: samplePayout.orders[0].commissionAmount,
        });
      }
    }

    console.log(
      `✅ Payment History Test: ${allPayouts.length > 0 ? "PASS" : "NO DATA"}\n`
    );

    // Test 5: Verify Data Consistency
    console.log("=".repeat(60));
    console.log("TEST 5: Data Consistency Check");
    console.log("=".repeat(60));

    let consistencyErrors = [];

    // Check if payout totals match sum of orders
    for (const payout of allPayouts) {
      if (payout.orders && payout.orders.length > 0) {
        const calculatedTotals = payout.orders.reduce(
          (acc, order) => {
            acc.gross += order.grossAmount || 0;
            acc.commission += order.commissionAmount || 0;
            acc.riderNet += order.riderNetAmount || 0;
            acc.count += 1;
            return acc;
          },
          { gross: 0, commission: 0, riderNet: 0, count: 0 }
        );

        const storedTotals = payout.totals || {
          gross: 0,
          commission: 0,
          riderNet: 0,
          count: 0,
        };

        const grossMatch =
          Math.abs(calculatedTotals.gross - storedTotals.gross) < 0.01;
        const commissionMatch =
          Math.abs(calculatedTotals.commission - storedTotals.commission) <
          0.01;
        const netMatch =
          Math.abs(calculatedTotals.riderNet - storedTotals.riderNet) < 0.01;
        const countMatch = calculatedTotals.count === storedTotals.count;

        if (!grossMatch || !commissionMatch || !netMatch || !countMatch) {
          consistencyErrors.push({
            payoutId: payout._id,
            weekStart: payout.weekStart,
            calculated: calculatedTotals,
            stored: storedTotals,
            issues: {
              gross: !grossMatch,
              commission: !commissionMatch,
              riderNet: !netMatch,
              count: !countMatch,
            },
          });
        }
      }
    }

    if (consistencyErrors.length > 0) {
      console.log(`⚠️  Found ${consistencyErrors.length} consistency issues:`);
      consistencyErrors.slice(0, 3).forEach((error) => {
        console.log(`  Payout ${error.payoutId}:`, error.issues);
      });
    } else {
      console.log(`✅ All payouts have consistent totals`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(
      `Current Week: ${
        currentWeekOrders.length
      } orders, ₦${currentWeekTotals.riderNet.toLocaleString()} net`
    );
    console.log(
      `This Month: ${
        monthPayouts.length
      } payouts, ₦${monthTotals.riderNet.toLocaleString()} net`
    );
    console.log(
      `All Time: ${
        allTimeOrders.length
      } orders, ₦${allTimeTotals.riderNet.toLocaleString()} net`
    );
    console.log(`History: ${allPayouts.length} payouts`);
    console.log(
      `Consistency: ${
        consistencyErrors.length === 0 ? "✅ PASS" : "⚠️  ISSUES FOUND"
      }`
    );
    console.log("=".repeat(60));

    await mongoose.disconnect();
    console.log("\n✅ Tests completed. Database disconnected.");
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testEarningsApi();

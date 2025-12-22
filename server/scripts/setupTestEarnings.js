/**
 * Test Script: Setup Wallet Balance and Earnings for Testing
 *
 * This script:
 * 1. Adds wallet balance to a rider
 * 2. Creates a payout with commission for the current week
 * 3. Creates some delivered orders to generate earnings
 *
 * Usage: node server/scripts/setupTestEarnings.js
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import RiderPayout from "../models/RiderPayout.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import { getWeekRange } from "../utils/weekUtils.js";

dotenv.config();

async function setupTestEarnings() {
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

    const riderEmail =
      process.env.TEST_RIDER_EMAIL ||
      "test-rider-lekki-courier-motorbike@example.com";

    const rider = await User.findOne({ email: riderEmail });
    if (!rider) {
      console.error(`❌ No rider found with email ${riderEmail}`);
      process.exit(1);
    }

    console.log(`\n👤 Found rider: ${rider.fullName} (${rider.email})`);
    console.log(`   ID: ${rider._id}`);

    // 1. Add wallet balance (₦5,000 for testing)
    console.log("\n💰 Adding wallet balance...");
    try {
      const { creditWallet } = await import("../utils/walletUtils.js");
      await creditWallet(rider._id, 5000, {
        type: "referral_reward",
        referralId: null,
        description: "Test wallet balance for payment modal testing",
        metadata: {
          test: true,
          script: "setupTestEarnings",
        },
      });
      console.log("   ✅ Added ₦5,000 to wallet");
    } catch (error) {
      console.error("   ⚠️ Wallet error:", error.message);
    }

    // 2. Create some delivered orders for this week
    console.log("\n📦 Creating test orders...");
    const { start, end } = getWeekRange();

    // Create a dummy customer if needed
    let customer = await User.findOne({ role: "customer" });
    if (!customer) {
      customer = await User.findOne({ role: { $ne: "admin" } });
      if (!customer) {
        console.log("   ⚠️ No customer found, creating a test customer...");
        customer = await User.create({
          email: `test-customer-${Date.now()}@test.com`,
          password: "test123",
          fullName: "Test Customer",
          role: "customer",
        });
      }
    }

    // Create 3 delivered orders for this week
    const orders = [];
    for (let i = 0; i < 3; i++) {
      const order = await Order.create({
        customerId: customer._id,
        riderId: rider._id,
        pickup: {
          address: `Test Pickup ${i + 1}`,
          lat: 6.5244 + Math.random() * 0.1,
          lng: 3.3792 + Math.random() * 0.1,
        },
        dropoff: {
          address: `Test Dropoff ${i + 1}`,
          lat: 6.5244 + Math.random() * 0.1,
          lng: 3.3792 + Math.random() * 0.1,
        },
        items: `Test Order ${i + 1}`,
        serviceType: "courier",
        preferredVehicleType: "motorbike",
        price: 5000 + i * 1000, // ₦5,000, ₦6,000, ₦7,000
        originalPrice: 5000 + i * 1000,
        status: "delivered",
        delivery: {
          deliveredAt: new Date(
            start.getTime() + (i + 1) * 24 * 60 * 60 * 1000
          ), // Spread across the week
        },
        financial: {
          grossAmount: 5000 + i * 1000,
          commissionRatePct: 10,
          commissionAmount: (5000 + i * 1000) * 0.1,
          riderNetAmount: (5000 + i * 1000) * 0.9,
        },
        timeline: [
          {
            status: "pending",
            at: new Date(start.getTime() + i * 24 * 60 * 60 * 1000),
          },
          {
            status: "assigned",
            at: new Date(start.getTime() + i * 24 * 60 * 60 * 1000 + 1000),
          },
          {
            status: "delivered",
            at: new Date(start.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
          },
        ],
        payment: {
          method: "cash",
          status: "paid",
        },
      });
      orders.push(order);
      console.log(
        `   ✅ Created order #${i + 1}: ₦${order.price.toLocaleString()}`
      );
    }

    // 3. Create or update payout for current week
    console.log("\n💵 Creating payout...");
    const totals = orders.reduce(
      (acc, order) => {
        acc.gross += order.financial.grossAmount;
        acc.commission += order.financial.commissionAmount;
        acc.riderNet += order.financial.riderNetAmount;
        acc.count += 1;
        return acc;
      },
      { gross: 0, commission: 0, riderNet: 0, count: 0 }
    );

    // Generate payment reference code
    const riderIdShort = String(rider._id).slice(-6).toUpperCase();
    const weekTimestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    const paymentReferenceCode = `9W${riderIdShort}${weekTimestamp}${random}`;

    const payout = await RiderPayout.findOneAndUpdate(
      { riderId: rider._id, weekStart: start },
      {
        riderId: rider._id,
        weekStart: start,
        weekEnd: end,
        orders: orders.map((order) => ({
          orderId: order._id,
          deliveredAt: order.delivery.deliveredAt,
          grossAmount: order.financial.grossAmount,
          commissionAmount: order.financial.commissionAmount,
          riderNetAmount: order.financial.riderNetAmount,
        })),
        totals,
        paymentReferenceCode,
        status: "pending",
      },
      { upsert: true, new: true }
    );

    console.log(
      `   ✅ Created payout for week ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
    );
    console.log(`   📊 Totals:`);
    console.log(`      Gross: ₦${totals.gross.toLocaleString()}`);
    console.log(`      Commission: ₦${totals.commission.toLocaleString()}`);
    console.log(`      Rider Net: ₦${totals.riderNet.toLocaleString()}`);
    console.log(`   🔑 Reference Code: ${paymentReferenceCode}`);

    // 4. Display summary
    const wallet = await Wallet.findOne({ userId: rider._id });
    const walletBalance = wallet?.balance || 0;

    console.log("\n" + "=".repeat(50));
    console.log("✅ TEST DATA SETUP COMPLETE!");
    console.log("=".repeat(50));
    console.log(`\n👤 Rider: ${rider.fullName}`);
    console.log(`   Email: ${rider.email}`);
    console.log(`   ID: ${rider._id}`);
    console.log(`\n💰 Wallet Balance: ₦${walletBalance.toLocaleString()}`);
    console.log(`\n📊 Current Week Earnings:`);
    console.log(`   Gross: ₦${totals.gross.toLocaleString()}`);
    console.log(`   Commission Due: ₦${totals.commission.toLocaleString()}`);
    console.log(`   Net Earnings: ₦${totals.riderNet.toLocaleString()}`);
    console.log(`   Orders: ${totals.count}`);
    console.log(`\n🔑 Payment Reference: ${paymentReferenceCode}`);
    console.log("\n💡 You can now test the payment modal in the app!");
    console.log("=".repeat(50) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

setupTestEarnings();

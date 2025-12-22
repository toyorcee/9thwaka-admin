import dotenv from "dotenv";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import {
    getPromoConfig,
    isGoldStatusPromoEnabled,
} from "../utils/promoConfigUtils.js";

dotenv.config();

async function unlockGoldStatusForRider(rider, referenceOrder) {
  const isEnabled = await isGoldStatusPromoEnabled();
  if (!isEnabled) {
    return;
  }

  const promoConfig = await getPromoConfig();
  const requiredRides = promoConfig.goldStatus?.requiredRides ?? 7;
  const windowDays = promoConfig.goldStatus?.windowDays ?? 10;
  const durationDays = promoConfig.goldStatus?.durationDays ?? 30;
  const discountPercent = promoConfig.goldStatus?.discountPercent ?? 5;

  if (
    rider.goldStatus?.isActive &&
    rider.goldStatus?.expiresAt &&
    new Date() < new Date(rider.goldStatus.expiresAt)
  ) {
    return;
  }

  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - windowDays);

  const completedRides = await Order.countDocuments({
    riderId: rider._id,
    serviceType: "ride",
    status: "delivered",
    "delivery.deliveredAt": {
      $gte: windowStart,
      $lte: now,
    },
  });

  if (completedRides < requiredRides) {
    return;
  }

  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + durationDays);
  const previousTotalUnlocks = rider.goldStatus?.totalUnlocks || 0;

  rider.goldStatus = {
    isActive: true,
    unlockedAt: now,
    expiresAt,
    discountPercent,
    totalUnlocks: previousTotalUnlocks + 1,
  };

  if (!Array.isArray(rider.goldStatusHistory)) {
    rider.goldStatusHistory = [];
  }

  rider.goldStatusHistory.push({
    unlockedAt: now,
    expiresAt,
    ridesCompleted: completedRides,
    orderId: referenceOrder._id,
  });

  await rider.save();
}

async function setupGoldStatusTest() {
  try {
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
      await mongoose.disconnect();
      process.exit(1);
    }

    if (rider.role !== "rider") {
      console.error(`❌ User with email ${riderEmail} is not a rider`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`\n👤 Rider: ${rider.fullName} (${rider.email})`);
    console.log(`   ID: ${rider._id}`);

    // Find or create a customer
    let customer = await User.findOne({ role: "customer" });
    if (!customer) {
      console.log("\n👤 No customer found, creating a test customer...");
      customer = await User.create({
        email: `gold-test-customer-${Date.now()}@test.com`,
        password: "test123",
        fullName: "Gold Test Customer",
        role: "customer",
      });
      console.log(
        `   ✅ Created customer: ${customer.fullName} (${customer.email})`
      );
    } else {
      console.log(
        `\n👤 Using existing customer: ${customer.fullName} (${customer.email})`
      );
    }

    const now = new Date();
    const ridesToCreate = 7;
    const createdRides = [];

    console.log(
      `\n📦 Creating ${ridesToCreate} delivered ride orders in the last 7 days...`
    );

    for (let i = 0; i < ridesToCreate; i++) {
      const daysAgo = i;
      const deliveredAt = new Date(
        now.getTime() - daysAgo * 24 * 60 * 60 * 1000
      );

      const basePrice = 3000 + i * 500;
      const commissionRate = 0.1;
      const commissionAmount = Math.round(basePrice * commissionRate);
      const riderNetAmount = basePrice - commissionAmount;

      const order = await Order.create({
        customerId: customer._id,
        riderId: rider._id,
        pickup: {
          address: `Gold Test Pickup ${i + 1} (Ride)`,
          lat: 6.5244 + Math.random() * 0.05,
          lng: 3.3792 + Math.random() * 0.05,
        },
        dropoff: {
          address: `Gold Test Dropoff ${i + 1} (Ride)`,
          lat: 6.5244 + Math.random() * 0.05,
          lng: 3.3792 + Math.random() * 0.05,
        },
        items: `Gold Status Test Ride #${i + 1}`,
        serviceType: "ride",
        preferredVehicleType: "car_standard",
        price: basePrice,
        originalPrice: basePrice,
        status: "delivered",
        delivery: {
          deliveredAt,
        },
        financial: {
          grossAmount: basePrice,
          commissionRatePct: commissionRate * 100,
          commissionAmount,
          riderNetAmount,
        },
        timeline: [
          {
            status: "pending",
            at: new Date(deliveredAt.getTime() - 2 * 60 * 60 * 1000),
          },
          {
            status: "assigned",
            at: new Date(deliveredAt.getTime() - 1 * 60 * 60 * 1000),
          },
          {
            status: "delivered",
            at: deliveredAt,
          },
        ],
        payment: {
          method: "cash",
          status: "paid",
        },
      });

      createdRides.push(order);
      console.log(
        `   ✅ Ride #${i + 1}: ₦${order.price.toLocaleString()} • Delivered ${deliveredAt.toLocaleString()}`
      );
    }
    console.log("\n🌟 Running Gold Status unlock logic...");
    await unlockGoldStatusForRider(rider, createdRides[createdRides.length - 1]);

    const updatedRider = await User.findById(rider._id).select(
      "goldStatus goldStatusHistory"
    );

    console.log("\n🎯 Gold Status Result:");
    console.log(
      `   Active: ${updatedRider.goldStatus?.isActive ? "YES" : "NO"}`
    );
    console.log(
      `   Discount: ${
        updatedRider.goldStatus?.discountPercent || 0
      }% commission`
    );
    console.log(
      `   Unlocked At: ${
        updatedRider.goldStatus?.unlockedAt
          ? updatedRider.goldStatus.unlockedAt.toLocaleString()
          : "N/A"
      }`
    );
    console.log(
      `   Expires At: ${
        updatedRider.goldStatus?.expiresAt
          ? updatedRider.goldStatus.expiresAt.toLocaleString()
          : "N/A"
      }`
    );
    console.log(
      `   Total Unlocks: ${updatedRider.goldStatus?.totalUnlocks || 0}`
    );

    console.log("\n👤 Rider ready for Gold Status UI tests.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
}

setupGoldStatusTest();

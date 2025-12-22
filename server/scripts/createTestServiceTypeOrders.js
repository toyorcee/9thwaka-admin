/**
 * Test Script: Create Orders with Both Service Types (Courier & Ride)
 *
 * This script creates test orders with both "courier" and "ride" service types
 * to test the service type filtering on the earnings page.
 *
 * Usage: node server/scripts/createTestServiceTypeOrders.js
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import RiderPayout from "../models/RiderPayout.js";
import User from "../models/User.js";
import { geocodeMapboxAddress } from "../services/mapboxService.js";
import { calculateRoadDistance } from "../services/routingService.js";
import {
  getPaymentDueDate,
  getPaymentGraceDeadline,
  getWeekRange,
} from "../utils/weekUtils.js";

// Import pricing calculation (simplified version)
const getPricingRates = async () => {
  return {
    MIN_FARE: Number(process.env.PRICE_MIN_FARE) || 800,
    PER_KM_SHORT: Number(process.env.PRICE_PER_KM_SHORT) || 100,
    PER_KM_MEDIUM: Number(process.env.PRICE_PER_KM_MEDIUM) || 140,
    PER_KM_LONG: Number(process.env.PRICE_PER_KM_LONG) || 200,
    SHORT_DISTANCE_MAX: Number(process.env.PRICE_SHORT_DISTANCE_MAX) || 8,
    MEDIUM_DISTANCE_MAX: Number(process.env.PRICE_MEDIUM_DISTANCE_MAX) || 15,
    VEHICLE_MULTIPLIERS: {
      bicycle: Number(process.env.PRICE_VEHICLE_BICYCLE) || 0.8,
      motorbike: Number(process.env.PRICE_VEHICLE_MOTORBIKE) || 1.0,
      tricycle: Number(process.env.PRICE_VEHICLE_TRICYCLE) || 1.15,
      car: Number(process.env.PRICE_VEHICLE_CAR) || 1.25,
      car_standard: Number(process.env.PRICE_VEHICLE_CAR_STANDARD) || 1.25,
      car_comfort: Number(process.env.PRICE_VEHICLE_CAR_COMFORT) || 1.5,
      car_premium: Number(process.env.PRICE_VEHICLE_CAR_PREMIUM) || 2.0,
      van: Number(process.env.PRICE_VEHICLE_VAN) || 1.5,
    },
  };
};

const calculateDeliveryPrice = async (
  distanceKm,
  vehicleType = "motorbike"
) => {
  const rates = await getPricingRates();
  const {
    MIN_FARE,
    PER_KM_SHORT,
    PER_KM_MEDIUM,
    PER_KM_LONG,
    SHORT_DISTANCE_MAX,
    MEDIUM_DISTANCE_MAX,
    VEHICLE_MULTIPLIERS,
  } = rates;

  const normalizedVehicleType = vehicleType || "motorbike";
  let resolvedVehicleType = normalizedVehicleType;
  if (
    resolvedVehicleType === "car" &&
    !VEHICLE_MULTIPLIERS.car &&
    VEHICLE_MULTIPLIERS.car_standard
  ) {
    resolvedVehicleType = "car_standard";
  }

  const multiplier =
    VEHICLE_MULTIPLIERS[resolvedVehicleType] ||
    (resolvedVehicleType.startsWith("car_") &&
      VEHICLE_MULTIPLIERS.car_standard) ||
    VEHICLE_MULTIPLIERS.motorbike;

  if (!distanceKm || distanceKm <= 0) {
    return Math.round(MIN_FARE * multiplier);
  }

  const adjustedDistance = distanceKm;
  let price;

  if (adjustedDistance <= SHORT_DISTANCE_MAX) {
    price = MIN_FARE + adjustedDistance * PER_KM_SHORT;
  } else if (adjustedDistance <= MEDIUM_DISTANCE_MAX) {
    price =
      MIN_FARE +
      SHORT_DISTANCE_MAX * PER_KM_SHORT +
      (adjustedDistance - SHORT_DISTANCE_MAX) * PER_KM_MEDIUM;
  } else {
    price =
      MIN_FARE +
      SHORT_DISTANCE_MAX * PER_KM_SHORT +
      (MEDIUM_DISTANCE_MAX - SHORT_DISTANCE_MAX) * PER_KM_MEDIUM +
      (adjustedDistance - MEDIUM_DISTANCE_MAX) * PER_KM_LONG;
  }

  price = Math.round(price * multiplier);
  return Math.max(price, Math.round(MIN_FARE * multiplier));
};

dotenv.config();

// Get Lagos time (UTC+1)
function getLagosTime() {
  const now = new Date();
  // Lagos is UTC+1, but JavaScript Date uses local time
  // For testing, we'll use the system time but ensure we're working with Lagos timezone
  return now;
}

async function createTestServiceTypeOrders() {
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

    // Find a customer
    const customer = await User.findOne({ role: "customer" });
    if (!customer) {
      console.error(
        "❌ No customer found. Please create a customer account first."
      );
      process.exit(1);
    }

    // Find a rider
    const rider = await User.findOne({ role: "rider" });
    if (!rider) {
      console.error("❌ No rider found. Please create a rider account first.");
      process.exit(1);
    }

    console.log(
      `\n👤 Found customer: ${customer.fullName} (${customer.email})`
    );
    console.log(`👤 Found rider: ${rider.fullName} (${rider.email})`);

    // Get Lagos time
    const now = getLagosTime();
    console.log(
      `\n🕐 Current Lagos time: ${now.toLocaleString("en-NG", {
        timeZone: "Africa/Lagos",
      })}`
    );

    // Get LAST week range (to create a pending payout that shows payment button)
    // Last week ended on Saturday, so weekEnd is Sunday 00:00:00
    const lastWeekDate = new Date(now);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7); // Go back 7 days to last week
    const { start: lastWeekStart, end: lastWeekEnd } =
      getWeekRange(lastWeekDate);

    // Also get current week for reference
    const { start: currentWeekStart, end: currentWeekEnd } = getWeekRange();

    console.log(
      `\n📅 Last week (for pending payout): ${lastWeekStart.toLocaleDateString()} - ${lastWeekEnd.toLocaleDateString()}`
    );
    console.log(
      `📅 Current week: ${currentWeekStart.toLocaleDateString()} - ${currentWeekEnd.toLocaleDateString()}`
    );

    // Calculate payment dates for last week
    const paymentDueDate = getPaymentDueDate(lastWeekEnd);
    const graceDeadline = getPaymentGraceDeadline(lastWeekEnd);
    const daysUntilDue = Math.ceil(
      (paymentDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUntilGrace = Math.ceil(
      (graceDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`\n💰 Payment Schedule for Last Week:`);
    console.log(
      `   Payment Due: ${paymentDueDate.toLocaleString("en-NG", {
        timeZone: "Africa/Lagos",
      })}`
    );
    console.log(
      `   Grace Deadline: ${graceDeadline.toLocaleString("en-NG", {
        timeZone: "Africa/Lagos",
      })}`
    );
    console.log(`   Days until due: ${daysUntilDue}`);
    console.log(`   Days until grace deadline: ${daysUntilGrace}`);

    if (daysUntilDue <= 0 && daysUntilGrace > 0) {
      console.log(
        `   ✅ Payment is DUE and in GRACE PERIOD - Payment button will show!`
      );
    } else if (daysUntilDue <= 0 && daysUntilGrace <= 0) {
      console.log(`   ⚠️ Payment is OVERDUE - Payment button will show!`);
    } else {
      console.log(`   ℹ️ Payment not yet due - Button will show when due`);
    }

    // Real Lagos addresses for testing (prices will be calculated from Mapbox distance)
    const lagosAddresses = [
      // Courier orders - popular Lagos locations
      {
        pickup: "Victoria Island, Lagos, Nigeria",
        dropoff: "Ikeja, Lagos, Nigeria",
        serviceType: "courier",
        preferredVehicleType: "motorbike",
        items: "Documents Delivery to Ikeja",
        deliveredAt: new Date(
          lastWeekStart.getTime() + 1 * 24 * 60 * 60 * 1000
        ), // Monday of last week
      },
      {
        pickup: "Lekki Phase 1, Lagos, Nigeria",
        dropoff: "Surulere, Lagos, Nigeria",
        serviceType: "courier",
        preferredVehicleType: "motorbike",
        items: "Package Delivery to Surulere",
        deliveredAt: new Date(
          lastWeekStart.getTime() + 2 * 24 * 60 * 60 * 1000
        ), // Tuesday of last week
      },
      {
        pickup: "Ikoyi, Lagos, Nigeria",
        dropoff: "Yaba, Lagos, Nigeria",
        serviceType: "courier",
        preferredVehicleType: "motorbike",
        items: "Express Courier to Yaba",
        deliveredAt: new Date(
          lastWeekStart.getTime() + 3 * 24 * 60 * 60 * 1000
        ), // Wednesday of last week
      },
      // Ride orders - popular Lagos locations
      {
        pickup: "Lagos Island, Lagos, Nigeria",
        dropoff: "Gbagada, Lagos, Nigeria",
        serviceType: "ride",
        preferredVehicleType: "car_standard",
        items: "Ride to Gbagada",
        deliveredAt: new Date(
          lastWeekStart.getTime() + 4 * 24 * 60 * 60 * 1000
        ), // Thursday of last week
      },
      {
        pickup: "Maryland, Lagos, Nigeria",
        dropoff: "Banana Island, Lagos, Nigeria",
        serviceType: "ride",
        preferredVehicleType: "car_comfort",
        items: "Comfort Ride to Banana Island",
        deliveredAt: new Date(
          lastWeekStart.getTime() + 5 * 24 * 60 * 60 * 1000
        ), // Friday of last week
      },
      {
        pickup: "Ajah, Lagos, Nigeria",
        dropoff: "Victoria Island, Lagos, Nigeria",
        serviceType: "ride",
        preferredVehicleType: "car_premium",
        items: "Premium Ride to Victoria Island",
        deliveredAt: new Date(
          lastWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
        ), // Saturday of last week
      },
    ];

    console.log("\n📦 Creating test orders with real Lagos addresses...");
    console.log("   🔍 Geocoding addresses using Mapbox...\n");
    const createdOrders = [];

    for (const orderData of lagosAddresses) {
      try {
        // Geocode pickup address
        console.log(`   📍 Geocoding: ${orderData.pickup}`);
        const pickupGeo = await geocodeMapboxAddress(orderData.pickup);
        if (!pickupGeo) {
          console.error(`   ❌ Failed to geocode pickup: ${orderData.pickup}`);
          continue;
        }

        // Geocode dropoff address
        console.log(`   📍 Geocoding: ${orderData.dropoff}`);
        const dropoffGeo = await geocodeMapboxAddress(orderData.dropoff);
        if (!dropoffGeo) {
          console.error(
            `   ❌ Failed to geocode dropoff: ${orderData.dropoff}`
          );
          continue;
        }

        // Calculate distance using Mapbox routing
        console.log(`   🗺️ Calculating distance using Mapbox routing...`);
        const distanceKm = await calculateRoadDistance(
          pickupGeo.lat,
          pickupGeo.lng,
          dropoffGeo.lat,
          dropoffGeo.lng
        );

        if (!distanceKm || distanceKm <= 0) {
          console.error(`   ❌ Failed to calculate distance`);
          continue;
        }

        console.log(`   📏 Distance: ${distanceKm.toFixed(2)} km`);

        // Calculate price based on distance and vehicle type
        const calculatedPrice = await calculateDeliveryPrice(
          distanceKm,
          orderData.preferredVehicleType
        );
        console.log(
          `   💰 Calculated price: ₦${calculatedPrice.toLocaleString()}`
        );

        const commissionRate = 0.1; // 10% commission
        const commissionAmount = calculatedPrice * commissionRate;
        const riderNetAmount = calculatedPrice - commissionAmount;

        const order = await Order.create({
          customerId: customer._id,
          riderId: rider._id,
          pickup: {
            address: pickupGeo.formatted || orderData.pickup,
            lat: pickupGeo.lat,
            lng: pickupGeo.lng,
          },
          dropoff: {
            address: dropoffGeo.formatted || orderData.dropoff,
            lat: dropoffGeo.lat,
            lng: dropoffGeo.lng,
          },
          items: orderData.items,
          serviceType: orderData.serviceType,
          preferredVehicleType: orderData.preferredVehicleType,
          price: calculatedPrice,
          originalPrice: calculatedPrice,
          meta: {
            distanceKm: Math.round(distanceKm * 10) / 10,
          },
          status: "delivered",
          delivery: {
            deliveredAt: orderData.deliveredAt,
          },
          financial: {
            grossAmount: calculatedPrice,
            commissionRatePct: commissionRate * 100,
            commissionAmount: commissionAmount,
            riderNetAmount: riderNetAmount,
          },
          timeline: [
            {
              status: "pending",
              at: new Date(
                orderData.deliveredAt.getTime() - 2 * 60 * 60 * 1000
              ),
            },
            {
              status: "assigned",
              at: new Date(
                orderData.deliveredAt.getTime() - 1 * 60 * 60 * 1000
              ),
            },
            {
              status: "delivered",
              at: orderData.deliveredAt,
            },
          ],
          payment: {
            method: "cash",
            status: "paid",
          },
        });

        createdOrders.push(order);
        console.log(
          `   ✅ Created ${orderData.serviceType} order: ${orderData.items}`
        );
        console.log(`      From: ${pickupGeo.formatted || orderData.pickup}`);
        console.log(`      To: ${dropoffGeo.formatted || orderData.dropoff}`);
        console.log(`      Distance: ${distanceKm.toFixed(2)} km`);
        console.log(
          `      Price: ₦${calculatedPrice.toLocaleString()} (Net: ₦${riderNetAmount.toLocaleString()})\n`
        );
      } catch (error) {
        console.error(`   ❌ Error creating order: ${error.message}`);
        continue;
      }
    }

    if (createdOrders.length === 0) {
      console.error(
        "\n❌ No orders were created. Please check the errors above."
      );
      await mongoose.disconnect();
      process.exit(1);
    }

    // Summary
    const courierOrders = createdOrders.filter(
      (o) => o.serviceType === "courier"
    );
    const rideOrders = createdOrders.filter((o) => o.serviceType === "ride");

    const courierTotal = courierOrders.reduce(
      (sum, o) => sum + (o.financial?.riderNetAmount || 0),
      0
    );
    const rideTotal = rideOrders.reduce(
      (sum, o) => sum + (o.financial?.riderNetAmount || 0),
      0
    );

    console.log("\n📊 Summary:");
    console.log(
      `   Courier Orders: ${
        courierOrders.length
      } (Total Net: ₦${courierTotal.toLocaleString()})`
    );
    console.log(
      `   Ride Orders: ${
        rideOrders.length
      } (Total Net: ₦${rideTotal.toLocaleString()})`
    );
    console.log(
      `   Grand Total: ₦${(courierTotal + rideTotal).toLocaleString()}`
    );

    // Create or update payout for LAST WEEK (pending) so payment button shows
    console.log(
      "\n💵 Creating/updating payout for LAST WEEK (pending status)..."
    );
    const totals = createdOrders.reduce(
      (acc, order) => {
        acc.gross += order.financial?.grossAmount || 0;
        acc.commission += order.financial?.commissionAmount || 0;
        acc.riderNet += order.financial?.riderNetAmount || 0;
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

    // Create payout for LAST WEEK with status "pending" - this will trigger payment button
    const payout = await RiderPayout.findOneAndUpdate(
      { riderId: rider._id, weekStart: lastWeekStart },
      {
        riderId: rider._id,
        weekStart: lastWeekStart,
        weekEnd: lastWeekEnd,
        orders: createdOrders.map((order) => ({
          orderId: order._id,
          deliveredAt: order.delivery?.deliveredAt || order.createdAt,
          grossAmount: order.financial?.grossAmount || 0,
          commissionAmount: order.financial?.commissionAmount || 0,
          riderNetAmount: order.financial?.riderNetAmount || 0,
          serviceType: order.serviceType || "courier",
        })),
        totals,
        paymentReferenceCode,
        status: "pending", // This is key - pending status triggers payment button
      },
      { upsert: true, new: true }
    );

    console.log(
      `   ✅ Payout created/updated for LAST WEEK ${lastWeekStart.toLocaleDateString()} - ${lastWeekEnd.toLocaleDateString()}`
    );
    console.log(`   📊 Payout Totals:`);
    console.log(`      Gross: ₦${totals.gross.toLocaleString()}`);
    console.log(`      Commission: ₦${totals.commission.toLocaleString()}`);
    console.log(`      Rider Net: ₦${totals.riderNet.toLocaleString()}`);
    console.log(`      Orders: ${totals.count}`);
    console.log(`   🔑 Reference Code: ${paymentReferenceCode}`);
    console.log(
      `   📌 Status: ${payout.status} (This will trigger payment button!)`
    );

    console.log("\n✅ Test orders created successfully!");
    console.log("\n💡 Next steps:");
    console.log(
      "   1. Check the Deliveries page as the rider - you should see:"
    );
    console.log("      - Delivered Orders section with all 6 orders");
    console.log("      - Service type badges (Courier/Ride) on each order");
    console.log("   2. Check the Earnings page as the rider - you should see:");
    console.log(
      "      - Payment button: 'Pay Previous Week Commission' (if payment is due)"
    );
    console.log("      - Pending payout from last week");
    console.log(
      "      - Test the service type filters (All Services, Courier, Ride)"
    );
    console.log("      - Verify filtering works for:");
    console.log(
      "        * This Week section (may be empty if no current week orders)"
    );
    console.log(
      "        * This Month section (should show last week's orders)"
    );
    console.log("        * All Time section (should show all orders)");
    console.log("   3. Expected totals when filter is 'All Services':");
    console.log(
      `      - Courier: ₦${courierTotal.toLocaleString()} (${
        courierOrders.length
      } orders)`
    );
    console.log(
      `      - Ride: ₦${rideTotal.toLocaleString()} (${
        rideOrders.length
      } orders)`
    );
    console.log(
      `      - Total: ₦${(courierTotal + rideTotal).toLocaleString()}`
    );
    console.log("\n🎯 Payment Button Status:");
    if (daysUntilDue <= 0 && daysUntilGrace > 0) {
      console.log(
        "   ✅ Payment button SHOULD BE VISIBLE (Payment due, in grace period)"
      );
    } else if (daysUntilDue <= 0 && daysUntilGrace <= 0) {
      console.log("   ✅ Payment button SHOULD BE VISIBLE (Payment overdue)");
    } else {
      console.log(
        `   ⏳ Payment button will appear in ${Math.abs(daysUntilDue)} days`
      );
    }

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createTestServiceTypeOrders();

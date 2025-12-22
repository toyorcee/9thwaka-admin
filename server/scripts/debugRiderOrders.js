/**
 * Debug Script: Check Rider Orders, Address, and KYC Status
 *
 * Usage: node server/scripts/debugRiderOrders.js [riderId]
 *
 * This script helps debug why riders might not see orders:
 * 1. Checks rider's address
 * 2. Checks rider's KYC status
 * 3. Checks rider's online status and location
 * 4. Lists all pending orders
 * 5. Calculates distances from rider to orders
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import RiderLocation from "../models/RiderLocation.js";
import User from "../models/User.js";
import {
  calculateDistance,
  geocodeAddress,
} from "../services/geocodingService.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const checkRiderStatus = async (riderId) => {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 RIDER STATUS CHECK");
  console.log("=".repeat(60));

  const rider = await User.findById(riderId).select(
    "fullName email role address searchRadiusKm supportedServices nin ninVerified address driverLicenseNumber driverLicensePicture driverLicenseVerified vehiclePicture vehicleType vehicleYear hasAirConditioning"
  );

  if (!rider) {
    console.log(`❌ Rider not found with ID: ${riderId}`);
    return null;
  }

  console.log(`\n👤 Rider: ${rider.fullName || rider.email}`);
  console.log(`📧 Email: ${rider.email}`);
  console.log(`🎭 Role: ${rider.role}`);

  // Address Check
  console.log(`\n📍 ADDRESS:`);
  if (rider.address) {
    console.log(`   Address: ${rider.address}`);
    try {
      const geocoded = await geocodeAddress(rider.address);
      if (geocoded) {
        console.log(`   Geocoded: Lat ${geocoded.lat}, Lng ${geocoded.lng}`);
      } else {
        console.log(`   ⚠️  Could not geocode address`);
      }
    } catch (error) {
      console.log(`   ⚠️  Geocoding error: ${error.message}`);
    }
  } else {
    console.log(`   ❌ No address set`);
  }

  // Search Radius
  console.log(`\n📏 SEARCH RADIUS:`);
  console.log(
    `   Radius: ${rider.searchRadiusKm || "Not set (using default)"} km`
  );

  // Supported Services
  console.log(`\n🚗 SUPPORTED SERVICES:`);
  const services = rider.supportedServices || ["courier", "ride"];
  console.log(`   Services: ${services.join(", ")}`);

  // KYC Status
  console.log(`\n✅ KYC STATUS:`);
  const hasNin = rider.nin && rider.nin.trim().length > 0;
  const ninVerified = rider.ninVerified === true;
  const hasAddress = rider.address && rider.address.trim().length > 0;
  const hasDriverLicenseNumber =
    rider.driverLicenseNumber && rider.driverLicenseNumber.trim().length > 0;
  const hasDriverLicensePicture =
    rider.driverLicensePicture && rider.driverLicensePicture.trim().length > 0;
  const driverLicenseVerified = rider.driverLicenseVerified === true;
  const hasVehiclePicture =
    rider.vehiclePicture && rider.vehiclePicture.trim().length > 0;
  const hasVehicleType =
    rider.vehicleType && rider.vehicleType.trim().length > 0;

  console.log(
    `   NIN: ${hasNin ? "✅ Set" : "❌ Not set"} ${
      ninVerified ? "(Verified)" : "(Not verified)"
    }`
  );
  console.log(`   Address: ${hasAddress ? "✅ Set" : "❌ Not set"}`);
  console.log(
    `   Driver License Number: ${
      hasDriverLicenseNumber ? "✅ Set" : "❌ Not set"
    }`
  );
  console.log(
    `   Driver License Picture: ${
      hasDriverLicensePicture ? "✅ Set" : "❌ Not set"
    } ${driverLicenseVerified ? "(Verified)" : "(Not verified)"}`
  );
  console.log(
    `   Vehicle Picture: ${hasVehiclePicture ? "✅ Set" : "❌ Not set"}`
  );
  console.log(
    `   Vehicle Type: ${
      hasVehicleType ? `✅ ${rider.vehicleType}` : "❌ Not set"
    }`
  );

  if (
    rider.vehicleType &&
    (rider.vehicleType === "car_standard" ||
      rider.vehicleType === "car_comfort" ||
      rider.vehicleType === "car_premium")
  ) {
    console.log(
      `   Vehicle Year: ${
        rider.vehicleYear ? `✅ ${rider.vehicleYear}` : "❌ Not set"
      }`
    );
    console.log(
      `   Has AC: ${
        rider.hasAirConditioning !== null
          ? `✅ ${rider.hasAirConditioning}`
          : "❌ Not set"
      }`
    );
  }

  const isKycComplete =
    ninVerified &&
    hasAddress &&
    hasDriverLicenseNumber &&
    hasDriverLicensePicture &&
    driverLicenseVerified &&
    hasVehiclePicture;
  console.log(`\n   🎯 KYC Complete: ${isKycComplete ? "✅ YES" : "❌ NO"}`);

  // Online Status & Location
  console.log(`\n🌐 ONLINE STATUS & LOCATION:`);
  const riderLocation = await RiderLocation.findOne({
    riderId: riderId,
    online: true,
  });

  if (riderLocation) {
    console.log(`   Status: ✅ ONLINE`);
    if (riderLocation.location && riderLocation.location.coordinates) {
      const [lng, lat] = riderLocation.location.coordinates;
      console.log(`   GPS Location: Lat ${lat}, Lng ${lng}`);
      console.log(`   Last Updated: ${riderLocation.updatedAt}`);
    } else {
      console.log(`   ⚠️  No GPS coordinates available`);
    }
  } else {
    console.log(`   Status: ❌ OFFLINE`);
    console.log(`   ⚠️  Rider must be ONLINE to see orders!`);
  }

  return { rider, riderLocation, isKycComplete };
};

const checkPendingOrders = async (rider) => {
  console.log(`\n` + "=".repeat(60));
  console.log("📦 PENDING ORDERS");
  console.log("=".repeat(60));

  const riderSupportedServices = rider.supportedServices || ["courier", "ride"];
  console.log(`\n🔍 Filtering orders by:`);
  console.log(`   Service Types: ${riderSupportedServices.join(", ")}`);
  console.log(`   Status: pending`);
  console.log(`   Unassigned: riderId is null`);

  const orders = await Order.find({
    status: "pending",
    riderId: null,
    serviceType: { $in: riderSupportedServices },
  })
    .select(
      "_id serviceType pickup dropoff price createdAt customerId preferredVehicleType"
    )
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  console.log(
    `\n📊 Found ${
      orders.length
    } pending orders matching rider's services (${riderSupportedServices.join(
      ", "
    )})`
  );

  if (orders.length === 0) {
    console.log(`\n   ℹ️  No pending orders available`);
    return [];
  }

  // Get rider's GPS location if available
  const riderLocation = await RiderLocation.findOne({
    riderId: rider._id,
    online: true,
  });

  let riderLat = null;
  let riderLng = null;
  if (riderLocation?.location?.coordinates) {
    [riderLng, riderLat] = riderLocation.location.coordinates;
  }

  console.log(`\n📋 ORDER DETAILS:\n`);

  // Try to get rider location from address if not online
  let riderLatFromAddress = null;
  let riderLngFromAddress = null;
  if (!riderLat && !riderLng && rider.address) {
    try {
      const geocoded = await geocodeAddress(rider.address);
      if (geocoded && geocoded.lat && geocoded.lng) {
        riderLatFromAddress = geocoded.lat;
        riderLngFromAddress = geocoded.lng;
        console.log(
          `\n📍 Rider Address Geocoded: Lat ${riderLatFromAddress}, Lng ${riderLngFromAddress}`
        );
      }
    } catch (error) {
      console.log(`\n⚠️  Could not geocode rider address: ${error.message}`);
    }
  }

  const effectiveRiderLat = riderLat || riderLatFromAddress;
  const effectiveRiderLng = riderLng || riderLngFromAddress;

  let ordersWithCoords = 0;
  let ordersWithoutCoords = 0;
  let ordersInRadius = 0;
  let ordersOutOfRadius = 0;

  for (const order of orders) {
    console.log(`\n   Order ID: ${order._id}`);
    console.log(`   Service: ${order.serviceType}`);
    console.log(`   Preferred Vehicle: ${order.preferredVehicleType || "Any"}`);
    console.log(`   Pickup Address: ${order.pickup?.address || "N/A"}`);

    // Check if order has pickup coordinates
    const hasPickupCoords =
      order.pickup?.lat &&
      order.pickup?.lng &&
      typeof order.pickup.lat === "number" &&
      typeof order.pickup.lng === "number" &&
      !isNaN(order.pickup.lat) &&
      !isNaN(order.pickup.lng);

    if (hasPickupCoords) {
      ordersWithCoords++;
      console.log(
        `   Pickup Coords: ✅ Lat ${order.pickup.lat}, Lng ${order.pickup.lng}`
      );

      if (effectiveRiderLat && effectiveRiderLng) {
        const distance = calculateDistance(
          effectiveRiderLat,
          effectiveRiderLng,
          order.pickup.lat,
          order.pickup.lng
        );
        const riderRadius = rider.searchRadiusKm || 7;
        const withinRadius = distance <= riderRadius;

        if (withinRadius) {
          ordersInRadius++;
          console.log(
            `   Distance: ${distance.toFixed(
              2
            )} km ✅ WITHIN RADIUS (Rider radius: ${riderRadius} km)`
          );
          console.log(`   ✅ THIS ORDER SHOULD BE VISIBLE TO RIDER`);
        } else {
          ordersOutOfRadius++;
          console.log(
            `   Distance: ${distance.toFixed(
              2
            )} km ❌ OUTSIDE RADIUS (Rider radius: ${riderRadius} km)`
          );
          console.log(
            `   ⚠️  Order is ${(distance - riderRadius).toFixed(
              2
            )} km outside your search radius`
          );
          console.log(
            `   💡 Try increasing search radius or enable "Show All Orders"`
          );
        }
      } else {
        console.log(
          `   Distance: ⚠️  Cannot calculate - rider has no GPS location and address geocoding failed`
        );
        console.log(
          `   💡 Rider needs to go ONLINE with GPS enabled to see this order`
        );
      }
    } else {
      ordersWithoutCoords++;
      console.log(`   Pickup Coords: ❌ NOT AVAILABLE`);
      console.log(
        `   ⚠️  CRITICAL: This order cannot be matched to riders without pickup coordinates`
      );
      console.log(
        `   💡 Order needs to be created with proper location coordinates`
      );
      if (order.pickup) {
        console.log(`   Pickup object: ${JSON.stringify(order.pickup)}`);
      }
    }

    console.log(`   Dropoff: ${order.dropoff?.address || "N/A"}`);
    if (order.dropoff?.lat && order.dropoff?.lng) {
      console.log(
        `   Dropoff Coords: Lat ${order.dropoff.lat}, Lng ${order.dropoff.lng}`
      );
    }
    console.log(`   Price: ₦${order.price || 0}`);
    console.log(`   Created: ${new Date(order.createdAt).toLocaleString()}`);
    console.log(`   ---`);
  }

  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total Orders Found: ${orders.length}`);
  console.log(`   Orders WITH pickup coordinates: ${ordersWithCoords}`);
  console.log(
    `   Orders WITHOUT pickup coordinates: ${ordersWithoutCoords} ${
      ordersWithoutCoords > 0 ? "❌" : ""
    }`
  );
  if (effectiveRiderLat && effectiveRiderLng) {
    console.log(`   Orders within radius: ${ordersInRadius}`);
    console.log(`   Orders outside radius: ${ordersOutOfRadius}`);
  }

  return orders;
};

const main = async () => {
  await connectDB();

  const riderId = process.argv[2];

  if (!riderId) {
    console.log("❌ Please provide a rider ID");
    console.log("Usage: node server/scripts/debugRiderOrders.js <riderId>");
    process.exit(1);
  }

  try {
    const result = await checkRiderStatus(riderId);
    if (result) {
      await checkPendingOrders(result.rider);
    }

    console.log(`\n` + "=".repeat(60));
    console.log("✅ DEBUG COMPLETE");
    console.log("=".repeat(60));
    console.log(`\n💡 KEY INSIGHTS:`);
    console.log(
      `   1. Rider must be ONLINE with GPS location OR have geocodable address`
    );
    console.log(
      `   2. Address text matching does NOT work - system uses GPS coordinates only`
    );
    console.log(
      `   3. Orders MUST have pickup coordinates (lat/lng) to be visible to riders`
    );
    console.log(
      `   4. Orders are filtered by serviceType matching rider's supportedServices`
    );
    console.log(
      `   5. Distance is calculated from rider's location (GPS or geocoded address) to order pickup`
    );
    console.log(
      `   6. Orders outside rider's searchRadiusKm will NOT be shown`
    );
    console.log(
      `   7. KYC incomplete riders CAN see orders but CANNOT accept them`
    );
    console.log(`\n🔍 COMMON ISSUES:`);
    console.log(
      `   • Rider offline + address geocoding fails = No orders visible`
    );
    console.log(
      `   • Order pickup has no coordinates = Order invisible to all riders`
    );
    console.log(`   • Distance > searchRadiusKm = Order filtered out`);
    console.log(`   • Service type mismatch = Order filtered out`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

main();

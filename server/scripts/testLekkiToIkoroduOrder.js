import dotenv from "dotenv";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import RiderLocation from "../models/RiderLocation.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import { calculateDistance } from "../services/geocodingService.js";
import { calculateMapboxDistance } from "../services/mapboxService.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/9thwaka";

const pickup = {
  address: "Lekki Phase 1, Lagos, Nigeria",
  lat: 6.453056,
  lng: 3.395833,
};

const dropoff = {
  address: "Benson Bus Stop, Ikorodu, Lagos, Nigeria",
  lat: 6.61308,
  lng: 3.50141,
};

const serviceType = "courier";

async function main() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    const customer =
      (await User.findOne({ role: "customer" })) ||
      (await User.findOne({}));

    if (!customer) {
      console.error("❌ No customer found in database");
      process.exit(1);
    }

    console.log(
      `👤 Using customer: ${customer.fullName || customer.email} (${customer._id})`
    );

    let distanceKm = null;

    try {
      const route = await calculateMapboxDistance(
        [pickup.lng, pickup.lat],
        [dropoff.lng, dropoff.lat]
      );
      if (route && typeof route.distanceKm === "number") {
        distanceKm = route.distanceKm;
      }
    } catch (error) {
      console.error("⚠️ Failed to calculate route distance:", error.message);
    }

    let price = 1000;
    if (distanceKm && distanceKm > 0) {
      price = Math.max(800, Math.round(800 + distanceKm * 100));
    }

    console.log("\n🔍 Finding nearby riders for pickup location...");

    let nearbyRiders = [];
    try {
      const settings = await Settings.getSettings();
      const defaultRadius =
        settings.system?.defaultSearchRadiusKm ??
        Number(process.env.RIDER_ORDER_RADIUS_KM || 7);
      const maxNotificationRadius =
        settings.system?.maxAllowedRadiusKm ??
        Number(process.env.MAX_RIDER_RADIUS_KM || 30);

      const onlineRiders = await RiderLocation.find({
        online: true,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [pickup.lng, pickup.lat],
            },
            $maxDistance: maxNotificationRadius * 1000,
          },
        },
      })
        .populate({
          path: "riderId",
          select:
            "searchRadiusKm _id supportedServices role fullName vehicleType",
        })
        .lean();

      console.log(
        `   Online riders within ${maxNotificationRadius}km search window: ${onlineRiders.length}`
      );

      for (const riderLoc of onlineRiders) {
        if (!riderLoc.riderId || !riderLoc.location?.coordinates) {
          console.log("   - Skipping rider: missing riderId or coordinates");
          continue;
        }

        const rider = riderLoc.riderId;
        const riderName = rider.fullName || "Unknown";
        const riderServices =
          Array.isArray(rider?.supportedServices) &&
          rider.supportedServices.length
            ? rider.supportedServices
            : ["courier", "ride"];

        console.log(
          `   - Checking rider: ${riderName} [services: ${riderServices.join(
            ", "
          )}]`
        );

        if (serviceType && !riderServices.includes(serviceType)) {
          console.log(
            `     → SKIP: serviceType "${serviceType}" not in rider services`
          );
          continue;
        }

        const riderRadius =
          (typeof rider === "object" && rider?.searchRadiusKm) ||
          defaultRadius;
        const effectiveRadius = Math.min(riderRadius, maxNotificationRadius);

        const [riderLng, riderLat] = riderLoc.location.coordinates;
        if (
          typeof riderLat !== "number" ||
          typeof riderLng !== "number" ||
          isNaN(riderLat) ||
          isNaN(riderLng)
        ) {
          console.log("     → SKIP: invalid rider coordinates");
          continue;
        }

        const distanceToPickup = calculateDistance(
          pickup.lat,
          pickup.lng,
          riderLat,
          riderLng
        );

        console.log(
          `     → distance ${distanceToPickup}km, radius ${effectiveRadius}km`
        );

        if (distanceToPickup <= effectiveRadius) {
          console.log("     → INCLUDE as nearby rider");
          nearbyRiders.push({
            riderId: rider._id?.toString() || rider.toString(),
            name: riderName,
            vehicleType: rider.vehicleType || null,
            services: riderServices,
            distanceKm: distanceToPickup,
          });
        } else {
          console.log(
            "     → SKIP: distance greater than rider search radius"
          );
        }
      }

      nearbyRiders = nearbyRiders.sort(
        (a, b) => a.distanceKm - b.distanceKm
      );

      if (nearbyRiders.length === 0) {
        console.log(
          "   ⚠️ No nearby riders found for this pickup location and service type"
        );
      } else {
        console.log(
          `   ✅ Found ${nearbyRiders.length} nearby rider(s) within radius:`
        );
        for (const rider of nearbyRiders.slice(0, 10)) {
          console.log(
            `     - ${rider.name} (${rider.vehicleType || "unknown vehicle"}) • ${rider.distanceKm}km away • services: ${rider.services.join(
              ", "
            )}`
          );
        }
      }
    } catch (error) {
      console.error(
        "⚠️ Failed to search for nearby riders:",
        error.message
      );
    }

    console.log(
      "\nCreating courier order Lekki Phase 1 → Benson Ikorodu with:",
      {
        distanceKm,
        price,
      }
    );

    const order = await Order.create({
      customerId: customer._id,
      riderId: null,
      pickup,
      dropoff,
      items: "Food items from Lekki to Ikorodu",
      packageCategory: "food",
      preferredVehicleType: "motorbike",
      serviceType,
      price,
      originalPrice: price,
      status: "pending",
      meta: distanceKm ? { distanceKm } : {},
      payment: {
        method: "cash",
        status: "pending",
      },
    });

    console.log("✅ Order created:", {
      id: order._id,
      serviceType: order.serviceType,
      price: order.price,
      packageCategory: order.packageCategory,
      items: order.items,
      distanceKm: order.meta?.distanceKm || null,
    });

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (err) {
    console.error("Error running test script:", err);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
}

main();

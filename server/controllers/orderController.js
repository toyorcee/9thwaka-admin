import { SocketEvents } from "../constants/socketEvents.js";
import Order from "../models/Order.js";
import RiderLocation from "../models/RiderLocation.js";
import RiderPayout from "../models/RiderPayout.js";
import Service from "../models/Service.js";
import Settings from "../models/Settings.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { io } from "../server.js";
import { buildDarkEmailTemplate } from "../services/emailTemplates.js";
import {
  calculateDistance,
  geocodeAddress,
} from "../services/geocodingService.js";
import { createAndSendNotification } from "../services/notificationService.js";
import { calculateRoadDistance } from "../services/routingService.js";
import { getWeekRange } from "../utils/weekUtils.js";
import { applyGoldStatusDiscount } from "./goldStatusController.js";

const appendTimeline = (order, status, note) => {
  order.timeline.push({ status, note, at: new Date() });
};

/**
 * Calculate commission and financial breakdown for an order
 * Uses Settings.commissionRate (with env fallback) and saves to order.financial
 * Applies Gold Status discount to commission for riders with active Gold Status
 */
const calculateOrderFinancials = async (order) => {
  try {
    const settings = await Settings.getSettings();
    const commissionRate =
      settings.commissionRate ||
      Number(process.env.COMMISSION_RATE_PERCENT || 10);
    const gross = Number(order.price) || 0;

    let commission = Math.round(((gross * commissionRate) / 100) * 100) / 100;

    if (order.riderId && order.serviceType === "ride") {
      try {
        const discountedCommission = await applyGoldStatusDiscount(
          commission,
          order.riderId
        );
        if (
          discountedCommission !== undefined &&
          discountedCommission !== null &&
          !isNaN(discountedCommission) &&
          discountedCommission >= 0
        ) {
          commission = discountedCommission;
        }
      } catch (goldStatusError) {
        console.error(
          "[ORDER] Failed to apply Gold Status discount:",
          goldStatusError
        );
      }
    }

    const riderNet = Math.round((gross - commission) * 100) / 100;

    const finalCommission = Math.max(0, commission);
    const finalRiderNet = Math.max(0, riderNet);

    order.financial = {
      grossAmount: gross,
      commissionRatePct: commissionRate,
      commissionAmount: finalCommission,
      riderNetAmount: finalRiderNet,
    };

    return {
      gross,
      commissionRate,
      commission: finalCommission,
      riderNet: finalRiderNet,
    };
  } catch (error) {
    console.error("[ORDER] Failed to calculate financials:", error.message);
    const commissionRate = Number(process.env.COMMISSION_RATE_PERCENT || 10);
    const gross = Number(order.price) || 0;
    const commission = Math.round(((gross * commissionRate) / 100) * 100) / 100;
    const riderNet = Math.round((gross - commission) * 100) / 100;

    const finalCommission = Math.max(0, commission);
    const finalRiderNet = Math.max(0, riderNet);

    order.financial = {
      grossAmount: gross,
      commissionRatePct: commissionRate,
      commissionAmount: finalCommission,
      riderNetAmount: finalRiderNet,
    };

    return {
      gross,
      commissionRate,
      commission: finalCommission,
      riderNet: finalRiderNet,
    };
  }
};

/**
 * Update rider payout for the week when an order is delivered
 * This ensures earnings are automatically tracked and calculated
 */
const updateRiderPayoutForOrder = async (order) => {
  if (!order.riderId || !order.financial || order.status !== "delivered") {
    return;
  }

  try {
    const deliveredAt = order.delivery?.deliveredAt || new Date();
    const { start, end } = getWeekRange(deliveredAt);

    // Find or create payout for this week
    let payout = await RiderPayout.findOne({
      riderId: order.riderId,
      weekStart: start,
    });

    if (!payout) {
      // Generate unique payment reference code
      // Format: 9W + Rider ID (first 6 chars) + Week timestamp (last 6 digits) + Random (2 chars)
      const riderIdShort = String(order.riderId).slice(-6).toUpperCase();
      const weekTimestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 4).toUpperCase();
      const paymentReferenceCode = `9W${riderIdShort}${weekTimestamp}${random}`;

      // Create new payout record
      payout = await RiderPayout.create({
        riderId: order.riderId,
        weekStart: start,
        weekEnd: end,
        orders: [],
        totals: {
          gross: 0,
          commission: 0,
          riderNet: 0,
          count: 0,
        },
        paymentReferenceCode,
      });
    }

    // Check if this order is already in the payout
    const orderExists = payout.orders.some(
      (o) => String(o.orderId) === String(order._id)
    );

    if (!orderExists) {
      // Add order to payout
      payout.orders.push({
        orderId: order._id,
        deliveredAt: deliveredAt,
        grossAmount: order.financial.grossAmount || 0,
        commissionAmount: order.financial.commissionAmount || 0,
        riderNetAmount: order.financial.riderNetAmount || 0,
        serviceType: order.serviceType || "courier",
      });

      // Recalculate totals
      payout.totals = payout.orders.reduce(
        (acc, o) => {
          acc.gross += o.grossAmount || 0;
          acc.commission += o.commissionAmount || 0;
          acc.riderNet += o.riderNetAmount || 0;
          acc.count += 1;
          return acc;
        },
        { gross: 0, commission: 0, riderNet: 0, count: 0 }
      );

      await payout.save();
    }
  } catch (error) {
    console.error("[ORDER] Failed to update rider payout:", error.message);
    // Don't fail the order completion if payout update fails
  }
};

/**
 * Get pricing rates from database or environment variables
 * Uses database settings if useDatabaseRates is true, otherwise falls back to env vars
 */
const ensureCarTierMultipliers = (multipliers = {}) => {
  const baseCar =
    multipliers.car_standard ??
    multipliers.car ??
    Number(process.env.PRICE_CAR_STANDARD_MULTIPLIER) ??
    1.25;

  const comfort =
    multipliers.car_comfort ??
    Number(process.env.PRICE_CAR_COMFORT_MULTIPLIER) ??
    baseCar * 1.12;

  const premium =
    multipliers.car_premium ??
    Number(process.env.PRICE_CAR_PREMIUM_MULTIPLIER) ??
    baseCar * 1.24;

  return {
    ...multipliers,
    car_standard: baseCar,
    car_comfort: comfort,
    car_premium: premium,
    car: multipliers.car ?? baseCar,
  };
};

const getPricingRates = async () => {
  try {
    const settings = await Settings.getSettings();

    if (settings.system.useDatabaseRates) {
      const vehicleMultipliers = ensureCarTierMultipliers(
        settings.pricing.vehicleMultipliers || {}
      );

      return {
        MIN_FARE: settings.pricing.minFare,
        PER_KM_SHORT: settings.pricing.perKmShort,
        PER_KM_MEDIUM: settings.pricing.perKmMedium,
        PER_KM_LONG: settings.pricing.perKmLong,
        SHORT_DISTANCE_MAX: settings.pricing.shortDistanceMax,
        MEDIUM_DISTANCE_MAX: settings.pricing.mediumDistanceMax,
        VEHICLE_MULTIPLIERS: vehicleMultipliers,
      };
    }
  } catch (error) {
    console.warn(
      "[PRICING] Failed to load database rates, using env vars:",
      error.message
    );
  }

  // Fallback to environment variables
  const envMultipliers = ensureCarTierMultipliers({
    bicycle: Number(process.env.PRICE_BICYCLE_MULTIPLIER) || 0.8,
    motorbike: Number(process.env.PRICE_MOTORBIKE_MULTIPLIER) || 1.0,
    tricycle: Number(process.env.PRICE_TRICYCLE_MULTIPLIER) || 1.15,
    van: Number(process.env.PRICE_VAN_MULTIPLIER) || 1.5,
  });

  return {
    MIN_FARE: Number(process.env.PRICE_MIN_FARE) || 800,
    PER_KM_SHORT: Number(process.env.PRICE_PER_KM_SHORT) || 100,
    PER_KM_MEDIUM: Number(process.env.PRICE_PER_KM_MEDIUM) || 140,
    PER_KM_LONG: Number(process.env.PRICE_PER_KM_LONG) || 200,
    SHORT_DISTANCE_MAX: Number(process.env.PRICE_SHORT_DISTANCE_MAX) || 8,
    MEDIUM_DISTANCE_MAX: Number(process.env.PRICE_MEDIUM_DISTANCE_MAX) || 15,
    VEHICLE_MULTIPLIERS: envMultipliers,
  };
};

/**
 * Calculate delivery price using tiered distance model
 *
 * Pricing Structure (configurable via database or .env):
 * - Base fare: MIN_FARE (default: ₦800)
 * - 0-8km: PER_KM_SHORT (default: ₦100/km)
 * - 9-15km: PER_KM_MEDIUM (default: ₦140/km)
 * - 16km+: PER_KM_LONG (default: ₦200/km)
 *
 * Distance Calculation:
 * - Uses Mapbox/OpenRouteService API for accurate road distance
 * - Falls back to Haversine distance × multiplier if routing API unavailable
 *
 * Vehicle Type Multipliers (configurable via database or .env):
 * - Bicycle: 0.8 (20% cheaper)
 * - Motorbike: 1.0 (base price)
 * - Tricycle: 1.15 (15% more)
 * - Car: 1.25 (25% more)
 * - Van: 1.5 (50% more)
 *
 * Example: 10km → ₦800 + (8×₦100) + (2×₦140) = ₦1,880 base
 * - Bicycle: ₦1,504 (0.8x)
 * - Motorbike: ₦1,880 (1.0x)
 * - Tricycle: ₦2,162 (1.15x)
 * - Car: ₦2,350 (1.25x)
 * - Van: ₦2,820 (1.5x)
 */
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

  // Default to motorbike if invalid vehicle type
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

  // distanceKm is already road distance from routing API (or adjusted Haversine if fallback)
  const adjustedDistance = distanceKm;

  let price;

  // Calculate price with MIN_FARE as base fare
  if (adjustedDistance <= SHORT_DISTANCE_MAX) {
    // Short distance: 0-8km (or configured max)
    price = MIN_FARE + adjustedDistance * PER_KM_SHORT;
  } else if (adjustedDistance <= MEDIUM_DISTANCE_MAX) {
    // Medium distance: 9-15km (or configured range)
    price =
      MIN_FARE +
      SHORT_DISTANCE_MAX * PER_KM_SHORT +
      (adjustedDistance - SHORT_DISTANCE_MAX) * PER_KM_MEDIUM;
  } else {
    // Long distance: 16km+ (or above configured max)
    price =
      MIN_FARE +
      SHORT_DISTANCE_MAX * PER_KM_SHORT +
      (MEDIUM_DISTANCE_MAX - SHORT_DISTANCE_MAX) * PER_KM_MEDIUM +
      (adjustedDistance - MEDIUM_DISTANCE_MAX) * PER_KM_LONG;
  }

  // Apply vehicle type multiplier
  price = Math.round(price * multiplier);

  // Ensure minimum fare (adjusted by multiplier)
  return Math.max(price, Math.round(MIN_FARE * multiplier));
};

// Check if coordinates are within Lagos bounds
const isInsideLagos = (lat, lng) => {
  // Lagos bounds: South-West (6.3930, 2.6917) to North-East (6.6730, 4.3510)
  const LAGOS_SOUTH = 6.393;
  const LAGOS_NORTH = 6.673;
  const LAGOS_WEST = 2.6917;
  const LAGOS_EAST = 4.351;

  return (
    lat >= LAGOS_SOUTH &&
    lat <= LAGOS_NORTH &&
    lng >= LAGOS_WEST &&
    lng <= LAGOS_EAST
  );
};

// Estimate price before creating order
export const estimatePrice = async (req, res) => {
  try {
    const { pickup, dropoff } = req.body || {};

    if (!pickup?.address || !dropoff?.address) {
      console.error("[ESTIMATE] Missing addresses:", {
        hasPickup: !!pickup?.address,
        hasDropoff: !!dropoff?.address,
      });
      return res.status(400).json({
        success: false,
        error: "Pickup and dropoff addresses are required",
      });
    }

    let distanceKm = null;
    let estimatedPrice = 0;

    const pickupData = { ...pickup };
    const dropoffData = { ...dropoff };

    if (!pickupData.lat || !pickupData.lng) {
      try {
        const geo = await geocodeAddress(pickupData.address);
        if (geo) {
          pickupData.lat = geo.lat;
          pickupData.lng = geo.lng;
        }
      } catch (err) {
        console.error("[ESTIMATE] Failed to geocode pickup:", err.message, err);
      }
    }

    if (!dropoffData.lat || !dropoffData.lng) {
      try {
        const geo = await geocodeAddress(dropoffData.address);
        if (geo) {
          dropoffData.lat = geo.lat;
          dropoffData.lng = geo.lng;
        }
      } catch (err) {
        console.error(
          "[ESTIMATE] Failed to geocode dropoff:",
          err.message,
          err
        );
      }
    }

    if (
      pickupData.lat &&
      pickupData.lng &&
      dropoffData.lat &&
      dropoffData.lng
    ) {
      // Validate coordinates are numbers
      if (
        typeof pickupData.lat !== "number" ||
        typeof pickupData.lng !== "number" ||
        typeof dropoffData.lat !== "number" ||
        typeof dropoffData.lng !== "number" ||
        isNaN(pickupData.lat) ||
        isNaN(pickupData.lng) ||
        isNaN(dropoffData.lat) ||
        isNaN(dropoffData.lng)
      ) {
        console.error("[ESTIMATE] Invalid coordinates:", {
          pickup: { lat: pickupData.lat, lng: pickupData.lng },
          dropoff: { lat: dropoffData.lat, lng: dropoffData.lng },
        });
        return res.status(400).json({
          success: false,
          error: "Invalid coordinates provided",
        });
      }

      // Validate both locations are within Lagos
      if (
        !isInsideLagos(pickupData.lat, pickupData.lng) ||
        !isInsideLagos(dropoffData.lat, dropoffData.lng)
      ) {
        console.warn("[ESTIMATE] Location outside Lagos bounds:", {
          pickup: { lat: pickupData.lat, lng: pickupData.lng },
          dropoff: { lat: dropoffData.lat, lng: dropoffData.lng },
        });
        return res.status(400).json({
          success: false,
          error: "We currently only support deliveries within Lagos State.",
        });
      }

      distanceKm = await calculateRoadDistance(
        pickupData.lat,
        pickupData.lng,
        dropoffData.lat,
        dropoffData.lng
      );

      // Calculate prices for all vehicle types
      const carStandardPrice = await calculateDeliveryPrice(
        distanceKm,
        "car_standard"
      );
      const carComfortPrice = await calculateDeliveryPrice(
        distanceKm,
        "car_comfort"
      );
      const carPremiumPrice = await calculateDeliveryPrice(
        distanceKm,
        "car_premium"
      );

      const prices = {
        bicycle: await calculateDeliveryPrice(distanceKm, "bicycle"),
        motorbike: await calculateDeliveryPrice(distanceKm, "motorbike"),
        tricycle: await calculateDeliveryPrice(distanceKm, "tricycle"),
        car: carStandardPrice,
        car_standard: carStandardPrice,
        car_comfort: carComfortPrice,
        car_premium: carPremiumPrice,
        van: await calculateDeliveryPrice(distanceKm, "van"),
      };

      // Default estimated price is motorbike (most common)
      estimatedPrice = prices.motorbike;

      res.json({
        success: true,
        estimatedPrice: Math.round(estimatedPrice),
        bikePrice: Math.round(prices.motorbike), // Backward compatibility
        carPrice: Math.round(prices.car), // Backward compatibility
        distanceKm: distanceKm ? Math.round(distanceKm * 10) / 10 : null,
        currency: "NGN",
        prices: {
          bicycle: Math.round(prices.bicycle),
          motorbike: Math.round(prices.motorbike),
          tricycle: Math.round(prices.tricycle),
          car: Math.round(prices.car),
          car_standard: Math.round(prices.car_standard),
          car_comfort: Math.round(prices.car_comfort),
          car_premium: Math.round(prices.car_premium),
          van: Math.round(prices.van),
        },
      });
    } else {
      // Use minimum fare if can't calculate distance
      console.warn("[ESTIMATE] Missing coordinates, using minimum fare");
      console.warn("[ESTIMATE] Missing coordinates details:", {
        pickup: { lat: pickupData.lat, lng: pickupData.lng },
        dropoff: { lat: dropoffData.lat, lng: dropoffData.lng },
      });
      const fallbackPrices = {
        bicycle: await calculateDeliveryPrice(0, "bicycle"),
        motorbike: await calculateDeliveryPrice(0, "motorbike"),
        tricycle: await calculateDeliveryPrice(0, "tricycle"),
        car: await calculateDeliveryPrice(0, "car"),
        car_standard: await calculateDeliveryPrice(0, "car_standard"),
        car_comfort: await calculateDeliveryPrice(0, "car_comfort"),
        car_premium: await calculateDeliveryPrice(0, "car_premium"),
        van: await calculateDeliveryPrice(0, "van"),
      };

      estimatedPrice = fallbackPrices.motorbike;
      console.log("[ESTIMATE] Minimum fare calculated:", estimatedPrice);
      res.json({
        success: true,
        estimatedPrice: Math.round(estimatedPrice),
        bikePrice: Math.round(fallbackPrices.motorbike),
        carPrice: Math.round(fallbackPrices.car_standard),
        distanceKm: null,
        currency: "NGN",
        prices: {
          bicycle: Math.round(fallbackPrices.bicycle),
          motorbike: Math.round(fallbackPrices.motorbike),
          tricycle: Math.round(fallbackPrices.tricycle),
          car: Math.round(fallbackPrices.car),
          car_standard: Math.round(fallbackPrices.car_standard),
          car_comfort: Math.round(fallbackPrices.car_comfort),
          car_premium: Math.round(fallbackPrices.car_premium),
          van: Math.round(fallbackPrices.van),
        },
      });
    }
  } catch (e) {
    console.error("[ESTIMATE] ❌ ERROR in price estimation:", e);
    console.error("[ESTIMATE] Error name:", e?.name);
    console.error("[ESTIMATE] Error message:", e?.message);
    console.error("[ESTIMATE] Error stack:", e?.stack);
    console.error(
      "[ESTIMATE] Full error object:",
      JSON.stringify(e, Object.getOwnPropertyNames(e))
    );
    console.error(
      "[ESTIMATE] Request body that caused error:",
      JSON.stringify(req.body, null, 2)
    );
    console.error(
      "[ESTIMATE] Request user:",
      req.user?._id || req.user?.id || "No user"
    );

    // Log specific error types
    if (e instanceof TypeError) {
      console.error(
        "[ESTIMATE] TypeError details - likely a function call issue"
      );
    }
    if (e instanceof ReferenceError) {
      console.error(
        "[ESTIMATE] ReferenceError details - likely a variable/function not found"
      );
    }
    if (e instanceof Error) {
      console.error("[ESTIMATE] Generic Error - check the message above");
    }

    res.status(500).json({
      success: false,
      error: e.message || "Internal server error during price estimation",
      errorType: e?.name || "Unknown",
    });
  }
};

export const getNearbyRidersPreview = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "customer") {
      return res.status(403).json({
        success: false,
        error: "Only customers can preview nearby riders",
      });
    }

    const { pickup, serviceType } = req.body || {};
    if (!pickup?.address) {
      return res.status(400).json({
        success: false,
        error: "Pickup address is required",
      });
    }

    const pickupData = { ...pickup };

    if (!pickupData.lat || !pickupData.lng) {
      try {
        const geo = await geocodeAddress(pickupData.address);
        if (geo) {
          pickupData.lat = geo.lat;
          pickupData.lng = geo.lng;
        }
      } catch (err) {
        console.warn(
          "[NEARBY_RIDERS] Failed to geocode pickup:",
          err.message
        );
      }
    }

    if (
      !pickupData.lat ||
      !pickupData.lng ||
      typeof pickupData.lat !== "number" ||
      typeof pickupData.lng !== "number" ||
      isNaN(pickupData.lat) ||
      isNaN(pickupData.lng)
    ) {
      return res.status(400).json({
        success: false,
        error: "Valid pickup coordinates are required",
      });
    }

    const settings = await Settings.getSettings();
    const defaultRadius =
      settings.system?.defaultSearchRadiusKm ??
      Number(process.env.RIDER_ORDER_RADIUS_KM || process.env.RADIUS_KM || 7);
    const MAX_NOTIFICATION_RADIUS =
      settings.system?.maxAllowedRadiusKm ??
      Number(process.env.MAX_RIDER_RADIUS_KM || process.env.RADIUS_KM || 30);

    const onlineRiders = await RiderLocation.find({
      online: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [pickupData.lng, pickupData.lat],
          },
          $maxDistance: MAX_NOTIFICATION_RADIUS * 1000,
        },
      },
    })
      .populate({
        path: "riderId",
        select:
          "fullName vehicleType searchRadiusKm supportedServices role profilePicture",
      })
      .lean();

    const nearbyRiders = [];

    for (const riderLoc of onlineRiders) {
      if (!riderLoc.riderId || !riderLoc.location?.coordinates) continue;

      const rider = riderLoc.riderId;
      const riderName = rider.fullName || "Rider";
      const riderServices =
        Array.isArray(rider?.supportedServices) && rider.supportedServices.length
          ? rider.supportedServices
          : ["courier", "ride"];

      if (serviceType && !riderServices.includes(serviceType)) {
        continue;
      }

      const riderRadius =
        (typeof rider === "object" && rider?.searchRadiusKm) ||
        defaultRadius;

      let vehicleMaxRadius = MAX_NOTIFICATION_RADIUS;
      const vehicleType = rider.vehicleType;
      const vehicleLimits = settings.vehicleSearchRadiusKm || {};
      if (vehicleType === "bicycle" && vehicleLimits.bicycle) {
        vehicleMaxRadius = Math.min(vehicleMaxRadius, vehicleLimits.bicycle);
      } else if (
        (vehicleType === "motorbike" || vehicleType === "tricycle") &&
        vehicleLimits.motorbike
      ) {
        vehicleMaxRadius = Math.min(
          vehicleMaxRadius,
          vehicleLimits.motorbike
        );
      } else if (vehicleType === "van" && vehicleLimits.van) {
        vehicleMaxRadius = Math.min(vehicleMaxRadius, vehicleLimits.van);
      } else if (
        (vehicleType === "car" ||
          vehicleType === "car_standard" ||
          vehicleType === "car_comfort" ||
          vehicleType === "car_premium") &&
        vehicleLimits.car
      ) {
        vehicleMaxRadius = Math.min(vehicleMaxRadius, vehicleLimits.car);
      }

      const effectiveRadius = Math.min(riderRadius, vehicleMaxRadius);

      const [riderLng, riderLat] = riderLoc.location.coordinates;
      if (
        typeof riderLat !== "number" ||
        typeof riderLng !== "number" ||
        isNaN(riderLat) ||
        isNaN(riderLng)
      ) {
        continue;
      }

      const distance = calculateDistance(
        pickupData.lat,
        pickupData.lng,
        riderLat,
        riderLng
      );

      if (distance <= effectiveRadius) {
        nearbyRiders.push({
          id:
            rider._id?.toString() ||
            riderLoc.riderId?._id?.toString() ||
            riderLoc.riderId?.toString() ||
            String(riderLoc.riderId),
          name: riderName,
          vehicleType: rider.vehicleType || null,
          services: riderServices,
          distanceKm: Math.round(distance * 10) / 10,
          profilePicture: rider.profilePicture || null,
        });
      }
    }

    nearbyRiders.sort((a, b) => a.distanceKm - b.distanceKm);

    const limitedRiders = nearbyRiders.slice(0, 50);

    res.json({
      success: true,
      count: limitedRiders.length,
      riders: limitedRiders,
    });
  } catch (e) {
    console.error("[NEARBY_RIDERS] Error loading nearby riders:", e);
    res.status(500).json({
      success: false,
      error: e.message || "Failed to load nearby riders",
    });
  }
};

export const createOrder = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "customer") {
      return res
        .status(403)
        .json({ success: false, error: "Only customers can create orders" });
    }
    const {
      pickup,
      dropoff,
      items,
      price,
      preferredVehicleType,
      serviceType,
      useWallet,
    } = req.body || {};
    if (!pickup?.address || !dropoff?.address) {
      return res.status(400).json({
        success: false,
        error: "Pickup and dropoff addresses are required",
      });
    }

    const pickupData = { ...pickup };
    const dropoffData = { ...dropoff };

    if (!pickupData.lat || !pickupData.lng) {
      try {
        const geo = await geocodeAddress(pickupData.address);
        if (geo) {
          pickupData.lat = geo.lat;
          pickupData.lng = geo.lng;
          if (geo.formatted && !pickupData.address.includes(geo.formatted)) {
            pickupData.formattedAddress = geo.formatted;
          }
        }
      } catch (err) {
        console.warn("[ORDER] Failed to geocode pickup:", err.message);
      }
    }

    if (!dropoffData.lat || !dropoffData.lng) {
      try {
        const geo = await geocodeAddress(dropoffData.address);
        if (geo) {
          dropoffData.lat = geo.lat;
          dropoffData.lng = geo.lng;
          if (geo.formatted && !dropoffData.address.includes(geo.formatted)) {
            dropoffData.formattedAddress = geo.formatted;
          }
        }
      } catch (err) {
        console.warn("[ORDER] Failed to geocode dropoff:", err.message);
      }
    }

    let distanceKm = null;
    let calculatedPrice = Number(price) || 0;

    if (
      pickupData.lat &&
      pickupData.lng &&
      dropoffData.lat &&
      dropoffData.lng
    ) {
      distanceKm = await calculateRoadDistance(
        pickupData.lat,
        pickupData.lng,
        dropoffData.lat,
        dropoffData.lng
      );
      if (!price || process.env.PRICE_AUTO === "true") {
        const vehicleType = preferredVehicleType || "motorcycle";
        calculatedPrice = await calculateDeliveryPrice(distanceKm, vehicleType);
      }
    } else if (!price) {
      const vehicleType = preferredVehicleType || "motorcycle";
      calculatedPrice = await calculateDeliveryPrice(0, vehicleType);
    }

    let finalPrice = Math.round(calculatedPrice);
    let walletAmount = 0;
    let walletUsed = false;

    // Handle wallet payment if requested
    if (useWallet === true) {
      try {
        const { getWalletBalance, debitWallet } = await import(
          "../utils/walletUtils.js"
        );
        const walletBalance = await getWalletBalance(user._id);

        if (walletBalance > 0) {
          walletAmount = Math.min(walletBalance, finalPrice);
          if (walletAmount > 0) {
            await debitWallet(user._id, walletAmount, {
              type: "order_payment",
              orderId: null, // Will be set after order creation
              customerId: user._id,
              description: `Wallet payment for order`,
              metadata: {
                orderPrice: finalPrice,
              },
              createTransactionRecord: false, // Will create after order is created
            });
            walletUsed = true;
            finalPrice = finalPrice - walletAmount; // Customer pays remaining amount
          }
        }
      } catch (walletError) {
        console.error(
          "[ORDER] Failed to process wallet payment:",
          walletError.message
        );
        // Continue with order creation even if wallet fails
      }
    }

    const resolvedServiceType = await Service.resolveServiceKey({
      requested:
        typeof serviceType === "string"
          ? serviceType.trim().toLowerCase()
          : undefined,
      role: user.role,
      fallback: user.preferredService,
    });

    const order = new Order({
      customerId: user._id,
      pickup: pickupData,
      dropoff: dropoffData,
      items: items || "",
      preferredVehicleType: preferredVehicleType || null,
      serviceType: resolvedServiceType,
      price: finalPrice + walletAmount, // Total order price (wallet + cash)
      originalPrice: finalPrice + walletAmount,
      status: "pending",
      timeline: [],
      meta: {
        distanceKm: distanceKm ? Math.round(distanceKm * 10) / 10 : null,
      },
      payment: {
        method:
          finalPrice > 0
            ? walletUsed
              ? "split"
              : "cash"
            : walletUsed
            ? "wallet"
            : "none",
        status: "pending",
        amount: finalPrice,
        walletAmount: walletUsed ? walletAmount : 0,
      },
    });
    await order.save();

    // Update wallet transaction with orderId if wallet was used
    if (walletUsed && walletAmount > 0) {
      try {
        const Wallet = (await import("../models/Wallet.js")).default;
        const wallet = await Wallet.findOne({ userId: user._id });
        if (wallet && wallet.transactions.length > 0) {
          const lastTransaction =
            wallet.transactions[wallet.transactions.length - 1];
          lastTransaction.orderId = order._id;
          await wallet.save();
        }

        // Create transaction record for admin tracking
        await Transaction.create({
          orderId: order._id,
          customerId: user._id,
          type: "order_payment",
          amount: walletAmount,
          currency: "NGN",
          status: "completed",
          description: `Wallet payment for order #${order.orderId}`,
          metadata: {
            walletId: wallet._id.toString(),
            paidFromWallet: true,
            totalOrderPrice: order.price,
            cashAmount: finalPrice,
          },
          processedAt: new Date(),
        });
      } catch (txError) {
        console.error(
          "[ORDER] Failed to update wallet transaction:",
          txError.message
        );
        // Don't throw error, just log it
      }
    }

    appendTimeline(
      order,
      "pending",
      walletUsed
        ? `Order created. Wallet: ₦${walletAmount.toLocaleString()}${
            finalPrice > 0 ? `, Cash: ₦${finalPrice.toLocaleString()}` : ""
          }`
        : "Order created"
    );
    await order.save();

    io.to(`user:${user._id}`).emit(SocketEvents.ORDER_CREATED, {
      id: order._id.toString(),
    });

    createAndSendNotification(user._id, {
      type: "order_created",
      title: "Order created",
      message: `Order #${order._id} created, awaiting assignment`,
      metadata: { orderId: order._id.toString() },
    }).catch((notifError) => {
      console.warn(
        `[ORDER] Notification failed for order ${order._id} (non-critical):`,
        notifError?.message || notifError
      );
    });

    if (pickupData.lat && pickupData.lng) {
      try {
        const settings = await Settings.getSettings();
        const defaultRadius =
          settings.system?.defaultSearchRadiusKm ??
          Number(process.env.RIDER_ORDER_RADIUS_KM || process.env.RADIUS_KM || 7);
        const MAX_NOTIFICATION_RADIUS =
          settings.system?.maxAllowedRadiusKm ??
          Number(process.env.MAX_RIDER_RADIUS_KM || process.env.RADIUS_KM || 30);

        const onlineRiders = await RiderLocation.find({
          online: true,
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [pickupData.lng, pickupData.lat],
              },
              $maxDistance: MAX_NOTIFICATION_RADIUS * 1000,
            },
          },
        })
          .populate({
            path: "riderId",
            select: "searchRadiusKm _id supportedServices role",
          })
          .lean();

        const nearbyRiders = [];
        for (const riderLoc of onlineRiders) {
          if (!riderLoc.riderId || !riderLoc.location?.coordinates) continue;

          const rider = riderLoc.riderId;
          const riderIdValue =
            rider?._id || rider?.toString() || riderLoc.riderId;
          const riderServices =
            Array.isArray(rider?.supportedServices) &&
            rider.supportedServices.length
              ? rider.supportedServices
              : ["courier", "ride"]; // Default to both services

          if (order.serviceType && !riderServices.includes(order.serviceType)) {
            continue;
          }
          const riderRadius =
            (typeof rider === "object" && rider?.searchRadiusKm) ||
            defaultRadius;

          let vehicleMaxRadius = MAX_NOTIFICATION_RADIUS;
          const vehicleType = rider.vehicleType;
          const vehicleLimits = settings.vehicleSearchRadiusKm || {};
          if (vehicleType === "bicycle" && vehicleLimits.bicycle) {
            vehicleMaxRadius = Math.min(vehicleMaxRadius, vehicleLimits.bicycle);
          } else if (
            (vehicleType === "motorbike" || vehicleType === "tricycle") &&
            vehicleLimits.motorbike
          ) {
            vehicleMaxRadius = Math.min(
              vehicleMaxRadius,
              vehicleLimits.motorbike
            );
          } else if (vehicleType === "van" && vehicleLimits.van) {
            vehicleMaxRadius = Math.min(vehicleMaxRadius, vehicleLimits.van);
          } else if (
            (vehicleType === "car" ||
              vehicleType === "car_standard" ||
              vehicleType === "car_comfort" ||
              vehicleType === "car_premium") &&
            vehicleLimits.car
          ) {
            vehicleMaxRadius = Math.min(vehicleMaxRadius, vehicleLimits.car);
          }

          const effectiveRadius = Math.min(riderRadius, vehicleMaxRadius);

          const [riderLng, riderLat] = riderLoc.location.coordinates;
          if (
            typeof riderLat !== "number" ||
            typeof riderLng !== "number" ||
            isNaN(riderLat) ||
            isNaN(riderLng)
          ) {
            continue;
          }

          const distance = calculateDistance(
            pickupData.lat,
            pickupData.lng,
            riderLat,
            riderLng
          );

          if (distance <= effectiveRadius) {
            nearbyRiders.push({
              riderId: riderIdValue,
              distanceKm: Math.round(distance * 10) / 10,
            });
          }
        }

        // Notify nearby riders via socket and push notification
        for (const { riderId, distanceKm } of nearbyRiders) {
          const riderIdStr = String(riderId);
          try {
            // Determine service type label for notification
            const serviceLabel =
              order.serviceType === "ride" ? "Ride Order" : "Delivery Order";
            const serviceEmoji = order.serviceType === "ride" ? "🚗" : "📦";

            // Socket notification
            io.to(`user:${riderIdStr}`).emit(SocketEvents.NEW_ORDER_AVAILABLE, {
              orderId: order._id.toString(),
              distanceKm,
              price: finalPrice,
              serviceType: order.serviceType,
              pickup: {
                address: pickupData.address,
                lat: pickupData.lat,
                lng: pickupData.lng,
              },
            });

            const pickupAddressShort =
              pickupData.address.length > 40
                ? pickupData.address.substring(0, 40) + "..."
                : pickupData.address;
            await createAndSendNotification(riderIdStr, {
              type: "new_order_available",
              title: `${serviceEmoji} New ${serviceLabel} Available`,
              message: `${distanceKm}km away - ₦${finalPrice.toLocaleString()}\nPickup: ${pickupAddressShort}`,
              metadata: {
                orderId: order._id.toString(),
                distanceKm,
                price: finalPrice,
                serviceType: order.serviceType,
                pickup: {
                  address: pickupData.address,
                  lat: pickupData.lat,
                  lng: pickupData.lng,
                },
              },
            });
          } catch (notifError) {
            console.warn(
              `[ORDER] Failed to notify rider ${riderIdStr}:`,
              notifError.message
            );
            // Continue with other riders even if one fails
          }
        }

        if (nearbyRiders.length > 0) {
          console.log(
            `[ORDER] Notified ${nearbyRiders.length} nearby rider(s) about order ${order._id}`
          );
        }
      } catch (notifyError) {
        console.error(
          "[ORDER] Error notifying nearby riders:",
          notifyError.message
        );
        // Don't fail order creation if notification fails
      }
    }

    res.status(201).json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(10, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;
    const search = req.query.search?.toString().trim() || "";
    const serviceType = req.query.serviceType?.toString().trim().toLowerCase();

    const query = { customerId: req.user._id };

    if (serviceType) {
      if (serviceType === "courier") {
        query.$or = [
          { serviceType: "courier" },
          { serviceType: { $exists: false } },
          { serviceType: null },
        ];
      } else {
        query.serviceType = serviceType;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      const searchConditions = [
        { items: searchRegex },
        { "pickup.address": searchRegex },
        { "dropoff.address": searchRegex },
        { "delivery.recipientName": searchRegex },
        { "payment.ref": searchRegex },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getRiderOrders = async (req, res) => {
  try {
    if (req.user.role !== "rider")
      return res.status(403).json({ success: false, error: "Only riders" });

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(10, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const query = {
      riderId: req.user._id,
      $or: [
        { status: { $in: ["assigned", "picked_up", "delivering"] } },
        {
          status: "delivered",
          "delivery.otpVerifiedAt": { $exists: true, $ne: null },
          $or: [
            { "delivery.photoUrl": { $exists: false } },
            { "delivery.photoUrl": null },
            { "delivery.photoUrl": "" },
          ],
        },
      ],
    };

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getRiderDeliveredOrders = async (req, res) => {
  try {
    if (req.user.role !== "rider")
      return res.status(403).json({ success: false, error: "Only riders" });

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(10, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const query = {
      riderId: req.user._id,
      status: "delivered",
    };

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getAvailableOrders = async (req, res) => {
  try {
    if (req.user.role !== "rider")
      return res.status(403).json({ success: false, error: "Only riders" });

    const riderCheck = await User.findById(req.user._id).select(
      "accountDeactivated paymentBlocked"
    );
    if (riderCheck?.accountDeactivated) {
      return res.status(403).json({
        success: false,
        error:
          "Your account has been locked due to overdue commission payment. Please contact support via WhatsApp to resolve this issue.",
        accountLocked: true,
      });
    }
    if (riderCheck?.paymentBlocked) {
      return res.status(403).json({
        success: false,
        error:
          "Your account is blocked due to overdue commission payment. Please contact support via WhatsApp to resolve this issue.",
        accountBlocked: true,
      });
    }

    const showAll = req.query.showAll === "true" || req.query.showAll === true;

    const rider = await User.findById(req.user._id).select(
      "searchRadiusKm supportedServices vehicleType"
    );

    const settings = await Settings.getSettings();
    const defaultRadius =
      settings.system?.defaultSearchRadiusKm ??
      Number(process.env.RIDER_ORDER_RADIUS_KM || process.env.RADIUS_KM || 7);
    const riderRadius = rider?.searchRadiusKm || defaultRadius;

    const MAX_ALLOWED_RADIUS =
      settings.system?.maxAllowedRadiusKm ??
      Number(process.env.MAX_RIDER_RADIUS_KM || process.env.RADIUS_KM || 20);

    let vehicleMaxRadius = MAX_ALLOWED_RADIUS;
    const vehicleType = rider?.vehicleType;
    const vehicleLimits = settings.vehicleSearchRadiusKm || {};
    if (vehicleType === "bicycle" && vehicleLimits.bicycle) {
      vehicleMaxRadius = Math.min(vehicleMaxRadius, vehicleLimits.bicycle);
    } else if (
      (vehicleType === "motorbike" || vehicleType === "tricycle") &&
      vehicleLimits.motorbike
    ) {
      vehicleMaxRadius = Math.min(vehicleMaxRadius, vehicleLimits.motorbike);
    } else if (vehicleType === "van" && vehicleLimits.van) {
      vehicleMaxRadius = Math.min(vehicleMaxRadius, vehicleLimits.van);
    } else if (
      (vehicleType === "car" ||
        vehicleType === "car_standard" ||
        vehicleType === "car_comfort" ||
        vehicleType === "car_premium") &&
      vehicleLimits.car
    ) {
      vehicleMaxRadius = Math.min(vehicleMaxRadius, vehicleLimits.car);
    }

    const effectiveRadius = showAll
      ? Infinity
      : Math.min(riderRadius, vehicleMaxRadius);

    // Get rider's supported services to filter orders
    const riderSupportedServices =
      Array.isArray(rider?.supportedServices) && rider.supportedServices.length
        ? rider.supportedServices
        : ["courier", "ride"]; // Default to both services

    let riderLoc = null;
    try {
      riderLoc = await RiderLocation.findOne({
        riderId: req.user._id,
        online: true,
      });
    } catch (error) {
      console.error("❌ [ORDERS] Error fetching rider location:", error);
    }

    const orderQuery = {
      status: "pending",
      riderId: null,
      $or: [
        { "priceNegotiation.status": { $ne: "requested" } },
        {
          "priceNegotiation.status": "requested",
          "priceNegotiation.requestingRiderId": req.user._id,
        },
      ],
    };

    if (
      riderSupportedServices.includes("ride") &&
      rider?.vehicleType &&
      (rider.vehicleType.startsWith("car_") || rider.vehicleType === "car")
    ) {
      const riderVehicleTier = rider.vehicleType.startsWith("car_")
        ? rider.vehicleType
        : "car_standard"; 

      const serviceConditions = [];

      if (riderSupportedServices.includes("courier")) {
        serviceConditions.push({ serviceType: "courier" });
      }

      serviceConditions.push({
        serviceType: "ride",
        $or: [
          { preferredVehicleType: riderVehicleTier },
          { preferredVehicleType: "car" },
          { preferredVehicleType: null },
        ],
      });

      orderQuery.$or = serviceConditions;
    } else {
      orderQuery.serviceType = { $in: riderSupportedServices };
    }

    let orders = [];
    try {
      orders = await Order.find(orderQuery)
        .sort({ createdAt: 1 })
        .limit(100)
        .populate({
          path: "customerId",
          select: "fullName profilePicture",
        })
        .lean();
    } catch (error) {
      console.error("❌ [ORDERS] Error fetching orders:", error);
      return res.json({ success: true, orders: [] });
    }

    if (!orders || orders.length === 0) {
      return res.json({ success: true, orders: [] });
    }

    let riderLat = null;
    let riderLng = null;
    let locationSource = null;

    if (
      riderLoc?.location?.coordinates &&
      Array.isArray(riderLoc.location.coordinates) &&
      riderLoc.location.coordinates.length >= 2
    ) {
      const [lng, lat] = riderLoc.location.coordinates;
      if (
        typeof lat === "number" &&
        typeof lng === "number" &&
        !isNaN(lat) &&
        !isNaN(lng)
      ) {
        riderLat = lat;
        riderLng = lng;
        locationSource = "gps";
      }
    }

    // Fallback: If no GPS but rider has address, try geocoding it
    if (!riderLat && !riderLng) {
      const riderFull = await User.findById(req.user._id).select("address");
      if (riderFull?.address && riderFull.address.trim().length > 0) {
        try {
          const geocoded = await geocodeAddress(riderFull.address);
          if (geocoded && geocoded.lat && geocoded.lng) {
            riderLat = geocoded.lat;
            riderLng = geocoded.lng;
            locationSource = "address";
          }
        } catch (error) {
          console.warn(
            "⚠️ [ORDERS] Could not geocode rider address:",
            error.message
          );
        }
      }
    }

    if (riderLat && riderLng) {
      try {
        const withDistance = orders
          .map((order) => {
            try {
              if (
                order?.pickup &&
                typeof order.pickup.lat === "number" &&
                typeof order.pickup.lng === "number" &&
                !isNaN(order.pickup.lat) &&
                !isNaN(order.pickup.lng)
              ) {
                const dist = calculateDistance(
                  riderLat,
                  riderLng,
                  order.pickup.lat,
                  order.pickup.lng
                );
                return { order, distanceKm: dist };
              }
              return { order, distanceKm: null };
            } catch (error) {
              console.warn(
                "⚠️ [ORDERS] Error calculating distance for order:",
                order._id,
                error
              );
              return { order, distanceKm: null };
            }
          })
          .filter(
            (item) =>
              item.distanceKm !== null &&
              !isNaN(item.distanceKm) &&
              item.distanceKm <= effectiveRadius
          )
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .map((item) => ({
            ...item.order,
            distanceKm: Math.round(item.distanceKm * 10) / 10,
            locationSource, // Include location source (gps or address)
          }));

        return res.json({
          success: true,
          orders: withDistance,
          locationSource, // Tell frontend where location came from
          requiresOnline: locationSource === "address", // If using address, suggest going online
        });
      } catch (error) {
        console.error(
          "❌ [ORDERS] Error processing orders with location:",
          error
        );
      }
    }

    return res.json({
      success: true,
      orders: [],
      message:
        "Please enable location services and go online to see orders near you, or ensure your address is set in your profile.",
      requiresLocation: true,
    });
  } catch (e) {
    console.error("❌ [ORDERS] Error in getAvailableOrders:", e);
    return res.json({ success: true, orders: [] });
  }
};

export const acceptOrder = async (req, res) => {
  try {
    if (req.user.role !== "rider")
      return res.status(403).json({ success: false, error: "Only riders" });

    // Check if rider account is locked or blocked
    const riderCheck = await User.findById(req.user._id).select(
      "accountDeactivated paymentBlocked"
    );
    if (riderCheck?.accountDeactivated) {
      return res.status(403).json({
        success: false,
        error:
          "Your account has been locked due to overdue commission payment. Please contact support via WhatsApp to resolve this issue.",
      });
    }
    if (riderCheck?.paymentBlocked) {
      return res.status(403).json({
        success: false,
        error:
          "Your account is blocked due to overdue commission payment. Please contact support via WhatsApp to resolve this issue.",
      });
    }

    const rider = await User.findById(req.user._id).select(
      "nin ninVerified address driverLicenseNumber driverLicensePicture driverLicenseVerified vehiclePicture vehicleType vehicleYear hasAirConditioning supportedServices preferredService"
    );
    if (!rider) {
      return res.status(404).json({ success: false, error: "Rider not found" });
    }

    const hasVerifiedIdentity = rider.ninVerified === true;

    if (!hasVerifiedIdentity) {
      return res.status(400).json({
        success: false,
        error:
          "KYC verification required. Please verify your identity by completing your NIN (National Identification Number) before accepting orders.",
        kycRequired: true,
      });
    }

    const hasAddress = rider.address && rider.address.trim().length > 0;
    if (!hasAddress) {
      return res.status(400).json({
        success: false,
        error:
          "Please complete your KYC by adding your address before accepting orders.",
        kycRequired: true,
      });
    }

    const hasDriverLicenseNumber =
      rider.driverLicenseNumber && rider.driverLicenseNumber.trim().length > 0;
    const hasDriverLicensePicture =
      rider.driverLicensePicture &&
      rider.driverLicensePicture.trim().length > 0;
    const isDriverLicenseVerified = rider.driverLicenseVerified === true;

    if (
      !hasDriverLicenseNumber ||
      !hasDriverLicensePicture ||
      !isDriverLicenseVerified
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Please complete your KYC by adding your driver license number and selfie, and ensure it's verified before accepting orders.",
        kycRequired: true,
      });
    }

    const hasVehiclePicture =
      rider.vehiclePicture && rider.vehiclePicture.trim().length > 0;
    if (!hasVehiclePicture) {
      return res.status(400).json({
        success: false,
        error:
          "Please complete your KYC by uploading your vehicle picture before accepting orders.",
        kycRequired: true,
      });
    }

    // Check if rider supports ride service - if yes, validate vehicle details
    const supportsRideService =
      Array.isArray(rider.supportedServices) &&
      rider.supportedServices.includes("ride");

    if (supportsRideService) {
      // Check if vehicle type is a car tier (car_standard, car_comfort, car_premium)
      const isCarTier =
        rider.vehicleType &&
        (rider.vehicleType === "car" || rider.vehicleType.startsWith("car_"));

      if (isCarTier) {
        // Get vehicle requirements from admin settings first, then fallback to env
        const settings = await Settings.getSettings();
        const vehicleType = rider.vehicleType || "car_standard";

        // Determine which tier we're checking (car defaults to car_standard)
        const tierKey = vehicleType.startsWith("car_")
          ? vehicleType
          : "car_standard";

        // Get minimum year: Admin settings first, then env, then default
        const adminMinYear = settings.vehicleRequirements?.[tierKey]?.minYear;
        const envMinYear = Number(process.env.MIN_VEHICLE_YEAR);
        const MIN_VEHICLE_YEAR =
          adminMinYear ??
          envMinYear ??
          (tierKey === "car_premium" ? 2015 : 2010);

        // Validate vehicle year
        if (!rider.vehicleYear || rider.vehicleYear < MIN_VEHICLE_YEAR) {
          return res.status(400).json({
            success: false,
            error: `Vehicle year must be ${MIN_VEHICLE_YEAR} or newer for ${
              tierKey.replace("car_", "").charAt(0).toUpperCase() +
              tierKey.replace("car_", "").slice(1)
            } ride services. Please update your vehicle information in KYC.`,
            kycRequired: true,
          });
        }

        // Get AC requirement: Admin settings first, then env, then default
        const adminRequireAC =
          settings.vehicleRequirements?.[tierKey]?.requireAirConditioning;
        let envRequireAC;
        if (tierKey === "car_premium") {
          envRequireAC = process.env.REQUIRE_AC_FOR_PREMIUM !== "false"; // Default true
        } else if (tierKey === "car_standard") {
          envRequireAC = process.env.REQUIRE_AC_FOR_STANDARD === "true"; // Default false
        } else if (tierKey === "car_comfort") {
          envRequireAC = process.env.REQUIRE_AC_FOR_COMFORT === "true"; // Default false
        }
        const REQUIRE_AC =
          adminRequireAC !== undefined
            ? adminRequireAC
            : envRequireAC ?? tierKey === "car_premium";

        // Validate air conditioning
        if (REQUIRE_AC && rider.hasAirConditioning !== true) {
          const tierName =
            tierKey === "car_premium"
              ? "Premium"
              : tierKey === "car_comfort"
              ? "Comfort"
              : "Standard";
          return res.status(400).json({
            success: false,
            error: `Air conditioning is required for ${tierName} ride services. Please update your vehicle information in KYC.`,
            kycRequired: true,
          });
        }
      }
    }

    const riderSupportedServices =
      Array.isArray(rider.supportedServices) && rider.supportedServices.length
        ? rider.supportedServices
        : ["courier"];

    const riderLocation = await RiderLocation.findOne({
      riderId: req.user._id,
      online: true,
    });
    if (
      !riderLocation ||
      !riderLocation.location ||
      !riderLocation.location.coordinates ||
      riderLocation.location.coordinates.length < 2
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Location services must be enabled and you must be online to accept orders. Please turn on your location in the Deliveries tab.",
        locationRequired: true,
      });
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "pending",
        riderId: null,
        serviceType: { $in: riderSupportedServices },
      },
      {
        $set: { riderId: req.user._id, status: "assigned" },
        $push: {
          timeline: {
            status: "assigned",
            note: `Rider ${req.user._id} accepted`,
            at: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!order) {
      return res
        .status(409)
        .json({ success: false, error: "Order already assigned" });
    }

    try {
      await createAndSendNotification(order.customerId, {
        type: "order_assigned",
        title: "Order assigned",
        message: `A rider has been assigned to your order #${order._id}`,
        metadata: { orderId: order._id.toString() },
      });
    } catch {}

    try {
      await createAndSendNotification(req.user._id, {
        type: "order_assigned",
        title: "Order assigned",
        message: `You've been assigned to order #${order._id}`,
        metadata: { orderId: order._id.toString() },
      });
    } catch {}

    io.to(`user:${order.customerId}`).emit(SocketEvents.ORDER_ASSIGNED, {
      id: order._id.toString(),
      riderId: req.user._id.toString(),
    });
    io.to(`user:${req.user._id}`).emit(SocketEvents.ORDER_ASSIGNED, {
      id: order._id.toString(),
    });

    try {
      const { checkAndAwardStreakBonus } = await import(
        "./streakBonusController.js"
      );
      await checkAndAwardStreakBonus(order, req.user._id);
    } catch (streakError) {
      console.error("[ORDER] Failed to check streak bonus:", streakError);
    }

    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const requestPriceChange = async (req, res) => {
  try {
    if (req.user.role !== "rider")
      return res.status(403).json({ success: false, error: "Only riders" });

    const { requestedPrice, reason } = req.body || {};
    if (
      !requestedPrice ||
      typeof requestedPrice !== "number" ||
      requestedPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Valid requested price is required",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });
    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        error:
          "Price can only be changed before order acceptance. Once accepted, price is locked.",
      });
    }

    if (order.priceNegotiation?.status === "requested") {
      return res
        .status(400)
        .json({ success: false, error: "Price request already pending" });
    }

    const roundedPrice = Math.round(requestedPrice);
    order.riderRequestedPrice = roundedPrice;
    order.priceNegotiation = {
      status: "requested",
      requestedAt: new Date(),
      reason: reason || null,
      respondedAt: null,
      requestingRiderId: req.user._id,
    };
    appendTimeline(
      order,
      order.status,
      `Rider requested price change: ₦${roundedPrice.toLocaleString()}${
        reason ? ` (${reason})` : ""
      }`
    );
    await order.save();

    try {
      await createAndSendNotification(order.customerId, {
        type: "price_change_requested",
        title: "Price change requested",
        message: `Rider requested ₦${roundedPrice.toLocaleString()}${
          reason ? ` - ${reason}` : ""
        }`,
        metadata: { orderId: order._id.toString() },
      });
    } catch {}

    io.to(`user:${order.customerId}`).emit(
      SocketEvents.PRICE_CHANGE_REQUESTED,
      {
        id: order._id.toString(),
        requestedPrice: roundedPrice,
        originalPrice: order.originalPrice,
        reason: reason || null,
      }
    );

    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// Customer accepts/rejects price change
export const respondToPriceRequest = async (req, res) => {
  try {
    if (req.user.role !== "customer")
      return res.status(403).json({ success: false, error: "Only customers" });

    const { accept } = req.body || {};
    if (typeof accept !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "accept (boolean) is required",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });
    if (String(order.customerId) !== String(req.user._id))
      return res.status(403).json({ success: false, error: "Not your order" });
    if (order.status !== "pending") {
      if (order.priceNegotiation?.status === "requested") {
        order.priceNegotiation.status = "rejected";
        order.priceNegotiation.respondedAt = new Date();
        order.riderRequestedPrice = null;
        appendTimeline(
          order,
          order.status,
          "Price change request expired after order was accepted"
        );
        await order.save();
      }
      return res.status(400).json({
        success: false,
        error:
          "Price change request has expired because the order was already accepted.",
      });
    }
    if (order.priceNegotiation?.status !== "requested") {
      return res
        .status(400)
        .json({ success: false, error: "No pending price request" });
    }

    if (accept) {
      if (!order.originalPrice || order.originalPrice === 0) {
        order.originalPrice = order.price;
      }
      order.price = order.riderRequestedPrice;
      order.priceNegotiation.status = "accepted";
      order.priceNegotiation.respondedAt = new Date();

      if (!order.priceNegotiation.requestingRiderId) {
        return res.status(400).json({
          success: false,
          error:
            "Price change was requested without a rider attached. Please try again.",
        });
      }

      order.riderId = order.priceNegotiation.requestingRiderId;
      order.status = "assigned";

      appendTimeline(
        order,
        "assigned",
        `Customer accepted price change: ₦${order.riderRequestedPrice.toLocaleString()} and assigned to rider`
      );

      // Notify rider
      try {
        await createAndSendNotification(order.riderId, {
          type: "price_change_accepted",
          title: "Price change accepted",
          message: `Customer accepted your requested price of ₦${order.riderRequestedPrice.toLocaleString()}`,
          metadata: { orderId: order._id.toString() },
        });
      } catch {}

      io.to(`user:${order.riderId}`).emit(SocketEvents.PRICE_CHANGE_ACCEPTED, {
        id: order._id.toString(),
        finalPrice: order.riderRequestedPrice,
      });
    } else {
      // Reject: Keep original price
      order.priceNegotiation.status = "rejected";
      order.priceNegotiation.respondedAt = new Date();
      order.riderRequestedPrice = null;
      appendTimeline(order, order.status, "Customer rejected price change");

      // Notify rider
      try {
        await createAndSendNotification(order.riderId, {
          type: "price_change_rejected",
          title: "Price change rejected",
          message: "Customer rejected your price change request",
          metadata: { orderId: order._id.toString() },
        });
      } catch {}

      io.to(`user:${order.riderId}`).emit(SocketEvents.PRICE_CHANGE_REJECTED, {
        id: order._id.toString(),
      });
    }

    await order.save();
    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body || {};
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });

    const user = req.user;
    const isCustomer = String(order.customerId) === String(user._id);
    const isRider = order.riderId && String(order.riderId) === String(user._id);
    const isAdmin = user.role === "admin";

    if (!isCustomer && !isRider && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to cancel this order",
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: "Order is already cancelled",
      });
    }

    const cancellableStatuses = ["pending", "assigned"];

    if (!cancellableStatuses.includes(order.status)) {
      const statusMessages = {
        picked_up:
          "Cannot cancel order after pickup. The rider has already collected the items.",
        delivering:
          "Cannot cancel order while in transit. The order is being delivered.",
        delivered:
          "Cannot cancel a completed order. The order has already been delivered.",
      };

      return res.status(400).json({
        success: false,
        error:
          statusMessages[order.status] || "Cannot cancel order at this stage.",
      });
    }

    // Cancel the order
    order.status = "cancelled";
    const cancelNote = reason
      ? `Cancelled by ${
          user.role === "customer"
            ? "customer"
            : user.role === "rider"
            ? "rider"
            : "admin"
        }. Reason: ${reason}`
      : `Cancelled by ${
          user.role === "customer"
            ? "customer"
            : user.role === "rider"
            ? "rider"
            : "admin"
        }`;
    appendTimeline(order, "cancelled", cancelNote);

    // Refund wallet if order was paid with wallet
    if (order.payment?.walletUsed && order.payment?.walletAmount > 0) {
      try {
        const { creditWallet } = await import("../utils/walletUtils.js");
        await creditWallet(order.customerId, order.payment.walletAmount, {
          type: "refund",
          orderId: order._id,
          description: `Refund for cancelled order #${order._id}`,
          metadata: {
            originalOrderId: order._id.toString(),
            refundReason: "order_cancelled",
          },
        });

        // Update order payment record
        if (!order.payment) order.payment = {};
        order.payment.walletRefunded = true;
        order.payment.walletRefundedAt = new Date();
      } catch (walletError) {
        console.error("[ORDER] Failed to refund wallet:", walletError.message);
        // Don't fail cancellation if wallet refund fails
      }
    }

    const previousRiderId = order.riderId;

    // Reset streak if rider cancels an accepted order
    if (previousRiderId && isRider) {
      try {
        const { resetStreak } = await import("./streakBonusController.js");
        await resetStreak(previousRiderId);
      } catch (streakError) {
        console.error("[ORDER] Failed to reset streak on cancel:", streakError);
        // Don't fail cancellation if streak reset fails
      }
    }

    if (order.riderId) {
      order.riderId = null;
    }

    await order.save();

    // Send notifications
    try {
      await createAndSendNotification(order.customerId, {
        type: "order_cancelled",
        title: "Order Cancelled",
        message: `Order #${String(order._id).slice(-6)} has been cancelled`,
        metadata: { orderId: order._id.toString() },
      });
    } catch {}

    // Notify rider if there was one assigned
    if (previousRiderId) {
      try {
        await createAndSendNotification(previousRiderId, {
          type: "order_cancelled",
          title: "Order Cancelled",
          message: `Order #${String(order._id).slice(
            -6
          )} has been cancelled. You can now accept other orders.`,
          metadata: { orderId: order._id.toString() },
        });
      } catch {}
    }

    // Emit socket events
    io.to(`user:${order.customerId}`).emit(SocketEvents.ORDER_STATUS_UPDATED, {
      id: order._id.toString(),
      status: "cancelled",
    });
    if (previousRiderId) {
      io.to(`user:${previousRiderId}`).emit(SocketEvents.ORDER_STATUS_UPDATED, {
        id: order._id.toString(),
        status: "cancelled",
      });
    }

    res.json({
      success: true,
      order,
      message: "Order cancelled successfully",
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { action } = req.body || {};
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });
    if (req.user.role !== "rider" && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    if (
      req.user.role === "rider" &&
      String(order.riderId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, error: "Not your order" });
    }
    const transitions = {
      pickup: "picked_up",
      deliver: "delivered",
      start: "delivering",
      // Remove cancel from here - use dedicated cancelOrder endpoint instead
    };
    const next = transitions[action];
    if (!next)
      return res.status(400).json({ success: false, error: "Invalid action" });

    if (action === "pickup" && order.status !== "assigned") {
      return res.status(400).json({
        success: false,
        error:
          "Order must be in 'assigned' status (after price agreement) to mark as picked up",
      });
    }

    order.status = next;

    // Calculate commission and financial breakdown when order is delivered
    if (next === "delivered" && order.riderId) {
      // Set deliveredAt if not already set
      if (!order.delivery?.deliveredAt) {
        if (!order.delivery) order.delivery = {};
        order.delivery.deliveredAt = new Date();
      }

      // Calculate financials if not already calculated
      if (!order.financial?.commissionAmount) {
        const { gross, commissionRate, commission, riderNet } =
          await calculateOrderFinancials(order);

        // Create transactions for financial tracking
        try {
          // 1. Customer payment transaction
          await Transaction.create({
            orderId: order._id,
            customerId: order.customerId,
            riderId: order.riderId,
            type: "order_payment",
            amount: gross,
            currency: "NGN",
            status: "completed",
            description: `Order #${order._id} payment`,
            processedAt: new Date(),
          });

          // 2. Commission transaction
          await Transaction.create({
            orderId: order._id,
            customerId: order.customerId,
            riderId: order.riderId,
            type: "commission",
            amount: commission,
            currency: "NGN",
            status: "completed",
            description: `Commission from order #${order._id}`,
            commissionRate: commissionRate,
            processedAt: new Date(),
          });

          // 3. Rider earnings transaction (will be included in weekly payout)
          await Transaction.create({
            orderId: order._id,
            customerId: order.customerId,
            riderId: order.riderId,
            type: "rider_payout",
            amount: riderNet,
            currency: "NGN",
            status: "pending", // Will be marked completed when payout is processed
            description: `Rider earnings from order #${order._id}`,
            processedAt: null, // Will be set when payout is processed
          });
        } catch (txError) {
          console.error(
            "[ORDER] Failed to create transactions:",
            txError.message
          );
        }
      }

      await updateRiderPayoutForOrder(order);

      // Check and award referral bonus
      try {
        const { checkAndAwardReferralBonus } = await import(
          "./referralController.js"
        );
        await checkAndAwardReferralBonus(order);
      } catch (refError) {
        console.error("[ORDER] Failed to check referral bonus:", refError);
      }

      // Check and unlock Gold Status (for ride orders)
      try {
        const { checkAndUnlockGoldStatus } = await import(
          "./goldStatusController.js"
        );
        await checkAndUnlockGoldStatus(order, order.riderId);
      } catch (goldStatusError) {
        console.error("[ORDER] Failed to check Gold Status:", goldStatusError);
      }
    }

    appendTimeline(order, next, `Status set to ${next}`);
    await order.save();

    const statusMessages = {
      picked_up: {
        customer: "Order picked up",
        customerMsg: "Your order has been picked up by the rider",
        rider: "Order picked up",
        riderMsg: "You've marked the order as picked up",
      },
      delivering: {
        customer: "Out for delivery",
        customerMsg: "Your order is on the way to the dropoff location",
        rider: "Delivery started",
        riderMsg: "You've started the delivery",
      },
      delivered: {
        customer: "Order delivered",
        customerMsg: "Your order has been successfully delivered",
        rider: "Order delivered",
        riderMsg: "Order has been marked as delivered",
      },
      cancelled: {
        customer: "Order cancelled",
        customerMsg: "This order has been cancelled",
        rider: "Order cancelled",
        riderMsg: "This order has been cancelled",
      },
    };

    const statusInfo = statusMessages[next] || {
      customer: "Order updated",
      customerMsg: `Order status changed to ${next}`,
      rider: "Order updated",
      riderMsg: `Order status changed to ${next}`,
    };

    try {
      await createAndSendNotification(order.customerId, {
        type: "order_status_updated",
        title: statusInfo.customer,
        message: statusInfo.customerMsg,
        metadata: { orderId: order._id.toString() },
      });
    } catch {}

    if (order.riderId) {
      try {
        await createAndSendNotification(order.riderId, {
          type: "order_status_updated",
          title: statusInfo.rider,
          message: statusInfo.riderMsg,
          metadata: { orderId: order._id.toString() },
        });
      } catch {}
    }

    io.to(`user:${order.customerId}`).emit(SocketEvents.ORDER_STATUS_UPDATED, {
      id: order._id.toString(),
      status: next,
    });
    if (order.riderId) {
      io.to(`user:${order.riderId}`).emit(SocketEvents.ORDER_STATUS_UPDATED, {
        id: order._id.toString(),
        status: next,
      });
    }
    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });
    const user = req.user;
    const isOwner = String(order.customerId) === String(user._id);
    const isAssignedRider =
      order.riderId && String(order.riderId) === String(user._id);
    const isAdmin = user.role === "admin";
    const isRiderViewingAvailableOrder =
      user.role === "rider" && order.status === "pending" && !order.riderId;
    if (
      !isOwner &&
      !isAssignedRider &&
      !isAdmin &&
      !isRiderViewingAvailableOrder
    )
      return res.status(403).json({ success: false, error: "Forbidden" });

    const orderObj = order.toObject();

    if (order.customerId) {
      try {
        const customer = await User.findById(order.customerId).select(
          "fullName profilePicture"
        );
        if (customer) {
          orderObj.customer = {
            fullName: customer.fullName || null,
            profilePicture: customer.profilePicture || null,
          };
        }
      } catch (error) {
        console.error(
          "[ORDER] Failed to load customer info for order",
          order._id?.toString?.() || req.params.id,
          error
        );
      }
    }
    if (
      order.riderId &&
      ["assigned", "picked_up", "delivering"].includes(order.status)
    ) {
      try {
        const riderLocation = await RiderLocation.findOne({
          riderId: order.riderId,
        }).select("location lastSeen online");
        if (riderLocation && riderLocation.location?.coordinates) {
          const [lng, lat] = riderLocation.location.coordinates;
          orderObj.riderLocation = {
            lat,
            lng,
            lastSeen: riderLocation.lastSeen,
            online: riderLocation.online,
          };
        }
      } catch (error) {
        console.error("❌ [ORDERS] Error fetching rider location:", error);
      }
    }

    res.json({ success: true, order: orderObj });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const generateDeliveryOtp = async (req, res) => {
  try {
    if (req.user.role !== "rider")
      return res.status(403).json({ success: false, error: "Only riders" });
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });
    if (String(order.riderId) !== String(req.user._id))
      return res.status(403).json({ success: false, error: "Not your order" });
    if (order.status !== "delivering") {
      return res.status(400).json({
        success: false,
        error:
          "Order must be in 'delivering' status (rider must have started delivery and reached destination) to generate delivery OTP",
      });
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const ttlMinutes = Number(process.env.DELIVERY_OTP_TTL_MIN || 15);
    order.delivery.otpCode = code;
    order.delivery.otpExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    appendTimeline(order, "delivering", "Delivery OTP generated");
    await order.save();

    // Log OTP generation for debugging
    console.log(`[OTP] Generated delivery OTP for order ${order._id}:`, {
      orderId: order._id.toString(),
      otpCode: code,
      expiresAt: order.delivery.otpExpiresAt,
      riderId: req.user._id.toString(),
      customerId: order.customerId?.toString(),
      ttlMinutes,
    });
    try {
      await createAndSendNotification(order.customerId, {
        type: "delivery_otp",
        title: "Delivery code",
        message: `Your delivery code is ${code}. Share this code with the recipient at the dropoff location.`,
        metadata: { orderId: order._id.toString() },
      });
    } catch {}
    io.to(`user:${order.customerId}`).emit(SocketEvents.ORDER_STATUS_UPDATED, {
      id: order._id.toString(),
      status: order.status,
    });
    io.to(`user:${order.customerId}`).emit(SocketEvents.DELIVERY_OTP, {
      id: order._id.toString(),
      otpExpiresAt: order.delivery.otpExpiresAt,
    });
    if (order.riderId) {
      io.to(`user:${order.riderId}`).emit(SocketEvents.DELIVERY_OTP, {
        id: order._id.toString(),
        otpExpiresAt: order.delivery.otpExpiresAt,
      });
    }
    res.json({
      success: true,
      otp: code,
      expiresAt: order.delivery.otpExpiresAt,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const verifyDeliveryOtp = async (req, res) => {
  try {
    if (req.user.role !== "rider")
      return res.status(403).json({ success: false, error: "Only riders" });
    const { code } = req.body || {};
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });
    if (String(order.riderId) !== String(req.user._id))
      return res.status(403).json({ success: false, error: "Not your order" });
    if (!order.delivery?.otpCode || !order.delivery?.otpExpiresAt) {
      return res
        .status(400)
        .json({ success: false, error: "No OTP to verify" });
    }
    if (new Date(order.delivery.otpExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, error: "OTP expired" });
    }
    if (String(code) !== String(order.delivery.otpCode)) {
      return res.status(400).json({ success: false, error: "Invalid code" });
    }
    order.delivery.otpVerifiedAt = new Date();
    order.delivery.deliveredAt = new Date();
    order.status = "delivered";

    if (!order.financial?.commissionAmount) {
      const { gross, commissionRate, commission, riderNet } =
        await calculateOrderFinancials(order);

      try {
        await Transaction.create({
          orderId: order._id,
          customerId: order.customerId,
          riderId: order.riderId,
          type: "order_payment",
          amount: gross,
          currency: "NGN",
          status: "completed",
          description: `Order #${order._id} payment`,
          processedAt: new Date(),
        });

        // 2. Commission transaction
        await Transaction.create({
          orderId: order._id,
          customerId: order.customerId,
          riderId: order.riderId,
          type: "commission",
          amount: commission,
          currency: "NGN",
          status: "completed",
          description: `Commission from order #${order._id}`,
          commissionRate: commissionRate,
          processedAt: new Date(),
        });

        // 3. Rider earnings transaction (will be included in weekly payout)
        await Transaction.create({
          orderId: order._id,
          customerId: order.customerId,
          riderId: order.riderId,
          type: "rider_payout",
          amount: riderNet,
          currency: "NGN",
          status: "pending", // Will be marked completed when payout is processed
          description: `Rider earnings from order #${order._id}`,
          processedAt: null, // Will be set when payout is processed
        });
      } catch (txError) {
        console.error(
          "[ORDER] Failed to create transactions:",
          txError.message
        );
        // Don't fail the delivery if transaction creation fails
      }
    }

    appendTimeline(order, "delivered", "OTP verified and order delivered");
    await order.save();

    await updateRiderPayoutForOrder(order);

    try {
      const { checkAndAwardReferralBonus } = await import(
        "./referralController.js"
      );
      await checkAndAwardReferralBonus(order);
    } catch (refError) {
      console.error("[ORDER] Failed to check referral bonus:", refError);
    }

    try {
      await createAndSendNotification(order.customerId, {
        type: "delivery_verified",
        title: "Delivery verified",
        message: `Order #${order._id} has been delivered and verified`,
        metadata: { orderId: order._id.toString() },
      });
    } catch {}

    // Notify rider
    try {
      await createAndSendNotification(req.user._id, {
        type: "delivery_verified",
        title: "Delivery verified",
        message: `Order #${order._id} delivery has been verified`,
        metadata: { orderId: order._id.toString() },
      });
    } catch {}

    io.to(`user:${order.customerId}`).emit(SocketEvents.ORDER_STATUS_UPDATED, {
      id: order._id.toString(),
      status: order.status,
    });
    io.to(`user:${order.customerId}`).emit(SocketEvents.DELIVERY_VERIFIED, {
      id: order._id.toString(),
    });
    io.to(`user:${req.user._id}`).emit(SocketEvents.DELIVERY_VERIFIED, {
      id: order._id.toString(),
    });
    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const uploadDeliveryProofPhoto = async (req, res) => {
  try {
    if (req.user.role !== "rider")
      return res.status(403).json({ success: false, error: "Only riders" });
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });

    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });
    if (String(order.riderId) !== String(req.user._id))
      return res.status(403).json({ success: false, error: "Not your order" });

    const photoUrl = `/api/uploads/profiles/${req.file.filename}`;
    order.delivery.photoUrl = photoUrl;
    await order.save();

    // Emit socket event for photo upload
    io.to(`user:${order.customerId}`).emit(
      SocketEvents.DELIVERY_PROOF_UPDATED,
      {
        id: order._id.toString(),
      }
    );
    if (order.riderId) {
      io.to(`user:${order.riderId}`).emit(SocketEvents.DELIVERY_PROOF_UPDATED, {
        id: order._id.toString(),
      });
    }

    res.json({ success: true, photoUrl });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

export const updateDeliveryProof = async (req, res) => {
  try {
    if (req.user.role !== "rider")
      return res.status(403).json({ success: false, error: "Only riders" });
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, error: "Order not found" });
    if (String(order.riderId) !== String(req.user._id))
      return res.status(403).json({ success: false, error: "Not your order" });
    const { photoUrl, recipientName, recipientPhone, note, paymentReceived } =
      req.body || {};
    if (photoUrl) order.delivery.photoUrl = photoUrl;
    if (recipientName) order.delivery.recipientName = recipientName;
    if (recipientPhone) order.delivery.recipientPhone = recipientPhone;
    if (note) order.delivery.note = note;
    const wasPaymentPending = order.payment.status !== "paid";
    if (paymentReceived === true) {
      order.payment.status = "paid";
      order.payment.ref = `cash-${order._id}-${Date.now()}`;
      appendTimeline(order, order.status, "Payment confirmed by rider");
    }
    appendTimeline(order, order.status, "Delivery proof updated");
    await order.save();

    if (
      paymentReceived === true &&
      wasPaymentPending &&
      order.status === "delivered"
    ) {
      try {
        const customer = await User.findById(order.customerId).select(
          "email fullName"
        );
        if (customer?.email) {
          const orderDate = new Date(order.createdAt).toLocaleDateString(
            "en-NG",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }
          );
          const deliveryDate = order.delivery?.deliveredAt
            ? new Date(order.delivery.deliveredAt).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "N/A";

          const invoiceHtml = `
            <div style="margin-bottom: 24px;">
              <h2 style="color: #AB8BFF; margin-bottom: 16px;">Thank You for Using 9thWaka!</h2>
              <p style="color: #C9CDD9; margin-bottom: 12px;">Your order has been successfully delivered and payment confirmed.</p>
            </div>
            
            <div style="background: #1A1E2E; border: 1px solid #3C4160; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #E6E6F0; margin-bottom: 16px; font-size: 16px;">Order Invoice</h3>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #8D93A5; font-size: 13px;">Order ID:</span>
                <span style="color: #E6E6F0; margin-left: 8px; font-weight: 600;">#${String(
                  order._id
                )
                  .slice(-8)
                  .toUpperCase()}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #8D93A5; font-size: 13px;">Order Date:</span>
                <span style="color: #E6E6F0; margin-left: 8px;">${orderDate}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #8D93A5; font-size: 13px;">Delivery Date:</span>
                <span style="color: #E6E6F0; margin-left: 8px;">${deliveryDate}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #8D93A5; font-size: 13px;">Items:</span>
                <span style="color: #E6E6F0; margin-left: 8px;">${
                  order.items || "N/A"
                }</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #8D93A5; font-size: 13px;">Pickup:</span>
                <span style="color: #E6E6F0; margin-left: 8px;">${
                  order.pickup?.address || "N/A"
                }</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #8D93A5; font-size: 13px;">Dropoff:</span>
                <span style="color: #E6E6F0; margin-left: 8px;">${
                  order.dropoff?.address || "N/A"
                }</span>
              </div>
              
              <div style="border-top: 1px solid #3C4160; margin-top: 16px; padding-top: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #8D93A5; font-size: 13px;">Delivery Fee:</span>
                  <span style="color: #E6E6F0; font-weight: 600;">₦${Number(
                    order.price || 0
                  ).toLocaleString()}</span>
                </div>
                ${
                  order.priceNegotiation?.status === "accepted" &&
                  order.price !== order.originalPrice
                    ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                      <span style="color: #8D93A5; font-size: 13px;">Original Price:</span>
                      <span style="color: #E6E6F0; text-decoration: line-through;">₦${Number(
                        order.originalPrice || 0
                      ).toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                      <span style="color: #8D93A5; font-size: 13px;">Negotiated Price:</span>
                      <span style="color: #AB8BFF; font-weight: 600;">₦${Number(
                        order.price || 0
                      ).toLocaleString()}</span>
                    </div>`
                    : ""
                }
                <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #3C4160;">
                  <span style="color: #E6E6F0; font-size: 16px; font-weight: 700;">Total Paid:</span>
                  <span style="color: #AB8BFF; font-size: 18px; font-weight: 700;">₦${Number(
                    order.price || 0
                  ).toLocaleString()}</span>
                </div>
              </div>
              
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #3C4160;">
                <div style="color: #8D93A5; font-size: 12px; margin-bottom: 4px;">Payment Reference:</div>
                <div style="color: #E6E6F0; font-size: 13px; font-family: monospace;">${
                  order.payment.ref || "N/A"
                }</div>
              </div>
            </div>
            
            <div style="background: #1A1E2E; border: 1px solid #3C4160; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <p style="color: #C9CDD9; margin: 0; line-height: 1.6;">
                We hope you had a great experience with 9thWaka. If you have any questions or concerns, please don't hesitate to contact our support team.
              </p>
            </div>
            
            <p style="color: #8D93A5; font-size: 13px; margin-top: 24px;">
              This email serves as your receipt and invoice for this transaction.
            </p>
          `;

          // Send thank you email with invoice
          const { sendEmailDirectly } = await import(
            "../services/notificationService.js"
          );
          await sendEmailDirectly(
            customer.email,
            `Order Invoice - Order #${String(order._id)
              .slice(-8)
              .toUpperCase()}`,
            "Thank You for Using 9thWaka!",
            buildDarkEmailTemplate(
              "Thank You for Using 9thWaka!",
              invoiceHtml,
              null
            )
          );
        }
      } catch (emailError) {
        console.error(
          "❌ [ORDER] Failed to send invoice email:",
          emailError?.message || emailError
        );
      }

      try {
        await createAndSendNotification(order.customerId, {
          type: "order_payment_confirmed",
          title: "Payment Confirmed - Thank You!",
          message: `Your payment of ₦${Number(
            order.price || 0
          ).toLocaleString()} has been confirmed. Check your email for your invoice.`,
          metadata: { orderId: order._id.toString() },
        });
      } catch {}
    } else {
      try {
        await createAndSendNotification(order.customerId, {
          type: "delivery_proof_updated",
          title: "✅ Order Delivered Successfully!",
          message: `Your order #${order._id
            .toString()
            .slice(-6)
            .toUpperCase()} has been delivered and proof has been uploaded. The recipient has received your order.`,
          metadata: { orderId: order._id.toString() },
        });
      } catch {}
    }

    if (paymentReceived === true && wasPaymentPending) {
      try {
        io.to(`user:${order.customerId}`).emit(SocketEvents.PAYMENT_CONFIRMED, {
          orderId: order._id.toString(),
          amount: order.price || 0,
        });
        if (order.riderId) {
          io.to(`user:${order.riderId}`).emit(SocketEvents.PAYMENT_CONFIRMED, {
            orderId: order._id.toString(),
            amount: order.price || 0,
          });
        }
      } catch {}
    }

    io.to(`user:${order.customerId}`).emit(
      SocketEvents.DELIVERY_PROOF_UPDATED,
      {
        id: order._id.toString(),
      }
    );
    // Also emit to rider
    if (order.riderId) {
      io.to(`user:${order.riderId}`).emit(SocketEvents.DELIVERY_PROOF_UPDATED, {
        id: order._id.toString(),
      });
    }
    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

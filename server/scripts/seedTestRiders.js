import dotenv from "dotenv";
import mongoose from "mongoose";
import RiderLocation from "../models/RiderLocation.js";
import User from "../models/User.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/9thwaka";
const TEST_RIDER_PASSWORD =
  process.env.TEST_RIDER_PASSWORD || "TestRider123!";

const locations = [
  {
    key: "lekki",
    name: "Lekki Phase 1",
    address: "Lekki Phase 1, Lagos, Nigeria",
    lat: 6.453056,
    lng: 3.395833,
  },
  {
    key: "ikorodu",
    name: "Benson Ikorodu",
    address: "Benson Bus Stop, Ikorodu, Lagos, Nigeria",
    lat: 6.61308,
    lng: 3.50141,
  },
  {
    key: "ikeja",
    name: "Ikeja",
    address: "Ikeja City Mall, Alausa, Lagos, Nigeria",
    lat: 6.601838,
    lng: 3.351486,
  },
  {
    key: "yaba",
    name: "Yaba",
    address: "Yaba, Lagos, Nigeria",
    lat: 6.5174,
    lng: 3.3841,
  },
  {
    key: "surulere",
    name: "Surulere",
    address: "Surulere, Lagos, Nigeria",
    lat: 6.5003,
    lng: 3.3577,
  },
  {
    key: "ajah",
    name: "Ajah",
    address: "Ajah, Lagos, Nigeria",
    lat: 6.4698,
    lng: 3.5852,
  },
  {
    key: "victoria_island",
    name: "Victoria Island",
    address: "Victoria Island, Lagos, Nigeria",
    lat: 6.4281,
    lng: 3.4219,
  },
  {
    key: "oshodi",
    name: "Oshodi",
    address: "Oshodi, Lagos, Nigeria",
    lat: 6.555,
    lng: 3.343,
  },
  {
    key: "lagos_island",
    name: "Lagos Island",
    address: "Lagos Island, Lagos, Nigeria",
    lat: 6.4541,
    lng: 3.3947,
  },
];

const ridersConfig = [
  {
    email: "test-rider-lekki-courier-motorbike@example.com",
    fullName: "Test Rider Lekki Courier Motorbike",
    phoneNumber: "+2348100000001",
    vehicleType: "motorbike",
    supportedServices: ["courier"],
    preferredService: "courier",
    locationKey: "lekki",
  },
  {
    email: "test-rider-lekki-ride-car-standard@example.com",
    fullName: "Test Rider Lekki Ride Car Standard",
    phoneNumber: "+2348100000002",
    vehicleType: "car_standard",
    supportedServices: ["ride"],
    preferredService: "ride",
    locationKey: "lekki",
    vehicleYear: 2015,
    hasAirConditioning: true,
  },
  {
    email: "test-rider-ikorodu-both-motorbike@example.com",
    fullName: "Test Rider Ikorodu Both Motorbike",
    phoneNumber: "+2348100000003",
    vehicleType: "motorbike",
    supportedServices: ["courier", "ride"],
    preferredService: "courier",
    locationKey: "ikorodu",
  },
  {
    email: "test-rider-ikeja-courier-bicycle@example.com",
    fullName: "Test Rider Ikeja Courier Bicycle",
    phoneNumber: "+2348100000004",
    vehicleType: "bicycle",
    supportedServices: ["courier"],
    preferredService: "courier",
    locationKey: "ikeja",
  },
  {
    email: "test-rider-yaba-ride-car-comfort@example.com",
    fullName: "Test Rider Yaba Ride Car Comfort",
    phoneNumber: "+2348100000005",
    vehicleType: "car_comfort",
    supportedServices: ["ride"],
    preferredService: "ride",
    locationKey: "yaba",
    vehicleYear: 2017,
    hasAirConditioning: true,
  },
  {
    email: "test-rider-surulere-courier-van@example.com",
    fullName: "Test Rider Surulere Courier Van",
    phoneNumber: "+2348100000006",
    vehicleType: "van",
    supportedServices: ["courier"],
    preferredService: "courier",
    locationKey: "surulere",
  },
  {
    email: "test-rider-ajah-courier-tricycle@example.com",
    fullName: "Test Rider Ajah Courier Tricycle",
    phoneNumber: "+2348100000007",
    vehicleType: "tricycle",
    supportedServices: ["courier"],
    preferredService: "courier",
    locationKey: "ajah",
  },
  {
    email: "test-rider-vi-ride-car-premium@example.com",
    fullName: "Test Rider VI Ride Car Premium",
    phoneNumber: "+2348100000008",
    vehicleType: "car_premium",
    supportedServices: ["ride"],
    preferredService: "ride",
    locationKey: "victoria_island",
    vehicleYear: 2019,
    hasAirConditioning: true,
  },
  {
    email: "test-rider-oshodi-ride-car@example.com",
    fullName: "Test Rider Oshodi Ride Car",
    phoneNumber: "+2348100000009",
    vehicleType: "car",
    supportedServices: ["ride"],
    preferredService: "ride",
    locationKey: "oshodi",
    vehicleYear: 2014,
    hasAirConditioning: true,
  },
  {
    email: "test-rider-lagos-island-both-motorbike@example.com",
    fullName: "Test Rider Lagos Island Both Motorbike",
    phoneNumber: "+2348100000010",
    vehicleType: "motorbike",
    supportedServices: ["courier", "ride"],
    preferredService: "courier",
    locationKey: "lagos_island",
  },
];

const getLocationByKey = (key) => {
  const loc = locations.find((l) => l.key === key);
  if (!loc) {
    throw new Error(`Location with key "${key}" not found`);
  }
  return loc;
};

const createOrUpdateRider = async (config) => {
  const location = getLocationByKey(config.locationKey);

  let rider = await User.findOne({ email: config.email });
  const isNew = !rider;

  if (!rider) {
    rider = new User({
      email: config.email,
      role: "rider",
    });
  }

  rider.fullName = config.fullName;
  rider.phoneNumber = config.phoneNumber;
  rider.vehicleType = config.vehicleType;
  rider.preferredService = config.preferredService;
  rider.supportedServices = config.supportedServices;
  rider.address = location.address;
  rider.lastKnownLocation = {
    lat: location.lat,
    lng: location.lng,
    address: location.address,
    updatedAt: new Date(),
  };
  rider.searchRadiusKm = 7;

  rider.nin = "12345678901";
  rider.ninVerified = true;
  rider.driverLicenseNumber = "DL-TEST-123456";
  rider.driverLicensePicture =
    "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg";
  rider.driverLicenseVerified = true;
  rider.vehiclePicture =
    "https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg";

  if (typeof config.vehicleYear === "number") {
    rider.vehicleYear = config.vehicleYear;
  }
  if (typeof config.hasAirConditioning !== "undefined") {
    rider.hasAirConditioning = config.hasAirConditioning;
  }

  rider.bankAccountName = config.fullName;
  rider.bankName = "Test Bank";
  rider.bankAccountNumber = "0000000000";

  rider.isVerified = true;
  rider.termsAccepted = true;
  rider.termsAcceptedAt = new Date();

  rider.password = TEST_RIDER_PASSWORD;

  await rider.save();

  await RiderLocation.findOneAndUpdate(
    { riderId: rider._id },
    {
      riderId: rider._id,
      location: {
        type: "Point",
        coordinates: [location.lng, location.lat],
      },
      online: true,
      lastSeen: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(
    `${isNew ? "✅ Created" : "🔄 Updated"} rider ${
      rider.fullName
    } (${rider.email}) at ${location.name} [${config.vehicleType} | ${config.supportedServices.join(
      ", "
    )}]`
  );
};

const seedTestRiders = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("🚚 Connected to MongoDB");

    let created = 0;
    let updated = 0;

    for (const config of ridersConfig) {
      const existing = await User.findOne({ email: config.email });
      if (!existing) {
        await createOrUpdateRider(config);
        created += 1;
      } else {
        await createOrUpdateRider(config);
        updated += 1;
      }
    }

    console.log("\n🎯 Seed complete");
    console.log(`   Riders created: ${created}`);
    console.log(`   Riders updated: ${updated}`);
  } catch (error) {
    console.error("❌ Error seeding test riders:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

seedTestRiders()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error running seedTestRiders script:", error);
    process.exit(1);
  });

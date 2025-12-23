import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    // Delivery pricing rates
    pricing: {
      minFare: {
        type: Number,
        default: 800,
        min: 0,
      },
      perKmShort: {
        type: Number,
        default: 100,
        min: 0,
      },
      perKmMedium: {
        type: Number,
        default: 140,
        min: 0,
      },
      perKmLong: {
        type: Number,
        default: 200,
        min: 0,
      },
      shortDistanceMax: {
        type: Number,
        default: 8,
        min: 0,
      },
      mediumDistanceMax: {
        type: Number,
        default: 15,
        min: 0,
      },
      // Vehicle type multipliers
      vehicleMultipliers: {
        bicycle: {
          type: Number,
          default: 0.8,
          min: 0,
        },
        motorbike: {
          type: Number,
          default: 1.0,
          min: 0,
        },
        tricycle: {
          type: Number,
          default: 1.15,
          min: 0,
        },
        car: {
          type: Number,
          default: 1.25,
          min: 0,
        },
        car_standard: {
          type: Number,
          default: 1.2,
          min: 0,
        },
        car_comfort: {
          type: Number,
          default: 1.35,
          min: 0,
        },
        car_premium: {
          type: Number,
          default: 1.55,
          min: 0,
        },
        van: {
          type: Number,
          default: 1.5,
          min: 0,
        },
      },
    },
    // Commission rate (percentage)
    commissionRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    // Conversion rate for dashboard
    conversionRate: {
      type: Number,
      default: 5.75, 
      min: 0,
      max: 100,
    },
    // System settings
    system: {
      useDatabaseRates: {
        type: Boolean,
        default: true,
      },
      defaultSearchRadiusKm: {
        type: Number,
        default: 7,
        min: 1,
        max: 30,
      },
      // Maximum allowed search radius riders can set (km)
      maxAllowedRadiusKm: {
        type: Number,
        default: 20,
        min: 1,
        max: 50,
      },
    },
    vehicleSearchRadiusKm: {
      bicycle: {
        type: Number,
        default: 8,
        min: 1,
        max: 50,
      },
      motorbike: {
        type: Number,
        default: 15,
        min: 1,
        max: 50,
      },
      tricycle: {
        type: Number,
        default: 15,
        min: 1,
        max: 50,
      },
      car: {
        type: Number,
        default: 20,
        min: 1,
        max: 100,
      },
      van: {
        type: Number,
        default: 20,
        min: 1,
        max: 100,
      },
    },
    // Vehicle requirements for ride services (KYC validation)
    vehicleRequirements: {
      car_standard: {
        minYear: {
          type: Number,
          default: 2010,
          min: 1900,
        },
        requireAirConditioning: {
          type: Boolean,
          default: false,
        },
      },
      car_comfort: {
        minYear: {
          type: Number,
          default: 2010,
          min: 1900,
        },
        requireAirConditioning: {
          type: Boolean,
          default: false,
        },
      },
      car_premium: {
        minYear: {
          type: Number,
          default: 2015, // Premium should have newer vehicles
          min: 1900,
        },
        requireAirConditioning: {
          type: Boolean,
          default: true, // Premium requires AC
        },
      },
    },
    // Payment account details for rider commission payments (2 options)
    paymentAccounts: {
      primary: {
        bankName: {
          type: String,
          default: null,
        },
        accountNumber: {
          type: String,
          default: null,
        },
        accountName: {
          type: String,
          default: null,
        },
      },
      secondary: {
        bankName: {
          type: String,
          default: null,
        },
        accountNumber: {
          type: String,
          default: null,
        },
        accountName: {
          type: String,
          default: null,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model("Settings", SettingsSchema);

export default Settings;

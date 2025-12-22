import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: null,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    priority: {
      type: Number,
      default: 0,
      index: true,
    },
    allowedRoles: {
      type: [String],
      default: ["customer", "rider"],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const DEFAULT_SERVICES = [
  {
    key: "courier",
    name: "Courier",
    description: "Send parcels and documents anywhere in the city.",
    icon: "package",
    priority: 0,
    allowedRoles: ["customer", "rider", "admin"],
    metadata: {
      color: "#1E3A8A",
      tagline: "Fast package delivery",
    },
  },
  {
    key: "ride",
    name: "Ride",
    description: "Book safe and affordable rides in minutes.",
    icon: "car",
    priority: 1,
    allowedRoles: ["customer", "rider", "admin"],
    metadata: {
      color: "#0F766E",
      tagline: "Move across town with ease",
    },
  },
];

ServiceSchema.statics.ensureDefaultServices = async function () {
  for (const service of DEFAULT_SERVICES) {
    await this.findOneAndUpdate(
      { key: service.key },
      { $setOnInsert: service },
      { upsert: true, new: true }
    );
  }
};

ServiceSchema.statics.getServicesForRole = async function (
  role,
  includeDisabled = false
) {
  await this.ensureDefaultServices();
  const query = includeDisabled ? {} : { enabled: true };
  const services = await this.find(query)
    .sort({ priority: 1, createdAt: 1 })
    .lean();

  if (!role) return services;
  return services.filter((service) => {
    if (!Array.isArray(service.allowedRoles) || !service.allowedRoles.length) {
      return true;
    }
    return service.allowedRoles.includes(role);
  });
};

ServiceSchema.statics.getServiceKeysForRole = async function (
  role,
  includeDisabled = false
) {
  const services = await this.getServicesForRole(role, includeDisabled);
  return services.map((service) => service.key);
};

ServiceSchema.statics.resolveServiceKey = async function ({
  requested,
  role,
  fallback,
  includeDisabled = false,
  defaultKey = "courier",
} = {}) {
  const availableKeys = await this.getServiceKeysForRole(role, includeDisabled);

  if (requested && availableKeys.includes(requested)) {
    return requested;
  }
  if (fallback && availableKeys.includes(fallback)) {
    return fallback;
  }
  if (availableKeys.includes(defaultKey)) {
    return defaultKey;
  }
  return availableKeys[0] || defaultKey;
};

ServiceSchema.statics.getActiveServices = async function (role) {
  return this.getServicesForRole(role, false);
};

const Service = mongoose.model("Service", ServiceSchema);

export default Service;

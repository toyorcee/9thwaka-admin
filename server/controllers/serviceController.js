import Service from "../models/Service.js";

export const getServices = async (req, res) => {
  try {
    const role = req.user?.role || req.query.role?.toString();
    const services = await Service.getActiveServices(role);
    res.json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("[SERVICES] Failed to fetch services:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to load services",
    });
  }
};

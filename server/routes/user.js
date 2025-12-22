import express from "express";
import {
  acceptTerms,
  checkEmailAvailability,
  getNotificationPreferences,
  updateNotificationPreferences,
  updateProfile,
  updatePushToken,
  updateSearchRadius,
  uploadDriverLicense,
  uploadProfilePicture,
  uploadVehiclePicture,
  verifyBankAccount,
} from "../controllers/userController.js";
import { getBanks } from "../services/paystackService.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/profile-picture",
  protect,
  (req, res, next) => {
    console.log("🎯 [ROUTE] POST /api/user/profile-picture hit");
    console.log("📍 Request from:", req.ip || req.connection.remoteAddress);
    console.log("📋 Content-Type:", req.headers["content-type"]);
    console.log("👤 User ID:", req.user?.userId || req.user?._id);
    next();
  },
  upload.single("profilePicture"),
  (err, req, res, next) => {
    if (err) {
      console.error("❌ [MULTER] Error:", err.message);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File too large. Maximum size is 5MB." });
      }
      if (err.message.includes("Only image files")) {
        return res.status(400).json({ error: err.message });
      }
      return res
        .status(400)
        .json({ error: "File upload error: " + err.message });
    }
    next();
  },
  uploadProfilePicture
);

router.post(
  "/driver-license",
  protect,
  (req, res, next) => {
    console.log("🎯 [ROUTE] POST /api/user/driver-license hit");
    console.log("📍 Request from:", req.ip || req.connection.remoteAddress);
    console.log("📋 Content-Type:", req.headers["content-type"]);
    console.log("👤 User ID:", req.user?.userId || req.user?._id);
    next();
  },
  upload.single("driverLicense"),
  (err, req, res, next) => {
    if (err) {
      console.error("❌ [MULTER] Error:", err.message);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File too large. Maximum size is 5MB." });
      }
      if (err.message.includes("Only image files")) {
        return res.status(400).json({ error: err.message });
      }
      return res
        .status(400)
        .json({ error: "File upload error: " + err.message });
    }
    next();
  },
  uploadDriverLicense
);

router.post(
  "/vehicle-picture",
  protect,
  (req, res, next) => {
    console.log("🎯 [ROUTE] POST /api/user/vehicle-picture hit");
    console.log("📍 Request from:", req.ip || req.connection.remoteAddress);
    console.log("📋 Content-Type:", req.headers["content-type"]);
    console.log("👤 User ID:", req.user?.userId || req.user?._id);
    next();
  },
  upload.single("vehiclePicture"),
  (err, req, res, next) => {
    if (err) {
      console.error("❌ [MULTER] Error:", err.message);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File too large. Maximum size is 5MB." });
      }
      if (err.message.includes("Only image files")) {
        return res.status(400).json({ error: err.message });
      }
      return res
        .status(400)
        .json({ error: "File upload error: " + err.message });
    }
    next();
  },
  uploadVehiclePicture
);

export default router;

// PUT /api/user/profile
router.put("/profile", protect, async (req, res, next) => {
  return updateProfile(req, res, next);
});

// POST /api/user/push-token
router.post("/push-token", protect, updatePushToken);

// GET /api/user/notification-preferences
router.get("/notification-preferences", protect, getNotificationPreferences);

// PUT /api/user/notification-preferences
router.put("/notification-preferences", protect, updateNotificationPreferences);

// GET /api/user/check-email
router.get("/check-email", protect, checkEmailAvailability);

// PATCH /api/user/search-radius (Riders only)
router.patch("/search-radius", protect, updateSearchRadius);

// POST /api/user/accept-terms
router.post("/accept-terms", protect, acceptTerms);

// POST /api/user/verify-bank-account
router.post("/verify-bank-account", protect, verifyBankAccount);

// GET /api/user/banks (Get list of banks from Paystack)
router.get("/banks", protect, async (req, res) => {
  try {
    const result = await getBanks();
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || "Failed to fetch banks",
      });
    }
    return res.json({
      success: true,
      banks: result.banks || [],
    });
  } catch (error) {
    console.error("❌ [BANKS] Error fetching banks:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

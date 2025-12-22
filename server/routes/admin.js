import express from "express";
import {
  adminCancelOrder,
  adminUpdateOrderPrice,
  getAdminStats,
  getAllCustomers,
  getAllOrders,
  getOrderDetails,
  getInitialRidersOnlineStatus,
  getAllRiders,
  getPaidReferralRewards,
  getPendingReferralRewards,
  getReferralStats,
  getRiderEarnings,
} from "../controllers/adminController.js";

import { getAdminGoldStatusStats } from "../controllers/goldStatusController.js";
import {
  getSettings,
  updateSettings,
} from "../controllers/settingsController.js";
import { getAdminStreakStats } from "../controllers/streakBonusController.js";
import { adminOnly, protect } from "../middleware/auth.js";

const router = express.Router();

// Admin Dashboard Stats
router.get("/stats", protect, adminOnly, getAdminStats);

// Admin Orders
router.get("/orders", protect, adminOnly, getAllOrders);
router.get("/orders/:id", protect, adminOnly, getOrderDetails);
router.patch("/orders/:id/cancel", protect, adminOnly, adminCancelOrder);
router.patch("/orders/:id/price", protect, adminOnly, adminUpdateOrderPrice);

// Admin Riders
router.get("/riders", protect, adminOnly, getAllRiders);
router.get("/riders/:riderId/earnings", protect, adminOnly, getRiderEarnings);
router.get(
  "/riders/online-status",
  protect,
  adminOnly,
  getInitialRidersOnlineStatus
);

// Admin Customers
router.get("/customers", protect, adminOnly, getAllCustomers);

// Admin Settings (Rates)
router.get("/settings", protect, adminOnly, getSettings);
router.put("/settings", protect, adminOnly, updateSettings);

// Admin Referrals
router.get("/referrals/pending", protect, adminOnly, getPendingReferralRewards);
router.get("/referrals/paid", protect, adminOnly, getPaidReferralRewards);
router.get("/referrals/stats", protect, adminOnly, getReferralStats);

// Admin Streak Bonuses
router.get("/streak/:userId", protect, adminOnly, getAdminStreakStats);

// Admin Gold Status
router.get("/gold-status/:userId", protect, adminOnly, getAdminGoldStatusStats);

export default router;

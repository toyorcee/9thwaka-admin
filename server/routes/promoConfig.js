import express from "express";
import {
  getPromoConfig,
  toggleAllPromos,
  updateGoldStatusPromo,
  updateReferralPromo,
  updateStreakPromo,
} from "../controllers/promoConfigController.js";
import { adminOnly, protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Get current promo configuration
router.get("/", getPromoConfig);

// Update individual promos
router.put("/referral", updateReferralPromo);
router.put("/streak", updateStreakPromo);
router.put("/gold-status", updateGoldStatusPromo);

// Toggle all promos
router.put("/toggle-all", toggleAllPromos);

export default router;

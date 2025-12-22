import express from "express";
import {
  getReferralCode,
  getReferralStats,
  useReferralCode,
} from "../controllers/referralController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get user's referral code
router.get("/code", protect, getReferralCode);

// Use a referral code (during signup or later)
router.post("/use", protect, useReferralCode);

// Get referral statistics
router.get("/stats", protect, getReferralStats);

export default router;

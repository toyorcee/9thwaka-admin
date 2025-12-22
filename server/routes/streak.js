import express from "express";
import { getStreakStats } from "../controllers/streakBonusController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get streak statistics (rider only)
router.get("/stats", protect, getStreakStats);

export default router;


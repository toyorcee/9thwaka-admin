import express from "express";
import { getGoldStatusStats } from "../controllers/goldStatusController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/stats", protect, getGoldStatusStats);

export default router;

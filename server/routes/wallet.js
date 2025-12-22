import express from "express";
import { getBalance, getWallet } from "../controllers/walletController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get wallet balance
router.get("/balance", protect, getBalance);

// Get wallet with transactions
router.get("/", protect, getWallet);

export default router;


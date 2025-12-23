import express from 'express';
import {
  getRevenueData,
  getUserGrowthData,
  getUserRoleGrowthData,
  getDailyStats,
  getOrderStats,
} from '../controllers/dashboardController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.route('/revenue').get(protect, adminOnly, getRevenueData);
router.route('/user-growth').get(protect, adminOnly, getUserGrowthData);
router.route('/user-role-growth').get(protect, adminOnly, getUserRoleGrowthData);
router.route('/daily-stats').get(protect, adminOnly, getDailyStats);
router.route('/order-stats').get(protect, adminOnly, getOrderStats);

export default router;

import express from 'express';
import {
  getRevenueData,
  getUserGrowthData,
  getOrderStats,
  getUserRoleGrowthData,
} from '../controllers/dashboardController.js';
import { protect, adminOnly as admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/revenue').get(protect, admin, getRevenueData);
router.route('/user-growth').get(protect, admin, getUserGrowthData);
router.route('/user-role-growth').get(protect, admin, getUserRoleGrowthData);
router.route('/order-stats').get(protect, admin, getOrderStats);

export default router;

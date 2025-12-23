import Order from '../models/Order.js';
import User from '../models/User.js';

// @desc    Get revenue data
// @route   GET /api/dashboard/revenue
// @access  Private/Admin
export const getRevenueData = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;

    let groupBy;
    let startDate = new Date();

    if (period === 'yearly') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    } else {
      // Default to monthly
      startDate.setMonth(startDate.getMonth() - 1);
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'delivered', // Only count completed orders
        },
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$financial.commissionAmount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          amount: '$totalRevenue',
        },
      },
    ]);

    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user role growth data (customer vs rider)
// @route   GET /api/dashboard/user-role-growth
// @access  Private/Admin
export const getUserRoleGrowthData = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;

    let groupByFormat;
    let startDate = new Date();

    if (period === 'yearly') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      groupByFormat = '%Y-%m';
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
      groupByFormat = '%Y-%m-%d';
    } else {
      // Default to monthly
      startDate.setMonth(startDate.getMonth() - 1);
      groupByFormat = '%Y-%m-%d';
    }

    const userRoleGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          role: { $in: ['customer', 'rider'] },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
            role: '$role',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          roles: {
            $push: {
              role: '$_id.role',
              count: '$count',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          customers: {
            $ifNull: [
              {
                $reduce: {
                  input: '$roles',
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $eq: ['$$this.role', 'customer'] },
                      { $add: ['$$value', '$$this.count'] },
                      '$$value',
                    ],
                  },
                },
              },
              0,
            ],
          },
          riders: {
            $ifNull: [
              {
                $reduce: {
                  input: '$roles',
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $eq: ['$$this.role', 'rider'] },
                      { $add: ['$$value', '$$this.count'] },
                      '$$value',
                    ],
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    res.json(userRoleGrowth);
  } catch (error) {
    console.error('Error fetching user role growth data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user growth data
// @route   GET /api/dashboard/user-growth
// @access  Private/Admin
export const getUserGrowthData = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;

    let groupBy;
    let startDate = new Date();

    if (period === 'yearly') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    } else {
      // Default to monthly
      startDate.setMonth(startDate.getMonth() - 1);
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const userGrowthData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupBy,
          newUserCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: '$newUserCount',
        },
      },
    ]);

    res.json(userGrowthData);
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get order stats
// @route   GET /api/dashboard/order-stats
// @access  Private/Admin
export const getOrderStats = async (req, res) => {
  try {
    const orderStats = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
        },
      },
      {
        $facet: {
          totalOrders: [{ $count: 'count' }],
          courierOrders: [
            { $match: { serviceType: 'courier' } },
            { $count: 'count' },
          ],
          rideOrders: [{ $match: { serviceType: 'ride' } }, { $count: 'count' }],
          totalRevenue: [
            {
              $group: {
                _id: null,
                total: { $sum: '$financial.commissionAmount' },
              },
            },
          ],
        },
      },
      {
        $project: {
          totalOrders: { $arrayElemAt: ['$totalOrders.count', 0] },
          courierOrders: { $arrayElemAt: ['$courierOrders.count', 0] },
          rideOrders: { $arrayElemAt: ['$rideOrders.count', 0] },
          totalRevenue: { $arrayElemAt: ['$totalRevenue.total', 0] },
        },
      },
    ]);

    const totalUsers = await User.countDocuments();

    const responseStats = {
      totalOrders: orderStats[0]?.totalOrders || 0,
      courierOrders: orderStats[0]?.courierOrders || 0,
      rideOrders: orderStats[0]?.rideOrders || 0,
      totalRevenue: orderStats[0]?.totalRevenue || 0,
      totalUsers: totalUsers,
    };

    res.json(responseStats);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get daily stats
// @route   GET /api/dashboard/daily-stats
// @access  Private/Admin
export const getDailyStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [newCustomers, newRiders, newAdmins, newOrders] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: today }, role: "customer" }),
      User.countDocuments({ createdAt: { $gte: today }, role: "rider" }),
      User.countDocuments({ createdAt: { $gte: today }, role: "admin" }),
      Order.countDocuments({ createdAt: { $gte: today } }),
    ]);

    const newUsers = newCustomers + newRiders + newAdmins;

    res.json({ newUsers, newCustomers, newRiders, newAdmins, newOrders });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import DashboardCharts from '../components/DashboardCharts';

const StatCard = ({ icon, title, value, change, changeType }) => {
  const Icon = icon;
  const changeColor = changeType === 'increase' ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-nav-dark rounded-xl shadow-lg p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div className="bg-nav-light p-3 rounded-lg">
            <Icon className="h-6 w-6 text-accent-blue" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        </div>
      </div>
      {change && (
        <div className="mt-4">
          <p className={`text-sm font-medium ${changeColor}`}>
            {change} vs. last month
          </p>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/order-stats');
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Welcome Back, Admin!</h1>
      <p className="text-gray-400 mb-8">Here's a snapshot of your platform's performance.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={UsersIcon}
          title="Total Users"
          value={stats ? stats.totalUsers : 'Loading...'}
        />
        <StatCard
          icon={ShoppingCartIcon}
          title="Total Orders"
          value={stats ? stats.totalOrders : 'Loading...'}
        />
        <StatCard
          icon={CurrencyDollarIcon}
          title="Total Revenue"
          value={
            stats
              ? new Intl.NumberFormat('en-NG', {
                  style: 'currency',
                  currency: 'NGN',
                }).format(stats.totalRevenue)
              : 'Loading...'
          }
        />
        <StatCard
          icon={ChartBarIcon}
          title="Conversion Rate"
          value="5.75%" // Placeholder
        />
      </div>

      {/* Charts Section */}
      <div className="mt-8">
        <DashboardCharts />
      </div>

      {/* You can add more components like recent activity feeds here */}
      <div className="mt-8 bg-nav-dark rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
        {/* Placeholder for recent activity feed */}
      </div>
    </div>
  );
};

export default Dashboard;


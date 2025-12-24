import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import DashboardCharts from '../components/DashboardCharts';

const StatCard = ({ icon, title, value, subtext, change, changeType, onRefresh }) => {
  const Icon = icon;
  const changeColor = changeType === 'increase' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div className="bg-gray-100 p-3 rounded-lg">
            <Icon className="h-6 w-6 text-gray-800" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {subtext && (
              <div className="text-xs mt-1 flex items-center space-x-1">
                {subtext}
              </div>
            )}
          </div>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} className="p-2 rounded-full hover:bg-gray-200">
            <ArrowPathIcon className="h-5 w-5 text-gray-500" />
          </button>
        )}
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

const WelcomeBadge = ({ newOrders, newCustomers, newRiders, newAdmins }) => {
  const parts = [];
  if (newOrders > 0) parts.push(`${newOrders} new orders`);
  if (newCustomers > 0) parts.push(`${newCustomers} new customers`);
  if (newRiders > 0) parts.push(`${newRiders} new riders`);
  if (newAdmins > 0) parts.push(`${newAdmins} new admins`);

  const summary = parts.length ? `You have ${parts.join(' and ')} today. ` : '';

  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-8" role="alert">
      <strong className="font-bold">Good day, Admin! </strong>
      <span className="block sm:inline">
        {summary}
        Keep up the great work!
      </span>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [dailyStats, setDailyStats] = useState({
    newUsers: 0,
    newOrders: 0,
    newCustomers: 0,
    newRiders: 0,
    newAdmins: 0,
  });
  const [conversionRate, setConversionRate] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, dailyStatsResponse, settingsResponse] = await Promise.all([
        api.get('/dashboard/order-stats'),
        api.get('/dashboard/daily-stats'),
        api.get('/admin/settings'),
      ]);
      setStats(statsResponse.data);
      setDailyStats(dailyStatsResponse.data);
      setConversionRate(settingsResponse.data.settings.conversionRate);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRecalculateConversionRate = async () => {
    try {
      const { data } = await api.post('/orders/conversion-rate/calculate');
      setConversionRate(data.conversionRate);
    } catch (error) {
      console.error('Error recalculating conversion rate:', error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back, Admin!</h1>
      <p className="text-gray-500 mb-8">Here's a snapshot of your platform's performance.</p>

      {(dailyStats.newOrders > 0 ||
        dailyStats.newCustomers > 0 ||
        dailyStats.newRiders > 0 ||
        dailyStats.newAdmins > 0) && (
        <WelcomeBadge
          newOrders={dailyStats.newOrders}
          newCustomers={dailyStats.newCustomers}
          newRiders={dailyStats.newRiders}
          newAdmins={dailyStats.newAdmins}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={UsersIcon}
          title="Total Users"
          value={stats ? stats.totalUsers : 'Loading...'}
          subtext={
            stats
              ? (
                  <>
                    <span className="text-red-500 font-semibold">
                      Riders: {stats.totalRiders ?? 0}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-green-500 font-semibold">
                      Customers: {stats.totalCustomers ?? 0}
                    </span>
                  </>
                )
              : null
          }
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
          value={conversionRate !== null ? `${conversionRate}%` : 'Loading...'}
          onRefresh={handleRecalculateConversionRate}
        />
      </div>

      {/* Charts Section */}
      <div className="mt-8">
        <DashboardCharts />
      </div>

      {/* You can add more components like recent activity feeds here */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        {/* Placeholder for recent activity feed */}
      </div>
    </div>
  );
};

export default Dashboard;

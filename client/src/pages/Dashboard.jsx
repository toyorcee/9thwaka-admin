import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowPathIcon,
  UserPlusIcon,
  TruckIcon,
  BanknotesIcon,
  CreditCardIcon,
  GiftIcon,
  TrophyIcon,
  StarIcon,
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

// Internal helper for activity rendering
const getActivityConfigs = (type, subType = null) => {
  switch (type) {
    case 'USER_SIGNUP':
      return {
        icon: UserPlusIcon,
        color: 'bg-blue-100 text-blue-600',
        label: 'New Registration',
      };
    case 'ORDER_CREATED':
      return {
        icon: TruckIcon,
        color: 'bg-amber-100 text-amber-600',
        label: 'New Order',
      };
    case 'WITHDRAWAL':
      return {
        icon: BanknotesIcon,
        color: 'bg-red-100 text-red-600',
        label: 'Payout Request',
      };
    case 'REPORT':
      return {
        icon: ExclamationTriangleIcon,
        color: 'bg-rose-100 text-rose-600',
        label: 'User Report',
      };
    case 'RATING':
      return {
        icon: StarIcon,
        color: 'bg-indigo-100 text-indigo-600',
        label: 'User Rating',
      };
    case 'TRANSACTION':
      if (subType === 'admin_manual_credit' || subType === 'admin_credit_reward') {
        return {
          icon: CreditCardIcon,
          color: 'bg-purple-100 text-purple-600',
          label: 'Admin Grant',
        };
      }
      return {
        icon: CreditCardIcon,
        color: 'bg-emerald-100 text-emerald-600',
        label: 'Financial Event',
      };
    default:
      return {
        icon: CreditCardIcon,
        color: 'bg-gray-100 text-gray-600',
        label: 'System Activity',
      };
  }
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [rewardsSummary, setRewardsSummary] = useState({ totalValue: 0, topRecipients: [] });
  const [dailyStats, setDailyStats] = useState({
    newUsers: 0,
    newOrders: 0,
    newCustomers: 0,
    newRiders: 0,
    newAdmins: 0,
  });
  const [conversionRate, setConversionRate] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, dailyStatsResponse, settingsResponse, activityResponse, rewardsSummaryResponse] = await Promise.all([
        api.get('/dashboard/order-stats'),
        api.get('/dashboard/daily-stats'),
        api.get('/admin/settings'),
        api.get('/dashboard/recent-activity'),
        api.get('/dashboard/rewards-summary'),
      ]);
      setStats(statsResponse.data);
      setDailyStats(dailyStatsResponse.data);
      setConversionRate(settingsResponse.data.settings.conversionRate);
      setRecentActivity(activityResponse.data);
      setRewardsSummary(rewardsSummaryResponse.data);
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
          title="Total Admin Inflow"
          value={
            stats
              ? formatCurrency(stats.totalRevenue)
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

      {/* NEW: Rewards & Incentives Summary */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
              <GiftIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-purple-100 text-sm font-semibold uppercase tracking-wider">Total Administrative Outgoings</p>
              <h3 className="text-4xl font-black">{formatCurrency(rewardsSummary.totalValue)}</h3>
            </div>
          </div>
          <p className="text-purple-200 text-sm leading-relaxed mb-6">
            This represents the total company outflow including marketing incentives, manual grants, and platform service fees (BVN/KYC).
          </p>
          <button 
            onClick={() => window.location.href = '/analytics'}
            className="w-full py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-purple-50 transition-colors shadow-lg"
          >
            Review Analytics Breakdown
          </button>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TrophyIcon className="h-6 w-6 text-amber-500" />
              Highest Reward Recipients
            </h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">All-Time Leaders</span>
          </div>

          <div className="space-y-4">
            {!rewardsSummary.topRecipients || rewardsSummary.topRecipients.length === 0 ? (
                <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl">
                   <p className="text-gray-400 font-medium">No reward distributions recorded yet.</p>
                </div>
            ) : (
                rewardsSummary.topRecipients.map((recipient, idx) => (
                    <div key={recipient._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 hover:border-amber-100 hover:bg-amber-50/10 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                {idx + 1}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{recipient.fullName}</p>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                                    {recipient.role} • {recipient.count} REWARDS RECEIVED
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-black text-amber-600">{formatCurrency(recipient.totalEarned)}</p>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mt-8">
        <DashboardCharts />
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ArrowPathIcon className="h-6 w-6 text-accent-blue" />
            Recent Activity
          </h2>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Live Updates</span>
        </div>
        
        <div className="space-y-4">
          {!recentActivity.length ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowPathIcon className="h-8 w-8 text-gray-300 animate-spin-slow" />
              </div>
              <p className="text-gray-500">Waiting for platform activity...</p>
            </div>
          ) : (
            recentActivity.map((activity, idx) => {
              const config = getActivityConfigs(activity.activityType, activity.type);
              const ActivityIcon = config.icon;
              
              // Secondary info logic
              let secondaryUser = null;
              if (activity.activityType === 'TRANSACTION') {
                secondaryUser = activity.customerId || activity.riderId;
              } else if (activity.activityType === 'ORDER_CREATED') {
                secondaryUser = activity.customer;
              } else if (activity.activityType === 'WITHDRAWAL') {
                secondaryUser = activity.userId;
              } else if (activity.activityType === 'USER_SIGNUP') {
                secondaryUser = activity; 
              } else if (activity.activityType === 'REPORT') {
                secondaryUser = activity.reportedUserId;
              } else if (activity.activityType === 'RATING') {
                secondaryUser = activity.riderId;
              }

              return (
                <div key={activity._id || idx} className={`flex items-start gap-4 p-4 rounded-xl border border-gray-100 transition-all hover:shadow-md hover:border-accent-blue/20 ${idx % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}`}>
                  <div className={`mt-1 p-2 rounded-lg ${config.color} shrink-0`}>
                    <ActivityIcon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {config.label}
                        </span>
                        {activity.type && (
                         <span className="text-[10px] font-bold text-accent-blue uppercase tracking-tighter">
                           • {activity.type.split('_').join(' ')}
                         </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-400 tabular-nums">
                        {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-900 font-medium mb-2 leading-relaxed">
                      {activity.description || activity.description || "Activity logged"}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      {secondaryUser && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Involves:</span>
                          <span className="text-xs font-bold text-accent-blue truncate">
                            {secondaryUser.fullName || 'N/A'}
                          </span>
                        </div>
                      )}
                      
                      {activity.amount !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Value:</span>
                          <span className={`text-xs font-black ${activity.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(activity.amount)}
                          </span>
                        </div>
                      )}

                      {activity.status && (
                        <div className="flex items-center gap-1.5 ml-auto">
                           <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                             activity.status === 'completed' || activity.status === 'delivered' || activity.status === 'verified'
                             ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                             : 'bg-amber-50 text-amber-600 border-amber-100'
                           }`}>
                             {activity.status}
                           </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {recentActivity.length > 0 && (
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <button 
              onClick={() => window.location.href = '/transactions'}
              className="px-6 py-2 rounded-full bg-accent-blue/5 text-xs font-black text-accent-blue hover:bg-accent-blue hover:text-white transition-all duration-300 uppercase tracking-widest shadow-sm"
            >
              View Full Transaction History →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

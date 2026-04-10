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
  CalendarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import DashboardCharts from '../components/DashboardCharts';

const StatCard = ({ icon, title, value, subtext, change, changeType, onRefresh, onClick }) => {
  const Icon = icon;
  const changeColor = changeType === 'increase' ? 'text-green-500' : 'text-red-500';
  const isClickable = !!onClick;

  return (
    <div 
        className={`bg-white rounded-2xl shadow-xl p-8 flex flex-col justify-between transition-all duration-300 border border-gray-100 ${isClickable ? 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-200 ring-offset-4 ring-indigo-500 hover:ring-2' : ''}`}
        onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-5">
          <div className={`p-4 rounded-2xl ${isClickable ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 text-gray-800'} transition-colors`}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
            <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
            {subtext && (
              <div className="text-xs mt-2 flex flex-col gap-1.5">
                {subtext}
              </div>
            )}
          </div>
        </div>
        {onRefresh && (
          <button onClick={(e) => { e.stopPropagation(); onRefresh(); }} className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowPathIcon className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>
      {change && (
        <div className="mt-6 pt-4 border-t border-gray-50">
          <p className={`text-sm font-bold ${changeColor}`}>
            {change} <span className="text-gray-400 font-medium">vs. last month</span>
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

const RevenueBreakdownModal = ({ isOpen, onClose, stats, formatCurrency }) => {
    if (!isOpen || !stats || !stats.breakdown) return null;

    const { orders, services, withdrawals } = stats.breakdown;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-xl transition-colors">
                        <ArrowPathIcon className="w-6 h-6 rotate-45" />
                    </button>
                    <h2 className="text-2xl font-black">Revenue Deep Dive</h2>
                    <p className="text-indigo-100 text-sm font-medium mt-1">Granular breakdown of all platform earnings</p>
                    <div className="mt-8 flex justify-between items-end border-t border-white/10 pt-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Total Administrative Inflow</p>
                            <p className="text-4xl font-black">{formatCurrency(stats.totalRevenue)}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                    {/* Orders */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Deliveries & Rides</h3>
                            <span className="text-sm font-black text-indigo-600">{formatCurrency(orders.total)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Courier Commissions</p>
                                <p className="text-lg font-black text-gray-800">{formatCurrency(orders.courier)}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Ride Commissions</p>
                                <p className="text-lg font-black text-gray-800">{formatCurrency(orders.ride)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Utility Service Margins</h3>
                            <span className="text-sm font-black text-emerald-600">{formatCurrency(services.total)}</span>
                        </div>
                        <div className="bg-emerald-50/30 rounded-2xl p-6 border border-emerald-100 space-y-4">
                            {Object.entries(services.byService).map(([svc, amt]) => (
                                <div key={svc} className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-gray-400 uppercase text-[10px] tracking-tighter">{svc}</span>
                                    <span className="font-black text-gray-800">{formatCurrency(amt)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payouts */}
                    <div className="space-y-4 pb-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Withdrawal Fees</h3>
                            <span className="text-sm font-black text-amber-600">{formatCurrency(withdrawals.total)}</span>
                        </div>
                        <div className="bg-amber-50/30 rounded-2xl p-5 border border-amber-100">
                            <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                This total represents the platform's net gain from withdrawal processing (User Fee minus Provider Cost).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-50 flex justify-end bg-gray-50/50">
                    <button onClick={onClose} className="px-10 py-3 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 transition-colors shadow-lg">
                        Close Report
                    </button>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [rewardsSummary, setRewardsSummary] = useState({ totalValue: 0, topRecipients: [] });
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [dailyStats, setDailyStats] = useState({
    newUsers: 0,
    newOrders: 0,
    newCustomers: 0,
    newRiders: 0,
    newAdmins: 0,
  });
  const [conversionRate, setConversionRate] = useState(null);
  const [todayStats, setTodayStats] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [statsResponse, dailyStatsResponse, settingsResponse, activityResponse, rewardsSummaryResponse, todayResponse] = await Promise.all([
        api.get('/dashboard/order-stats', { params: { startDate: dateRange.startDate, endDate: dateRange.endDate } }),
        api.get('/dashboard/daily-stats'),
        api.get('/admin/settings'),
        api.get('/dashboard/recent-activity'),
        api.get('/dashboard/rewards-summary'),
        api.get('/dashboard/order-stats', { params: { startDate: today, endDate: today } })
      ]);
      setStats(statsResponse.data);
      setDailyStats(dailyStatsResponse.data);
      setConversionRate(settingsResponse.data.settings.conversionRate);
      setRecentActivity(activityResponse.data);
      setRewardsSummary(rewardsSummaryResponse.data);
      setTodayStats(todayResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back, Admin!</h1>
              <p className="text-gray-500">Here's a snapshot of your platform's performance.</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 px-4 rounded-2xl shadow-sm border border-gray-100">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <input 
                  type="date" 
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="text-sm font-bold text-gray-700 border-none focus:ring-0 cursor-pointer outline-none"
              />
              <span className="text-gray-300 font-bold">to</span>
              <input 
                  type="date" 
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="text-sm font-bold text-gray-700 border-none focus:ring-0 cursor-pointer outline-none"
              />
          </div>
      </div>

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

      {/* ─── TODAYS PULSE CARD (NEW) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
          <div className="lg:col-span-1 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-8 text-white shadow-2xl shadow-emerald-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                  <CurrencyDollarIcon className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 italic">Today's Profit Pulse</p>
                  </div>
                  <p className="text-5xl font-black tracking-tighter mb-6">{formatCurrency(todayStats?.wallet?.revenueBalance ?? todayStats?.totalRevenue ?? 0)}</p>
                  
                  <div className="space-y-3 pt-6 border-t border-white/10">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-200">
                          <span>Orders:</span>
                          <span className="text-white bg-white/10 px-2 py-0.5 rounded-lg">{formatCurrency(todayStats?.breakdown?.orders?.total || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-200">
                          <span>Services:</span>
                          <span className="text-white bg-white/10 px-2 py-0.5 rounded-lg">{formatCurrency(todayStats?.breakdown?.services?.total || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-200">
                          <span>Payouts:</span>
                          <span className="text-white bg-white/10 px-2 py-0.5 rounded-lg">{formatCurrency(todayStats?.breakdown?.withdrawals?.netGain || 0)}</span>
                      </div>
                  </div>

                  {todayStats?.rewardSettlement > 0 && (
                      <div className="mt-6 p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30 flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase text-rose-200">Subsidies:</span>
                          <span className="text-[11px] font-black text-white">-{formatCurrency(todayStats?.rewardSettlement)}</span>
                      </div>
                  )}
              </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div>
                      <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Platform Velocity</p>
                      <h3 className="text-4xl font-black text-gray-900 tracking-tight">{dailyStats.newOrders || 0} Orders</h3>
                      <p className="text-sm text-gray-500 font-medium mt-1">Total requests processed today</p>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider">{dailyStats.newUsers || 0} New Signups</div>
                      <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider">{dailyStats.newRiders || 0} RIDERS ACTIVE</div>
                  </div>
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-gray-50 rounded-full group-hover:bg-indigo-50 transition-colors"></div>
                  <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Platform Yield</p>
                          <h3 className="text-5xl font-black text-gray-900 tracking-tight">
                            {todayStats?.adminYield !== undefined ? `${todayStats.adminYield}%` : (conversionRate !== null ? `${conversionRate}%` : '---')}
                          </h3>
                      </div>
                      <div className="mt-10 flex justify-between items-end">
                          <button 
                             onClick={handleRecalculateConversionRate}
                             className="text-[10px] font-black text-indigo-600 uppercase border-b-2 border-indigo-600 pb-1 hover:text-indigo-800 transition-colors tracking-widest"
                          >
                             Recalculate Overall Yield
                          </button>
                      </div>
                  </div>
              </div>      </div>
          </div>
      </div>


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
          title="Total Profit Flow"
          value={
            stats
              ? formatCurrency(stats.wallet?.revenueBalance ?? stats.totalRevenue)
              : 'Loading...'
          }
          onClick={() => setIsBreakdownModalOpen(true)}
          subtext={
            stats && stats.breakdown ? (
              <div className="flex flex-col gap-1 w-full text-indigo-600 font-bold bg-indigo-50/50 p-2 rounded-xl border border-indigo-100">
                   <div className="flex justify-between items-center px-1">
                       <span className="text-[10px] uppercase">Services: {((stats.breakdown.services.total / stats.totalRevenue) * 100 || 0).toFixed(1)}%</span>
                       <span className="animate-pulse">→</span>
                   </div>
              </div>
            ) : null
          }
        />
        <StatCard
          icon={BanknotesIcon}
          title="Payout Net"
          value={stats ? formatCurrency(stats.breakdown?.withdrawals?.netGain) : 'Loading...'}
          subtext={
              stats ? (
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                      Tax Liability: <span className="text-rose-500">{formatCurrency((stats.breakdown?.withdrawals?.vat || 0) + (stats.breakdown?.withdrawals?.stampDuty || 0))}</span>
                  </p>
              ) : null
          }
        />
      </div>

      {/* NEW: Financial Velocity Summary */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inflow Card (NEW) */}
        <div className="lg:col-span-1 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <ArrowTrendingUpIcon className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                <BanknotesIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider">Administrative Inflow</p>
                <h3 className="text-4xl font-black">
                    {formatCurrency(
                        stats?.wallet?.revenueBalance ??
                        ((stats?.breakdown?.orders?.total || 0) + 
                         (stats?.breakdown?.services?.total || 0) + 
                         (stats?.breakdown?.withdrawals?.total || 0))
                    )}
                </h3>
              </div>
            </div>
            <p className="text-emerald-100/80 text-sm leading-relaxed mb-6">
              Gross system inflow representing order commissions, service margins, and withdrawal fees (including stamp duty).
            </p>
            <div className="flex gap-2 flex-wrap">
                <div className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase">Orders: {formatCurrency(stats?.breakdown?.orders?.total)}</div>
                <div className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase">Services: {formatCurrency(stats?.breakdown?.services?.total)}</div>
                <div className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase">Fees: {formatCurrency(stats?.breakdown?.withdrawals?.total)}</div>
            </div>
          </div>
        </div>

        {/* Outgoings Card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white group">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
              <GiftIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-purple-100 text-sm font-semibold uppercase tracking-wider">Administrative Outgoings</p>
              <h3 className="text-4xl font-black">{formatCurrency(rewardsSummary.totalValue)}</h3>
            </div>
          </div>
          <p className="text-purple-200 text-sm leading-relaxed mb-6">
            Total company outflow covering marketing incentives, manual grants, and platform service fees (BVN/KYC).
          </p>
          <button 
            onClick={() => window.location.href = '/analytics'}
            className="w-full py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-purple-50 transition-colors shadow-lg shadow-purple-900/20"
          >
            Review Analytics Breakdown
          </button>
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TrophyIcon className="h-6 w-6 text-amber-500" />
              Top Rewards
            </h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">All-Time</span>
          </div>

          <div className="space-y-4">
            {!rewardsSummary.topRecipients || rewardsSummary.topRecipients.length === 0 ? (
                <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl">
                   <p className="text-gray-400 font-medium">No distributions yet.</p>
                </div>
            ) : (
                rewardsSummary.topRecipients.slice(0, 3).map((recipient, idx) => (
                    <div key={recipient._id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:border-amber-100 hover:bg-amber-50/10 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                {idx + 1}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-sm truncate">{recipient.fullName}</p>
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">
                                    {recipient.role}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm font-black text-amber-600 shrink-0">{formatCurrency(recipient.totalEarned)}</p>
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

      <RevenueBreakdownModal 
          isOpen={isBreakdownModalOpen} 
          onClose={() => setIsBreakdownModalOpen(false)} 
          stats={stats} 
          formatCurrency={formatCurrency} 
      />
    </div>
  );
};

export default Dashboard;

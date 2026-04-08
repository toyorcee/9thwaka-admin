import React, { useEffect, useState } from "react";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { toast } from "react-toastify";
import api from '../services/api';
import { getAdminAnalytics } from "../services/adminApi";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { downloadAnalyticsReport } from "../utils/analyticsReport";
import { 
  BanknotesIcon, 
  CreditCardIcon, 
  TagIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  LifebuoyIcon,
  MagnifyingGlassIcon,
  UserIcon
} from "@heroicons/react/24/outline";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount || 0);
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Analytics = () => {
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userSearchText, setUserSearchText] = useState("");
  const [searchingUser, setSearchingUser] = useState(false);
  const [userProfitData, setUserProfitData] = useState(null);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = { period };
        if (startDate && endDate) {
            params.startDate = startDate;
            params.endDate = endDate;
        }
        
        const response = await getAdminAnalytics(params);
        setData(response);
      } catch (e) {
        setError("Failed to load analytics data.");
        console.error("Failed to load admin analytics:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period, startDate, endDate]); 

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load analytics"
        description={error}
      />
    );
  }

  if (!data || !data.success) {
    return (
      <EmptyState
        title="No analytics data"
        description="Analytics data is not available yet."
      />
    );
  }

  const analytics = data;
  const rangeStart = analytics.range?.startDate
    ? new Date(analytics.range.startDate)
    : null;
  const rangeEnd = analytics.range?.endDate
    ? new Date(analytics.range.endDate)
    : null;
  const hasRange = !!(rangeStart && rangeEnd);
  const labels =
    analytics.revenue?.byPeriod?.map((item) => item.period) || [];

  // Data Extraction
  const revenueData = analytics.revenue || {};
  const rewardsData = analytics.rewards || {};
  const withdrawalsData = analytics.withdrawals || {};
  const promoData = analytics.promoEffectiveness || {};

  // --- Chart Datasets ---

  // 1. Revenue Trends
  const revenueDataset = {
    labels,
    datasets: [
      {
        label: "Gross Commission",
        data: labels.map(l => revenueData.byPeriod?.find(p => p.period === l)?.commission || 0),
        borderColor: "#4F46E5",
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // 2. Rewards by Role (Pie)
  const rewardsByRoleData = {
    labels: ["Customers", "Riders"],
    datasets: [
      {
        data: [
          rewardsData.rewardsByRole?.customer || 0,
          rewardsData.rewardsByRole?.rider || 0,
        ],
        backgroundColor: ["#3B82F6", "#F59E0B"],
        hoverOffset: 4,
      },
    ],
  };

  // 3. Withdrawals by Status (Doughnut)
  const withdrawalStatusData = {
    labels: ["Completed", "Pending", "Failed"],
    datasets: [
      {
        data: [
          withdrawalsData.withdrawalsByStatus?.completed || 0,
          withdrawalsData.withdrawalsByStatus?.pending || 0,
          withdrawalsData.withdrawalsByStatus?.failed || 0,
        ],
        backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
      },
    ],
  };

  // 4. Promo Effectiveness (Bar)
  const promoEntries = Object.entries(promoData.discountsByPromo || {});
  const promoChartData = {
    labels: promoEntries.map(([key]) => key.replace(/_/g, " ").toUpperCase()),
    datasets: [
      {
        label: "Total Discount Amount",
        data: promoEntries.map(([, value]) => value),
        backgroundColor: "#8B5CF6",
        borderRadius: 4,
      },
    ],
  };

  const handlePeriodChange = (e) => {
      setPeriod(e.target.value);
      if(e.target.value !== 'custom') {
          setStartDate("");
          setEndDate("");
      }
  };

  const applyCustomDate = () => {
       // logic handled by effect dependency, but can be forced here
  };

  const handleSearchUserProfit = async () => {
    if (!userSearchText) return;
    try {
        setSearchingUser(true);
        setSearchError(null);
        const { data } = await api.get(`/admin/analytics/user-profit?search=${userSearchText}`);
        if (data.success) {
            setUserProfitData(data);
        } else {
            setSearchError(data.error || "Search failed");
        }
    } catch (e) {
        setSearchError("Failed to fetch user profit data.");
    } finally {
        setSearchingUser(false);
    }
  };

  return (
    <div className="p-6 mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-500 mt-1">
            Comprehensive overview of 9thWaka financial health.
          </p>
          {hasRange && (
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
               {formatDate(rangeStart)} - {formatDate(rangeEnd)}
             </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
             <select
              value={period}
              onChange={handlePeriodChange}
              className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            >
              <option value="daily">Daily (Last 30 Days)</option>
              <option value="monthly">Monthly (Last 12 Months)</option>
              <option value="yearly">Yearly (Last 5 Years)</option>
            </select>
            
            <div className="flex items-center gap-2 bg-white rounded-md border border-gray-300 p-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-none focus:ring-0 text-sm p-1 text-gray-600 outline-none"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-none focus:ring-0 text-sm p-1 text-gray-600 outline-none"
                />
                <button
                    onClick={applyCustomDate}
                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Refresh Data"
                >
                    <ArrowPathIcon className="w-5 h-5" />
                </button>
            </div>

            <button
              onClick={() => {
                  toast.info("Report generation downloading...");
                  downloadAnalyticsReport({ analytics, period });
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Export Report
            </button>
        </div>
      </div>

      {/* 0. Platform Health Snapshot (NEW) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-emerald-600" />
            Platform Health & Debt Tracking
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-blue-500">
                <p className="text-sm font-medium text-blue-600">Rider Debt (Commission Owed)</p>
                <p className="text-3xl font-black text-blue-900 mt-1">{formatCurrency(analytics.wallet?.totalCommissionOwed)}</p>
                <p className="text-xs text-blue-500 mt-2">Money riders owe the platform from cash trips.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-amber-500">
                <p className="text-sm font-medium text-amber-600">Platform Debt (To Riders)</p>
                <p className="text-3xl font-black text-amber-900 mt-1">{formatCurrency(analytics.wallet?.totalDebtToRiders)}</p>
                <p className="text-xs text-amber-500 mt-2">Money platform owes riders for online/wallet trips.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-purple-500">
                <p className="text-sm font-medium text-purple-600">Rescued Funds (Recovered)</p>
                <p className="text-3xl font-black text-purple-900 mt-1">{formatCurrency(analytics.wallet?.totalRescuedFunds)}</p>
                <p className="text-xs text-purple-500 mt-2">Funds recovered from deleted/orphaned user accounts.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-red-500">
                <p className="text-sm font-medium text-red-600">Operational Leakage</p>
                <p className="text-3xl font-black text-red-900 mt-1">
                    {formatCurrency(
                        (analytics.wallet?.operationalOutflows?.kyc || 0) + 
                        (analytics.wallet?.operationalOutflows?.feeAbsorption || 0) +
                        (analytics.wallet?.operationalOutflows?.grants || 0)
                    )}
                </p>
                <div className="mt-3 space-y-1 border-t pt-2">
                    <div className="flex justify-between text-[10px]">
                        <span className="text-gray-500">KYC/Verification:</span>
                        <span className="font-bold text-red-700">{formatCurrency(analytics.wallet?.operationalOutflows?.kyc)}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                        <span className="text-gray-500">Fee Absorption:</span>
                        <span className="font-bold text-red-700">{formatCurrency(analytics.wallet?.operationalOutflows?.feeAbsorption)}</span>
                    </div>
                </div>
            </div>
        </div>
      </section>



      {/* 0.5 User Profit Search (PREMIUM TOOL) */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl shadow-2xl p-10 border border-indigo-100 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/20 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-200/20 rounded-full -ml-32 -mb-32 blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative z-10">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                    <UserIcon className="w-6 h-6 text-white" />
                </div>
                User Market Profit Lookup (LTV)
            </h2>
            
            <div className="flex flex-col lg:flex-row gap-5 items-stretch lg:items-center">
                <div className="relative flex-1 group">
                    <MagnifyingGlassIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors duration-300 ${userSearchText ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <input 
                        type="text" 
                        placeholder="Search by Email, Phone, or User ID (e.g. user@email.com)"
                        value={userSearchText}
                        onChange={(e) => setUserSearchText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchUserProfit()}
                        className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-base font-bold transition-all shadow-sm bg-white/80 backdrop-blur-md placeholder:text-gray-300"
                    />
                </div>
                <button 
                   onClick={handleSearchUserProfit}
                   disabled={searchingUser || !userSearchText}
                   className={`px-10 py-5 rounded-2xl font-black text-white transition-all shadow-xl hover:shadow-indigo-200/50 active:scale-95 flex items-center justify-center gap-3 ${searchingUser || !userSearchText ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700 bg-gradient-to-r from-indigo-600 to-indigo-500'}`}
                >
                   {searchingUser ? (
                       <ArrowPathIcon className="w-5 h-5 animate-spin" />
                   ) : (
                       <MagnifyingGlassIcon className="w-5 h-5" />
                   )}
                   {searchingUser ? "Analyzing..." : "Lookup Profit"}
                </button>
            </div>

            {searchError && (
                <div className="mt-6 p-5 bg-rose-50 text-rose-700 rounded-2xl text-sm font-black border border-rose-100 flex items-center gap-3 animate-shake">
                    <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                    {searchError}
                </div>
            )}

            {userProfitData && (
                <div className="mt-10 p-8 bg-white/40 backdrop-blur-lg rounded-3xl border border-white/60 shadow-inner animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-8 mb-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-xl border-4 border-white/20">
                                {userProfitData.user.fullName?.[0] || "?"}
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 leading-none mb-2 tracking-tight">{userProfitData.user.fullName}</h3>
                                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                                    {userProfitData.user.role} • Platform Contributor
                                </p>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-md px-10 py-6 rounded-[2rem] shadow-xl shadow-emerald-500/10 border border-emerald-100 flex flex-col items-end transform hover:scale-105 transition-transform duration-500">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lifetime Profit Generated</p>
                            <p className="text-5xl font-black text-emerald-600 tracking-tighter">{formatCurrency(userProfitData.profitSummary.totalLifetimeProfit)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 group hover:border-indigo-300 transition-all duration-300 hover:shadow-indigo-500/5 hover:-translate-y-1">
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Orders & Bids</p>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-3xl font-black text-gray-900">{formatCurrency(userProfitData.profitSummary.breakdown.orders.total)}</p>
                                    <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase tracking-tighter">Net Commission</p>
                                </div>
                                <span className="text-[10px] font-black text-white bg-indigo-600 px-3 py-1.5 rounded-xl shadow-lg shadow-indigo-100">
                                    {userProfitData.profitSummary.breakdown.orders.count} EVENTS
                                </span>
                            </div>
                        </div>

                        <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 group hover:border-emerald-300 transition-all duration-300 hover:shadow-emerald-500/5 hover:-translate-y-1">
                            <p className="text-[11px] font-black text-gray-400 uppercase mb-4">Utility Margins</p>
                            <p className="text-3xl font-black text-gray-900 mb-5">{formatCurrency(userProfitData.profitSummary.breakdown.services.total)}</p>
                            <div className="space-y-2 border-t pt-4 border-gray-50">
                                {Object.entries(userProfitData.profitSummary.breakdown.services.details).map(([svc, amt]) => (
                                    <div key={svc} className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                        <span>{svc}</span>
                                        <span className="font-black text-gray-800">{formatCurrency(amt)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 group hover:border-amber-300 transition-all duration-300 hover:shadow-amber-500/5 hover:-translate-y-1 flex flex-col justify-between">
                            <div>
                                <p className="text-[11px] font-black text-gray-400 uppercase mb-2">Withdrawal Fees</p>
                                <p className="text-3xl font-black text-gray-900">{formatCurrency(userProfitData.profitSummary.breakdown.withdrawals.total)}</p>
                            </div>
                            <div className="mt-6 flex items-center gap-2 p-3 bg-amber-50 rounded-2xl">
                                <BanknotesIcon className="w-4 h-4 text-amber-600" />
                                <p className="text-[9px] text-amber-700 font-bold leading-tight uppercase tracking-tight">
                                    Net margin from bank payouts.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </section>

      {/* 1. Administrative Inflows (Revenue) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <BanknotesIcon className="w-6 h-6 text-indigo-600" />
            Administrative Inflows (Revenue)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden bg-indigo-50/30">
                <p className="text-sm font-medium text-indigo-700">Total Administrative Inflow</p>
                <p className="text-3xl font-black text-indigo-900 mt-1">{formatCurrency(revenueData.totalInflow)}</p>
                <div className="mt-4 space-y-2 border-t border-indigo-100 pt-4">
                    <div className="flex justify-between text-xs">
                        <span className="text-indigo-600 font-medium">Order Commissions</span>
                        <span className="font-bold text-indigo-900">{formatCurrency(revenueData.breakdown?.commission)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-indigo-600 font-medium">Withdrawal Fees</span>
                        <span className="font-bold text-indigo-900">{formatCurrency(revenueData.breakdown?.withdrawalFees)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-indigo-600 font-medium">Bill Payment Markups</span>
                        <span className="font-bold text-indigo-900">{formatCurrency(revenueData.breakdown?.billFees)}</span>
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <p className="text-sm font-medium text-gray-500">Commission Collected</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(revenueData.commissionPaid)}</p>
                <p className="text-xs text-gray-400 mt-2">Successfully paid by riders</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-red-400">
                <p className="text-sm font-medium text-red-600">Unpaid Commission</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{formatCurrency(revenueData.commissionUnpaid)}</p>
                <p className="text-xs text-red-500 mt-2">Pending / Overdue payments</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 bg-pink-50 border-pink-100">
                <p className="text-sm font-medium text-pink-700">Waivers & Discounts</p>
                <p className="text-2xl font-bold text-pink-900 mt-1">{formatCurrency(revenueData.totalWaivers + revenueData.totalCustomerDiscounts)}</p>
                <p className="text-xs text-pink-600 mt-2">
                    Gold: {formatCurrency(revenueData.totalWaivers)} | Cust: {formatCurrency(revenueData.totalCustomerDiscounts)}
                </p>
            </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-80">
            <Line 
                data={{
                    labels,
                    datasets: [
                        {
                            label: "Total Inflow (Revenue)",
                            data: labels.map(l => revenueData.byPeriod?.find(p => p.period === l)?.totalInflow || 0),
                            borderColor: "#4F46E5",
                            backgroundColor: "rgba(79, 70, 229, 0.1)",
                            tension: 0.3,
                            fill: true,
                        },
                        {
                            label: "Commission",
                            data: labels.map(l => revenueData.byPeriod?.find(p => p.period === l)?.commission || 0),
                            borderColor: "#34D399",
                            backgroundColor: "transparent",
                            tension: 0.3,
                            borderDash: [5, 5],
                        }
                    ],
                }} 
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true }, title: { display: true, text: 'Revenue Inflow Trend' } } }} 
            />
        </div>
      </section>

      {/* NEW: Service Performance Breakdown */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <ArrowPathIcon className="w-6 h-6 text-blue-600" />
            Service Performance (Inflow vs Absorption)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(analytics.servicePerformance || {}).map(([service, performance]) => (
                <div key={service} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{service.replace(/_/g, ' ')}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${performance.inflow >= performance.outflow ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {((performance.inflow - performance.outflow) >= 0 ? 'PROFITABLE' : 'SUBSIDIZED')}
                        </span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Inflow (Earnings)</span>
                            <span className="text-sm font-bold text-emerald-600">+{formatCurrency(performance.inflow)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Outflow (Absorbed)</span>
                            <span className="text-sm font-bold text-red-600">-{formatCurrency(performance.outflow)}</span>
                        </div>
                        <div className="pt-3 border-t flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-900">Net Health</span>
                            <span className={`text-sm font-black ${performance.inflow >= performance.outflow ? 'text-gray-900' : 'text-red-700'}`}>
                                {formatCurrency(performance.inflow - performance.outflow)}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* 2. System Health - Liabilities */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <ArrowPathIcon className="w-6 h-6 text-emerald-600" />
            System Liabilities (Wallet Balances)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 bg-emerald-50 border-emerald-100">
                <p className="text-sm font-medium text-emerald-700">Total User Holdings</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrency(analytics.systemHealth?.liabilities?.total)}</p>
                <p className="text-xs text-emerald-600 mt-2">Total money currently in user wallets</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <p className="text-sm font-medium text-gray-500">Deposit Balances</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analytics.systemHealth?.liabilities?.deposits)}</p>
                <p className="text-xs text-gray-400 mt-2">Spendable funds (Bills/Orders)</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <p className="text-sm font-medium text-gray-500">Earnings Balances</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analytics.systemHealth?.liabilities?.earnings)}</p>
                <p className="text-xs text-gray-400 mt-2">Rider earnings (Withdrawable)</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <p className="text-sm font-medium text-gray-500">Reward Balances</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analytics.systemHealth?.liabilities?.rewards)}</p>
                <p className="text-xs text-gray-400 mt-2">Locked incentive funds</p>
            </div>
        </div>
      </section>

      {/* 2. Rewards & Marketing */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <TagIcon className="w-6 h-6 text-purple-600" />
            Rewards & Promos
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Key Metrics */}
             <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">Total Administrative Outgoings</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(rewardsData.totalAwarded)}</p>
                    <div className="mt-4 space-y-2 border-t pt-4">
                         <h4 className="text-xs font-semibold text-gray-400 uppercase">Breakdown</h4>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Marketing Incentives</span>
                            <span className="font-medium text-purple-600">{formatCurrency(rewardsData.categories?.incentives)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Admin Grants (Support)</span>
                            <span className="font-medium text-blue-600">{formatCurrency(rewardsData.categories?.admin_grants)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Platform Service Fees (BVN/KYC)</span>
                            <span className="font-medium text-red-600">{formatCurrency(rewardsData.categories?.system_fees)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 bg-indigo-50">
                    <p className="text-sm font-medium text-indigo-800">Rewards Used (Redeemed)</p>
                    <p className="text-3xl font-bold text-indigo-900 mt-2">{formatCurrency(rewardsData.used?.total)}</p>
                     <p className="text-xs text-indigo-600 mt-2">Redeemed for airtime, data, bills, etc.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 bg-red-50 border-red-100">
                    <p className="text-sm font-medium text-red-800">Liability & Expiry Alert</p>
                    <div className="mt-2 space-y-4">
                        <div>
                            <p className="text-2xl font-bold text-red-900">{formatCurrency(rewardsData.expiry?.soon)}</p>
                            <p className="text-xs text-red-600">Expiring in next 7 days ({rewardsData.expiry?.soonCount || 0} items)</p>
                        </div>
                        <div className="pt-4 border-t border-red-200">
                            <p className="text-lg font-semibold text-gray-700">{formatCurrency(rewardsData.expiry?.expired)}</p>
                            <p className="text-xs text-gray-500">Total Expired All-Time ({rewardsData.expiry?.expiredCount || 0} items)</p>
                        </div>
                    </div>
                </div>
             </div>

             {/* Charts */}
             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-1 flex flex-col items-center">
                 <h3 className="text-sm font-bold text-gray-700 mb-4 text-center">Rewards Earned by Role</h3>
                 <div className="h-64 w-full">
                    <Doughnut data={rewardsByRoleData} options={{ responsive: true, maintainAspectRatio: false }} />
                 </div>
             </div>
             
             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-1">
                 <h3 className="text-sm font-bold text-gray-700 mb-4 text-center">Wallet Rewards Breakdown</h3>
                 <div className="h-64 w-full">
                    <Bar 
                        data={{
                            labels: Object.keys(rewardsData.given?.byType || {}).map(k => k.replace(/_/g, " ").toUpperCase()),
                            datasets: [{
                                label: "Amount",
                                data: Object.values(rewardsData.given?.byType || {}),
                                backgroundColor: "#EC4899",
                                borderRadius: 4
                            }]
                        }}
                        options={{ 
                            responsive: true, 
                            maintainAspectRatio: false,
                            indexAxis: 'y',
                            plugins: { legend: { display: false } } 
                        }} 
                    />
                 </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-3">
                 <h3 className="text-sm font-bold text-gray-700 mb-4 text-center">Promo Code Usage (Order Discounts)</h3>
                 <div className="h-64 w-full">
                    <Bar 
                        data={promoChartData} 
                        options={{ 
                            responsive: true, 
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } } 
                        }} 
                    />
                 </div>
             </div>
              {/* NEW: Top Rewards Recipients Table */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-3">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-800">Top Reward Recipients</h3>
                      <span className="text-xs font-medium text-gray-400 uppercase">Top 10 Performers</span>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead>
                              <tr className="border-b border-gray-50">
                                  <th className="pb-3 text-xs font-bold text-gray-400 uppercase">Rank</th>
                                  <th className="pb-3 text-xs font-bold text-gray-400 uppercase">Name</th>
                                  <th className="pb-3 text-xs font-bold text-gray-400 uppercase text-center">Incentives Received</th>
                                  <th className="pb-3 text-xs font-bold text-gray-400 uppercase text-right">Total Value</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {rewardsData.topRecipients?.map((r, i) => (
                                  <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="py-4 text-sm font-bold text-gray-400">#{i + 1}</td>
                                      <td className="py-4">
                                          <p className="text-sm font-bold text-gray-900">{r.fullName}</p>
                                          <p className="text-[10px] text-accent-blue font-bold uppercase">{r.role}</p>
                                      </td>
                                      <td className="py-4 text-sm text-gray-600 text-center">{r.count}</td>
                                      <td className="py-4 text-right">
                                          <span className="text-sm font-black text-emerald-600">{formatCurrency(r.totalEarned)}</span>
                                      </td>
                                  </tr>
                              ))}
                              {(!rewardsData.topRecipients || rewardsData.topRecipients.length === 0) && (
                                  <tr>
                                      <td colSpan="4" className="py-8 text-center text-gray-400 italic">No reward data available for this period.</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      </section>

      {/* 3. Withdrawals & Payments */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <CreditCardIcon className="w-6 h-6 text-emerald-600" />
            Withdrawals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
                 <p className="text-sm font-medium text-gray-500">Total Withdrawn</p>
                 <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(withdrawalsData.totalWithdrawals)}</p>
                 <p className="text-xs text-gray-400 mt-1">Completed cashouts to bank accounts</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4 text-center">Request Status</h3>
                <div className="h-40">
                    <Pie data={withdrawalStatusData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center gap-4">
                <div className="flex justify-between items-center border-b pb-2">
                     <span className="text-sm text-gray-600">Pending Requests</span>
                     <span className="text-lg font-bold text-amber-600">{formatCurrency(withdrawalsData.withdrawalsByStatus?.pending)}</span>
                </div>
                 <div className="flex justify-between items-center border-b pb-2">
                     <span className="text-sm text-gray-600">Processing</span>
                     <span className="text-lg font-bold text-blue-600">{formatCurrency(withdrawalsData.withdrawalsByStatus?.processing)}</span>
                </div>
                <div className="flex justify-between items-center">
                     <span className="text-sm text-gray-600">Failed</span>
                     <span className="text-lg font-bold text-red-600">{formatCurrency(withdrawalsData.withdrawalsByStatus?.failed)}</span>
                </div>
            </div>
        </div>
      </section>

      {/* Footer / Meta Data */}
      <div className="mt-12 border-t pt-6 flex justify-between text-xs text-gray-400">
        <div>Total System Users: {data.users?.total}</div>
        <div>Report Generated: {new Date().toLocaleString()}</div>
      </div>
    </div>
  );
};

export default Analytics;

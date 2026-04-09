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
  UserIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ArrowTrendingUpIcon,
  GiftIcon,
  TicketIcon
} from "@heroicons/react/24/outline";
import { 
  TrophyIcon, 
  UserGroupIcon,
  ClockIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon
} from "@heroicons/react/24/solid";

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
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
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
  const [stats, setStats] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { period };
      if (startDate && endDate) {
          params.startDate = startDate;
          params.endDate = endDate;
      }
      const [analyticsRes, statsRes] = await Promise.all([
          getAdminAnalytics(params),
          api.get('/dashboard/order-stats', { params: { startDate, endDate } })
      ]);
      setData(analyticsRes);
      setStats(statsRes.data);
    } catch (e) {
      setError("Failed to load analytics data.");
      console.error("Failed to load admin analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]); 

  const handlePeriodChange = (newPeriod) => {
      setPeriod(newPeriod);
      if(newPeriod !== 'custom') {
          setStartDate("");
          setEndDate("");
      }
  };

  const applyCustomDate = () => {
       fetchAnalytics();
       toast.success("Analytics updated for selected period");
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

  if (loading) return <Loader />;
  if (error) return <EmptyState title="Unable to load analytics" description={error} />;
  if (!data || !data.success) return <EmptyState title="No analytics data" description="Analytics data is not available yet." />;

  const analytics = data;
  const rangeStart = analytics.range?.startDate ? new Date(analytics.range.startDate) : null;
  const rangeEnd = analytics.range?.endDate ? new Date(analytics.range.endDate) : null;
  const hasRange = !!(rangeStart && rangeEnd);
  const labels = analytics.revenue?.byPeriod?.map((item) => item.period) || [];

  // Data Extraction
  const revenueData = analytics.revenue || {};
  const rewardsData = analytics.rewards || {};
  const withdrawalsData = analytics.withdrawals || {};
  
  // Loyalty Point Data
  const loyaltyTrendRaw = analytics.wallet?.loyaltyTrend || [];
  const loyaltyLeaderboard = analytics.wallet?.leaderboard || [];
  const loyaltySourceMix = analytics.wallet?.sourceMix || [];

  // Transform trend data for ChartJS
  const trendLabels = [...new Set(loyaltyTrendRaw.map(t => t.day))].sort();
  const awardedData = trendLabels.map(day => {
      const match = loyaltyTrendRaw.find(t => t.day === day && t.type === "loyalty_reward");
      return match ? match.points : 0;
  });
  const redeemedData = trendLabels.map(day => {
      const match = loyaltyTrendRaw.find(t => t.day === day && t.type === "point_redemption");
      return match ? match.points : 0;
  });
  
  return (
    <div className="p-6 mx-auto space-y-10 max-w-7xl animate-fadeIn">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
                <ChartBarIcon className="w-6 h-6 text-white" />
             </div>
             Platform Analytics
          </h1>
          <p className="text-gray-500 font-medium mt-2 max-w-md">
            Comprehensive overview of 9thWaka financial health and actual net yield.
          </p>
          {hasRange && (
             <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm">
                  {formatDate(rangeStart)} — {formatDate(rangeEnd)}
                </span>
             </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center relative z-10">
             <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
                 {[
                     { id: 'daily', label: 'Daily' },
                     { id: 'monthly', label: 'Monthly' },
                     { id: 'yearly', label: 'Yearly' },
                     { id: 'custom', label: 'Custom' }
                 ].map((p) => (
                     <button
                         key={p.id}
                         onClick={() => handlePeriodChange(p.id)}
                         className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                             period === p.id 
                             ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105" 
                             : "text-gray-400 hover:text-gray-600"
                         }`}
                     >
                         {p.label}
                     </button>
                 ))}
             </div>
            
            <div className="flex items-center gap-4 bg-gray-50/80 rounded-2xl border border-gray-100 p-2 px-5 hover:bg-white transition-colors hover:shadow-inner">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-[11px] font-black text-gray-600 outline-none cursor-pointer p-0"
                />
                <span className="text-gray-300 font-black text-[10px] uppercase">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-[11px] font-black text-gray-600 outline-none cursor-pointer p-0"
                />
                <button
                    onClick={applyCustomDate}
                    className="p-2.5 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-gray-100 rounded-xl transition-all active:scale-95 shadow-sm"
                    title="Apply Filters"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <button
              onClick={() => {
                  toast.info("Preparing report download...");
                  downloadAnalyticsReport({ analytics, period });
              }}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 border border-transparent text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95"
            >
              Export Report
            </button>
        </div>
      </div>

      {/* ─── Yield Analysis & Snapshot ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-10 flex flex-col justify-between group hover:border-indigo-200 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <ArrowTrendingUpIcon className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Actual Administrative Settlement</p>
                  <h3 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">{formatCurrency(stats?.totalRevenue || 0)}</h3>
                  <div className="flex items-center gap-2 mb-8">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">Net Inflow</span>
                      {stats?.rewardSettlement > 0 && (
                          <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border border-rose-200">Subsidies Subtracted</span>
                      )}
                  </div>

                  <div className="grid grid-cols-3 gap-6 pt-10 border-t border-gray-50">
                      <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Orders Pulse</p>
                          <p className="text-xl font-black text-indigo-600">{formatCurrency(stats?.breakdown?.orders?.total || 0)}</p>
                      </div>
                      <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Service Yield</p>
                          <p className="text-xl font-black text-emerald-600">{formatCurrency(stats?.breakdown?.services?.total || 0)}</p>
                      </div>
                      <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Payout Fees</p>
                          <p className="text-xl font-black text-amber-600">{formatCurrency(stats?.breakdown?.withdrawals?.netGain || 0)}</p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-10 flex flex-col justify-between">
              <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8">Yield Comparison: volume vs. profit</h3>
                  <div className="h-64">
                      <Bar 
                        data={{
                            labels: ["Orders/Rides", "Utility Hub", "Payouts"],
                            datasets: [
                                {
                                    label: "Gross Sales Volume",
                                    data: [
                                        stats?.breakdown?.orders?.gross || 0,
                                        (stats?.breakdown?.services?.total || 0) * 12,
                                        stats?.breakdown?.withdrawals?.gross || 0
                                    ],
                                    backgroundColor: "rgba(226, 232, 240, 0.8)",
                                    borderRadius: 12,
                                    barThickness: 40
                                },
                                {
                                    label: "Net Settlement",
                                    data: [
                                        stats?.breakdown?.orders?.total || 0,
                                        stats?.breakdown?.services?.total || 0,
                                        stats?.breakdown?.withdrawals?.netGain || 0
                                    ],
                                    backgroundColor: "#4F46E5",
                                    borderRadius: 12,
                                    barThickness: 40
                                }
                            ]
                        }}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { position: 'bottom', labels: { font: { weight: 'black', size: 10 } } },
                                tooltip: { 
                                    backgroundColor: '#1e293b',
                                    titleFont: { weight: 'black' },
                                    bodyFont: { weight: 'bold' },
                                    callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` }
                                }
                            },
                            scales: {
                                y: { display: false },
                                x: { grid: { display: false }, ticks: { font: { weight: 'black' } } }
                            }
                        }}
                      />
                  </div>
              </div>
              <div className="mt-6 flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregated Efficiency</p>
                  <p className="text-lg font-black text-indigo-600 tracking-tighter">
                      {((stats?.totalRevenue / stats?.grossSalesVolume) * 100 || 0).toFixed(1)}% Platform Yield
                  </p>
              </div>
          </div>
      </div>

      {/* ─── Breakdown Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100/50 flex flex-col justify-between h-52 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
              <div>
                  <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">Total Admin Net Gain</p>
                  <p className="text-4xl font-black tracking-tighter">{formatCurrency(stats?.totalRevenue || 0)}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-black tracking-widest">
                  <span className="text-indigo-200">ALL STREAMS COMBINED</span>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-white uppercase italic">Actual</span>
              </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-52 flex flex-col justify-between group hover:border-indigo-300 transition-all">
              <div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Utility Hub Margin</p>
                  <p className="text-3xl font-black text-gray-900 leading-none">{formatCurrency(stats?.breakdown?.services?.total || 0)}</p>
                  <div className="mt-3 flex items-center justify-between">
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">Total Fixed + %</span>
                      <span className="text-[10px] font-black text-gray-300">{(stats?.breakdown?.services?.total / stats?.totalRevenue * 100 || 0).toFixed(1)}% MIX</span>
                  </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex gap-1.5 flex-wrap">
                  {['AIRTIME', 'DATA', 'BILLS'].map(s => (
                      <span key={s} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[8px] font-black text-gray-400 tracking-widest">{s}</span>
                  ))}
              </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-52 flex flex-col justify-between group hover:border-amber-300 transition-all">
              <div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Payout Net Gain</p>
                  <p className="text-3xl font-black text-gray-900 leading-none">{formatCurrency(stats?.breakdown?.withdrawals?.netGain || 0)}</p>
                  <div className="mt-3 flex items-center justify-between">
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">Gross Fees - Provider Cost</span>
                      <span className="text-[10px] font-black text-gray-300">{(stats?.breakdown?.withdrawals?.netGain / stats?.totalRevenue * 100 || 0).toFixed(1)}% MIX</span>
                  </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-600">
                      <span>Total Fees Collected:</span>
                      <span>{formatCurrency(stats?.breakdown?.withdrawals?.totalFees || 0)}</span>
                  </div>
                  <div className="bg-rose-50 rounded-xl border border-rose-100 p-2 space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-black text-rose-700 uppercase tracking-tighter">
                          <span>VAT (7.5%):</span>
                          <span>{formatCurrency(stats?.breakdown?.withdrawals?.vat || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-black text-rose-700 uppercase tracking-tighter border-t border-rose-100 pt-1">
                          <span>Stamp Duty (Liability):</span>
                          <span className="text-rose-600 underline decoration-rose-300 underline-offset-4">{formatCurrency(stats?.breakdown?.withdrawals?.stampDuty || 0)}</span>
                      </div>
                  </div>
              </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-52 flex flex-col justify-between group hover:border-emerald-300 transition-all">
              <div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Delivery & Rides</p>
                  <p className="text-3xl font-black text-gray-900 leading-none">{formatCurrency(stats?.breakdown?.orders?.total || 0)}</p>
                  <div className="mt-3 flex items-center justify-between">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Courier + Ride Commission</span>
                      <span className="text-[10px] font-black text-gray-300">{(stats?.breakdown?.orders?.total / stats?.totalRevenue * 100 || 0).toFixed(1)}% MIX</span>
                  </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] font-black text-gray-400">
                  <span className="uppercase tracking-tighter">RIDES: {formatCurrency(stats?.breakdown?.orders?.ride || 0)}</span>
                  <span className="uppercase tracking-tighter">DELV: {formatCurrency(stats?.breakdown?.orders?.courier || 0)}</span>
              </div>
          </div>
      </div>

      {/* ─── Visual Comp & Trend ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 h-[28rem]">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 px-2">Administrative Profit Trend</h3>
              <div className="h-[20rem]">
                  <Line 
                    data={{
                        labels: stats?.timeline?.map(t => t.period) || [],
                        datasets: [
                            {
                                label: "Net Settlement",
                                data: stats?.timeline?.map(t => t.total) || [],
                                borderColor: "#4F46E5",
                                backgroundColor: "rgba(79, 70, 229, 0.05)",
                                tension: 0.4,
                                fill: true,
                                pointRadius: 5,
                                pointBackgroundColor: "#fff",
                                pointBorderWidth: 2
                            }
                        ]
                    }} 
                    options={{ 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        plugins: { legend: { display: false } },
                        scales: { 
                            y: { grid: { display: false }, ticks: { font: { weight: 'black' } } },
                            x: { grid: { display: false }, ticks: { font: { weight: 'black' } } }
                        }
                    }} 
                  />
              </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 flex flex-col items-center justify-between h-[28rem]">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Profit Composition</h3>
              <div className="h-[18rem] w-full">
                  <Doughnut 
                    data={{
                        labels: ["Utilities", "Withdrawals", "Delivery"],
                        datasets: [{
                            data: [
                                stats?.breakdown?.services?.total || 0,
                                stats?.breakdown?.withdrawals?.netGain || 0,
                                stats?.breakdown?.orders?.total || 0
                            ],
                            backgroundColor: ["#6366F1", "#F59E0B", "#10B981"],
                            borderWidth: 0,
                            spacing: 5,
                            borderRadius: 10
                        }]
                    }} 
                    options={{ responsive: true, maintainAspectRatio: false }} 
                  />
              </div>
              <div className="w-full text-center pb-4 pt-10 border-t border-gray-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Primary Stream</p>
                  <p className="text-lg font-black text-slate-900 uppercase italic">
                      {stats?.breakdown?.services?.total > Math.max(stats?.breakdown?.withdrawals?.netGain, stats?.breakdown?.orders?.total) ? 'Utility Hub' : 
                       stats?.breakdown?.withdrawals?.netGain > stats?.breakdown?.orders?.total ? 'Withdrawal Payouts' : 'Courier Network'}
                  </p>
              </div>
          </div>
      </div>

      {/* ─── User Search & Other Sections ─── */}
      <section className="bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 rounded-[3rem] shadow-2xl p-10 border border-indigo-100/50">
          <div className="flex flex-col lg:flex-row gap-8 items-center mb-10">
              <div className="flex-1">
                  <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
                          <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      User Market Profit Lookup
                  </h2>
                  <p className="text-gray-500 font-medium mt-1">Check lifetime profit generated by any user on the platform.</p>
              </div>
              <div className="flex w-full lg:w-auto gap-4">
                  <input 
                      type="text" 
                      placeholder="Email or Phone..."
                      value={userSearchText}
                      onChange={(e) => setUserSearchText(e.target.value)}
                      className="flex-1 lg:w-80 rounded-2xl border-2 border-gray-100 px-6 py-4 font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
                  />
                  <button 
                      onClick={handleSearchUserProfit}
                      className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all"
                  >
                      Lookup
                  </button>
              </div>
          </div>

          {userProfitData && (
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] border border-white shadow-inner grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-1 flex items-center gap-6">
                      <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-black">
                          {userProfitData.user.fullName?.[0]}
                      </div>
                      <div>
                          <p className="text-2xl font-black text-gray-900 leading-none">{userProfitData.user.fullName}</p>
                          <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest mt-2">{userProfitData.user.role}</p>
                      </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end items-center">
                       <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Lifetime Profit Generated</p>
                          <p className="text-5xl font-black text-emerald-600 tracking-tighter">{formatCurrency(userProfitData.profitSummary.totalLifetimeProfit)}</p>
                       </div>
                  </div>
              </div>
          )}
      </section>

      {/* ─── Loyalty Lifecycle ─── */}
      <section className="space-y-8 animate-fadeIn">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600 rounded-2xl shadow-xl shadow-purple-100">
                <TrophyIcon className="w-8 h-8 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Loyalty Point Lifecycle</h2>
                <p className="text-sm font-medium text-gray-500">Tracking the generation, accumulation, and redemption of platform incentive points.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Trend Chart */}
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" /> Economy Trend: Earned vs Redeemed
                    </h3>
                </div>
                <div className="h-[22rem]">
                    <Line 
                        data={{
                            labels: trendLabels,
                            datasets: [
                                {
                                    label: "Points Awarded",
                                    data: awardedData,
                                    borderColor: "#8B5CF6",
                                    backgroundColor: "rgba(139, 92, 246, 0.1)",
                                    tension: 0.4,
                                    fill: true,
                                    pointRadius: 4
                                },
                                {
                                    label: "Points Redeemed",
                                    data: redeemedData,
                                    borderColor: "#EC4899",
                                    backgroundColor: "rgba(236, 72, 153, 0.1)",
                                    tension: 0.4,
                                    fill: true,
                                    pointRadius: 4
                                }
                            ]
                        }}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { position: 'bottom', labels: { font: { weight: 'black' } } }
                            },
                            scales: {
                                x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 } } },
                                y: { grid: { color: "#f3f4f6" }, ticks: { font: { weight: 'bold' } } }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Source Distribution */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 flex flex-col">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8">Generation Mix</h3>
                <div className="flex-1 min-h-[18rem]">
                    {loyaltySourceMix.length > 0 ? (
                        <Doughnut 
                            data={{
                                labels: loyaltySourceMix.map(m => m.service?.toUpperCase() || 'OTHERS'),
                                datasets: [{
                                    data: loyaltySourceMix.map(m => m.totalPoints),
                                    backgroundColor: ["#8B5CF6", "#3B82F6", "#F59E0B", "#10B981", "#EF4444"],
                                    borderWidth: 0,
                                    borderRadius: 8,
                                    spacing: 4
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'bottom', labels: { font: { weight: 'black', size: 10 } } }
                                }
                            }}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-300 font-bold italic">No generation data</div>
                    )}
                </div>
            </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4" /> Top 10 Point Accumulators
                </h3>
                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest">Global Ranking</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase">Rank</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase">User Identity</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Points Held</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loyaltyLeaderboard.map((entry, index) => (
                            <tr key={entry.userId?._id} className="hover:bg-purple-50/30 transition-colors group">
                                <td className="px-8 py-4">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                        index === 0 ? "bg-amber-100 text-amber-600" :
                                        index === 1 ? "bg-gray-200 text-gray-600" :
                                        index === 2 ? "bg-orange-100 text-orange-600" :
                                        "bg-gray-100 text-gray-400"
                                    }`}>
                                        #{index + 1}
                                    </span>
                                </td>
                                <td className="px-8 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 shadow-sm group-hover:scale-110 transition-transform">
                                            {entry.userId?.profilePicture ? (
                                                <img src={entry.userId.profilePicture} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                                                    {entry.userId?.fullName?.[0] || 'U'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 tracking-tight">{entry.userId?.fullName || entry.userId?.email || 'Anonymous User'}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{entry.userId?.role || 'Customer'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-lg font-black text-purple-600 tracking-tighter">
                                            {entry.loyaltyPoints?.toLocaleString()}
                                        </span>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                            ≈ ₦{(entry.loyaltyPoints * (analytics.wallet?.pointValueNaira || 0)).toLocaleString()} Value
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {loyaltyLeaderboard.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-8 py-20 text-center text-gray-400 font-bold italic">No point holders found yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </section>

      {/* Footer */}
      <div className="pt-10 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center text-[10px] font-black text-gray-300 uppercase tracking-widest gap-4">
          <div className="flex items-center gap-4">
              <span>9NW-ANALYTIC-V2</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-200"></span>
              <span>Total Customers: {data.users?.totalCustomers || 0}</span>
          </div>
          <div>ESTIMATED SERVER TIME: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
};

export default Analytics;

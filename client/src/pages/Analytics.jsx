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
import { getAdminAnalytics } from "../services/adminApi";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { downloadAnalyticsReport } from "../utils/analyticsReport";
import { 
  BanknotesIcon, 
  CreditCardIcon, 
  TagIcon,
  ArrowPathIcon
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

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        // If dates are set, use them. Otherwise rely on period default from backend.
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
  // Trigger fetch when period OR dates change. 
  // Note: ideally we trigger on button click for dates to avoid rapid firing, 
  // but for now this is responsive. We can optimize if needed.

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
      // clear custom dates if switching simplified periods
      if(e.target.value !== 'custom') {
          setStartDate("");
          setEndDate("");
      }
  };

  const applyCustomDate = () => {
       // logic handled by effect dependency, but can be forced here
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

      {/* 1. Revenue & Financial Health */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <BanknotesIcon className="w-6 h-6 text-indigo-600" />
            Financial Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <BanknotesIcon className="w-16 h-16 text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Gross Commission (Net)</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(revenueData.totalCommission)}</p>
                    <p className="text-xs text-gray-400 line-through" title="Potential Gross Commission before waivers">{formatCurrency(revenueData.grossCommission)}</p>
                </div>
                <p className="text-xs text-blue-600 mt-2">After {formatCurrency(revenueData.totalWaivers)} in waivers</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 bg-pink-50 border-pink-100">
                <p className="text-sm font-medium text-pink-700">Waivers & Discounts</p>
                <p className="text-2xl font-bold text-pink-900 mt-1">{formatCurrency(revenueData.totalWaivers + revenueData.totalCustomerDiscounts)}</p>
                <p className="text-xs text-pink-600 mt-2">
                    Gold: {formatCurrency(revenueData.totalWaivers)} | Cust: {formatCurrency(revenueData.totalCustomerDiscounts)}
                </p>
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
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-80">
            <Line data={revenueDataset} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: 'Gross Commission Trend' } } }} />
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
                    <p className="text-sm font-medium text-gray-500">Total Rewards Awarded</p>
                    <p className="text-3xl font-bold text-purple-900 mt-2">{formatCurrency(rewardsData.rewardsAwarded)}</p>
                    <div className="mt-4 space-y-2 border-t pt-4">
                         <h4 className="text-xs font-semibold text-gray-400 uppercase">Breakdown</h4>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Customers Earned</span>
                            <span className="font-medium">{formatCurrency(rewardsData.rewardsByRole?.customer)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Riders Earned</span>
                            <span className="font-medium">{formatCurrency(rewardsData.rewardsByRole?.rider)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 bg-indigo-50">
                    <p className="text-sm font-medium text-indigo-800">Rewards Used (Redeemed)</p>
                    <p className="text-3xl font-bold text-indigo-900 mt-2">{formatCurrency(rewardsData.rewardsUsed)}</p>
                     <p className="text-xs text-indigo-600 mt-2">Redeemed for airtime, data, bills, etc.</p>
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

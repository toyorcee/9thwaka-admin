import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { toast } from "react-toastify";
import { getAdminAnalytics } from "../services/adminApi";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { downloadAnalyticsReport } from "../utils/analyticsReport";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAdminAnalytics({ period });
        setData(response);
      } catch (e) {
        setError("Failed to load analytics data.");
        console.error("Failed to load admin analytics:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

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

  const rewardsGiven = analytics.rewards?.given || {};
  const rewardsUsed = analytics.rewards?.used || {};
  const rewardsUsedByCategory = rewardsUsed.byCategory || {};
  const rewardsBillServices = rewardsUsed.billServices || {};

  const profitByPeriod = analytics.profit?.byPeriod || [];

  let dailyProfitSummary = null;

  if (period === "daily" && profitByPeriod.length > 0) {
    const profits = profitByPeriod.map((item) => item.profit || 0);
    const length = profits.length;
    const today = length >= 1 ? profits[length - 1] : 0;
    const yesterday = length >= 2 ? profits[length - 2] : 0;
    const last7Days = profits
      .slice(Math.max(0, length - 7))
      .reduce((sum, value) => sum + value, 0);
    const last30Days = profits
      .slice(Math.max(0, length - 30))
      .reduce((sum, value) => sum + value, 0);

    dailyProfitSummary = {
      today,
      yesterday,
      last7Days,
      last30Days,
    };
  }

  const revenueDataset = {
    labels,
    datasets: [
      {
        label: "9thWaka Revenue (Commission)",
        data:
          analytics.revenue?.byPeriod?.map((item) => item.commission) ||
          [],
        borderColor: "#4F46E5",
        backgroundColor: "rgba(79, 70, 229, 0.2)",
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const profitDataset = {
    labels: profitByPeriod.map((item) => item.period) || [],
    datasets: [
      {
        label: "Profit",
        data: profitByPeriod.map((item) => item.profit) || [],
        borderColor: "#059669",
        backgroundColor: "rgba(5, 150, 105, 0.2)",
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const paymentsTotals = analytics.payments?.totals || {};

  const payoutTotals = analytics.payouts?.totals || {};
  const payoutAllTime = analytics.payouts?.allTime || {};

  const goldDiscountTotals = analytics.goldStatus?.discounts?.total || {
    customer: 0,
    rider: 0,
    combined: 0,
  };

  const revenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Revenue over time",
      },
    },
  };

  const profitOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Profit over time",
      },
    },
  };

  const paymentsBreakdownDataset = {
    labels: ["Base fare", "Distance", "Levies", "Wait time", "Cancellation"],
    datasets: [
      {
        label: "Amount",
        data: [
          paymentsTotals.baseFare || 0,
          paymentsTotals.distanceFee || 0,
          paymentsTotals.levies || 0,
          paymentsTotals.waitTimeFee || 0,
          paymentsTotals.totalCancellationFee || 0,
        ],
        backgroundColor: [
          "#4F46E5",
          "#6366F1",
          "#F59E0B",
          "#EF4444",
          "#6B7280",
        ],
      },
    ],
  };

  const paymentsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Customer payment breakdown (total for period range)",
      },
    },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Platform Analytics
          </h1>
          <p className="text-gray-500">
            Revenue, rewards, Gold Status discounts, and payout performance.
          </p>
          {hasRange && (
            <p className="text-sm font-semibold text-red-500 mt-1">
              Showing analytics from {formatDate(rangeStart)} to{" "}
              {formatDate(rangeEnd)}.
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-gray-100 text-gray-800 rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button
              type="button"
              disabled={reportLoading}
              onClick={async () => {
                if (!analytics) {
                  toast.info("No analytics available right now.");
                  return;
                }

                const hasRevenue =
                  Array.isArray(analytics.revenue?.byPeriod) &&
                  analytics.revenue.byPeriod.length > 0;
                const hasProfit =
                  Array.isArray(analytics.profit?.byPeriod) &&
                  analytics.profit.byPeriod.length > 0;
                const hasRewards =
                  (analytics.rewards?.given?.total || 0) > 0 ||
                  (analytics.rewards?.used?.total || 0) > 0;

                if (!hasRevenue && !hasProfit && !hasRewards) {
                  toast.info("No analytics available for the selected period.");
                  return;
                }

                try {
                  setReportLoading(true);
                  await downloadAnalyticsReport({ analytics, period });
                  toast.success("Analytics report downloaded.");
                } catch (e) {
                  console.error("Failed to generate analytics report:", e);
                  toast.error("Failed to generate analytics report.");
                } finally {
                  setReportLoading(false);
                }
              }}
              className="bg-green-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-accent-blue"
            >
              {reportLoading ? "Preparing report..." : "Download report"}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-100 text-gray-800 rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-100 text-gray-800 rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
            <button
              type="button"
              onClick={async () => {
                if (!startDate || !endDate) {
                  setError("Please select both start and end dates.");
                  return;
                }
                if (startDate > endDate) {
                  setError("Start date cannot be after end date.");
                  return;
                }
                try {
                  setLoading(true);
                  setError(null);
                  const response = await getAdminAnalytics({
                    period,
                    startDate,
                    endDate,
                  });
                  setData(response);
                } catch (e) {
                  setError("Failed to load analytics data.");
                  console.error(
                    "Failed to load admin analytics (date range):",
                    e
                  );
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-blue-500 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-accent-blue"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-500 mb-1">
            Total 9thWaka revenue
          </h2>
          <p className="text-2xl font-bold text-gray-800">
            {formatCurrency(analytics.revenue?.totalCommission || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Across selected period</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-500 mb-1">
            Gold Status discounts (customers)
          </h2>
          <p className="text-2xl font-bold text-gray-800">
            {formatCurrency(goldDiscountTotals.customer || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Total discounts applied to customer orders
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-500 mb-1">
            Gold Status discounts (riders)
          </h2>
          <p className="text-2xl font-bold text-gray-800">
            {formatCurrency(goldDiscountTotals.rider || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Commission reductions for Gold riders
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-500 mb-1">
            Profit (revenue minus rewards)
          </h2>
          <p className="text-2xl font-bold text-gray-800">
            {formatCurrency(analytics.profit?.total || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Commission minus referral and streak rewards
          </p>
        </div>
      </div>

      {dailyProfitSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-1">
              Today&apos;s profit
            </h2>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(dailyProfitSummary.today)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Profit for the latest day in range
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-1">
              Yesterday&apos;s profit
            </h2>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(dailyProfitSummary.yesterday)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Profit for the previous day
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-1">
              Last 7 days profit
            </h2>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(dailyProfitSummary.last7Days)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Sum of profit for the last 7 days
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-1">
              Last 30 days profit
            </h2>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(dailyProfitSummary.last30Days)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Sum of profit for the last 30 days
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Rewards overview for selected period
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div>
            <p className="text-gray-500 mb-1">Total rewards given out</p>
            <p className="text-2xl font-bold text-gray-800 mb-2">
              {formatCurrency(rewardsGiven.total || 0)}
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                Referral rewards:{" "}
                <span className="font-semibold">
                  {formatCurrency(rewardsGiven.byType?.referral_reward || 0)}
                </span>
              </p>
              <p>
                Streak bonuses:{" "}
                <span className="font-semibold">
                  {formatCurrency(rewardsGiven.byType?.streak_bonus || 0)}
                </span>
              </p>
            </div>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Rewards usage breakdown</p>
            <p className="text-2xl font-bold text-gray-800 mb-2">
              {formatCurrency(rewardsUsed.total || 0)}
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                Used to pay order amounts (customers):{" "}
                <span className="font-semibold">
                  {formatCurrency(
                    rewardsUsedByCategory.order_payment || 0
                  )}
                </span>
              </p>
              <p>
                Used to pay payout commission (riders):{" "}
                <span className="font-semibold">
                  {formatCurrency(
                    rewardsUsedByCategory.commission_payment || 0
                  )}
                </span>
              </p>
              <p>
                Used to pay bills (airtime/data/cable/electricity):{" "}
                <span className="font-semibold">
                  {formatCurrency(rewardsUsedByCategory.bill_payment || 0)}
                </span>
              </p>
            </div>
            {Object.keys(rewardsBillServices).length > 0 && (
              <div className="mt-3 text-xs text-gray-600">
                <p className="font-semibold mb-1">
                  Bill usage by service:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {Object.entries(rewardsBillServices).map(
                    ([serviceKey, amount]) => (
                      <div
                        key={serviceKey}
                        className="flex justify-between"
                      >
                        <span className="capitalize">
                          {serviceKey.replace(/_/g, " ")}
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(amount || 0)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: "360px" }}>
          <Line data={revenueDataset} options={revenueOptions} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: "360px" }}>
          <Line data={profitDataset} options={profitOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: "360px" }}>
          <Bar data={paymentsBreakdownDataset} options={paymentsOptions} />
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Rider payout summary
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Total commission generated (range)</span>
              <span className="font-semibold">
                {formatCurrency(
                  (payoutTotals.commissionGenerated || 0)
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Paid by riders (range)</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(payoutTotals.paid || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pending from riders (range)</span>
              <span className="font-semibold text-yellow-600">
                {formatCurrency(payoutTotals.pending || 0)}
              </span>
            </div>
            <div className="border-t border-gray-200 my-2" />
            <div className="flex justify-between">
              <span>All-time paid</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(payoutAllTime.paid || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>All-time pending</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(payoutAllTime.pending || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Customer payment totals for selected period
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm text-gray-700">
          <div>
            <p className="text-gray-500">Base fare</p>
            <p className="font-semibold">
              {formatCurrency(paymentsTotals.baseFare || 0)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Distance fee</p>
            <p className="font-semibold">
              {formatCurrency(paymentsTotals.distanceFee || 0)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Levies</p>
            <p className="font-semibold">
              {formatCurrency(paymentsTotals.levies || 0)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Wait time fees</p>
            <p className="font-semibold">
              {formatCurrency(paymentsTotals.waitTimeFee || 0)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Cancellation fees</p>
            <p className="font-semibold">
              {formatCurrency(paymentsTotals.totalCancellationFee || 0)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Discounts (incl. Gold)</p>
            <p className="font-semibold">
              {formatCurrency(paymentsTotals.discount || 0)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Wallet payments</p>
            <p className="font-semibold">
              {formatCurrency(paymentsTotals.walletAmountUsed || 0)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Total collected</p>
            <p className="font-semibold">
              {formatCurrency(paymentsTotals.total || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

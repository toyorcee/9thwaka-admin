import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminTransactions } from "../services/adminApi";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount || 0);
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const getTypeMeta = (type) => {
  switch (type) {
    case "order_payment":
      return {
        label: "Order payment",
        className: "bg-blue-100 text-blue-800",
      };
    case "bill_payment":
      return {
        label: "Bill payment",
        className: "bg-amber-100 text-amber-800",
      };
    case "commission":
      return {
        label: "Commission",
        className: "bg-purple-100 text-purple-800",
      };
    case "rider_payout":
      return {
        label: "Rider payout",
        className: "bg-emerald-100 text-emerald-800",
      };
    case "referral_reward":
      return {
        label: "Referral reward",
        className: "bg-sky-100 text-sky-800",
      };
    case "streak_bonus":
      return {
        label: "Streak bonus",
        className: "bg-pink-100 text-pink-800",
      };
    case "cancellation_earnings":
      return {
        label: "Cancellation earnings",
        className: "bg-slate-100 text-slate-800",
      };
    case "refund":
      return {
        label: "Refund",
        className: "bg-red-100 text-red-800",
      };
    default:
      return {
        label: type || "Unknown",
        className: "bg-gray-100 text-gray-800",
      };
  }
};

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    type: "",
    status: "",
    search: "",
    from: "",
    to: "",
    minAmount: "",
    maxAmount: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 20,
  });

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: filters.page,
        limit: filters.limit,
      };

      if (filters.type) {
        params.type = filters.type;
      }
      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.from) {
        params.from = filters.from;
      }
      if (filters.to) {
        params.to = filters.to;
      }
      if (filters.minAmount) {
        params.minAmount = filters.minAmount;
      }
      if (filters.maxAmount) {
        params.maxAmount = filters.maxAmount;
      }

      const data = await getAdminTransactions(params);
      const list = data?.transactions || [];
      const pageInfo = data?.pagination || {};

      setTransactions(list);
      setPagination({
        page: pageInfo.page || filters.page,
        totalPages: pageInfo.totalPages || 1,
        total: pageInfo.total || list.length,
        limit: pageInfo.limit || filters.limit,
      });
    } catch (e) {
      setError("Failed to load transactions.");
      console.error("Failed to load admin transactions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [
    filters.page,
    filters.type,
    filters.status,
    filters.search,
    filters.from,
    filters.to,
    filters.minAmount,
    filters.maxAmount,
  ]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: name === "page" ? Number(value) || 1 : 1,
    }));
  };

  const handleChangePage = (direction) => {
    setFilters((prev) => ({
      ...prev,
      page:
        direction === "next"
          ? Math.min(prev.page + 1, pagination.totalPages)
          : Math.max(prev.page - 1, 1),
    }));
  };

  const handleOpenUser = (user, role) => {
    if (!user || !user._id || !role) {
      return;
    }
    const searchTerm =
      user.email || user.phoneNumber || user.fullName || "";
    if (!searchTerm) {
      return;
    }
    const basePath = role === "Rider" ? "/riders" : "/customers";
    navigate(`${basePath}?search=${encodeURIComponent(searchTerm)}`);
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="p-6 h-full">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          Transactions
        </h1>
        <p className="text-gray-600 mb-4">
          View all platform-level transactions such as order payments and
          commissions.
        </p>
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="p-6 h-full">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          Transactions
        </h1>
        <p className="text-gray-600 mb-4">
          View all platform-level transactions such as order payments and
          commissions.
        </p>
        <EmptyState
          type="generic"
          title="No transactions yet"
          description="Transactions will appear here as users place orders, pay bills, and payouts are processed."
        />
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">Transactions</h1>
      <p className="text-gray-600 mb-6">
        View and filter transactions across the platform.
      </p>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <select
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
          className="bg-white text-gray-800 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        >
          <option value="">All types</option>
          <option value="order_payment">Order payment</option>
          <option value="commission">Commission</option>
          <option value="rider_payout">Rider payout</option>
          <option value="refund">Refund</option>
          <option value="referral_reward">Referral reward</option>
          <option value="streak_bonus">Streak bonus</option>
          <option value="cancellation_earnings">Cancellation earnings</option>
          <option value="bill_payment">Bill payment</option>
        </select>
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="bg-white text-gray-800 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by user, description, reference..."
          className="bg-white text-gray-800 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
        <input
          type="date"
          name="from"
          value={filters.from}
          onChange={handleFilterChange}
          className="bg-white text-gray-800 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
        <input
          type="date"
          name="to"
          value={filters.to}
          onChange={handleFilterChange}
          className="bg-white text-gray-800 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
        <div className="flex gap-2">
          <input
            type="number"
            name="minAmount"
            value={filters.minAmount}
            onChange={handleFilterChange}
            placeholder="Min amount"
            className="flex-1 bg-white text-gray-800 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
          <input
            type="number"
            name="maxAmount"
            value={filters.maxAmount}
            onChange={handleFilterChange}
            placeholder="Max amount"
            className="flex-1 bg-white text-gray-800 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                Type
              </th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                Amount
              </th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                Status
              </th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                User
              </th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                Role
              </th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                Description / Reference
              </th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const typeMeta = getTypeMeta(tx.type);
              let user = null;
              let roleLabel = "";

              if (tx.type === "rider_payout" || tx.type === "commission") {
                user = tx.riderId || null;
                roleLabel = user ? "Rider" : "";
              } else if (tx.customerId && tx.riderId) {
                user = tx.customerId;
                roleLabel = "Customer";
              } else if (tx.customerId) {
                user = tx.customerId;
                roleLabel = "Customer";
              } else if (tx.riderId) {
                user = tx.riderId;
                roleLabel = "Rider";
              }

              const userName =
                user?.fullName ||
                user?.email ||
                user?.phoneNumber ||
                "N/A";

              const reference =
                tx.metadata?.reference ||
                tx.metadata?.service ||
                tx.metadata?.phoneNumber ||
                null;

              return (
                <tr
                  key={tx._id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-gray-800">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeMeta.className}`}
                    >
                      {typeMeta.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-800">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-3 px-4 text-gray-800">{tx.status}</td>
                  <td className="py-3 px-4 text-gray-800">
                    {user ? (
                      <button
                        type="button"
                        onClick={() => handleOpenUser(user, roleLabel)}
                        className="text-accent-blue hover:underline"
                      >
                        {userName}
                      </button>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-800">
                    {roleLabel || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-gray-800">
                    <div>{tx.description || "N/A"}</div>
                    {reference && (
                      <div className="text-xs text-gray-500 mt-1">
                        Ref: {reference}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-800">
                    {formatDateTime(tx.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-center text-gray-800">
        <div>
          <p>
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <p className="text-sm text-gray-500">
            Showing up to {pagination.limit} transactions per page. Total:{" "}
            {pagination.total}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleChangePage("prev")}
            disabled={pagination.page <= 1}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => handleChangePage("next")}
            disabled={pagination.page >= pagination.totalPages}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Transactions;

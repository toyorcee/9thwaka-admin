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
  const [selectedTransaction, setSelectedTransaction] = useState(null);

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

  const handleOpenDetails = (tx) => {
    setSelectedTransaction(tx);
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
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

      <div className="bg-white/50 backdrop-blur-md border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Search Bar - Full width on mobile/tablet, Half width on large */}
          <div className="md:col-span-2 xl:col-span-2 flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Search Transactions</label>
            <div className="relative">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by user, description, reference..."
                className="w-full bg-white text-gray-800 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all duration-200"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Transaction Type</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full bg-white text-gray-800 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all duration-200"
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
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full bg-white text-gray-800 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all duration-200"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Range Group */}
          <div className="md:col-span-2 xl:col-span-2 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">From Date</label>
              <input
                type="date"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                className="w-full bg-white text-gray-800 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all duration-200"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">To Date</label>
              <input
                type="date"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className="w-full bg-white text-gray-800 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all duration-200"
              />
            </div>
          </div>

          {/* Amount Range Group */}
          <div className="md:col-span-2 xl:col-span-2 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Min Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
                <input
                  type="number"
                  name="minAmount"
                  value={filters.minAmount}
                  onChange={handleFilterChange}
                  placeholder="0.00"
                  className="w-full bg-white text-gray-800 pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Max Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
                <input
                  type="number"
                  name="maxAmount"
                  value={filters.maxAmount}
                  onChange={handleFilterChange}
                  placeholder="1,000,000"
                  className="w-full bg-white text-gray-800 pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Type
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Amount
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                  User
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Role
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Description / Reference
                </th>
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-widest text-nowrap">
                  Date
                </th>
                <th className="py-4 px-6 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
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
                    className="hover:bg-gray-50/50 transition-colors duration-200"
                  >
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeMeta.className}`}
                      >
                        {typeMeta.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-gray-900">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {user ? (
                        <button
                          type="button"
                          onClick={() => handleOpenUser(user, roleLabel)}
                          className="text-accent-blue font-medium hover:text-accent-blue/80 hover:underline decoration-accent-blue/30 transition-all"
                        >
                          {userName}
                        </button>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                      {roleLabel || <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="text-gray-900 font-medium">{tx.description || <span className="text-gray-400">N/A</span>}</div>
                      {reference && (
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                          Ref: {reference}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 tabular-nums">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(tx)}
                        className="px-4 py-1.5 text-[10px] font-bold text-accent-blue bg-accent-blue/5 border border-accent-blue/10 rounded-full hover:bg-accent-blue hover:text-white hover:border-accent-blue transition-all duration-200 shadow-sm uppercase tracking-wider"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
                <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-widest">ID: {selectedTransaction._id}</p>
              </div>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-8 py-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusStyle(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getTypeMeta(selectedTransaction.type).className}`}>
                    {getTypeMeta(selectedTransaction.type).label}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Time</p>
                  <p className="text-sm font-medium text-gray-700">{formatDateTime(selectedTransaction.createdAt)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  User Information
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Name</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {selectedTransaction.customerId?.fullName || selectedTransaction.riderId?.fullName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Role</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {selectedTransaction.customerId ? "Customer" : selectedTransaction.riderId ? "Rider" : "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email / Phone</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {selectedTransaction.customerId?.email || selectedTransaction.riderId?.email || selectedTransaction.customerId?.phoneNumber || selectedTransaction.riderId?.phoneNumber || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-sm text-gray-700 leading-relaxed bg-white border border-gray-100 p-4 rounded-xl">
                    {selectedTransaction.description || "No description provided."}
                  </p>
                </div>

                {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Metadata / Details</h3>
                    <div className="bg-gray-900 rounded-xl p-4 font-mono text-[11px] text-green-400 overflow-x-auto max-h-48">
                      <pre>{JSON.stringify(selectedTransaction.metadata, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;

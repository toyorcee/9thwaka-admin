import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminTransactions } from "../services/adminApi";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";

const formatCurrency = (amount) => {
  const num = Number(amount);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TYPE_META = {
  order_payment:          { label: "Order Payment",         color: "bg-blue-100 text-blue-800 border-blue-200" },
  bill_payment:           { label: "Bill Payment",          color: "bg-amber-100 text-amber-800 border-amber-200" },
  commission:             { label: "Commission",            color: "bg-purple-100 text-purple-800 border-purple-200" },
  rider_payout:           { label: "Rider Payout",          color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  referral_reward:        { label: "Referral Reward",       color: "bg-sky-100 text-sky-800 border-sky-200" },
  streak_bonus:           { label: "Streak Bonus",          color: "bg-pink-100 text-pink-800 border-pink-200" },
  cancellation_earnings:  { label: "Cancellation",         color: "bg-slate-100 text-slate-800 border-slate-200" },
  refund:                 { label: "Refund",                color: "bg-red-100 text-red-800 border-red-200" },
  admin_credit:           { label: "Admin Credit",          color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  admin_manual_credit:    { label: "Manual Credit",         color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  admin_credit_reward:    { label: "Reward Credit",         color: "bg-violet-100 text-violet-800 border-violet-200" },
  admin_manual_debit:     { label: "Manual Debit",          color: "bg-rose-100 text-rose-800 border-rose-200" },
  admin_debit_penalty:    { label: "Debit Penalty",         color: "bg-rose-100 text-rose-800 border-rose-200" },
};

const getTypeMeta = (type) =>
  TYPE_META[type] || { label: type || "Unknown", color: "bg-gray-100 text-gray-700 border-gray-200" };

const STATUS_STYLE = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  failed:    "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};
const getStatusStyle = (s) => STATUS_STYLE[s?.toLowerCase()] || "bg-gray-100 text-gray-600 border-gray-200";

/** Convert a metadata object into a readable list of label → value pairs */
const renderMetadataRows = (metadata) => {
  if (!metadata || typeof metadata !== "object") return null;

  const LABEL_MAP = {
    source:           "Source",
    service:          "Service",
    reference:        "Reference",
    phoneNumber:      "Phone Number",
    billAmount:       "Bill Amount",
    billFee:          "Bill Fee",
    serviceProfit:    "Service Profit",
    billPaymentFee:   "Bill Payment Fee",
    netPosition:      "Net Position",
    targetUserId:     "Target User ID",
    sourceUserId:     "Source User ID",
    adminWalletId:    "Admin Wallet ID",
    transferredBy:    "Transferred By (Admin)",
    debitedBy:        "Debited By (Admin)",
    balanceType:      "Balance Type",
    correctedCount:   "Corrected Txn Count",
    payscribeCost:    "Provider Cost (Payscribe)",
    payscribeFee:     "Provider Fee (Payscribe)",
    platformGain:     "Platform Profit/Loss",
    userFee:          "User Processing Fee",
  };

  const rows = [];
  for (const [key, val] of Object.entries(metadata)) {
    if (val === undefined || val === null || val === "") continue;
    const label = LABEL_MAP[key] || key.replace(/([A-Z])/g, " $1").trim();

    const isMonetary = ["billAmount","billFee","serviceProfit","billPaymentFee","netPosition", "payscribeCost", "payscribeFee", "platformGain", "userFee"].includes(key);
    const displayVal = isMonetary
      ? `₦${Number(val).toLocaleString()}`
      : typeof val === "object"
        ? JSON.stringify(val, null, 2)
        : String(val);

    rows.push({ label, displayVal });
  }
  return rows;
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
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: filters.page, limit: filters.limit };
      if (filters.type)      params.type      = filters.type;
      if (filters.status)    params.status    = filters.status;
      if (filters.search)    params.search    = filters.search;
      if (filters.from)      params.from      = filters.from;
      if (filters.to)        params.to        = filters.to;
      if (filters.minAmount) params.minAmount = filters.minAmount;
      if (filters.maxAmount) params.maxAmount = filters.maxAmount;
      const data = await getAdminTransactions(params);
      setTransactions(data?.transactions || []);
      const pi = data?.pagination || {};
      setPagination({
        page: pi.page || filters.page,
        totalPages: pi.totalPages || 1,
        total: pi.total || 0,
        limit: pi.limit || filters.limit,
      });
    } catch (e) {
      setError("Failed to load transactions.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [filters.page, filters.type, filters.status, filters.search, filters.from, filters.to, filters.minAmount, filters.maxAmount]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value, page: name === "page" ? Number(value) || 1 : 1 }));
  };

  const handleChangePage = (dir) => {
    setFilters((p) => ({
      ...p,
      page: dir === "next" ? Math.min(p.page + 1, pagination.totalPages) : Math.max(p.page - 1, 1),
    }));
  };

  const resolveUser = (tx) => {
    // For regular transactions
    if (tx.customerId || tx.riderId) {
      const u = tx.customerId || tx.riderId;
      const role = tx.customerId ? (tx.customerId.role || "Customer") : (tx.riderId?.role || "Rider");
      return { user: u, roleLabel: role.charAt(0).toUpperCase() + role.slice(1) };
    }
    // For admin credit/debit transactions with a related user attached by the backend
    if (tx.relatedUser) {
      const r = tx.relatedUser;
      return { user: r, roleLabel: r.role ? r.role.charAt(0).toUpperCase() + r.role.slice(1) : "User" };
    }
    return { user: null, roleLabel: "" };
  };

  const handleOpenUser = (user, role) => {
    if (!user?._id) return;
    const searchTerm = user.email || user.phoneNumber || user.fullName || "";
    if (!searchTerm) return;
    const basePath = role?.toLowerCase() === "rider" ? "/riders" : "/customers";
    navigate(`${basePath}?search=${encodeURIComponent(searchTerm)}`);
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="p-6 h-full">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Transactions</h1>
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-1 text-sm">Real-time view of all money movements across the platform.</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 xl:col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" name="search" value={filters.search} onChange={handleFilterChange}
                placeholder="Search by user, description, reference…"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Type</label>
            <select name="type" value={filters.type} onChange={handleFilterChange}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all">
              <option value="">All types</option>
              <option value="order_payment">Order Payment</option>
              <option value="bill_payment">Bill Payment</option>
              <option value="commission">Commission</option>
              <option value="rider_payout">Rider Payout</option>
              <option value="refund">Refund</option>
              <option value="referral_reward">Referral Reward</option>
              <option value="streak_bonus">Streak Bonus</option>
              <option value="cancellation_earnings">Cancellation</option>
              <option value="admin_credit">Admin Credit</option>
              <option value="admin_manual_credit">Manual Credit</option>
              <option value="admin_manual_debit">Manual Debit</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Dates */}
          <div className="md:col-span-2 flex gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">From</label>
              <input type="date" name="from" value={filters.from} onChange={handleFilterChange}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"/>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">To</label>
              <input type="date" name="to" value={filters.to} onChange={handleFilterChange}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"/>
            </div>
          </div>

          {/* Amount */}
          <div className="md:col-span-2 flex gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Min ₦</label>
              <input type="number" name="minAmount" value={filters.minAmount} onChange={handleFilterChange}
                placeholder="0"
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"/>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Max ₦</label>
              <input type="number" name="maxAmount" value={filters.maxAmount} onChange={handleFilterChange}
                placeholder="1,000,000"
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"/>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {transactions.length === 0 ? (
        <EmptyState type="generic" title="No transactions found" description="Try adjusting your filters." />
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Type", "Amount", "Status", "User", "Role", "Description", "Date", ""].map((h) => (
                      <th key={h} className="py-3.5 px-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx) => {
                    const meta = getTypeMeta(tx.type);
                    const { user, roleLabel } = resolveUser(tx);
                    const userName = user?.fullName || user?.email || user?.phoneNumber || null;
                    const isDebit = tx.type?.includes("debit") || tx.type?.includes("payout");
                    const reference =
                      tx.metadata?.reference || tx.metadata?.service || tx.metadata?.phoneNumber || null;

                    return (
                      <tr key={tx._id} className="hover:bg-blue-50/30 transition-colors duration-150 group">
                        {/* Type */}
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${meta.color}`}>
                            {meta.label}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-5">
                          <span className={`text-sm font-bold ${isDebit ? "text-red-600" : "text-gray-900"}`}>
                            {isDebit ? "-" : ""}{formatCurrency(tx.amount)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(tx.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              tx.status === "completed" ? "bg-emerald-500" :
                              tx.status === "pending" ? "bg-amber-500" :
                              tx.status === "failed" ? "bg-red-500" : "bg-gray-400"
                            }`}/>
                            {tx.status}
                          </span>
                        </td>

                        {/* User */}
                        <td className="py-4 px-5">
                          {userName ? (
                            <button
                              type="button"
                              onClick={() => handleOpenUser(user, roleLabel)}
                              className="flex items-center gap-2 group/user"
                            >
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                                {(userName.charAt(0) || "U").toUpperCase()}
                              </div>
                              <span className="text-sm font-semibold text-blue-600 group-hover/user:underline">
                                {userName.split(" ").slice(0, 2).join(" ")}
                              </span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                              </div>
                              <span className="text-sm font-semibold text-violet-700">Admin</span>
                            </div>
                          )}
                        </td>

                        {/* Role */}
                        <td className="py-4 px-5">
                          {roleLabel ? (
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                              roleLabel.toLowerCase() === "rider" ? "bg-emerald-50 text-emerald-700" :
                              roleLabel.toLowerCase() === "admin" ? "bg-indigo-50 text-indigo-700" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {roleLabel}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-violet-50 text-violet-700">Admin</span>
                          )}
                        </td>

                        {/* Description */}
                        <td className="py-4 px-5 max-w-[220px]">
                          <p className="text-sm text-gray-700 font-medium truncate" title={tx.description}>
                            {tx.description || <span className="text-gray-300 italic text-xs">No description</span>}
                          </p>
                          {reference && (
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                              Ref: {reference}
                            </p>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-5 text-xs text-gray-500 whitespace-nowrap tabular-nums">
                          {formatDateTime(tx.createdAt)}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-5">
                          <button
                            type="button"
                            onClick={() => setSelectedTransaction(tx)}
                            className="px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 uppercase tracking-wider opacity-0 group-hover:opacity-100"
                          >
                            Details →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-5 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Page <span className="font-semibold text-gray-800">{pagination.page}</span> of <span className="font-semibold text-gray-800">{pagination.totalPages}</span>
              &nbsp;·&nbsp;
              <span className="text-gray-400">{pagination.total.toLocaleString()} total</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleChangePage("prev")}
                disabled={pagination.page <= 1}
                className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => handleChangePage("next")}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Details Modal ── */}
      {selectedTransaction && (() => {
        const tx = selectedTransaction;
        const meta = getTypeMeta(tx.type);
        const { user, roleLabel } = resolveUser(tx);
        const userName = user?.fullName || user?.email || user?.phoneNumber || null;
        const isDebit = tx.type?.includes("debit") || tx.type?.includes("payout");
        const metaRows = renderMetadataRows(tx.metadata);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedTransaction(null); }}
          >
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-lg font-black text-gray-900">Transaction Details</h2>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{tx._id}</p>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-7 py-6 overflow-y-auto flex-1 space-y-6">

                {/* Amount + Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Amount</p>
                    <p className={`text-4xl font-black ${isDebit ? "text-red-600" : "text-gray-900"}`}>
                      {isDebit ? "-" : ""}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${getStatusStyle(tx.status)}`}>
                      <span className={`w-2 h-2 rounded-full ${
                        tx.status === "completed" ? "bg-emerald-500" :
                        tx.status === "pending" ? "bg-amber-500 animate-pulse" :
                        "bg-red-500"
                      }`}/>
                      {tx.status}
                    </span>
                  </div>
                </div>

                {/* Type + Date */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Type</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Date & Time</p>
                    <p className="text-sm font-semibold text-gray-800">{formatDateTime(tx.createdAt)}</p>
                  </div>
                </div>

                {/* User Info */}
                <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    User Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Name</p>
                      {userName ? (
                        <button
                          type="button"
                          onClick={() => handleOpenUser(user, roleLabel)}
                          className="text-sm font-bold text-blue-600 hover:underline text-left"
                        >
                          {userName}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          </div>
                          <p className="text-sm font-bold text-violet-700">Admin</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Role</p>
                      {roleLabel ? (
                        <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                          roleLabel.toLowerCase() === "rider" ? "bg-emerald-100 text-emerald-700" :
                          roleLabel.toLowerCase() === "admin" ? "bg-indigo-100 text-indigo-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {roleLabel}
                        </span>
                      ) : (
                        <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-violet-50 text-violet-700">Admin</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Contact</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {user?.email || user?.phoneNumber || <span className="text-gray-400 italic">—</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 border border-gray-100 rounded-xl p-4">
                    {tx.description || <span className="italic text-gray-400">No description provided.</span>}
                  </p>
                </div>

                {/* Metadata — formatted as clean key-value cards */}
                {metaRows && metaRows.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Transaction Details</p>
                    <div className="grid grid-cols-2 gap-2">
                      {metaRows.map(({ label, displayVal }, idx) => (
                        <div key={`${label}-${idx}`} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                          <p className="text-sm font-semibold text-gray-800 break-all">{displayVal}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-7 py-4 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="px-6 py-2.5 text-sm font-bold bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Transactions;

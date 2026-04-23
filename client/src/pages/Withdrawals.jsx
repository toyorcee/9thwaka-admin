import React, { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { fetchServiceCosts, updateAdminSettings } from "../services/settingsApi";
import Skeleton from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import ValidatedInput from "../components/ValidatedInput";
import { toast } from "react-toastify";
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ArrowPathIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ListBulletIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  UserGroupIcon,
  CalendarIcon,
  BuildingLibraryIcon,
  ArrowTrendingUpIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import { getWithdrawalTaxStats } from "../services/adminWalletApi";

const Withdrawals = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Settings State
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [simAmount, setSimAmount] = useState(10000);
  const [taxStats, setTaxStats] = useState({
      totalVat: 0,
      totalStampDuty: 0,
      totalPlatformGain: 0,
      totalFee: 0,
      count: 0
  });
  const [taxStatsPeriod, setTaxStatsPeriod] = useState("month");
  const [loadingTaxStats, setLoadingTaxStats] = useState(false);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        api.get('/withdrawals', {
            params: {
              page,
              limit: 20,
              status: statusFilter
            }
        }),
        api.get(`/dashboard/order-stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
      ]);
      setWithdrawals(listRes.data.withdrawals || []);
      setTotalPages(listRes.data.pagination?.pages || 1);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch withdrawals:", err);
      setError("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalStats = useCallback(async () => {
    try {
        setLoadingTaxStats(true);
        const res = await getWithdrawalTaxStats(taxStatsPeriod);
        if (res.success) setTaxStats(res.stats);
    } catch (err) {
        console.error("Failed to fetch tax stats:", err);
    } finally {
        setLoadingTaxStats(false);
    }
  }, [taxStatsPeriod]);

  const loadSettings = useCallback(async () => {
    try {
      const data = await fetchServiceCosts();
      if (data?.pricingControls?.withdrawalControls) {
        setSettings({
            ...data.pricingControls.withdrawalControls,
            minimumWithdrawalAmount: data.minimumWithdrawalAmount || 2000
        });
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      toast.error("Failed to load withdrawal rules.");
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchWithdrawals();
      fetchWithdrawalStats();
    } else {
      loadSettings();
    }
  }, [page, statusFilter, activeTab, loadSettings, fetchWithdrawalStats, dateRange, taxStatsPeriod]);

  const handleVerifyStatus = async (withdrawalId) => {
    try {
      setVerifyingId(withdrawalId);
      const response = await api.post(`/withdrawals/${withdrawalId}/verify-status`);
      
      if (response.data.success) {
        await fetchWithdrawals();
        toast.success(`Status Verified: ${response.data.data.status}`); 
      } else {
        toast.error("Verification failed: " + (response.data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Verification error:", err);
      toast.error("Failed to verify status: " + (err.response?.data?.error || err.message));
    } finally {
      setVerifyingId(null);
    }
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      const payload = { 
          withdrawalControls: { ...settings },
          minimumWithdrawalAmount: settings.minimumWithdrawalAmount
      };
      
      const res = await updateAdminSettings(payload);
      if (res.success) {
          toast.success("Withdrawal settings updated successfully!");
          await loadSettings();
      }
    } catch (err) {
      toast.error("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const calculateSim = () => {
    if (!settings) return null;
    const amt = Number(simAmount);
    
    // Tiered Logic (synced with withdrawalUtils.js defaults)
    let base = settings.tier3Fee || 75;
    if (amt < (settings.tier1Limit || 5000)) base = settings.tier1Fee || 50;
    else if (amt <= (settings.tier2Limit || 50000)) base = settings.tier2Fee || 50;
    
    const vat = base * ((settings.vatPercent || 7.5) / 100);
    const stamp = (amt >= (settings.stampDutyThreshold || 10000)) ? (settings.stampDutyAmount || 50) : 0;
    
    const totalRaw = base + vat + stamp;
    
    // Quota waiver simulation
    let waivedBase = base;
    let waivedVat = vat;
    let waivedStamp = stamp;
    
    if (settings.freeWithdrawalWaiveBaseFee) waivedBase = 0;
    if (settings.freeWithdrawalWaiveVat) waivedVat = 0;
    if (settings.freeWithdrawalWaiveStampDuty) waivedStamp = 0;
    
    const totalWaived = waivedBase + waivedVat + waivedStamp;
    
    // Profit calculation
    const estimatedProviderCost = 20;
    const paidProfit = Math.round((base - estimatedProviderCost) * 100) / 100;
    const freeAbsorption = Math.round((totalWaived - estimatedProviderCost) * 100) / 100;
    
    return { base, vat, stamp, totalRaw, totalWaived, paidProfit, freeAbsorption, estimatedProviderCost };
  };

  const sim = calculateSim();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Completed</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 flex items-center gap-1"><XCircleIcon className="w-3 h-3"/> Failed</span>;
      case 'processing':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1"><ArrowPathIcon className="w-3 h-3 animate-spin"/> Processing</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 flex items-center gap-1"><ClockIcon className="w-3 h-3"/> {status}</span>;
    }
  };

  const Toggle = ({ enabled, onChange, label }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
        <span className="text-sm font-bold text-gray-600">{label}</span>
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
        >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
  );

  if (loading && withdrawals.length === 0) {
    return (
      <div className="p-6 h-full">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="mb-6 flex gap-4">
           <Skeleton className="h-10 w-40" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                   {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <th key={i} className="px-6 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
                   ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((row) => (
                  <tr key={row}>
                    {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                      <td key={col} className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 lg:p-12 space-y-10">
      
      {/* ─── Premium Header ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
                 <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              Withdrawal Hub
           </h1>
           <p className="text-slate-500 mt-2 font-medium">Manage user payouts, tiered fees, and government tax compliance.</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-1">
           <button 
             onClick={() => setActiveTab('requests')}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'requests' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}>
              <ListBulletIcon className="h-5 w-5" /> 
              Pending Requests
           </button>
           <button 
             onClick={() => setActiveTab('settings')}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Cog6ToothIcon className="h-5 w-5" /> 
              Fees & Quotas
           </button>
        </div>
      </div>

      {activeTab === 'requests' && (
        <div className="space-y-6 mb-10">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <BuildingLibraryIcon className="h-6 w-6 text-indigo-600" />
                    Regulatory Tax Hub
                </h2>
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    {['day', 'month', 'year'].map(p => (
                        <button
                            key={p}
                            onClick={() => setTaxStatsPeriod(p)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                taxStatsPeriod === p 
                                ? "bg-slate-900 text-white shadow-lg" 
                                : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 group-hover:scale-110 transition-transform">
                        <BanknotesIcon className="h-20 w-20 text-white" />
                    </div>
                    <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">Net Platform Profit</p>
                    <p className="text-3xl font-black">₦{(taxStats.netGain || 0).toLocaleString()}</p>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-indigo-200">Processing Earnings ({taxStatsPeriod})</span>
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 group hover:border-indigo-200 transition-all">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Value Added Tax (VAT)</p>
                    <p className="text-3xl font-black text-slate-900">₦{(taxStats.totalVat || 0).toLocaleString()}</p>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] font-bold">
                       <span className="text-slate-400 uppercase tracking-tight">7.5% Accrued</span>
                       <span className="text-indigo-600">Remittable</span>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 group hover:border-amber-200 transition-all">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Stamp Duty</p>
                    <p className="text-3xl font-black text-slate-900">₦{(taxStats.totalStampDuty || 0).toLocaleString()}</p>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] font-bold text-slate-400">
                       <span className="uppercase tracking-tight">CBN Compliance</span>
                       <span className="text-amber-600">Regulatory</span>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 group hover:border-rose-200 transition-all">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Fee Absorption</p>
                    <p className="text-3xl font-black text-rose-600">₦{(taxStats.totalAbsorptionCost || 0).toLocaleString()}</p>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{taxStats.freeCount || 0} Free Sessions</span>
                       <ClockIcon className="h-4 w-4 text-rose-400" />
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'requests' ? (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="relative flex-1 max-w-sm">
                      <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-80 pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-slate-700 text-sm outline-none appearance-none"
                      >
                          <option value="all">All Withdrawals</option>
                          <option value="pending">Pending Only</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed (Paid)</option>
                          <option value="failed">Failed/Reversed</option>
                      </select>
                      <div className="absolute inset-y-0 right-10 flex items-center px-4 pointer-events-none text-slate-400">
                         <ClockIcon className="h-5 w-5" />
                      </div>
                   </div>
                   <button onClick={fetchWithdrawals} className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition shadow-sm">
                      <ArrowPathIcon className={`h-5 w-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                   </button>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 px-4 rounded-2xl shadow-sm border border-gray-100">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <input 
                        type="date" 
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="text-sm font-bold text-gray-700 border-none focus:ring-0 cursor-pointer"
                    />
                    <span className="text-gray-300 font-bold">to</span>
                    <input 
                        type="date" 
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="text-sm font-bold text-gray-700 border-none focus:ring-0 cursor-pointer"
                    />
                </div>
            </div>

            {withdrawals.length === 0 && !loading ? (
                <EmptyState title="No withdrawals found" description="There are no withdrawal requests matching your criteria." />
            ) : (
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-slate-50/50">
                            <tr>
                            <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                            <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                            <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Cost</th>
                            <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Bank Details</th>
                            <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                            <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                            <th className="px-8 py-5 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {withdrawals.map((withdrawal) => (
                            <tr key={withdrawal._id} className="group hover:bg-indigo-50/30 transition-colors">
                                <td className="px-8 py-6">
                                <div className="text-sm font-black text-slate-900">{withdrawal.userId?.fullName || 'Unknown User'}</div>
                                <div className="text-[11px] text-slate-400 font-bold mt-0.5">{withdrawal.userId?.email}</div>
                                <div className="mt-1.5"><span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg uppercase">{withdrawal.userId?.userType}</span></div>
                                </td>
                                <td className="px-8 py-6">
                                <div className="text-base font-black text-slate-900">₦{withdrawal.amount?.toLocaleString()}</div>
                                {withdrawal.isFree && (
                                    <div className="mt-1"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-lg uppercase tracking-wider">Free Transfer</span></div>
                                )}
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-sm font-bold text-slate-700">₦{withdrawal.payscribeCost || '—'}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Service Fee</div>
                                </td>
                                <td className="px-8 py-6">
                                <div className="text-sm font-bold text-slate-700">{withdrawal.bankName}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{withdrawal.bankAccountNumber}</div>
                                <div className="text-[10px] font-black text-indigo-600 uppercase mt-1 tracking-tight">{withdrawal.accountName}</div>
                                </td>
                                <td className="px-8 py-6">
                                <code className="text-[11px] bg-slate-100 px-2.5 py-1.5 rounded-xl font-bold text-slate-500 border border-slate-200">{withdrawal.transferReference || 'N/A'}</code>
                                </td>
                                <td className="px-8 py-6">
                                {getStatusBadge(withdrawal.status)}
                                {withdrawal.failureReason && (
                                    <div className="text-[10px] font-bold text-rose-500 mt-2 max-w-[150px] truncate" title={withdrawal.failureReason}>
                                        {withdrawal.failureReason}
                                    </div>
                                )}
                                </td>
                                <td className="px-8 py-6 text-xs font-bold text-slate-400">
                                {new Date(withdrawal.createdAt).toLocaleString()}
                                </td>
                                <td className="px-8 py-6 text-center">
                                {(withdrawal.status === 'processing' || withdrawal.status === 'pending') && (
                                    <button
                                        onClick={() => handleVerifyStatus(withdrawal._id)}
                                        disabled={verifyingId === withdrawal._id}
                                        className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white text-[11px] font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {verifyingId === withdrawal._id ? (
                                            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin mr-2" />
                                        ) : (
                                            <ShieldCheckIcon className="w-3.5 h-3.5 mr-2" />
                                        )}
                                        {verifyingId === withdrawal._id ? 'Checking...' : 'Verify Trace'}
                                    </button>
                                )}
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* LEFT: Configuration Forms */}
            <div className="xl:col-span-8 space-y-10">
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden">
                    <div className="p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Fee Architecture</h2>
                            <p className="text-indigo-100/80 text-sm mt-1 font-medium">Configure tiered fees and mandatory taxes.</p>
                        </div>
                        <button 
                            onClick={saveSettings} 
                            disabled={savingSettings}
                            className="bg-white text-indigo-700 px-8 py-3.5 rounded-2xl text-[13px] font-black shadow-2xl hover:bg-indigo-50 active:scale-95 transition-all flex items-center gap-2"
                        >
                            {savingSettings ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CurrencyDollarIcon className="h-5 w-5" />}
                            Apply Changes
                        </button>
                    </div>

                    <div className="p-10 space-y-10">
                        {settings ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <ValidatedInput label="VAT (%)" value={settings.vatPercent} onChange={v => setSettings(s => ({ ...s, vatPercent: v }))} type="number" step="0.1" className="font-black text-lg bg-indigo-50/30 border-indigo-100" />
                                    <ValidatedInput label="Stamp Threshold (₦)" value={settings.stampDutyThreshold} onChange={v => setSettings(s => ({ ...s, stampDutyThreshold: v }))} isCurrency={true} className="font-black text-lg" />
                                    <ValidatedInput label="Stamp Amount (₦)" value={settings.stampDutyAmount} onChange={v => setSettings(s => ({ ...s, stampDutyAmount: v }))} isCurrency={true} className="font-black text-lg" />
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 rounded-xl"><BanknotesIcon className="h-5 w-5 text-slate-500" /></div>
                                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">CBN Tiered Thresholds</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limits</p>
                                            <ValidatedInput label="Tier 1 Limit (₦)" value={settings.tier1Limit} onChange={v => setSettings(s => ({ ...s, tier1Limit: v }))} isCurrency={true} className="font-bold" />
                                            <ValidatedInput label="Tier 2 Limit (₦)" value={settings.tier2Limit} onChange={v => setSettings(s => ({ ...s, tier2Limit: v }))} isCurrency={true} className="font-bold" />
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fees</p>
                                            <ValidatedInput label="Tier 1 Fee (₦)" value={settings.tier1Fee} onChange={v => setSettings(s => ({ ...s, tier1Fee: v }))} isCurrency={true} className="font-bold" />
                                            <ValidatedInput label="Tier 2 Fee (₦)" value={settings.tier2Fee} onChange={v => setSettings(s => ({ ...s, tier2Fee: v }))} isCurrency={true} className="font-bold" />
                                            <ValidatedInput label="Tier 3 Fee (₦)" value={settings.tier3Fee} onChange={v => setSettings(s => ({ ...s, tier3Fee: v }))} isCurrency={true} className="font-bold" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 rounded-xl"><UserGroupIcon className="h-5 w-5 text-slate-500" /></div>
                                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Free Withdrawal Governance</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-6 bg-white rounded-3xl border border-slate-100 space-y-6 shadow-sm">
                                            <Toggle enabled={settings.freeWithdrawalsEnabled} onChange={v => setSettings(s => ({ ...s, freeWithdrawalsEnabled: v }))} label="Enable Daily Free Quota" />
                                            <ValidatedInput label="Free Limit Per Day" value={settings.freeWithdrawalsPerDay} onChange={v => setSettings(s => ({ ...s, freeWithdrawalsPerDay: v }))} type="number" className="font-bold" />
                                            <ValidatedInput label="Rider Free Limit" value={settings.riderFreeWithdrawalsPerDay} onChange={v => setSettings(s => ({ ...s, riderFreeWithdrawalsPerDay: v }))} type="number" className="font-bold" />
                                            <ValidatedInput label="Min Withdrawal (₦)" value={settings.minimumWithdrawalAmount} onChange={v => setSettings(s => ({ ...s, minimumWithdrawalAmount: v }))} isCurrency={true} className="font-bold" />
                                        </div>
                                        <div className="p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100 space-y-2">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Grant Waivers (Model A)</p>
                                            <Toggle enabled={settings.freeWithdrawalWaiveBaseFee} onChange={v => setSettings(s => ({ ...s, freeWithdrawalWaiveBaseFee: v }))} label="Waive Processing Fee" />
                                            <Toggle enabled={settings.freeWithdrawalWaiveVat} onChange={v => setSettings(s => ({ ...s, freeWithdrawalWaiveVat: v }))} label="Waive VAT" />
                                            <Toggle enabled={settings.freeWithdrawalWaiveStampDuty} onChange={v => setSettings(s => ({ ...s, freeWithdrawalWaiveStampDuty: v }))} label="Waive Stamp Duty (Tax)" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-slate-400 animate-pulse font-black text-lg">Initializing Control Center...</div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: Live Prediction Hub */}
            <div className="xl:col-span-4 space-y-8">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white sticky top-12">
                   <div className="flex items-center justify-between mb-8">
                      <div className="p-2.5 bg-emerald-100 rounded-xl"><ArrowTrendingUpIcon className="h-6 w-6 text-emerald-600" /></div>
                      <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">Live Simulator</span>
                   </div>

                   <div className="space-y-6">
                      <ValidatedInput 
                        label="Predictive Amount (₦)" 
                        value={simAmount} 
                        onChange={v => setSimAmount(v)} 
                        isCurrency={true} 
                        className="font-black text-2xl text-slate-900 border-none bg-slate-50 focus:bg-slate-100 p-6 rounded-3xl"
                      />

                      {sim && (
                        <div className="mt-8 space-y-5">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">The Breakdown</p>
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-slate-500">Processing Fee</span>
                                    <span className="text-slate-900">₦{sim.base.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-slate-500">VAT (Tax)</span>
                                    <span className="text-slate-900">₦{sim.vat.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-slate-500">Stamp Duty (Regulatory)</span>
                                    <span className="text-slate-900">₦{sim.stamp.toLocaleString()}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-[11px] font-black text-slate-900 uppercase">Standard Charge</span>
                                    <span className="text-lg font-black text-slate-900">₦{sim.totalRaw.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="p-6 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-200 text-white space-y-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black text-indigo-100 tracking-widest uppercase">After Discounts (User Sees)</p>
                                    <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-black uppercase">Free Applied</span>
                                </div>
                                <div className="text-4xl font-black">₦{sim.totalWaived.toLocaleString()}</div>
                                <p className="text-xs font-medium text-indigo-100 pt-2 opacity-80">
                                    {sim.totalWaived === 0 
                                      ? "The user pays absolutely nothing for this transaction." 
                                      : `The user pays only ₦${sim.totalWaived} (Government Tax only).`}
                                </p>
                            </div>

                            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                                <InformationCircleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                                <p className="text-[11px] text-amber-800 font-bold leading-relaxed italic">
                                    Disclaimer: This matches the "OPay Model" where Stamp Duty is often mandatory even on free transfers.
                                </p>
                            </div>

                            {/* Platform Profit/Loss Breakdown */}
                            <div className="p-6 rounded-2xl border space-y-3" style={{
                                backgroundColor: sim.paidProfit >= 0 ? '#f0fdf4' : '#fef2f2',
                                borderColor: sim.paidProfit >= 0 ? '#bbf7d0' : '#fecaca'
                            }}>
                                <p className="text-[10px] font-black uppercase tracking-widest" style={{
                                    color: sim.paidProfit >= 0 ? '#15803d' : '#b91c1c'
                                }}>💰 Platform Economics</p>
                                
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-gray-500">Provider Cost (est.)</span>
                                    <span className="text-gray-700">₦{sim.estimatedProviderCost}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-gray-500">Your Base Fee</span>
                                    <span className="text-gray-700">₦{sim.base}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-[11px] font-black uppercase">Paid Transfer Profit</span>
                                    <span className={`text-lg font-black ${sim.paidProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {sim.paidProfit >= 0 ? '+' : ''}₦{sim.paidProfit}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-[11px] font-black uppercase text-rose-600">Free Transfer Cost</span>
                                    <span className={`text-lg font-black ${sim.freeAbsorption >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {sim.freeAbsorption >= 0 ? '+' : ''}₦{sim.freeAbsorption}
                                    </span>
                                </div>
                                <p className="text-[9px] text-gray-400 italic pt-1">
                                    Profit = Base Fee − Provider Cost. VAT & Stamp Duty are pass-through charges.
                                </p>
                            </div>
                        </div>
                      )}
                   </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Withdrawals;

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  WifiIcon,
  BoltIcon,
  TvIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronRightIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import ValidatedInput from "../components/ValidatedInput";
import { fetchServiceCosts, fetchPricingPreview, updatePayscribeRates, updateAdminSettings } from "../services/settingsApi";
import api from "../services/api";


const pct = (v) => `${Number(v || 0).toFixed(1)}%`;
const naira = (v) => `₦${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const THEME_COLORS = {
  violet: { active: "bg-violet-700 shadow-violet-400/30 shadow-2xl scale-[1.05] z-10 text-white", inactive: "bg-violet-100 text-violet-900 border-violet-200 hover:bg-violet-200", icon: "bg-violet-600 text-white", iconActive: "bg-white/20 text-white", border: "border-violet-100", badge: "bg-violet-200 text-violet-900 border-violet-300" },
  blue: { active: "bg-blue-700 shadow-blue-400/30 shadow-2xl scale-[1.05] z-10 text-white", inactive: "bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200", icon: "bg-blue-600 text-white", iconActive: "bg-white/20 text-white", border: "border-blue-100", badge: "bg-blue-200 text-blue-900 border-blue-300" },
  sky: { active: "bg-sky-700 shadow-sky-400/30 shadow-2xl scale-[1.05] z-10 text-white", inactive: "bg-sky-100 text-sky-900 border-sky-200 hover:bg-sky-200", icon: "bg-sky-600 text-white", iconActive: "bg-white/20 text-white", border: "border-sky-100", badge: "bg-sky-200 text-sky-900 border-sky-300" },
  amber: { active: "bg-amber-700 shadow-amber-400/30 shadow-2xl scale-[1.05] z-10 text-white", inactive: "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200", icon: "bg-amber-600 text-white", iconActive: "bg-white/20 text-white", border: "border-amber-100", badge: "bg-amber-200 text-amber-900 border-amber-300" },
  emerald: { active: "bg-emerald-700 shadow-emerald-400/30 shadow-2xl scale-[1.05] z-10 text-white", inactive: "bg-emerald-100 text-emerald-900 border-emerald-200 hover:bg-emerald-200", icon: "bg-emerald-600 text-white", iconActive: "bg-white/20 text-white", border: "border-emerald-100", badge: "bg-emerald-200 text-emerald-900 border-emerald-300" },
  indigo: { active: "bg-indigo-700 shadow-indigo-400/30 shadow-2xl scale-[1.05] z-10 text-white", inactive: "bg-indigo-100 text-indigo-900 border-indigo-200 hover:bg-indigo-200", icon: "bg-indigo-600 text-white", iconActive: "bg-white/20 text-white", border: "border-indigo-100", badge: "bg-indigo-200 text-indigo-900 border-indigo-300" },
};

const NetBadge = ({ value, label, isCard = false, active = false }) => {
  const n = Number(value);
  const baseClasses = "inline-flex items-center gap-1 text-[11px] font-black px-3 py-1 rounded-full border shadow-sm";
  
  if (n > 0) {
      const colors = isCard && active 
          ? "bg-white/20 text-white border-white/30" 
          : "text-emerald-700 bg-emerald-100 border-emerald-300";
      return (
        <span className={`${baseClasses} ${colors}`}>
          <ArrowTrendingUpIcon className="h-3 w-3" /> +{naira(n)} {label || "PROFIT"}
        </span>
      );
  }
  if (n < 0) {
      const colors = isCard && active
          ? "bg-white/20 text-white border-white/30"
          : "text-rose-700 bg-rose-100 border-rose-300";
      return (
        <span className={`${baseClasses} ${colors}`}>
          <ArrowTrendingDownIcon className="h-3 w-3" /> {naira(n)} {label || "LOSS"}
        </span>
      );
  }
  return <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">BREAK-EVEN</span>;
};

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/20 shadow-xl ${className}`}>
    {children}
  </div>
);

const SERVICE_META = [
  { key: "airtime", label: "Airtime", icon: DevicePhoneMobileIcon, color: "violet", advantage: true, refLabel: "per ₦1,000" },
  { key: "data", label: "Data", icon: WifiIcon, color: "blue", advantage: true, refLabel: "per plan" },
  { key: "cable", label: "Cable TV", icon: TvIcon, color: "sky", advantage: false, refLabel: "per sub" },
  { key: "electricity", label: "Electricity", icon: BoltIcon, color: "amber", advantage: false, refLabel: "per ₦5,000" },
  { key: "betting", label: "Betting", icon: CurrencyDollarIcon, color: "emerald", advantage: false, refLabel: "per ₦1,000" },
];

export default function ServiceCosts() {
  const [costData, setCostData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("airtime");
  const [activeNetworkTab, setActiveNetworkTab] = useState("mtn");
  const [editRates, setEditRates] = useState(null);
  const [savingRates, setSavingRates] = useState(false);
  const [editPricing, setEditPricing] = useState(null);
  const [savingPricing, setSavingPricing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [data, statsRes] = await Promise.all([
        fetchServiceCosts(),
        api.get(`/dashboard/order-stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
      ]);
      setCostData(data);
      setStats(statsRes.data);
      if (data?.payscribeRates) {
        setEditRates({
          airtime: { ...data.payscribeRates.airtime },
          cable: { ...data.payscribeRates.cable },
          electricity: { ...data.payscribeRates.electricity },
          betting: { ...data.payscribeRates.betting },
          kyc: { ...data.payscribeRates.kyc },
        });
      }
      if (data?.pricingControls) {
        setEditPricing({ 
          ...data.pricingControls
        });
      }
    } catch {
      toast.error("Failed to load service costs.");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const loadPreview = useCallback(async () => {
    try {
      setPreviewLoading(true);
      const data = await fetchPricingPreview();
      setPreview(data?.preview || null);
    } catch {
      toast.error("Failed to load live rates.");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); loadPreview(); }, [loadData, loadPreview]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  const saveRates = async () => {
    try {
      setSavingRates(true);
      const res = await updatePayscribeRates({ forceSync: true });
      if (res?.success) {
        toast.success(res.changes ? "Vendor rates refreshed with changes!" : "Vendor rates are already up to date.");
      } else {
        toast.error("Manual refresh failed. Please check logs.");
      }
      await loadData();
    } catch {
      toast.error("Failed to refresh rates from Payscribe.");
    } finally {
      setSavingRates(false);
    }
  };

  const savePricing = async () => {
    try {
      setSavingPricing(true);
      const payload = { pricingControls: editPricing };
      
      await updateAdminSettings(payload);
      toast.success("Pricing controls updated!");
      await Promise.all([loadData(), loadPreview()]);
    } catch {
      toast.error("Failed to save pricing.");
    } finally {
      setSavingPricing(false);
    }
  };

  const calculateProfit = (service) => {
    if (!editPricing || !rates || !costData) return { profit: 0, userPrice: 0, adminCost: 0, marketStandardPrice: 0, userSavings: 0 };
    
    let result = { profit: 0, userPrice: 0, adminCost: 0, protectionActive: false };

    if (service === "airtime") {
      const comm = rates.airtime?.[activeNetworkTab] || 2;
      const markup = Number(editPricing.airtimePercent || 0);
      const fixed = Number(editPricing.airtimeFixed || 0);
      const bill = Number(editPricing.airtimeBillFee || 0);
      
      const vendorCommission = 1000 * (comm / 100);
      const adminCost = 1000 - vendorCommission;
      let adjustment = (1000 * (markup / 100)) + fixed + bill;
      const initialProfit = adjustment + vendorCommission;
      const threshold = Number(editPricing.minAirtimeProfit || 20);
      const protectionActive = initialProfit < threshold && editPricing.airtimeEnforceBreakEven !== false;
      
      if (protectionActive) {
          adjustment = threshold - vendorCommission;
      }

      let userPrice = 1000 + adjustment;
      userPrice = Math.ceil(userPrice / 5) * 5;

      const marketMarkup = Number(editPricing.airtimeMarketStandardPercent || 2);
      const marketStandardPrice = Math.round(1000 * (1 + marketMarkup / 100));

      result = {
        profit: userPrice - adminCost,
        userPrice,
        adminCost,
        protectionActive,
        marketStandardPrice
      };
    }
    
    else if (service === "data") {
      const markup = Number(editPricing.dataPercent || 0);
      const fixed = Number(editPricing.dataFixed || 0);
      const bill = Number(editPricing.dataBillFee || 30);
      const adminCost = 1000;
      let profit = (1000 * (markup / 100)) + fixed + bill;
      const threshold = Number(editPricing.minDataProfit || 100);
      const protectionActive = profit < threshold && editPricing.dataEnforceBreakEven !== false;
      
      if (protectionActive) {
          profit = threshold;
      }

      let userPrice = adminCost + profit;
      userPrice = Math.ceil(userPrice / 5) * 5;

      const marketMarkup = Number(editPricing.dataMarketStandardPercent || 3);
      const marketStandardPrice = Math.round(1000 * (1 + marketMarkup / 100));

      result = {
        profit: userPrice - adminCost,
        userPrice,
        adminCost,
        protectionActive,
        marketStandardPrice
      };
    }

    else if (service === "cable") {
      const comm = rates.cable?.[activeNetworkTab] || 1.3;
      const fixed = Number(editPricing.cableFixed || 10);
      const bill = Number(editPricing.cableBillFee || 30);
      const markup = Number(editPricing.cablePercent || 1.5);
      const vendorCommission = 5000 * (comm / 100);
      const adminCost = 5000 - vendorCommission;
      let adjustment = (5000 * (markup / 100)) + fixed + bill;
      const initialProfit = adjustment + vendorCommission;
      const threshold = Number(editPricing.minCableProfit || 0);
      const protectionActive = initialProfit < threshold && editPricing.cableEnforceBreakEven !== false;

      if (protectionActive) {
          adjustment = threshold - vendorCommission;
      }

      let userPrice = 5000 + adjustment;
      userPrice = Math.ceil(userPrice / 1) * 1;

      const marketMarkup = Number(editPricing.cableMarketStandardFixed || 100);
      const marketStandardPrice = 5000 + marketMarkup;

      result = { 
        profit: userPrice - adminCost, 
        userPrice,
        adminCost,
        protectionActive,
        marketStandardPrice
      };
    }

    else if (service === "electricity") {
      const comm = rates.electricity?.[activeNetworkTab] || 0.6;
      const markup = Number(editPricing.electricityPercent || 0);
      const fixed = Number(editPricing.electricityFixed || 10);
      const bill = Number(editPricing.electricityBillFee || 30);
      const vendorCommission = 5000 * (comm / 100);
      const adminCost = 5000 - vendorCommission;
      let adjustment = (5000 * (markup / 100)) + fixed + bill;
      const initialProfit = adjustment + vendorCommission;
      const threshold = Number(editPricing.minElectricityProfit || 0);
      const protectionActive = initialProfit < threshold && editPricing.electricityEnforceBreakEven !== false;

      if (protectionActive) {
          adjustment = threshold - vendorCommission;
      }

      let userPrice = 5000 + adjustment;
      userPrice = Math.ceil(userPrice / 1) * 1;

      const marketMarkup = Number(editPricing.electricityMarketStandardFixed || 100);
      const marketStandardPrice = 5000 + marketMarkup;

      result = { 
        profit: userPrice - adminCost, 
        userPrice,
        adminCost,
        protectionActive,
        marketStandardPrice
      };
    }

    else if (service === "betting") {
      const pData = (preview?.betting || []).find(p => p.id === activeNetworkTab);
      const comm = pData ? pData.commission : (rates.betting?.[activeNetworkTab] || 0.1);
      
      const markup = Number(editPricing.bettingPercent || 0);
      const fixed = Number(editPricing.bettingFixed || 10);
      const bill = Number(editPricing.bettingBillFee || 30);
      const vendorCommission = 1000 * (comm / 100);
      let adjustment = (1000 * (markup / 100)) + fixed + bill;
      const initialProfit = adjustment + vendorCommission;
      const threshold = Number(editPricing.minBettingProfit || 0);
      const protectionActive = initialProfit < threshold && editPricing.bettingEnforceBreakEven !== false;

      if (protectionActive) {
          adjustment = threshold - vendorCommission;
      }

      let userPrice = 1000 + adjustment;
      userPrice = Math.ceil(userPrice / 1) * 1;

      const marketMarkup = Number(editPricing.bettingMarketStandardFixed || 50);
      const marketStandardPrice = 1000 + marketMarkup;

      result = { 
        profit: userPrice - (1000 - vendorCommission), 
        userPrice, 
        adminCost: 1000 - vendorCommission,
        protectionActive,
        marketStandardPrice
      };
    }
    
    result.userSavings = Math.max(0, result.marketStandardPrice - result.userPrice);
    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-400 animate-pulse text-lg font-bold">Loading Service Costs...</div>
      </div>
    );
  }

  const summary = costData?.summary || {};
  const rates = editRates || {};
  const projection = calculateProfit(activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 font-sans bg-gray-50/30">
      
      {/* ─── Premium Header & Revenue Snapshot ─── */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
                        <CurrencyDollarIcon className="h-8 w-8 text-white" />
                    </div>
                    Financial Hub
                </h1>
                <p className="text-gray-500 font-medium mt-2">Configure pricing and monitor service-specific margins.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
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
                <div className="flex items-center gap-3">
                    <button onClick={() => loadData()}
                      className="flex items-center gap-2.5 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[13px] font-black text-slate-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                      <ArrowPathIcon className="h-4.5 w-4.5" /> Refresh
                    </button>
                    <button onClick={saveRates} disabled={savingRates}
                      className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[13px] font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2">
                      {savingRates ? <ArrowPathIcon className="h-4.5 w-4.5 animate-spin" /> : <ArrowPathIcon className="h-4.5 w-4.5" />}
                      Sync
                    </button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200/50">
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">Total Utility Margin</p>
                <p className="text-3xl font-black">{formatCurrency(stats?.breakdown?.services?.total || 0)}</p>
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-indigo-200">Selected Period</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-tighter text-white">Live</span>
                </div>
            </div>

            {['airtime', 'data', 'cable'].map((svc) => (
                <div key={svc} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{svc} Profit</p>
                    <p className="text-3xl font-black text-gray-900">{formatCurrency(stats?.breakdown?.services?.byService?.[svc] || 0)}</p>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Margin Share</span>
                        <span className="text-indigo-600 font-black text-xs">
                            {stats?.breakdown?.services?.total > 0 
                                ? `${Math.round(((stats.breakdown.services.byService[svc] || 0) / stats.breakdown.services.total) * 100)}%` 
                                : '0%'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* ─── Service Selection Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        {SERVICE_META.map(svc => {
          const s = summary[svc.key] || {};
          let avgNet = null;

          if (svc.key === "airtime") {
            const nets = s.networks || [];
            avgNet = nets.length ? Math.round(nets.reduce((a, n) => a + n.netPosition, 0) / nets.length) : null;
          } else if (svc.key === "electricity") {
            const discos = s.discos || [];
            avgNet = discos.length ? Math.round(discos.reduce((a, d) => a + d.netPosition, 0) / discos.length) : null;
          } else if (svc.key === "cable") {
            avgNet = s.ourRevenue || 50;
          } else if (svc.key === "betting") {
            const plats = s.platforms || [];
            avgNet = plats.length ? Math.round(plats.reduce((a, p) => a + p.netPosition, 0) / plats.length) : null;
          }

          const isActive = activeTab === svc.key;
          const theme = THEME_COLORS[svc.color];

          return (
            <div key={svc.key}
              onClick={() => { 
                  setActiveTab(svc.key); 
                  if (svc.key === "data") setActiveNetworkTab("mtn"); 
                  if (svc.key === "cable") setActiveNetworkTab("dstv");
                  if (svc.key === "electricity") setActiveNetworkTab("ikedc");
                  if (svc.key === "betting") setActiveNetworkTab("bet9ja");
              }}
              className={`relative group rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 overflow-hidden border-2
                ${isActive ? `${theme.active} border-transparent` : `${theme.inactive} border-white shadow-xl shadow-slate-200/50 hover:-translate-y-2`}`}>
              
              <div className={`inline-flex p-3 rounded-2xl mb-5 transition-transform group-hover:scale-110 shadow-sm
                ${isActive ? theme.iconActive : theme.icon}`}>
                <svc.icon className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${isActive ? "text-white/80" : "text-slate-400"}`}>{svc.label}</p>
                <h3 className={`text-xl font-black ${isActive ? "text-white" : "text-slate-900"}`}>Config</h3>
              </div>

              <div className="mt-8 flex items-center justify-between">
                {avgNet !== null ? (
                  <NetBadge value={avgNet} label={svc.refLabel} isCard={true} active={isActive} />
                ) : (
                  <div className={`text-[10px] font-black tracking-widest ${isActive ? "text-white/60" : "text-slate-400"}`}>MANAGE ➔</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Integrated Management Hub ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 mt-10">
        
        {/* LEFT: Management Form (4 cols) */}
        <div className="xl:col-span-4 space-y-8">
           <GlassCard className="border-indigo-100 shadow-2xl overflow-hidden !p-0">
              <div className="p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
                 <h2 className="text-2xl font-black tracking-tight">Pricing Engine</h2>
                 <p className="text-indigo-100/80 text-sm mt-2 font-medium">Fine-tune fees for {activeTab.toUpperCase()}. Changes apply instantly.</p>
              </div>
              
              <div className="p-8 space-y-8">
                 {editPricing && (
                    <div className="space-y-6">
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">The 3-Fee Model</p>
                          <div className="space-y-5">
                                    <ValidatedInput
                                       label={`Markup (%) — Extra ${activeTab === 'data' ? 'on Cost' : 'Profit'}`}
                                       value={editPricing[`${activeTab}Percent`] ?? 0}
                                       onChange={val => setEditPricing(p => ({ ...p, [`${activeTab}Percent`]: val }))}
                                       allowNegative={true}
                                       type="number"
                                       step="0.1"
                                       className="font-black text-lg"
                                    />
                                    
                                    <ValidatedInput
                                       label="Processing Fee (Fixed ₦)"
                                       value={editPricing[`${activeTab}Fixed`] ?? 0}
                                       onChange={val => setEditPricing(p => ({ ...p, [`${activeTab}Fixed`]: val }))}
                                       isCurrency={true}
                                       className="font-black text-lg"
                                    />
                                    
                                    <ValidatedInput
                                       label="Bill Service Charge (Fixed ₦)"
                                       value={editPricing[`${activeTab}BillFee`] ?? 0}
                                       onChange={val => setEditPricing(p => ({ ...p, [`${activeTab}BillFee`]: val }))}
                                       isCurrency={true}
                                       className="font-black text-lg text-indigo-600 bg-indigo-50/50"
                                    />

                                    <ValidatedInput
                                       label="Minimum Profit Floor (₦)"
                                       value={editPricing[`min${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}Profit`] ?? (activeTab === 'data' ? 100 : (activeTab === 'airtime' ? 20 : 50))}
                                       onChange={val => setEditPricing(p => ({ ...p, [`min${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}Profit`]: val }))}
                                       isCurrency={true}
                                       className="font-black text-lg border-amber-200 bg-amber-50/20"
                                       helperText="Mandatory threshold for break-even protection"
                                    />
                           </div>
                       </div>

                       {/* Profit Simulator */}
                       <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 shadow-inner">
                          <div className="flex items-center justify-between mb-6">
                             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                                <ArrowTrendingUpIcon className="h-4 w-4" /> Live Profit Simulator
                             </p>
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400">
                                   Example {projection.userPrice >= 5000 ? "₦5,000" : "₦1,000"} Trans
                                </span>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Vendor Cost</p>
                                <p className="text-lg font-black text-slate-600">{naira(projection.adminCost)}</p>
                             </div>
                             <div className="space-y-1 text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">User Price</p>
                                <p className="text-xl font-black text-slate-900 leading-none">{naira(projection.userPrice)}</p>
                             </div>
                             
                             <div className="col-span-2 pt-4 border-t border-emerald-100 mt-1 pb-2">
                                <div className="flex items-center justify-between">
                                   <div className="flex flex-col">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">Market Standard</p>
                                      <p className="text-sm font-black text-slate-500 line-through opacity-60">{naira(projection.marketStandardPrice)}</p>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">Market Advantage</p>
                                      <p className="text-lg font-black text-emerald-600">-{naira(projection.userSavings)} SAVED</p>
                                   </div>
                                </div>
                             </div>

                             <div className="col-span-2 pt-4 border-t border-emerald-200 mt-2 bg-emerald-100/30 -mx-6 px-6 py-4">
                                <div className="flex items-center justify-between">
                                   <p className="text-sm font-black text-emerald-800 uppercase tracking-widest">Your Net Gain:</p>
                                   <p className="text-2xl font-black text-emerald-600">{naira(projection.profit)}</p>
                                </div>
                             </div>
                          </div>
                          
                          {projection.protectionActive && (
                             <div className="mt-6 flex items-start gap-3 p-4 bg-white/60 rounded-2xl border border-white">
                                <ShieldCheckIcon className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                                <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">
                                   "Break-even Protection" is active. The system will auto-adjust the price to ensure minimum profit.
                                </p>
                             </div>
                          )}
                       </div>

                       <div className="space-y-4">
                          <button onClick={savePricing} disabled={savingPricing}
                            className="w-full py-5 bg-indigo-600 text-white text-base font-black rounded-3xl hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-[0_20px_40px_-15px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3">
                            {savingPricing ? <ArrowPathIcon className="h-6 w-6 animate-spin" /> : <CheckCircleIcon className="h-6 w-6" />}
                            Deploy Pricing Updates
                          </button>
                          
                          <div className="flex items-center justify-center gap-4 py-2">
                             <div className="flex items-center gap-2">
                                <input type="checkbox" id="enforce" 
                                  checked={editPricing[`${activeTab}EnforceBreakEven`] ?? true}
                                  onChange={e => setEditPricing(p => ({ ...p, [`${activeTab}EnforceBreakEven`]: e.target.checked }))}
                                  className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                                <label htmlFor="enforce" className="text-xs font-bold text-slate-500">Auto-Fix Loss</label>
                             </div>
                             <div className="flex items-center gap-2">
                                <input type="checkbox" id="savings" 
                                  checked={editPricing.displaySavingsToUser}
                                  onChange={e => setEditPricing(p => ({ ...p, displaySavingsToUser: e.target.checked }))}
                                  className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                                <label htmlFor="savings" className="text-xs font-bold text-slate-500">Show "You Saved"</label>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           </GlassCard>
        </div>

        {/* RIGHT: Vendor Rates & Live Table (8 cols) */}
        <div className="xl:col-span-8 space-y-8">
           
           {/* Live monitor heading */}
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-emerald-600" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Market Live Monitor</h3>
                    <p className="text-sm text-slate-500 font-medium">Actual Payscribe costs vs Your User prices.</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-3">
                  <div className="relative group/search">
                     <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within/search:text-indigo-600 transition-colors" />
                     <input 
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-[12px] font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64 lg:w-80"
                     />
                     {searchTerm && (
                        <button onClick={() => setSearchTerm("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                           <XMarkIcon className="h-4 w-4" />
                        </button>
                     )}
                  </div>
                  <button onClick={loadPreview} disabled={previewLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[12px] font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                     <ArrowPathIcon className={`h-4 w-4 ${previewLoading ? 'animate-spin' : ''}`} />
                     {previewLoading ? 'Syncing Market...' : 'Fetch Live Rates'}
                  </button>
              </div>
           </div>

           <GlassCard className="border-slate-100 shadow-2xl overflow-hidden min-h-[600px] !p-0">
              {/* Internal Tab Switcher (Provider specific) */}
              <div className="bg-slate-50/50 border-b border-slate-100 p-6 flex items-center justify-between">
                 <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
                    {activeTab === "airtime" && ["mtn","glo","airtel","9mobile"].map(n => (
                       <button key={n} onClick={() => setActiveNetworkTab(n)}
                         className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeNetworkTab === n ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border text-slate-400 hover:text-slate-600'}`}>
                          {n} 
                          <span className="ml-2 opacity-60">({pct(rates.airtime?.[n])})</span>
                       </button>
                    ))}
                    {activeTab === "data" && ["mtn","glo","airtel","9mobile"].map(n => (
                       <button key={n} onClick={() => setActiveNetworkTab(n)}
                         className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeNetworkTab === n ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border text-slate-400 hover:text-slate-600'}`}>
                          {n}
                       </button>
                    ))}
                    {activeTab === "cable" && Object.keys(preview?.cable || {}).map(n => (
                       <button key={n} onClick={() => setActiveNetworkTab(n)}
                         className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeNetworkTab === n ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border text-slate-400 hover:text-slate-600'}`}>
                          {n}
                          <span className="ml-2 opacity-60">({pct(rates.cable?.[n])})</span>
                       </button>
                    ))}
                    {activeTab === "electricity" && (
                       <div className="flex gap-2">
                          {Object.keys(rates.electricity || {}).map(disco => (
                             <button key={disco} onClick={() => setActiveNetworkTab(disco)}
                               className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeNetworkTab === disco ? 'bg-amber-600 text-white' : 'bg-white border text-slate-400 hover:text-slate-600'}`}>
                                {disco}
                             </button>
                          ))}
                       </div>
                    )}
                    {activeTab === "betting" && (
                       <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {(preview?.betting || []).map(p => (
                             <button key={p.id} onClick={() => setActiveNetworkTab(p.id)}
                               className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeNetworkTab === p.id ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white border text-slate-400 hover:text-slate-600'}`}>
                                {p.name}
                             </button>
                          ))}
                       </div>
                    )}
                 </div>
                 
                 {activeTab === "airtime" && (
                    <div className="hidden lg:block">
                       <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                          BEST CHOICE: GLO at 4.0%
                       </p>
                    </div>
                 )}
              </div>

              <div className="p-8">
                 {previewLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                       <ArrowPathIcon className="h-12 w-12 text-slate-200 animate-spin" />
                       <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Fetching Live Vendor Rates...</p>
                    </div>
                 ) : !preview ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6">
                       <div className="p-6 bg-slate-50 rounded-full">
                          <ClipboardDocumentListIcon className="h-16 w-16 text-slate-300" />
                       </div>
                       <p className="text-slate-400 font-black text-center max-w-xs uppercase tracking-widest text-xs leading-loose">
                          Data is currently idle. <br/> Click "Fetch Live Rates" to see real marketplace performance.
                       </p>
                    </div>
                 ) : (
                    <div className="overflow-x-auto">
                       <table className="w-full text-left font-sans">
                          <thead>
                             <tr className="border-b border-slate-100">
                                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan / Tier</th>
                                <th className="pb-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission</th>
                                <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest text-indigo-500">Admin Cost</th>
                                <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">User Price</th>
                                <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Our Gain</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {/* AIRTIME */}
                             {activeTab === "airtime" && (preview?.airtime || []).filter(r => r.name.toLowerCase() === activeNetworkTab && (!searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.commissionLabel.toLowerCase().includes(searchTerm.toLowerCase()))).map((row, i) => (
                                <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                   <td className="py-5">
                                      <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase">{row.name}</p>
                                      {row.breakEvenEnforced && <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tight">Protection Enabled</span>}
                                   </td>
                                   <td className="py-5 text-center">
                                      <span className="text-[11px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{row.commissionLabel}</span>
                                   </td>
                                   <td className="py-5 text-right font-bold text-slate-500">{naira(row.adminCost)}</td>
                                   <td className="py-5 text-right font-black text-slate-900 text-base">{naira(row.systemPrice)}</td>
                                   <td className="py-5 text-right"><NetBadge value={row.netPosition} /></td>
                                </tr>
                             ))}
                             
                             {/* DATA */}
                             {activeTab === "data" && (preview?.data?.[activeNetworkTab] || []).filter(p => !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || String(p.systemPrice).includes(searchTerm) || String(p.payscribeCost).includes(searchTerm)).map((plan, i) => (
                                <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                   <td className="py-5">
                                      <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{plan.name}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{plan.validity}</p>
                                   </td>
                                   <td className="py-5 text-center">
                                      <span className="text-[10px] font-bold text-slate-300">N/A</span>
                                   </td>
                                   <td className="py-5 text-right font-bold text-slate-500">{naira(plan.payscribeCost)}</td>
                                   <td className="py-5 text-right font-black text-slate-900 text-base">{naira(plan.systemPrice)}</td>
                                   <td className="py-5 text-right"><NetBadge value={plan.netPosition} /></td>
                                </tr>
                             ))}

                             {/* CABLE */}
                             {activeTab === "cable" && (preview?.cable?.[activeNetworkTab] || []).filter(b => !searchTerm || b.name?.toLowerCase().includes(searchTerm.toLowerCase()) || String(b.userPrice).includes(searchTerm)).map((plan, i) => (
                                <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                   <td className="py-5">
                                      <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{plan.name}</p>
                                   </td>
                                   <td className="py-5 text-center">
                                      <span className="text-[11px] font-black bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">{pct(rates.cable?.[activeNetworkTab])}</span>
                                   </td>
                                   <td className="py-5 text-right font-bold text-slate-500">{naira(plan.adminCost)}</td>
                                   <td className="py-5 text-right font-black text-slate-900 text-base">{naira(plan.userPrice)}</td>
                                   <td className="py-5 text-right"><NetBadge value={plan.netPosition} /></td>
                                </tr>
                             ))}

                             {/* ELECTRICITY */}
                             {activeTab === "electricity" && (preview?.power || []).filter(d => d.discoCode.toLowerCase() === activeNetworkTab.toLowerCase() && (!searchTerm || d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.discoCode.toLowerCase().includes(searchTerm.toLowerCase()))).map((disco, i) => (
                                <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                   <td className="py-5">
                                      <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{disco.name}</p>
                                   </td>
                                   <td className="py-5 text-center">
                                      <span className="text-[11px] font-black bg-amber-50 text-amber-700 px-3 py-1 rounded-full">{pct(rates.electricity?.[activeNetworkTab])}</span>
                                   </td>
                                   <td className="py-5 text-right font-bold text-slate-500">{naira(disco.adminCost)}</td>
                                   <td className="py-5 text-right font-black text-slate-900 text-base">{naira(disco.userPrice)}</td>
                                   <td className="py-5 text-right"><NetBadge value={disco.netPosition} /></td>
                                </tr>
                             ))}
                             
                             {/* BETTING */}
                             {activeTab === "betting" && (preview?.betting || []).filter(p => (!searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()))).map((row, i) => (
                                <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                   <td className="py-5">
                                      <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{row.name}</p>
                                   </td>
                                   <td className="py-5 text-center">
                                      <span className="text-[11px] font-black bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">{pct(row.commission)}</span>
                                   </td>
                                   <td className="py-5 text-right font-bold text-slate-500">{naira(row.adminCost)}</td>
                                   <td className="py-5 text-right font-black text-slate-900 text-base">{naira(row.userPrice)}</td>
                                   <td className="py-5 text-right"><NetBadge value={row.netPosition} /></td>
                                </tr>
                             ))}

                             {/* EMPTY STATE */}
                             {searchTerm && (
                                 () => {
                                    let list = [];
                                    if (activeTab === "airtime") list = (preview.airtime || []).filter(r => r.name.toLowerCase() === activeNetworkTab && (!searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.commissionLabel.toLowerCase().includes(searchTerm.toLowerCase())));
                                    else if (activeTab === "data") list = (preview.data?.[activeNetworkTab] || []).filter(p => !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || String(p.systemPrice).includes(searchTerm) || String(p.payscribeCost).includes(searchTerm));
                                    else if (activeTab === "cable") list = (preview.cable?.[activeNetworkTab] || []).filter(b => !searchTerm || b.name?.toLowerCase().includes(searchTerm.toLowerCase()) || String(b.userPrice).includes(searchTerm) || String(b.adminCost).includes(searchTerm));
                                    else if (activeTab === "electricity") list = (preview.power || []).filter(d => d.discoCode.toLowerCase() === activeNetworkTab.toLowerCase() && (!searchTerm || d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.discoCode.toLowerCase().includes(searchTerm.toLowerCase())));
                                    else if (activeTab === "betting") list = (preview.betting || []).filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()));
                                    
                                    if (list.length === 0) return (
                                       <tr>
                                          <td colSpan="5" className="py-24 text-center">
                                             <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="p-4 bg-slate-50 rounded-full">
                                                   <InformationCircleIcon className="h-8 w-8 text-slate-200" />
                                                </div>
                                                <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">No results for "{searchTerm}"</p>
                                                <button onClick={() => setSearchTerm("")} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all">Clear Search</button>
                                             </div>
                                          </td>
                                       </tr>
                                    );
                                    return null;
                                 }
                             )()}
                          </tbody>
                       </table>
                    </div>
                 )}
              </div>
           </GlassCard>
        </div>
      </div>

      {/* ─── Absorbed Costs (Footer Info) ─── */}
      <GlassCard className="!bg-slate-900 text-white border-transparent mt-12">
         <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-4">
            <div className="flex items-center gap-6">
                <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                   <ShieldCheckIcon className="h-8 w-8 text-indigo-400" />
                </div>
                <div>
                   <h3 className="text-xl font-black tracking-tight">KYC Protection Pool</h3>
                   <p className="text-slate-400 text-sm mt-1 font-medium italic">These costs are 100% absorbed by 9thWaka to ensure frictionless onboarding.</p>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
               {editRates && editRates.kyc && Object.entries(editRates.kyc || {}).map(([doc, cost]) => (
                  <div key={doc} className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                      <p className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-1">{doc}</p>
                      <p className="text-lg font-black">{naira(cost)}</p>
                  </div>
               ))}
            </div>
         </div>
      </GlassCard>
    </div>
  );
}

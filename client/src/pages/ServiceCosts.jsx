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
} from "@heroicons/react/24/outline";
import { fetchServiceCosts, fetchPricingPreview, updatePayscribeRates, updateAdminSettings } from "../services/settingsApi";


const pct = (v) => `${Number(v || 0).toFixed(1)}%`;
const naira = (v) => `₦${Number(v || 0).toLocaleString()}`;

const THEME_COLORS = {
  violet: { active: "bg-violet-700 shadow-violet-400/30 shadow-2xl scale-[1.05] z-10 text-white", inactive: "bg-violet-100 text-violet-900 border-violet-200 hover:bg-violet-200", icon: "bg-violet-600 text-white", iconActive: "bg-white/20 text-white", border: "border-violet-100", badge: "bg-violet-200 text-violet-900 border-violet-300" },
  blue: { active: "bg-blue-700 shadow-blue-400/30 shadow-2xl scale-[1.05] z-10 text-white", inactive: "bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200", icon: "bg-blue-600 text-white", iconActive: "bg-white/20 text-white", border: "border-blue-100", badge: "bg-blue-200 text-blue-900 border-blue-300" },
  sky: { active: "bg-sky-700 shadow-sky-400/30 shadow-2xl scale-[1.05] z-10 text-white", inactive: "bg-sky-100 text-sky-900 border-sky-200 hover:bg-sky-200", icon: "bg-sky-600 text-white", iconActive: "bg-white/20 text-white", border: "border-sky-100", badge: "bg-sky-200 text-sky-900 border-sky-300" },
  amber: { active: "bg-amber-700 shadow-amber-400/30 shadow-2xl scale-[1.05] z-10 text-white", inactive: "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200", icon: "bg-amber-600 text-white", iconActive: "bg-white/20 text-white", border: "border-amber-100", badge: "bg-amber-200 text-amber-900 border-amber-300" },
  emerald: { active: "bg-emerald-700 shadow-emerald-400/30 shadow-2xl scale-[1.05] z-10 text-white", inactive: "bg-emerald-100 text-emerald-900 border-emerald-200 hover:bg-emerald-200", icon: "bg-emerald-600 text-white", iconActive: "bg-white/20 text-white", border: "border-emerald-100", badge: "bg-emerald-200 text-emerald-900 border-emerald-300" },
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

const WarningBadge = ({ label }) => (
  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
    <ExclamationTriangleIcon className="h-3 w-3" /> {label}
  </span>
);

const SectionHeader = ({ icon: Icon, title, subtitle, color = "indigo" }) => {
  const colorMap = {
     indigo: "text-indigo-600 border-indigo-100",
     slate: "text-slate-600 border-slate-100",
     violet: "text-violet-600 border-violet-100",
     blue: "text-blue-600 border-blue-100",
     sky: "text-sky-600 border-sky-100",
     amber: "text-amber-600 border-amber-100",
     emerald: "text-emerald-600 border-emerald-100",
  };
  return (
    <div className="flex items-start gap-4 mb-8">
      <div className={`p-3 rounded-2xl bg-white shadow-sm border ${colorMap[color] || 'border-gray-100'} flex-shrink-0`}>
        <Icon className={`h-6 w-6 ${(colorMap[color] || '').split(' ')[0]}`} />
      </div>
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-6 ${className}`}>
    {children}
  </div>
);

// ─── Service Summary Cards ─────────────────────────────────────────────────────

const SERVICE_META = [
  { key: "airtime", label: "Airtime", icon: DevicePhoneMobileIcon, color: "violet", advantage: true, refLabel: "per ₦1,000" },
  { key: "data", label: "Data", icon: WifiIcon, color: "blue", advantage: true, refLabel: "per plan" },
  { key: "cable", label: "Cable TV", icon: TvIcon, color: "sky", advantage: false, refLabel: "per sub" },
  { key: "electricity", label: "Electricity", icon: BoltIcon, color: "amber", advantage: false, refLabel: "per ₦5,000" },
  { key: "betting", label: "Betting", icon: CurrencyDollarIcon, color: "emerald", advantage: false, refLabel: "per ₦1,000" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchServiceCosts();
      setCostData(data);
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
        setEditPricing({ ...data.pricingControls });
      }
    } catch {
      toast.error("Failed to load service costs.");
    } finally {
      setLoading(false);
    }
  }, []);

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
      await updateAdminSettings({ pricingControls: editPricing });
      toast.success("Pricing controls updated!");
      await Promise.all([loadData(), loadPreview()]);
    } catch {
      toast.error("Failed to save pricing.");
    } finally {
      setSavingPricing(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">Service Costs & Profitability</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Track what Payscribe charges us vs what we earn — per service, per transaction.</p>
        </div>
        <button onClick={() => { loadData(); loadPreview(); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-black text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
          <ArrowPathIcon className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* ─── Service Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {SERVICE_META.map(svc => {
          const s = summary[svc.key] || {};
          let avgNet = null, highRisk = false;

          if (svc.key === "airtime") {
            const nets = s.networks || [];
            avgNet = nets.length ? Math.round(nets.reduce((a, n) => a + n.netPosition, 0) / nets.length) : null;
            highRisk = (s.highRiskNetworks || []).length > 0;
          } else if (svc.key === "electricity") {
            const discos = s.discos || [];
            avgNet = discos.length ? Math.round(discos.reduce((a, d) => a + d.netPosition, 0) / discos.length) : null;
            highRisk = (s.highCostDiscos || []).length > 0;
          } else if (svc.key === "cable") {
            avgNet = s.ourRevenue || 50;
          } else if (svc.key === "betting") {
            const plats = s.platforms || [];
            avgNet = plats.length ? Math.round(plats.reduce((a, p) => a + p.netPosition, 0) / plats.length) : null;
          } else if (svc.key === "data") {
            avgNet = null;
          }

          const isActive = activeTab === svc.key;
          const theme = THEME_COLORS[svc.color];

          return (
            <div key={svc.key}
              onClick={() => { setActiveTab(svc.key); if (svc.key === "data") setActiveNetworkTab("mtn"); }}
              className={`relative group rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 overflow-hidden
                ${isActive ? theme.active : `${theme.inactive} shadow-xl shadow-slate-100 hover:-translate-y-2`}`}>
              
              {isActive && <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 blur-[60px] pointer-events-none" />}

              <div className={`inline-flex p-3 rounded-2xl mb-5 transition-transform group-hover:scale-110 shadow-sm
                ${isActive ? theme.iconActive : theme.icon}`}>
                <svc.icon className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <p className={`text-[11px] font-black uppercase tracking-[0.1em] ${isActive ? "text-white/80" : "text-slate-400 group-hover:text-current"}`}>{svc.label}</p>
                {svc.advantage && (
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border shadow-sm inline-block
                      ${isActive ? "bg-white/10 text-white border-white/20" : theme.badge}`}>
                      MARKET EDGE
                    </span>
                )}
              </div>

              <div className="mt-8">
                {avgNet !== null ? (
                  <NetBadge value={avgNet} label={svc.refLabel} isCard={true} active={isActive} />
                ) : (
                  <div className={`flex items-center gap-1.5 text-[11px] font-black tracking-wider transition-all
                    ${isActive ? "text-white" : "text-slate-500 group-hover:text-current"}`}>
                    EXPLORE RATES <ArrowPathIcon className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>

              {highRisk && (
                <div className="absolute top-6 right-6 animate-bounce">
                  <ExclamationTriangleIcon className={`h-6 w-6 ${isActive ? "text-white" : "text-amber-500"}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* LEFT: Payscribe Rate Registry */}
        <div className="xl:col-span-1 space-y-8">
          <GlassCard className="border-slate-100 shadow-xl">
            <SectionHeader icon={ClipboardDocumentListIcon} title="Payscribe Rate Registry"
              subtitle="Vendor-set commission rates (Read-Only). Automatically synced every morning." color="slate" />

            <div className="space-y-5">
              {/* AIRTIME */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <DevicePhoneMobileIcon className="h-3.5 w-3.5" /> Airtime (% of face value)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {["mtn","glo","airtel","9mobile"].map(n => (
                    <div key={n} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${n === "glo" ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-gray-50"}`}>
                      <span className={`text-xs font-black uppercase ${n === "glo" ? "text-orange-700" : "text-gray-600"}`}>{n}</span>
                      <input type="number" step="0.1" min="0"
                        value={rates.airtime?.[n] ?? ""}
                        readOnly
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-emerald-600 mt-1 font-bold">💡 Higher % commission means you earn MORE (GLO is your best network).</p>
              </div>

              {/* CABLE */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <TvIcon className="h-3.5 w-3.5" /> Cable TV (% of sub value)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {["dstv","gotv","startimes"].map(p => (
                    <div key={p} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50">
                      <span className="text-xs font-black uppercase text-gray-600">{p}</span>
                      <input type="number" step="0.1" min="0"
                        value={rates.cable?.[p] ?? ""}
                        readOnly
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ELECTRICITY */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <BoltIcon className="h-3.5 w-3.5" /> Electricity Discos (% of top-up)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(rates.electricity || {}).map(disco => (
                    <div key={disco} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${Number(rates.electricity[disco]) >= 1 ? "border-rose-200 bg-rose-50" : "border-gray-100 bg-gray-50"}`}>
                      <span className={`text-xs font-black uppercase ${Number(rates.electricity[disco]) >= 1 ? "text-rose-700" : "text-gray-600"}`}>{disco}</span>
                      <input type="number" step="0.1" min="0"
                        value={rates.electricity?.[disco] ?? ""}
                        readOnly
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-rose-600 mt-1 font-bold">⚠️ ABA at 1.7% is the highest Disco.</p>
              </div>

              {/* BETTING */}
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <CurrencyDollarIcon className="h-3.5 w-3.5" /> Betting Platforms (% of stake)
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {Object.keys(rates.betting || {}).map(platform => (
                    <div key={platform} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50">
                      <span className="text-xs font-black uppercase text-gray-600">{platform}</span>
                      <input type="number" step="0.1" min="0"
                        value={rates.betting?.[platform] ?? ""}
                        readOnly
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* KYC */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <ShieldCheckIcon className="h-3.5 w-3.5" /> KYC Costs (Absorbed — Users NOT Charged)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(rates.kyc || {}).map(([doc, cost]) => (
                    <div key={doc} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-blue-100">
                      <span className="text-xs font-bold text-blue-800 uppercase">{doc}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">₦</span>
                        <input type="number" step="5" min="0"
                          value={rates.kyc?.[doc] ?? ""}
                          readOnly
                          className="w-16 text-right text-xs font-bold px-2 py-1 bg-gray-50 border border-blue-200 rounded-lg text-gray-400 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={saveRates} disabled={savingRates}
                className="w-full py-4 bg-slate-900 text-white text-sm font-black rounded-[1.25rem] hover:bg-slate-800 disabled:opacity-60 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 group">
                {savingRates ? <><ArrowPathIcon className="h-5 w-5 animate-spin" /> Syncing...</> : <><ArrowPathIcon className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" /> Sync Vendor Rates</>}
              </button>
            </div>
          </GlassCard>
        </div>

        {/* RIGHT: Pricing Controls + Live Preview */}
        <div className="xl:col-span-2 space-y-8">

          {/* Market Advantage Controls (Airtime & Data only) */}
          <GlassCard className="border-indigo-100 shadow-xl">
            <SectionHeader icon={ArrowTrendingDownIcon} title="Market Advantage"
              subtitle="Subsidize rates to win the market. Floor-protection is ALWAYS active." color="indigo" />

            {editPricing && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Airtime Controls */}
                <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                  <div className="flex items-center gap-2 mb-4">
                    <DevicePhoneMobileIcon className="h-4 w-4 text-violet-600" />
                    <span className="text-sm font-black text-violet-900">Airtime</span>
                    <span className="text-[10px] font-bold bg-violet-200 text-violet-800 px-1.5 py-0.5 rounded">Market Advantage</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Our Adjustment % (e.g. -1 for 1% subsidy)</label>
                      <div className="relative">
                        <input type="number" step="0.1"
                          value={editPricing.airtimePercent ?? 0}
                          onChange={e => setEditPricing(p => ({ ...p, airtimePercent: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg text-sm font-bold focus:ring-2 focus:outline-none ${Number(editPricing.airtimePercent) < 0 ? "border-amber-300 focus:ring-amber-400 bg-amber-50" : "border-violet-200 focus:ring-violet-400"}`} 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Service Fee (Fixed ₦)</label>
                      <input type="number" step="1"
                        value={editPricing.airtimeFixed ?? 0}
                        onChange={e => setEditPricing(p => ({ ...p, airtimeFixed: e.target.value }))}
                        className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-violet-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Bill Fee (Fixed ₦)</label>
                      <input type="number" step="1"
                        value={editPricing.airtimeBillFee ?? 10}
                        onChange={e => setEditPricing(p => ({ ...p, airtimeBillFee: e.target.value }))}
                        className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-violet-400 focus:outline-none" />
                    </div>
                    
                    <div className="p-3 bg-white border border-violet-100 rounded-lg space-y-2">
                       <p className="text-[10px] font-black text-violet-400 uppercase">Protection Monitor (Estimated per ₦1000)</p>
                       <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Admin Cost (MTN 2%):</span>
                          <span className="text-xs font-bold text-gray-700">₦980</span>
                       </div>
                       <div className="flex justify-between items-center border-t border-slate-50 pt-1">
                          <span className="text-xs text-gray-500">Your Current Price:</span>
                          <span className="text-xs font-black text-gray-900">
                             {naira(1000 + (1000 * (Number(editPricing.airtimePercent) / 100)) + Number(editPricing.airtimeFixed || 0) + Number(editPricing.airtimeBillFee || 0))}
                          </span>
                       </div>
                       
                       {/* REAL-TIME WARNING */}
                       {((1000 * (Number(editPricing.airtimePercent) / 100)) + Number(editPricing.airtimeFixed || 0) + Number(editPricing.airtimeBillFee || 0) + 20) < 20 && (
                          <div className="flex items-center gap-2 p-2 bg-amber-50 rounded border border-amber-100 mt-2">
                             <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
                             <span className="text-[10px] font-bold text-amber-800 leading-tight">
                                PROTECTION ACTIVE: Your price will be forced to ₦1,000 to ensure ₦20 profit.
                             </span>
                          </div>
                       )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="airtimeBreakEven"
                        checked={editPricing.airtimeEnforceBreakEven !== false}
                        onChange={e => setEditPricing(p => ({ ...p, airtimeEnforceBreakEven: e.target.checked }))}
                        className="h-4 w-4 text-violet-600 rounded" />
                      <label htmlFor="airtimeBreakEven" className="text-xs font-bold text-gray-700">🛡️ Keep Protection On (Block Loss)</label>
                    </div>
                  </div>
                </div>

                {/* Data Controls */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-4">
                    <WifiIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-black text-blue-900">Data</span>
                    <span className="text-[10px] font-bold bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">Market Advantage</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Our Markup % on Payscribe cost</label>
                      <input type="number" step="0.1"
                        value={editPricing.dataPercent ?? 0}
                        onChange={e => setEditPricing(p => ({ ...p, dataPercent: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg text-sm font-bold focus:ring-2 focus:outline-none ${Number(editPricing.dataPercent) < 0 ? "border-amber-300 focus:ring-amber-400 bg-amber-50" : "border-blue-200 focus:ring-blue-400"}`} 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Service Fee (Fixed ₦)</label>
                      <input type="number" step="1"
                        value={editPricing.dataFixed ?? 0}
                        onChange={e => setEditPricing(p => ({ ...p, dataFixed: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Data Bill Fee (Fixed ₦)</label>
                      <input type="number" step="1"
                        value={editPricing.dataBillFee ?? 20}
                        onChange={e => setEditPricing(p => ({ ...p, dataBillFee: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                    </div>
                    
                    {/* LIVE MONITOR FOR DATA */}
                    <div className="p-3 bg-white border border-blue-100 rounded-lg">
                       <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Profit Tracker</p>
                       <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Applied Margin:</span>
                          <span className={`text-xs font-black ${ (Number(editPricing.dataPercent || 0) + Number(editPricing.dataFixed || 0) + Number(editPricing.dataBillFee || 20)) < 20 ? "text-rose-600" : "text-emerald-600" }`}>
                             { (Number(editPricing.dataPercent || 0) + Number(editPricing.dataFixed || 0) + Number(editPricing.dataBillFee || 20)) < 0 ? "-" : "+" }{naira(Math.abs((1 * (Number(editPricing.dataPercent || 0) / 100)) + Number(editPricing.dataFixed || 0) + Number(editPricing.dataBillFee || 20)) )} (Avg relative)
                          </span>
                       </div>
                       
                       { (Number(editPricing.dataPercent || 0) + Number(editPricing.dataFixed || 0) + Number(editPricing.dataBillFee || 20)) < 20 && (
                          <div className="flex items-center gap-2 p-2 bg-amber-50 rounded border border-amber-100 mt-2">
                             <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
                             <span className="text-[10px] font-bold text-amber-800 leading-tight">
                                PROTECTION ACTIVE: Price will be adjusted to base COST + ₦20.
                             </span>
                          </div>
                       )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="dataBreakEven"
                        checked={editPricing.dataEnforceBreakEven !== false}
                        onChange={e => setEditPricing(p => ({ ...p, dataEnforceBreakEven: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 rounded" />
                      <label htmlFor="dataBreakEven" className="text-xs font-bold text-gray-700">🛡️ Keep Protection On (Floor at Cost)</label>
                    </div>
                  </div>
                </div>

                {/* Bill Fees */}
                <div className="md:col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Flat Bill Fee — Cable, Electricity, Betting</p>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Aggressive Startup Tip: ₦50</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[["cableFixed","Cable TV ₦"], ["electricityFixed","Electricity ₦"], ["bettingFixed","Betting ₦"]].map(([field, label]) => (
                      <div key={field}>
                        <label className="text-xs font-bold text-gray-600 block mb-1">{label}</label>
                        <input type="number" step="10"
                          value={editPricing[field] ?? 50}
                          onChange={e => setEditPricing(p => ({ ...p, [field]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-gray-400 focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <input type="checkbox" id="displaySavings"
                      checked={editPricing.displaySavingsToUser !== false}
                      onChange={e => setEditPricing(p => ({ ...p, displaySavingsToUser: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 rounded" />
                    <label htmlFor="displaySavings" className="text-sm font-bold text-gray-700">Show "You saved ₦X" labels to users in the app</label>
                  </div>
                  <button onClick={savePricing} disabled={savingPricing}
                    className="w-full py-4 bg-indigo-600 text-white text-sm font-black rounded-[1.25rem] hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group">
                    {savingPricing ? <><ArrowPathIcon className="h-5 w-5 animate-spin" /> Saving...</> : <><CheckCircleIcon className="h-5 w-5 group-hover:scale-110 transition-transform" /> Deploy Pricing Rules</>}
                  </button>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Live Profit Preview */}
          <GlassCard className="border-emerald-100 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <SectionHeader icon={ArrowTrendingUpIcon} title="Platform Live Monitor"
                subtitle="Real-time profit/loss calculation per transaction." color="emerald" />
              <button onClick={loadPreview} disabled={previewLoading}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-xs font-black bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-60">
                <ArrowPathIcon className={`h-4 w-4 ${previewLoading ? "animate-spin" : ""}`} />
                {previewLoading ? "Syncing..." : "Fetch Live Rates"}
              </button>
            </div>

            {/* Service Tab Switcher */}
            <div className="flex flex-wrap gap-2 mb-5">
              {SERVICE_META.map(svc => (
                <button key={svc.key}
                  onClick={() => { setActiveTab(svc.key); if (svc.key === "data") setActiveNetworkTab("mtn"); if (svc.key === "cable") setActiveNetworkTab("dstv"); }}
                  className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider ${activeTab === svc.key ? `bg-slate-900 text-white shadow-lg` : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}>
                  <svc.icon className="h-4 w-4" /> {svc.label}
                  {svc.advantage && <span className="bg-indigo-500 text-white text-[8px] px-1.5 rounded-full ml-1">EDGE</span>}
                </button>
              ))}
            </div>

            {/* Data/Cable Network Switcher */}
            {(activeTab === "data" || activeTab === "cable") && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {(activeTab === "data" ? ["mtn","glo","airtel","9mobile"] : ["dstv","gotv","startimes"]).map(n => (
                  <button key={n}
                    onClick={() => setActiveNetworkTab(n)}
                    className={`px-4 py-2 text-[10px] font-black rounded-xl uppercase flex-shrink-0 transition-all shadow-sm ${activeNetworkTab === n ? "bg-indigo-600 text-white" : "bg-white border border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200"}`}>
                    {n}
                  </button>
                ))}
              </div>
            )}

            {/* Preview Tables */}
            {previewLoading ? (
              <div className="py-12 text-center text-gray-400 animate-pulse text-sm">Fetching live rates from Payscribe...</div>
            ) : !preview ? (
              <div className="py-12 text-center text-gray-400 text-sm">Click "Fetch Live Rates" to load current pricing.</div>
            ) : (
              <>
                {/* AIRTIME */}
                {activeTab === "airtime" && (
                  <div>
                    <div className="flex items-start gap-2 mb-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <InformationCircleIcon className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-700">Commissions are EARNINGS (discounts on your cost). GLO (4%) gives you ₦40 profit per ₦1000 at 0% markup.</p>
                    </div>
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100">
                        <th className="pb-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Network</th>
                        <th className="pb-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Commission</th>
                        <th className="pb-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Admin Cost</th>
                        <th className="pb-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">User Price</th>
                        <th className="pb-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Profit</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {(preview?.airtime || []).map((row, i) => (
                          <tr key={i} className={`py-2 ${row.breakEvenEnforced ? "bg-amber-50" : ""}`}>
                            <td className="py-3 font-black text-gray-900">
                              {row.name}
                              {row.breakEvenEnforced && <span className="ml-1 text-[9px] font-bold text-amber-600 bg-amber-100 px-1 rounded">break-even applied</span>}
                            </td>
                            <td className="py-3 text-right"><span className={`text-xs font-bold px-2 py-0.5 rounded ${Number(row.payscribeCommissionPct) >= 3 ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{row.commissionLabel}</span></td>
                            <td className="py-3 text-right text-gray-500 font-medium">{naira(row.adminCost)}</td>
                            <td className="py-3 text-right text-gray-700 font-bold">{naira(row.systemPrice)}</td>
                            <td className="py-3 text-right"><NetBadge value={row.netPosition} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* DATA */}
                {activeTab === "data" && (
                  <div>
                    <div className="flex items-start gap-2 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <InformationCircleIcon className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">Data plan prices from Payscribe are your direct admin cost. No separate commission fee is charged.</p>
                    </div>
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-100">
                        <th className="pb-2 text-left text-[10px] font-bold text-gray-400 uppercase">Plan</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Admin Cost</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Our Price</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Net</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">User Saves</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {(preview?.data?.[activeNetworkTab] || []).map((plan, i) => (
                          <tr key={i}>
                            <td className="py-3">
                              <p className="font-bold text-gray-900 text-sm">{plan.name}</p>
                              <p className="text-[10px] text-gray-400">{plan.validity}</p>
                              {plan.breakEvenEnforced && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1 rounded">floor applied</span>}
                            </td>
                            <td className="py-3 text-right text-gray-500 font-medium">{naira(plan.payscribeCost)}</td>
                            <td className="py-3 text-right font-black text-gray-900">{naira(plan.systemPrice)}</td>
                            <td className="py-3 text-right"><NetBadge value={plan.netPosition} /></td>
                            <td className="py-3 text-right">
                              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{naira(plan.userSavings)} SAVE</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* CABLE */}
                {activeTab === "cable" && (
                  <div>
                    <div className="flex items-start gap-2 mb-3 p-3 bg-sky-50 rounded-lg border border-sky-100">
                      <InformationCircleIcon className="h-4 w-4 text-sky-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-sky-700">Cable subscriptions are discounted for the admin. You also earn the flat Cable Fee.</p>
                    </div>
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-100">
                        <th className="pb-2 text-left text-[10px] font-bold text-gray-400 uppercase">Bouquet</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Face Value</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Discount</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Admin Cost</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">User Price</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Net Profit</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {(preview?.cable?.[activeNetworkTab] || []).map((plan, i) => (
                          <tr key={i}>
                            <td className="py-3 font-bold text-gray-900">{plan.name}</td>
                            <td className="py-3 text-right text-gray-500 font-medium">{naira(plan.faceValue)}</td>
                            <td className="py-3 text-right text-emerald-600 font-bold">-{naira(plan.adminDiscount)}</td>
                            <td className="py-3 text-right text-gray-500">{naira(plan.adminCost)}</td>
                            <td className="py-3 text-right font-bold text-gray-900">{naira(plan.userPrice)}</td>
                            <td className="py-3 text-right"><NetBadge value={plan.netPosition} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ELECTRICITY */}
                {activeTab === "electricity" && (
                  <div>
                    <div className="flex items-start gap-2 mb-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <InformationCircleIcon className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">Electricity top-ups are discounted for the admin. Calculations based on ₦5,000 top-up.</p>
                    </div>
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-100">
                        <th className="pb-2 text-left text-[10px] font-bold text-gray-400 uppercase">Disco</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Discount/₦5k</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Admin Cost</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">User Price</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Net Profit</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {(preview?.power || []).map((disco, i) => (
                          <tr key={i}>
                            <td className="py-3">
                              <p className="font-bold text-gray-900">{disco.name}</p>
                              <p className="text-[10px] text-gray-400 uppercase">{disco.discoCode}</p>
                            </td>
                            <td className="py-3 text-right text-emerald-600 font-bold">-{naira(disco.adminDiscount)}</td>
                            <td className="py-3 text-right text-gray-500 font-medium">{naira(disco.adminCost)}</td>
                            <td className="py-3 text-right font-black text-gray-900">{naira(disco.userPrice)}</td>
                            <td className="py-3 text-right"><NetBadge value={disco.netPosition} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* BETTING */}
                {activeTab === "betting" && (
                  <div>
                    <div className="flex items-start gap-2 mb-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <InformationCircleIcon className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-700">Betting funding is discounted for the admin. You also earn the flat Betting Fee. Amounts per ₦1,000.</p>
                    </div>
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-100">
                        <th className="pb-2 text-left text-[10px] font-bold text-gray-400 uppercase">Platform</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Discount</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Admin Cost</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">User Price</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Net Profit</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {(preview?.betting || []).map((row, i) => (
                          <tr key={i}>
                            <td className="py-3 font-bold text-gray-900 capitalize">{row.name}</td>
                            <td className="py-3 text-right text-emerald-600 font-bold">-{naira(row.adminDiscount)}</td>
                            <td className="py-3 text-right text-gray-500 font-medium">{naira(row.adminCost)}</td>
                            <td className="py-3 text-right font-black text-gray-900">{naira(row.userPrice)}</td>
                            <td className="py-3 text-right"><NetBadge value={row.netPosition} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </GlassCard>

          {/* KYC Absorbed Costs Info Panel */}
          <GlassCard className="border-blue-100 shadow-xl">
            <SectionHeader icon={ShieldCheckIcon} title="Platform Support (KYC)"
              subtitle="Verification costs absorbed by the platform for all citizens." color="blue" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(costData?.summary?.kyc?.absorbed || { bvn: 55, license: 110, nin: 110, passport: 110 }).map(([doc, cost]) => (
                <div key={doc} className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-5 text-center shadow-sm">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">{doc}</p>
                  <p className="text-2xl font-black text-blue-900 leading-tight">{naira(cost)}</p>
                  <div className="flex items-center justify-center gap-1.5 mt-3 py-1 px-2 bg-blue-100/50 rounded-full w-fit mx-auto">
                    <CheckCircleIcon className="h-3 w-3 text-blue-600" />
                    <span className="text-[9px] font-black text-blue-700 uppercase">Absorbed</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

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
} from "@heroicons/react/24/outline";
import { fetchServiceCosts, fetchPricingPreview, updatePayscribeRates, updateAdminSettings } from "../services/settingsApi";


const pct = (v) => `${Number(v || 0).toFixed(1)}%`;
const naira = (v) => `₦${Number(v || 0).toLocaleString()}`;

const NetBadge = ({ value, label }) => {
  const n = Number(value);
  if (n > 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <ArrowTrendingUpIcon className="h-3 w-3" /> +{naira(n)} {label || "PROFIT"}
    </span>
  );
  if (n < 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
      <ArrowTrendingDownIcon className="h-3 w-3" /> {naira(n)} {label || "LOSS"}
    </span>
  );
  return <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">BREAK-EVEN</span>;
};

const WarningBadge = ({ label }) => (
  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
    <ExclamationTriangleIcon className="h-3 w-3" /> {label}
  </span>
);

const SectionHeader = ({ icon: Icon, title, subtitle, color = "indigo" }) => (
  <div className={`flex items-start gap-3 mb-6`}>
    <div className={`p-2 rounded-xl bg-${color}-50 flex-shrink-0`}>
      <Icon className={`h-6 w-6 text-${color}-600`} />
    </div>
    <div>
      <h2 className="text-lg font-black text-gray-900">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
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
      await updatePayscribeRates(editRates);
      toast.success("Payscribe rates updated!");
      await loadData();
    } catch {
      toast.error("Failed to save rates.");
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
          <h1 className="text-2xl font-black text-gray-900">Service Costs & Profitability</h1>
          <p className="text-sm text-gray-500 mt-1">Track what Payscribe charges us vs what we earn — per service, per transaction.</p>
        </div>
        <button onClick={() => { loadData(); loadPreview(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
          <ArrowPathIcon className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* ─── Service Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
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
            avgNet = null; // dynamic — depends on plan
          }

          return (
            <div key={svc.key}
              onClick={() => { setActiveTab(svc.key); if (svc.key === "data") setActiveNetworkTab("mtn"); }}
              className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${activeTab === svc.key ? `border-${svc.color}-400 shadow-md` : "border-gray-100"}`}>
              <div className={`inline-flex p-2 rounded-xl bg-${svc.color}-50 mb-3`}>
                <svc.icon className={`h-5 w-5 text-${svc.color}-600`} />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{svc.label}</p>
              {svc.advantage && (
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block">Market Advantage ✓</span>
              )}
              <div className="mt-3">
                {avgNet !== null ? (
                  <NetBadge value={avgNet} label={svc.refLabel} />
                ) : (
                  <span className="text-xs text-gray-400">See live preview →</span>
                )}
              </div>
              {highRisk && <WarningBadge label="High cost providers" />}
            </div>
          );
        })}
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT: Payscribe Rate Registry */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <SectionHeader icon={ShieldCheckIcon} title="Payscribe Rate Registry"
              subtitle="Official rates from the Payscribe PDF. Update if they change." color="gray" />

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
                        onChange={e => setEditRates(prev => ({ ...prev, airtime: { ...prev.airtime, [n]: e.target.value } }))}
                        className="w-16 text-right text-xs font-bold px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:outline-none"
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
                        onChange={e => setEditRates(prev => ({ ...prev, cable: { ...prev.cable, [p]: e.target.value } }))}
                        className="w-16 text-right text-xs font-bold px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-300 focus:outline-none"
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
                        onChange={e => setEditRates(prev => ({ ...prev, electricity: { ...prev.electricity, [disco]: e.target.value } }))}
                        className="w-16 text-right text-xs font-bold px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-300 focus:outline-none"
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
                        onChange={e => setEditRates(prev => ({ ...prev, betting: { ...prev.betting, [platform]: e.target.value } }))}
                        className="w-16 text-right text-xs font-bold px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:outline-none"
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
                          onChange={e => setEditRates(prev => ({ ...prev, kyc: { ...prev.kyc, [doc]: e.target.value } }))}
                          className="w-16 text-right text-xs font-bold px-2 py-1 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={saveRates} disabled={savingRates}
                className="w-full py-3 bg-gray-900 text-white text-sm font-black rounded-xl hover:bg-gray-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                {savingRates ? <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Saving...</> : <><PencilSquareIcon className="h-4 w-4" /> Save Payscribe Rates</>}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Pricing Controls + Live Preview */}
        <div className="xl:col-span-2 space-y-6">

          {/* Market Advantage Controls (Airtime & Data only) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <SectionHeader icon={ArrowTrendingDownIcon} title="Market Advantage Settings"
              subtitle="Airtime & Data only — set how much we subsidize. Break-even is always enforced." color="indigo" />

            {editPricing && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Airtime Controls */}
                <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                  <div className="flex items-center gap-2 mb-4">
                    <DevicePhoneMobileIcon className="h-4 w-4 text-violet-600" />
                    <span className="text-sm font-black text-violet-900">Airtime</span>
                    <span className="text-[10px] font-bold bg-violet-200 text-violet-800 px-1.5 py-0.5 rounded">Market Advantage</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Our Markup % (0 = face value, negative = subsidy)</label>
                      <input type="number" step="0.1"
                        value={editPricing.airtimePercent ?? 0}
                        onChange={e => setEditPricing(p => ({ ...p, airtimePercent: e.target.value }))}
                        className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-violet-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Fixed Fee (₦)</label>
                      <input type="number" step="1"
                        value={editPricing.airtimeFixed ?? 0}
                        onChange={e => setEditPricing(p => ({ ...p, airtimeFixed: e.target.value }))}
                        className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-violet-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Standard Market Rate % (for "You saved" display)</label>
                      <input type="number" step="0.1"
                        value={editPricing.airtimeMarketStandardPercent ?? 2}
                        onChange={e => setEditPricing(p => ({ ...p, airtimeMarketStandardPercent: e.target.value }))}
                        className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-violet-400 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="airtimeBreakEven"
                        checked={editPricing.airtimeEnforceBreakEven !== false}
                        onChange={e => setEditPricing(p => ({ ...p, airtimeEnforceBreakEven: e.target.checked }))}
                        className="h-4 w-4 text-violet-600 rounded" />
                      <label htmlFor="airtimeBreakEven" className="text-xs font-bold text-gray-700">🛡️ Enforce Break-Even (Recommended)</label>
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
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Markup % on Payscribe cost (0 = at cost price)</label>
                      <input type="number" step="0.1"
                        value={editPricing.dataPercent ?? 0}
                        onChange={e => setEditPricing(p => ({ ...p, dataPercent: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Fixed Fee (₦)</label>
                      <input type="number" step="1"
                        value={editPricing.dataFixed ?? 0}
                        onChange={e => setEditPricing(p => ({ ...p, dataFixed: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Standard Market Markup % (for "You saved" display)</label>
                      <input type="number" step="0.1"
                        value={editPricing.dataMarketStandardPercent ?? 2}
                        onChange={e => setEditPricing(p => ({ ...p, dataMarketStandardPercent: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="dataBreakEven"
                        checked={editPricing.dataEnforceBreakEven !== false}
                        onChange={e => setEditPricing(p => ({ ...p, dataEnforceBreakEven: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 rounded" />
                      <label htmlFor="dataBreakEven" className="text-xs font-bold text-gray-700">🛡️ Enforce Break-Even (Recommended)</label>
                    </div>
                  </div>
                </div>

                {/* Bill Fees */}
                <div className="md:col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Flat Bill Fee — Cable, Electricity, Betting</p>
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
                    className="w-full py-3 bg-indigo-600 text-white text-sm font-black rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                    {savingPricing ? <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Saving...</> : "Save Pricing Controls"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Profit Preview */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <SectionHeader icon={ArrowTrendingUpIcon} title="Live Profit Preview"
                subtitle="What happens per transaction for each service right now." color="emerald" />
              <button onClick={loadPreview} disabled={previewLoading}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all disabled:opacity-60">
                <ArrowPathIcon className={`h-3.5 w-3.5 ${previewLoading ? "animate-spin" : ""}`} />
                {previewLoading ? "Loading..." : "Fetch Live Rates"}
              </button>
            </div>

            {/* Service Tab Switcher */}
            <div className="flex flex-wrap gap-2 mb-5">
              {SERVICE_META.map(svc => (
                <button key={svc.key}
                  onClick={() => { setActiveTab(svc.key); if (svc.key === "data") setActiveNetworkTab("mtn"); if (svc.key === "cable") setActiveNetworkTab("dstv"); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === svc.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  <svc.icon className="h-3.5 w-3.5" /> {svc.label}
                  {svc.advantage && <span className="bg-indigo-500 text-white text-[8px] px-1 rounded">ADV</span>}
                </button>
              ))}
            </div>

            {/* Data/Cable Network Switcher */}
            {(activeTab === "data" || activeTab === "cable") && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {(activeTab === "data" ? ["mtn","glo","airtel","9mobile"] : ["dstv","gotv","startimes"]).map(n => (
                  <button key={n}
                    onClick={() => setActiveNetworkTab(n)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md uppercase flex-shrink-0 transition-all ${activeNetworkTab === n ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
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
                      <thead><tr className="border-b border-gray-100">
                        <th className="pb-2 text-left text-[10px] font-bold text-gray-400 uppercase">Network</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Commission</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Admin Cost</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">User Price</th>
                        <th className="pb-2 text-right text-[10px] font-bold text-gray-400 uppercase">Net Profit</th>
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
          </div>

          {/* KYC Absorbed Costs Info Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <SectionHeader icon={ShieldCheckIcon} title="KYC Absorbed Costs"
              subtitle="These are onboarding verification costs the platform absorbs (pays on behalf of citizens)." color="blue" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(costData?.summary?.kyc?.absorbed || { bvn: 55, license: 110, nin: 110, passport: 110 }).map(([doc, cost]) => (
                <div key={doc} className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-blue-400 uppercase mb-1">{doc}</p>
                  <p className="text-xl font-black text-blue-900">{naira(cost)}</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <CheckCircleIcon className="h-3 w-3 text-blue-400" />
                    <span className="text-[10px] text-blue-400">Absorbed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

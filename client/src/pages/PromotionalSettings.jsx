import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  fetchAdminSettings,
  updateAdminSettings,
  sendPromotionalPush,
} from "../services/settingsApi";

const Toggle = ({ enabled, onToggle, label, disabled }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex items-center space-x-3 focus:outline-none ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <div
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          enabled ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </div>
      <span className="text-gray-800 font-semibold text-sm">{label}</span>
    </button>
  );
};

const PromotionalSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Promotional Notification states (Automated)
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [frequencyDays, setFrequencyDays] = useState(7);
  const [dailyPromos, setDailyPromos] = useState([]);
  const [promoError, setPromoError] = useState(null);
  const [promoSuccess, setPromoSuccess] = useState(null);

  // Manual Notification states
  const [manualTitle, setManualTitle] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [manualSuccess, setManualSuccess] = useState(null);
  const [manualError, setManualError] = useState(null);

  const daysOfWeek = [
    { id: 0, label: "Sunday" },
    { id: 1, label: "Monday" },
    { id: 2, label: "Tuesday" },
    { id: 3, label: "Wednesday" },
    { id: 4, label: "Thursday" },
    { id: 5, label: "Friday" },
    { id: 6, label: "Saturday" },
  ];

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await fetchAdminSettings();
        const settings = data?.settings;

        if (settings?.promotional) {
          setPromoEnabled(!!settings.promotional.automationEnabled);
          setFrequencyDays(settings.promotional.frequencyDays ?? 7);
          
          if (settings.promotional.dailyPromos && settings.promotional.dailyPromos.length > 0) {
            // Ensure all 7 days are represented
            const merged = daysOfWeek.map(d => {
              const existing = settings.promotional.dailyPromos.find(p => p.day === d.id);
              return existing ? { ...existing } : { day: d.id, enabled: false, title: "", body: "" };
            });
            setDailyPromos(merged);
          } else {
            setDailyPromos(daysOfWeek.map(d => ({ day: d.id, enabled: false, title: "", body: "" })));
          }
        } else {
          setDailyPromos(daysOfWeek.map(d => ({ day: d.id, enabled: false, title: "", body: "" })));
        }
      } catch (err) {
        toast.error("Failed to load promotional settings.");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (promoSuccess) {
      const timer = setTimeout(() => setPromoSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [promoSuccess]);

  useEffect(() => {
    if (manualSuccess) {
      const timer = setTimeout(() => setManualSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [manualSuccess]);

  const handleDailyPromoUpdate = (dayId, field, value) => {
    setDailyPromos(prev => 
      prev.map(p => p.day === dayId ? { ...p, [field]: value } : p)
    );
  };

  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    setPromoError(null);
    setPromoSuccess(null);
    setSaving(true);

    try {
      const activeDays = dailyPromos.filter(p => p.enabled).map(p => p.day);

      const payload = {
        promotional: {
          automationEnabled: promoEnabled,
          activeDays: activeDays,
          dailyPromos: dailyPromos,
        },
      };
      await updateAdminSettings(payload);
      setPromoSuccess("Automated notification schedule updated.");
      toast.success("Automated notification schedule updated.");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update settings.";
      setPromoError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleFrequencySubmit = async (e) => {
    e.preventDefault();
    if (!frequencyDays || frequencyDays < 1) {
      toast.error("Please enter a valid number of days (1-30).");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        promotional: {
          frequencyDays: frequencyDays,
        },
      };
      await updateAdminSettings(payload);
      toast.success(`Frequency cap updated to ${frequencyDays} days.`);
    } catch (err) {
      toast.error("Failed to update frequency cap.");
    } finally {
      setSaving(false);
    }
  };

  const handleManualSend = async (e) => {
    e.preventDefault();
    setManualError(null);
    setManualSuccess(null);

    if (!manualTitle.trim() || !manualMessage.trim()) {
      setManualError("Title and message are required.");
      return;
    }

    try {
      setSending(true);
      const payload = {
        title: manualTitle,
        message: manualMessage,
        targetRole: targetRole,
      };
      const response = await sendPromotionalPush(payload);
      setManualSuccess(response.message || "Push notification sent successfully.");
      toast.success("Push notification sent successfully.");
      setManualTitle("");
      setManualMessage("");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to send notification.";
      setManualError(msg);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Promotional Alerts & Notifications</h1>
        <p className="text-gray-600 mt-1">Schedule recurring messages or send instant alerts to your users.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Automated Promotional Messages Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 h-fit">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 text-sm">01</span>
              Automated Schedule
            </h2>
            
            {promoError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {promoError}
              </div>
            )}
            
            {promoSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {promoSuccess}
              </div>
            )}

            <form onSubmit={handlePromoSubmit} className="space-y-6">
              <div className="flex flex-col space-y-2">
                <Toggle
                  enabled={promoEnabled}
                  onToggle={() => setPromoEnabled(!promoEnabled)}
                  label="Enable Automated Notifications"
                  disabled={saving}
                />
                <p className="text-xs text-gray-500">
                  When enabled, the system automatically sends encouraging pushes on your chosen days.
                </p>
              </div>

              <div className={`p-4 rounded-xl border border-gray-100 bg-gray-50/50 ${!promoEnabled ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-tight">Frequency Cap</label>
                    <p className="text-[10px] text-gray-500">Don't send more than one automated alert per user every X days.</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={frequencyDays === 0 ? "" : frequencyDays}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setFrequencyDays(0);
                          } else {
                            setFrequencyDays(Number(val));
                          }
                        }}
                        className="w-16 p-2 text-center text-sm font-bold bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                      />
                      <span className="text-xs font-semibold text-gray-600">DAYS</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFrequencySubmit}
                      disabled={saving}
                      className="px-3 py-2 bg-white border border-gray-200 text-blue-600 text-[10px] font-bold uppercase tracking-tight rounded-lg hover:bg-blue-50 hover:border-blue-100 transition-all shadow-sm disabled:opacity-50"
                    >
                      {saving ? "..." : "Save Cap"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Day-Specific Messages Section */}
              <div className={`space-y-4 pt-4 border-t border-gray-100 ${!promoEnabled ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-gray-800 uppercase tracking-tight">Daily Custom Messages</label>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">Optional Overrides</span>
                </div>
                
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {dailyPromos.map((promo) => (
                    <div key={promo.day} className={`p-4 rounded-xl border transition-all ${promo.enabled ? "bg-blue-50/50 border-blue-200 ring-1 ring-blue-100" : "bg-gray-50/50 border-gray-200"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-sm text-gray-700">{daysOfWeek.find(d => d.id === promo.day)?.label}</span>
                        <button
                          type="button"
                          onClick={() => handleDailyPromoUpdate(promo.day, "enabled", !promo.enabled)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${promo.enabled ? "bg-blue-600" : "bg-gray-300"}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${promo.enabled ? "translate-x-4.5" : "translate-x-1"}`} />
                        </button>
                      </div>
                      
                      {promo.enabled && (
                        <div className="space-y-2 animate-fadeIn">
                          <input
                            type="text"
                            placeholder="Daily Headline (e.g. Monday Motivation!)"
                            value={promo.title}
                            onChange={(e) => handleDailyPromoUpdate(promo.day, "title", e.target.value)}
                            className="w-full p-2.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-semibold"
                          />
                          <textarea
                            placeholder="Write something encouraging for today..."
                            value={promo.body}
                            onChange={(e) => handleDailyPromoUpdate(promo.day, "body", e.target.value)}
                            rows="2"
                            className="w-full p-2.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                          ></textarea>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {saving ? "Saving..." : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* manual Notification Tools Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 h-fit">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-2 text-sm">02</span>
              Instant Blast Notification
            </h2>
            
            {manualError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {manualError}
              </div>
            )}
            
            {manualSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {manualSuccess}
              </div>
            )}

            <form onSubmit={handleManualSend} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Target Audience</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                  disabled={sending}
                >
                  <option value="all">All App Users</option>
                  <option value="customer">Customers Only</option>
                  <option value="rider">Riders Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Headline (Title)</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  placeholder="e.g. Traffic Alert or New Promo!"
                  disabled={sending}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Detailed Message</label>
                <textarea
                  value={manualMessage}
                  onChange={(e) => setManualMessage(e.target.value)}
                  rows="4"
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What is your message to the users?"
                  disabled={sending}
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Blasting...
                    </>
                  ) : (
                    "Send Bulk Notification"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionalSettings;

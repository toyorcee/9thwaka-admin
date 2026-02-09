import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  fetchPromoConfig,
  toggleAllPromos,
  updateCustomerGold,
  updateRiderGold,
  updateReferralPromo,
  updateStreakPromo,
  updateFirstOrderPromo,
  updateBirthdayPromo,
} from "../services/promoApi";

const Toggle = ({ enabled, onToggle, label }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center space-x-3 focus:outline-none"
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

const formatNumber = (num) => {
  if (num === null || num === undefined || num === "") return "";
  const parts = num.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

const cleanNumber = (str) => {
  if (str === null || str === undefined) return "";
  return str.toString().replace(/,/g, "");
};

const PromoConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await fetchPromoConfig();
        setConfig(data.config);
      } catch (err) {
        setError("Failed to fetch promo configuration.");
      }
      setLoading(false);
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = setTimeout(() => {
      setSuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  // Handler for currency inputs
  const handleCurrencyChange = (section, field) => (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, "");
    if (!isNaN(val)) {
      setConfig((prev) => ({
        ...prev,
        [section]: {
          ...(prev?.[section] || {}),
          [field]: val, // Store raw number/string in state?
          // If we store raw "1000", formatNumber(1000) -> "1,000" in render.
          // If we store "1000" (string), formatNumber("1000") -> "1,000".
          // If we want to mimic PricingSettings exactly, we store formatted string?
          // PricingSettings: setFormData(prev => ({...prev, field: formatNumber(val)}))
          // Let's do that for consistency if we want strictly formatted state.
          // BUT my submit handlers expect numbers or use Number().
          // I will store the *clean* value as a string or number in state, and format on render.
          // Wait, if I store clean value "1000", render is "1,000".
          // User types "1" -> state "1".
          // User types "0" -> state "10".
          // user types ","? Regex removes it.
          // This seems safer for my existing code structure.
        },
      })); 
    }
  };
  
  // Revised Currency Handler needed to support the specific pattern I requested myself.
  // Actually, let's just stick to the specific field updates inline or update the generic handlers.
  
  const updateReferralSection = async (payload, successText) => {
    setSaving(true);
    try {
      const data = await updateReferralPromo(payload);
      setConfig((prev) => ({
        ...prev,
        referral: data.config,
      }));
      const message =
        successText || "Promo configuration updated successfully.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError("Failed to update promo configuration.");
      toast.error("Failed to update promo configuration.");
    } finally {
      setSaving(false);
    }
  };

  const updateStreakSection = async (payload, successText) => {
    setSaving(true);
    try {
      const data = await updateStreakPromo(payload);
      setConfig((prev) => ({
        ...prev,
        streak: data.config,
      }));
      const message =
        successText || "Promo configuration updated successfully.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError("Failed to update promo configuration.");
      toast.error("Failed to update promo configuration.");
    } finally {
      setSaving(false);
    }
  };

  const updateCustomerGoldSection = async (payload, successText) => {
    setSaving(true);
    try {
      const data = await updateCustomerGold(payload);
      setConfig((prev) => ({
        ...prev,
        customerGold: data.config,
      }));
      const message =
        successText || "Customer Gold promo updated successfully.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError("Failed to update customer gold promo.");
      toast.error("Failed to update customer gold promo.");
    } finally {
      setSaving(false);
    }
  };

  const updateRiderGoldSection = async (payload, successText) => {
    setSaving(true);
    try {
      const data = await updateRiderGold(payload);
      setConfig((prev) => ({
        ...prev,
        riderGold: data.config,
      }));
      const message =
        successText || "Rider Gold promo updated successfully.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError("Failed to update rider gold promo.");
      toast.error("Failed to update rider gold promo.");
    } finally {
      setSaving(false);
    }
  };

  const updateFirstOrderSection = async (payload, successText) => {
    setSaving(true);
    try {
      const data = await updateFirstOrderPromo(payload);
      setConfig((prev) => ({
        ...prev,
        firstOrder: data.config,
      }));
      const message =
        successText || "Promo configuration updated successfully.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError("Failed to update promo configuration.");
      toast.error("Failed to update promo configuration.");
    } finally {
      setSaving(false);
    }
  };

  const updateBirthdaySection = async (payload, successText) => {
    setSaving(true);
    try {
      const data = await updateBirthdayPromo(payload);
      setConfig((prev) => ({
        ...prev,
        birthdayPromo: data.config,
      }));
      const message =
        successText || "Birthday promo configuration updated successfully.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError("Failed to update birthday promo configuration.");
      toast.error("Failed to update birthday promo configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAll = async (enabled) => {
    setSaving(true);
    try {
      await toggleAllPromos(enabled);
      setConfig((prev) => ({
        ...prev,
        referral: { ...(prev?.referral || {}), enabled },
        streak: { ...(prev?.streak || {}), enabled },
        customerGold: { ...(prev?.customerGold || {}), enabled },
        riderGold: { ...(prev?.riderGold || {}), enabled },
        firstOrder: { ...(prev?.firstOrder || {}), enabled },
        birthdayPromo: { ...(prev?.birthdayPromo || {}), enabled },
      }));
      const message = enabled
        ? "All promos enabled successfully."
        : "All promos disabled.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError("Failed to toggle promos.");
      toast.error("Failed to toggle promos.");
    } finally {
      setSaving(false);
    }
  };

  const handleReferralChange = (field) => (e) => {
    const { type, checked, value } = e.target;

    let newValue = value;
    if (field === 'rewardAmount' || field === 'minTripValue' || field === 'rewardExpiryDays') {
         if (type !== 'checkbox') {
             newValue = cleanNumber(value);
         }
    }

    setConfig((prev) => ({
      ...prev,
      referral: {
        ...(prev?.referral || {}),
        [field]:
          type === "checkbox" ? checked : newValue === "" ? "" : newValue,
      },
    }));
  };

  const handleStreakChange = (field) => (e) => {
    const { type, checked, value } = e.target;
    let newValue = value;
    if (field === 'bonusAmount' || field === 'minTripValue' || field === 'rewardExpiryDays') {
        if (type !== 'checkbox') newValue = cleanNumber(value);
    }
    setConfig((prev) => ({
      ...prev,
      streak: {
        ...(prev?.streak || {}),
        [field]:
          type === "checkbox" ? checked : newValue === "" ? "" : newValue,
      },
    }));
  };

  const handleCustomerGoldChange = (field) => (e) => {
    const { type, checked, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      customerGold: {
        ...(prev?.customerGold || {}),
        [field]:
          type === "checkbox" ? checked : value === "" ? "" : Number(value),
      },
    }));
  };

  const handleRiderGoldChange = (field) => (e) => {
    const { type, checked, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      riderGold: {
        ...(prev?.riderGold || {}),
        [field]:
          type === "checkbox" ? checked : value === "" ? "" : Number(value),
      },
    }));
  };

  const handleFirstOrderChange = (field) => (e) => {
     const { type, checked, value } = e.target;
    let newValue = value;
    if (field === 'discountAmount' || field === 'minTripValue' || field === 'rewardExpiryDays') {
        if (type !== 'checkbox') newValue = cleanNumber(value);
    }
    setConfig((prev) => ({
      ...prev,
      firstOrder: {
        ...(prev?.firstOrder || {}),
        [field]:
          type === "checkbox" ? checked : newValue === "" ? "" : newValue,
      },
    }));
  };

  const handleBirthdayChange = (field) => (e) => {
    const { type, checked, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      birthdayPromo: {
        ...(prev?.birthdayPromo || {}),
        [field]:
          type === "checkbox" ? checked : value === "" ? "" : Number(value),
      },
    }));
  };

  const toggleReferralEnabled = () => {
    if (!config?.referral || saving) return;
    const nextEnabled = !config.referral.enabled;
    updateReferralSection(
      { enabled: nextEnabled },
      nextEnabled ? "Referral promo enabled." : "Referral promo disabled."
    );
  };

  const toggleStreakEnabled = () => {
    if (!config?.streak || saving) return;
    const nextEnabled = !config.streak.enabled;
    updateStreakSection(
      { enabled: nextEnabled },
      nextEnabled
        ? "Streak bonus promo enabled."
        : "Streak bonus promo disabled."
    );
  };

  const toggleCustomerGoldEnabled = () => {
    if (!config?.customerGold || saving) return;
    const nextEnabled = !config.customerGold.enabled;
    updateCustomerGoldSection(
      { enabled: nextEnabled },
      nextEnabled ? "Customer Gold promo enabled." : "Customer Gold promo disabled."
    );
  };

  const toggleRiderGoldEnabled = () => {
    if (!config?.riderGold || saving) return;
    const nextEnabled = !config.riderGold.enabled;
    updateRiderGoldSection(
      { enabled: nextEnabled },
      nextEnabled ? "Rider Gold promo enabled." : "Rider Gold promo disabled."
    );
  };

  const toggleFirstOrderEnabled = () => {
    if (!config?.firstOrder || saving) return;
    const nextEnabled = !config.firstOrder.enabled;
    updateFirstOrderSection(
      { enabled: nextEnabled },
      nextEnabled ? "First Order promo enabled." : "First Order promo disabled."
    );
  };

  const toggleBirthdayEnabled = () => {
    if (!config?.birthdayPromo || saving) return;
    const nextEnabled = !config.birthdayPromo.enabled;
    updateBirthdaySection(
      { enabled: nextEnabled },
      nextEnabled
        ? "Birthday promo enabled."
        : "Birthday promo disabled."
    );
  };

  const handleUpdateReferral = async (e) => {
    e.preventDefault();
    if (!config?.referral) return;
    await updateReferralSection(
      {
        enabled: !!config.referral.enabled,
        rewardAmount:
          config.referral.rewardAmount === ""
            ? undefined
            : Number(cleanNumber(config.referral.rewardAmount)),
        requiredTrips:
          config.referral.requiredTrips === ""
            ? undefined
            : Number(config.referral.requiredTrips),
        minTripValue:
          config.referral.minTripValue === ""
            ? undefined
            : Number(cleanNumber(config.referral.minTripValue)),
        rewardExpiryDays:
          config.referral.rewardExpiryDays === ""
            ? undefined
            : Number(config.referral.rewardExpiryDays),
        reoccurring: !!config.referral.reoccurring,
      },
      "Referral settings saved."
    );
  };

  const handleUpdateStreak = async (e) => {
    e.preventDefault();
    if (!config?.streak) return;
    await updateStreakSection(
      {
        enabled: !!config.streak.enabled,
        bonusAmount:
          config.streak.bonusAmount === ""
            ? undefined
            : Number(cleanNumber(config.streak.bonusAmount)),
        requiredStreak:
          config.streak.requiredStreak === ""
            ? undefined
            : Number(config.streak.requiredStreak),
        minTripValue:
          config.streak.minTripValue === ""
            ? undefined
            : Number(cleanNumber(config.streak.minTripValue)),
        rewardExpiryDays:
          config.streak.rewardExpiryDays === ""
            ? undefined
            : Number(config.streak.rewardExpiryDays),
        reoccurring: !!config.streak.reoccurring,
      },
      "Streak bonus settings saved."
    );
  };

  const handleUpdateCustomerGold = async (e) => {
    e.preventDefault();
    if (!config?.customerGold) return;
    await updateCustomerGoldSection(
      {
        enabled: !!config.customerGold.enabled,
        requiredTrips:
          config.customerGold.requiredTrips === ""
            ? undefined
            : Number(config.customerGold.requiredTrips),
        windowDays:
          config.customerGold.windowDays === ""
            ? undefined
            : Number(config.customerGold.windowDays),
        durationDays:
          config.customerGold.durationDays === ""
            ? undefined
            : Number(config.customerGold.durationDays),
        discountPercent:
          config.customerGold.discountPercent === ""
            ? undefined
            : Number(config.customerGold.discountPercent),
        reoccurring: !!config.customerGold.reoccurring,
      },
      "Customer Gold settings saved."
    );
  };

  const handleUpdateRiderGold = async (e) => {
    e.preventDefault();
    if (!config?.riderGold) return;
    await updateRiderGoldSection(
      {
        enabled: !!config.riderGold.enabled,
        requiredDeliveries:
          config.riderGold.requiredDeliveries === ""
            ? undefined
            : Number(config.riderGold.requiredDeliveries),
        windowDays:
          config.riderGold.windowDays === ""
            ? undefined
            : Number(config.riderGold.windowDays),
        durationDays:
          config.riderGold.durationDays === ""
            ? undefined
            : Number(config.riderGold.durationDays),
        discountPercent:
          config.riderGold.discountPercent === ""
            ? undefined
            : Number(config.riderGold.discountPercent),
        reoccurring: !!config.riderGold.reoccurring,
      },
      "Rider Gold settings saved."
    );
  };

  const handleUpdateFirstOrder = async (e) => {
    e.preventDefault();
    if (!config?.firstOrder) return;
    await updateFirstOrderSection(
      {
        enabled: !!config.firstOrder.enabled,
        discountAmount:
          config.firstOrder.discountAmount === ""
            ? undefined
            : Number(cleanNumber(config.firstOrder.discountAmount)),
        limitCount:
          config.firstOrder.limitCount === ""
            ? undefined
            : Number(config.firstOrder.limitCount),
        minTripValue:
          config.firstOrder.minTripValue === ""
            ? undefined
            : Number(cleanNumber(config.firstOrder.minTripValue)),
        rewardExpiryDays:
          config.firstOrder.rewardExpiryDays === ""
            ? undefined
            : Number(config.firstOrder.rewardExpiryDays),
        reoccurring: !!config.firstOrder.reoccurring,
      },
      "First Order promo settings saved."
    );
  };

  if (loading) return <div className="text-gray-800">Loading...</div>;
  if (error)
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Promo Configuration
        </h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Promo Configuration
      </h1>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => handleToggleAll(true)}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enable all promos
        </button>
        <button
          type="button"
          onClick={() => handleToggleAll(false)}
          disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Disable all promos
        </button>
      </div>

      {config && (
        <div className="space-y-8">
          <form
            onSubmit={handleUpdateFirstOrder}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              🎁 First Order / New Joiner Promo
            </h2>
            <div className="flex items-center mb-4">
              <Toggle
                enabled={!!config.firstOrder?.enabled}
                onToggle={toggleFirstOrderEnabled}
                label="Enable First Order Promo"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Discount Amount (₦)
                </label>
                <input
                  type="text"
                  name="firstOrderDiscountAmount"
                  value={formatNumber(config.firstOrder?.discountAmount)}
                  onChange={handleFirstOrderChange("discountAmount")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  First X Orders
                </label>
                <input
                  type="number"
                  min="1"
                  name="firstOrderLimitCount"
                  value={config.firstOrder?.limitCount ?? ""}
                  onChange={handleFirstOrderChange("limitCount")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Minimum Trip Value (₦)
                </label>
                 <input
                  type="text"
                  name="firstOrderMinTripValue"
                  value={formatNumber(config.firstOrder?.minTripValue)}
                  onChange={handleFirstOrderChange("minTripValue")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
                 <p className="text-xs text-gray-500 mt-1">Trips below this amount do not count</p>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Reward Expiry (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  name="firstOrderRewardExpiryDays"
                  value={config.firstOrder?.rewardExpiryDays ?? ""}
                  onChange={handleFirstOrderChange("rewardExpiryDays")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
                <p className="text-xs text-gray-500 mt-1">Days before reward expires</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!config.firstOrder?.reoccurring}
                  onChange={handleFirstOrderChange("reoccurring")}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
                <span className="text-gray-700 font-semibold">
                  Reoccurring (Applies to specified number of orders, can reset?)
                </span>
              </label>
               <p className="text-xs text-gray-500 mt-2 ml-8">
                {config.firstOrder?.reoccurring
                  ? "Users can re-earn First Order promo (Unusual, but allowed)"
                  : "Users can only earn First Order promo once for the first X orders"}
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save First Order settings
            </button>
          </form>

          <form
            onSubmit={handleUpdateReferral}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              💰 Referral Rewards
            </h2>
            <div className="flex items-center mb-4">
              <Toggle
                enabled={!!config.referral?.enabled}
                onToggle={toggleReferralEnabled}
                label="Enable referral program"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Reward amount (₦)
                </label>
                <input
                  type="text"
                  name="referralRewardAmount"
                  value={formatNumber(config.referral?.rewardAmount)}
                  onChange={handleReferralChange("rewardAmount")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Required trips per referee
                </label>
                <input
                  type="number"
                  min="1"
                  name="referralRequiredTrips"
                  value={config.referral?.requiredTrips ?? ""}
                  onChange={handleReferralChange("requiredTrips")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Minimum Trip Value (₦)
                </label>
                 <input
                  type="text"
                  name="referralMinTripValue"
                  value={formatNumber(config.referral?.minTripValue)}
                  onChange={handleReferralChange("minTripValue")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
                <p className="text-xs text-gray-500 mt-1">Trips below this amount won't count</p>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Reward Expiry (Days)
                </label>
                 <input
                  type="number"
                  min="1"
                  name="referralRewardExpiryDays"
                  value={config.referral?.rewardExpiryDays ?? ""}
                  onChange={handleReferralChange("rewardExpiryDays")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
                 <p className="text-xs text-gray-500 mt-1">Days before reward expires</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!config.referral?.reoccurring}
                  onChange={handleReferralChange("reoccurring")}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
                <span className="text-gray-700 font-semibold">
                  Reoccurring (users can earn multiple times)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-8">
                {config.referral?.reoccurring
                  ? "Users can earn referral reward multiple times"
                  : "Users can only earn referral reward once (tracked in user.promoRewardsEarned.referral)"}
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save referral settings
            </button>
          </form>

          <form
            onSubmit={handleUpdateStreak}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              🔥 Streak Bonus
            </h2>
            <div className="flex items-center mb-4">
              <Toggle
                enabled={!!config.streak?.enabled}
                onToggle={toggleStreakEnabled}
                label="Enable streak bonus"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Bonus amount (₦)
                </label>
                <input
                  type="text"
                  name="streakBonusAmount"
                  value={formatNumber(config.streak?.bonusAmount)}
                  onChange={handleStreakChange("bonusAmount")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Required streak (consecutive accepts)
                </label>
                <input
                  type="number"
                  min="1"
                  name="streakRequired"
                  value={config.streak?.requiredStreak ?? ""}
                  onChange={handleStreakChange("requiredStreak")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Minimum Trip Value (₦)
                </label>
                <input
                  type="text"
                  name="streakMinTripValue"
                  value={formatNumber(config.streak?.minTripValue)}
                  onChange={handleStreakChange("minTripValue")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
                 <p className="text-xs text-gray-500 mt-1">Trips below this amount do not count</p>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Reward Expiry (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  name="streakRewardExpiryDays"
                  value={config.streak?.rewardExpiryDays ?? ""}
                  onChange={handleStreakChange("rewardExpiryDays")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
                <p className="text-xs text-gray-500 mt-1">Days before reward expires</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!config.streak?.reoccurring}
                  onChange={handleStreakChange("reoccurring")}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
                <span className="text-gray-700 font-semibold">
                  Reoccurring (users can earn multiple times)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-8">
                {config.streak?.reoccurring
                  ? "Users can earn streak bonus multiple times (after reset, they start fresh)"
                  : "Users can only earn streak bonus once (tracked in user.promoRewardsEarned.streak)"}
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save streak settings
            </button>
          </form>

          <form
            onSubmit={handleUpdateCustomerGold}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              ⭐ Customer Gold Status
            </h2>
            <div className="flex items-center mb-4">
              <Toggle
                enabled={!!config.customerGold?.enabled}
                onToggle={toggleCustomerGoldEnabled}
                label="Enable Customer Gold Status"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Required trips
                </label>
                <input
                  type="number"
                  min="1"
                  name="customerGoldRequiredTrips"
                  value={config.customerGold?.requiredTrips ?? ""}
                  onChange={handleCustomerGoldChange("requiredTrips")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Window days
                </label>
                <input
                  type="number"
                  min="1"
                  name="customerGoldWindowDays"
                  value={config.customerGold?.windowDays ?? ""}
                  onChange={handleCustomerGoldChange("windowDays")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Duration days
                </label>
                <input
                  type="number"
                  min="1"
                  name="customerGoldDurationDays"
                  value={config.customerGold?.durationDays ?? ""}
                  onChange={handleCustomerGoldChange("durationDays")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Discount percent (Trip Price)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="customerGoldDiscountPercent"
                  value={config.customerGold?.discountPercent ?? ""}
                  onChange={handleCustomerGoldChange("discountPercent")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: 5%</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!config.customerGold?.reoccurring}
                  onChange={handleCustomerGoldChange("reoccurring")}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
                <span className="text-gray-700 font-semibold">
                  Reoccurring (users can re-earn after expiration)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-8">
                {config.customerGold?.reoccurring
                  ? "Users can re-earn Customer Gold Status after expiration"
                  : "Users can only earn Customer Gold Status once (tracked in promoRewardsEarned)"}
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Customer Gold settings
            </button>
          </form>

          <form
            onSubmit={handleUpdateRiderGold}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              🚴 Rider Gold Status
            </h2>
            <div className="flex items-center mb-4">
              <Toggle
                enabled={!!config.riderGold?.enabled}
                onToggle={toggleRiderGoldEnabled}
                label="Enable Rider Gold Status"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Required deliveries
                </label>
                <input
                  type="number"
                  min="1"
                  name="riderGoldRequiredDeliveries"
                  value={config.riderGold?.requiredDeliveries ?? ""}
                  onChange={handleRiderGoldChange("requiredDeliveries")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Window days
                </label>
                <input
                  type="number"
                  min="1"
                  name="riderGoldWindowDays"
                  value={config.riderGold?.windowDays ?? ""}
                  onChange={handleRiderGoldChange("windowDays")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Duration days
                </label>
                <input
                  type="number"
                  min="1"
                  name="riderGoldDurationDays"
                  value={config.riderGold?.durationDays ?? ""}
                  onChange={handleRiderGoldChange("durationDays")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Discount percent (Commission Waiver)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="riderGoldDiscountPercent"
                  value={config.riderGold?.discountPercent ?? ""}
                  onChange={handleRiderGoldChange("discountPercent")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
                 <p className="text-xs text-gray-500 mt-1">Recommended: 10%</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!config.riderGold?.reoccurring}
                  onChange={handleRiderGoldChange("reoccurring")}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
                <span className="text-gray-700 font-semibold">
                  Reoccurring (users can re-earn after expiration)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-8">
                {config.riderGold?.reoccurring
                  ? "Users can re-earn Rider Gold Status after expiration"
                  : "Users can only earn Rider Gold Status once (tracked in promoRewardsEarned)"}
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Rider Gold settings
            </button>
          </form>
        </div>
      )}

      {/* Birthday Promo Section */}
      {config?.birthdayPromo && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-800">
                🎂 Birthday Promo
              </h2>
              <Toggle
                enabled={!!config.birthdayPromo?.enabled}
                onToggle={toggleBirthdayEnabled}
                label={
                  config.birthdayPromo?.enabled ? "Enabled" : "Disabled"
                }
              />
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Give users a special discount on their birthday! A 10% discount is applied automatically on the user's birthday.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!config?.birthdayPromo) return;
              updateBirthdaySection(
                { discountPercent: config.birthdayPromo.discountPercent },
                "Birthday promo settings updated successfully."
              );
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Discount Percent
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.birthdayPromo?.discountPercent ?? ""}
                  onChange={handleBirthdayChange("discountPercent")}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Percentage discount applied to rides on user's birthday.
                </p>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Birthday Promo settings
            </button>
          </form>
        </div>
      )}

      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-end justify-end pointer-events-none">
          <div className="m-4 pointer-events-auto">
            <div className="rounded-lg bg-green-600 text-white px-4 py-3 shadow-lg flex items-center space-x-3">
              <span className="text-sm font-medium">{successMessage}</span>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-white/80 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoConfig;

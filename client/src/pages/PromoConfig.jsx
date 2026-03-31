import React, { useState, useEffect } from "react";
import ValidatedInput from "../components/ValidatedInput";
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
  updatePlatformPromo,
  updatePointRewards,
  updateCashbackPromo,
  updateRiderMilestones,
  fetchRewardExpiryStats,
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
  const [savingCashback, setSavingCashback] = useState(false);
  const [savingRiderMilestones, setSavingRiderMilestones] = useState(false);
  const [savingLoyalty, setSavingLoyalty] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [expiryStats, setExpiryStats] = useState({ aboutToExpire: [], expired: 0, expiredCount: 0 });
  const [activeCashbackTab, setActiveCashbackTab] = useState("customer");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configData, statsData] = await Promise.all([
           fetchPromoConfig(),
           fetchRewardExpiryStats()
        ]);
        setConfig(configData.config);
        setExpiryStats(statsData.stats);
      } catch (err) {
        setError("Failed to fetch promo configuration components.");
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const getStatsForType = (type) => {
    if (!expiryStats?.aboutToExpire) return 0;
    const stats = expiryStats.aboutToExpire.find(s => s._id === type);
    return stats ? stats.totalAmount : 0;
  };

  const ExpiryBadge = ({ type }) => {
    const amount = getStatsForType(type);
    if (amount <= 0) return null;
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ml-2">
        ⏳ ₦{formatNumber(amount)} expiring soon
      </div>
    );
  };

  useEffect(() => {
    if (!successMessage) return;
    const timeout = setTimeout(() => {
      setSuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  
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

  const updatePlatformSection = async (payload, successText) => {
    setSaving(true);
    try {
      const data = await updatePlatformPromo(payload);
      setConfig((prev) => ({
        ...prev,
        platformPromo: data.config,
      }));
      const message = successText || "Platform promo updated successfully.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError("Failed to update platform promo.");
      toast.error("Failed to update platform promo.");
    } finally {
      setSaving(false);
    }
  };

  const updatePointRewardsSection = async (payload, successText) => {
    setSavingLoyalty(true);
    try {
      const data = await updatePointRewards(payload);
      setConfig((prev) => ({
        ...prev,
        pointRewards: data.config.pointRewards,
        loyaltyEarningRates: data.config.loyaltyEarningRates,
      }));
      const message = successText || "Point Rewards updated successfully.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError("Failed to update point rewards.");
      toast.error("Failed to update point rewards.");
    } finally {
      setSavingLoyalty(false);
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

  const updateCashbackSection = async (payload, successText) => {
    setSavingCashback(true);
    try {
      const data = await updateCashbackPromo(payload);
      setConfig((prev) => ({
        ...prev,
        cashback: data.config,
      }));
      const message = successText || "Cashback promo updated successfully.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError("Failed to update cashback promo.");
      toast.error("Failed to update cashback promo.");
    } finally {
      setSavingCashback(false);
    }
  };

  const updateRiderMilestonesSection = async (payload, successText) => {
    setSavingRiderMilestones(true);
    try {
      const data = await updateRiderMilestones(payload);
      setConfig((prev) => ({
        ...prev,
        riderMilestones: data.config,
      }));
      const message = successText || "Rider milestones updated successfully.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError("Failed to update rider milestones.");
      toast.error("Failed to update rider milestones.");
    } finally {
      setSavingRiderMilestones(false);
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
        platformPromo: { ...(prev?.platformPromo || {}), enabled },
        pointRewards: { ...(prev?.pointRewards || {}), enabled },
        cashback: { ...(prev?.cashback || {}), enabled },
        riderMilestones: { ...(prev?.riderMilestones || {}), enabled },
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
    if (field === 'rewardAmount' || field === 'minTripValue' || field === 'rewardExpiryDays' || field === 'requiredTrips' || field === 'maxPerWeek' || field === 'maxReferralsPerWeek') {
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
    if (field === 'bonusAmount' || field === 'minTripValue' || field === 'rewardExpiryDays' || field === 'requiredStreak') {
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
    let newValue = value;
    if (field === 'minTripValue' || field === 'requiredTrips' || field === 'windowDays' || field === 'durationDays' || field === 'discountPercent') {
        if (type !== 'checkbox') newValue = cleanNumber(value);
    }
    setConfig((prev) => ({
      ...prev,
      customerGold: {
        ...(prev?.customerGold || {}),
        [field]:
          type === "checkbox" ? checked : newValue === "" ? "" : newValue,
      },
    }));
  };

  const handleRiderGoldChange = (field) => (e) => {
    const { type, checked, value } = e.target;
    let newValue = value;
    if (field === 'minTripValue' || field === 'requiredDeliveries' || field === 'windowDays' || field === 'durationDays' || field === 'discountPercent') {
        if (type !== 'checkbox') newValue = cleanNumber(value);
    }
    setConfig((prev) => ({
      ...prev,
      riderGold: {
        ...(prev?.riderGold || {}),
        [field]:
          type === "checkbox" ? checked : newValue === "" ? "" : newValue,
      },
    }));
  };

  const handleFirstOrderChange = (field) => (e) => {
     const { type, checked, value } = e.target;
    let newValue = value;
    if (field === 'discountAmount' || field === 'minTripValue' || field === 'rewardExpiryDays' || field === 'limitCount') {
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
    let newValue = value;
    if (field === 'minTripValue' || field === 'discountPercent') {
        if (type !== 'checkbox') newValue = cleanNumber(value);
    }
    setConfig((prev) => ({
      ...prev,
      birthdayPromo: {
        ...(prev?.birthdayPromo || {}),
        [field]:
          type === "checkbox" ? checked : newValue === "" ? "" : newValue,
      },
    }));
  };

  const handlePlatformPromoChange = (field) => (e) => {
    const { type, checked, value } = e.target;
    let newValue = value;
    if (field === 'minTripValue') {
      if (type !== 'checkbox') newValue = cleanNumber(value);
    }
    setConfig((prev) => ({
      ...prev,
      platformPromo: {
        ...(prev?.platformPromo || {}),
        [field]:
          type === "checkbox" ? checked : newValue === "" ? "" : (field === 'discountPercent' ? Number(newValue) : newValue),
      },
    }));
  };

  const handleCashbackChange = (field) => (e) => {
    const { type, checked, value } = e.target;
    let newValue = value;
    if (field === 'percent' || field === 'minTripValue' || field === 'rewardExpiryDays' || field === 'maxPerWeekCustomer' || field === 'maxPerWeekRider') {
        if (type !== 'checkbox') newValue = cleanNumber(value);
    }
    setConfig((prev) => ({
      ...prev,
      cashback: {
        ...(prev?.cashback || {}),
        [field]:
          type === "checkbox" ? checked : newValue === "" ? "" : newValue,
      },
    }));
  };

  const handlePointRewardsChange = (field, subfield = null) => (e) => {
    const { type, checked, value } = e.target;
    let newValue = value;
    
    // Clean numeric values
    if (['kycRiderPoints', 'customerPoints', 'riderPoints', 'minTripValue'].includes(subfield || field)) {
      if (type !== 'checkbox') newValue = cleanNumber(value);
    }

    setConfig((prev) => {
      const currentPointRewards = prev?.pointRewards || {};
      
      if (subfield) {
        // Handling nested objects like orderPoints
        return {
          ...prev,
          pointRewards: {
            ...currentPointRewards,
            [field]: {
              ...(currentPointRewards[field] || {}),
              [subfield]: type === "checkbox" ? checked : newValue === "" ? "" : newValue
            }
          }
        };
      }

      return {
        ...prev,
        pointRewards: {
          ...currentPointRewards,
          [field]: type === "checkbox" ? checked : newValue === "" ? "" : newValue
        }
      };
    });
  };

  const handleLoyaltyEarningRateChange = (field) => (e) => {
    const { value } = e.target;
    const newValue = cleanNumber(value);
    setConfig((prev) => ({
      ...prev,
      loyaltyEarningRates: {
        ...(prev?.loyaltyEarningRates || {}),
        [field]: newValue === "" ? "" : newValue,
      },
    }));
  };



  const handleRiderMilestonesTopLevelChange = (field) => (e) => {
    const { type, checked, value } = e.target;
    let newValue = value;
    if (field === 'rewardExpiryDays' || field === 'minTripValue') {
      if (type !== 'checkbox') newValue = cleanNumber(value);
    }
    setConfig((prev) => ({
      ...prev,
      riderMilestones: {
        ...(prev?.riderMilestones || {}),
        [field]:
          type === "checkbox" ? checked : newValue,
      },
    }));
  };

  const handleRiderMilestoneChange = (index, field) => (e) => {
    const { value } = e.target;
    const newTiers = [...(config.riderMilestones?.tiers || [])];
    newTiers[index] = {
      ...newTiers[index],
      [field]: cleanNumber(value)
    };
    setConfig(prev => ({
      ...prev,
      riderMilestones: {
        ...prev.riderMilestones,
        tiers: newTiers
      }
    }));
  };

  const addMilestoneTier = () => {
    const newTiers = [...(config.riderMilestones?.tiers || []), { count: 0, reward: 0 }];
    setConfig(prev => ({
      ...prev,
      riderMilestones: {
        ...prev.riderMilestones,
        tiers: newTiers
      }
    }));
  };

  const removeMilestoneTier = (index) => {
    const newTiers = (config.riderMilestones?.tiers || []).filter((_, i) => i !== index);
    setConfig(prev => ({
      ...prev,
      riderMilestones: {
        ...prev.riderMilestones,
        tiers: newTiers
      }
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

  const togglePlatformPromoEnabled = () => {
    if (!config?.platformPromo || saving) return;
    const nextEnabled = !config.platformPromo.enabled;
    updatePlatformSection(
      { enabled: nextEnabled },
      nextEnabled ? "Platform promo enabled." : "Platform promo disabled."
    );
  };

  const togglePointRewardsEnabled = () => {
    if (!config?.pointRewards || savingLoyalty) return;
    const nextEnabled = !config.pointRewards.enabled;
    updatePointRewardsSection(
      { enabled: nextEnabled },
      nextEnabled ? "Point Rewards program enabled." : "Point Rewards program disabled."
    );
  };

  const toggleCashbackEnabled = () => {
    if (!config?.cashback || saving) return;
    const nextEnabled = !config.cashback.enabled;
    updateCashbackSection(
      { enabled: nextEnabled },
      nextEnabled ? "Cashback master switch enabled." : "Cashback master switch disabled."
    );
  };

  const toggleCustomerCashbackEnabled = () => {
    if (!config?.cashback || saving) return;
    const nextEnabled = !config.cashback.customerEnabled;
    updateCashbackSection(
      { customerEnabled: nextEnabled },
      nextEnabled ? "Customer cashback enabled." : "Customer cashback disabled."
    );
  };

  const toggleRiderCashbackEnabled = () => {
    if (!config?.cashback || saving) return;
    const nextEnabled = !config.cashback.riderEnabled;
    updateCashbackSection(
      { riderEnabled: nextEnabled },
      nextEnabled ? "Rider cashback enabled." : "Rider cashback disabled."
    );
  };

  const toggleRiderMilestonesEnabled = () => {
    if (!config?.riderMilestones || saving) return;
    const nextEnabled = !config.riderMilestones.enabled;
    updateRiderMilestonesSection(
      { enabled: nextEnabled },
      nextEnabled ? "Rider Milestones enabled." : "Rider Milestones disabled."
    );
  };

  const togglePointRewardsServiceEnabled = () => {
    if (!config?.pointRewards || savingLoyalty) return;
    const nextEnabled = !config.pointRewards.servicePointsEnabled;
    updatePointRewardsSection(
      { servicePointsEnabled: nextEnabled },
      nextEnabled ? "Service earning points enabled." : "Service earning points disabled."
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
            : Number(cleanNumber(config.referral.requiredTrips)),
        minTripValue:
          config.referral.minTripValue === ""
            ? undefined
            : Number(cleanNumber(config.referral.minTripValue)),
        rewardExpiryDays:
          config.referral.rewardExpiryDays === ""
            ? undefined
            : Number(config.referral.rewardExpiryDays),
        reoccurring: !!config.referral.reoccurring,
        maxPerWeek:
          config.referral.maxPerWeek === ""
            ? undefined
            : Number(cleanNumber(config.referral.maxPerWeek)),
        maxReferralsPerWeek:
          config.referral.maxReferralsPerWeek === ""
            ? undefined
            : Number(cleanNumber(config.referral.maxReferralsPerWeek)),
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
            : Number(cleanNumber(config.streak.requiredStreak)),
        minTripValue:
          config.streak.minTripValue === ""
            ? undefined
            : Number(cleanNumber(config.streak.minTripValue)),
        rewardExpiryDays:
          config.streak.rewardExpiryDays === ""
            ? undefined
            : Number(config.streak.rewardExpiryDays),
        reoccurring: !!config.streak.reoccurring,
        dailyLimit: !!config.streak.dailyLimit,
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
        minTripValue:
          config.customerGold.minTripValue === ""
            ? undefined
            : Number(cleanNumber(config.customerGold.minTripValue)),
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
        minTripValue:
          config.riderGold.minTripValue === ""
            ? undefined
            : Number(cleanNumber(config.riderGold.minTripValue)),
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
            : Number(cleanNumber(config.firstOrder.limitCount)),
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

  const handleUpdatePointRewards = async (e) => {
    e.preventDefault();
    if (!config?.pointRewards || !config?.loyaltyEarningRates) return;
    
    await updatePointRewardsSection(
      {
        enabled: !!config.pointRewards.enabled,
        kycRiderPoints: Number(cleanNumber(config.pointRewards.kycRiderPoints)),
        servicePointsEnabled: !!config.pointRewards.servicePointsEnabled,
        orderPoints: {
          enabled: !!config.pointRewards.orderPoints?.enabled,
          customerPoints: Number(cleanNumber(config.pointRewards.orderPoints?.customerPoints)),
          riderPoints: Number(cleanNumber(config.pointRewards.orderPoints?.riderPoints)),
          minTripValue: Number(cleanNumber(config.pointRewards.orderPoints?.minTripValue)),
        },
        loyaltyEarningRates: {
          airtime: Number(cleanNumber(config.loyaltyEarningRates.airtime)),
          data: Number(cleanNumber(config.loyaltyEarningRates.data)),
          electricity: Number(cleanNumber(config.loyaltyEarningRates.electricity)),
          cable: Number(cleanNumber(config.loyaltyEarningRates.cable)),
          betting: Number(cleanNumber(config.loyaltyEarningRates.betting)),
        }
      },
      "Point Reward settings saved."
    );
  };


  if (loading) {
    return (
      <div className="p-6 min-h-[400px] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading Promo Configuration...</p>
      </div>
    );
  }
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
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              🎁 First Order / New Joiner Promo <ExpiryBadge type="first_order_reward" />
            </h2>
            <div className="flex items-center mb-4">
              <Toggle
                enabled={!!config.firstOrder?.enabled}
                onToggle={toggleFirstOrderEnabled}
                label="Enable First Order Promo"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <ValidatedInput
                label="Discount Amount (₦)"
                value={config.firstOrder?.discountAmount}
                onChange={val => setConfig(prev => ({
                  ...prev,
                  firstOrder: { ...prev.firstOrder, discountAmount: val }
                }))}
                isCurrency={true}
              />
              <ValidatedInput
                label="First X Orders"
                value={config.firstOrder?.limitCount}
                onChange={val => setConfig(prev => ({
                  ...prev,
                  firstOrder: { ...prev.firstOrder, limitCount: val }
                }))}
                type="number"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <ValidatedInput
                  label="Minimum Trip Value (₦)"
                  value={config.firstOrder?.minTripValue}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    firstOrder: { ...prev.firstOrder, minTripValue: val }
                  }))}
                  isCurrency={true}
                />
                <p className="text-xs text-gray-500 mt-1">Trips below this amount do not count</p>
              </div>
              <div>
                <ValidatedInput
                  label="Reward Expiry (Days)"
                  value={config.firstOrder?.rewardExpiryDays}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    firstOrder: { ...prev.firstOrder, rewardExpiryDays: val }
                  }))}
                  type="number"
                />
                <p className="text-xs text-gray-500 mt-1">Days before reward expires. Users get warned at <b>7 days</b> and <b>3 days</b>.</p>
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
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              💰 Referral Rewards <ExpiryBadge type="referral_reward" />
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
                <ValidatedInput
                  label="Reward amount (₦)"
                  value={config.referral?.rewardAmount || 500}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    referral: { ...prev.referral, rewardAmount: val }
                  }))}
                  isCurrency={true}
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: ₦500</p>
              </div>
              <ValidatedInput
                label="Required trips per referee"
                value={config.referral?.requiredTrips}
                onChange={val => setConfig(prev => ({
                  ...prev,
                  referral: { ...prev.referral, requiredTrips: val }
                }))}
                type="number"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <ValidatedInput
                  label="Minimum Trip Value (₦)"
                  value={config.referral?.minTripValue}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    referral: { ...prev.referral, minTripValue: val }
                  }))}
                  isCurrency={true}
                />
                <p className="text-xs text-gray-500 mt-1">Trips below this amount won't count</p>
              </div>
              <div>
                <ValidatedInput
                  label="Weekly Referral Reward Cap (₦)"
                  value={config.referral?.maxPerWeek || 2000}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    referral: { ...prev.referral, maxPerWeek: val }
                  }))}
                  isCurrency={true}
                />
                <p className="text-xs text-gray-500 mt-1">Maximum referral rewards a user can earn per week. Recommended: ₦2,000</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <ValidatedInput
                  label="Max Referrals Per Week (Users)"
                  value={config.referral?.maxReferralsPerWeek || 4}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    referral: { ...prev.referral, maxReferralsPerWeek: val }
                  }))}
                  type="number"
                />
                <p className="text-xs text-gray-500 mt-1">Limit on the number of successful referrals rewarded per week. Recommended: 4</p>
              </div>
              <div>
                <ValidatedInput
                  label="Reward Expiry (Days)"
                  value={config.referral?.rewardExpiryDays || 7}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    referral: { ...prev.referral, rewardExpiryDays: val }
                  }))}
                  type="number"
                />
                <p className="text-xs text-gray-500 mt-1">Days before reward expires.</p>
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
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              🔥 Streak Bonus <ExpiryBadge type="streak_bonus" />
            </h2>
            <div className="flex items-center mb-4">
              <Toggle
                enabled={!!config.streak?.enabled}
                onToggle={toggleStreakEnabled}
                label="Enable streak bonus"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <ValidatedInput
                label="Bonus amount (₦)"
                value={config.streak?.bonusAmount}
                onChange={val => setConfig(prev => ({
                  ...prev,
                  streak: { ...prev.streak, bonusAmount: val }
                }))}
                isCurrency={true}
              />
              <ValidatedInput
                label="Required streak (consecutive accepts)"
                value={config.streak?.requiredStreak}
                onChange={val => setConfig(prev => ({
                  ...prev,
                  streak: { ...prev.streak, requiredStreak: val }
                }))}
                type="number"
              />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <ValidatedInput
                  label="Minimum Trip Value (₦)"
                  value={config.streak?.minTripValue}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    streak: { ...prev.streak, minTripValue: val }
                  }))}
                  isCurrency={true}
                />
                 <p className="text-xs text-gray-500 mt-1">Trips below this amount do not count</p>
              </div>
              <div>
                <ValidatedInput
                  label="Reward Expiry (Days)"
                  value={config.streak?.rewardExpiryDays}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    streak: { ...prev.streak, rewardExpiryDays: val }
                  }))}
                  type="number"
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
            <div className="mb-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!config.streak?.dailyLimit}
                  onChange={handleStreakChange("dailyLimit")}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
                <span className="text-gray-700 font-semibold">
                  Daily Limit (once per day max)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-8">
                {config.streak?.dailyLimit
                  ? "Users can only earn one streak bonus per calendar day"
                  : "No daily limit on streak bonuses"}
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
              <ValidatedInput
                label="Required trips"
                value={config.customerGold?.requiredTrips}
                onChange={val => setConfig(prev => ({
                  ...prev,
                  customerGold: { ...prev.customerGold, requiredTrips: val }
                }))}
                type="number"
              />
              <ValidatedInput
                label="Window days"
                value={config.customerGold?.windowDays}
                onChange={val => setConfig(prev => ({
                  ...prev,
                  customerGold: { ...prev.customerGold, windowDays: val }
                }))}
                type="number"
              />
              <div>
                <ValidatedInput
                  label="Duration days"
                  value={config.customerGold?.durationDays}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    customerGold: { ...prev.customerGold, durationDays: val }
                  }))}
                  type="number"
                />
                <p className="text-xs text-gray-500 mt-1">Days status lasts. Set to <b>0</b> for permanent status.</p>
              </div>
              <div>
                <ValidatedInput
                  label="Discount percent (Trip Price)"
                  value={config.customerGold?.discountPercent}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    customerGold: { ...prev.customerGold, discountPercent: val }
                  }))}
                  type="number"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: 5%</p>
              </div>
              <div className="md:col-span-2">
                <ValidatedInput
                  label="Minimum Trip Value (₦)"
                  value={config.customerGold?.minTripValue}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    customerGold: { ...prev.customerGold, minTripValue: val }
                  }))}
                  isCurrency={true}
                />
                <p className="text-xs text-gray-500 mt-1">Discounts will not apply to orders below this amount</p>
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
            {/* Grandfathering Info */}
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded mb-4 text-xs">
                <p className="text-blue-700">
                    <b>🛡️ Grandfathering Active:</b> Disabling this promotion only prevents <i>new</i> users from unlocking it. Users who already have Gold Status will keep their benefits until their window expires.
                </p>
                <p className="text-blue-700 mt-2">
                    <b>🔔 Weekly Reminders:</b> Active Gold users receive a weekly push notification reminding them of their discount.
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
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              🚴 Rider Gold Status <ExpiryBadge type="rider_gold" />
            </h2>
            <div className="flex items-center mb-4">
              <Toggle
                enabled={!!config.riderGold?.enabled}
                onToggle={toggleRiderGoldEnabled}
                label="Enable Rider Gold Status"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <ValidatedInput
                label="Required deliveries"
                value={config.riderGold?.requiredDeliveries}
                onChange={val => setConfig(prev => ({
                  ...prev,
                  riderGold: { ...prev.riderGold, requiredDeliveries: val }
                }))}
                type="number"
              />
              <ValidatedInput
                label="Window days"
                value={config.riderGold?.windowDays}
                onChange={val => setConfig(prev => ({
                  ...prev,
                  riderGold: { ...prev.riderGold, windowDays: val }
                }))}
                type="number"
              />
              <div>
                <ValidatedInput
                  label="Duration days"
                  value={config.riderGold?.durationDays}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    riderGold: { ...prev.riderGold, durationDays: val }
                  }))}
                  type="number"
                />
                <p className="text-xs text-gray-500 mt-1">Days status lasts. Set to <b>0</b> for permanent status.</p>
              </div>
              <div>
                <ValidatedInput
                  label="Discount percent (Commission Waiver)"
                  value={config.riderGold?.discountPercent}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    riderGold: { ...prev.riderGold, discountPercent: val }
                  }))}
                  type="number"
                />
                 <p className="text-xs text-gray-500 mt-1">Recommended: 10%</p>
              </div>
              <div className="md:col-span-2">
                <ValidatedInput
                  label="Minimum Trip Value (₦)"
                  value={config.riderGold?.minTripValue}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    riderGold: { ...prev.riderGold, minTripValue: val }
                  }))}
                  isCurrency={true}
                />
                <p className="text-xs text-gray-500 mt-1">Commission waivers will not apply to orders below this amount</p>
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
            {/* Grandfathering Info */}
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded mb-4 text-xs">
                <p className="text-blue-700">
                    <b>🛡️ Grandfathering Active:</b> Disabling this promotion only prevents <i>new</i> riders from unlocking it. Riders with active status keep their commission waivers until their window expires.
                </p>
                <p className="text-blue-700 mt-2" >
                    <b>🔔 Weekly Reminders:</b> Active Gold riders receive a weekly performance reminder.
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

          {/* Platform Promo Section */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!config?.platformPromo) return;
              updatePlatformSection(
                {
                  enabled: !!config.platformPromo.enabled,
                  discountPercent: config.platformPromo.discountPercent,
                  minTripValue: config.platformPromo.minTripValue === "" ? undefined : Number(cleanNumber(config.platformPromo.minTripValue)),
                },
                "Platform promo settings saved."
              );
            }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              🌍 Platform Promo
            </h2>
            <div className="flex items-center mb-4">
              <Toggle
                enabled={!!config.platformPromo?.enabled}
                onToggle={togglePlatformPromoEnabled}
                label="Enable Platform Promo"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <ValidatedInput
                label="Discount Percent (%)"
                value={config.platformPromo?.discountPercent}
                onChange={val => setConfig(prev => ({
                  ...prev,
                  platformPromo: { ...prev.platformPromo, discountPercent: val }
                }))}
                type="number"
              />
              <ValidatedInput
                label="Minimum Trip Value (₦)"
                value={config.platformPromo?.minTripValue}
                onChange={val => setConfig(prev => ({
                  ...prev,
                  platformPromo: { ...prev.platformPromo, minTripValue: val }
                }))}
                isCurrency={true}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Platform Promo settings
            </button>
          </form>

          {/* Birthday Promo Section */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!config?.birthdayPromo) return;
              updateBirthdaySection(
                {
                  enabled: !!config.birthdayPromo.enabled,
                  discountPercent: config.birthdayPromo.discountPercent,
                  minTripValue: config.birthdayPromo.minTripValue === "" ? undefined : Number(cleanNumber(config.birthdayPromo.minTripValue)),
                },
                "Birthday promo settings saved."
              );
            }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              🎂 Birthday Promo
            </h2>
            <div className="flex items-center mb-4">
              <Toggle
                enabled={!!config.birthdayPromo?.enabled}
                onToggle={toggleBirthdayEnabled}
                label="Enable Birthday Promo"
              />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <ValidatedInput
                label="Discount Percent (%)"
                value={config.birthdayPromo?.discountPercent}
                onChange={val => setConfig(prev => ({
                  ...prev,
                  birthdayPromo: { ...prev.birthdayPromo, discountPercent: val }
                }))}
                type="number"
              />
              <ValidatedInput
                label="Minimum Trip Value (₦)"
                value={config.birthdayPromo?.minTripValue}
                onChange={val => setConfig(prev => ({
                  ...prev,
                  birthdayPromo: { ...prev.birthdayPromo, minTripValue: val }
                }))}
                isCurrency={true}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Birthday settings
            </button>
          </form>

          {/* Point Rewards Management Section (Unified) */}
          <form
            onSubmit={handleUpdatePointRewards}
            className="bg-white rounded-lg shadow-md p-6 border border-blue-50"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                🏆 Point Rewards Management
                <span className="ml-3 px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full uppercase tracking-widest">Unified System</span>
              </h2>
              <Toggle
                enabled={!!config.pointRewards?.enabled}
                onToggle={togglePointRewardsEnabled}
                label="Master System Switch"
              />
            </div>

            {/* KYC & Identity Section */}
            <div className="mb-10 p-5 bg-gray-50 rounded-xl border border-gray-100">
               <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider flex items-center">
                 🆔 KYC & Identity Rewards
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ValidatedInput
                    label="Rider KYC Reward (Tier 2)"
                    value={config.pointRewards?.kycRiderPoints}
                    onChange={handlePointRewardsChange("kycRiderPoints")}
                    isCurrency={false}
                    placeholder="e.g. 1,000"
                  />
                  <div className="flex items-end pb-2">
                    <p className="text-xs text-gray-500 italic">Points awarded upon manual Admin approval of identity documents.</p>
                  </div>
               </div>
            </div>

            {/* Order Earning Section */}
            <div className="mb-10 p-5 bg-gray-50 rounded-xl border border-gray-100">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                   📦 Order Completion Points
                 </h3>
                 <Toggle
                   enabled={!!config.pointRewards?.orderPoints?.enabled}
                   onToggle={() => setConfig(prev => ({
                      ...prev,
                      pointRewards: {
                        ...prev.pointRewards,
                        orderPoints: { ...prev.pointRewards.orderPoints, enabled: !prev.pointRewards.orderPoints.enabled }
                      }
                   }))}
                   label="Enable Order Points"
                 />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ValidatedInput
                    label="Points per Trip (Customer)"
                    value={config.pointRewards?.orderPoints?.customerPoints}
                    onChange={handlePointRewardsChange("orderPoints", "customerPoints")}
                    type="number"
                    placeholder="e.g. 1"
                  />
                  <ValidatedInput
                    label="Points per Trip (Rider)"
                    value={config.pointRewards?.orderPoints?.riderPoints}
                    onChange={handlePointRewardsChange("orderPoints", "riderPoints")}
                    type="number"
                    placeholder="e.g. 1"
                  />
                  <ValidatedInput
                    label="Min Trip Value (₦)"
                    value={config.pointRewards?.orderPoints?.minTripValue}
                    onChange={handlePointRewardsChange("orderPoints", "minTripValue")}
                    isCurrency={true}
                    placeholder="e.g. 1,500"
                  />
               </div>
               <p className="text-xs text-gray-500 mt-4">Points are awarded instantly upon delivery completion to the spendable Reward Balance.</p>
            </div>

            {/* Service Earning Section */}
            <div className="mb-10 p-5 bg-gray-50 rounded-xl border border-gray-100">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                   ⚡ Service Payment Points (Loyalty)
                 </h3>
                 <Toggle
                   enabled={!!config.pointRewards?.servicePointsEnabled}
                   onToggle={togglePointRewardsServiceEnabled}
                   label="Enable Service Points"
                 />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <ValidatedInput
                    label="Airtime (Points)"
                    value={config.loyaltyEarningRates?.airtime}
                    onChange={handleLoyaltyEarningRateChange("airtime")}
                    placeholder="2"
                  />
                  <ValidatedInput
                    label="Data (Points)"
                    value={config.loyaltyEarningRates?.data}
                    onChange={handleLoyaltyEarningRateChange("data")}
                    placeholder="3"
                  />
                  <ValidatedInput
                    label="Electricity (Points)"
                    value={config.loyaltyEarningRates?.electricity}
                    onChange={handleLoyaltyEarningRateChange("electricity")}
                    placeholder="5"
                  />
                  <ValidatedInput
                    label="Cable TV (Points)"
                    value={config.loyaltyEarningRates?.cable}
                    onChange={handleLoyaltyEarningRateChange("cable")}
                    placeholder="5"
                  />
                  <ValidatedInput
                    label="Betting (Points)"
                    value={config.loyaltyEarningRates?.betting}
                    onChange={handleLoyaltyEarningRateChange("betting")}
                    placeholder="2"
                  />
               </div>
               <p className="text-xs text-gray-500 mt-4">Fixed points earned for every successful bill payment using Deposit or Earnings balance.</p>
            </div>

            <button
              type="submit"
              disabled={savingLoyalty}
              className="w-full md:w-auto bg-gray-800 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50 flex items-center justify-center shadow-lg"
            >
              {savingLoyalty && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {savingLoyalty ? "Syncing Unified Points..." : "Save Unified Point Rewards"}
            </button>
          </form>

          {/* Cashback Savings Section */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!config?.cashback) return;
              updateCashbackSection(
                {
                  enabled: !!config.cashback.enabled,
                  customerEnabled: !!config.cashback.customerEnabled,
                  riderEnabled: !!config.cashback.riderEnabled,
                  percent: config.cashback.percent === "" ? undefined : Number(config.cashback.percent),
                  minTripValue: config.cashback.minTripValue === "" ? undefined : Number(cleanNumber(config.cashback.minTripValue)),
                  rewardExpiryDays: config.cashback.rewardExpiryDays === "" ? undefined : Number(cleanNumber(config.cashback.rewardExpiryDays)),
                  reoccurring: !!config.cashback.reoccurring,
                  maxPerWeekCustomer:
                    config.cashback.maxPerWeekCustomer === ""
                      ? undefined
                      : Number(cleanNumber(config.cashback.maxPerWeekCustomer)),
                  maxPerWeekRider:
                    config.cashback.maxPerWeekRider === ""
                      ? undefined
                      : Number(cleanNumber(config.cashback.maxPerWeekRider)),
                },
                "Cashback settings saved."
              );
            }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex flex-col space-y-4 mb-4">
              <Toggle
                enabled={!!config.cashback?.enabled}
                onToggle={toggleCashbackEnabled}
                label="Master Switch (Global Cashback)"
              />
              <p className="text-xs text-gray-500 italic">
                Note: The Master Switch must be <b>ON</b> for any role-specific cashback to work.
              </p>
              
              {/* Tab Switcher */}
              <div className="flex border-b border-gray-200 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveCashbackTab("customer")}
                  className={`py-2 px-4 text-sm font-medium transition-colors ${
                    activeCashbackTab === "customer"
                      ? "border-b-2 border-accent-blue text-accent-blue"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Customer Settings
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCashbackTab("rider")}
                  className={`py-2 px-4 text-sm font-medium transition-colors ${
                    activeCashbackTab === "rider"
                      ? "border-b-2 border-accent-blue text-accent-blue"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Rider Settings
                </button>
              </div>
            </div>

            {activeCashbackTab === "customer" ? (
              <div className="space-y-4 animate-fadeIn">
                <Toggle
                  enabled={!!config.cashback?.customerEnabled}
                  onToggle={toggleCustomerCashbackEnabled}
                  label="Enable for Customers"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <ValidatedInput
                      label="Weekly Limit (₦)"
                      value={config.cashback?.maxPerWeekCustomer}
                      onChange={val => setConfig(prev => ({
                        ...prev,
                        cashback: { ...prev.cashback, maxPerWeekCustomer: val }
                      }))}
                      isCurrency={true}
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: ₦1,000</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <Toggle
                  enabled={!!config.cashback?.riderEnabled}
                  onToggle={toggleRiderCashbackEnabled}
                  label="Enable for Riders"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <ValidatedInput
                      label="Weekly Limit (₦)"
                      value={config.cashback?.maxPerWeekRider}
                      onChange={val => setConfig(prev => ({
                        ...prev,
                        cashback: { ...prev.cashback, maxPerWeekRider: val }
                      }))}
                      isCurrency={true}
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: ₦1,500</p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 my-6 pt-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wider">Global Config (Affects both)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <ValidatedInput
                    label="Cashback Percentage (%)"
                    value={config.cashback?.percent}
                    onChange={val => setConfig(prev => ({
                      ...prev,
                      cashback: { ...prev.cashback, percent: val }
                    }))}
                    type="number"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Percentage of trip price awarded back (e.g., 1 for 1%). Recommended: 1%.
                  </p>
                </div>
                <div>
                  <ValidatedInput
                    label="Min Trip Value for eligibility (₦)"
                    value={config.cashback?.minTripValue}
                    onChange={val => setConfig(prev => ({
                      ...prev,
                      cashback: { ...prev.cashback, minTripValue: val }
                    }))}
                    isCurrency={true}
                  />
                  <p className="text-xs text-gray-500 mt-1">Orders below this amount will not earn cashback. Recommended: ₦1,500</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <ValidatedInput
                    label="Reward Expiry (Days)"
                    value={config.cashback?.rewardExpiryDays}
                    onChange={val => setConfig(prev => ({
                      ...prev,
                      cashback: { ...prev.cashback, rewardExpiryDays: val }
                    }))}
                    type="number"
                  />
                  <p className="text-xs text-gray-500 mt-1">Days before reward funds expire. Recommended: 7 days</p>
                </div>
                <div className="flex items-center pt-8">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!config.cashback?.reoccurring}
                      onChange={handleCashbackChange("reoccurring")}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      disabled={savingCashback}
                    />
                    <span className="text-gray-700 font-semibold">
                      Reoccurring (Apply on every trip)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingCashback}
              className="mt-4 bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingCashback ? "Saving..." : "Save Cashback settings"}
            </button>
          </form>

          {/* Rider Milestones Section */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!config?.riderMilestones) return;
              updateRiderMilestonesSection(
                {
                  enabled: !!config.riderMilestones.enabled,
                  tiers: (config.riderMilestones.tiers || []).map(t => ({ count: Number(t.count), reward: Number(t.reward) })),
                  rewardExpiryDays: config.riderMilestones.rewardExpiryDays === "" ? undefined : Number(config.riderMilestones.rewardExpiryDays),
                  reoccurring: !!config.riderMilestones.reoccurring,
                  minTripValue: config.riderMilestones.minTripValue === "" ? undefined : Number(cleanNumber(config.riderMilestones.minTripValue)),
                },
                "Rider Milestones saved."
              );
            }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              🏁 Rider Performance Milestones <ExpiryBadge type="milestone_bonus" />
            </h2>
            <div className="flex items-center mb-4">
              <Toggle
                enabled={!!config.riderMilestones?.enabled}
                onToggle={toggleRiderMilestonesEnabled}
                label="Enable Rider Milestones"
              />
            </div>
            
            <div className="space-y-4 mb-4">
              {(config.riderMilestones?.tiers || []).map((tier, index) => (
                <div key={index} className="flex flex-wrap items-end gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-gray-600 text-xs font-bold mb-1 uppercase">
                      Required Trips
                    </label>
                    <input
                      type="text"
                      value={formatNumber(tier.count)}
                      onChange={handleRiderMilestoneChange(index, "count")}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <ValidatedInput
                      label="Reward Amount (₦)"
                      value={tier.reward}
                      onChange={val => {
                        const newTiers = [...config.riderMilestones.tiers];
                        newTiers[index] = { ...newTiers[index], reward: val };
                        setConfig(prev => ({
                          ...prev,
                          riderMilestones: { ...prev.riderMilestones, tiers: newTiers }
                        }));
                      }}
                      isCurrency={true}
                      className="w-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMilestoneTier(index)}
                    className="p-2 text-red-500 hover:text-red-700 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addMilestoneTier}
                className="text-blue-600 font-semibold text-sm hover:underline"
              >
                + Add Milestone Tier
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <ValidatedInput
                  label="Reward Expiry (Days)"
                  value={config.riderMilestones?.rewardExpiryDays}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    riderMilestones: { ...prev.riderMilestones, rewardExpiryDays: val }
                  }))}
                  type="number"
                />
                <p className="text-xs text-gray-500 mt-1">Days before reward funds expire</p>
              </div>
              <div>
                <ValidatedInput
                  label="Minimum Trip Value (₦)"
                  value={config.riderMilestones?.minTripValue}
                  onChange={val => setConfig(prev => ({
                    ...prev,
                    riderMilestones: { ...prev.riderMilestones, minTripValue: val }
                  }))}
                  isCurrency={true}
                />
                 <p className="text-xs text-gray-500 mt-1">Order must be at least this value to count towards milestone goals</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!config.riderMilestones?.reoccurring}
                  onChange={handleRiderMilestonesTopLevelChange("reoccurring")}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={savingRiderMilestones}
                />
                <span className="text-gray-700 font-semibold">
                  Reoccurring (Resets requirement target after final tier is conquered)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={savingRiderMilestones}
              className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingRiderMilestones ? "Saving..." : "Save Rider Milestones"}
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


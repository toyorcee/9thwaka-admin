import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  fetchPromoConfig,
  toggleAllPromos,
  updateGoldStatusPromo,
  updateReferralPromo,
  updateStreakPromo,
} from '../services/promoApi';

const Toggle = ({ enabled, onToggle, label }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center space-x-3 focus:outline-none"
    >
      <div
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          enabled ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
      <span className="text-gray-800 font-semibold text-sm">{label}</span>
    </button>
  );
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
        setError('Failed to fetch promo configuration.');
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

  const updateReferralSection = async (payload, successText) => {
    setSaving(true);
    try {
      const data = await updateReferralPromo(payload);
      setConfig((prev) => ({
        ...prev,
        referral: data.config,
      }));
      const message =
        successText || 'Promo configuration updated successfully.';
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError('Failed to update promo configuration.');
      toast.error('Failed to update promo configuration.');
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
        successText || 'Promo configuration updated successfully.';
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError('Failed to update promo configuration.');
      toast.error('Failed to update promo configuration.');
    } finally {
      setSaving(false);
    }
  };

  const updateGoldStatusSection = async (payload, successText) => {
    setSaving(true);
    try {
      const data = await updateGoldStatusPromo(payload);
      setConfig((prev) => ({
        ...prev,
        goldStatus: data.config,
      }));
      const message =
        successText || 'Promo configuration updated successfully.';
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError('Failed to update promo configuration.');
      toast.error('Failed to update promo configuration.');
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
        goldStatus: { ...(prev?.goldStatus || {}), enabled },
      }));
      const message = enabled
        ? 'All promos enabled successfully.'
        : 'All promos disabled.';
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      setError('Failed to toggle promos.');
      toast.error('Failed to toggle promos.');
    } finally {
      setSaving(false);
    }
  };

  const handleReferralChange = (field) => (e) => {
    const { type, checked, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      referral: {
        ...(prev?.referral || {}),
        [field]:
          type === 'checkbox'
            ? checked
            : value === ''
            ? ''
            : Number(value),
      },
    }));
  };

  const handleStreakChange = (field) => (e) => {
    const { type, checked, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      streak: {
        ...(prev?.streak || {}),
        [field]:
          type === 'checkbox'
            ? checked
            : value === ''
            ? ''
            : Number(value),
      },
    }));
  };

  const handleGoldStatusChange = (field) => (e) => {
    const { type, checked, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      goldStatus: {
        ...(prev?.goldStatus || {}),
        [field]:
          type === 'checkbox'
            ? checked
            : value === ''
            ? ''
            : Number(value),
      },
    }));
  };

  const toggleReferralEnabled = () => {
    if (!config?.referral || saving) return;
    const nextEnabled = !config.referral.enabled;
    updateReferralSection(
      { enabled: nextEnabled },
      nextEnabled ? 'Referral promo enabled.' : 'Referral promo disabled.'
    );
  };

  const toggleStreakEnabled = () => {
    if (!config?.streak || saving) return;
    const nextEnabled = !config.streak.enabled;
    updateStreakSection(
      { enabled: nextEnabled },
      nextEnabled ? 'Streak bonus promo enabled.' : 'Streak bonus promo disabled.'
    );
  };

  const toggleGoldStatusEnabled = () => {
    if (!config?.goldStatus || saving) return;
    const nextEnabled = !config.goldStatus.enabled;
    updateGoldStatusSection(
      { enabled: nextEnabled },
      nextEnabled ? 'Gold Status promo enabled.' : 'Gold Status promo disabled.'
    );
  };

  const handleUpdateReferral = async (e) => {
    e.preventDefault();
    if (!config?.referral) return;
    await updateReferralSection(
      {
        enabled: !!config.referral.enabled,
        rewardAmount:
          config.referral.rewardAmount === ''
            ? undefined
            : Number(config.referral.rewardAmount),
        requiredTrips:
          config.referral.requiredTrips === ''
            ? undefined
            : Number(config.referral.requiredTrips),
      },
      'Referral settings saved.'
    );
  };

  const handleUpdateStreak = async (e) => {
    e.preventDefault();
    if (!config?.streak) return;
    await updateStreakSection(
      {
        enabled: !!config.streak.enabled,
        bonusAmount:
          config.streak.bonusAmount === ''
            ? undefined
            : Number(config.streak.bonusAmount),
        requiredStreak:
          config.streak.requiredStreak === ''
            ? undefined
            : Number(config.streak.requiredStreak),
      },
      'Streak bonus settings saved.'
    );
  };

  const handleUpdateGoldStatus = async (e) => {
    e.preventDefault();
    if (!config?.goldStatus) return;
    await updateGoldStatusSection(
      {
        enabled: !!config.goldStatus.enabled,
        requiredRides:
          config.goldStatus.requiredRides === ''
            ? undefined
            : Number(config.goldStatus.requiredRides),
        windowDays:
          config.goldStatus.windowDays === ''
            ? undefined
            : Number(config.goldStatus.windowDays),
        durationDays:
          config.goldStatus.durationDays === ''
            ? undefined
            : Number(config.goldStatus.durationDays),
        discountPercent:
          config.goldStatus.discountPercent === ''
            ? undefined
            : Number(config.goldStatus.discountPercent),
      },
      'Gold Status settings saved.'
    );
  };

  if (loading) return <div className="text-gray-800">Loading...</div>;
  if (error)
    return (
      <div className="p-6 h-full">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Promo Configuration
        </h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );

  return (
    <div className="p-6 h-full">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Promo Configuration</h1>

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
            onSubmit={handleUpdateReferral}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Referral Promo
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
                  type="number"
                  min="0"
                  name="referralRewardAmount"
                  value={config.referral?.rewardAmount ?? ''}
                  onChange={handleReferralChange('rewardAmount')}
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
                  value={config.referral?.requiredTrips ?? ''}
                  onChange={handleReferralChange('requiredTrips')}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
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
              Streak Bonus Promo
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
                  type="number"
                  min="0"
                  name="streakBonusAmount"
                  value={config.streak?.bonusAmount ?? ''}
                  onChange={handleStreakChange('bonusAmount')}
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
                  value={config.streak?.requiredStreak ?? ''}
                  onChange={handleStreakChange('requiredStreak')}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
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
            onSubmit={handleUpdateGoldStatus}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Gold Status Promo
            </h2>
            <div className="flex items-center mb-4">
              <Toggle
                enabled={!!config.goldStatus?.enabled}
                onToggle={toggleGoldStatusEnabled}
                label="Enable Gold Status"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Required rides
                </label>
                <input
                  type="number"
                  min="1"
                  name="goldRequiredRides"
                  value={config.goldStatus?.requiredRides ?? ''}
                  onChange={handleGoldStatusChange('requiredRides')}
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
                  name="goldWindowDays"
                  value={config.goldStatus?.windowDays ?? ''}
                  onChange={handleGoldStatusChange('windowDays')}
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
                  name="goldDurationDays"
                  value={config.goldStatus?.durationDays ?? ''}
                  onChange={handleGoldStatusChange('durationDays')}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Discount percent
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="goldDiscountPercent"
                  value={config.goldStatus?.discountPercent ?? ''}
                  onChange={handleGoldStatusChange('discountPercent')}
                  className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Gold Status settings
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

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import {
  changePassword as changePasswordApi,
  fetchAdminSettings,
  updateAdminSettings,
} from '../services/settingsApi';

const Settings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [commissionRate, setCommissionRate] = useState('');
  const [commissionError, setCommissionError] = useState(null);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [commissionSuccessMessage, setCommissionSuccessMessage] = useState(null);
  const [defaultSearchRadiusKm, setDefaultSearchRadiusKm] = useState('');
  const [maxAllowedRadiusKm, setMaxAllowedRadiusKm] = useState('');
  const [radiusError, setRadiusError] = useState(null);
  const [radiusSaving, setRadiusSaving] = useState(false);
  const [radiusSuccessMessage, setRadiusSuccessMessage] = useState(null);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = setTimeout(() => {
      setSuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    if (!commissionSuccessMessage) return;
    const timeout = setTimeout(() => {
      setCommissionSuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [commissionSuccessMessage]);

  useEffect(() => {
    if (!radiusSuccessMessage) return;
    const timeout = setTimeout(() => {
      setRadiusSuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [radiusSuccessMessage]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setCommissionLoading(true);
        setCommissionError(null);
        setRadiusError(null);
        const data = await fetchAdminSettings();
        const rate = data?.settings?.commissionRate;
        if (rate !== undefined && rate !== null) {
          setCommissionRate(String(rate));
        } else {
          setCommissionRate('');
        }
        const system = data?.settings?.system;
        if (
          system &&
          system.defaultSearchRadiusKm !== undefined &&
          system.defaultSearchRadiusKm !== null
        ) {
          setDefaultSearchRadiusKm(String(system.defaultSearchRadiusKm));
        } else {
          setDefaultSearchRadiusKm('');
        }
        if (
          system &&
          system.maxAllowedRadiusKm !== undefined &&
          system.maxAllowedRadiusKm !== null
        ) {
          setMaxAllowedRadiusKm(String(system.maxAllowedRadiusKm));
        } else {
          setMaxAllowedRadiusKm('');
        }
      } catch (e) {
        setCommissionError('Failed to load commission settings.');
      } finally {
        setCommissionLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    try {
      setSaving(true);
      await changePasswordApi({ currentPassword, newPassword });
      setSuccessMessage('Password updated successfully.');
      toast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to update password.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCommissionSubmit = async (e) => {
    e.preventDefault();
    setCommissionError(null);
    setCommissionSuccessMessage(null);

    if (commissionRate === '') {
      setCommissionError('Commission rate is required.');
      return;
    }

    const value = Number(commissionRate);
    if (Number.isNaN(value)) {
      setCommissionError('Commission rate must be a valid number.');
      return;
    }

    if (value < 0 || value > 100) {
      setCommissionError('Commission rate must be between 0 and 100.');
      return;
    }

    try {
      setCommissionSaving(true);
      const payload = {
        commissionRate: value,
      };
      const data = await updateAdminSettings(payload);
      const updatedRate = data?.settings?.commissionRate;
      if (updatedRate !== undefined && updatedRate !== null) {
        setCommissionRate(String(updatedRate));
      }
      setCommissionSuccessMessage('Commission rate updated successfully.');
      toast.success('Commission rate updated successfully.');
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to update commission rate.';
      setCommissionError(message);
      toast.error(message);
    } finally {
      setCommissionSaving(false);
    }
  };

  const handleRadiusSubmit = async (e) => {
    e.preventDefault();
    setRadiusError(null);
    setRadiusSuccessMessage(null);

    if (defaultSearchRadiusKm === '' || maxAllowedRadiusKm === '') {
      setRadiusError('Both radius values are required.');
      return;
    }

    const defaultValue = Number(defaultSearchRadiusKm);
    const maxValue = Number(maxAllowedRadiusKm);

    if (Number.isNaN(defaultValue) || Number.isNaN(maxValue)) {
      setRadiusError('Radius values must be valid numbers.');
      return;
    }

    if (defaultValue <= 0 || maxValue <= 0) {
      setRadiusError('Radius values must be greater than 0.');
      return;
    }

    if (defaultValue > maxValue) {
      setRadiusError('Default radius cannot be greater than maximum radius.');
      return;
    }

    try {
      setRadiusSaving(true);
      const payload = {
        system: {
          defaultSearchRadiusKm: defaultValue,
          maxAllowedRadiusKm: maxValue,
        },
      };
      const data = await updateAdminSettings(payload);
      const system = data?.settings?.system;
      if (
        system &&
        system.defaultSearchRadiusKm !== undefined &&
        system.defaultSearchRadiusKm !== null
      ) {
        setDefaultSearchRadiusKm(String(system.defaultSearchRadiusKm));
      }
      if (
        system &&
        system.maxAllowedRadiusKm !== undefined &&
        system.maxAllowedRadiusKm !== null
      ) {
        setMaxAllowedRadiusKm(String(system.maxAllowedRadiusKm));
      }
      setRadiusSuccessMessage('Search radius settings updated successfully.');
      toast.success('Search radius settings updated successfully.');
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to update search radius settings.';
      setRadiusError(message);
      toast.error(message);
    } finally {
      setRadiusSaving(false);
    }
  };

  const passwordsMismatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword !== confirmPassword;

  return (
    <div className="p-6 h-full flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Settings</h1>

        <div className="mt-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 w-full">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Rider Commission
              </h2>
              {commissionError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {commissionError}
                </div>
              )}
              {commissionSuccessMessage && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                  {commissionSuccessMessage}
                </div>
              )}
              <form onSubmit={handleCommissionSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Commission rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    placeholder="Enter commission rate"
                    disabled={commissionLoading || commissionSaving}
                  />
                </div>
                <button
                  type="submit"
                  disabled={commissionLoading || commissionSaving}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {commissionSaving ? 'Saving...' : 'Save Commission Rate'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 w-full">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Rider Search Radius
              </h2>
              {radiusError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {radiusError}
                </div>
              )}
              {radiusSuccessMessage && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                  {radiusSuccessMessage}
                </div>
              )}
              <form onSubmit={handleRadiusSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Default rider search radius (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={defaultSearchRadiusKm}
                    onChange={(e) => setDefaultSearchRadiusKm(e.target.value)}
                    className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    placeholder="Enter default radius in km"
                    disabled={radiusSaving}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Maximum allowed rider radius (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={maxAllowedRadiusKm}
                    onChange={(e) => setMaxAllowedRadiusKm(e.target.value)}
                    className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    placeholder="Enter maximum radius in km"
                    disabled={radiusSaving}
                  />
                </div>
                <button
                  type="submit"
                  disabled={radiusSaving}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {radiusSaving ? 'Saving...' : 'Save Radius Settings'}
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 w-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Change Password
            </h2>
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                {successMessage}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Current password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-3 pr-10 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 pr-10 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full p-3 pr-10 bg-gray-50 text-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue ${
                      passwordsMismatch ? 'border-red-400' : 'border-gray-300'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && newPassword.length > 0 && (
                  <p
                    className={`mt-1 text-sm ${
                      passwordsMismatch ? 'text-red-500' : 'text-green-600'
                    }`}
                  >
                    {passwordsMismatch
                      ? 'Passwords do not match.'
                      : 'Passwords match.'}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  DevicePhoneMobileIcon,
  WifiIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  TvIcon,
  BoltIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import ValidatedInput from "../components/ValidatedInput";
import {
  fetchAdminSettings,
  updateAdminSettings,
  fetchPricingPreview,
} from "../services/settingsApi";

const AccordionSection = ({ title, isOpen, onToggle, children, tooltip }) => (
  <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200">
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${!isOpen ? 'rounded-lg' : 'rounded-t-lg'}`}
    >
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {tooltip && (
          <div className="relative group z-50">
            <InformationCircleIcon className="h-5 w-5 text-gray-400 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      {isOpen ? (
        <ChevronUpIcon className="h-5 w-5 text-gray-600" />
      ) : (
        <ChevronDownIcon className="h-5 w-5 text-gray-600" />
      )}
    </button>
    {isOpen && <div className="p-6 border-t border-gray-100">{children}</div>}
  </div>
);

const formatNumber = (num) => {
  if (num === null || num === undefined || num === '') return "";
  const parts = num.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

const cleanNumber = (str) => {
  if (!str) return "";
  return str.toString().replace(/,/g, "");
};

const PricingSettings = () => {
  const [vehicleBaseFares, setVehicleBaseFares] = useState({
    bicycle: "250",
    motorbike: "600",
    tricycle: "900",
    car: "1600",
    van: "2200",
    car_standard: "1500",
    car_comfort: "1800",
    car_premium: "2300",
  });

  const [vehicleMinFares, setVehicleMinFares] = useState({
    bicycle: "400",
    motorbike: "700",
    tricycle: "1000",
    car: "1800",
    van: "2500",
    car_standard: "1800",
    car_comfort: "2200",
    car_premium: "2700",
  });

  const [passengerLimits, setPassengerLimits] = useState({
    car_standard: "4",
    car_comfort: "4",
    car_premium: "4",
    van: "8",
  });

  const [weightCapacities, setWeightCapacities] = useState({
    bicycle: 5,
    motorbike: 25,
    tricycle: 200,
    car: 400,
    van: 1500,
  });

  // Accordion state
  const [openSections, setOpenSections] = useState({
    base: true,
    tiers: false,
    vehicles: false,
    vehicleFares: true,
    restrictions: true,
    traffic: false,
    demand: false,
    bidding: false,
    waitTime: false,
    caps: false,
    withdrawal: false,
    services: true,
  });

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Simple pricing form data (prevents cursor jumping)
  const [formData, setFormData] = useState({
    baseFare: "",
    rideBaseFare: "",
    courierBaseFare: "",
    surgeBaseFare: "",
    levyAmount: "",
    baseMinutesPerKm: "2.5",
    maxTrafficMultiplier: "1.6",
    minDistanceKm: "3",
    baseRatio: "1.2",
    surgeStep: "0.15",
    demandMaxMultiplier: "2.5",
    minPercent: "-20",
    maxPercent: "30",
    freeWaitMinutes: "5",
    waitTimeFeePerMinute: "50",
    waitTimeFeeCap: "500",
    cancellationPenaltyFee: "500",
    waitTimeRiderShare: "80",
    cancellationArrivedRiderShare: "85",
    cancellationNotArrivedRiderShare: "40",
    maxFinalMultiplier: "2.5",
    allowRewardsForBills: false,
    allowRewardsForTripDiscount: false,
    allowRewardsForCommission: false,
    weeklyRewardCapOrders: "1500",
    weeklyRewardCapUtilities: "300",
    maxRewardUsagePercent: "50",
    displaySavingsToUser: true,
  });

  // Distance Tiers
  const [distanceTiers, setDistanceTiers] = useState([
    { min: 0, max: 8, rate: 100 },
    { min: 9, max: 15, rate: 140 },
    { min: 16, max: 9999, rate: 200 },
  ]);

  // Vehicle Multipliers
  const [vehicleMultipliers, setVehicleMultipliers] = useState({
    bicycle: "0.8",
    motorbike: "1.0",
    tricycle: "1.15",
    car_standard: "1.25",
    car_comfort: "1.4",
    car_premium: "1.8",
    van: "1.5",
  });

  // Boolean flags
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [demandEnabled, setDemandEnabled] = useState(false);
  const [autoSurgeEnabled, setAutoSurgeEnabled] = useState(false);
  const [biddingEnabled, setBiddingEnabled] = useState(true);

  // Withdrawal Controls State
  const [withdrawalControls, setWithdrawalControls] = useState({
    freeWithdrawalsEnabled: true,
    freeWithdrawalsPerDay: "1",
    freeWithdrawalWaiveBaseFee: true,
    freeWithdrawalWaiveVat: false,
    freeWithdrawalWaiveStampDuty: false,
    vatPercent: "7.5",
    stampDutyThreshold: "10000",
    stampDutyAmount: "50",
    tier1Limit: "5000",
    tier1Fee: "10",
    tier2Limit: "50000",
    tier2Fee: "25",
    tier3Fee: "50",
    minimumWithdrawalAmount: "2000",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminSettings();
      const pricing = data?.settings?.pricing;

      if (pricing) {
        setFormData({
          baseFare: pricing.baseFare ? formatNumber(pricing.baseFare) : "",
          rideBaseFare: pricing.rideBaseFare ? formatNumber(pricing.rideBaseFare) : "1200",
          courierBaseFare: pricing.courierBaseFare ? formatNumber(pricing.courierBaseFare) : "800",
          surgeBaseFare: pricing.surgeBaseFare ? formatNumber(pricing.surgeBaseFare) : "800",
          levyAmount: pricing.levyAmount ? formatNumber(pricing.levyAmount) : "",
          baseMinutesPerKm: pricing.traffic?.baseMinutesPerKm ? String(pricing.traffic.baseMinutesPerKm) : "2.5",
          maxTrafficMultiplier: pricing.traffic?.maxTrafficMultiplier ? String(pricing.traffic.maxTrafficMultiplier) : "1.6",
          minDistanceKm: pricing.traffic?.minDistanceKm ? String(pricing.traffic.minDistanceKm) : "3",
          baseRatio: pricing.demand?.auto?.baseRatio ? String(pricing.demand.auto.baseRatio) : "1.2",
          surgeStep: pricing.demand?.auto?.step ? String(pricing.demand.auto.step) : "0.15",
          demandMaxMultiplier: pricing.demand?.maxMultiplier ? String(pricing.demand.maxMultiplier) : "2.5",
          minPercent: pricing.bidding?.minPercent ? String(pricing.bidding.minPercent) : "-20",
          maxPercent: pricing.bidding?.maxPercent ? String(pricing.bidding.maxPercent) : "30",
          freeWaitMinutes: String(pricing.freeWaitMinutes || 5),
          waitTimeFeePerMinute: formatNumber(pricing.waitTimeFeePerMinute || 50),
          waitTimeFeeCap: formatNumber(pricing.waitTimeFeeCap || 500),
          cancellationPenaltyFee: formatNumber(pricing.cancellationPenaltyFee || 500),
          waitTimeRiderShare: String(pricing.waitTimeRiderShare || 80),
          cancellationArrivedRiderShare: String(pricing.cancellationArrivedRiderShare || 85),
          cancellationNotArrivedRiderShare: String(pricing.cancellationNotArrivedRiderShare || 40),
          maxFinalMultiplier: String(pricing.maxFinalMultiplier || 2.5),
          // Rewards & Caps
          allowRewardsForBills: data.settings.allowRewardsForBillPayments !== undefined ? data.settings.allowRewardsForBillPayments : false,
          allowRewardsForTripDiscount: data.settings.allowRewardsForTripDiscount || false,
          allowRewardsForCommission: data.settings.allowRewardsForCommission || false,
          weeklyRewardCapOrders: formatNumber(data.settings.weeklyRewardCapOrders !== undefined ? data.settings.weeklyRewardCapOrders : 1500),
          weeklyRewardCapUtilities: formatNumber(data.settings.weeklyRewardCapUtilities !== undefined ? data.settings.weeklyRewardCapUtilities : 300),
          maxRewardUsagePercent: String(data.settings.maxRewardUsagePercent !== undefined ? data.settings.maxRewardUsagePercent : 50),
          displaySavingsToUser: data.settings.pricingControls?.displaySavingsToUser ?? true,
        });

        // Withdrawal Controls
        if (data.settings.withdrawalControls) {
          const wc = data.settings.withdrawalControls;
          setWithdrawalControls({
            freeWithdrawalsEnabled: !!wc.freeWithdrawalsEnabled,
            freeWithdrawalsPerDay: String(wc.freeWithdrawalsPerDay ?? 1),
            freeWithdrawalWaiveBaseFee: !!wc.freeWithdrawalWaiveBaseFee,
            freeWithdrawalWaiveVat: !!wc.freeWithdrawalWaiveVat,
            freeWithdrawalWaiveStampDuty: !!wc.freeWithdrawalWaiveStampDuty,
            vatPercent: String(wc.vatPercent ?? 7.5),
            stampDutyThreshold: String(wc.stampDutyThreshold ?? 10000),
            stampDutyAmount: String(wc.stampDutyAmount ?? 50),
            tier1Limit: String(wc.tier1Limit ?? 5000),
            tier1Fee: String(wc.tier1Fee ?? 10),
            tier2Limit: String(wc.tier2Limit ?? 50000),
            tier2Fee: String(wc.tier2Fee ?? 25),
            tier3Fee: String(wc.tier3Fee ?? 50),
            minimumWithdrawalAmount: String(data.settings.minimumWithdrawalAmount ?? 2000),
          });
        }

        // Distance Tiers
        if (pricing.distanceTiers && pricing.distanceTiers.length > 0) {
          setDistanceTiers(
            pricing.distanceTiers.map((t) => ({
              min: String(t.min),
              max: String(t.max),
              rate: String(t.rate),
            }))
          );
        }

        // Vehicle Multipliers
        if (pricing.vehicleMultipliers) {
          setVehicleMultipliers({
            bicycle: String(pricing.vehicleMultipliers.bicycle || 0.8),
            motorbike: String(pricing.vehicleMultipliers.motorbike || 1.0),
            tricycle: String(pricing.vehicleMultipliers.tricycle || 1.15),
            car_standard: String(pricing.vehicleMultipliers.car_standard || 1.25),
            car_comfort: String(pricing.vehicleMultipliers.car_comfort || 1.4),
            car_premium: String(pricing.vehicleMultipliers.car_premium || 1.8),
            van: String(pricing.vehicleMultipliers.van || 1.5),
          });
        }

        // Boolean flags
        if (pricing.traffic) {
          setTrafficEnabled(!!pricing.traffic.enabled);
        }
        if (pricing.demand) {
          setDemandEnabled(!!pricing.demand.enabled);
          if (pricing.demand.auto) {
            setAutoSurgeEnabled(!!pricing.demand.auto.enabled);
          }
        }
        if (pricing.bidding) {
          setBiddingEnabled(!!pricing.bidding.enabled);
        }

        // Vehicle Base & Min Fares
        if (pricing.vehicleBaseFares) {
          setVehicleBaseFares({
            bicycle: String(pricing.vehicleBaseFares.bicycle || "250"),
            motorbike: String(pricing.vehicleBaseFares.motorbike || "600"),
            tricycle: String(pricing.vehicleBaseFares.tricycle || "900"),
            car: String(pricing.vehicleBaseFares.car || "1600"),
            van: String(pricing.vehicleBaseFares.van || "2200"),
            car_standard: String(pricing.vehicleBaseFares.car_standard || "1500"),
            car_comfort: String(pricing.vehicleBaseFares.car_comfort || "1800"),
            car_premium: String(pricing.vehicleBaseFares.car_premium || "2300"),
          });
        }
        if (pricing.vehicleMinFares) {
          setVehicleMinFares({
            bicycle: String(pricing.vehicleMinFares.bicycle || "400"),
            motorbike: String(pricing.vehicleMinFares.motorbike || "700"),
            tricycle: String(pricing.vehicleMinFares.tricycle || "1000"),
            car: String(pricing.vehicleMinFares.car || "1800"),
            van: String(pricing.vehicleMinFares.van || "2500"),
            car_standard: String(pricing.vehicleMinFares.car_standard || "1800"),
            car_comfort: String(pricing.vehicleMinFares.car_comfort || "2200"),
            car_premium: String(pricing.vehicleMinFares.car_premium || "2700"),
          });
        }

        // Restrictions
        if (pricing.restrictions) {
          if (pricing.restrictions.passengerLimits) {
            setPassengerLimits({
              car_standard: String(pricing.restrictions.passengerLimits.car_standard || "4"),
              car_comfort: String(pricing.restrictions.passengerLimits.car_comfort || "4"),
              car_premium: String(pricing.restrictions.passengerLimits.car_premium || "4"),
              van: String(pricing.restrictions.passengerLimits.van || "8"),
            });
          }
          if (pricing.restrictions.weightCapacities) {
            const cleanWeight = (val) => {
              if (typeof val === 'number') return val;
              if (typeof val !== 'string') return 0;
              const lowered = val.toLowerCase();
              if (lowered.includes('ton')) return parseFloat(lowered) * 1000;
              return parseFloat(lowered.replace(/[^\d.]/g, '')) || 0;
            };

            setWeightCapacities({
              bicycle: cleanWeight(pricing.restrictions.weightCapacities.bicycle || 5),
              motorbike: cleanWeight(pricing.restrictions.weightCapacities.motorbike || 25),
              tricycle: cleanWeight(pricing.restrictions.weightCapacities.tricycle || 200),
              car: cleanWeight(pricing.restrictions.weightCapacities.car || 400),
              van: cleanWeight(pricing.restrictions.weightCapacities.van || 1500),
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to load pricing settings:", error);
      toast.error("Failed to load pricing settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validation to prevent 400 errors
    if (Number(formData.maxRewardUsagePercent) > 100 || Number(formData.maxRewardUsagePercent) < 0) {
      toast.error("Max reward usage percentage must be between 0 and 100");
      return;
    }

    if (Number(withdrawalControls.vatPercent) > 100 || Number(withdrawalControls.vatPercent) < 0) {
      toast.error("VAT percentage must be between 0 and 100");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        pricing: {
          baseFare: formData.baseFare ? Number(cleanNumber(formData.baseFare)) : undefined,
          rideBaseFare: formData.rideBaseFare ? Number(cleanNumber(formData.rideBaseFare)) : undefined,
          courierBaseFare: formData.courierBaseFare ? Number(cleanNumber(formData.courierBaseFare)) : undefined,
          surgeBaseFare: formData.surgeBaseFare ? Number(cleanNumber(formData.surgeBaseFare)) : undefined,
          levyAmount: formData.levyAmount ? Number(cleanNumber(formData.levyAmount)) : undefined,
          distanceTiers: distanceTiers.map((tier) => ({
            min: Number(tier.min),
            max: Number(tier.max),
            rate: Number(tier.rate),
          })),
          vehicleMultipliers: {
            bicycle: Number(vehicleMultipliers.bicycle),
            motorbike: Number(vehicleMultipliers.motorbike),
            tricycle: Number(vehicleMultipliers.tricycle),
            car_standard: Number(vehicleMultipliers.car_standard),
            car_comfort: Number(vehicleMultipliers.car_comfort),
            car_premium: Number(vehicleMultipliers.car_premium),
            van: Number(vehicleMultipliers.van),
          },
          traffic: {
            enabled: trafficEnabled,
            baseMinutesPerKm: Number(formData.baseMinutesPerKm),
            maxTrafficMultiplier: Number(formData.maxTrafficMultiplier),
            minDistanceKm: Number(formData.minDistanceKm),
          },
          demand: {
            enabled: demandEnabled,
            maxMultiplier: Number(formData.demandMaxMultiplier),
            auto: {
              enabled: autoSurgeEnabled,
              baseRatio: Number(formData.baseRatio),
              step: Number(formData.surgeStep),
            },
          },
          bidding: {
            enabled: biddingEnabled,
            minPercent: Number(formData.minPercent),
            maxPercent: Number(formData.maxPercent),
          },
          freeWaitMinutes: Number(formData.freeWaitMinutes),
          waitTimeFeePerMinute: Number(cleanNumber(formData.waitTimeFeePerMinute)),
          waitTimeFeeCap: Number(cleanNumber(formData.waitTimeFeeCap)),
          cancellationPenaltyFee: Number(cleanNumber(formData.cancellationPenaltyFee)),
          waitTimeRiderShare: Number(formData.waitTimeRiderShare),
          cancellationArrivedRiderShare: Number(formData.cancellationArrivedRiderShare),
          cancellationNotArrivedRiderShare: Number(formData.cancellationNotArrivedRiderShare),
          maxFinalMultiplier: Number(formData.maxFinalMultiplier),
          vehicleBaseFares: { ...vehicleBaseFares },
          vehicleMinFares: { ...vehicleMinFares },
          restrictions: {
            passengerLimits: {
              car_standard: Number(passengerLimits.car_standard),
              car_comfort: Number(passengerLimits.car_comfort),
              car_premium: Number(passengerLimits.car_premium),
              van: Number(passengerLimits.van),
            },
            weightCapacities: {
              bicycle: Number(weightCapacities.bicycle),
              motorbike: Number(weightCapacities.motorbike),
              tricycle: Number(weightCapacities.tricycle),
              car: Number(weightCapacities.car),
              van: Number(weightCapacities.van),
            }
          }
        },
        allowRewardsForBillPayments: formData.allowRewardsForBills,
        allowRewardsForTripDiscount: formData.allowRewardsForTripDiscount,
        allowRewardsForCommission: formData.allowRewardsForCommission,
        weeklyRewardCapOrders: Number(cleanNumber(formData.weeklyRewardCapOrders)) || 1500,
        weeklyRewardCapUtilities: Number(cleanNumber(formData.weeklyRewardCapUtilities)) || 300,
        maxRewardUsagePercent: Number(formData.maxRewardUsagePercent) || 50,
        // Withdrawal Controls
        minimumWithdrawalAmount: Number(cleanNumber(withdrawalControls.minimumWithdrawalAmount)),
        withdrawalControls: {
          freeWithdrawalsEnabled: withdrawalControls.freeWithdrawalsEnabled,
          freeWithdrawalsPerDay: Number(withdrawalControls.freeWithdrawalsPerDay),
          freeWithdrawalWaiveBaseFee: withdrawalControls.freeWithdrawalWaiveBaseFee,
          freeWithdrawalWaiveVat: withdrawalControls.freeWithdrawalWaiveVat,
          freeWithdrawalWaiveStampDuty: withdrawalControls.freeWithdrawalWaiveStampDuty,
          vatPercent: Number(withdrawalControls.vatPercent),
          stampDutyThreshold: Number(cleanNumber(withdrawalControls.stampDutyThreshold)),
          stampDutyAmount: Number(cleanNumber(withdrawalControls.stampDutyAmount)),
          tier1Limit: Number(cleanNumber(withdrawalControls.tier1Limit)),
          tier1Fee: Number(cleanNumber(withdrawalControls.tier1Fee)),
          tier2Limit: Number(cleanNumber(withdrawalControls.tier2Limit)),
          tier2Fee: Number(cleanNumber(withdrawalControls.tier2Fee)),
          tier3Fee: Number(cleanNumber(withdrawalControls.tier3Fee)),
        }
      };

      await updateAdminSettings(payload);
      toast.success("Pricing settings updated successfully!");
      await loadSettings(); 
    } catch (error) {
      console.error("Failed to update pricing settings:", error);
      toast.error(error?.response?.data?.error || "Failed to update pricing settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addTier = () => {
    const lastTier = distanceTiers[distanceTiers.length - 1];
    setDistanceTiers([
      ...distanceTiers,
      {
        min: Number(lastTier.max) + 1,
        max: Number(lastTier.max) + 10,
        rate: 100,
      },
    ]);
  };

  const removeTier = (index) => {
    if (distanceTiers.length > 1) {
      setDistanceTiers(distanceTiers.filter((_, i) => i !== index));
    }
  };

  const updateTier = (index, field, value) => {
    const newTiers = [...distanceTiers];
    newTiers[index][field] = value;
    setDistanceTiers(newTiers);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pricing Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure the 3-stage pricing engine for rides and deliveries
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Base Pricing */}
        <AccordionSection
          title="1. Base Pricing"
          isOpen={openSections.base}
          onToggle={() => toggleSection("base")}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ValidatedInput
                label="Base Fare (₦)"
                value={formData.baseFare}
                onChange={(val) => setFormData(prev => ({...prev, baseFare: val}))}
                isCurrency={true}
                placeholder="600"
                className="font-bold"
                helperText="Normal off-peak base fare"
            />
            <ValidatedInput
                label="Ride Base Fare (₦)"
                value={formData.rideBaseFare}
                onChange={(val) => setFormData(prev => ({...prev, rideBaseFare: val}))}
                isCurrency={true}
                placeholder="1200"
                className="font-bold text-green-600"
                helperText="Base fare specifically for rides"
            />
            <ValidatedInput
                label="Courier Base Fare (₦)"
                value={formData.courierBaseFare}
                onChange={(val) => setFormData(prev => ({...prev, courierBaseFare: val}))}
                isCurrency={true}
                placeholder="800"
                className="font-bold text-blue-600"
                helperText="Base fare specifically for courier/delivery"
            />
            <ValidatedInput
                label="Surge Base Fare (₦)"
                value={formData.surgeBaseFare}
                onChange={(val) => setFormData(prev => ({...prev, surgeBaseFare: val}))}
                isCurrency={true}
                placeholder="800"
                className="font-bold"
                helperText="Peak hour / High demand base"
            />
            <ValidatedInput
                label="Levy Amount (₦)"
                value={formData.levyAmount}
                onChange={(val) => setFormData(prev => ({...prev, levyAmount: val}))}
                isCurrency={true}
                placeholder="30"
                className="font-bold"
                helperText="Fixed levy per ride"
            />
          </div>
        </AccordionSection>

        {/* 2. Distance Tiers (Renumbered from 1) */}
        <AccordionSection
          title="2. Distance Tiers"
          isOpen={openSections.tiers}
          onToggle={() => toggleSection("tiers")}
          tooltip="Set distance-based pricing rates. Use max=9999 for the last tier (infinite range)."
        >
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Min (km)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Max (km)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rate (₦/km)
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {distanceTiers.map((tier, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <ValidatedInput
                          value={tier.min}
                          onChange={(val) => updateTier(index, "min", val)}
                          type="number"
                          className="w-24"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <ValidatedInput
                          value={tier.max}
                          onChange={(val) => updateTier(index, "max", val)}
                          type="number"
                          className="w-24"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <ValidatedInput
                          value={tier.rate}
                          onChange={(val) => updateTier(index, "rate", val)}
                          type="number"
                          step="0.01"
                          className="w-24"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeTier(index)}
                          disabled={distanceTiers.length === 1}
                          className="text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addTier}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Add Tier
            </button>
          </div>
        </AccordionSection>

        {/* 3. Vehicle Multipliers */}
        <AccordionSection
          title="3. Vehicle Multipliers"
          isOpen={openSections.vehicles}
          onToggle={() => toggleSection("vehicles")}
          tooltip="Multipliers applied to base price. Motorbike = 1.0x baseline. Higher values for premium vehicles."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(vehicleMultipliers).map(([vehicle, value]) => (
              <div key={vehicle}>
                <ValidatedInput
                  label={vehicle.replace("_", " ")}
                  value={value}
                  onChange={(val) =>
                    setVehicleMultipliers({
                      ...vehicleMultipliers,
                      [vehicle]: val,
                    })
                  }
                  type="number"
                  step="0.01"
                  className="capitalize"
                />
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* 4. Vehicle-Specific Base & Min Fares */}
        <AccordionSection
          title="4. Vehicle-Specific Base & Min Fares"
          isOpen={openSections.vehicleFares}
          onToggle={() => toggleSection("vehicleFares")}
          tooltip="Override global base/min fares for specific vehicle tiers."
        >
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Vehicle Base Fares (₦)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(vehicleBaseFares).map(([vehicle, value]) => (
                  <div key={vehicle}>
                    <ValidatedInput
                      label={vehicle.replace("_", " ")}
                      value={value}
                      onChange={(val) =>
                        setVehicleBaseFares({
                          ...vehicleBaseFares,
                          [vehicle]: val,
                        })
                      }
                      isCurrency={true}
                      className="font-bold capitalize"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Vehicle Minimum Fares (₦)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(vehicleMinFares).map(([vehicle, value]) => (
                  <div key={vehicle}>
                    <ValidatedInput
                      label={vehicle.replace("_", " ")}
                      value={value}
                      onChange={(val) =>
                        setVehicleMinFares({
                          ...vehicleMinFares,
                          [vehicle]: val,
                        })
                      }
                      isCurrency={true}
                      className="font-bold capitalize"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* 5. Capacity & Weight Restrictions */}
        <AccordionSection
          title="5. Capacity & Weight Restrictions"
          isOpen={openSections.restrictions}
          onToggle={() => toggleSection("restrictions")}
          tooltip="Define passenger limits for rides and weight capacities for deliveries."
        >
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Passenger Limits (Rides)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(passengerLimits).map(([vehicle, value]) => (
                  <div key={vehicle}>
                    <ValidatedInput
                      label={vehicle.replace("_", " ")}
                      value={value}
                      onChange={(val) =>
                        setPassengerLimits({
                          ...passengerLimits,
                          [vehicle]: val,
                        })
                      }
                      type="number"
                      className="font-bold text-blue-600 capitalize"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Weight Capacities (Courier)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {Object.entries(weightCapacities).map(([vehicle, value]) => (
                  <div key={vehicle}>
                    <ValidatedInput
                      label={`${vehicle.replace("_", " ")} (kg)`}
                      value={value}
                      onChange={(val) =>
                        setWeightCapacities({
                          ...weightCapacities,
                          [vehicle]: val,
                        })
                      }
                      type="number"
                      className="font-bold text-indigo-600 capitalize"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AccordionSection>


        {/* 6. Traffic Dampening */}
        <AccordionSection
          title="6. Traffic Dampening"
          isOpen={openSections.traffic}
          onToggle={() => toggleSection("traffic")}
          tooltip="Automatically increases prices when trips take longer than expected based on traffic conditions."
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="trafficEnabled"
                checked={trafficEnabled}
                onChange={(e) => setTrafficEnabled(e.target.checked)}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="trafficEnabled"
                className="text-sm font-medium text-gray-700"
              >
                Enable Traffic Multiplier Logic
              </label>
            </div>
            {trafficEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-8">
                <ValidatedInput
                    label="Base Minutes per KM"
                    value={formData.baseMinutesPerKm}
                    onChange={(val) => setFormData(prev => ({...prev, baseMinutesPerKm: val}))}
                    type="number"
                    step="0.1"
                    helperText="Expected travel time"
                />
                <ValidatedInput
                    label="Max Traffic Multiplier"
                    value={formData.maxTrafficMultiplier}
                    onChange={(val) => setFormData(prev => ({...prev, maxTrafficMultiplier: val}))}
                    type="number"
                    step="0.1"
                    helperText="Maximum surge cap"
                />
                <ValidatedInput
                    label="Min Distance (km)"
                    value={formData.minDistanceKm}
                    onChange={(val) => setFormData(prev => ({...prev, minDistanceKm: val}))}
                    type="number"
                    step="0.1"
                    helperText="Ignore traffic below this distance"
                />
              </div>
            )}
          </div>
        </AccordionSection>

        {/* 7. Demand Surge (Auto-Mode) */}
        <AccordionSection
          title="7. Demand Surge (Auto-Mode)"
          isOpen={openSections.demand}
          onToggle={() => toggleSection("demand")}
          tooltip="Automatically increases prices when rider availability is low based on active orders vs online riders ratio."
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="demandEnabled"
                checked={demandEnabled}
                onChange={(e) => setDemandEnabled(e.target.checked)}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="demandEnabled"
                className="text-sm font-medium text-gray-700"
              >
                Enable Demand/Surge Pricing
              </label>
            </div>
            {demandEnabled && (
              <div className="pl-8 space-y-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="autoSurgeEnabled"
                    checked={autoSurgeEnabled}
                    onChange={(e) => setAutoSurgeEnabled(e.target.checked)}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="autoSurgeEnabled"
                    className="text-sm font-medium text-gray-700"
                  >
                    Enable Auto-Surge Engine
                  </label>
                </div>
                {autoSurgeEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-8">
                    <ValidatedInput
                      label="Base Ratio"
                      value={formData.baseRatio}
                      onChange={(val) => setFormData(prev => ({...prev, baseRatio: val}))}
                      type="number"
                      step="0.1"
                      helperText="Orders/rider threshold"
                    />
                    <ValidatedInput
                      label="Step (Aggressiveness)"
                      value={formData.surgeStep}
                      onChange={(val) => setFormData(prev => ({...prev, surgeStep: val}))}
                      type="number"
                      step="0.01"
                      helperText="How fast prices rise"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ValidatedInput
                    label="Max Multiplier"
                    value={formData.demandMaxMultiplier}
                    onChange={(val) => setFormData(prev => ({...prev, demandMaxMultiplier: val}))}
                    type="number"
                    step="0.1"
                    helperText="Maximum cap"
                  />
                </div>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* 8. Rider Bidding Guardrails */}
        <AccordionSection
          title="8. Rider Bidding Guardrails"
          isOpen={openSections.bidding}
          onToggle={() => toggleSection("bidding")}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="biddingEnabled"
                checked={biddingEnabled}
                onChange={(e) => setBiddingEnabled(e.target.checked)}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="biddingEnabled"
                className="text-sm font-medium text-gray-700"
              >
                Enable Rider Bidding
              </label>
            </div>
            {biddingEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                  <ValidatedInput
                    label="Floor (Min %)"
                    value={formData.minPercent}
                    onChange={(val) => setFormData(prev => ({...prev, minPercent: val}))}
                    type="number"
                    helperText="How low riders can bid (e.g., -20%)"
                  />
                  <ValidatedInput
                    label="Ceiling (Max %)"
                    value={formData.maxPercent}
                    onChange={(val) => setFormData(prev => ({...prev, maxPercent: val}))}
                    type="number"
                    helperText="How high riders can bid (e.g., +30%)"
                  />
              </div>
            )}
          </div>
        </AccordionSection>

        {/* 9. Wait Time & Cancellation Fees */}
        <AccordionSection
          title="9. Wait Time & Cancellation Fees"
          isOpen={openSections.waitTime}
          onToggle={() => toggleSection("waitTime")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ValidatedInput
                label="Free Wait Minutes"
                value={formData.freeWaitMinutes}
                onChange={(val) => setFormData(prev => ({...prev, freeWaitMinutes: val}))}
                type="number"
            />
            <ValidatedInput
                label="Wait Time Fee per Minute (₦)"
                value={formData.waitTimeFeePerMinute}
                onChange={(val) => setFormData(prev => ({...prev, waitTimeFeePerMinute: val}))}
                isCurrency={true}
                placeholder="50"
                className="font-bold"
            />
            <ValidatedInput
                label="Wait Time Fee Cap (₦)"
                value={formData.waitTimeFeeCap}
                onChange={(val) => setFormData(prev => ({...prev, waitTimeFeeCap: val}))}
                isCurrency={true}
                placeholder="500"
                className="font-bold"
            />
            <ValidatedInput
                label="Cancellation Penalty Fee (₦)"
                value={formData.cancellationPenaltyFee}
                onChange={(val) => setFormData(prev => ({...prev, cancellationPenaltyFee: val}))}
                isCurrency={true}
                placeholder="500"
                className="font-bold"
            />
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Compensation Splits</h3>
            <p className="text-sm text-gray-500 mb-6">Define the portion of fees that goes to the rider. The platform keeps the remainder.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ValidatedInput
                label="Wait Time Rider Share (%)"
                value={formData.waitTimeRiderShare}
                onChange={(val) => setFormData(prev => ({...prev, waitTimeRiderShare: val}))}
                type="number"
                helperText="Default: 80%"
              />
              
              <ValidatedInput
                label="Cancellation (Arrived) Share (%)"
                value={formData.cancellationArrivedRiderShare}
                onChange={(val) => setFormData(prev => ({...prev, cancellationArrivedRiderShare: val}))}
                type="number"
                helperText="Default: 85%"
              />
              
              <ValidatedInput
                label="Cancellation (Not Arrived) Share (%)"
                value={formData.cancellationNotArrivedRiderShare}
                onChange={(val) => setFormData(prev => ({...prev, cancellationNotArrivedRiderShare: val}))}
                type="number"
                helperText="Default: 40%"
              />
            </div>
          </div>
        </AccordionSection>

        {/* 10. Compensation & Rewards */}
        <AccordionSection
          title="10. Compensation & Rewards"
          isOpen={openSections.promo}
          onToggle={() => toggleSection("promo")}
        >
          <div className="pt-2">
            <div className="flex flex-col gap-4">
               <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.allowRewardsForBills}
                    onChange={(e) => setFormData(prev => ({...prev, allowRewardsForBills: e.target.checked}))}
                    className="checkbox checkbox-primary"
                  />
                  <div>
                    <span className="label-text font-medium">Allow Rewards for Bill Payments</span>
                    <p className="text-xs text-gray-500">Users can use reward balance for Airtime, Data, etc.</p>
                  </div>
                </label>
              </div>

               <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.allowRewardsForTripDiscount || false}
                    onChange={(e) => setFormData(prev => ({...prev, allowRewardsForTripDiscount: e.target.checked}))}
                    className="checkbox checkbox-primary"
                  />
                  <div>
                    <span className="label-text font-medium">Allow Rewards for Trip Discount</span>
                    <p className="text-xs text-gray-500">Customers can use rewards to pay for rides/orders.</p>
                  </div>
                </label>
              </div>

               <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.allowRewardsForCommission || false}
                    onChange={(e) => setFormData(prev => ({...prev, allowRewardsForCommission: e.target.checked}))}
                    className="checkbox checkbox-primary"
                  />
                  <div>
                    <span className="label-text font-medium">Allow Rewards for Commission</span>
                    <p className="text-xs text-gray-500">Riders can use rewards to pay commission fees.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Weekly Reward Caps */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Weekly Reward Usage Caps (Customers Only)</h3>
            <p className="text-xs text-gray-500 mb-4">
              Maximum reward money (₦) a customer can spend per week. Purchases funded from their own <strong>deposited money</strong> are never capped. Riders cannot use rewards for utilities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput
                label="Weekly Reward Cap — Orders (₦)"
                value={formData.weeklyRewardCapOrders}
                onChange={(val) => setFormData(prev => ({...prev, weeklyRewardCapOrders: val}))}
                isCurrency={true}
                className="font-bold"
                placeholder="2000"
                helperText="Max reward ₦ usable for ride/order payments per week"
              />
              <ValidatedInput
                label="Weekly Reward Cap — Utilities (₦)"
                value={formData.weeklyRewardCapUtilities}
                onChange={(val) => setFormData(prev => ({...prev, weeklyRewardCapUtilities: val}))}
                isCurrency={true}
                className="font-bold"
                placeholder="500"
                helperText="Max reward ₦ usable for Airtime, Data, Cable, Electricity per week"
              />
              <ValidatedInput
                label="Max Reward Usage Percentage (%)"
                value={formData.maxRewardUsagePercent}
                onChange={(val) => setFormData(prev => ({...prev, maxRewardUsagePercent: val}))}
                type="number"
                min="0"
                max="100"
                className="font-bold"
                placeholder="50"
                helperText="Max % of a single transaction that rewards can cover (Global)"
              />
            </div>
          </div>
        </AccordionSection>


        {/* 11. Global Caps & Trust */}
        <AccordionSection
          title="11. Global Caps & Trust"
          isOpen={openSections.caps}
          onToggle={() => toggleSection("caps")}
          tooltip="Maximum total multiplier that can be applied (traffic + demand + vehicle combined)."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput
                label="Max Final Multiplier"
                value={formData.maxFinalMultiplier}
                onChange={(val) => setFormData(prev => ({...prev, maxFinalMultiplier: val}))}
                type="number"
                step="0.1"
                helperText="Prevents prices from going too high"
              />
          </div>
        </AccordionSection>

        {/* 12. Withdrawal Fee Controls (CBN Compliance) */}
        <AccordionSection
          title="12. Withdrawal Fee Controls (CBN Compliance)"
          isOpen={openSections.withdrawal}
          onToggle={() => toggleSection("withdrawal")}
          tooltip="Configure tiered withdrawal fees, VAT, and Stamp Duty according to regulatory requirements."
        >
          <div className="space-y-8">
            {/* Daily Free Withdrawal Configuration */}
            <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-6">
               <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-indigo-600" />
                        Daily Free Withdrawal Configuration
                    </h3>
                    <p className="text-xs text-indigo-600 font-medium">Configure limited-time free transfer benefits for all users.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-indigo-900 uppercase">Feature Status:</span>
                    <button
                        type="button"
                        onClick={() => setWithdrawalControls(prev => ({ ...prev, freeWithdrawalsEnabled: !prev.freeWithdrawalsEnabled }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${withdrawalControls.freeWithdrawalsEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${withdrawalControls.freeWithdrawalsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
               </div>

               {withdrawalControls.freeWithdrawalsEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
                    <ValidatedInput
                        label="Free Transfers Per Day"
                        value={withdrawalControls.freeWithdrawalsPerDay}
                        onChange={(val) => setWithdrawalControls(prev => ({ ...prev, freeWithdrawalsPerDay: val }))}
                        type="number"
                        min="1"
                        className="font-bold border-indigo-200"
                        helperText="Limit per user/day"
                    />

                    <div className="flex flex-col justify-center space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={withdrawalControls.freeWithdrawalWaiveBaseFee}
                                onChange={(e) => setWithdrawalControls(prev => ({ ...prev, freeWithdrawalWaiveBaseFee: e.target.checked }))}
                                className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-bold text-indigo-900 group-hover:text-indigo-600">Waive Base Fee</span>
                        </label>
                        <p className="text-[10px] text-gray-500 font-medium leading-tight">Platform absorbs the CBN transaction fee.</p>
                    </div>

                    <div className="flex flex-col justify-center space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={withdrawalControls.freeWithdrawalWaiveVat}
                                onChange={(e) => setWithdrawalControls(prev => ({ ...prev, freeWithdrawalWaiveVat: e.target.checked }))}
                                className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-bold text-indigo-900 group-hover:text-indigo-600">Waive VAT</span>
                        </label>
                        <p className="text-[10px] text-gray-500 font-medium leading-tight">Platform absorbs the 7.5% tax on the fee.</p>
                    </div>

                    <div className="flex flex-col justify-center space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={withdrawalControls.freeWithdrawalWaiveStampDuty}
                                onChange={(e) => setWithdrawalControls(prev => ({ ...prev, freeWithdrawalWaiveStampDuty: e.target.checked }))}
                                className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-bold text-indigo-900 group-hover:text-indigo-600">Waive Stamp Duty</span>
                        </label>
                        <p className="text-[10px] text-gray-500 font-medium leading-tight">Platform absorbs the ₦50 duty (on ₦10k+).</p>
                    </div>
                  </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ValidatedInput
                label="Minimum Withdrawal (₦)"
                value={withdrawalControls.minimumWithdrawalAmount}
                onChange={(val) => setWithdrawalControls(prev => ({ ...prev, minimumWithdrawalAmount: val }))}
                isCurrency={true}
                className="font-bold text-blue-600"
                helperText="Lowest amount a user can withdraw"
              />
              <ValidatedInput
                label="VAT Support Fee (%)"
                value={withdrawalControls.vatPercent}
                onChange={(val) => setWithdrawalControls(prev => ({ ...prev, vatPercent: val }))}
                type="number"
                step="0.1"
                helperText="Government VAT on service fees (Standard: 7.5%)"
              />
              <ValidatedInput
                label="Stamp Duty Amount (₦)"
                value={withdrawalControls.stampDutyAmount}
                onChange={(val) => setWithdrawalControls(prev => ({ ...prev, stampDutyAmount: val }))}
                isCurrency={true}
                helperText="EMTL charge per transaction (Standard: ₦50)"
              />
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Fee Tiers (Central Bank Tiers)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Tier 1 (Small)</p>
                  <ValidatedInput
                    label="Up To (₦)"
                    value={withdrawalControls.tier1Limit}
                    onChange={(val) => setWithdrawalControls(prev => ({ ...prev, tier1Limit: val }))}
                    isCurrency={true}
                    placeholder="5000"
                  />
                  <ValidatedInput
                    label="Fee (₦)"
                    value={withdrawalControls.tier1Fee}
                    onChange={(val) => setWithdrawalControls(prev => ({ ...prev, tier1Fee: val }))}
                    isCurrency={true}
                    placeholder="10"
                    className="text-emerald-600"
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Tier 2 (Medium)</p>
                  <ValidatedInput
                    label="Up To (₦)"
                    value={withdrawalControls.tier2Limit}
                    onChange={(val) => setWithdrawalControls(prev => ({ ...prev, tier2Limit: val }))}
                    isCurrency={true}
                    placeholder="50000"
                  />
                  <ValidatedInput
                    label="Fee (₦)"
                    value={withdrawalControls.tier2Fee}
                    onChange={(val) => setWithdrawalControls(prev => ({ ...prev, tier2Fee: val }))}
                    isCurrency={true}
                    placeholder="25"
                    className="text-emerald-600"
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Tier 3 (Large)</p>
                  <div className="p-4 bg-white border border-slate-200 rounded-lg text-center">
                    <p className="text-xs text-slate-400 font-medium">Any amount above Tier 2</p>
                  </div>
                  <ValidatedInput
                    label="Fee (₦)"
                    value={withdrawalControls.tier3Fee}
                    onChange={(val) => setWithdrawalControls(prev => ({ ...prev, tier3Fee: val }))}
                    isCurrency={true}
                    placeholder="50"
                    className="text-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <ValidatedInput
                label="Stamp Duty Threshold (₦)"
                value={withdrawalControls.stampDutyThreshold}
                onChange={(val) => setWithdrawalControls(prev => ({ ...prev, stampDutyThreshold: val }))}
                isCurrency={true}
                helperText="Amount at which Stamp Duty is triggered (Standard: ₦10,000)"
              />
            </div>
          </div>
        </AccordionSection>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save All Pricing Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PricingSettings;

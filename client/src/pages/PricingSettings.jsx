import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  fetchAdminSettings,
  updateAdminSettings,
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
  // Accordion state
  const [openSections, setOpenSections] = useState({
    base: true,
    tiers: false,
    vehicles: false,
    traffic: false,
    demand: false,
    bidding: false,
    waitTime: false,
    caps: false,
    withdrawal: false,
  });

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Simple pricing form data (prevents cursor jumping)
  const [formData, setFormData] = useState({
    baseFare: "",
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
    maxFinalMultiplier: "2.5",
    billPaymentFee: "50",
    withdrawalBaseFee: "0",
    withdrawalHighTierThreshold: "10000",
    withdrawalHighTierFee: "50",
    allowRewardsForBills: false,
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



  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminSettings();
      const pricing = data?.settings?.pricing;

      if (pricing) {
        // Update formData with simple inputs
        setFormData({
          baseFare: pricing.baseFare ? String(pricing.baseFare) : "",
          surgeBaseFare: pricing.surgeBaseFare ? String(pricing.surgeBaseFare) : "800",
          levyAmount: pricing.levyAmount ? String(pricing.levyAmount) : "",
          baseMinutesPerKm: pricing.traffic?.baseMinutesPerKm ? String(pricing.traffic.baseMinutesPerKm) : "2.5",
          maxTrafficMultiplier: pricing.traffic?.maxTrafficMultiplier ? String(pricing.traffic.maxTrafficMultiplier) : "1.6",
          minDistanceKm: pricing.traffic?.minDistanceKm ? String(pricing.traffic.minDistanceKm) : "3",
          baseRatio: pricing.demand?.auto?.baseRatio ? String(pricing.demand.auto.baseRatio) : "1.2",
          surgeStep: pricing.demand?.auto?.step ? String(pricing.demand.auto.step) : "0.15",
          demandMaxMultiplier: pricing.demand?.maxMultiplier ? String(pricing.demand.maxMultiplier) : "2.5",
          minPercent: pricing.bidding?.minPercent ? String(pricing.bidding.minPercent) : "-20",
          maxPercent: pricing.bidding?.maxPercent ? String(pricing.bidding.maxPercent) : "30",
          freeWaitMinutes: String(pricing.freeWaitMinutes || 5),
          waitTimeFeePerMinute: String(pricing.waitTimeFeePerMinute || 50),
          waitTimeFeeCap: String(pricing.waitTimeFeeCap || 500),
          cancellationPenaltyFee: String(pricing.cancellationPenaltyFee || 500),
          maxFinalMultiplier: String(pricing.maxFinalMultiplier || 2.5),
          billPaymentFee: String(data.settings.billPaymentFee !== undefined ? data.settings.billPaymentFee : 50),
          // Withdrawal Fees
          withdrawalBaseFee: formatNumber(data.settings.withdrawalFeeStructure?.baseFee !== undefined ? data.settings.withdrawalFeeStructure.baseFee : 0),
          withdrawalHighTierThreshold: formatNumber(data.settings.withdrawalFeeStructure?.highTierThreshold !== undefined ? data.settings.withdrawalFeeStructure.highTierThreshold : 10000),
          withdrawalHighTierFee: formatNumber(data.settings.withdrawalFeeStructure?.highTierFee !== undefined ? data.settings.withdrawalFeeStructure.highTierFee : 50),
          // Rewards
          allowRewardsForBills: data.settings.allowRewardsForBillPayments !== undefined ? data.settings.allowRewardsForBillPayments : false,
          allowRewardsForTripDiscount: data.settings.allowRewardsForTripDiscount || false,
          allowRewardsForCommission: data.settings.allowRewardsForCommission || false,
        });

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

    try {
      setSaving(true);

      const payload = {
        pricing: {
          baseFare: formData.baseFare ? Number(formData.baseFare) : undefined,
          surgeBaseFare: formData.surgeBaseFare ? Number(formData.surgeBaseFare) : undefined,
          levyAmount: formData.levyAmount ? Number(formData.levyAmount) : undefined,
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
          waitTimeFeePerMinute: Number(formData.waitTimeFeePerMinute),
          waitTimeFeeCap: Number(formData.waitTimeFeeCap),
          cancellationPenaltyFee: Number(formData.cancellationPenaltyFee),
          maxFinalMultiplier: Number(formData.maxFinalMultiplier),
        },
        billPaymentFee: Number(formData.billPaymentFee),
        withdrawalFeeStructure: {
          baseFee: Number(cleanNumber(formData.withdrawalBaseFee)),
          highTierThreshold: Number(cleanNumber(formData.withdrawalHighTierThreshold)),
          highTierFee: Number(cleanNumber(formData.withdrawalHighTierFee)),
        },
        allowRewardsForBillPayments: formData.allowRewardsForBills,
        allowRewardsForTripDiscount: formData.allowRewardsForTripDiscount,
        allowRewardsForCommission: formData.allowRewardsForCommission,
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Fare (₦)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.baseFare}
                onChange={(e) => setFormData(prev => ({...prev, baseFare: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="600"
              />
              <p className="text-xs text-gray-500 mt-1">Normal off-peak base fare</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Surge Base Fare (₦)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.surgeBaseFare}
                onChange={(e) => setFormData(prev => ({...prev, surgeBaseFare: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="800"
              />
              <p className="text-xs text-gray-500 mt-1">Base fare during high demand</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Levy Amount (₦)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.levyAmount}
                onChange={(e) => setFormData(prev => ({...prev, levyAmount: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="30"
              />
              <p className="text-xs text-gray-500 mt-1">Fixed levy per ride</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Utility Payment Fee (₦)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.billPaymentFee}
                onChange={(e) => setFormData(prev => ({...prev, billPaymentFee: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="50"
              />
              <p className="text-xs text-gray-500 mt-1">Fee for Airtime, Data, Cable, & Power</p>
            </div>
          </div>
        </AccordionSection>

        {/* Distance Tiers */}
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
                        <input
                          type="number"
                          value={tier.min}
                          onChange={(e) =>
                            updateTier(index, "min", e.target.value)
                          }
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={tier.max}
                          onChange={(e) =>
                            updateTier(index, "max", e.target.value)
                          }
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={tier.rate}
                          onChange={(e) =>
                            updateTier(index, "rate", e.target.value)
                          }
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
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

        {/* Vehicle Multipliers */}
        <AccordionSection
          title="3. Vehicle Multipliers"
          isOpen={openSections.vehicles}
          onToggle={() => toggleSection("vehicles")}
          tooltip="Multipliers applied to base price. Motorbike = 1.0x baseline. Higher values for premium vehicles."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(vehicleMultipliers).map(([vehicle, value]) => (
              <div key={vehicle}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {vehicle.replace("_", " ")}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) =>
                    setVehicleMultipliers({
                      ...vehicleMultipliers,
                      [vehicle]: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* Traffic Dampening */}
        <AccordionSection
          title="4. Traffic Dampening"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Minutes per KM
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.baseMinutesPerKm}
                    onChange={(e) => setFormData(prev => ({...prev, baseMinutesPerKm: e.target.value}))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Expected travel time</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Traffic Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.maxTrafficMultiplier}
                    onChange={(e) => setFormData(prev => ({...prev, maxTrafficMultiplier: e.target.value}))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum surge cap</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.minDistanceKm}
                    onChange={(e) => setFormData(prev => ({...prev, minDistanceKm: e.target.value}))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ignore traffic below this distance
                  </p>
                </div>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Demand Surge */}
        <AccordionSection
          title="5. Demand Surge (Auto-Mode)"
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Ratio
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.baseRatio}
                        onChange={(e) => setFormData(prev => ({...prev, baseRatio: e.target.value}))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Orders/rider threshold
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Step (Aggressiveness)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.surgeStep}
                        onChange={(e) => setFormData(prev => ({...prev, surgeStep: e.target.value}))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        How fast prices rise
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Multiplier
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.demandMaxMultiplier}
                      onChange={(e) => setFormData(prev => ({...prev, demandMaxMultiplier: e.target.value}))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum cap</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Rider Bidding */}
        <AccordionSection
          title="6. Rider Bidding Guardrails"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floor (Min %)
                  </label>
                  <input
                    type="number"
                    value={formData.minPercent}
                    onChange={(e) => setFormData(prev => ({...prev, minPercent: e.target.value}))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How low riders can bid (e.g., -20%)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ceiling (Max %)
                  </label>
                  <input
                    type="number"
                    value={formData.maxPercent}
                    onChange={(e) => setFormData(prev => ({...prev, maxPercent: e.target.value}))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How high riders can bid (e.g., +30%)
                  </p>
                </div>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Wait Time & Cancellation */}
        <AccordionSection
          title="7. Wait Time & Cancellation Fees"
          isOpen={openSections.waitTime}
          onToggle={() => toggleSection("waitTime")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Free Wait Minutes
              </label>
              <input
                type="number"
                value={formData.freeWaitMinutes}
                onChange={(e) => setFormData(prev => ({...prev, freeWaitMinutes: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wait Time Fee per Minute (₦)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.waitTimeFeePerMinute}
                onChange={(e) => setFormData(prev => ({...prev, waitTimeFeePerMinute: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wait Time Fee Cap (₦)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.waitTimeFeeCap}
                onChange={(e) => setFormData(prev => ({...prev, waitTimeFeeCap: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Penalty Fee (₦)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cancellationPenaltyFee}
                onChange={(e) => setFormData(prev => ({...prev, cancellationPenaltyFee: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </AccordionSection>

        {/* First Order Promo */}


        {/* Withdrawal Fees */}
        <AccordionSection
          title="8. Withdrawal Fees"
          isOpen={openSections.withdrawal}
          onToggle={() => toggleSection("withdrawal")}
          tooltip="Configure fees deducted from rider withdrawals."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Fee (₦)
              </label>
              <input
                type="text"
                value={formData.withdrawalBaseFee}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  if (!isNaN(val)) {
                      setFormData(prev => ({...prev, withdrawalBaseFee: formatNumber(val)}))
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Fee for amounts below threshold</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                High Tier Threshold (₦)
              </label>
              <input
                type="text"
                value={formData.withdrawalHighTierThreshold}
                onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    if (!isNaN(val)) {
                        setFormData(prev => ({...prev, withdrawalHighTierThreshold: formatNumber(val)}))
                    }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Amount triggering higher fee</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                High Tier Fee (₦)
              </label>
              <input
                type="text"
                value={formData.withdrawalHighTierFee}
                onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    if (!isNaN(val)) {
                        setFormData(prev => ({...prev, withdrawalHighTierFee: formatNumber(val)}))
                    }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Fee for high value withdrawals</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-100">
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
        </AccordionSection>

        {/* Global Caps */}
        <AccordionSection
          title="8. Global Caps & Trust"
          isOpen={openSections.caps}
          onToggle={() => toggleSection("caps")}
          tooltip="Maximum total multiplier that can be applied (traffic + demand + vehicle combined)."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Final Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.maxFinalMultiplier}
                onChange={(e) => setFormData(prev => ({...prev, maxFinalMultiplier: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Prevents prices from going too high
              </p>
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

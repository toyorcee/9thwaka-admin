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
    billPaymentFee: "30",
    airtimeBillFee: "0",
    dataBillFee: "0",
    cableBillFee: "0",
    electricityBillFee: "0",
    bettingBillFee: "0",
    withdrawalSmallFlatFee: "50",
    withdrawalPercentageFee: "0.02",
    withdrawalAbsorbLimitAmount: "20000",
    minimumWalletBalance: "500",
    minimumWithdrawalAmount: "100",
    maxBenefitCommissionPercent: "50",
    riderFreeWithdrawalsPerDay: "1",
    maxFreeWithdrawalAmount: "10000",
    withdrawalCooldownMinutes: "60",
    absorbFees: true,
    allowRewardsForBills: false,
    weeklyRewardCapOrders: "1500",
    weeklyRewardCapUtilities: "300",
    displaySavingsToUser: true,
    cablePercent: "18",
    cableFixed: "50",
    electricityFixed: "50",
    bettingFixed: "50",
    cableBillFee: "0",
    electricityBillFee: "0",
    bettingBillFee: "0",
    // Tiered Withdrawal Fees (CBN)
    tieredFeesEnabled: true,
    vatPercent: "7.5",
    stampDutyThreshold: "10000",
    stampDutyAmount: "50",
    tier1Limit: "5000",
    tier1Fee: "10",
    tier2Limit: "50000",
    tier2Fee: "25",
    tier3Fee: "50",
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
  const [pricingPreview, setPricingPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeNetworkTab, setActiveNetworkTab] = useState("mtn");
  const [activeServiceTab, setActiveServiceTab] = useState("data"); // data, cable, power



  useEffect(() => {
    loadSettings();
  }, []);

  const fetchPreview = async () => {
    try {
      setPreviewLoading(true);
      const data = await fetchPricingPreview();
      setPricingPreview(data.preview);
    } catch (error) {
      console.error("Preview failed:", error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminSettings();
      const pricing = data?.settings?.pricing;

      if (pricing) {
        setFormData({
          baseFare: pricing.baseFare ? formatNumber(pricing.baseFare) : "",
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
          billPaymentFee: formatNumber(data.settings.billPaymentFee !== undefined ? data.settings.billPaymentFee : 30),
          // Withdrawal Fees (using withdrawalControls)
          withdrawalSmallFlatFee: formatNumber(data.settings.withdrawalControls?.smallFlatFee ?? 50),
          withdrawalPercentageFee: String(data.settings.withdrawalControls?.percentageFee ?? 0.02),
          withdrawalAbsorbLimitAmount: formatNumber(data.settings.withdrawalControls?.absorbLimitAmount ?? 20000),
          minimumWalletBalance: formatNumber(data.settings.minimumWalletBalance ?? 500),
          minimumWithdrawalAmount: formatNumber(data.settings.minimumWithdrawalAmount ?? 100),
          maxBenefitCommissionPercent: String(data.settings.maxBenefitCommissionPercent ?? 50),
          riderFreeWithdrawalsPerDay: String(data.settings.withdrawalControls?.riderFreeWithdrawalsPerDay ?? 1),
          maxFreeWithdrawalAmount: formatNumber(data.settings.withdrawalControls?.maxFreeWithdrawalAmount ?? 10000),
          withdrawalCooldownMinutes: String(data.settings.withdrawalControls?.withdrawalCooldownMinutes ?? 60),
          absorbFees: data.settings.withdrawalControls?.absorbFees ?? true,
          // Rewards
          allowRewardsForBills: data.settings.allowRewardsForBillPayments !== undefined ? data.settings.allowRewardsForBillPayments : false,
          allowRewardsForTripDiscount: data.settings.allowRewardsForTripDiscount || false,
          allowRewardsForCommission: data.settings.allowRewardsForCommission || false,
          weeklyRewardCapOrders: formatNumber(data.settings.weeklyRewardCapOrders !== undefined ? data.settings.weeklyRewardCapOrders : 1500),
          weeklyRewardCapUtilities: formatNumber(data.settings.weeklyRewardCapUtilities !== undefined ? data.settings.weeklyRewardCapUtilities : 300),
          airtimePercent: String(data.settings.pricingControls?.airtimePercent || 0),
          airtimeFixed: String(data.settings.pricingControls?.airtimeFixed || 0),
          airtimeBillFee: String(data.settings.pricingControls?.airtimeBillFee ?? 0),
          dataPercent: String(data.settings.pricingControls?.dataPercent || 0),
          dataFixed: String(data.settings.pricingControls?.dataFixed || 0),
          dataBillFee: String(data.settings.pricingControls?.dataBillFee ?? 0),
          standardDataMarkupPercent: String(data.settings.pricingControls?.standardDataMarkupPercent || 2),
          displaySavingsToUser: data.settings.pricingControls?.displaySavingsToUser ?? true,
          cablePercent: String(data.settings.pricingControls?.cablePercent || 15),
          cableFixed: String(data.settings.pricingControls?.cableFixed || 50),
          cableBillFee: String(data.settings.pricingControls?.cableBillFee ?? 0),
          electricityFixed: String(data.settings.pricingControls?.electricityFixed || 100),
          electricityBillFee: String(data.settings.pricingControls?.electricityBillFee ?? 0),
          bettingFixed: String(data.settings.pricingControls?.bettingFixed || 100),
          bettingBillFee: String(data.settings.pricingControls?.bettingBillFee ?? 0),
          // Tiered Withdrawals
          tieredFeesEnabled: data.settings.withdrawalControls?.tieredFeesEnabled ?? true,
          vatPercent: String(data.settings.withdrawalControls?.vatPercent ?? 7.5),
          stampDutyThreshold: formatNumber(data.settings.withdrawalControls?.stampDutyThreshold ?? 10000),
          stampDutyAmount: formatNumber(data.settings.withdrawalControls?.stampDutyAmount ?? 50),
          tier1Limit: formatNumber(data.settings.withdrawalControls?.tier1Limit ?? 5000),
          tier1Fee: formatNumber(data.settings.withdrawalControls?.tier1Fee ?? 10),
          tier2Limit: formatNumber(data.settings.withdrawalControls?.tier2Limit ?? 50000),
          tier2Fee: formatNumber(data.settings.withdrawalControls?.tier2Fee ?? 25),
          tier3Fee: formatNumber(data.settings.withdrawalControls?.tier3Fee ?? 50),
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

        fetchPreview();
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
          baseFare: formData.baseFare ? Number(cleanNumber(formData.baseFare)) : undefined,
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
          vehicleBaseFares: {
            bicycle: Number(vehicleBaseFares.bicycle),
            motorbike: Number(vehicleBaseFares.motorbike),
            tricycle: Number(vehicleBaseFares.tricycle),
            car: Number(vehicleBaseFares.car),
            van: Number(vehicleBaseFares.van),
            car_standard: Number(vehicleBaseFares.car_standard),
            car_comfort: Number(vehicleBaseFares.car_comfort),
            car_premium: Number(vehicleBaseFares.car_premium),
          },
          vehicleMinFares: {
            bicycle: Number(vehicleMinFares.bicycle),
            motorbike: Number(vehicleMinFares.motorbike),
            tricycle: Number(vehicleMinFares.tricycle),
            car: Number(vehicleMinFares.car),
            van: Number(vehicleMinFares.van),
            car_standard: Number(vehicleMinFares.car_standard),
            car_comfort: Number(vehicleMinFares.car_comfort),
            car_premium: Number(vehicleMinFares.car_premium),
          },
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
        billPaymentFee: Number(cleanNumber(formData.billPaymentFee)),
        withdrawalControls: {
          smallFlatFee: Number(cleanNumber(formData.withdrawalSmallFlatFee)),
          percentageFee: Number(formData.withdrawalPercentageFee),
          absorbLimitAmount: Number(cleanNumber(formData.withdrawalAbsorbLimitAmount)),
          riderFreeWithdrawalsPerDay: Number(formData.riderFreeWithdrawalsPerDay),
          maxFreeWithdrawalAmount: Number(cleanNumber(formData.maxFreeWithdrawalAmount)),
          withdrawalCooldownMinutes: Number(formData.withdrawalCooldownMinutes),
          absorbFees: formData.absorbFees,
          // CBN Tiers
          tieredFeesEnabled: formData.tieredFeesEnabled,
          vatPercent: Number(formData.vatPercent),
          stampDutyThreshold: Number(cleanNumber(formData.stampDutyThreshold)),
          stampDutyAmount: Number(cleanNumber(formData.stampDutyAmount)),
          tier1Limit: Number(cleanNumber(formData.tier1Limit)),
          tier1Fee: Number(cleanNumber(formData.tier1Fee)),
          tier2Limit: Number(cleanNumber(formData.tier2Limit)),
          tier2Fee: Number(cleanNumber(formData.tier2Fee)),
          tier3Fee: Number(cleanNumber(formData.tier3Fee)),
        },
        minimumWalletBalance: Number(cleanNumber(formData.minimumWalletBalance)),
        minimumWithdrawalAmount: Number(cleanNumber(formData.minimumWithdrawalAmount)),
        maxBenefitCommissionPercent: Number(formData.maxBenefitCommissionPercent),
        allowRewardsForBillPayments: formData.allowRewardsForBills,
        allowRewardsForTripDiscount: formData.allowRewardsForTripDiscount,
        allowRewardsForCommission: formData.allowRewardsForCommission,
        weeklyRewardCapOrders: Number(cleanNumber(formData.weeklyRewardCapOrders)) || 1500,
        weeklyRewardCapUtilities: Number(cleanNumber(formData.weeklyRewardCapUtilities)) || 300,
        pricingControls: {
          airtimePercent: Number(formData.airtimePercent),
          airtimeFixed: Number(formData.airtimeFixed),
          airtimeBillFee: Number(formData.airtimeBillFee),
          dataPercent: Number(formData.dataPercent),
          dataFixed: Number(formData.dataFixed),
          dataBillFee: Number(formData.dataBillFee),
          standardDataMarkupPercent: Number(formData.standardDataMarkupPercent),
          displaySavingsToUser: formData.displaySavingsToUser,
          cablePercent: Number(formData.cablePercent),
          cableFixed: Number(formData.cableFixed),
          cableBillFee: Number(formData.cableBillFee),
          electricityFixed: Number(formData.electricityFixed),
          electricityBillFee: Number(formData.electricityBillFee),
          bettingFixed: Number(formData.bettingFixed),
          bettingBillFee: Number(formData.bettingBillFee),
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
            <ValidatedInput
                label="Utility Payment Fee (₦)"
                value={formData.billPaymentFee}
                onChange={(val) => setFormData(prev => ({...prev, billPaymentFee: val}))}
                isCurrency={true}
                placeholder="50"
                className="font-bold"
                helperText="Global fallback fee."
            />
            <ValidatedInput
                label="Cable TV Markup (%)"
                value={formData.cablePercent}
                onChange={(val) => setFormData(prev => ({...prev, cablePercent: val}))}
                isCurrency={true}
                placeholder="15"
                className="font-bold text-sky-600"
                helperText="Percentage markup on face value"
            />
            <ValidatedInput
                label="Cable Fixed Fee (₦)"
                value={formData.cableFixed}
                onChange={(val) => setFormData(prev => ({...prev, cableFixed: val}))}
                isCurrency={true}
                placeholder="50"
                className="font-bold text-sky-600"
            />
            <ValidatedInput
                label="Electricity Fee (₦)"
                value={formData.electricityFixed}
                onChange={(val) => setFormData(prev => ({...prev, electricityFixed: val}))}
                isCurrency={true}
                placeholder="0"
                className="font-bold text-amber-600"
                helperText="Token service fee (e.g. 50 for more profit)"
            />
          </div>
        </AccordionSection>

        {/* 1b. Service Pricing (Airtime & Data) */}
        <AccordionSection
          title="1b. Service Pricing (Airtime & Data)"
          isOpen={openSections.services}
          onToggle={() => toggleSection("services")}
          tooltip="Set markups or subsidies for Airtime and Data services. Use negative values for subsidies (Absorption)."
        >
          <div className="space-y-8">
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-indigo-600" />
                        Airtime Pricing
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <ValidatedInput
                            label="Markup (%)"
                            value={formData.airtimePercent}
                            onChange={(val) => setFormData(prev => ({...prev, airtimePercent: val}))}
                            type="number"
                            step="0.1"
                        />
                        <ValidatedInput
                            label="Fixed Fee (₦)"
                            value={formData.airtimeFixed}
                            onChange={(val) => setFormData(prev => ({...prev, airtimeFixed: val}))}
                            type="number"
                        />
                        <ValidatedInput
                            label="Bill Fee (₦) — Added to total price"
                            value={formData.airtimeBillFee}
                            onChange={(val) => setFormData(prev => ({...prev, airtimeBillFee: val}))}
                            type="number"
                            className="font-bold text-indigo-600 bg-indigo-50"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <WifiIcon className="h-5 w-5 text-blue-600" />
                        Data Pricing
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <ValidatedInput
                            label="Markup (%)"
                            value={formData.dataPercent}
                            onChange={(val) => setFormData(prev => ({...prev, dataPercent: val}))}
                            type="number"
                            step="0.1"
                        />
                        <ValidatedInput
                            label="Fixed Fee (₦)"
                            value={formData.dataFixed}
                            onChange={(val) => setFormData(prev => ({...prev, dataFixed: val}))}
                            type="number"
                        />
                        <ValidatedInput
                            label="Bill Fee (₦) — Added to total price"
                            value={formData.dataBillFee}
                            onChange={(val) => setFormData(prev => ({...prev, dataBillFee: val}))}
                            type="number"
                            className="font-bold text-blue-600 bg-blue-50"
                        />
                    </div>
                </div>
            </div>

            {/* Cable, Electricity & Betting */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TvIcon className="h-5 w-5 text-purple-600" />
                        Cable TV
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                                <ValidatedInput
                                    label="Markup (%)"
                                    value={formData.cablePercent}
                                    onChange={(val) => setFormData(prev => ({...prev, cablePercent: val}))}
                                    type="number"
                                />
                                <ValidatedInput
                                    label="Fixed Fee (₦)"
                                    value={formData.cableFixed}
                                    onChange={(val) => setFormData(prev => ({...prev, cableFixed: val}))}
                                    type="number"
                                />
                        </div>
                        <ValidatedInput
                            label="Bill Fee (₦)"
                            value={formData.cableBillFee}
                            onChange={(val) => setFormData(prev => ({...prev, cableBillFee: val}))}
                            type="number"
                            className="font-bold text-purple-600 bg-purple-50"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <BoltIcon className="h-5 w-5 text-orange-600" />
                        Electricity
                    </h3>
                    <div className="space-y-4">
                        <ValidatedInput
                            label="Fixed Service Fee (₦)"
                            value={formData.electricityFixed}
                            onChange={(val) => setFormData(prev => ({...prev, electricityFixed: val}))}
                            type="number"
                        />
                        <ValidatedInput
                            label="Bill Fee (₦)"
                            value={formData.electricityBillFee}
                            onChange={(val) => setFormData(prev => ({...prev, electricityBillFee: val}))}
                            type="number"
                            className="font-bold text-orange-600 bg-orange-50"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-emerald-600" />
                        Sports Betting
                    </h3>
                    <div className="space-y-4">
                        <ValidatedInput
                            label="Fixed Service Fee (₦)"
                            value={formData.bettingFixed}
                            onChange={(val) => setFormData(prev => ({...prev, bettingFixed: val}))}
                            type="number"
                        />
                        <ValidatedInput
                            label="Bill Fee (₦)"
                            value={formData.bettingBillFee}
                            onChange={(val) => setFormData(prev => ({...prev, bettingBillFee: val}))}
                            type="number"
                            className="font-bold text-emerald-600 bg-emerald-50"
                        />
                    </div>
                </div>
            </div>

            {/* WOW Factor Tracking */}
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2 mb-4">
                    <SparklesIcon className="h-5 w-5 text-indigo-600" />
                    Market Advantage (WOW Factor)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <ValidatedInput
                            label="Standard Market Markup (%)"
                            value={formData.standardDataMarkupPercent}
                            onChange={(val) => setFormData(prev => ({...prev, standardDataMarkupPercent: val}))}
                            type="number"
                            className="w-full md:w-48 border-indigo-200"
                        />
                    <div className="flex items-center gap-3">
                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                            <input
                                type="checkbox"
                                name="displaySavingsToUser"
                                id="displaySavingsToUser"
                                checked={formData.displaySavingsToUser}
                                onChange={(e) => setFormData(prev => ({...prev, displaySavingsToUser: e.target.checked}))}
                                className="absolute w-6 h-6 border-4 rounded-full appearance-none cursor-pointer border-gray-300 bg-white checked:bg-indigo-600 checked:right-0 right-6 transition-all"
                            />
                            <label htmlFor="displaySavingsToUser" className="block h-6 overflow-hidden bg-gray-300 rounded-full cursor-pointer"></label>
                        </div>
                        <span className="text-sm font-bold text-indigo-900">Show savings labels to users</span>
                    </div>
                </div>
            </div>

                {/* Live Pricing Preview */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Live Rate Preview</h3>
                    
                    <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-xl">
                        {[
                            { id: 'data', label: 'Data Plans', icon: WifiIcon },
                            { id: 'airtime', label: 'Airtime', icon: DevicePhoneMobileIcon },
                            { id: 'cable', label: 'Cable TV', icon: TvIcon },
                            { id: 'power', label: 'Electricity', icon: BoltIcon }
                        ].map(service => (
                            <button
                                key={service.id}
                                type="button"
                                onClick={() => setActiveServiceTab(service.id)}
                                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeServiceTab === service.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <service.icon className="h-4 w-4" />
                                {service.label}
                            </button>
                        ))}
                    </div>
                </div>

                {(activeServiceTab === 'data') && (
                    <div className="flex justify-start gap-2 overflow-x-auto pb-2">
                        {['mtn', 'glo', 'airtel', '9mobile'].map(net => (
                            <button
                                key={net}
                                type="button"
                                onClick={() => setActiveNetworkTab(net)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase flex-shrink-0 ${activeNetworkTab === net ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                {net}
                            </button>
                        ))}
                    </div>
                )}
                
                {activeServiceTab === 'cable' && (
                    <div className="flex justify-start gap-2 overflow-x-auto pb-2">
                        {['dstv', 'gotv', 'startimes'].map(prov => (
                            <button
                                key={prov}
                                type="button"
                                onClick={() => setActiveNetworkTab(prov)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase flex-shrink-0 ${activeNetworkTab === prov ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                {prov}
                            </button>
                        ))}
                    </div>
                )}

                {previewLoading && (
                    <div className="bg-white border rounded-xl p-12 text-center text-gray-400 animate-pulse">Fetching live rates from Payscribe...</div>
                )}

                {/* DATA TABLE */}
                {!previewLoading && activeServiceTab === 'data' && (
                    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plan Name</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payscribe Cost (Admin)</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Our Price (User Pays)</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Position</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">User Saves vs Market</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {!pricingPreview?.data?.[activeNetworkTab]?.length ? (
                                    <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No data plans fetched yet. Click "Fetch Live Rates" above.</td></tr>
                                ) : (
                                    pricingPreview.data[activeNetworkTab].map((plan, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900">{plan.name}</p>
                                                {plan.validity && <p className="text-[10px] text-gray-400 uppercase">{plan.validity}</p>}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-600">₦{plan.payscribeCost?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm font-black text-gray-900">₦{plan.systemPrice?.toLocaleString()}</td>
                                            <td className={`px-6 py-4 text-sm font-bold ${plan.netPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {plan.netPosition >= 0 ? '+' : ''}₦{plan.netPosition?.toLocaleString()}
                                                <span className="text-[10px] ml-1 block opacity-60">{plan.netPosition >= 0 ? 'PROFIT' : 'ABSORBED'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                                                    <ArrowTrendingDownIcon className="h-3 w-3" />
                                                    <span className="text-xs font-black">₦{plan.userSavings?.toLocaleString()} SAVE</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* AIRTIME TABLE */}
                {!previewLoading && activeServiceTab === 'airtime' && (
                    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
                            <p className="text-xs text-amber-700 font-bold">
                                📋 For Airtime, Payscribe deducts a commission % from your admin wallet after each transaction. Amounts below are calculated per ₦1,000 purchased.
                            </p>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Network</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payscribe Commission</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Our Markup (per ₦1k)</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payscribe Absorbed (per ₦1k)</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Position</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {(pricingPreview?.airtime || []).map((network, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-black text-gray-900">{network.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">{network.payscribeCommissionPercent}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-800">₦{network.ourMarkupPer1000}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-rose-500">-₦{network.payscribeAbsorbedPer1000}</td>
                                        <td className={`px-6 py-4 text-sm font-bold ${network.netPositionPer1000 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {network.netPositionPer1000 >= 0 ? '+' : ''}₦{network.netPositionPer1000}
                                            <span className="text-[10px] ml-1 block opacity-60">{network.description}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* CABLE TV TABLE */}
                {!previewLoading && activeServiceTab === 'cable' && (
                    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
                            <p className="text-xs text-amber-700 font-bold">
                                📋 For Cable TV, Payscribe deducts a cable commission % from your admin wallet. Your revenue is the fixed Bill Payment Fee you set.
                            </p>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bouquet</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Face Value</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Commission Rate</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payscribe Absorbed</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Our Revenue (Fee)</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Position</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {(pricingPreview?.cable?.[activeNetworkTab] || []).map((plan, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{plan.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">₦{plan.faceValue?.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">{plan.payscribeCommission}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-rose-500">-₦{plan.payscribeAbsorbed}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-800">₦{plan.ourRevenue}</td>
                                        <td className={`px-6 py-4 text-sm font-bold ${plan.netPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {plan.netPosition >= 0 ? '+' : ''}₦{plan.netPosition}
                                            <span className="text-[10px] ml-1 block opacity-60">{plan.netPosition >= 0 ? 'PROFIT' : 'ABSORBED'}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ELECTRICITY TABLE */}
                {!previewLoading && activeServiceTab === 'power' && (
                    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
                            <p className="text-xs text-amber-700 font-bold">
                                📋 For Electricity, Payscribe deducts a % from your admin wallet per top-up. Calculations shown per ₦5,000 purchased.
                            </p>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Disco (Provider)</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Commission Rate</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Absorbed per ₦5k</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Our Revenue (Fee)</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Position per ₦5k</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {(pricingPreview?.power || []).map((disco, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900">{disco.name}</p>
                                            <p className="text-[10px] text-gray-400 uppercase">{disco.discoCode}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">{disco.payscribeCommission}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-rose-500">-₦{disco.payscribeAbsorbedPer5000}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-800">₦{disco.ourRevenuePer5000}</td>
                                        <td className={`px-6 py-4 text-sm font-bold ${disco.netPositionPer5000 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {disco.netPositionPer5000 >= 0 ? '+' : ''}₦{disco.netPositionPer5000}
                                            <span className="text-[10px] ml-1 block opacity-60">{disco.position}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
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

        {/* 3b. Vehicle-Specific Base & Min Fares */}
        <AccordionSection
          title="3b. Vehicle-Specific Base & Min Fares"
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

        {/* 3c. Capacity & Weight Restrictions */}
        <AccordionSection
          title="3c. Capacity & Weight Restrictions"
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

        {/* Wait Time & Cancellation */}
        <AccordionSection
          title="7. Wait Time & Cancellation Fees"
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

        {/* First Order Promo */}


        {/* Withdrawal Fees & Protections */}
        <AccordionSection
          title="8. Withdrawal Fees & Protections"
          isOpen={openSections.withdrawal}
          onToggle={() => toggleSection("withdrawal")}
          tooltip="Configure global constraints, fee subsidies, and protection rules."
        >
          {/* Global Wallet Constraints */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-gray-100">
            <ValidatedInput
              label="Min Wallet Balance (₦)"
              value={formData.minimumWalletBalance}
              onChange={(val) => setFormData(prev => ({...prev, minimumWalletBalance: val}))}
              isCurrency={true}
              placeholder="500"
              helperText="Required to request withdrawal"
            />
            <ValidatedInput
              label="Min Withdrawal Amount (₦)"
              value={formData.minimumWithdrawalAmount}
              onChange={(val) => setFormData(prev => ({...prev, minimumWithdrawalAmount: val}))}
              isCurrency={true}
              placeholder="100"
              helperText="Lowest amount per withdrawal"
            />
            <ValidatedInput
                label="Max Benefit Allowed (%)"
                value={formData.maxBenefitCommissionPercent}
                onChange={(val) => setFormData(prev => ({...prev, maxBenefitCommissionPercent: val}))}
                type="number"
                placeholder="50"
                helperText="High Commission threshold alert"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ValidatedInput
                label="Small Zone Flat Fee (₦)"
                value={formData.withdrawalSmallFlatFee}
                onChange={(val) => setFormData(prev => ({...prev, withdrawalSmallFlatFee: val}))}
                isCurrency={true}
                placeholder="50"
                helperText="Flat fee for small withdrawals"
            />
            <ValidatedInput
                label="Medium Zone Percentage Fee (%)"
                value={formData.withdrawalPercentageFee}
                onChange={(val) => setFormData(prev => ({...prev, withdrawalPercentageFee: val}))}
                type="number"
                step="0.001"
                placeholder="0.02"
                helperText="e.g. 0.02 for 2%"
                className="text-indigo-600"
            />
            <ValidatedInput
                label="Max Fee Absorption Limit (₦)"
                value={formData.withdrawalAbsorbLimitAmount}
                onChange={(val) => setFormData(prev => ({...prev, withdrawalAbsorbLimitAmount: val}))}
                isCurrency={true}
                placeholder="20,000"
                helperText="Passing BANK fees after this limit"
                labelClassName="text-red-600"
            />
          </div>

          <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-xl mb-8">
              <div className="flex gap-3">
                  <InformationCircleIcon className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  <p className="text-xs text-orange-800 leading-relaxed italic">
                      "When <strong>Tiered Fees (CBN Rules)</strong> is enabled, the platform follows the official tiered structure (₦10/₦25/₦50) + 7.5% VAT + ₦50 Stamp Duty. These fees are ALWAYS forced to be at least the Payscribe cost to prevent loss. Toggling this OFF reverts to the Flat/Percentage rules above."
                  </p>
              </div>
          </div>

          <div className="mb-8 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
                <h3 className="text-lg font-black text-indigo-900 uppercase tracking-tight">Tiered Withdrawal Fees (CBN Rules)</h3>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="tieredFeesEnabled"
                  checked={formData.tieredFeesEnabled}
                  onChange={e => setFormData(prev => ({...prev, tieredFeesEnabled: e.target.checked}))}
                  className="h-5 w-5 text-indigo-600 rounded" />
                <label htmlFor="tieredFeesEnabled" className="text-sm font-bold text-indigo-900">Enable Tiers</label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <ValidatedInput
                 label="VAT Percentage (%)"
                 value={formData.vatPercent}
                 onChange={val => setFormData(prev => ({...prev, vatPercent: val}))}
                 type="number"
                 step="0.1"
                 className="font-bold"
                 labelClassName="text-xs font-bold text-indigo-500 uppercase mb-1"
               />
               <ValidatedInput
                 label="Stamp Duty (₦)"
                 value={formData.stampDutyAmount}
                 onChange={val => setFormData(prev => ({...prev, stampDutyAmount: val}))}
                 isCurrency={true}
                 className="font-bold"
                 labelClassName="text-xs font-bold text-indigo-500 uppercase mb-1"
               />
               <ValidatedInput
                 label="Stamp Threshold (₦)"
                 value={formData.stampDutyThreshold}
                 onChange={val => setFormData(prev => ({...prev, stampDutyThreshold: val}))}
                 isCurrency={true}
                 className="font-bold"
                 labelClassName="text-xs font-bold text-indigo-500 uppercase mb-1"
               />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-indigo-100">
               <div className="p-4 bg-white/50 rounded-xl border border-indigo-50">
                  <p className="text-[10px] font-black text-indigo-400 uppercase mb-3">Tier 1 (Small)</p>
                  <ValidatedInput
                    label="Limit (₦)"
                    value={formData.tier1Limit}
                    onChange={val => setFormData(prev => ({...prev, tier1Limit: val}))}
                    isCurrency={true}
                    className="text-sm mb-3"
                    labelClassName="block text-xs font-bold text-gray-500 mb-1"
                  />
                  <ValidatedInput
                    label="Fee (₦)"
                    value={formData.tier1Fee}
                    onChange={val => setFormData(prev => ({...prev, tier1Fee: val}))}
                    isCurrency={true}
                    className="text-sm font-black text-indigo-600"
                    labelClassName="block text-xs font-bold text-gray-500 mb-1"
                  />
               </div>
               <div className="p-4 bg-white/50 rounded-xl border border-indigo-50">
                  <p className="text-[10px] font-black text-indigo-400 uppercase mb-3">Tier 2 (Medium)</p>
                  <ValidatedInput
                    label="Limit (₦)"
                    value={formData.tier2Limit}
                    onChange={val => setFormData(prev => ({...prev, tier2Limit: val}))}
                    isCurrency={true}
                    className="text-sm mb-3"
                    labelClassName="block text-xs font-bold text-gray-500 mb-1"
                  />
                  <ValidatedInput
                    label="Fee (₦)"
                    value={formData.tier2Fee}
                    onChange={val => setFormData(prev => ({...prev, tier2Fee: val}))}
                    isCurrency={true}
                    className="text-sm font-black text-indigo-600"
                    labelClassName="block text-xs font-bold text-gray-500 mb-1"
                  />
               </div>
               <div className="p-4 bg-white/50 rounded-xl border border-indigo-50">
                  <p className="text-[10px] font-black text-indigo-400 uppercase mb-3">Tier 3 (Large)</p>
                  <p className="text-xs text-indigo-300 italic mb-4">Applied to all amounts above Tier 2 limit.</p>
                  <ValidatedInput
                    label="Fee (₦)"
                    value={formData.tier3Fee}
                    onChange={val => setFormData(prev => ({...prev, tier3Fee: val}))}
                    isCurrency={true}
                    className="text-sm font-black text-indigo-600"
                    labelClassName="block text-xs font-bold text-gray-500 mb-1"
                  />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <ValidatedInput
                    label="Rider Free Daily Limit"
                    value={formData.riderFreeWithdrawalsPerDay}
                    onChange={(val) => setFormData(prev => ({...prev, riderFreeWithdrawalsPerDay: val}))}
                    type="number"
                    className="font-bold text-blue-600"
                    placeholder="1"
                    helperText="Free attempts per day"
                />

                <ValidatedInput
                    label="Max Free Amount (₦)"
                    value={formData.maxFreeWithdrawalAmount}
                    onChange={(val) => setFormData(prev => ({...prev, maxFreeWithdrawalAmount: val}))}
                    isCurrency={true}
                    className="font-bold"
                    placeholder="10,000"
                    helperText="Daily cap for 0-fee"
                />

                <ValidatedInput
                    label="Withdrawal Cooldown (Mins)"
                    value={formData.withdrawalCooldownMinutes}
                    onChange={(val) => setFormData(prev => ({...prev, withdrawalCooldownMinutes: val}))}
                    type="number"
                    className="text-indigo-700"
                    placeholder="60"
                    helperText="Wait time between requests"
                />

                <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Absorb Withdrawal Fees
                    </label>
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100 flex-1">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.absorbFees}
                                onChange={(e) => setFormData(prev => ({...prev, absorbFees: e.target.checked}))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className="text-xs font-bold uppercase text-gray-600">
                            {formData.absorbFees ? "Enabled" : "Disabled"}
                        </span>
                    </div>
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

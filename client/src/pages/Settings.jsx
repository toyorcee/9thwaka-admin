import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
  BanknotesIcon,
  GlobeAltIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  changePassword as changePasswordApi,
  fetchAdminSettings,
  updateAdminSettings,
  setFinancialPin,
  changeFinancialPin,
} from "../services/settingsApi";
import ValidatedInput from "../components/ValidatedInput";
import FinancialPinModal from "../components/FinancialPinModal";

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

const Settings = () => {
  // Accordion state
  const [openSections, setOpenSections] = useState({
    password: false,
    commission: true,
    search: false,
    scheduling: false,
    rewards: false,
    vehicles: false,
    support: false,
    security: false,
    compliance: false,
    financialPin: false,
    killSwitches: false,
  });

  // Kill-Switch states
  const [killSwitches, setKillSwitches] = useState({
    withdrawals: { global: true, customer: true, rider: true },
    services: { airtime: true, data: true, cable: true, electricity: true, betting: true },
    registrations: { customer: true, rider: true }
  });
  const [killSwitchesError, setKillSwitchesError] = useState(null);
  const [killSwitchesSaving, setKillSwitchesSaving] = useState(false);
  const [killSwitchesSuccessMessage, setKillSwitchesSuccessMessage] = useState(null);

  // Compliance states
  const [identityPoints, setIdentityPoints] = useState("");
  const [vehicleVerificationPoints, setVehicleVerificationPoints] = useState("");
  const [vehicleInspectionPoints, setVehicleInspectionPoints] = useState("");
  const [tier3CustomerPoints, setTier3CustomerPoints] = useState("");
  const [tier3RiderPoints, setTier3RiderPoints] = useState("");
  const [inspectionOfficeAddress, setInspectionOfficeAddress] = useState("");
  const [gracePeriodDays, setGracePeriodDays] = useState("");
  const [weeklyOrderLimit, setWeeklyOrderLimit] = useState("");
  const [complianceError, setComplianceError] = useState(null);
  const [complianceSaving, setComplianceSaving] = useState(false);
  const [complianceSuccessMessage, setComplianceSuccessMessage] = useState(null);

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [commissionRate, setCommissionRate] = useState("");
  const [commissionError, setCommissionError] = useState(null);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [commissionSuccessMessage, setCommissionSuccessMessage] =
    useState(null);
  const [defaultSearchRadiusKm, setDefaultSearchRadiusKm] = useState("");
  const [maxAllowedRadiusKm, setMaxAllowedRadiusKm] = useState("");
  const [radiusError, setRadiusError] = useState(null);
  const [radiusSaving, setRadiusSaving] = useState(false);
  const [radiusSuccessMessage, setRadiusSuccessMessage] = useState(null);
  const [useEtaBasedMatching, setUseEtaBasedMatching] = useState(false);
  const [maxEtaMinutes, setMaxEtaMinutes] = useState("");
  const [maxSearchTimeSeconds, setMaxSearchTimeSeconds] = useState("");

  // Scheduling states
  const [schedulingEnabled, setSchedulingEnabled] = useState(false);
  const [minBufferValue, setMinBufferValue] = useState("");

  // Financial PIN states
  const [pin, setPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinSaving, setPinSaving] = useState(false);
  const [pinError, setPinError] = useState(null);
  const [pinSuccess, setPinSuccess] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [minBufferUnit, setMinBufferUnit] = useState("minutes");
  const [maxDaysAhead, setMaxDaysAhead] = useState("");
  const [activationLeadMinutes, setActivationLeadMinutes] = useState("");
  const [schedulingError, setSchedulingError] = useState(null);
  const [schedulingSaving, setSchedulingSaving] = useState(false);
  const [schedulingSuccessMessage, setSchedulingSuccessMessage] = useState(null);

  // Birthday Promo states
  const [birthdayEnabled, setBirthdayEnabled] = useState(false);
  const [birthdayDiscount, setBirthdayDiscount] = useState("");
  const [birthdayError, setBirthdayError] = useState(null);
  const [birthdaySaving, setBirthdaySaving] = useState(false);
  const [birthdaySuccessMessage, setBirthdaySuccessMessage] = useState(null);

  // Support & Emergency Contacts states
  const [supportEmail, setSupportEmail] = useState("");
  const [supportWhatsapp, setSupportWhatsapp] = useState("");
  const [supportPhoneNumbers, setSupportPhoneNumbers] = useState(["", "", ""]);
  const [supportError, setSupportError] = useState(null);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSaving, setSupportSaving] = useState(false);
  const [supportSuccessMessage, setSupportSuccessMessage] = useState(null);

  const [lasemaPrimary, setLasemaPrimary] = useState("");
  const [lasemaSecondary, setLasemaSecondary] = useState("");
  const [lasemaPhone1, setLasemaPhone1] = useState("");
  const [lasemaPhone2, setLasemaPhone2] = useState("");
  const [emergencyError, setEmergencyError] = useState(null);
  const [emergencySaving, setEmergencySaving] = useState(false);
  const [emergencySuccessMessage, setEmergencySuccessMessage] = useState(null);

  // Vehicle Requirements states
  const [vehicleRequirements, setVehicleRequirements] = useState({
    car_standard: { minYear: "", requireAirConditioning: false },
    car_comfort: { minYear: "", requireAirConditioning: false },
    car_premium: { minYear: "", requireAirConditioning: false },
  });
  const [vehicleError, setVehicleError] = useState(null);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [vehicleSuccessMessage, setVehicleSuccessMessage] = useState(null);

  // Security states
  const [payscribeIps, setPayscribeIps] = useState(["", ""]);
  const [securityError, setSecurityError] = useState(null);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securitySuccessMessage, setSecuritySuccessMessage] = useState(null);

  // Financial PIN Modal State
  const [pinModal, setPinModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    onSuccess: null
  });

  const triggerPinGate = (title, description, onSuccess) => {
    setPinModal({
      isOpen: true,
      title,
      description,
      onSuccess
    });
  };



  // Search state
  const [searchTerm, setSearchTerm] = useState("");

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
    if (!supportSuccessMessage) return;
    const timeout = setTimeout(() => {
      setSupportSuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [supportSuccessMessage]);

  useEffect(() => {
    if (!emergencySuccessMessage) return;
    const timeout = setTimeout(() => {
      setEmergencySuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [emergencySuccessMessage]);

  useEffect(() => {
    if (!vehicleSuccessMessage) return;
    const timeout = setTimeout(() => {
      setVehicleSuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [vehicleSuccessMessage]);

  useEffect(() => {
    if (!securitySuccessMessage) return;
    const timeout = setTimeout(() => {
      setSecuritySuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [securitySuccessMessage]);



  useEffect(() => {
    if (!schedulingSuccessMessage) return;
    const timeout = setTimeout(() => {
      setSchedulingSuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [schedulingSuccessMessage]);

  useEffect(() => {
    if (!birthdaySuccessMessage) return;
    const timeout = setTimeout(() => {
      setBirthdaySuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [birthdaySuccessMessage]);

  useEffect(() => {
    if (!complianceSuccessMessage) return;
    const timeout = setTimeout(() => {
      setComplianceSuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [complianceSuccessMessage]);

  useEffect(() => {
    if (!killSwitchesSuccessMessage) return;
    const timeout = setTimeout(() => {
      setKillSwitchesSuccessMessage(null);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [killSwitchesSuccessMessage]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setCommissionLoading(true);
        setSupportLoading(true);
        setVehicleLoading(true);

        setCommissionError(null);
        setRadiusError(null);
        setSupportError(null);
        setVehicleError(null);

        setSchedulingError(null);
        setBirthdayError(null);
        const data = await fetchAdminSettings();
        const settings = data?.settings;

        const rate = settings?.commissionRate;
        if (rate !== undefined && rate !== null) {
          setCommissionRate(String(rate));
        } else {
          setCommissionRate("");
        }

        // Load system/radius settings
        const system = settings?.system;
        if (
          system &&
          system.defaultSearchRadiusKm !== undefined &&
          system.defaultSearchRadiusKm !== null
        ) {
          setDefaultSearchRadiusKm(String(system.defaultSearchRadiusKm));
        } else {
          setDefaultSearchRadiusKm("");
        }
        if (
          system &&
          system.maxAllowedRadiusKm !== undefined &&
          system.maxAllowedRadiusKm !== null
        ) {
          setMaxAllowedRadiusKm(String(system.maxAllowedRadiusKm));
        } else {
          setMaxAllowedRadiusKm("");
        }
        if (system && typeof system.useEtaBasedMatching === "boolean") {
          setUseEtaBasedMatching(system.useEtaBasedMatching);
        } else {
          setUseEtaBasedMatching(false);
        }
        if (
          system &&
          system.maxEtaMinutes !== undefined &&
          system.maxEtaMinutes !== null
        ) {
          setMaxEtaMinutes(String(system.maxEtaMinutes));
        } else {
          setMaxEtaMinutes("");
        }
        if (
          system &&
          system.maxSearchTimeSeconds !== undefined &&
          system.maxSearchTimeSeconds !== null
        ) {
          setMaxSearchTimeSeconds(String(system.maxSearchTimeSeconds));
        } else {
          setMaxSearchTimeSeconds("");
        }

        // Load support contacts
        const support = settings?.support;
        if (support) {
          setSupportEmail(support.email || "");
          setSupportWhatsapp(support.whatsapp || "");
          if (support.phoneNumbers && Array.isArray(support.phoneNumbers)) {
            const phones = [...support.phoneNumbers];
            while (phones.length < 3) phones.push("");
            setSupportPhoneNumbers(phones.slice(0, 3));
          } else {
            setSupportPhoneNumbers(["", "", ""]);
          }
        } else {
          setSupportEmail("");
          setSupportWhatsapp("");
          setSupportPhoneNumbers(["", "", ""]);
        }

        // Load emergency contacts
        const emergency = settings?.emergency;
        if (emergency) {
          setLasemaPrimary(emergency.lasemaPrimary || "");
          setLasemaSecondary(emergency.lasemaSecondary || "");
          setLasemaPhone1(emergency.lasemaPhone1 || "");
          setLasemaPhone2(emergency.lasemaPhone2 || "");
        } else {
          setLasemaPrimary("");
          setLasemaSecondary("");
          setLasemaPhone1("");
          setLasemaPhone2("");
        }

        // Load vehicle requirements
        const vehicleReqs = settings?.vehicleRequirements;
        if (vehicleReqs) {
          setVehicleRequirements({
            car_standard: {
              minYear: vehicleReqs.car_standard?.minYear
                ? String(vehicleReqs.car_standard.minYear)
                : "",
              requireAirConditioning:
                vehicleReqs.car_standard?.requireAirConditioning || false,
            },
            car_comfort: {
              minYear: vehicleReqs.car_comfort?.minYear
                ? String(vehicleReqs.car_comfort.minYear)
                : "",
              requireAirConditioning:
                vehicleReqs.car_comfort?.requireAirConditioning || false,
            },
            car_premium: {
              minYear: vehicleReqs.car_premium?.minYear
                ? String(vehicleReqs.car_premium.minYear)
                : "",
              requireAirConditioning:
                vehicleReqs.car_premium?.requireAirConditioning || false,
            },
          });
        } else {
          setVehicleRequirements({
            car_standard: { minYear: "", requireAirConditioning: false },
            car_comfort: { minYear: "", requireAirConditioning: false },
            car_premium: { minYear: "", requireAirConditioning: false },
          });
        }



        // Load scheduling settings
        const scheduling = settings?.scheduling;
        if (scheduling) {
          setSchedulingEnabled(!!scheduling.enabled);
          
          const totalMins = scheduling.minBufferMinutes || 0;
          if (totalMins > 0 && totalMins % 1440 === 0) {
            setMinBufferValue(String(totalMins / 1440));
            setMinBufferUnit("days");
          } else if (totalMins > 0 && totalMins % 60 === 0) {
            setMinBufferValue(String(totalMins / 60));
            setMinBufferUnit("hours");
          } else {
            setMinBufferValue(String(totalMins));
            setMinBufferUnit("minutes");
          }

          setMaxDaysAhead(
            scheduling.maxDaysAhead !== undefined
              ? String(scheduling.maxDaysAhead)
              : ""
          );

          setActivationLeadMinutes(
            scheduling.activationLeadMinutes !== undefined
              ? String(scheduling.activationLeadMinutes)
              : ""
          );
        } else {
          setSchedulingEnabled(false);
          setMinBufferValue("");
          setMinBufferUnit("minutes");
          setMaxDaysAhead("");
          setActivationLeadMinutes("");
        }

        // Load birthday settings
        const birthday = settings?.birthdayPromo;
        if (birthday) {
          setBirthdayEnabled(!!birthday.enabled);
          setBirthdayDiscount(
            birthday.discountPercent !== undefined
              ? String(birthday.discountPercent)
              : ""
          );
        } else {
          setBirthdayEnabled(false);
          setBirthdayDiscount("");
        }

        // Load Payscribe Security settings
        const ips = settings?.payscribeWebhookIps;
        if (ips && Array.isArray(ips)) {
          setPayscribeIps(ips.length > 0 ? ips : [""]);
        } else {
          setPayscribeIps(["162.254.34.78", "::ffff:162.254.34.78"]);
        }

        // Load Compliance settings
        const comp = settings?.compliance;
        if (comp) {
          setIdentityPoints(comp.identityPoints !== undefined ? String(comp.identityPoints) : "");
          setVehicleVerificationPoints(comp.vehicleVerificationPoints !== undefined ? String(comp.vehicleVerificationPoints) : "");
          setVehicleInspectionPoints(comp.vehicleInspectionPoints !== undefined ? String(comp.vehicleInspectionPoints) : "");
          setTier3CustomerPoints(comp.tier3CustomerPoints !== undefined ? String(comp.tier3CustomerPoints) : "");
          setTier3RiderPoints(comp.tier3RiderPoints !== undefined ? String(comp.tier3RiderPoints) : "");
          setGracePeriodDays(comp.gracePeriodDays !== undefined ? String(comp.gracePeriodDays) : "");
          setWeeklyOrderLimit(comp.weeklyOrderLimit !== undefined ? String(comp.weeklyOrderLimit) : "");
        }

        if (settings?.inspectionOfficeAddress) {
          setInspectionOfficeAddress(settings.inspectionOfficeAddress);
        }

        // Load Kill-Switches
        if (settings?.killSwitches) {
          setKillSwitches(settings.killSwitches);
        }
      } catch (e) {
        setCommissionError("Failed to load settings.");
        setSupportError("Failed to load contact settings.");
        setVehicleError("Failed to load vehicle requirements.");

      } finally {
        setCommissionLoading(false);
        setSupportLoading(false);
        setVehicleLoading(false);

      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      setSaving(true);
      await changePasswordApi({ currentPassword, newPassword });
      setSuccessMessage("Password updated successfully.");
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update password.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmitClick = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }
    triggerPinGate(
      "Authorize Password Change",
      "Updating your administrative password requires your 4-digit Financial PIN.",
      () => handleSubmit(e)
    );
  };

  const handleCommissionSubmit = async (e) => {
    e.preventDefault();
    setCommissionError(null);
    setCommissionSuccessMessage(null);

    if (commissionRate === "") {
      setCommissionError("Commission rate is required.");
      return;
    }

    const value = Number(commissionRate);
    if (Number.isNaN(value)) {
      setCommissionError("Commission rate must be a valid number.");
      return;
    }

    if (value < 0 || value > 100) {
      setCommissionError("Commission rate must be between 0 and 100.");
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
      setCommissionSuccessMessage("Commission rate updated successfully.");
      toast.success("Commission rate updated successfully.");
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update commission rate.";
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

    if (defaultSearchRadiusKm === "" || maxAllowedRadiusKm === "") {
      setRadiusError("Both radius values are required.");
      return;
    }

    const defaultValue = Number(defaultSearchRadiusKm);
    const maxValue = Number(maxAllowedRadiusKm);

    if (Number.isNaN(defaultValue) || Number.isNaN(maxValue)) {
      setRadiusError("Radius values must be valid numbers.");
      return;
    }

    if (defaultValue <= 0 || maxValue <= 0) {
      setRadiusError("Radius values must be greater than 0.");
      return;
    }

    if (defaultValue > maxValue) {
      setRadiusError("Default radius cannot be greater than maximum radius.");
      return;
    }

    let etaValue = null;
    if (maxEtaMinutes !== "") {
      etaValue = Number(maxEtaMinutes);
      if (Number.isNaN(etaValue)) {
        setRadiusError("Max ETA must be a valid number.");
        return;
      }
      if (etaValue < 3 || etaValue > 20) {
        setRadiusError("Max ETA must be between 3 and 20 minutes.");
        return;
      }
    }

    let searchTimeValue = null;
    if (maxSearchTimeSeconds !== "") {
      searchTimeValue = Number(maxSearchTimeSeconds);
      if (Number.isNaN(searchTimeValue)) {
        setRadiusError("Max search time must be a valid number.");
        return;
      }
      if (searchTimeValue < 30 || searchTimeValue > 180) {
        setRadiusError("Max search time must be between 30 and 180 seconds.");
        return;
      }
    }

    try {
      setRadiusSaving(true);
      const systemPayload = {
        defaultSearchRadiusKm: defaultValue,
        maxAllowedRadiusKm: maxValue,
        useEtaBasedMatching,
      };
      if (etaValue !== null) {
        systemPayload.maxEtaMinutes = etaValue;
      }
      if (searchTimeValue !== null) {
        systemPayload.maxSearchTimeSeconds = searchTimeValue;
      }
      const payload = {
        system: systemPayload,
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
      if (
        system &&
        typeof system.useEtaBasedMatching === "boolean"
      ) {
        setUseEtaBasedMatching(system.useEtaBasedMatching);
      }
      if (
        system &&
        system.maxEtaMinutes !== undefined &&
        system.maxEtaMinutes !== null
      ) {
        setMaxEtaMinutes(String(system.maxEtaMinutes));
      }
      if (
        system &&
        system.maxSearchTimeSeconds !== undefined &&
        system.maxSearchTimeSeconds !== null
      ) {
        setMaxSearchTimeSeconds(String(system.maxSearchTimeSeconds));
      }
      setRadiusSuccessMessage("Search radius settings updated successfully.");
      toast.success("Search radius settings updated successfully.");
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update search radius settings.";
      setRadiusError(message);
      toast.error(message);
    } finally {
      setRadiusSaving(false);
    }
  };

  // Validation helpers
  const validateEmail = (email) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) return true; // Optional field
    // Allow numbers, +, spaces, hyphens, parentheses
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    return phoneRegex.test(phone);
  };

  const validateNumbersOnly = (value) => {
    if (!value) return true; // Optional field
    // Only numbers allowed
    const numberRegex = /^\d+$/;
    return numberRegex.test(value);
  };

  // Support contacts handlers
  const handleSupportPhoneChange = (index, value) => {
    // Only allow numbers, +, spaces, hyphens, parentheses
    const cleaned = value.replace(/[^\d\s\+\-\(\)]/g, "");
    const newPhones = [...supportPhoneNumbers];
    newPhones[index] = cleaned;
    setSupportPhoneNumbers(newPhones);
  };

  const handleWhatsappChange = (value) => {
    // Only allow numbers and +
    const cleaned = value.replace(/[^\d\+]/g, "");
    setSupportWhatsapp(cleaned);
  };

  const handleLasemaPrimaryChange = (value) => {
    // Only allow numbers
    const cleaned = value.replace(/\D/g, "");
    setLasemaPrimary(cleaned);
  };

  const handleLasemaSecondaryChange = (value) => {
    // Only allow numbers
    const cleaned = value.replace(/\D/g, "");
    setLasemaSecondary(cleaned);
  };

  const handleLasemaPhoneChange = (value, setter) => {
    // Allow numbers, +, spaces, hyphens
    const cleaned = value.replace(/[^\d\s\+\-]/g, "");
    setter(cleaned);
  };

  const handleAddSupportPhone = () => {
    const filledCount = supportPhoneNumbers.filter((p) => p.trim()).length;
    if (filledCount < 3) {
      const newPhones = [...supportPhoneNumbers];
      const firstEmptyIndex = newPhones.findIndex((p) => !p.trim());
      if (firstEmptyIndex === -1 && filledCount < 3) {
        newPhones[filledCount] = "";
      }
      setSupportPhoneNumbers(newPhones);
    }
  };

  const handleRemoveSupportPhone = (index) => {
    const newPhones = [...supportPhoneNumbers];
    newPhones[index] = "";
    const filtered = newPhones.filter((_, i) => i !== index);
    while (filtered.length < 3) filtered.push("");
    setSupportPhoneNumbers(filtered);
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setSupportError(null);
    setSupportSuccessMessage(null);

    // Validate email
    if (supportEmail.trim() && !validateEmail(supportEmail.trim())) {
      setSupportError("Please enter a valid email address.");
      return;
    }

    // Validate WhatsApp (numbers only, can include +)
    if (
      supportWhatsapp.trim() &&
      !validatePhoneNumber(supportWhatsapp.trim())
    ) {
      setSupportError("WhatsApp number can only contain numbers and + sign.");
      return;
    }

    // Validate phone numbers
    const phoneNumbers = supportPhoneNumbers.filter((p) => p && p.trim());
    if (phoneNumbers.length > 3) {
      setSupportError("Maximum 3 phone numbers allowed.");
      return;
    }

    for (const phone of phoneNumbers) {
      if (!validatePhoneNumber(phone)) {
        setSupportError(
          "Phone numbers can only contain numbers, +, spaces, hyphens, and parentheses."
        );
        return;
      }
    }

    try {
      setSupportSaving(true);
      const payload = {
        support: {
          email: supportEmail.trim() || undefined,
          whatsapp: supportWhatsapp.trim() || undefined,
          phoneNumbers: phoneNumbers.length > 0 ? phoneNumbers : undefined,
        },
      };

      console.log("Sending support contacts update:", payload);
      const data = await updateAdminSettings(payload);
      console.log("Support contacts update response:", data);

      const updatedSupport = data?.settings?.support;
      if (updatedSupport) {
        setSupportEmail(updatedSupport.email || "");
        setSupportWhatsapp(updatedSupport.whatsapp || "");
        if (
          updatedSupport.phoneNumbers &&
          Array.isArray(updatedSupport.phoneNumbers)
        ) {
          const phones = [...updatedSupport.phoneNumbers];
          while (phones.length < 3) phones.push("");
          setSupportPhoneNumbers(phones.slice(0, 3));
        }
      }
      setSupportSuccessMessage("Support contacts updated successfully.");
      toast.success("Support contacts updated successfully.");
    } catch (err) {
      console.error("Support contacts update error:", err);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update support contacts.";
      setSupportError(message);
      toast.error(message);
    } finally {
      setSupportSaving(false);
    }
  };

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setEmergencyError(null);
    setEmergencySuccessMessage(null);

    // Validate LASEMA Primary (numbers only)
    if (lasemaPrimary.trim() && !validateNumbersOnly(lasemaPrimary.trim())) {
      setEmergencyError("LASEMA Primary can only contain numbers.");
      return;
    }

    // Validate LASEMA Secondary (numbers only)
    if (
      lasemaSecondary.trim() &&
      !validateNumbersOnly(lasemaSecondary.trim())
    ) {
      setEmergencyError("LASEMA Secondary can only contain numbers.");
      return;
    }

    // Validate LASEMA Phone 1
    if (lasemaPhone1.trim() && !validatePhoneNumber(lasemaPhone1.trim())) {
      setEmergencyError(
        "LASEMA Phone 1 can only contain numbers, +, spaces, and hyphens."
      );
      return;
    }

    // Validate LASEMA Phone 2
    if (lasemaPhone2.trim() && !validatePhoneNumber(lasemaPhone2.trim())) {
      setEmergencyError(
        "LASEMA Phone 2 can only contain numbers, +, spaces, and hyphens."
      );
      return;
    }

    try {
      setEmergencySaving(true);
      const payload = {
        emergency: {
          lasemaPrimary: lasemaPrimary.trim() || undefined,
          lasemaSecondary: lasemaSecondary.trim() || undefined,
          lasemaPhone1: lasemaPhone1.trim() || undefined,
          lasemaPhone2: lasemaPhone2.trim() || undefined,
        },
      };

      console.log("Sending emergency contacts update:", payload);
      const data = await updateAdminSettings(payload);
      console.log("Emergency contacts update response:", data);

      const updatedEmergency = data?.settings?.emergency;
      if (updatedEmergency) {
        setLasemaPrimary(updatedEmergency.lasemaPrimary || "");
        setLasemaSecondary(updatedEmergency.lasemaSecondary || "");
        setLasemaPhone1(updatedEmergency.lasemaPhone1 || "");
        setLasemaPhone2(updatedEmergency.lasemaPhone2 || "");
      }
      setEmergencySuccessMessage("Emergency contacts updated successfully.");
      toast.success("Emergency contacts updated successfully.");
    } catch (err) {
      console.error("Emergency contacts update error:", err);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update emergency contacts.";
      setEmergencyError(message);
      toast.error(message);
    } finally {
      setEmergencySaving(false);
    }
  };

  // Vehicle Requirements handlers
  const handleVehicleRequirementChange = (tier, field, value) => {
    setVehicleRequirements((prev) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [field]: value,
      },
    }));
  };

  const handleVehicleRequirementsSubmit = async (e) => {
    e.preventDefault();
    setVehicleError(null);
    setVehicleSuccessMessage(null);

    // Validate all minYear values
    const tiers = ["car_standard", "car_comfort", "car_premium"];
    for (const tier of tiers) {
      const minYear = vehicleRequirements[tier].minYear;
      if (minYear.trim()) {
        const year = Number(minYear);
        if (Number.isNaN(year)) {
          setVehicleError(
            `${tier
              .replace("car_", "")
              .toUpperCase()} minimum year must be a valid number.`
          );
          return;
        }
        if (year < 1900 || year > new Date().getFullYear() + 1) {
          setVehicleError(
            `${tier
              .replace("car_", "")
              .toUpperCase()} minimum year must be between 1900 and ${
              new Date().getFullYear() + 1
            }.`
          );
          return;
        }
      }
    }

    try {
      setVehicleSaving(true);
      const payload = {
        vehicleRequirements: {
          car_standard: {
            minYear: vehicleRequirements.car_standard.minYear
              ? Number(vehicleRequirements.car_standard.minYear)
              : undefined,
            requireAirConditioning:
              vehicleRequirements.car_standard.requireAirConditioning,
          },
          car_comfort: {
            minYear: vehicleRequirements.car_comfort.minYear
              ? Number(vehicleRequirements.car_comfort.minYear)
              : undefined,
            requireAirConditioning:
              vehicleRequirements.car_comfort.requireAirConditioning,
          },
          car_premium: {
            minYear: vehicleRequirements.car_premium.minYear
              ? Number(vehicleRequirements.car_premium.minYear)
              : undefined,
            requireAirConditioning:
              vehicleRequirements.car_premium.requireAirConditioning,
          },
        },
      };

      console.log("Sending vehicle requirements update:", payload);
      const data = await updateAdminSettings(payload);
      console.log("Vehicle requirements update response:", data);

      const updatedVehicleReqs = data?.settings?.vehicleRequirements;
      if (updatedVehicleReqs) {
        setVehicleRequirements({
          car_standard: {
            minYear: updatedVehicleReqs.car_standard?.minYear
              ? String(updatedVehicleReqs.car_standard.minYear)
              : "",
            requireAirConditioning:
              updatedVehicleReqs.car_standard?.requireAirConditioning || false,
          },
          car_comfort: {
            minYear: updatedVehicleReqs.car_comfort?.minYear
              ? String(updatedVehicleReqs.car_comfort.minYear)
              : "",
            requireAirConditioning:
              updatedVehicleReqs.car_comfort?.requireAirConditioning || false,
          },
          car_premium: {
            minYear: updatedVehicleReqs.car_premium?.minYear
              ? String(updatedVehicleReqs.car_premium.minYear)
              : "",
            requireAirConditioning:
              updatedVehicleReqs.car_premium?.requireAirConditioning || false,
          },
        });
      }
      setVehicleSuccessMessage("Vehicle requirements updated successfully.");
      toast.success("Vehicle requirements updated successfully.");
    } catch (err) {
      console.error("Vehicle requirements update error:", err);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update vehicle requirements.";
      setVehicleError(message);
      toast.error(message);
    } finally {
      setVehicleSaving(false);
    }
  };

  // Pricing handlers


  const handleSchedulingSubmit = async (e) => {
    e.preventDefault();
    setSchedulingError(null);
    setSchedulingSuccessMessage(null);

    let totalMinutes = minBufferValue.trim() ? Number(minBufferValue) : 0;
    
    if (minBufferUnit === "hours") totalMinutes *= 60;
    if (minBufferUnit === "days") totalMinutes *= 1440;

    if (totalMinutes < 15) {
      setSchedulingError("The minimum buffer must be at least 15 minutes.");
      toast.error("The minimum buffer must be at least 15 minutes.");
      return;
    }

    const days = maxDaysAhead.trim() ? Number(maxDaysAhead) : 0;
    const leadTime = activationLeadMinutes.trim()
      ? Number(activationLeadMinutes)
      : 20;

    try {
      setSchedulingSaving(true);
      const payload = {
        scheduling: {
          enabled: schedulingEnabled,
          minBufferMinutes: totalMinutes,
          maxDaysAhead: days,
          activationLeadMinutes: leadTime,
        },
      };

      const data = await updateAdminSettings(payload);
      const updated = data?.settings?.scheduling;
      if (updated) {
        setSchedulingEnabled(!!updated.enabled);
        
        // Convert back for display
        const newVal = updated.minBufferMinutes || 0;
        if (newVal > 0 && newVal % 1440 === 0) {
          setMinBufferValue(String(newVal / 1440));
          setMinBufferUnit("days");
        } else if (newVal > 0 && newVal % 60 === 0) {
          setMinBufferValue(String(newVal / 60));
          setMinBufferUnit("hours");
        } else {
          setMinBufferValue(String(newVal));
          setMinBufferUnit("minutes");
        }

        setMaxDaysAhead(
          updated.maxDaysAhead !== undefined ? String(updated.maxDaysAhead) : ""
        );

        setActivationLeadMinutes(
          updated.activationLeadMinutes !== undefined
            ? String(updated.activationLeadMinutes)
            : ""
        );
      }
      setSchedulingSuccessMessage("Scheduling settings updated successfully.");
      toast.success("Scheduling settings updated successfully.");
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update scheduling settings.";
      setSchedulingError(message);
      toast.error(message);
    } finally {
      setSchedulingSaving(false);
    }
  };

  const handleBirthdaySubmit = async (e) => {
    e.preventDefault();
    setBirthdayError(null);
    setBirthdaySuccessMessage(null);

    const discount = birthdayDiscount.trim() ? Number(birthdayDiscount) : 0;
    if (isNaN(discount) || discount < 0 || discount > 100) {
      setBirthdayError("Discount percent must be between 0 and 100.");
      return;
    }

    try {
      setBirthdaySaving(true);
      const payload = {
        birthdayPromo: {
          enabled: birthdayEnabled,
          discountPercent: discount,
        },
      };

      const data = await updateAdminSettings(payload);
      const updated = data?.settings?.birthdayPromo;
      if (updated) {
        setBirthdayEnabled(!!updated.enabled);
        setBirthdayDiscount(
          updated.discountPercent !== undefined
            ? String(updated.discountPercent)
            : ""
        );
      }
      setBirthdaySuccessMessage("Birthday settings updated successfully.");
      toast.success("Birthday settings updated successfully.");
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update birthday settings.";
      setBirthdayError(message);
      toast.error(message);
    } finally {
      setBirthdaySaving(false);
    }
  };

  const handleComplianceSubmit = async (e) => {
    e.preventDefault();
    setComplianceError(null);
    setComplianceSuccessMessage(null);

    const payload = {
      compliance: {
        identityPoints: identityPoints !== "" ? Number(identityPoints) : undefined,
        vehicleVerificationPoints: vehicleVerificationPoints !== "" ? Number(vehicleVerificationPoints) : undefined,
        vehicleInspectionPoints: vehicleInspectionPoints !== "" ? Number(vehicleInspectionPoints) : undefined,
        tier3CustomerPoints: tier3CustomerPoints !== "" ? Number(tier3CustomerPoints) : undefined,
        tier3RiderPoints: tier3RiderPoints !== "" ? Number(tier3RiderPoints) : undefined,
        gracePeriodDays: gracePeriodDays !== "" ? Number(gracePeriodDays) : undefined,
        weeklyOrderLimit: weeklyOrderLimit !== "" ? Number(weeklyOrderLimit) : undefined,
      },
      inspectionOfficeAddress: inspectionOfficeAddress.trim() || undefined
    };

    try {
      setComplianceSaving(true);
      const data = await updateAdminSettings(payload);
      const comp = data?.settings?.compliance;
      if (comp) {
        setIdentityPoints(comp.identityPoints !== undefined ? String(comp.identityPoints) : "");
        setVehicleVerificationPoints(comp.vehicleVerificationPoints !== undefined ? String(comp.vehicleVerificationPoints) : "");
        setVehicleInspectionPoints(comp.vehicleInspectionPoints !== undefined ? String(comp.vehicleInspectionPoints) : "");
        setTier3CustomerPoints(comp.tier3CustomerPoints !== undefined ? String(comp.tier3CustomerPoints) : "");
        setTier3RiderPoints(comp.tier3RiderPoints !== undefined ? String(comp.tier3RiderPoints) : "");
        setGracePeriodDays(comp.gracePeriodDays !== undefined ? String(comp.gracePeriodDays) : "");
        setWeeklyOrderLimit(comp.weeklyOrderLimit !== undefined ? String(comp.weeklyOrderLimit) : "");
      }
      if (data?.settings?.inspectionOfficeAddress) {
        setInspectionOfficeAddress(data.settings.inspectionOfficeAddress);
      }
      setComplianceSuccessMessage("Compliance settings updated successfully.");
      toast.success("Compliance settings updated successfully.");
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message || "Failed to update compliance settings.";
      setComplianceError(message);
      toast.error(message);
    } finally {
      setComplianceSaving(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccessMessage(null);

    const validIps = payscribeIps.map(ip => ip.trim()).filter(ip => ip !== "");
    if (validIps.length === 0) {
      setSecurityError("At least one Payscribe webhook IP is required.");
      return;
    }

    try {
      setSecuritySaving(true);
      const payload = {
        payscribeWebhookIps: validIps,
      };

      const data = await updateAdminSettings(payload);
      const updatedIps = data?.settings?.payscribeWebhookIps;
      if (updatedIps && Array.isArray(updatedIps)) {
        setPayscribeIps(updatedIps.length > 0 ? updatedIps : [""]);
      }
      setSecuritySuccessMessage("Security settings updated successfully.");
      toast.success("Security settings updated successfully.");
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update security settings.";
      setSecurityError(message);
      toast.error(message);
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleSetPin = async (e) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (pin.length !== 4 || isNaN(pin)) {
      setPinError("PIN must be exactly 4 digits.");
      return;
    }

    try {
      setPinSaving(true);
      await setFinancialPin(pin);
      setPinSuccess("Financial PIN set successfully.");
      toast.success("Financial PIN set successfully.");
      setPin("");
    } catch (err) {
      const message = err?.response?.data?.error || "Failed to set PIN.";
      setPinError(message);
      toast.error(message);
    } finally {
      setPinSaving(false);
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (currentPin.length !== 4 || newPin.length !== 4) {
      setPinError("PINs must be 4 digits.");
      return;
    }

    if (newPin !== confirmPin) {
      setPinError("New PINs do not match.");
      return;
    }

    try {
      setPinSaving(true);
      await changeFinancialPin(currentPin, newPin);
      setPinSuccess("Financial PIN changed successfully.");
      toast.success("Financial PIN changed successfully.");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    } catch (err) {
      const message = err?.response?.data?.error || "Failed to change PIN.";
      setPinError(message);
      toast.error(message);
    } finally {
      setPinSaving(false);
    }
  };

  const handleKillSwitchesSubmit = async (e) => {
    e.preventDefault();
    setKillSwitchesError(null);
    setKillSwitchesSuccessMessage(null);

    try {
      setKillSwitchesSaving(true);
      const payload = {
        killSwitches: killSwitches,
      };

      await updateAdminSettings(payload);
      setKillSwitchesSuccessMessage("System kill-switches updated successfully.");
      toast.success("System kill-switches updated successfully.");
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message || "Failed to update kill-switches.";
      setKillSwitchesError(message);
      toast.error(message);
    } finally {
      setKillSwitchesSaving(false);
    }
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const passwordsMismatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword !== confirmPassword;

  return (
    <div className="p-6 h-full flex flex-col items-center">
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Settings</h1>

        <div className="relative mb-6 w-full max-w-md">
          <input
            type="text"
            placeholder="Search settings (e.g., 'radius', 'price', 'email')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {searchTerm && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
              {[
                { id: "commission-section", title: "Rider Commission", keywords: "bonus percentage payout rate" },
                { id: "radius-section", title: "Rider Search Radius", keywords: "eta matching distance km" },
                { id: "scheduling-section", title: "Scheduling Controls", keywords: "buffer advance window lead time" },
                { id: "birthday-section", title: "Birthday Reward Settings", keywords: "promo discount gift" },
                { id: "password-section", title: "Change Password", keywords: "security login secret" },
                { id: "financial-pin-section", title: "Financial Security PIN", keywords: "pin finance transfer password security" },
                { id: "support-section", title: "Support & Emergency Contacts", keywords: "lasema whatsapp phone email help" },
                { id: "vehicle-section", title: "Vehicle Requirements", keywords: "car van motorbike standard comfort premium ac year" },
              ]
                .filter(item => 
                  item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  item.keywords.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      setSearchTerm("");
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b last:border-b-0 border-gray-100 flex justify-between items-center group"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                      Jump to
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <AccordionSection
              title="Rider Commission"
              isOpen={openSections.commission}
              onToggle={() => toggleSection("commission")}
              tooltip="Configure the percentage commission riders pay per ride"
            >
              <div
                className={`${searchTerm && !"Rider Commission".toLowerCase().includes(searchTerm.toLowerCase()) ? "hidden" : ""}`}
                id="commission-section"
              >
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
                    <ValidatedInput
                      label="Commission rate (%)"
                      value={commissionRate}
                      onChange={(val) => setCommissionRate(val)}
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="Enter commission rate"
                      disabled={commissionLoading || commissionSaving}
                    />
                  <button
                    type="submit"
                    disabled={commissionLoading || commissionSaving}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {commissionSaving ? "Saving..." : "Save Commission Rate"}
                  </button>
                </form>
              </div>
            </AccordionSection>

            <AccordionSection
              title="Rider Search Radius"
              isOpen={openSections.search}
              onToggle={() => toggleSection("search")}
              tooltip="Configure how far the system searches for riders"
            >
              <div 
                className={`${searchTerm && !"Rider Search Radius matching eta".toLowerCase().includes(searchTerm.toLowerCase()) ? "hidden" : ""}`}
                id="radius-section"
              >
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
                  <ValidatedInput
                    label="Default rider search radius (km)"
                    value={defaultSearchRadiusKm}
                    onChange={(val) => setDefaultSearchRadiusKm(val)}
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    placeholder="Enter default radius in km"
                    disabled={radiusSaving}
                  />
                  <ValidatedInput
                    label="Maximum allowed rider radius (km)"
                    value={maxAllowedRadiusKm}
                    onChange={(val) => setMaxAllowedRadiusKm(val)}
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    placeholder="Enter maximum radius in km"
                    disabled={radiusSaving}
                  />
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h3 className="text-md font-semibold mb-3 text-gray-700">
                    Rider matching and ETA
                  </h3>
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="use_eta_based_matching"
                      checked={useEtaBasedMatching}
                      onChange={(e) => setUseEtaBasedMatching(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={radiusSaving}
                    />
                    <label
                      htmlFor="use_eta_based_matching"
                      className="ml-2 block text-sm text-gray-700 font-semibold"
                    >
                      Enable ETA-based matching (smart mode)
                    </label>
                  </div>
                  <div className="space-y-4">
                      <ValidatedInput
                        label="Maximum ETA (minutes)"
                        value={maxEtaMinutes}
                        onChange={(val) => setMaxEtaMinutes(val)}
                        type="number"
                        min="3"
                        max="20"
                        step="1"
                        placeholder="8"
                        disabled={radiusSaving}
                        helperText="Riders with ETA above this will not be notified."
                      />
                      <ValidatedInput
                        label="Maximum search time (seconds)"
                        value={maxSearchTimeSeconds}
                        onChange={(val) => setMaxSearchTimeSeconds(val)}
                        type="number"
                        min="30"
                        max="180"
                        step="5"
                        placeholder="90"
                        disabled={radiusSaving}
                        helperText="How long to keep searching for riders before stopping."
                      />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={radiusSaving}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {radiusSaving ? "Saving..." : "Save Radius Settings"}
                </button>
              </form>
            </div>
            </AccordionSection>

            <AccordionSection
              title="Scheduling Controls"
              isOpen={openSections.scheduling}
              onToggle={() => toggleSection("scheduling")}
              tooltip="Configure buffer times and windows for scheduled rides"
            >
              <div 
                className={`${searchTerm && !"Scheduling Controls buffer window lead time".toLowerCase().includes(searchTerm.toLowerCase()) ? "hidden" : ""}`}
                id="scheduling-section"
              >
                {schedulingError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {schedulingError}
                  </div>
                )}
                {schedulingSuccessMessage && (
                  <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                    {schedulingSuccessMessage}
                  </div>
                )}
                <form onSubmit={handleSchedulingSubmit} className="space-y-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="scheduling_enabled"
                      checked={schedulingEnabled}
                      onChange={(e) => setSchedulingEnabled(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={schedulingSaving}
                    />
                    <label
                      htmlFor="scheduling_enabled"
                      className="ml-2 block text-sm text-gray-700 font-semibold"
                    >
                      Enable Scheduled Deliveries
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 ml-6">
                    Allow users to book deliveries or rides for a future time.
                  </p>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="block text-gray-700 font-semibold mb-2">
                        Advance Notice Required (Minimum Buffer)
                      </label>
                      <div className="flex space-x-2">
                        <ValidatedInput
                          value={minBufferValue}
                          onChange={(val) => setMinBufferValue(val)}
                          type="number"
                          min="1"
                          step="1"
                          placeholder="60"
                          disabled={schedulingSaving || !schedulingEnabled}
                          className="flex-1"
                        />
                        <select
                          value={minBufferUnit}
                          onChange={(e) => setMinBufferUnit(e.target.value)}
                          className="w-1/3 p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue font-semibold"
                          disabled={schedulingSaving || !schedulingEnabled}
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        How much time do you need before a scheduled order? (e.g., "1 Hour")
                      </p>
                    </div>
                  </div>
                  <ValidatedInput
                    label="Booking Window (Days)"
                    value={maxDaysAhead}
                    onChange={(val) => setMaxDaysAhead(val)}
                    type="number"
                    min="1"
                    step="1"
                    placeholder="7"
                    disabled={schedulingSaving || !schedulingEnabled}
                    helperText="How many days into the future can users book?"
                  />
                  <ValidatedInput
                    label="Rider Search Lead Time (Minutes)"
                    value={activationLeadMinutes}
                    onChange={(val) => setActivationLeadMinutes(val)}
                    type="number"
                    min="5"
                    max="120"
                    step="1"
                    placeholder="20"
                    disabled={schedulingSaving || !schedulingEnabled}
                    helperText="How many minutes before pickup should the system start looking for riders?"
                  />
                  <button
                    type="submit"
                    disabled={schedulingSaving}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {schedulingSaving ? "Saving..." : "Save Scheduling Settings"}
                  </button>
                </form>
              </div>
            </AccordionSection>

            <AccordionSection
              title="Compliance & Point Rewards"
              isOpen={openSections.compliance}
              onToggle={() => toggleSection("compliance")}
              tooltip="Configure points awarded for KYC and compliance limits"
            >
              <div 
                className={`${searchTerm && !"Compliance KYC Points Rewards Grace Period Order Limit".toLowerCase().includes(searchTerm.toLowerCase()) ? "hidden" : ""}`}
                id="compliance-section"
              >
                {complianceError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {complianceError}
                  </div>
                )}
                {complianceSuccessMessage && (
                  <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                    {complianceSuccessMessage}
                  </div>
                )}
                <form onSubmit={handleComplianceSubmit} className="space-y-8">
                   <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider flex items-center">
                         <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                         Compliance Milestone Rewards (9P)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <ValidatedInput
                            label="Tier 2 General Points"
                            value={identityPoints}
                            onChange={(val) => setIdentityPoints(val)}
                            type="number"
                            placeholder="5"
                            disabled={complianceSaving}
                            helperText="General points awarded for Tier 2 approval."
                          />
                          <ValidatedInput
                            label="Vehicle Document Points"
                            value={vehicleVerificationPoints}
                            onChange={(val) => setVehicleVerificationPoints(val)}
                            type="number"
                            placeholder="10"
                            disabled={complianceSaving}
                            helperText="Points awarded when vehicle documents are approved."
                          />
                          <ValidatedInput
                            label="Physical Inspection Points"
                            value={vehicleInspectionPoints}
                            onChange={(val) => setVehicleInspectionPoints(val)}
                            type="number"
                            placeholder="20"
                            disabled={complianceSaving}
                            helperText="Points awarded when physical hub audit is completed."
                          />
                          <ValidatedInput
                            label="Tier 3 Points (Customer)"
                            value={tier3CustomerPoints}
                            onChange={(val) => setTier3CustomerPoints(val)}
                            type="number"
                            placeholder="10"
                            disabled={complianceSaving}
                            helperText="General points awarded for full Tier 3 residency approval."
                          />
                          <ValidatedInput
                            label="Tier 3 Points (Rider)"
                            value={tier3RiderPoints}
                            onChange={(val) => setTier3RiderPoints(val)}
                            type="number"
                            placeholder="25"
                            disabled={complianceSaving}
                            helperText="General points awarded for full Tier 3 document approval."
                          />
                      </div>
                   </div>

                   <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider flex items-center">
                         <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                         Physical Audit Location
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <ValidatedInput
                            label="Inspection Office Address"
                            value={inspectionOfficeAddress}
                            onChange={(val) => setInspectionOfficeAddress(val)}
                            type="text"
                            placeholder="Enter the physical address for hub visits"
                            disabled={complianceSaving}
                            helperText="This address is displayed to riders for their mandatory hub visit."
                          />
                      </div>
                   </div>

                   <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider flex items-center">
                         <span className="w-2 h-2 bg-orange-600 rounded-full mr-2"></span>
                         Lifecycle & Grace Periods
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <ValidatedInput
                            label="Tier 2 -> Tier 3 Grace Period (Days)"
                            value={gracePeriodDays}
                            onChange={(val) => setGracePeriodDays(val)}
                            type="number"
                            placeholder="30"
                            disabled={complianceSaving}
                            helperText="Days a rider stays in Tier 2 before being blocked for Tier 3 upgrade."
                          />
                          <ValidatedInput
                            label="Weekly Order Limit (Non-Compliant)"
                            value={weeklyOrderLimit}
                            onChange={(val) => setWeeklyOrderLimit(val)}
                            type="number"
                            placeholder="20"
                            disabled={complianceSaving}
                            helperText="Max orders per week for riders with pending compliance."
                          />
                      </div>
                   </div>

                  <button
                    type="submit"
                    disabled={complianceSaving}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {complianceSaving ? "Saving..." : "Save Compliance Hub Settings"}
                  </button>
                </form>
              </div>
            </AccordionSection>

            <AccordionSection
              title="Birthday Reward Settings"
              isOpen={openSections.rewards}
              onToggle={() => toggleSection("rewards")}
              tooltip="Set automated birthday discounts for users"
            >
              <div 
                className={`${searchTerm && !"Birthday Reward Settings discount".toLowerCase().includes(searchTerm.toLowerCase()) ? "hidden" : ""}`}
                id="birthday-section"
              >
                {birthdayError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {birthdayError}
                  </div>
                )}
                {birthdaySuccessMessage && (
                  <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                    {birthdaySuccessMessage}
                  </div>
                )}
                <form onSubmit={handleBirthdaySubmit} className="space-y-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="birthday_enabled"
                      checked={birthdayEnabled}
                      onChange={(e) => setBirthdayEnabled(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={birthdaySaving}
                    />
                    <label
                      htmlFor="birthday_enabled"
                      className="ml-2 block text-sm text-gray-700 font-semibold"
                    >
                      Enable Birthday Discounts
                    </label>
                  </div>
                  <ValidatedInput
                    label="Discount Percentage (%)"
                    value={birthdayDiscount}
                    onChange={(val) => setBirthdayDiscount(val)}
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    placeholder="20"
                    disabled={birthdaySaving || !birthdayEnabled}
                  />
                  <button
                    type="submit"
                    disabled={birthdaySaving}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {birthdaySaving ? "Saving..." : "Save Birthday Settings"}
                  </button>
                </form>
              </div>
            </AccordionSection>
            
            <AccordionSection
              title="Financial Security PIN"
              isOpen={openSections.financialPin}
              onToggle={() => toggleSection("financialPin")}
              tooltip="Set or change your 4-digit financial PIN for authorizing transactions"
            >
              <div 
                className={`${searchTerm && !"Financial Security PIN transfer authorize transactions".toLowerCase().includes(searchTerm.toLowerCase()) ? "hidden" : ""}`}
                id="financial-pin-section"
              >
                {pinError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {pinError}
                  </div>
                )}
                {pinSuccess && (
                  <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                    {pinSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Set PIN */}
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                      Initialize / Set PIN
                    </h3>
                    <p className="text-[10px] text-gray-500 mb-4 font-medium italic">
                      Required for your first profit withdrawal.
                    </p>
                    <form onSubmit={handleSetPin} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">New 4-Digit PIN</label>
                        <div className="relative">
                          <input
                            type={showPin ? "text" : "password"}
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-black text-center text-lg tracking-[0.5em]"
                            placeholder="****"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={pinSaving || pin.length !== 4}
                        className="w-full bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                      >
                        {pinSaving ? "Processing..." : "Set PIN"}
                      </button>
                    </form>
                  </div>

                  {/* Change PIN */}
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-amber-600 rounded-full mr-2"></span>
                      Update PIN
                    </h3>
                    <form onSubmit={handleChangePin} className="space-y-2.5">
                      <div className="relative">
                        <input
                          type={showCurrentPin ? "text" : "password"}
                          maxLength={4}
                          value={currentPin}
                          onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-center font-bold"
                          placeholder="Current PIN"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type={showNewPin ? "text" : "password"}
                          maxLength={4}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-center font-bold"
                          placeholder="New 4-Digit PIN"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={pinSaving || newPin.length !== 4}
                        className="w-full bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest py-2.5 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-all mt-1"
                      >
                        {pinSaving ? "Processing..." : "Change PIN"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </AccordionSection>

            <AccordionSection
              title="Payscribe Security"
              isOpen={openSections.security}
              onToggle={() => toggleSection("security")}
              tooltip="Manage IP Whitelisting for Payscribe Webhooks"
            >
              <div 
                className={`${searchTerm && !"Payscribe Security webhook server ip addresses".toLowerCase().includes(searchTerm.toLowerCase()) ? "hidden" : ""}`}
                id="security-section"
              >
                {securityError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {securityError}
                  </div>
                )}
                {securitySuccessMessage && (
                  <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                    {securitySuccessMessage}
                  </div>
                )}
                <form onSubmit={handleSecuritySubmit} className="space-y-4">
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">
                      Only webhook events originating from these IP addresses will be processed by the system.
                    </p>
                    {payscribeIps.map((ip, index) => (
                      <div key={index} className="flex mb-2">
                        <input
                          type="text"
                          value={ip}
                          onChange={(e) => {
                            const newIps = [...payscribeIps];
                            newIps[index] = e.target.value;
                            setPayscribeIps(newIps);
                          }}
                          className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                          placeholder="e.g. 162.254.34.78"
                          disabled={securitySaving}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newIps = [...payscribeIps];
                            newIps.splice(index, 1);
                            setPayscribeIps(newIps.length ? newIps : [""]);
                          }}
                          className="px-4 py-3 bg-red-100 text-red-600 font-semibold rounded-r-lg hover:bg-red-200 transition-colors"
                          disabled={securitySaving || payscribeIps.length === 1}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPayscribeIps([...payscribeIps, ""])}
                      className="mt-2 text-blue-600 font-semibold text-sm hover:underline"
                    >
                      + Add Another IP
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={securitySaving}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {securitySaving ? "Saving..." : "Save Security Settings"}
                  </button>
                </form>
              </div>
            </AccordionSection>
          </div>

          <AccordionSection
            title="Change Password"
            isOpen={openSections.password}
            onToggle={() => toggleSection("password")}
          >
            <div 
              className={`${searchTerm && !"Change Password".toLowerCase().includes(searchTerm.toLowerCase()) ? "hidden" : ""}`}
              id="password-section"
            >
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
            <form onSubmit={handlePasswordSubmitClick} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Current password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
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
                    type={showNewPassword ? "text" : "password"}
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
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full p-3 pr-10 bg-gray-50 text-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue ${
                      passwordsMismatch ? "border-red-400" : "border-gray-300"
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
                      passwordsMismatch ? "text-red-500" : "text-green-600"
                    }`}
                  >
                    {passwordsMismatch
                      ? "Passwords do not match."
                      : "Passwords match."}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
          </AccordionSection>

          {/* Support & Emergency Contacts Management */}
          <AccordionSection
            title="Support & Emergency Contacts"
            isOpen={openSections.support}
            onToggle={() => toggleSection("support")}
            tooltip="Manage support channels and emergency numbers"
          >
            <div 
              className={`${searchTerm && !"Support & Emergency Contacts lasema email whatsapp phone".toLowerCase().includes(searchTerm.toLowerCase()) ? "hidden" : ""}`}
              id="support-section"
            >
            <p className="text-sm text-gray-500 mb-6">
              These settings override environment variables. Changes take effect
              immediately.
            </p>

            {/* Support Contacts Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-md font-semibold mb-4 text-gray-700">
                Support Contacts
              </h3>
              {supportError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {supportError}
                </div>
              )}
              {supportSuccessMessage && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                  {supportSuccessMessage}
                </div>
              )}
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    placeholder="support@9thwaka.app"
                    disabled={supportLoading || supportSaving}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={supportWhatsapp}
                    onChange={(e) => handleWhatsappChange(e.target.value)}
                    className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    placeholder="2348108663443"
                    disabled={supportLoading || supportSaving}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Numbers and + only
                  </p>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Support Phone Numbers (Maximum 3)
                  </label>
                  {supportPhoneNumbers.map((phone, index) => (
                    <div key={index} className="mb-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) =>
                            handleSupportPhoneChange(index, e.target.value)
                          }
                          className="flex-1 p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                          placeholder={`Phone ${
                            index + 1
                          } (e.g., +2348107843355)`}
                          disabled={supportLoading || supportSaving}
                        />
                        {phone.trim() && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSupportPhone(index)}
                            disabled={supportLoading || supportSaving}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {index === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Numbers, +, spaces, hyphens, and parentheses only
                        </p>
                      )}
                    </div>
                  ))}
                  {supportPhoneNumbers.filter((p) => p.trim()).length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddSupportPhone}
                      disabled={supportLoading || supportSaving}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
                    >
                      + Add Phone Number
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={supportLoading || supportSaving}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {supportSaving ? "Saving..." : "Save Support Contacts"}
                </button>
              </form>
            </div>

            {/* Emergency Contacts Section */}
            <div>
              <h3 className="text-md font-semibold mb-4 text-gray-700">
                Emergency Contacts (LASEMA)
              </h3>
              {emergencyError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {emergencyError}
                </div>
              )}
              {emergencySuccessMessage && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                  {emergencySuccessMessage}
                </div>
              )}
              <form onSubmit={handleEmergencySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      LASEMA Primary
                    </label>
                    <input
                      type="text"
                      value={lasemaPrimary}
                      onChange={(e) =>
                        handleLasemaPrimaryChange(e.target.value)
                      }
                      className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                      placeholder="112"
                      disabled={emergencySaving}
                    />
                    <p className="text-xs text-gray-500 mt-1">Numbers only</p>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      LASEMA Secondary
                    </label>
                    <input
                      type="text"
                      value={lasemaSecondary}
                      onChange={(e) =>
                        handleLasemaSecondaryChange(e.target.value)
                      }
                      className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                      placeholder="767"
                      disabled={emergencySaving}
                    />
                    <p className="text-xs text-gray-500 mt-1">Numbers only</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      LASEMA Phone 1
                    </label>
                    <input
                      type="text"
                      value={lasemaPhone1}
                      onChange={(e) =>
                        handleLasemaPhoneChange(e.target.value, setLasemaPhone1)
                      }
                      className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                      placeholder="+2348022887777"
                      disabled={emergencySaving}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Numbers, +, spaces, and hyphens only
                    </p>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      LASEMA Phone 2
                    </label>
                    <input
                      type="text"
                      value={lasemaPhone2}
                      onChange={(e) =>
                        handleLasemaPhoneChange(e.target.value, setLasemaPhone2)
                      }
                      className="w-full p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
                      placeholder="+2348022883678"
                      disabled={emergencySaving}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Numbers, +, spaces, and hyphens only
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={emergencySaving}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emergencySaving ? "Saving..." : "Save Emergency Contacts"}
                </button>
              </form>
            </div>
          </div>
          </AccordionSection>

          {/* Vehicle Requirements Management */}
          <AccordionSection
            title="Vehicle Requirements"
            isOpen={openSections.vehicles}
            onToggle={() => toggleSection("vehicles")}
            tooltip="Set vehicle year and AC requirements per tier"
          >
            <div 
              className={`${searchTerm && !"Vehicle Requirements standard comfort premium ac year".toLowerCase().includes(searchTerm.toLowerCase()) ? "hidden" : ""}`}
              id="vehicle-section"
            >
            <p className="text-sm text-gray-500 mb-6">
              Configure minimum vehicle requirements for each ride tier. These
              settings override environment variables.
            </p>

            {vehicleError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {vehicleError}
              </div>
            )}
            {vehicleSuccessMessage && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                {vehicleSuccessMessage}
              </div>
            )}

            <form
              onSubmit={handleVehicleRequirementsSubmit}
              className="space-y-6"
            >
              {/* Car Standard */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-semibold mb-4 text-gray-700">
                  Car Standard Requirements
                </h3>
                <div className="space-y-4">
                    <ValidatedInput
                      label="Minimum Year"
                      value={vehicleRequirements.car_standard.minYear}
                      onChange={(val) =>
                        handleVehicleRequirementChange(
                          "car_standard",
                          "minYear",
                          val
                        )
                      }
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      placeholder="2010"
                      disabled={vehicleLoading || vehicleSaving}
                      helperText={`Numbers only (1900 - ${new Date().getFullYear() + 1})`}
                    />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="car_standard_ac"
                      checked={
                        vehicleRequirements.car_standard.requireAirConditioning
                      }
                      onChange={(e) =>
                        handleVehicleRequirementChange(
                          "car_standard",
                          "requireAirConditioning",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={vehicleLoading || vehicleSaving}
                    />
                    <label
                      htmlFor="car_standard_ac"
                      className="ml-2 block text-sm text-gray-700 font-semibold"
                    >
                      Require Air Conditioning
                    </label>
                  </div>
                </div>
              </div>

              {/* Car Comfort */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-semibold mb-4 text-gray-700">
                  Car Comfort Requirements
                </h3>
                <div className="space-y-4">
                    <ValidatedInput
                      label="Minimum Year"
                      value={vehicleRequirements.car_comfort.minYear}
                      onChange={(val) =>
                        handleVehicleRequirementChange(
                          "car_comfort",
                          "minYear",
                          val
                        )
                      }
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      placeholder="2010"
                      disabled={vehicleLoading || vehicleSaving}
                      helperText={`Numbers only (1900 - ${new Date().getFullYear() + 1})`}
                    />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="car_comfort_ac"
                      checked={
                        vehicleRequirements.car_comfort.requireAirConditioning
                      }
                      onChange={(e) =>
                        handleVehicleRequirementChange(
                          "car_comfort",
                          "requireAirConditioning",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={vehicleLoading || vehicleSaving}
                    />
                    <label
                      htmlFor="car_comfort_ac"
                      className="ml-2 block text-sm text-gray-700 font-semibold"
                    >
                      Require Air Conditioning
                    </label>
                  </div>
                </div>
              </div>

              {/* Car Premium */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-semibold mb-4 text-gray-700">
                  Car Premium Requirements
                </h3>
                <div className="space-y-4">
                    <ValidatedInput
                      label="Minimum Year"
                      value={vehicleRequirements.car_premium.minYear}
                      onChange={(val) =>
                        handleVehicleRequirementChange(
                          "car_premium",
                          "minYear",
                          val
                        )
                      }
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      placeholder="2015"
                      disabled={vehicleLoading || vehicleSaving}
                      helperText={`Numbers only (1900 - ${new Date().getFullYear() + 1})`}
                    />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="car_premium_ac"
                      checked={
                        vehicleRequirements.car_premium.requireAirConditioning
                      }
                      onChange={(e) =>
                        handleVehicleRequirementChange(
                          "car_premium",
                          "requireAirConditioning",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={vehicleLoading || vehicleSaving}
                    />
                    <label
                      htmlFor="car_premium_ac"
                      className="ml-2 block text-sm text-gray-700 font-semibold"
                    >
                      Require Air Conditioning
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={vehicleLoading || vehicleSaving}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {vehicleSaving ? "Saving..." : "Save Vehicle Requirements"}
              </button>
            </form>
          </div>
          </AccordionSection>

          {/* System Kill-Switches (Strategic Overrides) */}
          <AccordionSection
            title="System Kill-Switches"
            isOpen={openSections.killSwitches}
            onToggle={() => toggleSection("killSwitches")}
            tooltip="Emergency overrides to stop withdrawals, registrations, or utility services across the platform"
          >
            <div id="killswitches-section">
              <p className="text-sm text-gray-500 mb-6 font-medium">
                Strategic overrides to immediately halt critical system features. Use these during maintenance or suspicious activity.
              </p>

              {killSwitchesError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {killSwitchesError}
                </div>
              )}
              {killSwitchesSuccessMessage && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                  {killSwitchesSuccessMessage}
                </div>
              )}

              <form onSubmit={handleKillSwitchesSubmit} className="space-y-8">
                {/* Withdrawal Overrides */}
                <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                  <h3 className="text-xs font-black text-rose-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <BanknotesIcon className="w-4 h-4" />
                    Withdrawal Overrides
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-rose-100">
                      <span className="text-xs font-bold text-gray-700">Global</span>
                      <input 
                        type="checkbox" 
                        checked={killSwitches.withdrawals.global}
                        onChange={(e) => setKillSwitches(prev => ({ ...prev, withdrawals: { ...prev.withdrawals, global: e.target.checked }}))}
                        className="w-4 h-4 text-rose-600 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-rose-100">
                      <span className="text-xs font-bold text-gray-700">Customers</span>
                      <input 
                        type="checkbox" 
                        checked={killSwitches.withdrawals.customer}
                        onChange={(e) => setKillSwitches(prev => ({ ...prev, withdrawals: { ...prev.withdrawals, customer: e.target.checked }}))}
                        className="w-4 h-4 text-rose-600 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-rose-100">
                      <span className="text-xs font-bold text-gray-700">Riders</span>
                      <input 
                        type="checkbox" 
                        checked={killSwitches.withdrawals.rider}
                        onChange={(e) => setKillSwitches(prev => ({ ...prev, withdrawals: { ...prev.withdrawals, rider: e.target.checked }}))}
                        className="w-4 h-4 text-rose-600 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Utility Service Switches */}
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <GlobeAltIcon className="w-4 h-4" />
                    Utility Service Switches
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {['Airtime', 'Data', 'Cable', 'Electricity', 'Betting'].map(service => (
                      <div key={service} className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-indigo-100">
                        <span className="text-[10px] font-black uppercase text-gray-400">{service.replace('_', ' ')}</span>
                        <input 
                          type="checkbox" 
                          checked={killSwitches.services[service.toLowerCase()]}
                          onChange={(e) => setKillSwitches(prev => ({ ...prev, services: { ...prev.services, [service.toLowerCase()]: e.target.checked }}))}
                          className="w-5 h-5 text-indigo-600 rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Registration Governance */}
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                  <h3 className="text-xs font-black text-amber-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Registration Governance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-100">
                      <span className="text-xs font-bold text-gray-700">New Customers</span>
                      <input 
                        type="checkbox" 
                        checked={killSwitches.registrations.customer}
                        onChange={(e) => setKillSwitches(prev => ({ ...prev, registrations: { ...prev.registrations, customer: e.target.checked }}))}
                        className="w-4 h-4 text-amber-600 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-100">
                      <span className="text-xs font-bold text-gray-700">New Riders</span>
                      <input 
                        type="checkbox" 
                        checked={killSwitches.registrations.rider}
                        onChange={(e) => setKillSwitches(prev => ({ ...prev, registrations: { ...prev.registrations, rider: e.target.checked }}))}
                        className="w-4 h-4 text-amber-600 rounded"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={killSwitchesSaving}
                  className="w-full bg-indigo-600 text-white font-black uppercase tracking-widest py-4 px-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {killSwitchesSaving ? "Synchronizing Overrides..." : "Deploy System Overrides"}
                </button>
              </form>
            </div>
          </AccordionSection>
        </div>
      </div>
      
    {/* 🔐 Reusable Financial PIN Modal */}
    <FinancialPinModal
      isOpen={pinModal.isOpen}
      onClose={() => setPinModal(prev => ({ ...prev, isOpen: false }))}
      onSuccess={pinModal.onSuccess}
      title={pinModal.title}
      description={pinModal.description}
    />
  </div>
);
};

export default Settings;

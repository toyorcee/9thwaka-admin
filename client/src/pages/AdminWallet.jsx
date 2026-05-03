import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  ArrowPathIcon,
  CheckIcon,
  ChevronUpDownIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  GiftIcon,
  LockClosedIcon,
  TicketIcon
} from "@heroicons/react/24/outline";
import { Combobox, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import ValidatedInput from "../components/ValidatedInput";
import { resolveImageUrl } from "../utils/urlHelper";
import FinancialPinModal from "../components/FinancialPinModal";

ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
import {
  fetchAdminSettings,
  updateAdminSettings,
} from "../services/settingsApi";
import {
  getAdminWallet,
  fetchTransferUsers,
  transferToUser,
  transferFromUser,
  getUserWalletBalance,
  transferInternalBalance,
  syncAdminWallet,
  getRewardDetailedStats,
  getWithdrawalTaxStats,
  withdrawAdminProfit,
  getWithdrawalFees
} from "../services/adminWalletApi";

const AccordionSection = ({ title, children, isOpen, onToggle, icon: Icon }) => {
  return (
    <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-6 w-6 text-blue-600" />}
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
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
};

const AdminWallet = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminWallet, setAdminWalletData] = useState({
    balance: 0,
    revenueBalance: 0,
    unallocatedBalance: 0,
    settlementBalance: 0,
    totalCommissionRevenue: 0,
    totalPromotionalExpense: 0,
    totalCommissionOwed: 0,
    totalDebtToRiders: 0,
    rewardReserve: 0,
    kycReserve: 0,
    totalEarnings: 0,
    totalKycExpense: 0,
    discrepancyReasons: [],
    isReconciled: true
  });
  
  // Withdrawal Settings State
  const [withdrawalSettings, setWithdrawalSettings] = useState({
    minimumWithdrawalAmount: 2000,
    minimumWalletBalance: 500,
    riderFreeWithdrawalsPerDay: 1,
    maxFreeWithdrawalAmount: 9999,
    withdrawalCooldownMinutes: 60,
    absorbFees: true,
    tieredFeesEnabled: true,
    freeWithdrawalsEnabled: false,
    freeWithdrawalWaiveBaseFee: true,
    freeWithdrawalWaiveVat: true,
    freeWithdrawalWaiveStampDuty: false,
    vatPercent: 7.5,
    stampDutyThreshold: 10000,
    stampDutyAmount: 50,
    tier1Limit: 5000,
    tier1Fee: 50,
    tier2Limit: 50000,
    tier2Fee: 50,
    tier3Fee: 75,
    allowRewardsForBillPayments: false,
    identityPoints: 0,
    addressPoints: 0,
    hackneyPoints: 0,
    insurancePoints: 0,
  });


  
  const LOW_BALANCE_THRESHOLD = 5000;
  const [merchantBalances, setMerchantBalances] = useState(null);
  const [merchantBalanceError, setMerchantBalanceError] = useState(null);
  const [openSections, setOpenSections] = useState({
    wallet: true,
    bank: true,
    internalTransfer: false,
    discrepancies: true,
    accounting: false,
  });

  // Company Bank Details
  const [bankDetails, setBankDetails] = useState({
    primary: {
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
    secondary: {
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
  });

  // Manual Transfer State
  const [transferType, setTransferType] = useState("credit");
  const [transferRole, setTransferRole] = useState("rider");
  const [usersList, setUsersList] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedUserBalance, setSelectedUserBalance] = useState(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDescription, setTransferDescription] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [transferring, setTransferring] = useState(false);
  
  // New States for Enhanced Features
  const [searchQuery, setSearchQuery] = useState("");
  const [balanceBreakdown, setBalanceBreakdown] = useState({ total: 0, earnings: 0, rewards: 0, deposit: 0, spendable: 0 });
  const [balanceType, setBalanceType] = useState("reward"); 
  const [maxBenefitCommissionPercent, setMaxBenefitCommissionPercent] = useState(50);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRescue, setShowRescue] = useState(false);

  // Internal Transfer States
  const [internalSource, setInternalSource] = useState("balance");
  const [internalDest, setInternalDest] = useState("rewardReserve");
  const [internalAmount, setInternalAmount] = useState("");
  const [internalDescription, setInternalDescription] = useState("");
  const [isInternalTransferring, setIsInternalTransferring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [rewardStats, setRewardStats] = useState({
      totalGivenThisPeriod: 0,
      breakdown: { airtime: 0, data: 0, electricity: 0, cable_tv: 0, betting: 0, orders: 0, others: 0 },
      liquidity: { reserve: 0, liability: 0, redeemedTotal: 0 }
  });
  const [taxStats, setTaxStats] = useState({
      totalVat: 0,
      totalStampDuty: 0,
      netGain: 0,
      totalFees: 0,
      count: 0
  });
  const [statsPeriod, setStatsPeriod] = useState("month");
    const [simulatedFees, setSimulatedFees] = useState({
        tier1: { payscribeCost: 20, baseFee: 50, vat: 3.75, stamp: 0, userPays: 53.75, platformGain: 30 },
        tier2: { payscribeCost: 125, baseFee: 50, vat: 3.75, stamp: 50, userPays: 103.75, platformGain: -75 },
        tier3: { payscribeCost: 250, baseFee: 75, vat: 5.63, stamp: 50, userPays: 130.63, platformGain: -175 }
    });
    const [isSimulating, setIsSimulating] = useState(false);
    
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

    useEffect(() => {
        const timer = setTimeout(async () => {
            setIsSimulating(true);
            try {
                const amounts = { tier1: 5000, tier2: 25000, tier3: 75000 };
                const results = {};

                for (const [key, amount] of Object.entries(amounts)) {
                    try {
                        const data = await getWithdrawalFees(amount);
                        
                        if (data) {
                            const cost = Number(data.payscribeCost) || 20; 
                            let userFee = Number(data.totalFee) || 0;
                            
                            if (!withdrawalSettings.absorbFees && userFee < cost) {
                                userFee = cost;
                            }

                            results[key] = {
                                payscribeCost: cost,
                                baseFee: Number(data.baseFee) || 0,
                                vat: Number(data.vat) || 0,
                                stamp: Number(data.stampDuty) || 0,
                                userPays: amount + userFee,
                                userFee: userFee,
                                platformGain: Math.round((userFee - cost) * 100) / 100
                            };
                        }
                    } catch (err) {
                        console.error(`Sim search failed for ${key}:`, err);
                    }
                }

                if (Object.keys(results).length === 3) {
                    setSimulatedFees(results);
                }
            } finally {
                setIsSimulating(false);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [withdrawalSettings.tier1Fee, withdrawalSettings.tier2Fee, withdrawalSettings.tier3Fee, withdrawalSettings.absorbFees]);
  
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDescription, setWithdrawDescription] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    loadSettings();
    loadAdminWallet();
    loadDetailedStats();
  }, [statsPeriod]);

  useEffect(() => {
    if (openSections.manualTransfer) {
      loadUsers(transferRole);
    }
  }, [transferRole, openSections.manualTransfer]);

  useEffect(() => {
    if (selectedUser) {
        fetchUserBalance(selectedUser);
    } else {
        setSelectedUserBalance(null);
    }
  }, [selectedUser]);

  const loadDetailedStats = async () => {

    try {
        setIsLoadingStats(true);
        const [rewardRes, taxRes] = await Promise.all([
            getRewardDetailedStats(statsPeriod),
            getWithdrawalTaxStats(statsPeriod)
        ]);

        if (rewardRes.success) setRewardStats(rewardRes.stats);
        if (taxRes.success) setTaxStats(taxRes.stats);
    } catch (error) {
        console.error("Failed to load detailed stats:", error);
    } finally {
        setIsLoadingStats(false);
    }
  };

  const loadAdminWallet = async () => {
    try {
        setIsRefreshing(true);
        const data = await getAdminWallet();
        console.log("Admin Wallet Response:", data);
        if (data && data.success) {
            setAdminWalletData(data.wallet || {});
            setMerchantBalances(data.merchantBalances || null);
            setMerchantBalanceError(data.merchantBalanceError || null);
        }
    } catch (error) {
        console.error("Failed to load admin wallet:", error);
        setMerchantBalanceError("Failed to load: " + (error.response?.data?.error || error.message));
    } finally {
        setIsRefreshing(false);
    }
  };

  const fetchUserBalance = async (userId) => {
    try {
        setIsFetchingBalance(true);
        const data = await getUserWalletBalance(userId);
        setSelectedUserBalance(data.balance || 0);
        if (data.breakdown) {
            setBalanceBreakdown(data.breakdown);
        } else {
             setBalanceBreakdown({ total: data.balance || 0, earnings: data.balance || 0, rewards: 0, deposit: 0, spendable: data.balance || 0 });
        }
    } catch (error) {
        console.error("Failed to fetch user balance:", error);
        toast.error("Could not fetch user existing balance");
    } finally {
        setIsFetchingBalance(false);
    }
  };

  const loadUsers = async (role) => {
    try {
        setLoadingUsers(true);
        const users = await fetchTransferUsers(role);
        setUsersList(users);
    } catch (error) {
        console.error(`Failed to load ${role}s:`, error);
        toast.error(`Failed to load ${role}s`);
    } finally {
        setLoadingUsers(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminSettings();
      
      if (data?.settings) {
        if (data.settings.paymentAccounts) {
          setBankDetails({
            primary: {
              bankName: data.settings.paymentAccounts.primary?.bankName || "",
              accountNumber: data.settings.paymentAccounts.primary?.accountNumber || "",
              accountName: data.settings.paymentAccounts.primary?.accountName || "",
            },
            secondary: {
              bankName: data.settings.paymentAccounts.secondary?.bankName || "",
              accountNumber: data.settings.paymentAccounts.secondary?.accountNumber || "",
              accountName: data.settings.paymentAccounts.secondary?.accountName || "",
            },
          });
        }
        if (data.settings.maxBenefitCommissionPercent !== undefined) {
          setMaxBenefitCommissionPercent(data.settings.maxBenefitCommissionPercent);
        }

        // Load Withdrawal Settings
        setWithdrawalSettings({
          minimumWithdrawalAmount: data.settings.minimumWithdrawalAmount || 2000,
          minimumWalletBalance: data.settings.minimumWalletBalance || 500,
          riderFreeWithdrawalsPerDay: data.settings.withdrawalControls?.riderFreeWithdrawalsPerDay || 1,
          maxFreeWithdrawalAmount: data.settings.withdrawalControls?.maxFreeWithdrawalAmount || 9999,
          withdrawalCooldownMinutes: data.settings.withdrawalControls?.withdrawalCooldownMinutes || 60,
          absorbFees: data.settings.withdrawalControls?.absorbFees ?? true,
          tieredFeesEnabled: data.settings.withdrawalControls?.tieredFeesEnabled ?? true,
          freeWithdrawalsEnabled: data.settings.withdrawalControls?.freeWithdrawalsEnabled ?? false,
          freeWithdrawalWaiveBaseFee: data.settings.withdrawalControls?.freeWithdrawalWaiveBaseFee ?? true,
          freeWithdrawalWaiveVat: data.settings.withdrawalControls?.freeWithdrawalWaiveVat ?? true,
          freeWithdrawalWaiveStampDuty: data.settings.withdrawalControls?.freeWithdrawalWaiveStampDuty ?? false,
          vatPercent: data.settings.withdrawalControls?.vatPercent || 7.5,
          stampDutyThreshold: data.settings.withdrawalControls?.stampDutyThreshold || 10000,
          stampDutyAmount: data.settings.withdrawalControls?.stampDutyAmount || 50,
          tier1Limit: data.settings.withdrawalControls?.tier1Limit || 5000,
          tier1Fee: data.settings.withdrawalControls?.tier1Fee || 50,
          tier2Limit: data.settings.withdrawalControls?.tier2Limit || 50000,
          tier2Fee: data.settings.withdrawalControls?.tier2Fee || 50,
          tier3Fee: data.settings.withdrawalControls?.tier3Fee || 75,
          allowRewardsForBillPayments: data.settings.allowRewardsForBillPayments ?? false,
          
          // Compliance Rewards
          identityPoints: data.settings.compliance?.identityPoints || 0,
          addressPoints: data.settings.compliance?.addressPoints || 0,
          hackneyPoints: data.settings.compliance?.hackneyPoints || 0,
          insurancePoints: data.settings.compliance?.insurancePoints || 0,
          
          // Identity & Compliance (Standard 1/2/3 Hierarchy)
          kycTier1DailyLimit: data.settings.kycTierLimits?.tier1?.dailyLimit || 50000,
          kycTier1MaxBalance: data.settings.kycTierLimits?.tier1?.maxBalance || 50000,
          kycTier2DailyLimit: data.settings.kycTierLimits?.tier2?.dailyLimit || 200000,
          kycTier2MaxBalance: data.settings.kycTierLimits?.tier2?.maxBalance || 200000,
          kycTier3DailyLimit: data.settings.kycTierLimits?.tier3?.dailyLimit || 5000000,
          kycTier3MaxBalance: data.settings.kycTierLimits?.tier3?.maxBalance || 5000000,
        });
      }
    } catch (error) {
      console.error("Failed to load wallet settings:", error);
      toast.error("Failed to load wallet settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        // Company Bank Details
        paymentAccounts: bankDetails,
        
        // Withdrawal Settings
        minimumWithdrawalAmount: withdrawalSettings.minimumWithdrawalAmount,
        minimumWalletBalance: withdrawalSettings.minimumWalletBalance,
        allowRewardsForBillPayments: withdrawalSettings.allowRewardsForBillPayments,
        withdrawalControls: {
          riderFreeWithdrawalsPerDay: withdrawalSettings.riderFreeWithdrawalsPerDay,
          maxFreeWithdrawalAmount: withdrawalSettings.maxFreeWithdrawalAmount,
          withdrawalCooldownMinutes: withdrawalSettings.withdrawalCooldownMinutes,
          absorbFees: withdrawalSettings.absorbFees,
          tieredFeesEnabled: withdrawalSettings.tieredFeesEnabled,
          freeWithdrawalsEnabled: withdrawalSettings.freeWithdrawalsEnabled,
          freeWithdrawalWaiveBaseFee: withdrawalSettings.freeWithdrawalWaiveBaseFee,
          freeWithdrawalWaiveVat: withdrawalSettings.freeWithdrawalWaiveVat,
          freeWithdrawalWaiveStampDuty: withdrawalSettings.freeWithdrawalWaiveStampDuty,
          vatPercent: withdrawalSettings.vatPercent,
          stampDutyThreshold: withdrawalSettings.stampDutyThreshold,
          stampDutyAmount: withdrawalSettings.stampDutyAmount,
          tier1Limit: withdrawalSettings.tier1Limit,
          tier1Fee: withdrawalSettings.tier1Fee,
          tier2Limit: withdrawalSettings.tier2Limit,
          tier2Fee: withdrawalSettings.tier2Fee,
          tier3Fee: withdrawalSettings.tier3Fee,
        },
        kycTierLimits: {
          tier1: {
            dailyLimit: withdrawalSettings.kycTier1DailyLimit,
            maxBalance: withdrawalSettings.kycTier1MaxBalance,
          },
          tier2: {
            dailyLimit: withdrawalSettings.kycTier2DailyLimit,
            maxBalance: withdrawalSettings.kycTier2MaxBalance,
          },
          tier3: {
            dailyLimit: withdrawalSettings.kycTier3DailyLimit,
            maxBalance: withdrawalSettings.kycTier3MaxBalance,
          }
        }
      };

      await updateAdminSettings(payload);
      toast.success("Wallet settings updated successfully!");
      await loadSettings(); 
    } catch (error) {
      console.error("Failed to update wallet settings:", error);
      toast.error(error?.response?.data?.error || "Failed to update wallet settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTransfer = async (e) => {
    e?.preventDefault();
    if (!selectedUser || !transferAmount) {
        toast.error("Please select a user and enter an amount");
        return;
    }

    if (Number(transferAmount) <= 0) {
        toast.error("Amount must be greater than 0");
        return;
    }

    try {
        setTransferring(true);
        
        // Determine action based on transferType
        if (transferType === "credit") {
            await transferToUser({
                userId: selectedUser,
                amount: Number(transferAmount),
                description: transferDescription,
                role: transferRole,
                balanceType: balanceType
            });
            toast.success("Funds transferred to user successfully!");
        } else {
             // DEBIT (Reverse Transfer)
             await transferFromUser({
                userId: selectedUser,
                amount: Number(transferAmount),
                description: transferDescription,
                role: transferRole,
                balanceType: balanceType
            });
            toast.success("Funds debited from user successfully!");
        }

        setTransferAmount("");
        setFormattedAmount("");
        setTransferDescription("");
        
        // Refresh balances
        await Promise.all([
            loadAdminWallet(), 
            fetchUserBalance(selectedUser)
        ]);
        
    } catch (error) {
        console.error("Transfer failed:", error);
        toast.error(error?.response?.data?.error || "Transfer failed");
    } finally {
        setTransferring(false);
    }
  };

  const handleTransferClick = (e) => {
    e.preventDefault();
    if (!selectedUser || !transferAmount) {
        toast.error("Please select a user and enter an amount");
        return;
    }
    const action = transferType === "credit" ? "Credit" : "Debit";
    triggerPinGate(
        `Authorize User ${action}`,
        `${action} ₦${Number(transferAmount).toLocaleString()} to ${selectedUser}? This action is permanent.`,
        () => handleTransfer(e)
    );
  };

  const handleInternalTransfer = async (e) => {
    e?.preventDefault();
    const amount = Number(internalAmount);
    if (!amount || amount <= 0) {
      toast.error("❌ Transfer amount must be greater than 0");
      return;
    }
    
    if (internalSource === internalDest) {
      toast.error("❌ Source and destination must be different");
      return;
    }

    // Strict local check for source funds
    const available = internalSource === "balance" ? calculateUnallocated() : (adminWallet[internalSource] || 0);
    if (amount > available) {
        toast.error(`❌ Insufficient funds in ${internalSource}. Available: ₦${available.toLocaleString()}`);
        return;
    }

    try {
      setIsInternalTransferring(true);
      await transferInternalBalance({
        fromBalance: internalSource,
        toBalance: internalDest,
        amount: amount,
        description: internalDescription || `Internal transfer from ${internalSource} to ${internalDest}`
      });

      toast.success("✅ Internal transfer successful!");
      setInternalAmount("");
      setInternalDescription("");
      
      // Refresh wallet balances
      await loadAdminWallet();
    } catch (error) {
      console.error("Internal transfer failed:", error);
      toast.error(error?.response?.data?.error || "Internal transfer failed");
    } finally {
      setIsInternalTransferring(false);
    }
  };

  const handleInternalTransferClick = (e) => {
    e.preventDefault();
    const amount = Number(internalAmount);
    if (!amount || amount <= 0) {
      toast.error("❌ Transfer amount must be greater than 0");
      return;
    }
    triggerPinGate(
        "Authorize Internal Transfer",
        `Move ₦${amount.toLocaleString()} from ${internalSource} to ${internalDest}?`,
        () => handleInternalTransfer(e)
    );
  };

  const calculateUnallocated = () => {
    return (adminWallet.balance || 0) - (
        (adminWallet.revenueBalance || 0) + 
        (adminWallet.rewardReserve || 0) + 
        (adminWallet.settlementBalance || 0) + 
        (adminWallet.kycReserve || 0)
    );
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAdminWallet();
      console.log("Sync Result Details:", res.details);
      
      if (res.details?.wasAdjusted) {
        toast.success(`🎉 Financial Reconciliation Successful! Ledger synchronized with internal liabilities and external Payscribe funds.`);
      } else {
        toast.info("🛡️ Ledger already in sync. No internal or external discrepancies found.");
      }
      loadAdminWallet();
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error(error.response?.data?.message || "Sync failed. Check system logs for reconciliation errors.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleWithdrawProfit = async (e) => {
    e?.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("❌ Please enter a valid amount.");
      return;
    }

    try {
      setIsWithdrawing(true);
      const res = await withdrawAdminProfit({
        amount,
        description: withdrawDescription || "Admin Profit Withdrawal"
      });

      if (res.success) {
        toast.success(`✅ ${res.message}`);
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        setWithdrawDescription("");
        await loadAdminWallet();
      }
    } catch (error) {
      console.error("Withdrawal failed:", error);
      toast.error(error.response?.data?.error || "Withdrawal failed.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleWithdrawProfitClick = (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("❌ Please enter a valid amount.");
      return;
    }
    triggerPinGate(
        "Authorize Profit Payout",
        `Transfer ₦${amount.toLocaleString()} from Platform Revenue to your linked Admin Bank Account?`,
        () => handleWithdrawProfit(e)
    );
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

    // 📊 Liquidity & Solvency Calculations
    const totalEarmarked = (adminWallet.revenueBalance || 0) + (adminWallet.settlementBalance || 0) + (adminWallet.rewardReserve || 0) + (adminWallet.kycReserve || 0);
    const unallocatedFloat = Math.max(0, (adminWallet.balance || 0) - totalEarmarked);
    const unallocatedPercent = adminWallet.balance > 0 ? ((unallocatedFloat / adminWallet.balance) * 100).toFixed(1) : 0;

    return (
    <div className="p-8 bg-white min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <BuildingLibraryIcon className="h-8 w-8 text-blue-600" />
              Financial Intelligence Hub
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">Monitor solvency, platform reserves, and internal liquidity flows.</p>
        </div>
        <div className="flex items-center gap-2">
            <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 transition-all ${
                unallocatedFloat < 100 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
            }`}>
                <span className={`w-2 h-2 rounded-full ${unallocatedFloat < 100 ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`}></span>
                <span className={`text-xs font-black uppercase ${unallocatedFloat < 100 ? "text-red-700" : "text-emerald-700"}`}>
                    Float: ₦{unallocatedFloat.toLocaleString()}
                </span>
            </div>
        </div>
      </div>

      {/* 🌊 Liquidity & Solvency Breakdown Bar */}
      <div className="mb-10 bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden relative group">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
              <div>
                  <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <ShieldCheckIcon className="h-3 w-3" />
                      Platform Solvency breakdown
                  </h3>
                  <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-gray-900">₦{(adminWallet.balance || 0).toLocaleString()}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Total Merchant Cash</span>
                  </div>
              </div>
              <div className="text-right">
                    <p className="text-[9px] text-gray-400 font-bold italic mb-1 uppercase tracking-tighter">Liquid & Unallocated</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span className="text-sm font-black text-emerald-700">₦{unallocatedFloat.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-emerald-500/60">({unallocatedPercent}%)</span>
                    </div>
              </div>
          </div>

          {/* Progress Bar Container */}
          <div className="relative h-6 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner border border-gray-200">
              {/* Settlement Portion */}
              <div 
                  style={{ width: `${((adminWallet.settlementBalance || 0) / (adminWallet.balance || 1)) * 100}%` }}
                  className="h-full bg-blue-500 transition-all duration-1000 ease-out flex items-center justify-center overflow-hidden border-r border-white/20"
                  title={`Settlement: ₦${(adminWallet.settlementBalance || 0).toLocaleString()}`}
              >
                  {(adminWallet.settlementBalance || 0) > ((adminWallet.balance || 1) * 0.1) && <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Settlement</span>}
              </div>
              {/* Reward Portion */}
              <div 
                  style={{ width: `${((adminWallet.rewardReserve || 0) / (adminWallet.balance || 1)) * 100}%` }}
                  className="h-full bg-orange-500 transition-all duration-1000 ease-out flex items-center justify-center overflow-hidden border-r border-white/20"
                  title={`Rewards: ₦${(adminWallet.rewardReserve || 0).toLocaleString()}`}
              >
                    {(adminWallet.rewardReserve || 0) > ((adminWallet.balance || 1) * 0.1) && <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Rewards</span>}
              </div>
              {/* KYC Portion */}
              <div 
                  style={{ width: `${((adminWallet.kycReserve || 0) / (adminWallet.balance || 1)) * 100}%` }}
                  className="h-full bg-indigo-500 transition-all duration-1000 ease-out flex items-center justify-center overflow-hidden border-r border-white/20"
                  title={`KYC: ₦${(adminWallet.kycReserve || 0).toLocaleString()}`}
              >
                    {(adminWallet.kycReserve || 0) > ((adminWallet.balance || 1) * 0.1) && <span className="text-[8px] font-bold text-white uppercase tracking-tighter">KYC</span>}
              </div>
              {/* Revenue Portion */}
              <div 
                  style={{ width: `${((adminWallet.revenueBalance || 0) / (adminWallet.balance || 1)) * 100}%` }}
                  className="h-full bg-teal-500 transition-all duration-1000 ease-out flex items-center justify-center overflow-hidden border-r border-white/20"
                  title={`Revenue: ₦${(adminWallet.revenueBalance || 0).toLocaleString()}`}
              >
                    {(adminWallet.revenueBalance || 0) > ((adminWallet.balance || 1) * 0.05) && <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Profit</span>}
              </div>
              {/* Unallocated (Operating Float) */}
              <div 
                className="flex-1 h-full bg-emerald-100/50 flex items-center justify-end px-3"
                title={`Operating Float: ₦${unallocatedFloat.toLocaleString()}`}
              >
                    <span className="text-[10px] font-black text-emerald-600 italic tracking-tighter">Liquid Float</span>
              </div>
          </div>

          {/* Legend & Advice */}
          <div className="mt-4 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">User Deposits</span>
              </div>
              <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Rewards</span>
              </div>
              <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">KYC Pot</span>
              </div>
              <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Profit</span>
              </div>
              
              {unallocatedFloat < 100 && (
                <div className="flex items-center gap-1.5 ml-auto bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                    <InformationCircleIcon className="h-3 w-3 text-red-500" />
                    <span className="text-[9px] font-black text-red-600 uppercase">Low Float: Move funds from Rewards to Main</span>
                </div>
              )}
          </div>
      </div>

      {/* Global Low Balance Alert Banner */}
      {(adminWallet.kycReserve < LOW_BALANCE_THRESHOLD || adminWallet.rewardReserve < LOW_BALANCE_THRESHOLD) && (
          <div className="mb-6 bg-red-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                      <InformationCircleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                      <p className="font-black uppercase tracking-tight text-sm">Critical: Low Reserve Alert</p>
                      <p className="text-xs opacity-90 font-medium">
                          {adminWallet.kycReserve < LOW_BALANCE_THRESHOLD && adminWallet.rewardReserve < LOW_BALANCE_THRESHOLD
                            ? "Both KYC and Reward reserves are critically low. Automated systems may fail."
                            : adminWallet.kycReserve < LOW_BALANCE_THRESHOLD
                                ? "KYC Reserve is below threshold. Identity verifications may be blocked."
                                : "Reward Reserve is low. Automated bonus distributions may fail."
                          }
                      </p>
                  </div>
              </div>
              <button 
                onClick={() => {
                    setOpenSections(prev => ({ ...prev, internalTransfer: true }));
                    setInternalDest(adminWallet.kycReserve < LOW_BALANCE_THRESHOLD ? "kycReserve" : "rewardReserve");
                    setInternalSource("revenueBalance");
                    document.getElementById('internal-transfer-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white text-red-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-gray-100 transition-colors shadow-sm"
              >
                  FUND NOW
              </button>
          </div>
      )}

      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Real Profit (Revenue Balance) */}
          <div className="backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/40 transition-all hover:shadow-2xl hover:scale-[1.02] duration-300 flex flex-col group relative overflow-hidden bg-gradient-to-br from-white/90 to-emerald-50/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-700/70">Real Profit</span>
                  <div className="bg-emerald-100 p-2 rounded-2xl group-hover:rotate-12 transition-transform">
                      <BanknotesIcon className="h-6 w-6 text-emerald-600" />
                  </div>
              </div>
              <div className={`text-3xl font-black tracking-tighter ${adminWallet.revenueBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {adminWallet.revenueBalance >= 0 ? '+' : ''}₦{(adminWallet.revenueBalance || 0).toLocaleString()}
              </div>
              <div className={`mt-2 font-black uppercase tracking-tight flex items-center gap-1 text-[10px] ${adminWallet.revenueBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] ${adminWallet.revenueBalance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  {adminWallet.revenueBalance >= 0 ? 'Net Operating Revenue' : 'Operational Deficit'}
              </div>
          </div>

          {/* Unallocated Liquid Cash (Operating Reserve) */}
          <div className="backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/40 transition-all hover:shadow-2xl hover:scale-[1.02] duration-300 flex flex-col group relative overflow-hidden bg-gradient-to-br from-white/90 to-blue-50/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-blue-700/70">Liquid Main Cash</span>
                  <div className="bg-blue-100 p-2 rounded-2xl group-hover:rotate-12 transition-transform">
                      <BuildingLibraryIcon className="h-6 w-6 text-blue-600" />
                  </div>
              </div>
              <div className={`text-3xl font-black tracking-tighter ${adminWallet.unallocatedBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                  {adminWallet.unallocatedBalance >= 0 ? '+' : ''}₦{(adminWallet.unallocatedBalance || 0).toLocaleString()}
              </div>
              <div className={`mt-2 font-black uppercase tracking-tight flex items-center gap-1 text-[10px] ${adminWallet.unallocatedBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] ${adminWallet.unallocatedBalance >= 0 ? 'bg-blue-500' : 'bg-rose-500'}`}></div>
                  {adminWallet.unallocatedBalance >= 0 ? 'Unallocated Operating Balance' : 'Over-Allocated Deficit'}
              </div>
          </div>

          {/* Reward Reserve Pot (Marketing) */}
          <div className={`backdrop-blur-xl p-6 rounded-3xl shadow-xl border transition-all hover:shadow-2xl hover:scale-[1.02] duration-300 flex flex-col group relative overflow-hidden ${
              adminWallet.rewardReserve < LOW_BALANCE_THRESHOLD 
                ? "bg-gradient-to-br from-red-50 to-white/90 border-red-200 ring-4 ring-red-500/10" 
                : "bg-gradient-to-br from-white/90 to-amber-50/50 border-white/40"
          }`}>
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-2xl transition-colors ${
                  adminWallet.rewardReserve < LOW_BALANCE_THRESHOLD ? "bg-red-500/10" : "bg-amber-500/10 group-hover:bg-amber-500/20"
              }`}></div>
              <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black uppercase tracking-widest ${
                      adminWallet.rewardReserve < LOW_BALANCE_THRESHOLD ? "text-red-700" : "text-amber-700/70"
                  }`}>Reward Pot</span>
                  <div className={`p-2 rounded-2xl group-hover:rotate-12 transition-transform ${
                      adminWallet.rewardReserve < LOW_BALANCE_THRESHOLD ? "bg-red-100" : "bg-amber-100"
                  }`}>
                      <GiftIcon className={`h-6 w-6 ${
                          adminWallet.rewardReserve < LOW_BALANCE_THRESHOLD ? "text-red-600" : "text-amber-600"
                      }`} />
                  </div>
              </div>
              <div className={`text-3xl font-black tracking-tighter ${
                  adminWallet.rewardReserve < LOW_BALANCE_THRESHOLD ? "text-red-700" : "text-gray-900"
              }`}>
                  ₦{(adminWallet.rewardReserve || 0).toLocaleString()}
              </div>
              <p className={`text-[10px] mt-2 font-black uppercase tracking-tight flex items-center gap-1 ${
                  adminWallet.rewardReserve < LOW_BALANCE_THRESHOLD ? "text-red-600" : "text-amber-600"
              }`}>
                  {adminWallet.rewardReserve < LOW_BALANCE_THRESHOLD ? (
                      <><span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span> CRITICAL: FUND POT</>
                  ) : (
                      <><div className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div> Marketing Budget</>
                  )}
              </p>
          </div>

          {/* Loyalty Point Liability */}
          <div className={`backdrop-blur-xl p-6 rounded-3xl shadow-xl border transition-all hover:shadow-2xl hover:scale-[1.02] duration-300 flex flex-col group relative overflow-hidden ${
              adminWallet.rewardReserve < adminWallet.pointLiability 
                ? "bg-gradient-to-br from-orange-50 to-white/90 border-orange-200 ring-4 ring-orange-500/10" 
                : "bg-gradient-to-br from-white/90 to-purple-50/50 border-white/40"
          }`}>
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-2xl transition-colors ${
                  adminWallet.rewardReserve < adminWallet.pointLiability ? "bg-orange-500/10" : "bg-purple-500/10 group-hover:bg-purple-500/20"
              }`}></div>
              <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black uppercase tracking-widest ${
                      adminWallet.rewardReserve < adminWallet.pointLiability ? "text-orange-700" : "text-purple-700/70"
                  }`}>Loyalty Liability</span>
                  <div className={`p-2 rounded-2xl group-hover:rotate-12 transition-transform ${
                      adminWallet.rewardReserve < adminWallet.pointLiability ? "bg-orange-100" : "bg-purple-100"
                  }`}>
                      <TicketIcon className={`h-6 w-6 ${
                          adminWallet.rewardReserve < adminWallet.pointLiability ? "text-orange-600" : "text-purple-600"
                      }`} />
                  </div>
              </div>
              <div className={`text-3xl font-black tracking-tighter ${
                  adminWallet.rewardReserve < adminWallet.pointLiability ? "text-orange-700" : "text-gray-900"
              }`}>
                  ₦{(adminWallet.pointLiability || 0).toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-2">
                  <p className={`text-[10px] font-black uppercase tracking-tight flex items-center gap-1 ${
                      adminWallet.rewardReserve < adminWallet.pointLiability ? "text-orange-600" : "text-purple-600"
                  }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${adminWallet.rewardReserve < adminWallet.pointLiability ? 'bg-orange-500 animate-pulse' : 'bg-purple-500'}`}></div>
                      {(adminWallet.totalLoyaltyPoints || 0).toLocaleString()} Pts
                  </p>
                  <span className="text-[10px] font-bold text-gray-400">1pt = ₦{adminWallet.pointValueNaira}</span>
              </div>
          </div>

          {/* Settlement Balance (Liabilities) */}
          <div className="backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/40 transition-all hover:shadow-2xl hover:scale-[1.02] duration-300 flex flex-col group relative overflow-hidden bg-gradient-to-br from-white/90 to-indigo-50/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/20 transition-colors"></div>
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-700/70">Settlement</span>
                  <div className="bg-indigo-100 p-2 rounded-2xl group-hover:rotate-12 transition-transform">
                      <LockClosedIcon className="h-6 w-6 text-indigo-600" />
                  </div>
              </div>
              <div className="text-3xl font-black tracking-tighter text-gray-900">
                  ₦{(adminWallet.settlementBalance || 0).toLocaleString()}
              </div>
              <p className="text-[10px] text-indigo-600 mt-2 font-black uppercase tracking-tight flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                  Owed to Riders & Users
              </p>
          </div>

          {/* KYC Reserve Pot (Identity Verification) */}
          <div className={`backdrop-blur-xl p-6 rounded-3xl shadow-xl border transition-all hover:shadow-2xl hover:scale-[1.02] duration-300 flex flex-col group relative overflow-hidden ${
              adminWallet.kycReserve < LOW_BALANCE_THRESHOLD 
                ? "bg-gradient-to-br from-red-50 to-white/90 border-red-200 ring-4 ring-red-500/10" 
                : "bg-gradient-to-br from-white/90 to-blue-50/50 border-white/40"
          }`}>
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-2xl transition-colors ${
                  adminWallet.kycReserve < LOW_BALANCE_THRESHOLD ? "bg-red-500/10" : "bg-blue-500/10 group-hover:bg-blue-500/20"
              }`}></div>
              <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black uppercase tracking-widest ${
                      adminWallet.kycReserve < LOW_BALANCE_THRESHOLD ? "text-red-700" : "text-blue-700/70"
                  }`}>KYC Reserve</span>
                  <div className={`p-2 rounded-2xl group-hover:rotate-12 transition-transform ${
                      adminWallet.kycReserve < LOW_BALANCE_THRESHOLD ? "bg-red-100" : "bg-blue-100"
                  }`}>
                      <ShieldCheckIcon className={`h-6 w-6 ${
                          adminWallet.kycReserve < LOW_BALANCE_THRESHOLD ? "text-red-600" : "text-blue-600"
                      }`} />
                  </div>
              </div>
              <div className={`text-3xl font-black tracking-tighter ${
                  adminWallet.kycReserve < LOW_BALANCE_THRESHOLD ? "text-red-700" : "text-gray-900"
              }`}>
                  ₦{(adminWallet.kycReserve || 0).toLocaleString()}
              </div>
              <p className={`text-[10px] mt-2 font-black uppercase tracking-tight flex items-center gap-1 ${
                  adminWallet.kycReserve < LOW_BALANCE_THRESHOLD ? "text-red-600" : "text-blue-600"
              }`}>
                  {adminWallet.kycReserve < LOW_BALANCE_THRESHOLD ? (
                      <><span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span> CRITICAL: TOP UP</>
                  ) : (
                      <><div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> ID Verification Pot</>
                  )}
              </p>
              
              {adminWallet.kycReserve < LOW_BALANCE_THRESHOLD && (
                  <button 
                    onClick={() => {
                        setOpenSections(prev => ({ ...prev, internalTransfer: true }));
                        setInternalDest("kycReserve");
                        setInternalSource("revenueBalance");
                    }}
                    className="mt-4 text-[10px] font-black bg-red-600 text-white py-2 rounded-xl hover:bg-black transition-all shadow-sm active:scale-95"
                  >
                      FUND POT NOW
                  </button>
              )}
          </div>

          {/* Marketing Burn % */}
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 transition-all hover:shadow-2xl flex flex-col group">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Marketing Burn</span>
                  <div className="p-2 bg-red-100 rounded-xl group-hover:scale-110 transition-transform">
                      <ArrowPathIcon className="h-6 w-6 text-red-600" />
                  </div>
              </div>
              <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-black text-gray-900 tracking-tight">
                      {adminWallet.totalCommissionRevenue > 0 
                        ? ((adminWallet.totalPromotionalExpense / adminWallet.totalCommissionRevenue) * 100).toFixed(1)
                        : "0.0"}%
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Goal: &lt;{maxBenefitCommissionPercent}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden border border-gray-50">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                        (adminWallet.totalPromotionalExpense / (adminWallet.totalCommissionRevenue || 1)) > (maxBenefitCommissionPercent / 100)
                            ? "bg-red-500" 
                            : "bg-indigo-500"
                    }`} 
                    style={{ width: `${Math.min(100, (adminWallet.totalPromotionalExpense / (adminWallet.totalCommissionRevenue || 1)) * 100)}%` }}
                  ></div>
              </div>
          </div>

          {/* Reconciliation Audit */}
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 transition-all hover:shadow-2xl flex flex-col relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2 relative z-10">
                  <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Financial Reconciliation</span>
                  <div className={`p-2 rounded-xl ${
                      Math.abs((adminWallet.settlementBalance || 0) - (adminWallet.totalUserEarnings || 0)) < 1
                        ? "bg-green-100"
                        : "bg-red-100 text-white"
                  }`}>
                      <ShieldCheckIcon className={`h-6 w-6 ${
                          Math.abs((adminWallet.settlementBalance || 0) - (adminWallet.totalUserEarnings || 0)) < 1
                            ? "text-green-600"
                            : "text-red-600"
                      }`} />
                  </div>
              </div>
              
              <div className="space-y-2 relative z-10">
                  <div className="flex justify-between items-baseline">
                      <span className="text-xs text-gray-500">Settlement Pot:</span>
                      <span className="text-lg font-bold text-gray-900">₦{(adminWallet.settlementBalance || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-gray-100 pt-1">
                      <span className="text-xs text-gray-500">User Earnings:</span>
                      <span className="text-lg font-bold text-gray-900">₦{(adminWallet.totalUserEarnings || 0).toLocaleString()}</span>
                  </div>
                  
                  <div className={`mt-3 py-2 px-3 rounded-xl border ${
                      Math.abs((adminWallet.settlementBalance || 0) - (adminWallet.totalUserEarnings || 0)) < 1
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                  }`}>
                      {Math.abs((adminWallet.settlementBalance || 0) - (adminWallet.totalUserEarnings || 0)) < 1 ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-green-700">
                              <CheckCircleIcon className="h-4 w-4" />
                              RECONCILED: BALANCES MATCH
                          </div>
                      ) : (
                          <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-xs font-bold text-red-700">
                                  <InformationCircleIcon className="h-4 w-4" />
                                  DISCREPANCY DETECTED
                              </div>
                              <p className="text-[10px] text-red-600 font-medium">
                                  Gap: ₦{Math.abs((adminWallet.settlementBalance || 0) - (adminWallet.totalUserEarnings || 0)).toLocaleString()}
                              </p>
                          </div>
                      )}
                  </div>
              </div>

              {/* Background Decoration */}
              <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12 transition-transform group-hover:scale-110">
                  <ShieldCheckIcon className="h-24 w-24 text-gray-200" />
              </div>
          </div>

          {/* New Discrepancy Reasons Alert Card (Only if not reconciled) */}
          {(!adminWallet.isReconciled || (adminWallet.discrepancyReasons?.length > 0)) && (
            <div className="bg-red-50 border-2 border-red-200 p-6 rounded-2xl shadow-lg flex flex-col gap-3 group animate-pulse hover:animate-none transition-all">
                <div className="flex items-center gap-2 text-red-700 font-black uppercase tracking-tighter text-sm">
                    <InformationCircleIcon className="h-5 w-5" />
                    Action Required: Financial Gaps
                </div>
                <div className="space-y-2">
                    {adminWallet.discrepancyReasons?.slice(0, 2).map((reason, idx) => (
                        <div key={idx} className="bg-white/50 p-2 rounded border border-red-100 text-[11px] text-red-800 font-medium">
                            • {reason.message}
                        </div>
                    ))}
                    {(adminWallet.discrepancyReasons?.length || 0) > 2 && (
                        <p className="text-[10px] text-red-500 font-bold italic">
                            + {(adminWallet.discrepancyReasons?.length || 0) - 2} more issues. See Audit section below.
                        </p>
                    )}
                </div>
                <button 
                  onClick={() => setOpenSections(prev => ({ ...prev, discrepancies: true }))}
                  className="mt-1 text-[10px] font-black bg-red-600 text-white px-3 py-1.5 rounded-lg w-fit hover:bg-red-700 shadow-sm"
                >
                    INVESTIGATE NOW
                </button>
            </div>
          )}

          {/* Merchant API Balances (Payscribe) - Restored */}
          <div className={`p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md flex flex-col relative overflow-hidden group ${
              merchantBalances && merchantBalances.wallet_balance < adminWallet.settlementBalance
                ? "bg-red-900 border-red-700"
                : "bg-[#0b1d2e] border-blue-900/30"
          }`}>
              <div className="flex items-center justify-between mb-2 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-blue-300 text-sm font-bold uppercase tracking-wider">Merchant API (Payscribe)</span>
                    {merchantBalances && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase mt-1 w-fit ${
                            merchantBalances.wallewt_balance >= adminWallet.settlementBalance
                                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                : "bg-yellow-400 text-red-900 animate-pulse"
                        }`}>
                            {merchantBalances.wallet_balance >= adminWallet.settlementBalance 
                                ? "✅ Funding Healthy" 
                                : "⚠️ Liability Risk"}
                        </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                        onClick={handleSync} 
                        disabled={isSyncing} 
                        className={`flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/20 transition-all ${isSyncing ? 'opacity-70 cursor-not-allowed' : ''}`}
                        title="Synchronize Internal Ledger and Repair Discrepancies"
                    >
                        <ArrowPathIcon className={`h-4 w-4 text-white ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-white">Repair & Sync</span>
                    </button>
                    <button 
                        onClick={() => { loadAdminWallet(); loadSettings(); }} 
                        disabled={isRefreshing} 
                        className={`transition-transform duration-700 bg-white/10 p-2 rounded-xl border border-white/10 ${isRefreshing ? 'rotate-180' : 'hover:rotate-180'}`}
                        title="Refresh View"
                    >
                        <div className={`h-5 w-5 border-2 border-white/20 border-t-white rounded-full ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
              </div>
              {merchantBalances ? (
                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-blue-300/80">NGN Balance:</span>
                    <span className="text-xl font-black text-white">₦{merchantBalances.wallet_balance?.toLocaleString() || "0"}</span>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-white/5 pt-1">
                    <span className="text-xs text-blue-300/80">USD Balance:</span>
                    <span className="text-lg font-black text-white/90">${(merchantBalances.usd_balance || 0).toLocaleString()}</span>
                  </div>
                  {merchantBalances.wallet_balance < adminWallet.settlementBalance && (
                      <div className="mt-3 text-[10px] bg-red-950/50 p-2 rounded-xl border border-red-500/30">
                          <p className="font-bold text-red-300">Shortfall: ₦{(adminWallet.settlementBalance - merchantBalances.wallet_balance).toLocaleString()}</p>
                          <p className="text-red-400/80">Funding is below participant liabilities!</p>
                      </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-blue-300/50 mt-4 italic">
                   {merchantBalanceError || "Loading NGN/USD balances..."}
                </div>
              )}
              {/* Background Decoration */}
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                  <BanknotesIcon className="h-24 w-24 text-gray-400" />
              </div>
          </div>
      </div>

      {/* Reward Exposure & Liquidity Health (Promissory Analytics) */}
      <div className={`mb-10 p-8 rounded-[2.5rem] shadow-sm border border-gray-200 bg-white relative overflow-hidden group transition-all ${
          isLoadingStats ? "opacity-60 cursor-wait" : ""
      }`}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none opacity-60"></div>
          
          {isLoadingStats && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-3">
                      <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Refreshing Analytics...</span>
                  </div>
              </div>
          )}

          <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div>
                      <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 text-gray-900">
                          <div className="bg-indigo-500 p-2 rounded-2xl shadow-lg shadow-indigo-500/20">
                            <GiftIcon className="h-6 w-6 text-white" />
                          </div>
                          Reward Exposure & Liquidity
                      </h2>
                      <p className="text-indigo-200/60 text-xs font-bold uppercase tracking-widest mt-2">Promissory Liability Analytics</p>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                      {['day', 'month'].map((p) => (
                          <button
                              key={p}
                              onClick={() => setStatsPeriod(p)}
                              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                  statsPeriod === p 
                                  ? "bg-indigo-600 text-white shadow-sm scale-105" 
                                  : "text-gray-500 hover:text-gray-700"
                              }`}
                          >
                              {p}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  {/* Exposure Pulse */}
                  <div className="bg-gray-50 border border-gray-100 p-6 rounded-[2rem] transition-all">
                      <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-1">Total Exposure ({statsPeriod})</p>
                      <div className="text-4xl font-black tracking-tighter text-gray-900">
                          ₦{(rewardStats.totalGivenThisPeriod || 0).toLocaleString()}
                      </div>
                      <div className="mt-4 flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-gray-400 uppercase">Redeemed</span>
                              <span className="text-indigo-600">₦{(rewardStats.liquidity.redeemedTotal || 0).toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-500 h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                                style={{ width: `${Math.min(100, (rewardStats.liquidity.redeemedTotal / (rewardStats.totalGivenThisPeriod || 1)) * 100)}%` }}
                              ></div>
                          </div>
                          <p className="text-[9px] text-gray-400 italic">Redemption conversion rate: {rewardStats.totalGivenThisPeriod > 0 ? ((rewardStats.liquidity.redeemedTotal / rewardStats.totalGivenThisPeriod) * 100).toFixed(1) : 0}%</p>
                      </div>
                  </div>

                  {/* Distribution Breakdown */}
                  <div className="bg-gray-50 border border-gray-100 p-6 rounded-[2rem] transition-all md:col-span-1">
                      <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-3">Reward Channels</p>
                      <div className="space-y-3">
                          {[
                              { label: 'Airtime/Data', val: (rewardStats.breakdown.airtime || 0) + (rewardStats.breakdown.data || 0), color: 'bg-blue-400' },
                              { label: 'Ride Points', val: rewardStats.breakdown.orders || 0, color: 'bg-emerald-400' },
                              { label: 'Utilities/Betting', val: (rewardStats.breakdown.electricity || 0) + (rewardStats.breakdown.betting || 0) + (rewardStats.breakdown.cable_tv || 0), color: 'bg-amber-400' },
                              { label: 'Others', val: rewardStats.breakdown.others || 0, color: 'bg-slate-400' },
                          ].map((item, i) => (
                              <div key={i} className="flex flex-col gap-1.5">
                                  <div className="flex justify-between text-[10px] font-bold">
                                      <span className="text-gray-500 uppercase tracking-tighter">{item.label}</span>
                                      <span className="text-gray-800">₦{item.val.toLocaleString()}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                                      <div className={`${item.color} h-full rounded-full opacity-60`} style={{ width: `${Math.min(100, (item.val / (rewardStats.totalGivenThisPeriod || 1)) * 100)}%` }}></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Liquidity Risk Card */}
                  <div className={`p-6 rounded-[2rem] transition-all border ${
                      rewardStats.liquidity.liability > 0 
                      ? "bg-rose-50 border-rose-200" 
                      : "bg-gray-50 border-gray-100"
                  }`}>
                      <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-1">Unfunded Liability</p>
                      <div className={`text-4xl font-black tracking-tighter ${rewardStats.liquidity.liability > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          ₦{(rewardStats.liquidity.liability || 0).toLocaleString()}
                      </div>
                      
                      <div className="mt-4 p-4 rounded-xl bg-white border border-gray-100 shadow-inner">
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                              {rewardStats.liquidity.liability > 0 
                                ? "⚠️ Promoting on Credit: Promissory points given while reward pot was empty. Liquidity fallback from revenue is active."
                                : "✅ Fully Funded: All outstanding points are backed by the reward reserve."
                              }
                          </p>
                          {rewardStats.liquidity.liability > 0 && (
                              <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-100">
                                  <span className="text-[9px] text-rose-600 font-black italic uppercase">Risk Factor: Active</span>
                                  <span className="text-[9px] text-gray-400 font-bold">fallback: revenue_bal</span>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Tax & Fees Transparency Row */}
              <div className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100">
                  <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-8">
                      <div className="flex items-center gap-4">
                          <div className="bg-amber-100 p-3 rounded-2xl">
                              <BuildingLibraryIcon className="h-6 w-6 text-amber-600" />
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Withdrawal Tax Hub</p>
                              <p className="text-gray-400 text-[9px] font-bold italic tracking-tight uppercase">Period: {statsPeriod}</p>
                          </div>
                      </div>

                      <div className="flex-1 flex flex-wrap md:flex-nowrap gap-8 justify-around">
                          <div className="text-center group/item hover:scale-110 transition-transform">
                              <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-tighter">VAT (7.5%)</p>
                              <p className="text-lg font-black text-gray-900 tracking-tighter">₦{(taxStats.totalVat || 0).toLocaleString()}</p>
                          </div>
                          <div className="text-center group/item hover:scale-110 transition-transform">
                              <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-tighter">Stamp Duty</p>
                              <p className="text-lg font-black text-gray-900 tracking-tighter">₦{(taxStats.totalStampDuty || 0).toLocaleString()}</p>
                          </div>
                          <div className="text-center group/item hover:scale-110 transition-transform">
                              <p className="text-[9px] font-black text-emerald-600 uppercase mb-1 tracking-tighter">Platform Gain</p>
                              <p className="text-lg font-black text-emerald-600 tracking-tighter">₦{(taxStats.netGain || 0).toLocaleString()}</p>
                          </div>
                          <div className="text-center group/item hover:scale-110 transition-transform">
                              <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-tighter">Success Vol</p>
                              <p className="text-lg font-black text-gray-900 tracking-tighter">{taxStats.count}</p>
                          </div>
                          <div className="text-center group/item hover:scale-110 transition-transform">
                              <p className="text-[9px] font-black text-rose-500 uppercase mb-1 tracking-tighter">Fee Absorption</p>
                              <p className="text-lg font-black text-rose-600 tracking-tighter">₦{(adminWallet.totalPayoutFeeAbsorption || 0).toLocaleString()}</p>
                              <p className="text-[8px] text-gray-400 italic mt-0.5">Marketing Cost</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>



      {/* Financial Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Performance: Profit vs Promo Burn */}
          <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 leading-tight">System Performance</h3>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold italic">Lifetime Comparison</p>
                  </div>
                  <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span>
                          <span className="text-gray-500">Revenue</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm"></span>
                          <span className="text-gray-500">Burn</span>
                      </div>
                  </div>
              </div>
              <div className="h-[280px] w-full">
                  <Bar 
                      data={{
                          labels: [''],
                          datasets: [
                              {
                                  label: 'Revenue',
                                  data: [adminWallet.totalCommissionRevenue],
                                  backgroundColor: 'rgba(59, 130, 246, 0.9)',
                                  hoverBackgroundColor: '#2563eb',
                                  borderRadius: 12,
                                  barThickness: 50,
                              },
                              {
                                  label: 'Promo Burn',
                                  data: [adminWallet.totalPromotionalExpense],
                                  backgroundColor: 'rgba(244, 63, 94, 0.9)',
                                  hoverBackgroundColor: '#e11d48',
                                  borderRadius: 12,
                                  barThickness: 50,
                              }
                          ]
                      }}
                      options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                              legend: { display: false },
                              tooltip: {
                                  padding: 12,
                                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                  titleFont: { size: 13, weight: 'bold' },
                                  bodyFont: { size: 12 },
                                  callbacks: {
                                      label: (ctx) => ` ₦${ctx.raw.toLocaleString()}`
                                  }
                              }
                          },
                          scales: {
                              y: {
                                  beginAtZero: true,
                                  grid: { color: '#f3f4f6', drawBorder: false },
                                  ticks: { 
                                    padding: 10,
                                    color: '#9ca3af',
                                    font: { size: 10 },
                                    callback: (val) => `₦${(val/1000).toFixed(0)}k` 
                                  }
                              },
                              x: { grid: { display: false } }
                          }
                      }}
                  />
              </div>
          </div>

          {/* Liquidity: Pool Distribution */}
          <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 leading-tight">Pool Composition</h3>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold italic">Liquidity Distribution</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-gray-900">₦{(adminWallet.balance || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Total Net Assets</p>
                  </div>
              </div>
              <div className="h-[280px] w-full flex items-center justify-center relative">
                  <Doughnut
                    data={{
                      labels: ['Revenue Profit', 'Reward Reserve', 'KYC Pot', 'Settlement (Users)', 'Unallocated Float'],
                      datasets: [{
                        data: [
                          adminWallet.revenueBalance || 0,
                          adminWallet.rewardReserve || 0,
                          adminWallet.kycReserve || 0,
                          adminWallet.settlementBalance || 0,
                          adminWallet.unallocatedBalance || 0
                        ],
                        backgroundColor: [
                          '#10b981', 
                          '#f59e0b',
                          '#3b82f6', 
                          '#6366f1', 
                          '#94a3b8', 
                        ],
                        hoverOffset: 15,
                        borderColor: '#ffffff',
                        borderWidth: 4,
                        weight: 2
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '72%',
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 20,
                            font: { size: 11, weight: '600' },
                            color: '#4b5563'
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => ` ₦${ctx.raw.toLocaleString()}`
                          }
                        }
                      }
                    }}
                  />
                  {/* Center Text for Doughnut */}
                  <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Liquid</p>
                     <p className="text-lg font-black text-gray-700 leading-none">Status</p>
                  </div>
              </div>
          </div>
      </div>

      <div className="space-y-6">
        {/* Discrepancy Details Section */}
        {(!adminWallet.isReconciled || (adminWallet.discrepancyReasons && adminWallet.discrepancyReasons.length > 0)) && (
          <AccordionSection
            title="Discrepancy Root Causes"
            isOpen={openSections.discrepancies}
            onToggle={() => toggleSection("discrepancies")}
            tooltip="Specific reasons for financial mismatches detected by the system audit."
            icon={InformationCircleIcon}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminWallet.discrepancyReasons?.map((reason, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border-l-4 shadow-sm ${
                    reason.severity === 'critical' ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                        reason.severity === 'critical' ? 'bg-red-200 text-red-900' : 'bg-orange-200 text-orange-900'
                      }`}>
                        {reason.type}
                      </span>
                      <span className="text-sm font-bold text-gray-900">₦{(reason.amount || 0).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium leading-normal">
                      {reason.message}
                    </p>
                    <div className="mt-3 flex gap-2">
                      {reason.type === 'ORPHANED_WALLET' && (
                        <button 
                          onClick={() => toast.info("Run rescue_orphaned_wallets.js on server to fix this automatically.")}
                          className="text-[10px] font-bold text-blue-700 hover:underline"
                        >
                          Auto-Rescue Guide
                        </button>
                      )}
                      {reason.type === 'SETTLEMENT_MISMATCH' && (
                        <button 
                          onClick={() => toast.info("Run fix_admin_reconciliation.js on server to sync ledger.")}
                          className="text-[10px] font-bold text-blue-700 hover:underline"
                        >
                          Sync Ledger Guide
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">
                    <span className="font-bold">Pro-tip:</span> Discrepancies usually happen when users are manually deleted without clearing their balances, 
                    or when reward credits fail to debit the promo reserve. Use the <code>audit_transactions.js</code> script 
                    on the server for a full historical breakdown.
                  </p>
              </div>
            </div>
          </AccordionSection>
        )}

        {/* Manual Transfer Section */}
        <AccordionSection
            title="Manual Wallet Transfer"
            isOpen={openSections.manualTransfer}
            onToggle={() => toggleSection("manualTransfer")}
            tooltip="Manually credit or debit a user's wallet"
            icon={PaperAirplaneIcon}
        >
            <div className="space-y-8">
                {/* 1. Transaction Type Toggle */}
                <div className="flex justify-center mb-6">
                    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setTransferType("credit")}
                            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md transition-all ${
                                transferType === "credit"
                                    ? "bg-green-100 text-green-700 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <BanknotesIcon className="h-4 w-4" />
                            Credit User (Send)
                        </button>
                        <button
                            type="button"
                            onClick={() => setTransferType("debit")}
                            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md transition-all ${
                                transferType === "debit"
                                    ? "bg-red-100 text-red-700 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                           <BuildingLibraryIcon className="h-4 w-4" />
                            Debit User (Retrieve)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: User Selection */}
                    <div className="space-y-4">
                        <div className="flex gap-2 mb-2">
                             <button
                                type="button"
                                onClick={() => {
                                    setTransferRole("rider");
                                    setSelectedUser("");
                                }}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                    transferRole === "rider"
                                        ? "bg-blue-50 border-blue-200 text-blue-700"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                Rider
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setTransferRole("customer");
                                    setSelectedUser("");
                                }}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                    transferRole === "customer"
                                        ? "bg-blue-50 border-blue-200 text-blue-700"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                Customer
                            </button>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select {transferRole === "rider" ? "Rider" : "Customer"}
                            </label>
                            
                            <Combobox value={usersList.find(u => u.value === selectedUser) || null} onChange={(user) => {
                                setSelectedUser(user?.value || "");
                            }}>
                                <div className="relative mt-1">
                                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 sm:text-sm flex items-center transition-shadow shadow-sm h-12">
                                        
                                        {/* Selected User Image Preview */}
                                        {selectedUser && (
                                            <div className="pl-3 flex-shrink-0">
                                                 {usersList.find(u => u.value === selectedUser)?.data?.profilePicture ? (
                                                     <img 
                                                         src={resolveImageUrl(usersList.find(u => u.value === selectedUser).data.profilePicture)} 
                                                         alt="" 
                                                         className="h-8 w-8 rounded-full object-cover bg-gray-200 border border-gray-100"
                                                     />
                                                 ) : (
                                                     <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-200">
                                                         {usersList.find(u => u.value === selectedUser)?.data?.fullName?.charAt(0) || "U"}
                                                     </div>
                                                 )}
                                            </div>
                                        )}

                                        <Combobox.Input
                                            className={`w-full border-none py-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 h-full ${selectedUser ? 'pl-3' : 'pl-4'}`}
                                            displayValue={(user) => user?.label || ""}
                                            onChange={(event) => setSearchQuery(event.target.value)}
                                            placeholder="Select or search user..."
                                        />
                                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer group hover:bg-gray-50 h-full rounded-r-lg border-l border-transparent hover:border-gray-100 transition-colors">
                                            <ChevronUpDownIcon
                                                className="h-5 w-5 text-gray-400 group-hover:text-gray-600"
                                                aria-hidden="true"
                                            />
                                        </Combobox.Button>
                                    </div>
                                    <Transition
                                        as={Fragment}
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                                            {usersList.length === 0 && !loadingUsers ? (
                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                    Nothing found.
                                                </div>
                                            ) : (
                                            usersList
                                                .filter(user => {
                                                    if (!searchQuery) return true;
                                                    return user.label.toLowerCase().includes(searchQuery.toLowerCase());
                                                })
                                                .map((user) => (
                                                    <Combobox.Option
                                                        key={user.value}
                                                        className={({ active }) =>
                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                active ? "bg-blue-600 text-white" : "text-gray-900"
                                                            }`
                                                        }
                                                        value={user}
                                                    >
                                                        {({ selected, active }) => (
                                                            <>
                                                                <div className="flex items-center gap-3">
                                                                    {user.data?.profilePicture ? (
                                                                        <img 
                                                                            src={resolveImageUrl(user.data.profilePicture)} 
                                                                            alt="" 
                                                                            className="h-8 w-8 rounded-full object-cover bg-gray-200"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                                                            {user.data?.fullName?.charAt(0) || "?"}
                                                                        </div>
                                                                    )}
                                                                    <span
                                                                        className={`block truncate ${
                                                                            selected ? "font-medium" : "font-normal"
                                                                        }`}
                                                                    >
                                                                        {user.label}
                                                                    </span>
                                                                </div>
                                                                {selected ? (
                                                                    <span
                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                            active ? "text-white" : "text-blue-600"
                                                                        }`}
                                                                    >
                                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                    </span>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </Combobox.Option>
                                                ))
                                            )}
                                        </Combobox.Options>
                                    </Transition>
                                </div>
                            </Combobox>
                             {loadingUsers && (
                                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                    <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                                    Loading users...
                                </p>
                            )}
                        </div>

                            {/* Visual User List */}
                            <div className="mt-4">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                                    <span>Available {transferRole === "rider" ? "Riders" : "Customers"}</span>
                                    <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-[10px]">{usersList.length}</span>
                                </h4>
                                
                                <div className="border border-gray-200 rounded-lg bg-white overflow-hidden max-h-[300px] overflow-y-auto shadow-sm clean-scroll">
                                    {loadingUsers ? (
                                        <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm">Fetching users...</span>
                                        </div>
                                    ) : usersList.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                                            <span className="text-4xl grayscale opacity-70">🤷‍♂️</span>
                                            <span className="text-sm font-medium">No {transferRole}s found here!</span>
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-gray-100">
                                            {usersList
                                            .filter(user => !searchQuery || user.label.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((user) => (
                                                <li 
                                                    key={user.value} 
                                                    onClick={() => setSelectedUser(user.value)}
                                                    className={`p-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-blue-50 ${
                                                        selectedUser === user.value ? "bg-blue-50 border-l-4 border-blue-600" : "border-l-4 border-transparent"
                                                    }`}
                                                >
                                                    {user.data?.profilePicture ? (
                                                        <img 
                                                            src={resolveImageUrl(user.data.profilePicture)} 
                                                            alt="" 
                                                            className="h-10 w-10 rounded-full object-cover bg-gray-200 ring-2 ring-white shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ring-2 ring-white ${
                                                            transferRole === "rider" ? "bg-indigo-500" : "bg-teal-500"
                                                        }`}>
                                                            {user.data?.fullName?.charAt(0) || "?"}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium truncate ${
                                                            selectedUser === user.value ? "text-blue-900" : "text-gray-900"
                                                        }`}>
                                                            {user.label.split(' (')[0]}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {user.data?.phoneNumber || "No phone"}
                                                        </p>
                                                    </div>
                                                    {selectedUser === user.value && (
                                                        <CheckIcon className="h-5 w-5 text-blue-600" />
                                                    )}
                                                </li>
                                            ))}
                                            {usersList.filter(user => !searchQuery || user.label.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                                <li className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                                                    <span className="text-3xl">🔍</span>
                                                    <span className="text-sm">No matches for "{searchQuery}"</span>
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                            </div>

                         {/* User Balance Display */}
                        {selectedUser && (
                            <div className={`p-4 rounded-lg border transition-colors ${
                                isFetchingBalance 
                                    ? "bg-gray-50 border-gray-200" 
                                    : transferType === "debit" 
                                        ? "bg-red-50 border-red-100" 
                                        : "bg-green-50 border-green-100"
                            }`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-xs font-semibold uppercase tracking-wider ${
                                         transferType === "debit" ? "text-red-600" : "text-green-600"
                                    }`}>
                                        Current Balance
                                    </span>
                                    {isFetchingBalance && (
                                         <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                                    )}
                                </div>
                                <div className={`text-2xl font-bold ${
                                    isFetchingBalance ? "text-gray-400" : "text-gray-900"
                                }`}>
                                     {isFetchingBalance ? "..." : `₦${(selectedUserBalance || 0).toLocaleString()}`}
                                </div>
                                {!isFetchingBalance && selectedUserBalance !== null && (
                                        <div className="mt-2 space-y-1 border-t border-gray-200/50 pt-2">
                                            {transferRole === "rider" && (
                                                <div className="flex justify-between items-start text-xs">
                                                    <span className="text-gray-500 mt-1">Earnings:</span>
                                                    <div className="text-right">
                                                        <span className="font-medium text-gray-900 block">₦{(balanceBreakdown.earnings || 0).toLocaleString()}</span>
                                                        {transferType !== "debit" && (
                                                            <span className="text-xs text-gray-600 block font-normal italic leading-tight mt-0.5">
                                                                Available for usage <br/> (Withdrawal limits apply)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-xs pt-1">
                                                <span className="text-gray-500">Rewards:</span>
                                                <span className="font-medium text-orange-600">₦{(balanceBreakdown.rewards || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs pt-1">
                                                <span className="text-gray-500">Deposit:</span>
                                                <span className="font-medium text-blue-600">₦{(balanceBreakdown.deposit || 0).toLocaleString()}</span>
                                            </div>
                                        {transferType === "debit" || transferRole === "customer" ? (
                                            <div className="mt-2 border-t border-gray-100 pt-1">
                                                <div className="flex justify-between items-center bg-white/50 p-1.5 rounded border border-gray-200/50">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                                        {transferType === "debit" 
                                                            ? "Max Retrieval Limit"
                                                            : "Available for rides & services"
                                                        }
                                                    </span>
                                                    <span className="text-xs font-black text-gray-900">
                                                        ₦{(transferType === "debit" ? selectedUserBalance : (balanceBreakdown.spendable || 0)).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Transfer Form */}
                    <div className="space-y-5 bg-gray-50 p-5 rounded-lg border border-gray-100">
                         <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">
                             Transaction Details
                         </h3>
                         
                    
                        {/* Balance Type Selector (Bucket) */}
                        <div className={`p-4 rounded-lg border transition-all ${
                            transferType === 'debit' ? 'bg-red-50/50 border-red-100' : 'bg-blue-50/50 border-blue-100'
                        }`}>
                            <label className={`block text-xs font-bold mb-3 uppercase tracking-wider ${
                                transferType === 'debit' ? 'text-red-800' : 'text-blue-800'
                            }`}>
                                Targeted Balance Bucket
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setBalanceType("reward")}
                                    className={`px-3 py-2.5 text-xs font-bold rounded-lg border shadow-sm transition-all ${
                                        balanceType === "reward" 
                                            ? "bg-orange-600 text-white border-orange-600 ring-2 ring-orange-200" 
                                            : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                                    }`}
                                >
                                    Reward
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBalanceType("deposit")}
                                    className={`px-3 py-2.5 text-xs font-bold rounded-lg border shadow-sm transition-all ${
                                        balanceType === "deposit" 
                                            ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200" 
                                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                                    }`}
                                >
                                    Deposit
                                </button>
                                {transferRole === "rider" && (
                                    <button
                                        type="button"
                                        onClick={() => setBalanceType("earnings")}
                                        className={`px-3 py-2.5 text-xs font-bold rounded-lg border shadow-sm transition-all ${
                                            balanceType === "earnings" 
                                                ? "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200" 
                                                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                                        }`}
                                    >
                                        Earnings
                                    </button>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-3 font-medium flex items-center gap-1.5 px-0.5">
                                <InformationCircleIcon className="h-3.5 w-3.5 text-gray-400" />
                                {transferType === 'credit' ? (
                                    <>
                                        {balanceType === "reward" && "Credits standard Reward balance (locked for bills/tips)."}
                                        {balanceType === "deposit" && "Credits standard Deposit balance (withdrawable/spendable)."}
                                        {balanceType === "earnings" && "Credits earned commission (Rider only)."}
                                    </>
                                ) : (
                                    <>
                                        {balanceType === "reward" && "Debits strictly from the Reward balance bucket."}
                                        {balanceType === "deposit" && "Debits strictly from the Deposit balance bucket."}
                                        {balanceType === "earnings" && "Debits strictly from the Earnings balance bucket."}
                                    </>
                                )}
                            </p>
                        </div>

                        {/* KYC Reward Rescue (Quick Action Tool) */}
                        {transferType === 'credit' && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <ArrowPathIcon className="h-3 w-3" />
                                        KYC Reward Rescue
                                    </h4>
                                    <button 
                                        type="button"
                                        onClick={() => setShowRescue(!showRescue)}
                                        className={`p-1.5 rounded-lg transition-all ${showRescue ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}
                                        title="Quick Action Settings"
                                    >
                                        <InformationCircleIcon className="h-4 w-4" />
                                    </button>
                                </div>
                                
                                {showRescue ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: 'Tier 2 (ID)', key: 'identityPoints', desc: 'Manual KYC Correction: Tier 2 Identification Reward' },
                                            { label: 'Tier 3 (Address)', key: 'addressPoints', desc: 'Manual KYC Correction: Tier 3 Address Reward' },
                                            { label: 'Hackney Permit', key: 'hackneyPoints', desc: 'Manual KYC Correction: Hackney Permit Reward' },
                                            { label: 'Commercial Ins.', key: 'insurancePoints', desc: 'Manual KYC Correction: Insurance Policy Reward' },
                                        ].map((act) => (
                                            <button
                                                key={act.key}
                                                type="button"
                                                onClick={() => {
                                                    const points = withdrawalSettings[act.key] || 0;
                                                    setTransferAmount(points.toString());
                                                    setFormattedAmount(points.toLocaleString());
                                                    setTransferDescription(act.desc);
                                                    setBalanceType("reward");
                                                    toast.info(`Pre-filled ${act.label} (₦${points})`);
                                                }}
                                                className="text-[10px] font-bold py-2 px-3 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center gap-1"
                                            >
                                                <span className="text-gray-900">{act.label}</span>
                                                <span className="text-indigo-600">₦{(withdrawalSettings[act.key] || 0).toLocaleString()}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-gray-400 italic">Click the icon to see quick reward actions based on compliance settings.</p>
                                )}
                            </div>
                        )}

                        <ValidatedInput
                            label="Amount (₦)"
                            value={transferAmount}
                            onChange={(val) => {
                                setTransferAmount(val);
                                setFormattedAmount(Number(val).toLocaleString());
                            }}
                            isCurrency={true}
                            placeholder="0"
                            className="font-bold"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reason
                            </label>
                            <textarea
                                value={transferDescription}
                                onChange={(e) => setTransferDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={transferType === "credit" ? "e.g. Compensation for delay" : "e.g. Correction of previous error"}
                                rows="2"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleTransferClick}
                            disabled={transferring || !selectedUser || !transferAmount || Number(transferAmount) <= 0}
                            className={`w-full py-3 px-4 rounded-lg font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2 ${
                                transferring || !selectedUser || !transferAmount || Number(transferAmount) <= 0
                                    ? "bg-gray-300 cursor-not-allowed text-gray-500"
                                    : transferType === "credit" 
                                        ? "bg-green-600 hover:bg-green-700 hover:shadow-md"
                                        : "bg-red-600 hover:bg-red-700 hover:shadow-md"
                            }`}
                        >
                            {transferring ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {transferType === "credit" ? "Send to User" : "Debit from User"}
                                    <PaperAirplaneIcon className={`h-5 w-5 ${transferType === "debit" ? "rotate-180" : ""}`} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </AccordionSection>

        {/* System Audit & Accounting Accordion */}
        <AccordionSection
            title="System Audit & Accounting"
            isOpen={openSections.accounting}
            onToggle={() => toggleSection("accounting")}
            icon={BuildingLibraryIcon}
        >
            <div className="mb-6">
                <button 
                    onClick={() => setShowWithdrawModal(true)}
                    className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black hover:bg-black transition-all shadow-lg flex items-center gap-2"
                >
                    <BanknotesIcon className="h-4 w-4" />
                    WITHDRAW PROFIT
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <BanknotesIcon className="h-4 w-4 text-blue-600" />
                        Theoretical Revenue
                    </h4>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-600">Total Commission Earned:</span>
                        <span className="text-sm font-bold text-gray-900">₦{adminWallet.totalCommissionRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-600">Bill Payment Fees:</span>
                        <span className="text-sm font-bold text-gray-900">₦{(adminWallet.billFeeRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-t-2 border-blue-100 pt-2 font-bold px-1">
                        <span className="text-xs text-gray-800">Gross Income:</span>
                        <span className="text-sm text-blue-600">₦{(adminWallet.totalCommissionRevenue + (adminWallet.billFeeRevenue || 0)).toLocaleString()}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <ArrowPathIcon className="h-4 w-4 text-red-600" />
                        Platform Outflows
                    </h4>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-600">Marketing (Rewards/Discounts):</span>
                        <span className="text-sm font-bold text-red-600">₦{adminWallet.totalPromotionalExpense.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-600">Reward Reserve Pool:</span>
                        <span className="text-sm font-bold text-orange-600">₦{adminWallet.rewardReserve.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-600 text-red-600">KYC Pot Lifetime Expense:</span>
                        <span className="text-sm font-bold text-red-600">₦{(adminWallet.totalKycExpense || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-600">Current KYC Reserve:</span>
                        <span className="text-sm font-bold text-blue-600">₦{(adminWallet.kycReserve || 0).toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800 italic">
                        The Reward Reserve is the maximum amount currently set aside for user rewards.
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <UserGroupIcon className="h-4 w-4 text-indigo-600" />
                        Internal Debts
                    </h4>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-600">Debt to Riders (Pending Payout):</span>
                        <span className="text-sm font-bold text-gray-900">₦{adminWallet.totalDebtToRiders.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs text-gray-600">Commission Owed (In-Transit):</span>
                        <span className="text-sm font-bold text-gray-900">₦{adminWallet.totalCommissionOwed.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg text-[10px] text-gray-500 uppercase tracking-tighter">
                        Safe Model ensures Settlement Balance ≥ Internal Debts.
                    </div>
                </div>
            </div>
        </AccordionSection>

        {/* Internal Balance Transfer Section */}
        <AccordionSection
            title="Internal Balance Transfer"
            isOpen={openSections.internalTransfer}
            onToggle={() => toggleSection("internalTransfer")}
            tooltip="Move funds between internal admin balances (e.g. Revenue to Rewards)"
            icon={ArrowPathIcon}
        >
            <div id="internal-transfer-section"></div>
            <form onSubmit={handleInternalTransferClick} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">Source Balance</label>
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 uppercase">
                                Available: ₦{
                                  internalSource === "balance" 
                                    ? calculateUnallocated().toLocaleString()
                                    : (adminWallet[internalSource] || 0) .toLocaleString()
                                }
                            </span>
                        </div>
                        <select
                            value={internalSource}
                            onChange={(e) => setInternalSource(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                            <option value="balance">Liquid Main Cash (Unallocated)</option>
                            <option value="revenueBalance">Revenue Balance (Real Profit)</option>
                            <option value="rewardReserve">Reward Reserve (User Bonuses)</option>
                            <option value="kycReserve">KYC Reserve (Identity Pot)</option>
                            <option value="settlementBalance">Settlement Balance (User/Rider Liability)</option>
                        </select>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">Destination Balance</label>
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 uppercase">
                                Current: ₦{
                                  internalDest === "balance"
                                    ? calculateUnallocated().toLocaleString()
                                    : (adminWallet[internalDest] || 0).toLocaleString()
                                }
                            </span>
                        </div>
                        <select
                            value={internalDest}
                            onChange={(e) => setInternalDest(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                        >
                            <option value="balance">Liquid Main Cash (Unallocated)</option>
                            <option value="revenueBalance">Revenue Balance (Real Profit)</option>
                            <option value="rewardReserve">Reward Reserve (User Bonuses)</option>
                            <option value="kycReserve">KYC Reserve (Identity Pot)</option>
                            <option value="settlementBalance">Settlement Balance (User/Rider Liability)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <ValidatedInput
                            label="Transfer Amount (₦)"
                            value={internalAmount}
                            onChange={setInternalAmount}
                            type="number"
                            placeholder="0.00"
                            className="font-black text-xl text-indigo-600"
                        />
                        {(internalSource === "balance" ? 
                            (Number(internalAmount) > calculateUnallocated()) : 
                            (Number(internalAmount) > (adminWallet[internalSource] || 0))) && (
                            <p className="text-[10px] text-red-600 font-black uppercase mt-1 flex items-center gap-1 italic">
                                <span className="w-1 h-1 bg-red-600 rounded-full animate-ping"></span>
                                Insufficient funds in source pool
                            </p>
                        )}
                        {Number(internalAmount) < 0 && (
                            <p className="text-[10px] text-red-600 font-black uppercase mt-1 flex items-center gap-1 italic">
                                ⚠️ Amount cannot be negative
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comment / Description</label>
                        <input
                            type="text"
                            value={internalDescription}
                            onChange={(e) => setInternalDescription(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Sponsoring weekend rewards"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isInternalTransferring || !internalAmount || (internalSource !== "balance" && Number(internalAmount) > (adminWallet[internalSource] || 0))}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isInternalTransferring ? "Processing..." : (
                        <>
                            <ArrowPathIcon className="h-5 w-5" />
                            Execute Internal Transfer
                        </>
                    )}
                </button>
                {(internalSource === "balance" ? 
                    (Number(internalAmount) > ((adminWallet.balance || 0) - ((adminWallet.revenueBalance || 0) + (adminWallet.rewardReserve || 0) + (adminWallet.settlementBalance || 0) + (adminWallet.kycReserve || 0)))) : 
                    (Number(internalAmount) > (adminWallet[internalSource] || 0))) && (
                    <p className="text-xs text-red-600 font-semibold text-center italic">
                        Insufficient funds in chosen source
                    </p>
                )}
            </form>
        </AccordionSection>

        <form onSubmit={handleSubmit}>
        {/* Withdrawal Configuration Section */}
        <AccordionSection
            title="Withdrawal & Payout Fee Management"
            isOpen={openSections.withdrawal}
            onToggle={() => toggleSection("withdrawal")}
            tooltip="Configure global constraints, fee subsidies, and CBN tiered pricing."
            icon={ShieldCheckIcon}
        >
            {/* Global Wallet Constraints */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-100">
                <ValidatedInput
                    label="Min Wallet Balance (₦)"
                    value={withdrawalSettings.minimumWalletBalance}
                    onChange={(val) => setWithdrawalSettings(prev => ({...prev, minimumWalletBalance: val}))}
                    isCurrency={true}
                    helperText="Required to request withdrawal"
                />
                <ValidatedInput
                    label="Min Withdrawal Amount (₦)"
                    value={withdrawalSettings.minimumWithdrawalAmount}
                    onChange={(val) => setWithdrawalSettings(prev => ({...prev, minimumWithdrawalAmount: val}))}
                    isCurrency={true}
                    helperText="Lowest amount per withdrawal"
                />
            </div>

            <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl mb-8">
                <div className="flex gap-3">
                    <InformationCircleIcon className="h-5 w-5 text-orange-600 flex-shrink-0" />
                    <p className="text-xs text-orange-800 leading-relaxed italic">
                        "When <strong>Tiered Fees (CBN Rules)</strong> is enabled, the platform follows the official tiered structure (₦10/₦25/₦50) + 7.5% VAT + ₦50 Stamp Duty. These fees are ALWAYS forced to be at least the Payscribe cost to prevent loss."
                    </p>
                </div>
            </div>

            {/* 🛡️ 1. IDENTITY & COMPLIANCE (KYC TIER LIMITS) */}
            <div className="mb-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <ShieldCheckIcon className="h-6 w-6 text-emerald-600" />
                    <div>
                        <h3 className="text-lg font-black text-emerald-900 uppercase tracking-tight">Identity Compliance (CBN Tiers)</h3>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Controls: WHO can spend what per day</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tier 1 - The First Verified Tier */}
                    <div className="p-4 bg-white/60 rounded-xl border border-emerald-100">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[10px] font-black text-emerald-700 uppercase">Tier 1 (BVN Verified)</p>
                            <span className="bg-emerald-100 text-emerald-700 text-[8px] px-2 py-0.5 rounded-full font-black">MINIMAL</span>
                        </div>
                        <div className="space-y-3">
                            <ValidatedInput
                                label="Daily Limit (₦)"
                                value={withdrawalSettings.kycTier1DailyLimit}
                                onChange={val => setWithdrawalSettings(prev => ({...prev, kycTier1DailyLimit: val}))}
                                isCurrency={true}
                                className="text-sm"
                            />
                            <ValidatedInput
                                label="Max Balance (₦)"
                                value={withdrawalSettings.kycTier1MaxBalance}
                                onChange={val => setWithdrawalSettings(prev => ({...prev, kycTier1MaxBalance: val}))}
                                isCurrency={true}
                                className="text-sm"
                            />
                        </div>
                    </div>

                    {/* Tier 2 - Basic KYC */}
                    <div className="p-4 bg-white/60 rounded-xl border border-emerald-100 text-emerald-900">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[10px] font-black text-emerald-700 uppercase">Tier 2 (Basic KYC)</p>
                            <span className="bg-emerald-100 text-emerald-700 text-[8px] px-2 py-0.5 rounded-full font-black">MEDIUM</span>
                        </div>
                        <div className="space-y-3">
                            <ValidatedInput
                                label="Daily Limit (₦)"
                                value={withdrawalSettings.kycTier2DailyLimit}
                                onChange={val => setWithdrawalSettings(prev => ({...prev, kycTier2DailyLimit: val}))}
                                isCurrency={true}
                                className="text-sm"
                            />
                            <ValidatedInput
                                label="Max Balance (₦)"
                                value={withdrawalSettings.kycTier2MaxBalance}
                                onChange={val => setWithdrawalSettings(prev => ({...prev, kycTier2MaxBalance: val}))}
                                isCurrency={true}
                                className="text-sm"
                            />
                        </div>
                    </div>

                    {/* Tier 3 - Higher KYC */}
                    <div className="p-4 bg-white/60 rounded-xl border border-emerald-100">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[10px] font-black text-emerald-700 uppercase">Tier 3 (Full Identity)</p>
                            <span className="bg-blue-100 text-blue-700 text-[8px] px-2 py-0.5 rounded-full font-black">PREMIUM</span>
                        </div>
                        <div className="space-y-3">
                            <ValidatedInput
                                label="Daily Limit (₦)"
                                value={withdrawalSettings.kycTier3DailyLimit}
                                onChange={val => setWithdrawalSettings(prev => ({...prev, kycTier3DailyLimit: val}))}
                                isCurrency={true}
                                className="text-sm"
                            />
                            <ValidatedInput
                                label="Max Balance (₦)"
                                value={withdrawalSettings.kycTier3MaxBalance}
                                onChange={val => setWithdrawalSettings(prev => ({...prev, kycTier3MaxBalance: val}))}
                                isCurrency={true}
                                className="text-sm"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 flex items-start gap-2 px-1">
                    <InformationCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-700 leading-tight italic">
                        Note: <strong>Tier 0</strong> users are blocked from outbound spending. Verified users start at <strong>Tier 1</strong> upon BVN approval.
                    </p>
                </div>
            </div>

            {/* 💰 2. WITHDRAWAL & PAYOUT FEES (PRICING RANGES) */}
            <div className="mb-10 p-8 bg-white border border-gray-200 rounded-[2rem] shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <BanknotesIcon className="h-6 w-6 text-indigo-600" />
                        <div>
                            <h3 className="text-lg font-black text-indigo-900 uppercase tracking-tight">Withdrawal Fee Structure</h3>
                            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Controls: HOW MUCH customers pay per transaction</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="tieredFeesEnabled"
                            checked={withdrawalSettings.tieredFeesEnabled}
                            onChange={e => setWithdrawalSettings(prev => ({...prev, tieredFeesEnabled: e.target.checked}))}
                            className="h-5 w-5 text-indigo-600 rounded" />
                        <label htmlFor="tieredFeesEnabled" className="text-sm font-bold text-indigo-900">Active</label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pt-4">
                    <ValidatedInput
                        label="VAT Percentage (%)"
                        value={withdrawalSettings.vatPercent}
                        onChange={val => setWithdrawalSettings(prev => ({...prev, vatPercent: val}))}
                        type="number"
                        step="0.1"
                    />
                    <ValidatedInput
                        label="Stamp Duty (₦)"
                        value={withdrawalSettings.stampDutyAmount}
                        onChange={val => setWithdrawalSettings(prev => ({...prev, stampDutyAmount: val}))}
                        isCurrency={true}
                    />
                    <ValidatedInput
                        label="Stamp Threshold (₦)"
                        value={withdrawalSettings.stampDutyThreshold}
                        onChange={val => setWithdrawalSettings(prev => ({...prev, stampDutyThreshold: val}))}
                        isCurrency={true}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                    <div className="p-4 bg-white/50 rounded-xl border border-indigo-50">
                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-3">Range: Small</p>
                        <ValidatedInput
                            label="Threshold (₦)"
                            value={withdrawalSettings.tier1Limit}
                            onChange={val => setWithdrawalSettings(prev => ({...prev, tier1Limit: val}))}
                            isCurrency={true}
                            className="text-sm mb-3"
                        />
                        <ValidatedInput
                            label="Base Fee (₦)"
                            value={withdrawalSettings.tier1Fee}
                            onChange={val => setWithdrawalSettings(prev => ({...prev, tier1Fee: val}))}
                            isCurrency={true}
                            className="text-sm font-black text-indigo-600"
                        />
                    </div>
                    <div className="p-4 bg-white/50 rounded-xl border border-indigo-50">
                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-3">Range: Medium</p>
                        <ValidatedInput
                            label="Threshold (₦)"
                            value={withdrawalSettings.tier2Limit}
                            onChange={val => setWithdrawalSettings(prev => ({...prev, tier2Limit: val}))}
                            isCurrency={true}
                            className="text-sm mb-3"
                        />
                        <ValidatedInput
                            label="Base Fee (₦)"
                            value={withdrawalSettings.tier2Fee}
                            onChange={val => setWithdrawalSettings(prev => ({...prev, tier2Fee: val}))}
                            isCurrency={true}
                            className="text-sm font-black text-indigo-600"
                        />
                    </div>
                    <div className="p-4 bg-white/50 rounded-xl border border-indigo-50">
                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-3">Range: Large</p>
                        <p className="text-xs text-indigo-300 italic mb-4">Above Medium Threshold</p>
                        <ValidatedInput
                            label="Base Fee (₦)"
                            value={withdrawalSettings.tier3Fee}
                            onChange={val => setWithdrawalSettings(prev => ({...prev, tier3Fee: val}))}
                            isCurrency={true}
                            className="text-sm font-black text-indigo-600"
                        />
                    </div>
                </div>

                {/* 💰 Live Profit Simulation Table */}
                <div className="mt-8 pt-8 border-t border-gray-100">
                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                        <BanknotesIcon className="h-5 w-5 text-indigo-600" />
                        Live Profit Simulation (Real-time Provider Costs)
                    </h4>
                    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Tier</th>
                                    <th className="text-right p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount Range</th>
                                    <th className="text-right p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Base Fee</th>
                                    <th className="text-right p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">VAT ({withdrawalSettings.vatPercent}%)</th>
                                    <th className="text-right p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Stamp Duty</th>
                                    <th className="text-right p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">User Pays</th>
                                    <th className="text-right p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Provider Cost</th>
                                    <th className="text-right p-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest">Your Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: 'Tier 1 (Small)', key: 'tier1', range: `< ₦${(Number(withdrawalSettings.tier1Limit) || 10000).toLocaleString()}` },
                                    { name: 'Tier 2 (Medium)', key: 'tier2', range: `₦${(Number(withdrawalSettings.tier1Limit) || 10000).toLocaleString()} – ₦${(Number(withdrawalSettings.tier2Limit) || 50000).toLocaleString()}` },
                                    { name: 'Tier 3 (Large)', key: 'tier3', range: `> ₦${(Number(withdrawalSettings.tier2Limit) || 50000).toLocaleString()}` },
                                ].map((tier, i) => {
                                    const sim = simulatedFees[tier.key];
                                    const profit = sim.platformGain;
                                    const isAutoAdjusted = !withdrawalSettings.absorbFees && sim.userFee === sim.payscribeCost && sim.userFee > (Number(withdrawalSettings[`${tier.key}Fee`]) || 50);

                                    return (
                                        <tr key={i} className={`border-t border-gray-100 ${profit < 0 ? 'bg-red-50/40' : 'hover:bg-gray-50/80'} transition-all`}>
                                            <td className="p-4 font-bold text-gray-900 text-sm">
                                                {tier.name}
                                                {isSimulating && <span className="ml-2 animate-pulse text-[8px] text-indigo-400 font-normal">Updating...</span>}
                                            </td>
                                            <td className="p-4 text-right text-gray-500 text-xs font-medium">{tier.range}</td>
                                            <td className="p-4 text-right font-black text-gray-900">
                                                ₦{withdrawalSettings[`${tier.key}Fee`]}
                                            </td>
                                            <td className="p-4 text-right text-gray-400 font-medium text-xs">₦{(sim.vat || 0).toLocaleString()}</td>
                                            <td className="p-4 text-right text-gray-400 font-medium text-xs">{(sim.stamp || 0) > 0 ? `₦${(sim.stamp || 0).toLocaleString()}` : '—'}</td>
                                            <td className="p-4 text-right font-black text-indigo-700 text-base">
                                                ₦{((sim.userFee || 0) + (sim.vat || 0) + (sim.stamp || 0)).toLocaleString()}
                                                {isAutoAdjusted && <div className="text-[7px] text-amber-600 font-black leading-none mt-0.5 tracking-widest uppercase">Auto-Adjusted</div>}
                                            </td>
                                            <td className="p-4 text-right text-gray-400 text-xs">₦{sim.payscribeCost}</td>
                                            <td className={`p-4 text-right font-black text-base ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {profit >= 0 ? '+' : ''}₦{profit}
                                                {profit < 0 && <span className="ml-1 text-[8px] text-white bg-red-500 px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">SUBSIDIZED</span>}
                                                {profit === 0 && isAutoAdjusted && <span className="ml-1 text-[9px] text-amber-600 uppercase font-black">BREAK-EVEN</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-3 text-[10px] text-indigo-400 italic">
                        💡 Profit = Base Fee − Provider Cost. VAT and Stamp Duty are pass-through regulatory charges tracked for FIRS/CBN compliance.
                    </p>
                </div>
            </div>

            {/* 🎁 Free Transfer Master Control */}
            <div className={`mb-8 p-6 rounded-2xl border-2 transition-colors ${
                withdrawalSettings.freeWithdrawalsEnabled
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-gray-50 border-gray-200'
            }`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🎁</span>
                        <div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Free Transfers</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">When enabled, users get daily free withdrawals. Absorption cost tracked in Tax Hub.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={withdrawalSettings.freeWithdrawalsEnabled}
                            onChange={(e) => setWithdrawalSettings(prev => ({...prev, freeWithdrawalsEnabled: e.target.checked}))}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span className={`ml-3 text-xs font-black uppercase ${
                            withdrawalSettings.freeWithdrawalsEnabled ? 'text-emerald-700' : 'text-gray-400'
                        }`}>
                            {withdrawalSettings.freeWithdrawalsEnabled ? 'ACTIVE' : 'OFF'}
                        </span>
                    </label>
                </div>

                {withdrawalSettings.freeWithdrawalsEnabled && (
                    <div className="mt-4 pt-4 border-t border-emerald-200/50 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ValidatedInput
                                label="Free Limit Per Day"
                                value={withdrawalSettings.riderFreeWithdrawalsPerDay}
                                onChange={(val) => setWithdrawalSettings(prev => ({...prev, riderFreeWithdrawalsPerDay: val}))}
                                type="number"
                                className="font-bold"
                                helperText="How many free transfers per day"
                            />
                            <ValidatedInput
                                label="Max Free Amount (₦)"
                                value={withdrawalSettings.maxFreeWithdrawalAmount}
                                onChange={(val) => setWithdrawalSettings(prev => ({...prev, maxFreeWithdrawalAmount: val}))}
                                isCurrency={true}
                                className="font-bold"
                                helperText="Cap: only amounts below this qualify"
                            />
                            <ValidatedInput
                                label="Cooldown (Mins)"
                                value={withdrawalSettings.withdrawalCooldownMinutes}
                                onChange={(val) => setWithdrawalSettings(prev => ({...prev, withdrawalCooldownMinutes: val}))}
                                type="number"
                                className="font-bold"
                                helperText="Wait time between withdrawals"
                            />
                        </div>

                        <div className="bg-white/80 p-4 rounded-xl border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3">What to Waive on Free Transfers</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                    <span className="text-sm font-bold text-gray-700">Processing Fee</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={withdrawalSettings.freeWithdrawalWaiveBaseFee}
                                            onChange={(e) => setWithdrawalSettings(prev => ({...prev, freeWithdrawalWaiveBaseFee: e.target.checked}))}
                                            className="sr-only peer" />
                                        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                    <span className="text-sm font-bold text-gray-700">VAT</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={withdrawalSettings.freeWithdrawalWaiveVat}
                                            onChange={(e) => setWithdrawalSettings(prev => ({...prev, freeWithdrawalWaiveVat: e.target.checked}))}
                                            className="sr-only peer" />
                                        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                    <span className="text-sm font-bold text-gray-700">Stamp Duty</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={withdrawalSettings.freeWithdrawalWaiveStampDuty}
                                            onChange={(e) => setWithdrawalSettings(prev => ({...prev, freeWithdrawalWaiveStampDuty: e.target.checked}))}
                                            className="sr-only peer" />
                                        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                            </div>
                            <p className="text-[9px] text-gray-400 italic mt-3">⚠️ Each waived fee is absorbed by the platform. Track absorption cost in the Tax Hub above.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Limits & Absorption */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Absorb Bank Fees (Emergency Override)
                    </label>
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100 flex-1">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={withdrawalSettings.absorbFees}
                                onChange={(e) => setWithdrawalSettings(prev => ({...prev, absorbFees: e.target.checked}))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className="text-xs font-bold uppercase text-gray-600">
                            {withdrawalSettings.absorbFees ? "Enabled" : "Disabled"}
                        </span>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-1 italic">When OFF, platform refuses to subsidize anything (except free quota).</p>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={withdrawalSettings.allowRewardsForBillPayments}
                        onChange={(e) => setWithdrawalSettings(prev => ({...prev, allowRewardsForBillPayments: e.target.checked}))}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                        <span className="text-sm font-bold text-gray-900">Allow Rewards for Bills</span>
                        <p className="text-xs text-gray-500">Enable usage of reward balances for utility payments.</p>
                    </div>
                </label>
            </div>
        </AccordionSection>

        {/* Company Bank Accounts */}
            <AccordionSection
            title="Company Bank Accounts"
            isOpen={openSections.bank}
            onToggle={() => toggleSection("bank")}
            tooltip="Accounts displayed to riders for manual payments"
            icon={BuildingLibraryIcon}
            >
            <div className="space-y-8">
                {/* Primary Account */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">Primary</span>
                    Main Collection Account
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                    <input
                        type="text"
                        value={bankDetails.primary.bankName}
                        onChange={(e) =>
                        setBankDetails({
                            ...bankDetails,
                            primary: { ...bankDetails.primary, bankName: e.target.value },
                        })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="GTBank"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                    <input
                        type="text"
                        value={bankDetails.primary.accountNumber}
                        onChange={(e) =>
                        setBankDetails({
                            ...bankDetails,
                            primary: { ...bankDetails.primary, accountNumber: e.target.value },
                        })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0123456789"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                    <input
                        type="text"
                        value={bankDetails.primary.accountName}
                        onChange={(e) =>
                        setBankDetails({
                            ...bankDetails,
                            primary: { ...bankDetails.primary, accountName: e.target.value },
                        })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="9thWaka Ltd"
                    />
                    </div>
                </div>
                </div>

                {/* Secondary Account */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full mr-2">Secondary</span>
                    Backup Account
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                    <input
                        type="text"
                        value={bankDetails.secondary.bankName}
                        onChange={(e) =>
                        setBankDetails({
                            ...bankDetails,
                            secondary: { ...bankDetails.secondary, bankName: e.target.value },
                        })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Zenith Bank"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                    <input
                        type="text"
                        value={bankDetails.secondary.accountNumber}
                        onChange={(e) =>
                        setBankDetails({
                            ...bankDetails,
                            secondary: { ...bankDetails.secondary, accountNumber: e.target.value },
                        })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0123456789"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                    <input
                        type="text"
                        value={bankDetails.secondary.accountName}
                        onChange={(e) =>
                        setBankDetails({
                            ...bankDetails,
                            secondary: { ...bankDetails.secondary, accountName: e.target.value },
                        })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="9thWaka Operations"
                    />
                    </div>
                </div>
                </div>
            </div>
            </AccordionSection>

            <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                    type="submit"
                    disabled={saving}
                    className={`
                        px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-md
                        hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        transition-all duration-200 flex items-center
                        ${saving ? "opacity-75 cursor-wait" : ""}
                    `}
                >
                    {saving ? (
                        <>
                            <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Saving Changes...
                        </>
                    ) : (
                        "Save Wallet Settings"
                    )}
                </button>
            </div>
        </form>
      </div>
      </div>

      {/* 💸 Modal: Withdraw Admin Profit */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
              <h3 className="text-2xl font-black tracking-tight">Withdraw Profit</h3>
              <p className="text-emerald-100/80 text-sm mt-1 font-medium italic">Subtract from Admin Revenue Ledger.</p>
            </div>
            
            <form onSubmit={handleWithdrawProfitClick} className="p-8 space-y-6">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Available Balance</span>
                  <span className="text-lg font-black text-emerald-800">₦{(adminWallet.revenueBalance || 0).toLocaleString()}</span>
              </div>

              <ValidatedInput
                label="Amount to Withdraw (₦)"
                type="number"
                value={withdrawAmount}
                onChange={setWithdrawAmount}
                placeholder="0.00"
                isCurrency={true}
                className="font-black text-lg"
              />

              <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest px-1">Purpose/Description</label>
                  <textarea
                    value={withdrawDescription}
                    onChange={(e) => setWithdrawDescription(e.target.value)}
                    placeholder="e.g., Transfer to Opay Merchant Account"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none h-24"
                    required
                  />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-4 text-sm font-black text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) <= 0}
                  className="flex-[2] py-4 bg-emerald-600 text-white text-sm font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isWithdrawing ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
                  CONFIRM WITHDRAWAL
                </button>
              </div>
              
              <p className="text-[9px] text-gray-400 text-center font-bold italic">
                Note: This only updates the internal ledger balance.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* 🔐 Financial PIN Gate */}
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


export default AdminWallet;

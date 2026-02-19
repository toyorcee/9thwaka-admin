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
  ChevronUpDownIcon
} from "@heroicons/react/24/outline";
import { Combobox, Transition } from "@headlessui/react";
import { Fragment } from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
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
  getUserWalletBalance
} from "../services/adminWalletApi";

// AccordionSection component (MUST be outside main component to prevent input cursor jumping)
const AccordionSection = ({ title, children, isOpen, onToggle, tooltip, icon: Icon }) => {
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
          {tooltip && (
            <div className="relative group">
              <InformationCircleIcon className="h-5 w-5 text-gray-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10">
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
};

const AdminWallet = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminWallet, setAdminWalletData] = useState({
    balance: 0,
    revenueBalance: 0,
    settlementBalance: 0,
    totalCommissionRevenue: 0,
    totalPromotionalExpense: 0,
    totalCommissionOwed: 0,
    totalDebtToRiders: 0,
    rewardReserve: 0,
    totalEarnings: 0,
  });
  const [merchantBalances, setMerchantBalances] = useState(null);
  const [merchantBalanceError, setMerchantBalanceError] = useState(null);
  const [openSections, setOpenSections] = useState({
    wallet: true,
    bank: true,
    manualTransfer: false,
  });

  // Wallet & Withdrawal Settings (individual state variables prevent cursor jumping)
  const [minimumWalletBalance, setMinimumWalletBalance] = useState("");

  const [withdrawalCooldownDays, setWithdrawalCooldownDays] = useState("");
  const [minimumWithdrawalAmount, setMinimumWithdrawalAmount] = useState("");
  const [maxBenefitCommissionPercent, setMaxBenefitCommissionPercent] = useState("");

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
  // Formatted amount for display
  const [formattedAmount, setFormattedAmount] = useState(""); 
  const [transferDescription, setTransferDescription] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [transferring, setTransferring] = useState(false);
  
  // New States for Enhanced Features
  const [searchQuery, setSearchQuery] = useState("");
  const [debitSource, setDebitSource] = useState("combined"); 
  const [balanceBreakdown, setBalanceBreakdown] = useState({ total: 0, earnings: 0, rewards: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSettings();
    loadAdminWallet();
  }, []);

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
             // Fallback if API hasn't updated yet (simulated)
             setBalanceBreakdown({ total: data.balance || 0, earnings: data.balance || 0, rewards: 0 });
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
        setMinimumWalletBalance(String(data.settings.minimumWalletBalance ?? 500));

        setWithdrawalCooldownDays(String(data.settings.withdrawalCooldownDays ?? 0));
        setMinimumWithdrawalAmount(String(data.settings.minimumWithdrawalAmount ?? 100));
        setMaxBenefitCommissionPercent(String(data.settings.maxBenefitCommissionPercent ?? 50));


        // Load Bank Details
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
        minimumWalletBalance: Number(minimumWalletBalance),

        withdrawalCooldownDays: Number(withdrawalCooldownDays),
        minimumWithdrawalAmount: Number(minimumWithdrawalAmount),
        maxBenefitCommissionPercent: Number(maxBenefitCommissionPercent),
        
        // Company Bank Details
        paymentAccounts: bankDetails,
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
    e.preventDefault();
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
                role: transferRole
            });
            toast.success("Funds transferred to user successfully!");
        } else {
             // DEBIT (Reverse Transfer)
             await transferFromUser({
                userId: selectedUser,
                amount: Number(transferAmount),
                description: transferDescription,
                role: transferRole,
                debitSource: debitSource
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

  return (
    <div className="p-8 mx-auto">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Wallet Dashboard</h1>
        <p className="text-gray-600 mt-2">
            Real-time financial oversight and system accounting.
        </p>
      </div>

      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Real Profit (Revenue Balance) */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm font-medium">Real Net Profit</span>
                  <div className="p-2 bg-green-50 rounded-lg">
                      <BanknotesIcon className="h-5 w-5 text-green-600" />
                  </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                  ₦{(adminWallet.revenueBalance || 0).toLocaleString()}
              </div>
              <p className="text-xs text-green-600 mt-1 font-medium">
                  Revenue - (Rewards + Discounts)
              </p>
          </div>

          {/* Participant Liabilities (Settlement Balance) */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm font-medium">Participant Liabilities</span>
                  <div className="p-2 bg-orange-50 rounded-lg">
                      <BuildingLibraryIcon className="h-5 w-5 text-orange-600" />
                  </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                  ₦{(adminWallet.settlementBalance || 0).toLocaleString()}
              </div>
              <p className="text-xs text-orange-600 mt-1 font-medium">
                  Funds owed to Riders & Users
              </p>
          </div>

          {/* Marketing Burn % */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm font-medium">Marketing Burn %</span>
                  <div className="p-2 bg-red-50 rounded-lg">
                      <ArrowPathIcon className="h-5 w-5 text-red-600" />
                  </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                  {adminWallet.totalCommissionRevenue > 0 
                    ? ((adminWallet.totalPromotionalExpense / adminWallet.totalCommissionRevenue) * 100).toFixed(1)
                    : "0.0"}%
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-red-500 h-full" 
                    style={{ width: `${Math.min(100, (adminWallet.totalPromotionalExpense / (adminWallet.totalCommissionRevenue || 1)) * 100)}%` }}
                  ></div>
              </div>
          </div>

          {/* Merchant API Balances */}
          <div className={`bg-gradient-to-br transition-all duration-500 text-white p-6 rounded-xl shadow-lg relative overflow-hidden ${
              merchantBalances && merchantBalances.wallet_balance < adminWallet.settlementBalance
                ? "from-red-600 to-red-800"
                : "from-blue-600 to-blue-800"
          }`}>
              <div className="flex items-center justify-between mb-2 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-blue-100 text-sm font-medium">Merchant API (Payscribe)</span>
                    {merchantBalances && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            merchantBalances.wallet_balance >= adminWallet.settlementBalance
                                ? "bg-green-500/30 text-green-100"
                                : "bg-yellow-400 text-red-900 animate-pulse"
                        }`}>
                            {merchantBalances.wallet_balance >= adminWallet.settlementBalance 
                                ? "✅ Funding Healthy" 
                                : "⚠️ Liability Risk"}
                        </span>
                    )}
                  </div>
                  <button onClick={loadAdminWallet} disabled={isRefreshing} className={`transition-transform duration-700 ${isRefreshing ? 'rotate-180' : 'hover:rotate-180'}`}>
                    <ArrowPathIcon className={`h-5 w-5 text-blue-200 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
              </div>
              {merchantBalances ? (
                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-blue-200">NGN Balance:</span>
                    <span className="text-lg font-bold">₦{merchantBalances.wallet_balance?.toLocaleString() || "0"}</span>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-blue-500/30 pt-1">
                    <span className="text-xs text-blue-200">USD Balance:</span>
                    <span className="text-lg font-bold">${(merchantBalances.usd_balance || 0).toLocaleString()}</span>
                  </div>
                  {merchantBalances.wallet_balance < adminWallet.settlementBalance && (
                      <div className="mt-2 text-[10px] bg-white/10 p-2 rounded backdrop-blur-sm border border-white/10">
                          <p className="font-bold">Shortfall: ₦{(adminWallet.settlementBalance - merchantBalances.wallet_balance).toLocaleString()}</p>
                          <p className="opacity-80">Funding is below participant liabilities!</p>
                      </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-blue-200 mt-2">
                   {merchantBalanceError || "Loading NGN/USD balances..."}
                </div>
              )}
              {/* Background Decoration */}
              <div className="absolute -right-4 -bottom-4 opacity-10">
                  <BanknotesIcon className="h-24 w-24 text-white" />
              </div>
          </div>
      </div>

      {/* Profitability Visualization */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Financial Health: Profit vs Promo Burn</h3>
              <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      <span>Total Revenue</span>
                  </div>
                  <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      <span>Marketing Expenses</span>
                  </div>
              </div>
          </div>
          <div className="h-[300px] w-full">
              <Bar 
                  data={{
                      labels: ['Lifetime Performance'],
                      datasets: [
                          {
                              label: 'Commission Revenue (NGN)',
                              data: [adminWallet.totalCommissionRevenue],
                              backgroundColor: 'rgba(59, 130, 246, 0.8)',
                              borderRadius: 8,
                          },
                          {
                              label: 'Promotional Expense (NGN)',
                              data: [adminWallet.totalPromotionalExpense],
                              backgroundColor: 'rgba(239, 44, 44, 0.8)',
                              borderRadius: 8,
                          }
                      ]
                  }}
                  options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                          legend: { display: false },
                          tooltip: {
                              callbacks: {
                                  label: (context) => `₦${context.raw.toLocaleString()}`
                              }
                          }
                      },
                      scales: {
                          y: {
                              beginAtZero: true,
                              grid: { color: '#f3f4f6' },
                              ticks: { callback: (val) => `₦${val.toLocaleString()}` }
                          },
                          x: { grid: { display: false } }
                      }
                  }}
              />
          </div>
      </div>

      <div className="space-y-6">
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
                                                         src={usersList.find(u => u.value === selectedUser).data.profilePicture} 
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
                                                                            src={user.data.profilePicture} 
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
                                                            src={user.data.profilePicture} 
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
                                        <div className="flex justify-between items-start text-xs">
                                            <span className="text-gray-500 mt-1">Earnings:</span>
                                            <div className="text-right">
                                                <span className="font-medium text-gray-900 block">₦{balanceBreakdown.earnings.toLocaleString()}</span>
                                                {transferRole === "rider" && transferType !== "debit" && (
                                                    <span className="text-xs text-gray-600 block font-normal italic leading-tight mt-0.5">
                                                        Available for usage <br/> (Withdrawal limits apply)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs pt-1">
                                            <span className="text-gray-500">Rewards:</span>
                                            <span className="font-medium text-orange-600">₦{balanceBreakdown.rewards.toLocaleString()}</span>
                                        </div>
                                        {transferType === "debit" || transferRole === "customer" ? (
                                            <p className="text-xs text-gray-400 mt-2 italic border-t border-gray-100 pt-1">
                                                {transferType === "debit" 
                                                    ? `Max debit amount: ₦${selectedUserBalance.toLocaleString()}`
                                                    : "Available for rides & services"
                                                }
                                            </p>
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
                         
                        {/* Debit Source Selector */}
                        {transferType === "debit" && (
                            <div className="bg-red-50 p-3 rounded border border-red-100">
                                <label className="block text-xs font-semibold text-red-800 mb-2 uppercase tracking-wide">
                                    Debit Source
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="debitSource"
                                            value="combined"
                                            checked={debitSource === "combined"}
                                            onChange={(e) => setDebitSource(e.target.value)}
                                            className="text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-sm text-gray-700">
                                            <span className="font-medium">Combined (Default)</span>
                                            <span className="block text-xs text-gray-500">Deduct from Rewards first, then Earnings.</span>
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="debitSource"
                                            value="earnings_only"
                                            checked={debitSource === "earnings_only"}
                                            onChange={(e) => setDebitSource(e.target.value)}
                                            className="text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-sm text-gray-700">
                                            <span className="font-medium">Earnings Only</span>
                                            <span className="block text-xs text-gray-500">Strictly deduct from Earnings. Rewards untouched.</span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}
                    
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount (₦)
                            </label>
                            <input
                                type="text"
                                value={formattedAmount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, "");
                                    if (val) {
                                        setFormattedAmount(Number(val).toLocaleString());
                                        setTransferAmount(val);
                                    } else {
                                        setFormattedAmount("");
                                        setTransferAmount("");
                                    }
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0"
                            />
                        </div>

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
                            onClick={handleTransfer}
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
            tooltip="Detailed breakdown of internal platform debts and theoretical revenues."
            icon={BuildingLibraryIcon}
        >
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

        <form onSubmit={handleSubmit}>
            {/* Wallet & Withdrawal Configuration */}
            <AccordionSection
            title="Wallet & Withdrawal Rules"
            isOpen={openSections.wallet}
            onToggle={() => toggleSection("wallet")}
            tooltip="Configure limits for rider & user withdrawals"
            icon={BanknotesIcon}
            >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Wallet Balance (₦)
                </label>
                <input
                    type="number"
                    value={minimumWalletBalance}
                    onChange={(e) => setMinimumWalletBalance(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="500"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum required balance</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Benefit Commission Cap (%)
                  </label>
                  <input
                    type="number"
                    value={maxBenefitCommissionPercent}
                    onChange={(e) => setMaxBenefitCommissionPercent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-blue-600"
                    placeholder="50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Limit for rewards/discounts per order</p>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Withdrawal Amount (₦)
                </label>
                <input
                    type="number"
                    value={minimumWithdrawalAmount}
                    onChange={(e) => setMinimumWithdrawalAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum users can withdraw</p>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Cooldown (Days)
                </label>
                <input
                    type="number"
                    value={withdrawalCooldownDays}
                    onChange={(e) => setWithdrawalCooldownDays(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="7"
                />
                <p className="text-xs text-gray-500 mt-1">Days between withdrawals</p>
                </div>
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
  );
};

export default AdminWallet;

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
  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminBalance, setAdminBalance] = useState(0);

  // Accordion state
  const [openSections, setOpenSections] = useState({
    wallet: true,
    bank: true,
    manualTransfer: false,
  });

  // Wallet & Withdrawal Settings (individual state variables prevent cursor jumping)
  const [rewardWithdrawalPercent, setRewardWithdrawalPercent] = useState("");
  const [rewardWithdrawalMinimum, setRewardWithdrawalMinimum] = useState("");
  const [rewardWithdrawalFeePercent, setRewardWithdrawalFeePercent] = useState("");
  const [minimumWalletBalance, setMinimumWalletBalance] = useState("");
  const [withdrawalCooldownDays, setWithdrawalCooldownDays] = useState("");
  const [minimumWithdrawalAmount, setMinimumWithdrawalAmount] = useState("");

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
  const [transferType, setTransferType] = useState("credit"); // 'credit' | 'debit'
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
  const [debitSource, setDebitSource] = useState("combined"); // 'combined' | 'earnings_only'
  const [balanceBreakdown, setBalanceBreakdown] = useState({ total: 0, earnings: 0, rewards: 0 });

  useEffect(() => {
    loadSettings();
    loadAdminWallet();
  }, []);

  useEffect(() => {
    if (openSections.manualTransfer) {
      loadUsers(transferRole);
    }
  }, [transferRole, openSections.manualTransfer]);

  // Fetch balance when user is selected
  useEffect(() => {
    if (selectedUser) {
        fetchUserBalance(selectedUser);
    } else {
        setSelectedUserBalance(null);
    }
  }, [selectedUser]);

  const loadAdminWallet = async () => {
    try {
        const data = await getAdminWallet();
        if (data && data.wallet) {
            setAdminBalance(data.wallet.balance || 0);
        }
    } catch (error) {
        console.error("Failed to load admin wallet:", error);
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
        setRewardWithdrawalPercent(String(data.settings.rewardWithdrawalPercent || 50));
        setRewardWithdrawalMinimum(String(data.settings.rewardWithdrawalMinimum || 5000));
        setRewardWithdrawalFeePercent(String(data.settings.rewardWithdrawalFeePercent || 10));
        setMinimumWalletBalance(String(data.settings.minimumWalletBalance || 500));
        setWithdrawalCooldownDays(String(data.settings.withdrawalCooldownDays || 7));
        setMinimumWithdrawalAmount(String(data.settings.minimumWithdrawalAmount || 100));

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
        rewardWithdrawalPercent: Number(rewardWithdrawalPercent),
        rewardWithdrawalMinimum: Number(rewardWithdrawalMinimum),
        rewardWithdrawalFeePercent: Number(rewardWithdrawalFeePercent),
        minimumWalletBalance: Number(minimumWalletBalance),
        withdrawalCooldownDays: Number(withdrawalCooldownDays),
        minimumWithdrawalAmount: Number(minimumWithdrawalAmount),
        
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
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Wallet Settings</h1>
            <p className="text-gray-600 mt-2">
            Manage system withdrawal limits, wallet balances, and company bank accounts.
            </p>
        </div>
        
        {/* Admin Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-xl shadow-lg min-w-[300px]">
            <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-medium">System Wallet Balance</span>
                <BanknotesIcon className="h-6 w-6 text-blue-200" />
            </div>
            <div className="absolute top-4 right-4">
                <button 
                    onClick={loadAdminWallet}
                    className="p-2 bg-blue-700/50 rounded-full hover:bg-blue-700 transition-colors"
                    title="Refresh Balance"
                >
                    <ArrowPathIcon className={`h-5 w-5 text-white ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <div className="text-3xl font-bold">
                ₦{adminBalance.toLocaleString()}
            </div>
            <div className="text-xs text-blue-200 mt-1">
                Available for payouts & rewards
            </div>
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

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reward Withdrawal Limit (%)
                </label>
                <input
                    type="number"
                    value={rewardWithdrawalPercent}
                    onChange={(e) => setRewardWithdrawalPercent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50"
                />
                <p className="text-xs text-gray-500 mt-1">% of rewards withdrawable</p>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Reward Withdrawal (₦)
                </label>
                <input
                    type="number"
                    value={rewardWithdrawalMinimum}
                    onChange={(e) => setRewardWithdrawalMinimum(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5000"
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reward Withdrawal Fee (%)
                </label>
                <input
                    type="number"
                    value={rewardWithdrawalFeePercent}
                    onChange={(e) => setRewardWithdrawalFeePercent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                />
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

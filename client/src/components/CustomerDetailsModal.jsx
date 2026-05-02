import React, { useState, useEffect } from 'react';
import defaultIcon from '../assets/default_icon.png';
import { resolveImageUrl } from '../utils/urlHelper';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CreditCardIcon,
  XCircleIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  MapPinIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ClockIcon,
  ChartBarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { getUserWalletBalance } from '../services/adminWalletApi';
import { unblockUser } from '../services/adminApi';
import KYCDetailsModal from './KYCDetailsModal';
import BlockUserModal from './BlockUserModal';
import { toast } from 'react-toastify';

const DetailItem = ({ icon: Icon, label, value, color = "text-gray-500" }) => (
  <div className="flex items-center space-x-3 text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors">
    {Icon && <Icon className={`h-5 w-5 ${color}`} />}
    <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider w-24">{label}:</span>
    <span className="text-gray-900 font-semibold">{value || 'N/A'}</span>
  </div>
);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount || 0);
};

const CustomerDetailsModal = ({ customer, onClose, onUpdate }) => {
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(customer.accountDeactivated || false);
  const [balanceBreakdown, setBalanceBreakdown] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    setIsBlocked(customer.accountDeactivated || false);
  }, [customer]);

  const handleUnblock = async () => {
    if (window.confirm('Are you sure you want to unblock this customer?')) {
        try {
            await unblockUser(customer._id);
            toast.success('Customer unblocked successfully');
            setIsBlocked(false);
        } catch (error) {
            toast.error(error.message || 'Failed to unblock customer');
        }
    }
  };

  const handleBlockSuccess = () => {
    setIsBlocked(true);
  };

  const fetchBalance = async () => {
    try {
        setLoadingBalance(true);
        const data = await getUserWalletBalance(customer._id);
        if (data.success) {
            setBalanceBreakdown(data.breakdown);
        }
    } catch (error) {
        console.error("Failed to fetch customer balance:", error);
    } finally {
        setLoadingBalance(false);
    }
  };

  if (!customer) return null;

  const stats = customer.stats || {};
  const lastSeenText = customer.lastSeen
    ? new Date(customer.lastSeen).toLocaleString()
    : 'N/A';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-neutral-200 rounded-[2.5rem] shadow-2xl p-8 max-w-[1100px] w-full border border-white/20">
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-5">
            <div className="relative">
                <img
                    src={resolveImageUrl(customer.profilePicture, defaultIcon)}
                    alt={customer.fullName || customer.email}
                    className="w-20 h-20 rounded-3xl object-cover border-4 border-white dark:border-neutral-800 shadow-xl"
                />
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-neutral-900 ${customer.online ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
            </div>
            <div>
                <h2 className="text-2xl font-black text-black dark:text-white tracking-tight">{customer.fullName || 'N/A'}</h2>
                <p className="text-sm text-gray-500 font-bold">{customer.email}</p>
                <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        customer.tier === 3 ? "bg-emerald-100 text-emerald-700" :
                        customer.tier === 2 ? "bg-indigo-100 text-indigo-700" :
                        "bg-blue-100 text-blue-700"
                    }`}>
                        Tier {customer.tier || 1}
                    </span>
                    {customer.is9thWakaVerified && (
                        <div className="flex items-center space-x-1 px-2 py-0.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm animate-pulse">
                            <ShieldCheckIcon className="h-3 w-3" />
                            <span>9thwaka Verified</span>
                        </div>
                    )}
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-500">
                        Customer
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-neutral-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-indigo-500 border border-indigo-100 dark:border-neutral-700">
                        Last Seen: {lastSeenText}
                    </span>
                </div>
            </div>
          </div>
          <div className="flex space-x-3">
            {isBlocked ? (
              <button 
                onClick={handleUnblock}
                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:scale-105 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-100 flex items-center"
              >
                <CheckBadgeIcon className="h-4 w-4 mr-2" />
                Unblock Account
              </button>
            ) : (
              <button 
                onClick={() => setIsBlockModalOpen(true)}
                className="px-6 py-3 bg-rose-600 text-white rounded-2xl hover:scale-105 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-100 flex items-center"
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Block Account
              </button>
            )}
            <button 
              onClick={() => setIsKYCModalOpen(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:scale-105 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center"
            >
              <CheckBadgeIcon className="h-4 w-4 mr-2" />
              Identity Audit
            </button>
            <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-neutral-800 text-gray-400 hover:text-black dark:hover:text-white rounded-2xl transition-colors">
                <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <section className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800">
                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Personal Information
                </h4>
                <div className="space-y-1">
                    <DetailItem icon={UserIcon} label="Full Name" value={customer.fullName} color="text-indigo-500" />
                    <DetailItem icon={EnvelopeIcon} label="Email" value={customer.email} color="text-indigo-500" />
                    <DetailItem icon={PhoneIcon} label="Phone" value={customer.phoneNumber} color="text-indigo-500" />
                    <DetailItem icon={MapPinIcon} label="Address" value={customer.defaultAddress} color="text-indigo-500" />
                </div>
            </section>

            <section className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4" />
                    Verification & Compliance
                </h4>
                <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Address Verification</span>
                        <span className={`text-[10px] font-black uppercase ${customer.addressVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {customer.addressVerified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                    </div>
                </div>

                {/* Rejection Reasons Block */}
                {(customer.kycRejectionReason || customer.addressRejectionReason) && (
                    <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                        <h5 className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <InformationCircleIcon className="w-3 h-3" />
                            Audit Feedback
                        </h5>
                        {customer.kycRejectionReason && <p className="text-xs font-bold text-rose-700 mb-1">Identity: {customer.kycRejectionReason}</p>}
                        {customer.addressRejectionReason && <p className="text-xs font-bold text-rose-700">Address: {customer.addressRejectionReason}</p>}
                    </div>
                )}
            </section>

            <section className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Internal Bank Discovery</h4>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                        <span>Bank Name</span>
                        <span className="text-black dark:text-white">{customer.bankName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                        <span>Account Number</span>
                        <span className="text-black dark:text-white">{customer.bankAccountNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                        <span>Beneficiary</span>
                        <span className="text-black dark:text-white truncate max-w-[150px]">{customer.bankAccountName || 'N/A'}</span>
                    </div>
                </div>
            </section>

            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
                <span>Last Seen: {lastSeenText}</span>
                <span>Account: {customer.accountDeactivated ? '🚫 DEACTIVATED' : '✅ ACTIVE'}</span>
            </div>
          </div>

          <div className="space-y-8">
            <section className="bg-emerald-50/50 dark:bg-emerald-900/10 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <BanknotesIcon className="w-4 h-4" />
                    Wallet & Platform Value
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-emerald-100/50 shadow-sm">
                        <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Profit to Us</p>
                        <p className="text-lg font-black text-black dark:text-white">
                            ₦{(customer.lifetimeProfit || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-emerald-100/50 shadow-sm">
                        <p className="text-[9px] font-black text-purple-500 uppercase mb-1">Loyalty Points</p>
                        <p className="text-lg font-black text-black dark:text-white">
                            {(customer.loyaltyPoints || 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="mt-4 bg-emerald-600 p-6 rounded-3xl shadow-xl shadow-emerald-200 dark:shadow-none text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Total Available Balance</p>
                    <h5 className="text-4xl font-black tracking-tighter">
                        {loadingBalance ? "..." : `₦${(balanceBreakdown?.total ?? customer.wallet?.balance ?? 0).toLocaleString()}`}
                    </h5>
                    
                    {balanceBreakdown && (
                        <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
                             <div>
                                <p className="text-[9px] font-black uppercase opacity-70">Spendable (AE)</p>
                                <p className="text-lg font-black tracking-tight">₦{balanceBreakdown.spendable.toLocaleString()}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[9px] font-black uppercase opacity-70">Highest Withdrawal</p>
                                <p className="text-lg font-black tracking-tight">₦{(customer.highestWithdrawal || 0).toLocaleString()}</p>
                             </div>
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <CreditCardIcon className="w-4 h-4" />
                    Investor Analytics
                </h4>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" /> Account Maturity
                        </p>
                        <p className="text-xl font-black text-black dark:text-white">{customer.accountAgeDays || 0} <span className="text-[10px] text-gray-400 font-bold uppercase">Days</span></p>
                    </div>
                    <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1 flex items-center gap-1">
                            <ChartBarIcon className="w-3 h-3" /> LTV (Lifetime Value)
                        </p>
                        <p className="text-xl font-black text-blue-600">₦{(customer.totalSpent || 0).toLocaleString()}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                        <div>
                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Spend Velocity</p>
                            <p className="text-sm font-black text-blue-900 dark:text-blue-300">₦{(customer.spendVelocity || 0).toFixed(2)} / Day</p>
                        </div>
                        <GlobeAltIcon className="h-6 w-6 text-blue-400 opacity-50" />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl text-center border border-gray-100 dark:border-neutral-800">
                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Wallet</p>
                            <p className="text-sm font-black text-indigo-600">{customer.paymentMethods?.wallet || 0}</p>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl text-center border border-gray-100 dark:border-neutral-800">
                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Card</p>
                            <p className="text-sm font-black text-indigo-600">{customer.paymentMethods?.card || 0}</p>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl text-center border border-gray-100 dark:border-neutral-800">
                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Transfer</p>
                            <p className="text-sm font-black text-indigo-600">{customer.paymentMethods?.transfer || 0}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
                        <div>
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Power User Category</p>
                            <p className="text-sm font-black text-indigo-900 dark:text-indigo-300 uppercase">{customer.topService || 'N/A'}</p>
                        </div>
                        <ShieldCheckIcon className="h-6 w-6 text-indigo-400 opacity-50" />
                    </div>
                </div>
            </section>

            <section className="bg-neutral-950 p-6 rounded-[2rem] border border-neutral-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <GlobeAltIcon className="w-4 h-4" />
                    Institutional Banking (Payscribe)
                </h4>
                
                {customer.payscribeDetails?.accountNumber ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[8px] font-black text-neutral-500 uppercase mb-1">Virtual Account Number</p>
                            <p className="text-2xl font-black text-white tracking-widest">{customer.payscribeDetails.accountNumber}</p>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-[10px] font-bold text-neutral-400">{customer.payscribeDetails.bankName}</p>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Live Account</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-[8px] font-black text-neutral-500 uppercase">Settlement Name</p>
                                <p className="text-[10px] font-bold text-white truncate">{customer.payscribeDetails.accountName}</p>
                             </div>
                             <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-[8px] font-black text-neutral-500 uppercase">Infrastructure Provisioned</p>
                                <p className="text-[10px] font-bold text-white">{customer.payscribeDetails.createdAt ? new Date(customer.payscribeDetails.createdAt).toLocaleDateString() : 'N/A'}</p>
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 border-dashed">
                        <p className="text-xs font-bold text-neutral-500">Infrastructure not yet provisioned.</p>
                        <p className="text-[10px] text-neutral-600 mt-1 uppercase font-black tracking-widest">Awaiting KYC completion or manual trigger</p>
                    </div>
                )}
            </section>
          </div>
        </div>
      </div>
      {isKYCModalOpen && (
        <KYCDetailsModal 
            user={customer}
            isOpen={isKYCModalOpen}
            onClose={() => setIsKYCModalOpen(false)}
            onApproveSuccess={() => {
                if (onUpdate) onUpdate();
                onClose();
            }}
            onRejectSuccess={() => {
                if (onUpdate) onUpdate();
                onClose();
            }}
        />
      )}

      {isBlockModalOpen && (
        <BlockUserModal 
          isOpen={isBlockModalOpen}
          onClose={() => setIsBlockModalOpen(false)}
          userId={customer._id}
          userName={customer.fullName}
          onSuccess={handleBlockSuccess}
        />
      )}
    </div>
  );
};

export default CustomerDetailsModal;

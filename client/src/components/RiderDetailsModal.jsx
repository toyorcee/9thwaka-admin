import React, { useState, useEffect } from 'react';
import defaultIcon from '../assets/default_icon.png';
import { resolveImageUrl } from '../utils/urlHelper';
import {
  UserIcon,
  PhoneIcon,
  CreditCardIcon,
  StarIcon,
  ShieldCheckIcon,
  XCircleIcon,
  TruckIcon,
  ArrowsPointingOutIcon,
  BanknotesIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  CheckBadgeIcon,
  InformationCircleIcon,
  MapPinIcon,
  ClockIcon,
  ChartBarIcon,
  GlobeAltIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { unblockUser } from '../services/adminApi';
import { getUserWalletBalance } from '../services/adminWalletApi';
import { toast } from 'react-toastify';
import BlockUserModal from './BlockUserModal';
import KYCDetailsModal from './KYCDetailsModal';

const DetailItem = ({ icon: Icon, label, value, color = "text-gray-500" }) => (
  <div className="flex items-center space-x-3 text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors">
    {Icon && <Icon className={`h-5 w-5 ${color}`} />}
    <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider w-24">{label}:</span>
    <span className="text-gray-900 font-semibold">{value || 'N/A'}</span>
  </div>
);

const RiderDetailsModal = ({ rider, onClose, onUpdate }) => {
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [balanceBreakdown, setBalanceBreakdown] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rider?._id) {
        fetchBalance();
    }
  }, [rider?._id]);

  const fetchBalance = async () => {
    try {
        setLoadingBalance(true);
        const data = await getUserWalletBalance(rider._id);
        if (data.success) {
            setBalanceBreakdown(data.breakdown);
        }
    } catch (error) {
        console.error("Failed to fetch rider balance:", error);
    } finally {
        setLoadingBalance(false);
    }
  };

  const formatVehicleType = (vehicleType) => {
    if (!vehicleType) return 'N/A';
    return vehicleType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleUnblock = async () => {
    if (!window.confirm(`Are you sure you want to unblock ${rider.fullName}?`)) return;
    setLoading(true);
    try {
      await unblockUser(rider._id);
      toast.success('Rider unblocked successfully');
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to unblock rider');
    } finally {
      setLoading(false);
    }
  };

  if (!rider) return null;

  const lastSeenText = rider.lastSeen
    ? new Date(rider.lastSeen).toLocaleString()
    : 'N/A';

  const isBlocked = rider.accountDeactivated;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-neutral-200 rounded-[2.5rem] shadow-2xl p-8 max-w-[1400px] w-full max-h-[92vh] overflow-y-auto border border-white/20 relative">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-gray-100 dark:border-neutral-800 pb-8">
          <div className="flex items-center gap-5">
            <div className="relative group">
                <img
                    src={resolveImageUrl(rider.profilePicture, defaultIcon)}
                    alt={rider.fullName}
                    className="w-24 h-24 rounded-3xl object-cover border-4 border-white dark:border-neutral-800 shadow-xl"
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultIcon; }}
                />
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white dark:border-neutral-900 flex items-center justify-center shadow-lg ${rider.online ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                </div>
            </div>
            <div>
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-black dark:text-white tracking-tight">{rider.fullName}</h2>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        rider.tier === 3 ? "bg-emerald-100 text-emerald-700" :
                        rider.tier === 2 ? "bg-indigo-100 text-indigo-700" :
                        "bg-blue-100 text-blue-700"
                    }`}>
                        Tier {rider.tier || 1}
                    </span>
                    {rider.is9thWakaVerified && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm animate-pulse">
                            <ShieldCheckIcon className="h-3 w-3" />
                            <span>9thwaka Verified</span>
                        </div>
                    )}
                </div>
                <p className="text-gray-400 font-bold text-sm mt-1 flex items-center gap-2">
                    {rider.email} <span className="text-gray-300">•</span> <span className="uppercase tracking-widest text-[10px]">{rider.role}</span>
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-neutral-800 rounded-lg text-[10px] font-black uppercase text-gray-500">
                        <StarIcon className="w-3 h-3 text-yellow-500 fill-current" />
                        {rider.averageRating?.toFixed(1) || '0.0'} ({rider.totalRatings || 0} reviews)
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${rider.online ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {rider.online ? 'Live & Active' : 'Offline'}
                    </div>
                    <div className="px-3 py-1 bg-indigo-50 dark:bg-neutral-800 rounded-lg text-[9px] font-black uppercase text-indigo-500 border border-indigo-100 dark:border-neutral-700">
                        Last Seen: {lastSeenText}
                    </div>
                </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setIsKYCModalOpen(true)}
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:scale-105 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-black/10 flex items-center"
            >
              <CheckBadgeIcon className="h-4 w-4 mr-2" />
              Identity Audit
            </button>
            {isBlocked ? (
              <button 
                onClick={handleUnblock}
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-100 disabled:opacity-50"
              >
                Unblock Rider
              </button>
            ) : (
              <button 
                onClick={() => setIsBlockModalOpen(true)}
                className="px-6 py-3 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-100"
              >
                Block Account
              </button>
            )}
            <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-neutral-800 text-gray-400 hover:text-black dark:hover:text-white rounded-2xl transition-colors">
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Section: Personal & KYC Details */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800">
                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Identity Profile
                </h4>
                <div className="space-y-2">
                    <DetailItem icon={PhoneIcon} label="Phone" value={rider.phoneNumber} color="text-indigo-500" />
                    <DetailItem icon={CreditCardIcon} label="BVN" value={rider.bvn} color="text-indigo-500" />
                    <DetailItem icon={ShieldCheckIcon} label="Status" value={rider.bvnVerified ? '✅ BVN Verified' : '❌ Unverified'} color="text-indigo-500" />
                    <DetailItem icon={CreditCardIcon} label="License" value={rider.driverLicenseNumber} color="text-indigo-500" />
                    <DetailItem icon={ShieldCheckIcon} label="License State" value={rider.driverLicenseVerified ? '✅ Approved' : '❌ Pending'} color="text-indigo-500" />
                    <DetailItem icon={MapPinIcon} label="Location" value={rider.address} color="text-indigo-500" />
                </div>

                {/* Rejection Reasons Block */}
                {(rider.kycRejectionReason || rider.addressRejectionReason) && (
                    <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                        <h5 className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <InformationCircleIcon className="w-3 h-3" />
                            Recent Rejections
                        </h5>
                        {rider.kycRejectionReason && <p className="text-xs font-bold text-rose-700 mb-1">Identity: {rider.kycRejectionReason}</p>}
                        {rider.addressRejectionReason && <p className="text-xs font-bold text-rose-700">Address: {rider.addressRejectionReason}</p>}
                    </div>
                )}
            </section>

            <section className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4" />
                    Compliance & Logistics
                </h4>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Hackney Permit</span>
                        <span className={`text-[10px] font-black uppercase ${rider.hackneyVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {rider.hackneyVerified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Insurance Policy</span>
                        <span className={`text-[10px] font-black uppercase ${rider.insuranceVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {rider.insuranceVerified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                    </div>
                </div>
            </section>

            <section className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Internal Bank Discovery</h4>
                <div className="space-y-3">
                    <DetailItem icon={BuildingOffice2Icon} label="Bank" value={rider.bankName} color="text-gray-400" />
                    <DetailItem icon={CreditCardIcon} label="Account" value={rider.bankAccountNumber} color="text-gray-400" />
                    <DetailItem icon={UserIcon} label="Beneficiary" value={rider.bankAccountName} color="text-gray-400" />
                </div>
            </section>
          </div>

          {/* Center Section: Financials & Performance */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-emerald-50/50 dark:bg-emerald-900/10 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/30">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                    <BanknotesIcon className="w-4 h-4" />
                    Financial Intelligence
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-emerald-100/50">
                        <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Profit to Us</p>
                        <p className="text-lg font-black text-black dark:text-white">₦{(rider.lifetimeProfit || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-emerald-100/50">
                        <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">Loyalty Points</p>
                        <p className="text-lg font-black text-black dark:text-white">{(rider.loyaltyPoints || 0).toLocaleString()}</p>
                    </div>
                </div>

                <div className="mt-4 bg-emerald-600 p-6 rounded-3xl shadow-xl shadow-emerald-200 dark:shadow-none text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Spendable Balance (AE)</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-black opacity-60 uppercase tracking-tighter">₦</span>
                        <h5 className="text-4xl font-black tracking-tighter">
                            {(balanceBreakdown?.spendable ?? 0).toLocaleString()}
                        </h5>
                    </div>
                </div>

                <div className="mt-8 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-600 font-bold uppercase tracking-widest text-[9px]">Owed to Rider</span>
                        <span className="font-black text-emerald-900 dark:text-emerald-400">₦{(rider.systemDebtToRider || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-indigo-600 font-bold uppercase tracking-widest text-[9px]">Comm. Debt</span>
                        <span className="font-black text-indigo-900 dark:text-indigo-400">₦{(rider.weeklyCommissionOwed || 0).toLocaleString()}</span>
                    </div>
                </div>
            </section>

            <section className="bg-neutral-950 p-6 rounded-[2rem] border border-neutral-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <BuildingLibraryIcon className="w-4 h-4" />
                    Infrastructure: Payscribe Virtual
                </h4>
                
                {rider.payscribeDetails?.accountNumber ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[8px] font-black text-neutral-500 uppercase mb-1">Assigned Account</p>
                            <p className="text-2xl font-black text-white tracking-widest">{rider.payscribeDetails.accountNumber}</p>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-[10px] font-bold text-neutral-400">{rider.payscribeDetails.bankName}</p>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Settlement Ready</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-[8px] font-black text-neutral-500 uppercase">Beneficiary</p>
                                <p className="text-[10px] font-bold text-white truncate">{rider.payscribeDetails.accountName}</p>
                             </div>
                             <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-[8px] font-black text-neutral-500 uppercase">Node Active Since</p>
                                <p className="text-[10px] font-bold text-white">{rider.payscribeDetails.createdAt ? new Date(rider.payscribeDetails.createdAt).toLocaleDateString() : 'N/A'}</p>
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 border-dashed">
                        <p className="text-xs font-bold text-neutral-500">Virtual Infrastructure Offline</p>
                        <p className="text-[10px] text-neutral-600 mt-1 uppercase font-black tracking-widest">Requires manual provisioning or KYC completion</p>
                    </div>
                )}
            </section>
          </div>

          {/* Right Section: Assets, Media & Investor Intelligence */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800">
                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <ChartBarIcon className="w-4 h-4" />
                    Investor KPIs & Engagement
                </h4>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" /> Retention
                        </p>
                        <p className="text-xl font-black text-black dark:text-white">{rider.accountAgeDays || 0} <span className="text-[10px] text-gray-400 font-bold uppercase">Days</span></p>
                    </div>
                    <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1 flex items-center gap-1">
                            <GlobeAltIcon className="w-3 h-3" /> Profitability
                        </p>
                        <p className="text-xl font-black text-emerald-600">₦{(rider.lifetimeProfit || 0).toLocaleString()}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
                        <div>
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Order Frequency</p>
                            <p className="text-sm font-black text-indigo-900 dark:text-indigo-300">{(rider.engagementScore || 0).toFixed(2)} Orders / Day</p>
                        </div>
                        <ChartBarIcon className="h-6 w-6 text-indigo-400 opacity-50" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Rides</p>
                            <p className="text-xl font-black text-indigo-600">{rider.rideOrders || 0}</p>
                        </div>
                        <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Couriers</p>
                            <p className="text-xl font-black text-indigo-600">{rider.courierOrders || 0}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <TruckIcon className="w-4 h-4" />
                    Asset Verification
                </h4>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800">
                            <p className="text-[9px] font-black text-gray-400 uppercase">Vehicle Type</p>
                            <p className="text-xs font-black uppercase text-blue-600">{formatVehicleType(rider.vehicleType)}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800">
                            <p className="text-[9px] font-black text-gray-400 uppercase">Service Mode</p>
                            <p className="text-xs font-black uppercase text-blue-600">{rider.preferredService || 'All'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <p className="text-[8px] font-black text-gray-400 uppercase text-center tracking-widest">Asset Front</p>
                            <div className="aspect-square bg-gray-200 dark:bg-neutral-800 rounded-2xl overflow-hidden border-2 border-white dark:border-neutral-700 shadow-sm group relative">
                                <img 
                                    src={resolveImageUrl(rider.vehiclePictureFront || rider.vehiclePicture)} 
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-pointer"
                                    onClick={() => window.open(resolveImageUrl(rider.vehiclePictureFront || rider.vehiclePicture), '_blank')}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[8px] font-black text-gray-400 uppercase text-center tracking-widest">Asset Rear</p>
                            <div className="aspect-square bg-gray-200 dark:bg-neutral-800 rounded-2xl overflow-hidden border-2 border-white dark:border-neutral-700 shadow-sm group relative">
                                <img 
                                    src={resolveImageUrl(rider.vehiclePictureBack)} 
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-pointer"
                                    onClick={() => window.open(resolveImageUrl(rider.vehiclePictureBack), '_blank')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-gray-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Lifecycle Activity</h4>
                <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-700 dark:text-neutral-300 flex justify-between">
                        <span>Last Seen:</span>
                        <span className="font-black text-black dark:text-white">{lastSeenText}</span>
                    </p>
                    <p className="text-xs font-bold text-gray-700 dark:text-neutral-300 flex justify-between">
                        <span>Physical Home:</span>
                        <span className="font-black text-black dark:text-white text-right ml-4">{rider.address || 'N/A'}</span>
                    </p>
                    <p className="text-xs font-bold text-gray-700 dark:text-neutral-300 flex justify-between">
                        <span>Account Open:</span>
                        <span className="font-black text-black dark:text-white">{new Date(rider.createdAt).toLocaleDateString()}</span>
                    </p>
                </div>
            </section>
          </div>
        </div>
      </div>

      <BlockUserModal 
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        user={rider}
        onBlocked={() => {
            if (onUpdate) onUpdate();
            onClose();
        }}
      />

      {isKYCModalOpen && (
        <KYCDetailsModal 
            user={rider}
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
    </div>
  );
};

export default RiderDetailsModal;


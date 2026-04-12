import React, { useState } from 'react';
import defaultIcon from '../assets/default_icon.png';
import { resolveImageUrl } from '../utils/urlHelper';
import {
  UserIcon,
  PhoneIcon,
  CreditCardIcon,
  BuildingOffice2Icon,
  StarIcon,
  ShieldCheckIcon,
  XCircleIcon,
  TruckIcon,
  ArrowsPointingOutIcon,
  BanknotesIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { unblockUser } from '../services/adminApi';
import { toast } from 'react-toastify';
import BlockUserModal from './BlockUserModal';
import KYCDetailsModal from './KYCDetailsModal';

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center space-x-3 text-sm">
    {Icon && <Icon className="h-5 w-5 text-gray-500" />}
    <span className="font-semibold text-gray-600">{label}:</span>
    <span className="text-gray-800">{value}</span>
  </div>
);

const RiderDetailsModal = ({ rider, onClose, onUpdate }) => {
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white text-gray-800 rounded-2xl shadow-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Rider Details</h2>
            <p className="text-sm text-gray-500">View and manage rider profile and status</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsKYCModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold flex items-center shadow-sm"
            >
              <CheckBadgeIcon className="h-4 w-4 mr-2" />
              Review KYC
            </button>
            {isBlocked ? (
              <button 
                onClick={handleUnblock}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold flex items-center shadow-sm disabled:opacity-50"
              >
                <CheckBadgeIcon className="h-4 w-4 mr-2" />
                Unblock Rider
              </button>
            ) : (
              <button 
                onClick={() => setIsBlockModalOpen(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold flex items-center shadow-sm"
              >
                <NoSymbolIcon className="h-4 w-4 mr-2" />
                Block Rider
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-bold transition-colors">
              Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Profile & KYC */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <img
                src={resolveImageUrl(rider.profilePicture, defaultIcon)}
                alt={rider.fullName}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
                onError={(e) => { e.target.onerror = null; e.target.src = defaultIcon; }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold truncate">{rider.fullName}</h3>
                <p className="text-xs text-gray-500 truncate">{rider.email}</p>
                <div className={`inline-flex items-center space-x-2 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${rider.online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <div className={`w-2 h-2 rounded-full ${rider.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{rider.online ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Identity & Verification</h4>
              <DetailItem icon={PhoneIcon} label="Phone" value={rider.phoneNumber} />
              <DetailItem icon={CreditCardIcon} label="ID Number (NIN/BVN)" value={rider.nin || 'N/A'} />
              <DetailItem 
                icon={ShieldCheckIcon} 
                label="Identity Verified" 
                value={rider.ninVerified ? '✅ Yes' : '❌ No'} 
              />
              <DetailItem
                icon={CreditCardIcon}
                label="License No."
                value={rider.driverLicenseNumber || 'N/A'}
              />
              <DetailItem
                icon={ShieldCheckIcon}
                label="License Verified"
                value={rider.driverLicenseVerified ? '✅ Yes' : '❌ No'}
              />
              {rider.kycDocuments?.selfie && (
                <button
                  onClick={() => window.open(resolveImageUrl(rider.kycDocuments.selfie), '_blank')}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center mt-4 p-2 bg-blue-50 rounded-lg border border-blue-100 group w-full justify-center"
                >
                  <ArrowsPointingOutIcon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  VIEW SELFIE WITH LICENSE
                </button>
              )}
              {rider.driverLicensePicture && (
                <button
                  onClick={() => window.open(resolveImageUrl(rider.driverLicensePicture), '_blank')}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center mt-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100 group w-full justify-center"
                >
                  <ArrowsPointingOutIcon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  VIEW LICENSE CARD (CLEAR)
                </button>
              )}


            </div>

            <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Info</h4>
                <DetailItem label="Address" value={rider.address || 'N/A'} />
            </div>
          </div>

          {/* Column 2: Vehicle & Bank */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle Details</h4>
              <DetailItem icon={TruckIcon} label="Type" value={formatVehicleType(rider.vehicleType)} />
              <DetailItem icon={StarIcon} label="Preferred Service" value={rider.preferredService || 'N/A'} />
              {rider.vehiclePicture && (
                <button
                  onClick={() => window.open(rider.vehiclePicture, '_blank')}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center mt-2 group"
                >
                  <ArrowsPointingOutIcon className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
                  VIEW VEHICLE IMAGE
                </button>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bank Details</h4>
              <DetailItem
                icon={BuildingOffice2Icon}
                label="Bank Name"
                value={rider.bankName || 'N/A'}
              />
              <DetailItem
                icon={CreditCardIcon}
                label="Account No."
                value={rider.bankAccountNumber || 'N/A'}
              />
              <DetailItem
                icon={UserIcon}
                label="Account Name"
                value={rider.bankAccountName || 'N/A'}
              />
            </div>

            <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Financial Status</h4>
                <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100 shadow-sm">
                        <p className="text-[10px] font-bold text-green-600 uppercase">Earnings</p>
                        <p className="text-sm font-bold text-green-900">₦{rider.wallet?.earningsBalance?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm">
                        <p className="text-[10px] font-bold text-blue-600 uppercase">Deposit</p>
                        <p className="text-sm font-bold text-blue-900">₦{rider.wallet?.depositBalance?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 shadow-sm">
                        <p className="text-[10px] font-bold text-purple-600 uppercase">Rewards</p>
                        <p className="text-sm font-bold text-purple-900">₦{rider.wallet?.rewardBalance?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 shadow-sm">
                        <p className="text-[10px] font-bold text-orange-600 uppercase">Total Balance</p>
                        <p className="text-sm font-bold text-orange-900">₦{rider.wallet?.balance?.toLocaleString() || '0'}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t space-y-2">
                    <DetailItem icon={BanknotesIcon} label="Owed to Rider" value={`₦${rider.systemDebtToRider?.toLocaleString() || '0'}`} />
                    <DetailItem icon={ArrowPathIcon} label="Commission Owed" value={`₦${rider.weeklyCommissionOwed?.toLocaleString() || '0'}`} />
                </div>
            </div>
          </div>

          {/* Column 3: Performance & Status */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Performance Metrics</h4>
              <div className="flex items-center space-x-2 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                <StarIcon className="h-6 w-6 text-yellow-500 fill-current" />
                <div>
                    <span className="text-lg font-bold text-yellow-900">{rider.averageRating?.toFixed(1) || '0.0'}</span>
                    <span className="text-xs text-yellow-600 ml-1">Avg Rating ({rider.totalRatings} reviews)</span>
                </div>
              </div>
             
              <DetailItem
                icon={ArrowsPointingOutIcon}
                label="Search Radius"
                value={rider.searchRadiusKm ? `${rider.searchRadiusKm} km` : 'N/A'}
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Governance</h4>
              <DetailItem
                icon={ShieldCheckIcon}
                label="Profile Verified"
                value={rider.isVerified ? '✅ Yes' : '❌ No'}
              />
              <DetailItem
                icon={NoSymbolIcon}
                label="Payment Status"
                value={rider.paymentBlocked ? '⛔ Blocked' : '✅ Active'}
              />
              {rider.paymentBlocked && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs">
                    <p className="font-bold text-red-700">Block Details:</p>
                    <p className="text-red-600 mt-1">Reason: {rider.paymentBlockedReason || 'N/A'}</p>
                    <p className="text-red-500 mt-0.5">{new Date(rider.paymentBlockedAt).toLocaleString()}</p>
                </div>
              )}
              
              <div className={`p-4 rounded-xl border shadow-sm ${isBlocked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-tight text-gray-500">Overall Status</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isBlocked ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                        {isBlocked ? 'DEACTIVATED' : 'ACTIVE'}
                    </span>
                </div>
                <p className="text-xs font-medium text-gray-700">Last Seen: {lastSeenText}</p>
                {isBlocked && (
                     <div className="mt-3 pt-3 border-t border-red-100 text-xs text-red-700">
                        <p className="font-bold">Deactivation Reason:</p>
                        <p className="mt-1">{rider.accountDeactivatedReason || 'N/A'}</p>
                        <p className="text-red-400 mt-0.5">{new Date(rider.accountDeactivatedAt).toLocaleString()}</p>
                     </div>
                )}
              </div>
            </div>
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


import defaultIcon from '../assets/default_icon.png';
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
} from '@heroicons/react/24/outline';

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center space-x-3 text-sm">
    {Icon && <Icon className="h-5 w-5 text-gray-500" />}
    <span className="font-semibold text-gray-600">{label}:</span>
    <span className="text-gray-800">{value}</span>
  </div>
);

const RiderDetailsModal = ({ rider, onClose }) => {
  const formatVehicleType = (vehicleType) => {
    if (!vehicleType) return 'N/A';
    return vehicleType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!rider) return null;

  const lastSeenText = rider.lastSeen
    ? new Date(rider.lastSeen).toLocaleString()
    : 'N/A';

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white text-gray-800 rounded-2xl shadow-lg p-6 max-w-6xl w-full">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Rider Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <p>Close</p>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Profile & KYC */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <img
                src={rider.profilePicture || defaultIcon}
                alt={rider.fullName}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
              <div>
                <h3 className="text-xl font-bold">{rider.fullName}</h3>
                <p className="text-sm text-gray-500">{rider.email}</p>
                <div className={`flex items-center space-x-2 mt-1 ${rider.online ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-3 h-3 rounded-full ${rider.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{rider.online ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </div>
            <DetailItem icon={PhoneIcon} label="Phone" value={rider.phoneNumber} />
            <DetailItem icon={CreditCardIcon} label="NIN" value={rider.nin || 'N/A'} />
            <DetailItem label="Address" value={rider.address || 'N/A'} />
            <DetailItem
              icon={ShieldCheckIcon}
              label="NIN Verified"
              value={rider.ninVerified ? 'Yes' : 'No'}
            />
            <DetailItem
              icon={CreditCardIcon}
              label="License No."
              value={rider.driverLicenseNumber || 'N/A'}
            />
            <DetailItem
              icon={ShieldCheckIcon}
              label="License Verified"
              value={rider.driverLicenseVerified ? 'Yes' : 'No'}
            />
            {rider.driverLicensePicture && (
              <a
                href={rider.driverLicensePicture}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                View Driver's License
              </a>
            )}
          </div>

          {/* Column 2: Vehicle & Bank */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold border-b border-gray-200 pb-2">Vehicle</h4>
            <DetailItem icon={TruckIcon} label="Type" value={formatVehicleType(rider.vehicleType)} />
            <DetailItem icon={StarIcon} label="Preferred Service" value={rider.preferredService || 'N/A'} />
            {rider.vehiclePicture && (
              <a
                href={rider.vehiclePicture}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                View Vehicle Image
              </a>
            )}
            <h4 className="text-lg font-semibold border-b border-gray-200 pb-2 mt-6">Bank Details</h4>
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

          {/* Column 3: Performance & Status */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold border-b border-gray-200 pb-2">Performance</h4>
            <div className="flex items-center space-x-2">
              <StarIcon className="h-5 w-5 text-yellow-500" />
              <span>{rider.averageRating?.toFixed(1) || 'N/A'}</span>
              <span className="text-sm text-gray-500">({rider.totalRatings} ratings)</span>
            </div>
           
            <DetailItem
              icon={ArrowsPointingOutIcon}
              label="Search Radius"
              value={rider.searchRadiusKm ? `${rider.searchRadiusKm} km` : 'N/A'}
            />

            <h4 className="text-lg font-semibold border-b border-gray-200 pb-2 mt-6">Account Status</h4>
            <DetailItem
              icon={ShieldCheckIcon}
              label="Verified"
              value={rider.isVerified ? 'Yes' : 'No'}
            />
            <DetailItem
              icon={XCircleIcon}
              label="Payment Blocked"
              value={rider.paymentBlocked ? 'Yes' : 'No'}
            />
            {rider.paymentBlocked && (
              <>
                <DetailItem
                  label="Blocked At"
                  value={new Date(rider.paymentBlockedAt).toLocaleString()}
                />
                <DetailItem
                  label="Block Reason"
                  value={rider.paymentBlockedReason}
                />
              </>
            )}
            <DetailItem
              icon={XCircleIcon}
              label="Deactivated"
              value={rider.accountDeactivated ? 'Yes' : 'No'}
            />
            <DetailItem label="Last Seen" value={lastSeenText} />
            {rider.accountDeactivated && (
              <>
                <DetailItem
                  label="Deactivated At"
                  value={new Date(rider.accountDeactivatedAt).toLocaleString()}
                />
                <DetailItem
                  label="Deactivation Reason"
                  value={rider.accountDeactivatedReason}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderDetailsModal;

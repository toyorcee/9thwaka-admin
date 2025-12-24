import defaultIcon from '../assets/default_icon.png';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CreditCardIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center space-x-3 text-sm">
    {Icon && <Icon className="h-5 w-5 text-gray-500" />}
    <span className="font-semibold text-gray-600">{label}:</span>
    <span className="text-gray-800">{value}</span>
  </div>
);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount || 0);
};

const CustomerDetailsModal = ({ customer, onClose }) => {
  if (!customer) return null;

  const stats = customer.stats || {};
  const lastSeenText = customer.lastSeen
    ? new Date(customer.lastSeen).toLocaleString()
    : 'N/A';

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white text-gray-800 rounded-2xl shadow-lg p-6 max-w-4xl w-full">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Customer Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <p>Close</p>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <img
                src={customer.profilePicture || defaultIcon}
                alt={customer.fullName || customer.email}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
              <div>
                <h3 className="text-xl font-bold">{customer.fullName || 'N/A'}</h3>
                <p className="text-sm text-gray-500">{customer.email}</p>
                <div
                  className={`flex items-center space-x-2 mt-1 ${
                    customer.online ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      customer.online ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  ></div>
                  <span>{customer.online ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </div>
            <DetailItem icon={UserIcon} label="Name" value={customer.fullName || 'N/A'} />
            <DetailItem icon={EnvelopeIcon} label="Email" value={customer.email || 'N/A'} />
            <DetailItem icon={PhoneIcon} label="Phone" value={customer.phoneNumber || 'N/A'} />
            <DetailItem label="Address" value={customer.defaultAddress || 'N/A'} />
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold border-b border-gray-200 pb-2">
              Order Stats
            </h4>
            <DetailItem
              icon={CreditCardIcon}
              label="Total Orders"
              value={stats.totalOrders || 0}
            />
            <DetailItem
              icon={CreditCardIcon}
              label="Completed Orders"
              value={stats.completedOrders || 0}
            />
            <DetailItem
              icon={CreditCardIcon}
              label="Total Spent"
              value={formatCurrency(stats.totalSpent)}
            />

            <h4 className="text-lg font-semibold border-b border-gray-200 pb-2 mt-6">
              Account Status
            </h4>
            <DetailItem
              icon={XCircleIcon}
              label="Deactivated"
              value={customer.accountDeactivated ? 'Yes' : 'No'}
            />
            <DetailItem label="Last Seen" value={lastSeenText} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;

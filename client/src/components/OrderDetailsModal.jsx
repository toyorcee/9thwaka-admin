
import React, { useState, useEffect } from 'react';
import { getOrderDetails } from '../services/orderApi';
import {
  XMarkIcon,
  IdentificationIcon,
  UserIcon,
  TruckIcon,
  CubeIcon,
  BoltIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  MapPinIcon,
  ArchiveBoxIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const statusConfig = {
  pending: { icon: ClockIcon, color: 'text-yellow-400', label: 'Pending' },
  assigned: { icon: UserIcon, color: 'text-blue-400', label: 'Rider Assigned' },
  enroute: { icon: TruckIcon, color: 'text-blue-400', label: 'En-route to Pickup' },
  at_pickup: { icon: MapPinIcon, color: 'text-blue-400', label: 'At Pickup Location' },
  picked_up: { icon: ArchiveBoxIcon, color: 'text-blue-400', label: 'Picked Up' },
  enroute_dropoff: { icon: TruckIcon, color: 'text-blue-400', label: 'En-route to Dropoff' },
  at_dropoff: { icon: MapPinIcon, color: 'text-blue-400', label: 'At Dropoff Location' },
  delivered: { icon: CheckCircleIcon, color: 'text-green-400', label: 'Delivered' },
  cancelled: { icon: XCircleIcon, color: 'text-red-400', label: 'Cancelled' },
  declined: { icon: XCircleIcon, color: 'text-red-400', label: 'Declined' },
  accepted: { icon: ShieldCheckIcon, color: 'text-green-400', label: 'Accepted' },
};

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center space-x-3 text-sm">
    <Icon className="h-5 w-5 text-blue-300" />
    <span className="font-semibold text-gray-300">{label}:</span>
    <span className="text-white">{value}</span>
  </div>
);

const OrderDetailsModal = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      const fetchOrderDetails = async () => {
        try {
          setLoading(true);
          const response = await getOrderDetails(orderId);
          setOrder(response.order);
        } catch (error) {
          console.error('Failed to fetch order details:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchOrderDetails();
    }
  }, [orderId]);

  if (!orderId) return null;

  const renderTimeline = () => (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-white mb-3">Timeline</h3>
      <div className="relative border-l-2 border-blue-700 pl-6 space-y-6">
        {order.timeline?.map((event, index) => {
          const config = statusConfig[event.status] || { icon: ClockIcon, color: 'text-gray-400', label: event.status };
          const Icon = config.icon;
          return (
            <div key={index} className="relative flex items-start">
              <div className={`absolute -left-[34px] top-0.5 h-4 w-4 rounded-full bg-blue-800 border-2 ${config.color.replace('text-', 'border-')}`}></div>
              <Icon className={`h-5 w-5 mr-3 ${config.color}`} />
              <div>
                <p className={`font-semibold ${config.color}`}>{config.label}</p>
                <p className="text-xs text-gray-400">{new Date(event.at).toLocaleString()}</p>
                {event.note && <p className="text-sm text-gray-300 mt-1">{event.note}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#10173A] bg-opacity-70 flex justify-center items-center z-50 p-4">
      <div className="bg-[#10173A] text-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <ClockIcon className="h-12 w-12 text-blue-400 animate-spin" />
          </div>
        ) : order ? (
          <>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">Order Details</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <XMarkIcon className="h-7 w-7" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 p-4 bg-black bg-opacity-20 rounded-lg">
              <div className="space-y-3">
                <DetailItem icon={IdentificationIcon} label="Order ID" value={order.orderId} />
                <DetailItem icon={UserIcon} label="Customer" value={order.customerId?.fullName} />
                <DetailItem icon={TruckIcon} label="Rider" value={order.riderId?.fullName || 'N/A'} />
                <DetailItem icon={order.serviceType === 'courier' ? CubeIcon : BoltIcon} label="Service" value={order.serviceType} />
              </div>
              <div className="space-y-3">
                <DetailItem icon={MapPinIcon} label="Pickup" value={order.pickup?.address} />
                <DetailItem icon={MapPinIcon} label="Dropoff" value={order.dropoff?.address} />
                <DetailItem icon={ArchiveBoxIcon} label="Items" value={Array.isArray(order.items) ? order.items.join(', ') : order.items || 'N/A'} />
                <DetailItem icon={CalendarIcon} label="Date" value={new Date(order.createdAt).toLocaleString()} />
              </div>
            </div>

            <div className="flex items-center justify-between bg-black bg-opacity-20 p-4 rounded-lg mb-6">
                <div className="flex items-center space-x-3">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
                    <span className="font-semibold text-gray-300">Price:</span>
                    <span className="text-xl font-bold text-green-400">₦{order.price.toLocaleString()}</span>
                </div>
                {(() => {
                    const config = statusConfig[order.status] || {};
                    const Icon = config.icon || ClockIcon;
                    return (
                        <div className="flex items-center space-x-3">
                            <Icon className={`h-6 w-6 ${config.color || 'text-gray-400'}`} />
                            <span className="font-semibold text-gray-300">Status:</span>
                            <span className={`text-lg font-bold ${config.color || 'text-gray-400'}`}>{config.label || order.status}</span>
                        </div>
                    );
                })()}
            </div>

            {order.priceNegotiation?.status !== 'none' && (
              <div className="mt-4 p-4 bg-black bg-opacity-20 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Price Negotiation</h3>
                <p><strong>Status:</strong> {order.priceNegotiation.status}</p>
                <p><strong>Requested Price:</strong> ₦{order.riderRequestedPrice?.toLocaleString()}</p>
              </div>
            )}

            {renderTimeline()}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <XCircleIcon className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-xl text-red-400">Failed to load order details.</p>
            <p className="text-gray-400">Please try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsModal;

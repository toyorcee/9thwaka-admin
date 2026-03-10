
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
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const statusConfig = {
  pending: { icon: ClockIcon, color: 'text-yellow-500', label: 'Pending' },
  assigned: { icon: UserIcon, color: 'text-blue-500', label: 'Rider Assigned' },
  enroute: { icon: TruckIcon, color: 'text-blue-500', label: 'En-route to Pickup' },
  at_pickup: { icon: MapPinIcon, color: 'text-blue-500', label: 'At Pickup Location' },
  picked_up: { icon: ArchiveBoxIcon, color: 'text-blue-500', label: 'Picked Up' },
  enroute_dropoff: { icon: TruckIcon, color: 'text-blue-500', label: 'En-route to Dropoff' },
  at_dropoff: { icon: MapPinIcon, color: 'text-blue-500', label: 'At Dropoff Location' },
  delivered: { icon: CheckCircleIcon, color: 'text-green-500', label: 'Delivered' },
  cancelled: { icon: XCircleIcon, color: 'text-red-500', label: 'Cancelled' },
  declined: { icon: XCircleIcon, color: 'text-red-500', label: 'Declined' },
  accepted: { icon: ShieldCheckIcon, color: 'text-green-500', label: 'Accepted' },
};

const DetailItem = ({ icon: Icon, label, value, color = "text-gray-500" }) => (
  <div className="flex items-center space-x-3 text-sm p-2 rounded-lg hover:bg-white transition-colors">
    <div className={`p-1.5 rounded-md bg-gray-100 ${color}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
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
    <div className="mt-8">
      <div className="flex items-center space-x-2 mb-4">
        <div className="h-1.5 w-1.5 rounded-full bg-accent-blue"></div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Order Timeline</h3>
      </div>
      <div className="relative border-l border-gray-100 ml-3 pl-8 space-y-6">
        {order.timeline?.map((event, index) => {
          const config = statusConfig[event.status] || { icon: ClockIcon, color: 'text-gray-400', label: event.status };
          const Icon = config.icon;
          return (
            <div key={index} className="relative">
              <div className={`absolute -left-[41px] top-0 h-6 w-6 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center z-10`}>
                <div className={`h-2 w-2 rounded-full ${config.color.replace('text-', 'bg-')}`}></div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                   <p className={`text-sm font-bold ${config.color}`}>{config.label}</p>
                   <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                      {new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">{new Date(event.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                {event.note && (
                   <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-md border-l-2 border-gray-200">
                      {event.note}
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white text-gray-800 rounded-3xl shadow-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-96 space-y-4">
            <div className="h-12 w-12 border-4 border-gray-100 border-t-accent-blue rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-gray-400 animate-pulse">Loading secure order details...</p>
          </div>
        ) : order ? (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-black text-accent-blue uppercase tracking-[0.2em]">Transaction Record</span>
                <h2 className="text-2xl font-black text-gray-900 mt-1">Order Summary</h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                title="Close"
              >
                <XMarkIcon className="h-6 w-6 text-gray-400 group-hover:text-gray-900" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 space-y-1">
                  <DetailItem icon={IdentificationIcon} label="Reference Number" value={order.orderId} color="text-blue-500" />
                  <DetailItem icon={UserIcon} label="Customer Name" value={order.customerId?.fullName} color="text-indigo-500" />
                  <DetailItem icon={TruckIcon} label="Assigned Rider" value={order.riderId?.fullName || '-- Not Assigned --'} color="text-orange-500" />
                  <DetailItem 
                    icon={order.serviceType === 'ride' ? BoltIcon : CubeIcon} 
                    label="Service Portfolio" 
                    value={order.serviceType?.toUpperCase()} 
                    color={order.serviceType === 'ride' ? "text-yellow-600" : "text-cyan-600"} 
                  />
                  {order.serviceType === 'ride' && (
                    <DetailItem icon={UserIcon} label="Passenger Count" value={`${order.passengers || 1} Person(s)`} color="text-violet-500" />
                  )}
                   {order.preferredVehicleType && (
                    <DetailItem 
                      icon={TruckIcon} 
                      label="Vehicle Configuration" 
                      value={order.preferredVehicleType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} 
                      color="text-emerald-500"
                    />
                  )}
                </div>

                <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 space-y-1">
                  <DetailItem icon={MapPinIcon} label="Pickup Origin" value={order.pickup?.address} color="text-rose-500" />
                  <DetailItem icon={MapPinIcon} label="Dropoff Destination" value={order.dropoff?.address} color="text-emerald-500" />
                  <DetailItem icon={ArchiveBoxIcon} label="Load Description" value={order.items || 'General Goods'} color="text-gray-500" />
                  {order.packageCategory && (
                    <DetailItem icon={CubeIcon} label="Package Category" value={order.packageCategory.toUpperCase()} color="text-amber-600" />
                  )}
                  <DetailItem icon={CalendarIcon} label="Request Received" value={new Date(order.createdAt).toLocaleString()} color="text-gray-400" />
                </div>
              </div>

              <div>
                {/* Visual Status Header */}
                <div className="mb-6">
                   {(() => {
                        const config = statusConfig[order.status] || { label: order.status, color: 'text-gray-500', icon: ClockIcon };
                        const Icon = config.icon;
                        return (
                          <div className={`flex items-center justify-between p-4 rounded-2xl border ${config.color.replace('text-', 'bg-').replace('-500', '-50')} ${config.color.replace('text-', 'border-').replace('-500', '-100')}`}>
                             <div className="flex items-center space-x-4">
                               <div className={`p-3 rounded-xl bg-white shadow-sm ${config.color}`}>
                                  <Icon className="h-6 w-6" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Current Status</p>
                                  <p className={`text-lg font-black ${config.color}`}>{config.label}</p>
                               </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Settlement Amount</p>
                                <p className="text-2xl font-black text-gray-900">₦{order.price.toLocaleString()}</p>
                             </div>
                          </div>
                        );
                    })()}
                </div>

            {/* Financial Audit Section */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between border-b md:border-b-0 md:border-r border-blue-200 pb-3 md:pb-0 md:pr-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Marketing Cap</p>
                            <p className="text-sm font-bold text-blue-900">₦{order.financial?.maxBenefitAllowed?.toLocaleString() || '0'}</p>
                        </div>
                    </div>
                    <div className="text-[10px] text-blue-500 font-medium max-w-[120px] text-right">
                        Max subsidy allowed for this order
                    </div>
                </div>
                <div className="flex items-center justify-between pl-0 md:pl-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <BanknotesIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Rider Payout</p>
                            <p className="text-sm font-bold text-indigo-900">₦{order.financial?.riderNetAmount?.toLocaleString() || '0'}</p>
                        </div>
                    </div>
                     <div className="text-[10px] text-indigo-500 font-medium max-w-[120px] text-right">
                        Net amount credited to rider wallet
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex items-center space-x-3">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                    <span className="font-semibold text-gray-600">Price:</span>
                    <span className="text-xl font-bold text-green-600">₦{order.price.toLocaleString()}</span>
                </div>
                {(() => {
                    const config = statusConfig[order.status] || {};
                    const Icon = config.icon || ClockIcon;
                    return (
                        <div className="flex items-center space-x-3">
                            <Icon className={`h-6 w-6 ${config.color || 'text-gray-500'}`} />
                            <span className="font-semibold text-gray-600">Status:</span>
                            <span className={`text-lg font-bold ${config.color || 'text-gray-500'}`}>{config.label || order.status}</span>
                        </div>
                    );
                })()}
            </div>

            {order.priceNegotiation?.status !== 'none' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Price Negotiation</h3>
                <p><strong>Status:</strong> {order.priceNegotiation.status}</p>
                <p><strong>Requested Price:</strong> ₦{order.riderRequestedPrice?.toLocaleString()}</p>
              </div>
            )}

            {order.pricingSnapshot && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-600 mr-2" />
                  Pricing Snapshot (At Order Time)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {order.pricingSnapshot.trafficMultiplier && (
                    <div className="bg-white p-3 rounded">
                      <p className="text-gray-600 font-semibold">Traffic Multiplier</p>
                      <p className="text-gray-800 text-lg font-bold">
                        {order.pricingSnapshot.trafficMultiplier.toFixed(2)}x
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Traffic conditions at order time
                      </p>
                    </div>
                  )}
                  {order.pricingSnapshot.demandMultiplier && (
                    <div className="bg-white p-3 rounded">
                      <p className="text-gray-600 font-semibold">Demand Multiplier</p>
                      <p className="text-gray-800 text-lg font-bold">
                        {order.pricingSnapshot.demandMultiplier.toFixed(2)}x
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Rider availability at order time
                      </p>
                    </div>
                  )}
                  {order.pricingSnapshot.vehicleMultiplier && (
                    <div className="bg-white p-3 rounded">
                      <p className="text-gray-600 font-semibold">Vehicle Multiplier</p>
                      <p className="text-gray-800 text-lg font-bold">
                        {order.pricingSnapshot.vehicleMultiplier.toFixed(2)}x
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.vehicleType || 'Standard'} vehicle
                      </p>
                    </div>
                  )}
                  {order.pricingSnapshot.finalMultiplier && (
                    <div className="bg-white p-3 rounded border-2 border-blue-300">
                      <p className="text-blue-600 font-semibold">Final Multiplier</p>
                      <p className="text-blue-800 text-lg font-bold">
                        {order.pricingSnapshot.finalMultiplier.toFixed(2)}x
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Combined effect on base price
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {renderTimeline()}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <XCircleIcon className="h-12 w-12 text-red-600 mb-4" />
            <p className="text-xl text-red-600">Failed to load order details.</p>
            <p className="text-gray-500">Please try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsModal;

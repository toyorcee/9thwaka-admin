import { useState, useEffect } from 'react';
import api from '../services/api';
import StatusDropdown from '../components/StatusDropdown';
import ServiceTypeDropdown from '../components/ServiceTypeDropdown';
import VehicleTypeDropdown from '../components/VehicleTypeDropdown';
import PackageCategoryDropdown from '../components/PackageCategoryDropdown';
import OrderDetailsModal from '../components/OrderDetailsModal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    serviceType: '',
    preferredVehicleType: '',
    packageCategory: '',
    passengers: '',
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const params = { ...filters };
        Object.keys(params).forEach(key => {
          if (params[key] === '') delete params[key];
        });
        
        const { data } = await api.get('/admin/orders', { params });
        setOrders(data.orders);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  const handleStatusChange = (status) => {
    setFilters({ ...filters, status, page: 1 });
  };

  const handleServiceTypeChange = (serviceType) => {
    setFilters({ ...filters, serviceType, page: 1, packageCategory: '', passengers: '' });
  };

  const handleVehicleTypeChange = (preferredVehicleType) => {
    setFilters({ ...filters, preferredVehicleType, page: 1 });
  };

  const handleCategoryChange = (packageCategory) => {
    setFilters({ ...filters, packageCategory, page: 1 });
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order._id);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-6 h-full bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1 text-sm">Monitor and manage all system bookings.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              name="search"
              placeholder="Search ID, Customer, Address..."
              value={filters.search}
              onChange={handleFilterChange}
              className="w-full bg-gray-50 text-gray-800 pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:bg-white transition-all text-sm"
            />
            <div className="absolute left-3 top-3 text-gray-400">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
               </svg>
            </div>
          </div>
          <StatusDropdown selectedStatus={filters.status} onStatusChange={handleStatusChange} />
          <ServiceTypeDropdown selectedService={filters.serviceType} onServiceChange={handleServiceTypeChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
          <VehicleTypeDropdown selectedVehicle={filters.preferredVehicleType} onVehicleChange={handleVehicleTypeChange} />
          
          {filters.serviceType === 'courier' && (
            <PackageCategoryDropdown selectedCategory={filters.packageCategory} onCategoryChange={handleCategoryChange} />
          )}

          {filters.serviceType === 'ride' && (
             <div className="relative">
              <input
                type="number"
                name="passengers"
                min="1"
                placeholder="Min Passengers"
                value={filters.passengers}
                onChange={handleFilterChange}
                className="w-full bg-gray-50 text-gray-800 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:bg-white transition-all text-sm"
              />
            </div>
          )}

          <button 
            onClick={() => setFilters({ page: 1, limit: 10, search: '', status: '', serviceType: '', preferredVehicleType: '', packageCategory: '', passengers: '' })}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center h-full"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Order ID</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Customer</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Rider</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Service</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Status</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Price</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Date</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td className="py-6 px-4" colSpan={8}>
                  <EmptyState
                    type="orders"
                    title="No orders yet"
                    description="As customers start placing orders, they will appear in this table for you to track and manage."
                  />
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-800">{order.orderId}</td>
                  <td className="py-3 px-4 text-gray-800">{order.customerId?.fullName}</td>
                  <td className="py-3 px-4 text-gray-800">{order.riderId?.fullName || 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-800">{order.serviceType}</td>
                  <td className="py-3 px-4 text-gray-800">{order.status}</td>
                  <td className="py-3 px-4 text-gray-800">₦{order.price.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-800">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-center text-gray-800">
        <div>
          <p>
            Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
            disabled={!pagination.hasPrevPage}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
            disabled={!pagination.hasNextPage}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg ml-2 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
      <OrderDetailsModal orderId={selectedOrder} onClose={handleCloseModal} />
    </div>
  );
};

export default Orders;

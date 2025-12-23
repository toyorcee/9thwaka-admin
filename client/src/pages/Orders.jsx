import { useState, useEffect } from 'react';
import api from '../services/api';
import StatusDropdown from '../components/StatusDropdown';
import ServiceTypeDropdown from '../components/ServiceTypeDropdown';
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
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/admin/orders', { params: filters });
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
    setFilters({ ...filters, serviceType, page: 1 });
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
    <div className="p-6 h-full">
      <h1 className="text-2xl font-bold mb-1 text-gray-800">Orders</h1>
      <p className="text-gray-600 mb-6">Track and manage all customer orders.</p>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          name="search"
          placeholder="Search by keyword..."
          value={filters.search}
          onChange={handleFilterChange}
          className="bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
        <StatusDropdown selectedStatus={filters.status} onStatusChange={handleStatusChange} />
        <ServiceTypeDropdown selectedService={filters.serviceType} onServiceChange={handleServiceTypeChange} />
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

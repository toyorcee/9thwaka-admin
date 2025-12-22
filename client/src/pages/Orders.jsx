import  { useState, useEffect } from 'react';
import api from '../services/api';
import StatusDropdown from '../components/StatusDropdown';
import ServiceTypeDropdown from '../components/ServiceTypeDropdown';
import OrderDetailsModal from '../components/OrderDetailsModal';
import Loader from '../components/Loader';

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
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Orders</h1>
      <p className="text-gray-400 mb-8">Track and manage all customer orders.</p>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          name="search"
          placeholder="Search by keyword..."
          value={filters.search}
          onChange={handleFilterChange}
          className="bg-gray-700 text-white rounded-md p-2"
        />
        <StatusDropdown selectedStatus={filters.status} onStatusChange={handleStatusChange} />
        <ServiceTypeDropdown selectedService={filters.serviceType} onServiceChange={handleServiceTypeChange} />
      </div>

      <div className="bg-nav-dark rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full text-white">
          <thead>
            <tr className="bg-nav-light">
              <th className="p-4 text-left">Order ID</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-left">Rider</th>
              <th className="p-4 text-left">Service</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Price</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-b border-nav-light">
                <td className="p-4">{order.orderId}</td>
                <td className="p-4">{order.customerId?.fullName}</td>
                <td className="p-4">{order.riderId?.fullName || 'N/A'}</td>
                <td className="p-4">{order.serviceType}</td>
                <td className="p-4">{order.status}</td>
                <td className="p-4">₦{order.price.toLocaleString()}</td>
                <td className="p-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <button onClick={() => handleViewOrder(order)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center text-white">
        <div>
          <p>
            Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
            disabled={!pagination.hasPrevPage}
            className="bg-nav-light rounded-md p-2 mr-2 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
            disabled={!pagination.hasNextPage}
            className="bg-nav-light rounded-md p-2 disabled:opacity-50"
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

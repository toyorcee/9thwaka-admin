import React, { useState, useEffect } from 'react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { getAllCustomers, getUserPresence } from '../services/adminApi';
import CustomerDetailsModal from '../components/CustomerDetailsModal';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await getAllCustomers(filters);
        const baseCustomers = response.customers || [];
        setPagination(response.pagination || {});

        const customersWithPresence = await Promise.all(
          baseCustomers.map(async (customer) => {
            try {
              const presenceResponse = await getUserPresence(customer._id);
              const presence = presenceResponse?.presence || {};
              const online = !!presence.online;
              const lastSeen = presence.lastSeen || null;
              return { ...customer, online, lastSeen };
            } catch {
              return { ...customer, online: false, lastSeen: null };
            }
          })
        );

        setCustomers(customersWithPresence);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleCloseModal = () => {
    setSelectedCustomer(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  return (
    <div className="p-6 h-full">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Customers</h1>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          name="search"
          placeholder="Search by name, email, or phone"
          value={filters.search}
          onChange={handleFilterChange}
          className="bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
      </div>

      {loading ? (
        <Loader />
      ) : customers.length === 0 ? (
        <EmptyState
          type="customers"
          title="No customers yet"
          description="Once people start placing orders on your platform, their customer profiles will appear here."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Name</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Email</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Phone</th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">Total Orders</th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">Completed Orders</th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">Total Spent</th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">Status</th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const stats = customer.stats || {};
                return (
                  <tr key={customer._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{customer.fullName || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-800">{customer.email}</td>
                    <td className="py-3 px-4 text-gray-800">{customer.phoneNumber}</td>
                    <td className="py-3 px-4 text-center text-gray-800">{stats.totalOrders || 0}</td>
                    <td className="py-3 px-4 text-center text-gray-800">{stats.completedOrders || 0}</td>
                    <td className="py-3 px-4 text-right text-gray-800">{formatCurrency(stats.totalSpent)}</td>
                    <td className="py-3 px-4 text-center text-gray-800">
                      {customer.accountDeactivated ? (
                        <span className="text-red-500">Deactivated</span>
                      ) : customer.online ? (
                        <span className="text-green-500">Online</span>
                      ) : (
                        <span className="text-red-500">Offline</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(customer)}
                        className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 mb-6 flex justify-between items-center text-gray-800">
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
      <CustomerDetailsModal customer={selectedCustomer} onClose={handleCloseModal} />
    </div>
  );
};

export default Customers;

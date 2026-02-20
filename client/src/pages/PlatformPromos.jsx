import React, { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { getAdminPlatformPromos } from '../services/adminApi';

const PlatformPromos = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalDocs: 0,
  });
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAdminPlatformPromos({
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch,
        });

        if (!response || response.success === false) {
          throw new Error(response?.error || 'Failed to fetch Platform Promo usage.');
        }

        setItems(response.items || []);
        setPagination((prev) => ({
          ...prev,
          page: response.pagination?.page || prev.page,
          limit: response.pagination?.limit || prev.limit,
          totalPages: response.pagination?.totalPages || prev.totalPages,
          totalDocs: response.pagination?.totalDocs || prev.totalDocs,
        }));
        setStats(response.stats || null);
      } catch (e) {
        setError(e.message || 'Failed to fetch Platform Promo usage.');
        console.error('Failed to fetch Platform Promo usage:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pagination.page, pagination.limit, debouncedSearch]);

  const handleChangePage = (direction) => {
    setPagination((prev) => {
      const nextPage = direction === 'next' ? prev.page + 1 : prev.page - 1;
      if (nextPage < 1 || nextPage > prev.totalPages) {
        return prev;
      }
      return { ...prev, page: nextPage };
    });
  };

  const handleSearchChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      search: e.target.value,
    }));
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Discounts Given</p>
          <div className="flex justify-between items-end">
             <p className="text-2xl font-semibold text-gray-800">
              ₦{stats.totalDiscounted?.toLocaleString() ?? 0}
            </p>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Platform Cost
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Usage Count</p>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-semibold text-gray-800">
              {stats.usageCount?.toLocaleString() ?? 0}
            </p>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
               Orders
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Current Configuration</p>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-semibold text-gray-800">
              {stats.config?.discountPercent ?? 0}% Off
            </p>
             <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
               Min: ₦{stats.config?.minTripValue?.toLocaleString() ?? 0}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (!items || items.length === 0) {
      return (
         <EmptyState
          type="generic"
          title="No promo usage found"
          description="Orders that benefit from the platform-wide promo will appear here."
        />
      );
    }

    return (
      <>
        <div className="overflow-x-auto rounded-lg shadow-sm">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer Context
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">{item.orderId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.customerName}</div>
                      <div className="text-xs text-gray-500">{item.customerEmail}</div>
                      <div className="text-xs text-gray-400">{item.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-700">
                        <span className="font-semibold">Total Trips:</span> {item.customerTrips}
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold">Joined:</span> {new Date(item.customerJoined).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">#{item.orderId}</div>
                      <div className="text-xs text-gray-500">
                        Original: ₦{item.originalPrice.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        -₦{item.discountAmount.toLocaleString()}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        Final: ₦{item.finalPrice.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.usedAt).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {new Date(item.usedAt).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>

        <div className="mt-6 mb-6 flex justify-between items-center text-gray-800">
          <div>
            <p className="text-sm">
              Page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.totalPages}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total records: {pagination.totalDocs}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleChangePage('prev')}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => handleChangePage('next')}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </>
    );
  };

  if (loading && !items.length) {
    return <Loader />;
  }

  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Platform-wide Promos</h1>
        <p className="text-gray-600 mt-1">Monitor the impact of seasonal and platform-wide discounts.</p>
      </div>

      {error && <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>}

      {renderStats()}

      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-6 space-y-4 md:space-y-0 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Usage History</h3>
        
        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search Order ID..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {renderTable()}
    </div>
  );
};

export default PlatformPromos;

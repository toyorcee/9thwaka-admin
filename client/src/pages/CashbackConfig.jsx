import React, { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { getAdminCashbackUsers } from '../services/adminApi';

const CashbackConfig = () => {
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
    status: 'all',
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

        const response = await getAdminCashbackUsers({
          page: pagination.page,
          limit: pagination.limit,
          status: filters.status,
          search: debouncedSearch,
        });

        if (!response || response.success === false) {
          throw new Error(response?.error || 'Failed to fetch Cashback users.');
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
        setError(e.message || 'Failed to fetch Cashback users.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pagination.page, pagination.limit, filters.status, debouncedSearch]);

  const handleChangePage = (direction) => {
    setPagination((prev) => {
      const nextPage = direction === 'next' ? prev.page + 1 : prev.page - 1;
      if (nextPage < 1 || nextPage > prev.totalPages) {
        return prev;
      }
      return { ...prev, page: nextPage };
    });
  };

  const handleStatusFilterChange = (status) => {
    setFilters((prev) => ({
      ...prev,
      status,
    }));
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500 font-medium">Total Earners</p>
            <div className="flex justify-between items-end">
               <p className="text-2xl font-bold text-gray-800">
                {stats.totalEarners ?? 0}
              </p>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Customers who earned
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 font-medium">Total Cashback Dispensed</p>
            <div className="flex justify-between items-end">
               <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.totalCashbackAmount ?? 0)}
              </p>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Lifetime Value
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500 font-medium">Active Configuration</p>
            <div className="flex justify-between items-end">
              <p className="text-2xl font-bold text-gray-800">
                {stats.config?.percent ?? 0}%
              </p>
               <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                 Min Trip: ₦{(stats.config?.minTripValue ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Configuration Alert */}
        {stats.config && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-3">
                    <div className="bg-indigo-100 p-1.5 rounded-md mr-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-indigo-900">Current Cashback Limits & Rules</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/50 p-2 rounded border border-indigo-50">
                        <span className="block text-[10px] text-indigo-400 uppercase font-black tracking-widest">Customer Weekly Cap</span>
                        <span className="text-sm font-bold text-indigo-700 font-mono">₦{(stats.config.maxPerWeekCustomer || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-white/50 p-2 rounded border border-indigo-50">
                        <span className="block text-[10px] text-indigo-400 uppercase font-black tracking-widest">Rider Weekly Cap</span>
                        <span className="text-sm font-bold text-indigo-700 font-mono">₦{(stats.config.maxPerWeekRider || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-white/50 p-2 rounded border border-indigo-50">
                        <span className="block text-[10px] text-indigo-400 uppercase font-black tracking-widest">Reward Expiry</span>
                        <span className="text-sm font-bold text-indigo-700">{stats.config.rewardExpiryDays || 30} Days</span>
                    </div>
                    <div className="bg-white/50 p-2 rounded border border-indigo-50">
                        <span className="block text-[10px] text-indigo-400 uppercase font-black tracking-widest">Global Status</span>
                        <span className={`text-sm font-bold ${stats.config.enabled ? 'text-green-600' : 'text-red-500'}`}>
                            {stats.config.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                    </div>
                </div>
            </div>
        )}
      </>
    );
  };

  const renderTable = () => {
    if (!items || items.length === 0) {
      return (
         <EmptyState
          type="generic"
          title="No users found"
          description="Customers who participate in the Cashback promo will appear here."
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
                  User
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Cashback Earned
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr
                  key={item.userId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{item.fullName || 'N/A'}</span>
                      <span className="text-xs text-gray-500">{item.email}</span>
                      {item.phoneNumber && <span className="text-xs text-gray-500">{item.phoneNumber}</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-center text-sm text-gray-500">
                    {new Date(item.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                    {formatCurrency(item.earned)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'Earned' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                        {item.status}
                    </span>
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
              Total users: {pagination.totalDocs}
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
        <h1 className="text-2xl font-bold text-gray-800">Cashback Program Insights</h1>
        <p className="text-gray-600 mt-1">Track customers who have benefited from cashback savings.</p>
      </div>

      {error && <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>}

      {renderStats()}

      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-6 space-y-4 md:space-y-0 border border-gray-200">
        
        {/* Filters */}
        <div className="flex items-center space-x-4">
           <span className="text-sm font-medium text-gray-700">Filter Status:</span>
          <select
            value={filters.status}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="all">All Users</option>
            <option value="earned">Earned Cashback</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search name, email..."
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

export default CashbackConfig;

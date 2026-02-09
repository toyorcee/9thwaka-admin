import React, { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { getAdminGoldStatusUsers } from '../services/adminApi';

const formatDuration = (totalSeconds) => {
  if (!totalSeconds || totalSeconds <= 0) {
    return 'Expired';
  }

  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${hours.toString().padStart(2, '0')}h`);
  parts.push(`${minutes.toString().padStart(2, '0')}m`);
  parts.push(`${seconds.toString().padStart(2, '0')}s`);

  return parts.join(' ');
};

const GoldStatus = () => {
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
    goldType: 'all',
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
    let intervalId;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAdminGoldStatusUsers({
          page: pagination.page,
          limit: pagination.limit,
          status: filters.status,
          goldType: filters.goldType,
          search: debouncedSearch,
        });

        if (!response || response.success === false) {
          throw new Error(response?.error || 'Failed to fetch Gold Status users.');
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
        setError(e.message || 'Failed to fetch Gold Status users.');
        console.error('Failed to fetch Gold Status users:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    intervalId = setInterval(() => {
      setItems((prevItems) =>
        prevItems.map((item) => {
          const newItem = { ...item };
          
          if (newItem.customerGold) {
            if (!newItem.customerGold.isActive || !newItem.customerGold.remainingSeconds || newItem.customerGold.remainingSeconds <= 0) {
              newItem.customerGold.remainingSeconds = 0;
            } else {
              newItem.customerGold.remainingSeconds -= 1;
            }
          }

          if (newItem.riderGold) {
            if (!newItem.riderGold.isActive || !newItem.riderGold.remainingSeconds || newItem.riderGold.remainingSeconds <= 0) {
              newItem.riderGold.remainingSeconds = 0;
            } else {
              newItem.riderGold.remainingSeconds -= 1;
            }
          }
          
          return newItem;
        })
      );
    }, 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pagination.page, pagination.limit, filters.status, filters.goldType, debouncedSearch]);

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

  const handleGoldTypeChange = (goldType) => {
    setFilters((prev) => ({
      ...prev,
      goldType,
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

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Active Customer Gold</p>
          <div className="flex justify-between items-end">
             <p className="text-2xl font-semibold text-gray-800">
              {stats.activeCustomerGoldCount ?? 0}
            </p>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {stats.customerGoldConfig?.discountPercent ?? 5}% Off
            </span>
          </div>
         
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">Active Rider Gold</p>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-semibold text-gray-800">
              {stats.activeRiderGoldCount ?? 0}
            </p>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
               {stats.riderGoldConfig?.discountPercent ?? 25}% Off
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Required Trips (Cust)</p>
          <p className="text-2xl font-semibold text-gray-800">
            {stats.customerGoldConfig?.requiredTrips ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Required Deliveries (Rider)</p>
          <p className="text-2xl font-semibold text-gray-800">
            {stats.riderGoldConfig?.requiredDeliveries ?? 0}
          </p>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (!items || items.length === 0) {
      return (
        <EmptyState
          type="generic"
          title="No Gold Status users found"
          description="Users who unlock Gold Status will appear here."
        />
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                  User
                </th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                  Role
                </th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                  Customer Gold
                </th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                  Rider Gold
                </th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                  Unlocks
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.userId}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-gray-800">
                    <div className="flex flex-col">
                      <span className="font-semibold">{item.fullName}</span>
                      <span className="text-xs text-gray-500">{item.email}</span>
                      {item.phoneNumber && <span className="text-xs text-gray-500">{item.phoneNumber}</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-800 capitalize">
                    {item.role}
                  </td>
                  
                  {/* Customer Gold Column */}
                  <td className="py-3 px-4 text-center">
                    {item.customerGold && item.customerGold.isActive ? (
                      <div className="flex flex-col items-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-1">
                          Active ({item.customerGold.discountPercent}%)
                        </span>
                        <span className="font-mono text-xs text-gray-600">
                          {formatDuration(item.customerGold.remainingSeconds)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>

                  {/* Rider Gold Column */}
                  <td className="py-3 px-4 text-center">
                    {item.riderGold && item.riderGold.isActive ? (
                      <div className="flex flex-col items-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 mb-1">
                          Active ({item.riderGold.discountPercent}%)
                        </span>
                        <span className="font-mono text-xs text-gray-600">
                          {formatDuration(item.riderGold.remainingSeconds)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>

                  {/* Unlocks Stats */}
                  <td className="py-3 px-4 text-center text-sm text-gray-800">
                    <div className="flex flex-col space-y-1">
                      {item.customerGold && item.customerGold.totalUnlocks > 0 && (
                         <span className="text-xs">Cust: {item.customerGold.totalUnlocks}</span>
                      )}
                      {item.riderGold && item.riderGold.totalUnlocks > 0 && (
                         <span className="text-xs">Rider: {item.riderGold.totalUnlocks}</span>
                      )}
                      {(!item.customerGold?.totalUnlocks && !item.riderGold?.totalUnlocks) && (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 mb-6 flex justify-between items-center text-gray-800">
          <div>
            <p>
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <p className="text-sm text-gray-500">
              Total users: {pagination.totalDocs}
            </p>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => handleChangePage('prev')}
              disabled={pagination.page <= 1}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => handleChangePage('next')}
              disabled={pagination.page >= pagination.totalPages}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg ml-2 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <h1 className="text-2xl font-bold mb-4 text-gray-800">High-Value (Gold) Users</h1>
      <p className="text-gray-600 mb-6">Track your most valuable customers and riders who have unlocked Gold Status rewards.</p>

      {error && <p className="mb-4 text-red-500">{error}</p>}

      {renderStats()}

      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-6 space-y-4 md:space-y-0">
        
        {/* Filters */}
        <div className="flex space-x-2">
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              type="button"
              onClick={() => handleGoldTypeChange('all')}
              className={`px-4 py-2 text-sm font-medium ${
                filters.goldType === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => handleGoldTypeChange('customer')}
              className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${
                filters.goldType === 'customer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Customer Gold
            </button>
            <button
              type="button"
              onClick={() => handleGoldTypeChange('rider')}
              className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${
                filters.goldType === 'rider'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Rider Gold
            </button>
          </div>

          <select
            value={filters.status}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search name or email..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
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

export default GoldStatus;

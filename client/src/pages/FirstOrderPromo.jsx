
import React, { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { getAdminFirstOrderUsers } from '../services/adminApi';

const FirstOrderPromo = () => {
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

        const response = await getAdminFirstOrderUsers({
          page: pagination.page,
          limit: pagination.limit,
          status: filters.status,
          search: debouncedSearch,
        });

        if (!response || response.success === false) {
          throw new Error(response?.error || 'Failed to fetch First Order Promo users.');
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
        setError(e.message || 'Failed to fetch First Order Promo users.');
        console.error('Failed to fetch First Order Promo users:', e);
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

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Active Likely Users</p>
          <div className="flex justify-between items-end">
             <p className="text-2xl font-semibold text-gray-800">
              {stats.activeCount ?? 0}
            </p>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Total Eligible
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Completed Users</p>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-semibold text-gray-800">
              {stats.completedCount ?? 0}
            </p>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
               Reflects Limit Reached
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Current Limit Config</p>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-semibold text-gray-800">
              {stats.config?.limitCount ?? 3} Orders
            </p>
             <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
               ₦{stats.config?.discountAmount ?? 0} Off
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
          title="No users found"
          description="Users participating in the First Order promo will appear here."
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
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Orders Completed
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Progress
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
                  <td className="py-3 px-4 whitespace-nowrap capitalize text-sm text-gray-700">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.role === 'rider' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                        {item.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-center text-sm text-gray-500">
                    {new Date(item.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                    {item.completedCount} / {item.limitCount}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap align-middle">
                     <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-200 max-w-[100px] mx-auto">
                        <div 
                            className={`bg-blue-600 h-2.5 rounded-full ${item.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                            style={{ width: `${item.progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-center mt-1 text-gray-500">{item.progress}%</p>
                  </td>
                   <td className="py-3 px-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'Completed' 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-green-100 text-green-800'
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
        <h1 className="text-2xl font-bold text-gray-800">First Order / New Joiner Promo</h1>
        <p className="text-gray-600 mt-1">Track new users and their progress towards the First Order discount limit.</p>
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
            <option value="active">Active (Eligible)</option>
            <option value="completed">Completed Limit</option>
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

export default FirstOrderPromo;

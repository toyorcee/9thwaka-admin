import React, { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { getAdminStreakUsers } from '../services/adminApi';

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const StreakBonuses = () => {
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
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAdminStreakUsers({
          page: pagination.page,
          limit: pagination.limit,
          status: filters.status,
        });

        if (!response || response.success === false) {
          throw new Error(response?.error || 'Failed to fetch streak bonus data.');
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
        setError(e.message || 'Failed to fetch streak bonus data.');
        console.error('Failed to fetch streak bonus data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pagination.page, pagination.limit, filters.status]);

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

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Eligible for next bonus</p>
          <p className="text-2xl font-semibold text-blue-600">
            {stats.eligibleCount ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Riders rewarded before</p>
          <p className="text-2xl font-semibold text-green-600">
            {stats.rewardedCount ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Required streak</p>
          <p className="text-2xl font-semibold text-gray-800">
            {stats.requiredStreak ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Bonus amount</p>
          <p className="text-2xl font-semibold text-gray-800">
            ₦{stats.bonusAmount?.toLocaleString() ?? '0'}
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
          title="No streak data yet"
          description="As riders start accepting orders consistently, their streak progress and bonuses will appear here."
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
                  Rider
                </th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                  Contact
                </th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                  Current streak
                </th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                  Required streak
                </th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                  Eligible
                </th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                  Total bonuses
                </th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                  Last bonus at
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
                      <span className="text-xs text-gray-500">{item.userId}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-800">
                    <div className="flex flex-col text-sm">
                      <span>{item.email}</span>
                      {item.phoneNumber && (
                        <span className="text-xs text-gray-500">
                          {item.phoneNumber}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-800">
                    {item.currentStreak ?? 0}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-800">
                    {item.requiredStreak ?? 0}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.eligible ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                        Not yet
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-800">
                    {item.totalStreakBonuses ?? 0}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-800">
                    {formatDateTime(item.lastStreakBonusAt)}
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
              Total riders: {pagination.totalDocs}
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

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-6 h-full">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Streak Bonuses</h1>

      {error && <p className="mb-4 text-red-500">{error}</p>}

      {renderStats()}

      <div className="flex space-x-4 mb-4">
        <button
          type="button"
          onClick={() => handleStatusFilterChange('all')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            filters.status === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-800 border border-gray-300'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => handleStatusFilterChange('eligible')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            filters.status === 'eligible'
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-800 border border-gray-300'
          }`}
        >
          Eligible
        </button>
        <button
          type="button"
          onClick={() => handleStatusFilterChange('rewarded')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            filters.status === 'rewarded'
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-800 border border-gray-300'
          }`}
        >
          Rewarded
        </button>
      </div>

      {renderTable()}
    </div>
  );
};

export default StreakBonuses;


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
  });

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
        });

        if (!response || response.success === false) {
          throw new Error(response?.error || 'Failed to fetch Gold Status riders.');
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
        setError(e.message || 'Failed to fetch Gold Status riders.');
        console.error('Failed to fetch Gold Status riders:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    intervalId = setInterval(() => {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (!item.isActive || !item.remainingSeconds || item.remainingSeconds <= 0) {
            return { ...item, remainingSeconds: 0 };
          }
          return { ...item, remainingSeconds: item.remainingSeconds - 1 };
        })
      );
    }, 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Active Gold Riders</p>
          <p className="text-2xl font-semibold text-green-600">
            {stats.activeCount ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Required rides for Gold</p>
          <p className="text-2xl font-semibold text-gray-800">
            {stats.requiredRides ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-500">Promo window (days)</p>
          <p className="text-2xl font-semibold text-gray-800">
            {stats.windowDays ?? 0}
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
          title="No Gold Status riders found"
          description="When riders unlock Gold Status, they will appear here with their remaining discount time."
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
                  Gold Status
                </th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                  Countdown
                </th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                  Discount
                </th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                  Unlocks
                </th>
                <th className="py-3 px-4 text-center text-gray-600 font-semibold">
                  Progress
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
                  <td className="py-3 px-4 text-center">
                    {item.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-800">
                    {item.isActive ? (
                      <span className="font-mono">
                        {formatDuration(item.remainingSeconds)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-800">
                    {item.discountPercent
                      ? `${item.discountPercent}% off`
                      : '0%'}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-800">
                    {item.totalUnlocks ?? 0}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-800">
                    {item.progress ? (
                      <div className="flex flex-col items-center space-y-1">
                        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${item.progress.percentage ?? 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {item.progress.completed}/{item.progress.required} rides
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No data</span>
                    )}
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
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Gold Status Riders</h1>

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
          onClick={() => handleStatusFilterChange('active')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            filters.status === 'active'
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-800 border border-gray-300'
          }`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => handleStatusFilterChange('inactive')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            filters.status === 'inactive'
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-800 border border-gray-300'
          }`}
        >
          Inactive
        </button>
      </div>

      {renderTable()}
    </div>
  );
};

export default GoldStatus;


import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { getAllRiders, getInitialRidersOnlineStatus } from '../services/adminApi';
import RiderDetailsModal from '../components/RiderDetailsModal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const socket = io();

const Riders = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    blocked: false,
    verified: false,
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    const fetchRidersAndOnlineStatus = async () => {
      try {
        setLoading(true);
        const response = await getAllRiders(filters);
        const riders = response?.riders || [];
        setPagination(response?.pagination || {});

        const { onlineRiderIds } = await getInitialRidersOnlineStatus();
        const ridersWithOnlineStatus = riders.map((rider) => ({
          ...rider,
          online: onlineRiderIds.includes(rider._id),
        }));

        setRiders(ridersWithOnlineStatus);
      } catch (error) {
        console.error('Failed to fetch riders or online status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRidersAndOnlineStatus();

    socket.on('user.online', ({ userId }) => {
      setRiders((prevRiders) =>
        prevRiders.map((rider) =>
          rider._id === userId ? { ...rider, online: true } : rider
        )
      );
    });

    socket.on('user.offline', ({ userId }) => {
      setRiders((prevRiders) =>
        prevRiders.map((rider) =>
          rider._id === userId ? { ...rider, online: false } : rider
        )
      );
    });

    return () => {
      socket.off('user.online');
      socket.off('user.offline');
    };
  }, [filters]);

  const handleViewDetails = (rider) => {
    console.log('Rider data:', rider);
    setSelectedRider(rider);
  };

  const handleCloseModal = () => {
    setSelectedRider(null);
  };

  const formatVehicleType = (vehicleType) => {
    if (!vehicleType) return 'N/A';
    return vehicleType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value, page: 1 }));
  };

  return (
    <div className="p-6 h-full">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Riders</h1>
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          name="search"
          placeholder="Search by name, email, or phone"
          value={filters.search}
          onChange={handleFilterChange}
          className="bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-gray-800">
            <input
              type="checkbox"
              name="blocked"
              checked={filters.blocked}
              onChange={handleFilterChange}
              className="form-checkbox h-5 w-5 text-accent-blue bg-white border-gray-300 rounded focus:ring-accent-blue"
            />
            <span>Blocked</span>
          </label>
          <label className="flex items-center space-x-2 text-gray-800">
            <input
              type="checkbox"
              name="verified"
              checked={filters.verified}
              onChange={handleFilterChange}
              className="form-checkbox h-5 w-5 text-accent-blue bg-white border-gray-300 rounded focus:ring-accent-blue"
            />
            <span>Verified</span>
          </label>
        </div>
      </div>
      {loading ? (
        <Loader text="Loading Riders..." />
      ) : riders.length === 0 ? (
        <EmptyState
          type="riders"
          title="No riders available"
          description="When riders complete registration and are approved, they will appear in this list."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Name</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Email</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Phone</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Vehicle</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Service</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Status</th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((rider) => (
                <tr key={rider._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-800">{rider.fullName}</td>
                  <td className="py-3 px-4 text-gray-800">{rider.email}</td>
                  <td className="py-3 px-4 text-gray-800">{rider.phoneNumber}</td>
                  <td className="py-3 px-4 text-gray-800">{formatVehicleType(rider.vehicleType)}</td>
                  <td className="py-3 px-4 text-gray-800">{rider.preferredService}</td>
                  <td className="py-3 px-4">
                    {rider.online ? (
                      <span className="text-green-500">Online</span>
                    ) : (
                      <span className="text-red-500">Offline</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleViewDetails(rider)}
                      className="bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
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
      <RiderDetailsModal rider={selectedRider} onClose={handleCloseModal} />
    </div>
  );
};

export default Riders;

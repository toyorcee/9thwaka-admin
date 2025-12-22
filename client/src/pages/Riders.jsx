import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { getAllRiders, getInitialRidersOnlineStatus } from '../services/adminApi';
import RiderDetailsModal from '../components/RiderDetailsModal';

const socket = io();

const Riders = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    blocked: false,
    verified: false,
  });

  useEffect(() => {
    const fetchRidersAndOnlineStatus = async () => {
      try {
        setLoading(true);
        const response = await getAllRiders(filters);
        const riders = response?.riders || [];

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
    setFilters((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div className="p-6 bg-dark-blue text-white h-full">
      <h1 className="text-2xl font-bold mb-4">Riders</h1>
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          name="search"
          placeholder="Search by name, email, or phone"
          value={filters.search}
          onChange={handleFilterChange}
          className="bg-nav-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="blocked"
              checked={filters.blocked}
              onChange={handleFilterChange}
              className="form-checkbox h-5 w-5 text-accent-blue bg-nav-dark border-gray-600 rounded focus:ring-accent-blue"
            />
            <span>Blocked</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="verified"
              checked={filters.verified}
              onChange={handleFilterChange}
              className="form-checkbox h-5 w-5 text-accent-blue bg-nav-dark border-gray-600 rounded focus:ring-accent-blue"
            />
            <span>Verified</span>
          </label>
        </div>
      </div>
      {loading ? (
        <p>Loading riders...</p>
      ) : riders.length === 0 ? (
        <p>No riders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-dark-blue">
            <thead>
              <tr className="bg-nav-dark">
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Phone</th>
                <th className="py-3 px-4 text-left">Vehicle</th>
                <th className="py-3 px-4 text-left">Service</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((rider) => (
                <tr key={rider._id} className="border-b border-nav-dark hover:bg-nav-dark">
                  <td className="py-3 px-4">{rider.fullName}</td>
                  <td className="py-3 px-4">{rider.email}</td>
                  <td className="py-3 px-4">{rider.phoneNumber}</td>
                  <td className="py-3 px-4">{formatVehicleType(rider.vehicleType)}</td>
                  <td className="py-3 px-4">{rider.preferredService}</td>
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
                      className="bg-accent-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
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
      <RiderDetailsModal rider={selectedRider} onClose={handleCloseModal} />
    </div>
  );
};

export default Riders;
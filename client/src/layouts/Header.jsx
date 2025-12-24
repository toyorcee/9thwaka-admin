import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserCircleIcon, ArrowRightOnRectangleIcon as LogoutIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '../components/ConfirmationModal';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="bg-white p-4 flex justify-between items-center border-b border-gray-200">
        <div>
          {/* Future breadcrumbs or page titles can go here */}
        </div>
        <div className="flex items-center space-x-6">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center space-x-2 focus:outline-none hover:text-accent-blue cursor-pointer"
          >
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon className="h-6 w-6 text-gray-500" />
            )}
            <span className="text-sm font-medium text-gray-800">
              {user?.fullName || user?.email || 'Admin'}
            </span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors duration-200"
          >
            <LogoutIcon className="h-6 w-6" />
            <span>Logout</span>
          </button>
        </div>
      </header>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        icon={LogoutIcon}
      />
    </>
  );
};

export default Header;

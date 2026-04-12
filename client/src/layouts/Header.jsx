import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserCircleIcon, ArrowRightOnRectangleIcon as LogoutIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '../components/ConfirmationModal';
import NotificationBell from '../components/NotificationBell';
import defaultAvatar from '../assets/default-avatar.png';
import { resolveImageUrl } from '../utils/urlHelper';

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
      <header className="bg-white/80 backdrop-blur-md px-8 py-5 flex justify-between items-center border-b border-blue-50 sticky top-0 z-40">
        <div>
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Administration</h2>
        </div>
        <div className="flex items-center space-x-8">
          <NotificationBell />
          <div className="h-6 w-px bg-slate-100" />
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center space-x-3 focus:outline-none group cursor-pointer"
          >
            <div className="relative">
              <img
                src={resolveImageUrl(user?.profilePicture, defaultAvatar)}
                alt="Profile"
                className="h-10 w-10 rounded-2xl object-cover ring-2 ring-blue-50 group-hover:ring-blue-100 transition-all duration-300 shadow-sm"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultAvatar;
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-[13px] font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                {user?.fullName || 'Toyorcee Admin'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 group-hover:text-blue-400 transition-colors">
                {user?.role || 'Super Admin'}
              </p>
            </div>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 border border-slate-100 transition-all duration-300"
            title="Logout"
          >
            <LogoutIcon className="h-5 w-5" />
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

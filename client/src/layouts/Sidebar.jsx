import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  ClipboardDocumentListIcon as OrdersIcon,
  UsersIcon,
  CogIcon,
  GiftIcon,
  CurrencyDollarIcon,
  LinkIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import logo from '../assets/nightwaka-dark.png';

const navLinks = [
  { to: '/', label: 'Dashboard', icon: HomeIcon },
  { to: '/orders', label: 'Orders', icon: OrdersIcon },
  { to: '/rider-payouts', label: 'Rider Payouts', icon: CurrencyDollarIcon },
  {
    label: 'User Management',
    icon: UsersIcon,
    subLinks: [
      { to: '/riders', label: 'Riders', icon: UsersIcon },
      { to: '/customers', label: 'Customers', icon: UsersIcon },
    ],
  },
  {
    label: 'Promotions & Rewards',
    icon: GiftIcon,
    subLinks: [
      { to: '/referrals', label: 'Referrals', icon: LinkIcon },
      { to: '/streak-bonuses', label: 'Streak Bonuses', icon: CurrencyDollarIcon },
      { to: '/gold-status', label: 'Gold Status', icon: CurrencyDollarIcon },
      { to: '/promos', label: 'Promo Configuration', icon: CurrencyDollarIcon },
    ],
  },
  { to: '/settings', label: 'Settings', icon: CogIcon },
];

const SidebarLink = ({ link }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubLinks = link.subLinks && link.subLinks.length > 0;

  const toggleOpen = () => {
    if (hasSubLinks) {
      setIsOpen(!isOpen);
    }
  };

  if (hasSubLinks) {
    return (
      <li>
        <div
          onClick={toggleOpen}
          className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-100 rounded-lg mx-2 transition-colors duration-200"
        >
          <div className="flex items-center">
            <link.icon className="h-6 w-6 mr-3 text-gray-500" />
            <span className="font-medium text-gray-800">{link.label}</span>
          </div>
          <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} />
        </div>
        {isOpen && (
          <ul className="pl-8 mt-2 space-y-1">
            {link.subLinks.map((subLink) => (
              <li key={subLink.to}>
                <NavLink
                  to={subLink.to}
                  className={({ isActive }) =>
                    `flex items-center py-2 px-4 text-sm rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-accent-blue font-semibold'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`
                  }
                >
                  {subLink.icon && <subLink.icon className="h-5 w-5 mr-3" />}
                  <span>{subLink.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={link.to}
        className={({ isActive }) =>
          `flex items-center p-4 mx-2 rounded-lg transition-colors duration-200 ${
            isActive
              ? 'bg-blue-100 text-accent-blue font-semibold'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          }`
        }
      >
        <link.icon className="h-6 w-6 mr-3" />
        <span className="font-medium">{link.label}</span>
      </NavLink>
    </li>
  );
};

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="w-64 bg-white flex flex-col shadow-lg">
        <div className="p-4 text-center">
          <img src={logo} alt="9thWaka Logo" className="w-24 mx-auto" />
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          <ul>
            {navLinks.map((link) => (
              <SidebarLink key={link.label} link={link} />
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center w-full p-3 rounded-lg text-gray-600 bg-gray-100 hover:bg-red-100 hover:text-red-500 transition-colors duration-200"
          >
            <LogoutIcon className="h-6 w-6 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
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

export default Sidebar;

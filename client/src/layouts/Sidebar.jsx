import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  ChatBubbleLeftRightIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import ConfirmationModal from "../components/ConfirmationModal";
import logo from "../assets/nightwaka-dark.png";

const navLinks = [
  { to: "/", label: "Dashboard", icon: HomeIcon },
  { to: "/analytics", label: "Analytics", icon: HomeIcon },
  { to: "/admin-wallet", label: "Admin Wallet", icon: BanknotesIcon },
  { to: "/pricing", label: "Pricing Settings", icon: CurrencyDollarIcon },
  { to: "/service-costs", label: "Service Costs", icon: ChartBarIcon },
  { to: "/orders", label: "Orders", icon: OrdersIcon },
  { to: "/rider-payouts", label: "Rider Payouts", icon: CurrencyDollarIcon },
  { to: "/withdrawals", label: "Withdrawals", icon: BanknotesIcon },
  { to: "/transactions", label: "Transactions", icon: CurrencyDollarIcon },
  {
    label: "User Management",
    icon: UsersIcon,
    subLinks: [
      { to: "/riders", label: "Riders", icon: UsersIcon },
      { to: "/customers", label: "Customers", icon: UsersIcon },
      { to: "/blocked-users", label: "Blocked Users", icon: UsersIcon },
    ],
  },
  { to: "/kyc-review", label: "KYC Review", icon: ShieldCheckIcon },
  {
    label: "Promotions & Rewards",
    icon: GiftIcon,
    subLinks: [
      { to: "/referrals", label: "Referrals", icon: LinkIcon },
      {
        to: "/streak-bonuses",
        label: "Streak Bonuses",
        icon: CurrencyDollarIcon,
      },
      { to: "/gold-status", label: "Gold Status", icon: CurrencyDollarIcon },
      { to: "/first-orders", label: "First Orders", icon: GiftIcon },
      { to: "/birthday-promos", label: "Birthday Promos", icon: GiftIcon },
      { to: "/platform-promos", label: "Platform Promos", icon: GiftIcon },
      { to: "/loyalty-rewards", label: "Loyalty Rewards", icon: GiftIcon },
      { to: "/cashback", label: "Cashback Program", icon: BanknotesIcon },
      { to: "/rider-milestones", label: "Rider Milestones", icon: CurrencyDollarIcon },
      { to: "/promotional-settings", label: "Promotional Alerts", icon: GiftIcon },
      { to: "/promos", label: "Promo Configuration", icon: CurrencyDollarIcon },
    ],
  },
  { to: "/support", label: "Support", icon: ChatBubbleLeftRightIcon },
  { to: "/settings", label: "Settings", icon: CogIcon },
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
          className="flex justify-between items-center p-3.5 cursor-pointer hover:bg-slate-800 rounded-xl mx-2 transition-all duration-300 group"
        >
          <div className="flex items-center">
            <link.icon className="h-5 w-5 mr-3 text-slate-400 group-hover:text-white" />
            <span className="font-bold text-[13px] text-slate-400 group-hover:text-white tracking-wide">{link.label}</span>
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </div>
        {isOpen && (
          <ul className="pl-10 mt-1 space-y-1">
            {link.subLinks.map((subLink) => (
              <li key={subLink.to}>
                <NavLink
                  to={subLink.to}
                  className={({ isActive }) =>
                    `flex items-center py-2.5 px-4 text-[12px] font-bold rounded-lg transition-all duration-300 ${
                      isActive
                        ? "text-blue-400 bg-blue-400/10"
                        : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                    }`
                  }
                >
                  {subLink.icon && <subLink.icon className="h-4 w-4 mr-3" />}
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
          `flex items-center p-3.5 mx-2 rounded-xl transition-all duration-300 group ${
            isActive
              ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`
        }
      >
        <link.icon className={`h-5 w-5 mr-3 transition-colors ${link.iconColor || ""}`} />
        <span className="text-[13px] font-bold tracking-wide">{link.label}</span>
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
    navigate("/login");
  };

  return (
    <>
    <div className="w-64 bg-slate-900 flex flex-col shadow-2xl fixed h-full z-50">
        <div className="p-6 text-center border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <img src={logo} alt="9thWaka Logo" className="w-28 mx-auto brightness-0 invert" />
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <SidebarLink key={link.label} link={link} />
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center w-full p-3 rounded-xl text-slate-400 bg-slate-800/50 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700/50 transition-all duration-300 group"
          >
            <LogoutIcon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
            <span className="font-bold text-sm tracking-wide">LOGOUT</span>
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

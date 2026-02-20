import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Riders from './pages/Riders';
import Customers from './pages/Customers';
import PromoConfig from './pages/PromoConfig';
import Referrals from './pages/Referrals';
import GoldStatus from './pages/GoldStatus';
import StreakBonuses from './pages/StreakBonuses';
import FirstOrderPromo from './pages/FirstOrderPromo';
import BirthdayPromo from './pages/BirthdayPromo';
import Settings from './pages/Settings';
import PricingSettings from './pages/PricingSettings';
import AdminWallet from './pages/AdminWallet';
import Profile from './pages/Profile';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import RiderPayouts from './pages/RiderPayouts';
import Notifications from './pages/Notifications';
import BlockedUsers from './pages/BlockedUsers';
import SupportChats from './pages/SupportChats';
import Analytics from './pages/Analytics';
import Transactions from './pages/Transactions';
import PromotionalSettings from './pages/PromotionalSettings';
import KYCReview from './pages/KYCReview';
import Withdrawals from './pages/Withdrawals';
import { useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, initializing } = useAuth();

  if (initializing) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="" element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="riders" element={<Riders />} />
        <Route path="rider-payouts" element={<RiderPayouts />} />
        <Route path="withdrawals" element={<Withdrawals />} />
        <Route path="customers" element={<Customers />} />
        <Route path="kyc-review" element={<KYCReview />} />
        <Route path="blocked-users" element={<BlockedUsers />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="promos" element={<PromoConfig />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="gold-status" element={<GoldStatus />} />
        <Route path="streak-bonuses" element={<StreakBonuses />} />
        <Route path="first-orders" element={<FirstOrderPromo />} />
        <Route path="birthday-promos" element={<BirthdayPromo />} />
        <Route path="promotional-settings" element={<PromotionalSettings />} />
        <Route path="pricing" element={<PricingSettings />} />
        <Route path="admin-wallet" element={<AdminWallet />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="support" element={<SupportChats />} />
      </Route>
    </Routes>
  );
}

export default App;

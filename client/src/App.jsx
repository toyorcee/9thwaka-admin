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
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import RiderPayouts from './pages/RiderPayouts';
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
        <Route path="customers" element={<Customers />} />
        <Route path="promos" element={<PromoConfig />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="gold-status" element={<GoldStatus />} />
        <Route path="streak-bonuses" element={<StreakBonuses />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;

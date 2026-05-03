import api from "./api";

export const getRiders = async (filters) => {
  const response = await api.get("/admin/riders", {
    params: filters,
  });
  return response.data;
};

export const getInitialRidersOnlineStatus = async () => {
  const response = await api.get("/admin/riders/online-status");
  return response.data;
};

export const getCustomers = async (filters) => {
  const response = await api.get("/admin/customers", {
    params: filters,
  });
  return response.data;
};

export const getUserPresence = async (userId) => {
  const response = await api.get(`/presence/${userId}`);
  return response.data;
};

export const getPendingReferrals = async () => {
  const response = await api.get("/admin/referrals/pending");
  return response.data;
};

export const getPaidReferrals = async (filters) => {
  const response = await api.get("/admin/referrals/paid", {
    params: filters,
  });
  return response.data;
};

export const getAdminReferralStats = async () => {
  const response = await api.get("/admin/referrals/stats");
  return response.data;
};

export const getReferralsByReferrer = async (referrerId) => {
  const response = await api.get(`/admin/referrals/referrer/${referrerId}`);
  return response.data;
};

export const getAdminGoldStatusUsers = async (params) => {
  const response = await api.get("/admin/gold-status", { params });
  return response.data;
};

export const getAdminStreakUsers = async (params) => {
  const response = await api.get("/admin/streak", { params });
  return response.data;
};

export const getAdminAnalytics = async (params) => {
  const response = await api.get("/admin/analytics", { params });
  return response.data;
};

export const getAdminTransactions = async (params) => {
  const response = await api.get("/admin/transactions", { params });
  return response.data;
};

export const getAdminFirstOrderUsers = async (params) => {
  const response = await api.get("/admin/first-order", { params });
  return response.data;
};

export const getAdminBirthdayUsers = async (params) => {
  const response = await api.get("/admin/birthday", { params });
  return response.data;
};

export const getAdminPlatformPromos = async (params) => {
  const response = await api.get("/admin/platform-promo", { params });
  return response.data;
};

export const getAdminLoyaltyRewards = async (params) => {
  const response = await api.get("/admin/loyalty-reward", { params });
  return response.data;
};

export const getAdminCashbackUsers = async (params) => {
  const response = await api.get("/admin/cashback", { params });
  return response.data;
};

export const getAdminRiderMilestoneUsers = async (params) => {
  const response = await api.get("/admin/rider-milestones", { params });
  return response.data;
};

// Blocked Users Management
export const getBlockedUsers = async (role) => {
  const response = await api.get("/admin/users/blocked", {
    params: role ? { role } : {},
  });
  return response.data;
};

export const blockUser = async (userId, reason) => {
  const response = await api.patch(`/admin/users/${userId}/block`, { reason });
  return response.data;
};

export const unblockUser = async (userId, data = {}) => {
  const response = await api.patch(`/admin/users/${userId}/unblock`, data);
  return response.data;
};

// KYC Management
export const getPendingKYCUsers = async (all = false) => {
    const response = await api.get("/admin/users/kyc-pending", { params: { all } });
    return response.data;
};

export const verifyIdentity = async (userId, data) => {
    const response = await api.post(`/admin/users/${userId}/verify-identity`, data);
    return response.data;
};

export const approveTier2 = async (userId, data = { grantReward: true }) => {
    const response = await api.patch(`/admin/users/${userId}/approve-tier2`, data);
    return response.data;
};

export const approveTier3 = async (userId, data = { grantReward: true }) => {
    const response = await api.patch(`/admin/users/${userId}/approve-tier3`, data);
    return response.data;
};

export const rejectTier2 = async (userId, reason) => {
    const response = await api.post(`/admin/users/${userId}/reject-tier2`, { reason });
    return response.data;
};

export const rejectTier3 = async (userId, reason) => {
    const response = await api.post(`/admin/users/${userId}/reject-tier3`, { reason });
    return response.data;
};

export const revokeKYC = async (userId, targetTier, reason) => {
    const response = await api.post(`/admin/users/${userId}/kyc-revoke`, { targetTier, reason });
    return response.data;
};

// Vehicle Verification
export const getPendingVehicleVerifications = async (params = {}) => {
    const response = await api.get("/admin/vehicle-verifications/pending", { params });
    return response.data;
};

export const verifyVehicle = async (userId, data) => {
    const response = await api.post(`/admin/users/${userId}/vehicle-verify`, data);
    return response.data;
};

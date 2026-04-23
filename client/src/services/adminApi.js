import api from "./api";

export const getAllRiders = async (filters) => {
  const response = await api.get("/admin/riders", {
    params: filters,
  });
  return response.data;
};

export const getInitialRidersOnlineStatus = async () => {
  const response = await api.get("/admin/riders/online-status");
  return response.data;
};

export const getAllCustomers = async (filters) => {
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

export const unblockUser = async (userId) => {
  const response = await api.patch(`/admin/users/${userId}/unblock`);
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

export const approveKYC = async (userId, data = { grantReward: true }) => {
    const response = await api.patch(`/admin/users/${userId}/kyc-approve-tier2`, data);
    return response.data;
};

export const approveAddressKYC = async (userId, data = { grantReward: true }) => {
    const response = await api.patch(`/admin/users/${userId}/kyc-approve-tier3`, data);
    return response.data;
};

export const approveHackneyPermit = async (userId, data = { grantReward: true }) => {
    const response = await api.patch(`/admin/users/${userId}/hackney-approve`, data);
    return response.data;
};

export const approveInsurancePolicy = async (userId, data = { grantReward: true }) => {
    const response = await api.patch(`/admin/users/${userId}/insurance-approve`, data);
    return response.data;
};

export const rejectKYC = async (userId, reason) => {
    const response = await api.post(`/admin/users/${userId}/kyc-reject`, { reason });
    return response.data;
};

export const rejectAddressKYC = async (userId, reason) => {
    const response = await api.post(`/admin/users/${userId}/address-reject`, { reason });
    return response.data;
};

export const rejectHackneyPermit = async (userId, reason) => {
    const response = await api.post(`/admin/users/${userId}/hackney-reject`, { reason });
    return response.data;
};

export const rejectInsurancePolicy = async (userId, reason) => {
    const response = await api.post(`/admin/users/${userId}/insurance-reject`, { reason });
    return response.data;
};

export const revokeKYC = async (userId, targetTier, reason) => {
    const response = await api.post(`/admin/users/${userId}/kyc-revoke`, { targetTier, reason });
    return response.data;
};

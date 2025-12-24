import api from './api';

export const getAllRiders = async (filters) => {
  const response = await api.get('/admin/riders', {
    params: filters,
  });
  return response.data;
};

export const getInitialRidersOnlineStatus = async () => {
  const response = await api.get('/admin/riders/online-status');
  return response.data;
};

export const getAllCustomers = async (filters) => {
  const response = await api.get('/admin/customers', {
    params: filters,
  });
  return response.data;
};

export const getUserPresence = async (userId) => {
  const response = await api.get(`/presence/${userId}`);
  return response.data;
};

export const getPendingReferrals = async () => {
  const response = await api.get('/admin/referrals/pending');
  return response.data;
};

export const getPaidReferrals = async (filters) => {
  const response = await api.get('/admin/referrals/paid', {
    params: filters,
  });
  return response.data;
};

export const getAdminReferralStats = async () => {
  const response = await api.get('/admin/referrals/stats');
  return response.data;
};

export const getReferralsByReferrer = async (referrerId) => {
  const response = await api.get(`/admin/referrals/referrer/${referrerId}`);
  return response.data;
};

export const getAdminGoldStatusUsers = async (params) => {
  const response = await api.get('/admin/gold-status', { params });
  return response.data;
};

export const getAdminStreakUsers = async (params) => {
  const response = await api.get('/admin/streak', { params });
  return response.data;
};

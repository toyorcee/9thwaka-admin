import api from './api';

export const fetchPromoConfig = async () => {
  const response = await api.get('/admin/promos');
  return response.data;
};

export const updateReferralPromo = async (payload) => {
  const response = await api.put('/admin/promos/referral', payload);
  return response.data;
};

export const updateStreakPromo = async (payload) => {
  const response = await api.put('/admin/promos/streak', payload);
  return response.data;
};

export const updateCustomerGold = async (payload) => {
  const response = await api.put('/admin/promos/customer-gold', payload);
  return response.data;
};

export const updateRiderGold = async (payload) => {
  const response = await api.put('/admin/promos/rider-gold', payload);
  return response.data;
};

export const toggleAllPromos = async (enabled) => {
  const response = await api.put('/admin/promos/toggle-all', { enabled });
  return response.data;
};

export const updateFirstOrderPromo = async (payload) => {
  const response = await api.put('/admin/promos/first-order', payload);
  return response.data;
};

export const updateBirthdayPromo = async (payload) => {
  const response = await api.put('/admin/promos/birthday', payload);
  return response.data;
};

export const updatePlatformPromo = async (payload) => {
  const response = await api.put('/admin/promos/platform', payload);
  return response.data;
};

export const updateLoyaltyReward = async (payload) => {
  const response = await api.put('/admin/promos/loyalty', payload);
  return response.data;
};

export const updateCashbackPromo = async (payload) => {
  const response = await api.put('/admin/promos/cashback', payload);
  return response.data;
};

export const updateRiderMilestones = async (payload) => {
  const response = await api.put('/admin/promos/rider-milestones', payload);
  return response.data;
};

export const fetchRewardExpiryStats = async (type = null) => {
  const url = type ? `/admin/rewards/expiry-stats?type=${type}` : '/admin/rewards/expiry-stats';
  const response = await api.get(url);
  return response.data;
};

export const updateLoyaltySystem = async (payload) => {
  const response = await api.put('/admin/promos/loyalty-system', payload);
  return response.data;
};

export const fetchPointRewardStats = async (limit = 50) => {
  const response = await api.get(`/admin/promos/loyalty-system/stats?limit=${limit}`);
  return response.data;
};


 

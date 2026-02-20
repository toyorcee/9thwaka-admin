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

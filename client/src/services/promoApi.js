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

export const updateGoldStatusPromo = async (payload) => {
  const response = await api.put('/admin/promos/gold-status', payload);
  return response.data;
};

export const toggleAllPromos = async (enabled) => {
  const response = await api.put('/admin/promos/toggle-all', { enabled });
  return response.data;
};


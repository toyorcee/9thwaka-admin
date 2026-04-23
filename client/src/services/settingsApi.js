import api from './api';

export const changePassword = async ({ currentPassword, newPassword, pin }) => {
  const response = await api.put('/auth/change-password', {
    currentPassword,
    newPassword,
    pin
  });
  return response.data;
};

export const fetchAdminSettings = async () => {
  const response = await api.get('/admin/settings');
  return response.data;
};

export const updateAdminSettings = async (payload) => {
  const response = await api.put('/admin/settings', payload);
  return response.data;
};

export const fetchPricingPreview = async () => {
    const response = await api.get('/admin/pricing-preview');
    return response.data;
};

export const fetchServiceCosts = async () => {
    const response = await api.get('/admin/service-costs');
    return response.data;
};

export const updatePayscribeRates = async (payload) => {
    const response = await api.put('/admin/payscribe-rates', payload);
    return response.data;
};

export const sendPromotionalPush = async (payload) => {
  const response = await api.post('/admin/notifications/promotional', payload);
  return response.data;
};

// PIN Management
export const setFinancialPin = async (pin) => {
  const response = await api.post('/user/set-pin', { pin });
  return response.data;
};

export const changeFinancialPin = async (currentPin, newPin) => {
  const response = await api.post('/user/change-pin', { currentPin, newPin });
  return response.data;
};

export const verifyFinancialPin = async (pin) => {
  const response = await api.post('/user/verify-pin', { pin });
  return response.data;
};

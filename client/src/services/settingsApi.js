import api from './api';

export const changePassword = async ({ currentPassword, newPassword }) => {
  const response = await api.put('/auth/change-password', {
    currentPassword,
    newPassword,
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

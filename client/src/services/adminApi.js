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

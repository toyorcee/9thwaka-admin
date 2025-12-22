import api from './api';

export const getPromoConfig = async () => {
  const response = await api.get('/admin/promos');
  return response.data;
};

export const updatePromoConfig = async (config) => {
  const response = await api.put('/admin/promos', config);
  return response.data;
};

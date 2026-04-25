import api from './api';

/**
 * Fetch pending settlements/payments
 * @param {number} page 
 * @param {string} search 
 */
export const getPendingSettlements = async (page = 1, search = '', startDate = '', endDate = '') => {
  let url = `/admin/payments/pending?page=${page}&limit=10&search=${search}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;
  const { data } = await api.get(url);
  return data;
};

/**
 * Get financial audit review for an order
 * @param {string} orderId 
 */
export const getOrderAuditReview = async (orderId) => {
  const { data } = await api.get(`/admin/payments/${orderId}/review`);
  return data;
};

/**
 * Verify and settle an order payment
 * @param {string} orderId 
 * @param {string} method 
 */
export const verifySettlement = async (orderId, method = 'transfer') => {
  const { data } = await api.post(`/admin/payments/${orderId}/verify`, { paymentMethod: method });
  return data;
};

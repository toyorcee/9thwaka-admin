import api from './api';

export const fetchAdminSupportChats = async () => {
  const response = await api.get('/chat/support/admin/chats');
  return response.data;
};

export const fetchSupportChatMessages = async (supportChatId, params) => {
  const response = await api.get(`/chat/support/${supportChatId}/messages`, {
    params,
  });
  return response.data;
};

export const sendSupportChatMessage = async (supportChatId, message) => {
  const response = await api.post(`/chat/support/${supportChatId}/messages`, {
    message,
  });
  return response.data;
};

export const markSupportChatAsRead = async (supportChatId) => {
  const response = await api.patch(`/chat/support/${supportChatId}/read`);
  return response.data;
};


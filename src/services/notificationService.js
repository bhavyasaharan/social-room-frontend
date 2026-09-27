 import api from './api';

const notificationService = {
  getNotifications: async (page = 0, size = 20) => {
    const response = await api.get('/notifications', {
      params: {
        page,
        size,
        sort: 'createdAt,desc'
      }
    });

    return response.data;
  },

  markAsRead: async (notificationId) => {
    await api.put(
      `/notifications/${notificationId}/read`
    );
  },

  getUnreadCount: async () => {
    const response = await api.get(
      '/notifications/unread-count'
    );

    return response.data;
  }
};

export default notificationService;
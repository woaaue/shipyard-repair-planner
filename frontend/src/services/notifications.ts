import api from './api';

export type NotificationType = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';

export interface NotificationResponse {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  userId: number | null;
  createdAt: string;
}

export const getNotifications = async (unreadOnly = false): Promise<NotificationResponse[]> => {
  const response = await api.get<NotificationResponse[]>('/notifications', {
    params: { unreadOnly },
  });
  return response.data;
};

export const markNotificationAsRead = async (id: number): Promise<NotificationResponse> => {
  const response = await api.patch<NotificationResponse>(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<NotificationResponse[]> => {
  const response = await api.patch<NotificationResponse[]>('/notifications/read-all');
  return response.data;
};

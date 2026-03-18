import { apiClient } from './client';

export interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  related_type: string | null;
  related_id: number | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  data: Notification[];
  unread_count: number;
  has_more: boolean;
}

export async function getNotifications(token: string, page = 1): Promise<NotificationsResponse> {
  return apiClient.get<NotificationsResponse>(`/notifications?page=${page}`, token);
}

export async function getUnreadCount(token: string): Promise<{ count: number }> {
  return apiClient.get<{ count: number }>('/notifications/unread-count', token);
}

export async function markNotificationRead(id: number, token: string): Promise<{ message: string }> {
  return apiClient.put<{ message: string }>(`/notifications/${id}/read`, {}, token);
}

export async function markAllNotificationsRead(token: string): Promise<{ message: string }> {
  return apiClient.put<{ message: string }>('/notifications/read-all', {}, token);
}

import apiService from './api';
import { Notification, NotificationCreateRequest, PageResponse, PageRequest } from '../types';

export const notificationService = {
  // Get all notifications with pagination (Admin)
  async getAllNotifications(params?: PageRequest): Promise<PageResponse<Notification>> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    
    return apiService.get(`/notifications?${queryParams.toString()}`);
  },

  // Get notifications for current user's school
  async getSchoolNotifications(schoolId: string): Promise<Notification[]> {
    return apiService.get(`/notifications/school/${schoolId}`);
  },

  // Get notifications for current user
  async getMyNotifications(): Promise<Notification[]> {
    return apiService.get('/notifications/my');
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    return apiService.get('/notifications/unread-count');
  },

  // Get notification by ID
  async getNotificationById(id: string): Promise<Notification> {
    return apiService.get(`/notifications/${id}`);
  },

  // Create new notification (Admin)
  async createNotification(data: NotificationCreateRequest): Promise<Notification> {
    return apiService.post('/notifications', data);
  },

  // Update notification (Admin)
  async updateNotification(id: string, data: Partial<Notification>): Promise<Notification> {
    return apiService.put(`/notifications/${id}`, data);
  },

  // Mark notification as read
  async markAsRead(id: string): Promise<void> {
    return apiService.post(`/notifications/${id}/read`, {});
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    return apiService.post('/notifications/read-all', {});
  },

  // Delete notification (Admin)
  async deleteNotification(id: string): Promise<void> {
    return apiService.delete(`/notifications/${id}`);
  },

  // Broadcast notification to entire school (Admin)
  async broadcastNotification(data: {
    title: string;
    message: string;
    type: Notification['type'];
    priority: Notification['priority'];
  }): Promise<Notification> {
    return apiService.post('/notifications/broadcast', data);
  },
};

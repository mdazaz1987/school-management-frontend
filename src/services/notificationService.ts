import apiService from './api';
import { Notification, NotificationCreateRequest } from '../types';

export const notificationService = {
  // Get all notifications (Admin/Teacher)
  async getAllNotifications(schoolId?: string, type?: string): Promise<Notification[]> {
    const queryParams = new URLSearchParams();
    if (schoolId) queryParams.append('schoolId', schoolId);
    if (type) queryParams.append('type', type);
    
    return apiService.get(`/notifications?${queryParams.toString()}`);
  },

  // Get notifications for current user (resolved from Auth/localStorage)
  async getMyNotifications(): Promise<Notification[]> {
    const stored = localStorage.getItem('user');
    const parsed = stored ? JSON.parse(stored) : {};
    const userId = parsed?.id;
    if (!userId) throw new Error('Missing user id');
    return this.getByUser(userId);
  },

  // New: get notifications by userId (backend implementation)
  async getByUser(userId: string): Promise<Notification[]> {
    return apiService.get(`/notifications`, { userId });
  },

  // Get unread count (client-side)
  async getUnreadCount(): Promise<number> {
    const list = await this.getMyNotifications();
    return (list || []).filter((n: any) => !!n && (n as any).read === false).length;
  },

  // Get notification by ID
  async getNotificationById(id: string): Promise<Notification> {
    return apiService.get(`/notifications/${id}`);
  },

  // Create new notification (Admin/Teacher)
  async createNotification(data: NotificationCreateRequest): Promise<Notification> {
    return apiService.post('/notifications', data);
  },

  // Update notification (Admin/Teacher)
  async updateNotification(id: string, data: Partial<Notification>): Promise<Notification> {
    return apiService.put(`/notifications/${id}`, data);
  },

  // Mark notification as read
  async markAsRead(id: string): Promise<void> {
    // Legacy endpoint (may not exist). Use backend-compatible endpoint
    try {
      await apiService.put(`/notifications/${id}/mark-read`, {});
    } catch {
      await apiService.put(`/notifications/${id}/read`, {});
    }
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    const list = await this.getMyNotifications();
    await Promise.all(
      (list || [])
        .filter((n: any) => n && (n as any).isRead === false || (n as any).read === false)
        .map((n: any) => this.markAsRead((n as any).id))
    );
  },

  // Delete notification (Admin/Teacher)
  async deleteNotification(id: string): Promise<void> {
    return apiService.delete(`/notifications/${id}`);
  },

  // Send notification to all users in school (Admin only)
  async sendToAll(data: {
    title: string;
    message: string;
    type: Notification['type'];
    priority: Notification['priority'];
    link?: string;
  }): Promise<Notification> {
    return apiService.post('/notifications/send-to-all', data);
  },

  // Send notification to specific users
  async sendToUsers(data: {
    title: string;
    message: string;
    type: Notification['type'];
    priority: Notification['priority'];
    userIds: string[];
    link?: string;
  }): Promise<Notification> {
    return apiService.post('/notifications/send-to-users', data);
  },

  // Send notification to specific role
  async sendToRole(data: {
    title: string;
    message: string;
    type: Notification['type'];
    priority: Notification['priority'];
    role: string;
    link?: string;
  }): Promise<Notification> {
    return apiService.post('/notifications/send-to-role', data);
  },

  // Admin: seed notifications for a user/role
  async seed(data: { userId?: string; schoolId: string; role?: string; count?: number }): Promise<{ success: boolean; created: number }> {
    return apiService.post('/notifications/seed', data);
  },

  // Get scheduled notifications
  async getScheduledNotifications(schoolId: string): Promise<Notification[]> {
    return apiService.get(`/notifications/scheduled?schoolId=${schoolId}`);
  },
};

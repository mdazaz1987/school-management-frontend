import apiService from './api';

export const adminService = {
  async getSystemStats(): Promise<any> {
    return apiService.get('/admin/stats');
  },
  async getTodayAttendance(schoolId: string): Promise<{ present: number; absent: number }> {
    return apiService.get(`/admin/attendance/today`, { schoolId });
  },
  async getPendingLeaves(): Promise<any[]> {
    return apiService.get('/admin/leave/pending');
  },
  async approveLeave(id: string, comments?: string): Promise<any> {
    return apiService.put(`/admin/leave/${id}/approve`, { comments });
  },
  async rejectLeave(id: string, reason: string): Promise<any> {
    return apiService.put(`/admin/leave/${id}/reject`, { reason });
  },
  async getUserByEmail(email: string): Promise<any | null> {
    try {
      return await apiService.get('/admin/users/by-email', { email });
    } catch (e: any) {
      if (e?.response?.status === 404) return null;
      throw e;
    }
  },
};

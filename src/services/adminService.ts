import apiService from './api';

export const adminService = {
  async getSystemStats(): Promise<any> {
    return apiService.get('/admin/stats');
  },
  async getTodayAttendance(schoolId: string): Promise<{ present: number; absent: number }> {
    return apiService.get(`/admin/attendance/today`, { schoolId });
  },
};

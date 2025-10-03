import apiService from './api';

export const adminService = {
  async getSystemStats(): Promise<any> {
    return apiService.get('/admin/stats');
  },
};

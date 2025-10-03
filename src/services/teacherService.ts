import apiService from './api';

export const teacherService = {
  async getDashboardStats(): Promise<{
    totalClasses: number;
    totalStudents: number;
    totalAssignments: number;
    pendingGrading: number;
  }> {
    return apiService.get('/teacher/dashboard/stats');
  },
};

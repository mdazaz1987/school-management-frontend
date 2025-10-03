import apiService from './api';

export interface ParentDashboardResponse {
  totalChildren: number;
  children: Array<{
    studentId: string;
    studentName: string;
    className: string;
    pendingAssignments: number;
    attendancePercentage: number;
  }>;
}

export const parentService = {
  async getDashboard(): Promise<ParentDashboardResponse> {
    return apiService.get('/parent/dashboard');
  },
};

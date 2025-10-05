import apiService from './api';

export interface ParentDashboardResponse {
  totalChildren: number;
  children: Array<{
    studentId: string;
    studentName: string;
    className: string;
    pendingAssignments: number;
    attendancePercentage: number;
    averageGrade?: number;
    pendingFees?: number;
    upcomingExams?: number;
  }>;
}

export interface ChildDetail {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  class: string;
  section: string;
  attendance: number;
  grades: any[];
  fees: any[];
}

export const parentService = {
  async getDashboard(): Promise<ParentDashboardResponse> {
    return apiService.get('/parent/dashboard');
  },

  async getMyChildren(): Promise<ChildDetail[]> {
    return apiService.get('/parent/children');
  },

  async getChildAttendance(childId: string, startDate?: string, endDate?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiService.get(`/parent/children/${childId}/attendance?${params.toString()}`);
  },

  async getChildPerformance(childId: string): Promise<any> {
    return apiService.get(`/parent/children/${childId}/performance`);
  },

  async getChildFees(childId: string): Promise<any[]> {
    return apiService.get(`/parent/children/${childId}/fees`);
  },

  async getChildNotifications(childId: string): Promise<any[]> {
    return apiService.get(`/parent/children/${childId}/notifications`);
  },

  // ===== LEAVE APPLICATION APPROVAL =====

  /**
   * Get pending leave applications for my children
   */
  async getPendingLeaveApplications(): Promise<any[]> {
    return apiService.get('/parent/leave/pending');
  },

  /**
   * Approve leave application
   */
  async approveLeaveApplication(leaveId: string, comments?: string): Promise<any> {
    return apiService.put(`/parent/leave/${leaveId}/approve`, { comments });
  },

  /**
   * Reject leave application
   */
  async rejectLeaveApplication(leaveId: string, reason: string): Promise<any> {
    return apiService.put(`/parent/leave/${leaveId}/reject`, { reason });
  },

  /**
   * Get leave history for child
   */
  async getChildLeaveHistory(childId: string): Promise<any[]> {
    return apiService.get(`/parent/children/${childId}/leave-history`);
  },
};

import apiService from './api';
import { Attendance } from '../types';

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
}

export const attendanceService = {
  async getByStudent(studentId: string, params?: { startDate?: string; endDate?: string }): Promise<Attendance[]> {
    return apiService.get<Attendance[]>(`/students/${studentId}/attendance`, params);
  },

  async getSummary(studentId: string, params?: { startDate?: string; endDate?: string }): Promise<AttendanceSummary> {
    return apiService.get<AttendanceSummary>(`/students/${studentId}/attendance/summary`, params);
  },

  async getMonthly(studentId: string, year: number, month: number): Promise<Attendance[]> {
    return apiService.get<Attendance[]>(`/students/${studentId}/attendance/monthly/${year}/${month}`);
  },

  // Admin: Get attendance for a class between dates
  async getByClassAdmin(classId: string, params?: { startDate?: string; endDate?: string }): Promise<Attendance[]> {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const qs = query.toString();
    const url = `/admin/attendance/class/${classId}${qs ? `?${qs}` : ''}`;
    return apiService.get<Attendance[]>(url);
  },
};

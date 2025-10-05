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
};

import apiService from './api';
import { Student, DashboardStats } from '../types';

export const studentService = {
  async getAllStudents(params?: { schoolId?: string; classId?: string }): Promise<Student[]> {
    return apiService.get<Student[]>('/students', params);
  },

  async getStudentById(id: string): Promise<Student> {
    return apiService.get<Student>(`/students/${id}`);
  },

  async createStudent(data: Partial<Student>): Promise<Student> {
    return apiService.post<Student>('/students', data);
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    return apiService.put<Student>(`/students/${id}`, data);
  },

  async deleteStudent(id: string): Promise<void> {
    return apiService.delete<void>(`/students/${id}`);
  },

  async getStudentDashboard(id: string): Promise<any> {
    return apiService.get<any>(`/students/${id}/portal/dashboard`);
  },

  async searchStudents(query: string): Promise<Student[]> {
    return apiService.get<Student[]>('/students/search', { query });
  },
};

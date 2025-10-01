import apiService from './api';
import { SchoolClass } from '../types';

export const classService = {
  async getAllClasses(params?: { schoolId?: string }): Promise<SchoolClass[]> {
    return apiService.get<SchoolClass[]>('/classes', params);
  },

  async getClassById(id: string): Promise<SchoolClass> {
    return apiService.get<SchoolClass>(`/classes/${id}`);
  },

  async createClass(data: Partial<SchoolClass>): Promise<SchoolClass> {
    return apiService.post<SchoolClass>('/classes', data);
  },

  async updateClass(id: string, data: Partial<SchoolClass>): Promise<SchoolClass> {
    return apiService.put<SchoolClass>(`/classes/${id}`, data);
  },

  async deleteClass(id: string): Promise<void> {
    return apiService.delete<void>(`/classes/${id}`);
  },

  async addStudent(classId: string, studentId: string): Promise<SchoolClass> {
    return apiService.post<SchoolClass>(`/classes/${classId}/students/${studentId}`);
  },

  async removeStudent(classId: string, studentId: string): Promise<SchoolClass> {
    return apiService.delete<SchoolClass>(`/classes/${classId}/students/${studentId}`);
  },

  async assignTeacher(classId: string, teacherId: string): Promise<SchoolClass> {
    return apiService.put<SchoolClass>(`/classes/${classId}/teacher/${teacherId}`);
  },

  async getClassStats(id: string): Promise<any> {
    return apiService.get<any>(`/classes/${id}/stats`);
  },
};

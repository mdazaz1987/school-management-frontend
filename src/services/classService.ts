import apiService from './api';
import { SchoolClass, Student } from '../types';

// Normalize backend payloads that may return `active` instead of `isActive`
const normalizeClass = (c: any): SchoolClass => ({
  ...c,
  isActive: c?.isActive ?? c?.active ?? false,
});

export const classService = {
  async getAllClasses(params?: { schoolId?: string }): Promise<SchoolClass[]> {
    // Only include schoolId if it is a non-empty string
    const cleanedParams = params?.schoolId && params.schoolId.trim().length > 0
      ? { schoolId: params.schoolId }
      : undefined;
    const data = await apiService.get<SchoolClass[]>('/classes', cleanedParams);
    // Normalize each item (map 'active' -> 'isActive')
    return (data as any[]).map(normalizeClass);
  },

  async getClassById(id: string): Promise<SchoolClass> {
    const data = await apiService.get<SchoolClass>(`/classes/${id}`);
    return normalizeClass(data as any);
  },

  async createClass(data: Partial<SchoolClass>): Promise<SchoolClass> {
    // Send `active` to backend for compatibility; keep `isActive` too
    const payload: any = { ...data };
    if (payload.isActive !== undefined) {
      payload.active = payload.isActive;
    }
    const resp = await apiService.post<SchoolClass>('/classes', payload);
    return normalizeClass(resp as any);
  },

  async updateClass(id: string, data: Partial<SchoolClass>): Promise<SchoolClass> {
    const payload: any = { ...data };
    if (payload.isActive !== undefined) {
      payload.active = payload.isActive;
    }
    const resp = await apiService.put<SchoolClass>(`/classes/${id}`, payload);
    return normalizeClass(resp as any);
  },

  async updateClassStatus(id: string, isActive: boolean): Promise<SchoolClass> {
    const resp = await apiService.put<SchoolClass>(`/classes/${id}/status`, { isActive });
    return normalizeClass(resp as any);
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
  async getClassStudents(classId: string): Promise<Student[]> {
    const data = await apiService.get<any[]>(`/classes/${classId}/students`);
    // Backend returns Student entities; normalize like studentService does (lightly)
    return (data || []).map((s: any) => ({
      ...s,
      isActive: s?.isActive ?? s?.active ?? false,
    })) as Student[];
  },
};

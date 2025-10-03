import apiService from './api';
import { Subject } from '../types';

const normalizeSubject = (s: any): Subject => {
  return {
    ...s,
    isActive: s?.isActive ?? s?.active ?? false,
  } as Subject;
};

export const subjectService = {
  async getAllSubjects(params?: { schoolId?: string; category?: string; type?: string }): Promise<Subject[]> {
    const data = await apiService.get<any[]>('/subjects', params);
    return (data || []).map(normalizeSubject);
  },

  async getById(id: string): Promise<Subject> {
    const data = await apiService.get<any>(`/subjects/${id}`);
    return normalizeSubject(data);
  },

  async create(data: Partial<Subject>): Promise<Subject> {
    const created = await apiService.post<any>('/subjects', data);
    return normalizeSubject(created);
  },

  async update(id: string, data: Partial<Subject>): Promise<Subject> {
    const updated = await apiService.put<any>(`/subjects/${id}`, data);
    return normalizeSubject(updated);
  },

  async deactivate(id: string): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/subjects/${id}`);
  },

  async activate(id: string): Promise<{ success: boolean; message: string }> {
    return apiService.put(`/subjects/${id}/activate`, {});
  },
};

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
    const payload: any = {
      name: (data.name || '').trim(),
      code: (data.code || '').trim(),
      description: data.description,
      schoolId: data.schoolId,
      type: data.type,
      category: data.category,
      credits: data.credits,
      totalHours: data.totalHours,
      classIds: data.classIds,
      teacherIds: data.teacherIds,
      syllabus: data.syllabus,
    };
    if (data.isActive !== undefined) payload.active = data.isActive;
    const created = await apiService.post<any>('/subjects', payload);
    return normalizeSubject(created);
  },

  async update(id: string, data: Partial<Subject>): Promise<Subject> {
    const payload: any = {
      name: data.name,
      code: data.code,
      description: data.description,
      type: data.type,
      category: data.category,
      credits: data.credits,
      totalHours: data.totalHours,
      classIds: data.classIds,
      teacherIds: data.teacherIds,
      syllabus: data.syllabus,
    };
    if (data.isActive !== undefined) payload.active = data.isActive;
    const updated = await apiService.put<any>(`/subjects/${id}`, payload);
    return normalizeSubject(updated);
  },

  async deactivate(id: string): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/subjects/${id}`);
  },

  async activate(id: string): Promise<{ success: boolean; message: string }> {
    return apiService.put(`/subjects/${id}/activate`, {});
  },
};

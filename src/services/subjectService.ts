import apiService from './api';
import { Subject } from '../types';

export const subjectService = {
  async getAllSubjects(params?: { schoolId?: string; category?: string; type?: string }): Promise<Subject[]> {
    return apiService.get<Subject[]>('/subjects', params);
  },

  async getById(id: string): Promise<Subject> {
    return apiService.get<Subject>(`/subjects/${id}`);
  },
};

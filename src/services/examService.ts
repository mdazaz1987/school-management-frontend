import apiService from './api';
import { Exam } from '../types';

const normalizeExam = (e: any): Exam => {
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    schoolId: e.schoolId,
    classId: e.classId,
    subjectId: e.subjectId,
    examDate: e.examDate,
    startTime: e.startTime,
    endTime: e.endTime,
    totalMarks: Number(e.totalMarks ?? 0),
    passingMarks: Number(e.passingMarks ?? 0),
    academicYear: e.academicYear,
    term: e.term,
    isPublished: e.isPublished ?? e.resultsPublished ?? false,
  } as Exam;
};

export const examService = {
  async list(params?: { schoolId?: string; classId?: string; academicYear?: string }): Promise<Exam[]> {
    const data = await apiService.get<any[]>('/exams', params);
    return (data || []).map(normalizeExam);
  },

  async getById(id: string): Promise<Exam> {
    const data = await apiService.get<any>(`/exams/${id}`);
    return normalizeExam(data);
  },

  async create(data: Partial<Exam>): Promise<Exam> {
    const created = await apiService.post<any>('/exams', data);
    return normalizeExam(created);
  },

  async update(id: string, data: Partial<Exam>): Promise<Exam> {
    const updated = await apiService.put<any>(`/exams/${id}`, data);
    return normalizeExam(updated);
  },

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/exams/${id}`);
  },

  async publishResults(examId: string): Promise<{ success: boolean; message: string }> {
    return apiService.put(`/exams/${examId}/publish-results`, {});
  },

  async getStats(examId: string): Promise<any> {
    return apiService.get(`/exams/${examId}/stats`);
  },
};

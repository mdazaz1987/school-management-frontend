import apiService from './api';

export const studentQuizService = {
  async list(studentId: string, params?: { classId?: string; section?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.classId) query.append('classId', params.classId);
    if (params?.section) query.append('section', params.section);
    return apiService.get(`/students/${studentId}/quizzes?${query.toString()}`);
  },

  async start(studentId: string, quizId: string): Promise<{ submissionId: string; attemptNo: number; expiresAt?: string; expiresAtEpochMs?: number; quiz: any }> {
    return apiService.post(`/students/${studentId}/quizzes/${quizId}/start`, {});
  },

  async submit(studentId: string, quizId: string, submissionId: string, payload: { answers: Array<{ questionId: string; selected: number[]; timeSpentSeconds?: number }> }): Promise<any> {
    return apiService.post(`/students/${studentId}/quizzes/${quizId}/submit/${submissionId}`, payload);
  },

  async getResults(studentId: string, quizId: string): Promise<Array<{ attemptNo: number; score: number; totalPoints: number; passed?: boolean; submittedAt?: string }>> {
    return apiService.get(`/students/${studentId}/quizzes/${quizId}/results`);
  },

  async getStats(studentId: string, quizId: string): Promise<{ totalPoints: number; participants: number; averageScore: number; topScore: number; myBest: number; rank: number; myPercentage?: number; topPercentage?: number; avgPercentage?: number; percentile?: number }>{
    return apiService.get(`/students/${studentId}/quizzes/${quizId}/stats`);
  },
};

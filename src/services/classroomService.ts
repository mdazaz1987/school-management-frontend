import apiService from './api';
import { Classroom, DayOfWeek } from '../types';

export const classroomService = {
  async list(params: { schoolId: string }): Promise<Classroom[]> {
    const { schoolId } = params;
    return apiService.get<Classroom[]>(`/classrooms?schoolId=${encodeURIComponent(schoolId)}`);
  },

  async getAvailability(args: {
    schoolId: string;
    day: DayOfWeek;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    excludeTimetableId?: string;
  }): Promise<Classroom[]> {
    const { schoolId, day, startTime, endTime, excludeTimetableId } = args;
    const q = new URLSearchParams({ schoolId, day, startTime, endTime });
    if (excludeTimetableId) q.set('excludeTimetableId', excludeTimetableId);
    return apiService.get<Classroom[]>(`/classrooms/availability?${q.toString()}`);
  },
};

import apiService from './api';
import { Timetable, TimetableEntry, DayOfWeek } from '../types';

const ensureSeconds = (t?: string): string | undefined => {
  if (!t) return t;
  // Convert HH:mm to HH:mm:00 if needed
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  return t;
};

// Helpers
const normalizeTimetable = (t: any): Timetable => {
  return {
    id: t.id,
    schoolId: t.schoolId,
    classId: t.classId,
    section: t.section,
    academicYear: t.academicYear,
    term: t.term,
    entries: (t.entries || []).map((e: any) => ({
      day: e.day,
      period: e.period,
      startTime: e.startTime,
      endTime: e.endTime,
      subjectId: e.subjectId,
      subjectName: e.subjectName,
      teacherId: e.teacherId,
      teacherName: e.teacherName,
      room: e.room,
      periodType: e.periodType,
    })),
    isActive: t.isActive ?? t.active ?? false,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  } as Timetable;
};

export const timetableService = {
  async list(params?: { schoolId?: string; academicYear?: string }): Promise<Timetable[]> {
    const data = await apiService.get<any[]>('/timetables', params);
    return (data || []).map(normalizeTimetable);
  },

  async getById(id: string): Promise<Timetable> {
    const data = await apiService.get<any>(`/timetables/${id}`);
    return normalizeTimetable(data);
  },

  async getByClass(classId: string, section?: string): Promise<Timetable> {
    const params: any = {};
    if (section) params.section = section;
    const data = await apiService.get<any>(`/timetables/class/${classId}`, params);
    return normalizeTimetable(data);
  },

  async create(data: Partial<Timetable>): Promise<Timetable> {
    const payload: any = {
      schoolId: data.schoolId,
      classId: data.classId,
      section: data.section,
      academicYear: data.academicYear,
      term: data.term,
      entries: (data.entries || []).map((e) => ({
        ...e,
        startTime: ensureSeconds(e.startTime),
        endTime: ensureSeconds(e.endTime),
      } as TimetableEntry)),
    };
    const created = await apiService.post<any>('/timetables', payload);
    return normalizeTimetable(created);
  },

  async update(id: string, data: Partial<Timetable>): Promise<Timetable> {
    const payload: any = {
      schoolId: data.schoolId,
      classId: data.classId,
      section: data.section,
      academicYear: data.academicYear,
      term: data.term,
      entries: (data.entries || []).map((e) => ({
        ...e,
        startTime: ensureSeconds(e.startTime),
        endTime: ensureSeconds(e.endTime),
      } as TimetableEntry)),
    };
    const updated = await apiService.put<any>(`/timetables/${id}`, payload);
    return normalizeTimetable(updated);
  },

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/timetables/${id}`);
  },

  async addEntry(id: string, entry: TimetableEntry): Promise<Timetable> {
    const payload = { ...entry, startTime: ensureSeconds(entry.startTime), endTime: ensureSeconds(entry.endTime) };
    return apiService.post<Timetable>(`/timetables/${id}/entries`, payload);
  },

  async updateEntry(id: string, index: number, entry: TimetableEntry): Promise<Timetable> {
    const payload = { ...entry, startTime: ensureSeconds(entry.startTime), endTime: ensureSeconds(entry.endTime) };
    return apiService.put<Timetable>(`/timetables/${id}/entries/${index}`, payload);
  },

  async deleteEntry(id: string, index: number): Promise<Timetable> {
    return apiService.delete<Timetable>(`/timetables/${id}/entries/${index}`);
  },

  async getEntriesByDay(id: string, day: DayOfWeek): Promise<TimetableEntry[]> {
    return apiService.get<TimetableEntry[]>(`/timetables/${id}/day/${day}`);
  },

  async toggleActive(id: string): Promise<{ success: boolean; message: string }> {
    return apiService.put(`/timetables/${id}/toggle-active`, {});
  },
};

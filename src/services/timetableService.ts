import apiService from './api';
import { Timetable, TimetableEntry, DayOfWeek } from '../types';

const ensureSeconds = (t?: string): string | undefined => {
  if (!t) return t;
  // Convert HH:mm to HH:mm:00 if needed
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  return t;
};

export const timetableService = {
  async list(params?: { schoolId?: string; academicYear?: string }): Promise<Timetable[]> {
    const data = await apiService.get<any[]>('/timetables', params);
    return (data || []) as Timetable[];
  },

  async getById(id: string): Promise<Timetable> {
    return apiService.get<Timetable>(`/timetables/${id}`);
  },

  async getByClass(classId: string, section?: string): Promise<Timetable> {
    const params: any = {};
    if (section) params.section = section;
    return apiService.get<Timetable>(`/timetables/class/${classId}`, params);
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
    return apiService.post<Timetable>('/timetables', payload);
  },

  async update(id: string, data: Partial<Timetable>): Promise<Timetable> {
    const payload: any = {
      section: data.section,
      academicYear: data.academicYear,
      term: data.term,
      entries: (data.entries || []).map((e) => ({
        ...e,
        startTime: ensureSeconds(e.startTime),
        endTime: ensureSeconds(e.endTime),
      } as TimetableEntry)),
    };
    return apiService.put<Timetable>(`/timetables/${id}`, payload);
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

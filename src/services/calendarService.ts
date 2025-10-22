import apiService from './api';

export interface CalendarEvent {
  id: string;
  schoolId: string;
  title: string;
  type: 'HOLIDAY' | 'EVENT';
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate?: string;  // ISO date (YYYY-MM-DD)
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

const storageKey = (schoolId?: string) => `calendar_events_${schoolId || 'default'}`;

function fromLocal(schoolId?: string): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(storageKey(schoolId));
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function toLocal(schoolId: string | undefined, list: CalendarEvent[]) {
  try { localStorage.setItem(storageKey(schoolId), JSON.stringify(list)); } catch {}
}

export const calendarService = {
  async list(schoolId?: string): Promise<CalendarEvent[]> {
    try {
      return await apiService.get('/calendar', schoolId ? { schoolId } : undefined);
    } catch {
      return fromLocal(schoolId);
    }
  },

  async upcoming(schoolId?: string, days = 60): Promise<CalendarEvent[]> {
    const today = new Date();
    const end = new Date(today.getTime() + days * 86400000);
    const items = await this.list(schoolId);
    return items.filter((e) => {
      const sd = new Date(e.startDate);
      const ed = e.endDate ? new Date(e.endDate) : sd;
      return ed >= today && sd <= end;
    }).sort((a, b) => (a.startDate > b.startDate ? 1 : a.startDate < b.startDate ? -1 : 0));
  },

  async create(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    try {
      return await apiService.post('/calendar', event);
    } catch {
      // Fallback to local storage
      const schoolId = event.schoolId;
      const list = fromLocal(schoolId);
      const created: CalendarEvent = { ...event, id: `${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      list.push(created);
      toLocal(schoolId, list);
      return created;
    }
  },

  async remove(id: string, schoolId?: string): Promise<void> {
    try {
      await apiService.delete(`/calendar/${id}`);
    } catch {
      const list = fromLocal(schoolId);
      toLocal(schoolId, list.filter((e) => e.id !== id));
    }
  },
};

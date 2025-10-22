import apiService from './api';

export interface GalleryImage {
  id: string;
  schoolId: string;
  title?: string;
  event?: string;
  url: string; // image URL (server-hosted) or data URL (fallback)
  createdAt?: string;
}

const storageKey = (schoolId?: string) => `gallery_images_${schoolId || 'default'}`;

function fromLocal(schoolId?: string): GalleryImage[] {
  try {
    const raw = localStorage.getItem(storageKey(schoolId));
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

function toLocal(schoolId: string | undefined, list: GalleryImage[]) {
  try { localStorage.setItem(storageKey(schoolId), JSON.stringify(list)); } catch {}
}

export const galleryService = {
  async list(schoolId?: string): Promise<GalleryImage[]> {
    try {
      return await apiService.get('/gallery', schoolId ? { schoolId } : undefined);
    } catch {
      return fromLocal(schoolId);
    }
  },
  async create(data: { schoolId: string; title?: string; event?: string; file?: File; dataUrl?: string }): Promise<GalleryImage> {
    // Try API first
    try {
      if (data.file) {
        const form = new FormData();
        form.append('file', data.file);
        if (data.title) form.append('title', data.title);
        if (data.event) form.append('event', data.event);
        const axios = apiService.getAxiosInstance();
        const resp = await axios.post('/gallery' as any, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        return resp.data as GalleryImage;
      }
      // no file, maybe direct URL
      const created = await apiService.post('/gallery', { title: data.title, event: data.event, url: data.dataUrl, schoolId: data.schoolId });
      return created as GalleryImage;
    } catch {
      // Fallback: save to local storage
      const list = fromLocal(data.schoolId);
      const url = data.dataUrl || '';
      const created: GalleryImage = { id: `${Date.now()}`, schoolId: data.schoolId, title: data.title, event: data.event, url, createdAt: new Date().toISOString() };
      list.unshift(created);
      toLocal(data.schoolId, list);
      return created;
    }
  },
  async remove(id: string, schoolId?: string): Promise<void> {
    try { await apiService.delete(`/gallery/${id}`); }
    catch { const list = fromLocal(schoolId); toLocal(schoolId, list.filter(i => i.id !== id)); }
  }
};

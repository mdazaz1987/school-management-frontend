import apiService from './api';
import { School } from '../types';

export const schoolService = {
  async getById(id: string): Promise<School> {
    return apiService.get<School>(`/admin/schools/${id}`);
  },

  async update(id: string, data: Partial<School>): Promise<School> {
    // Pass nested structure as-is; backend expects School model
    const payload: any = {
      name: data.name,
      logo: data.logo,
      contactInfo: data.contactInfo,
      address: data.address,
      configuration: data.configuration,
      cmsPages: data.cmsPages,
      branding: data.branding,
    };
    return apiService.put<School>(`/admin/schools/${id}`, payload);
  },

  async list(): Promise<School[]> {
    return apiService.get<School[]>(`/admin/schools`);
  },
};

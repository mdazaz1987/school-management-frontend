import apiService from './api';
import { School } from '../types';

export const schoolService = {
  async getById(id: string): Promise<School> {
    // Backend exposes configuration (and school object) via this endpoint
    return apiService.get<School>(`/admin/schools/${id}/configuration`);
  },

  async create(data: Partial<School>): Promise<School> {
    return apiService.post<School>(`/admin/schools`, data);
  },

  async update(id: string, data: Partial<School>): Promise<School> {
    // Backend expects School model at /configuration path
    const payload: any = {
      name: data.name,
      logo: data.logo,
      contactInfo: data.contactInfo,
      address: data.address,
      configuration: data.configuration,
      cmsPages: data.cmsPages,
      branding: data.branding,
    };
    return apiService.put<School>(`/admin/schools/${id}/configuration`, payload);
  },

  async list(): Promise<School[]> {
    return apiService.get<School[]>(`/admin/schools`);
  },

  async getPublicBasic(id: string): Promise<{
    id: string;
    name: string;
    logo?: string;
    branding?: any;
    address?: { street?: string; city?: string; state?: string; zipCode?: string };
    contactInfo?: { phone?: string; email?: string; website?: string };
    configuration?: { academicYear?: string; currency?: string; timezone?: string; gstin?: string; gstRate?: number; principalName?: string; principalSignatureUrl?: string };
  }> {
    return apiService.get(`/schools/${id}/public`);
  },
};

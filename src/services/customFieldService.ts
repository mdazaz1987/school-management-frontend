import apiService from './api';
import { CustomFieldConfig } from '../types';

export const customFieldService = {
  async getAllCustomFields(params?: {
    entityType?: string;
    schoolId?: string;
    activeOnly?: boolean;
  }): Promise<CustomFieldConfig[]> {
    return apiService.get<CustomFieldConfig[]>('/custom-fields', params);
  },

  async getCustomFieldById(id: string): Promise<CustomFieldConfig> {
    return apiService.get<CustomFieldConfig>(`/custom-fields/${id}`);
  },

  async createCustomField(data: Partial<CustomFieldConfig>): Promise<CustomFieldConfig> {
    return apiService.post<CustomFieldConfig>('/custom-fields', data);
  },

  async updateCustomField(id: string, data: Partial<CustomFieldConfig>): Promise<CustomFieldConfig> {
    return apiService.put<CustomFieldConfig>(`/custom-fields/${id}`, data);
  },

  async deleteCustomField(id: string): Promise<void> {
    return apiService.delete<void>(`/custom-fields/${id}`);
  },

  async toggleActiveStatus(id: string): Promise<CustomFieldConfig> {
    return apiService.patch<CustomFieldConfig>(`/custom-fields/${id}/toggle-active`);
  },

  async reorderFields(reorderRequests: { id: string; displayOrder: number }[]): Promise<void> {
    return apiService.put<void>('/custom-fields/reorder', reorderRequests);
  },
};

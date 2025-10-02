import apiService from './api';
import { User } from '../types';

export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const profileService = {
  // Get current user profile
  async getProfile(): Promise<User> {
    return apiService.get<User>('/profile');
  },

  // Update profile
  async updateProfile(data: ProfileUpdateData): Promise<User> {
    return apiService.put<User>('/profile', data);
  },

  // Change password
  async changePassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    return apiService.put('/profile/password', data);
  },

  // Upload profile photo
  async uploadPhoto(file: File): Promise<{ success: boolean; message: string; photoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return apiService.post('/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get profile photo URL
  getPhotoUrl(filename: string | null | undefined): string | null {
    if (!filename) return null;
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    return `${API_BASE_URL}/profile/photo/${filename}`;
  },

  // Delete profile photo
  async deletePhoto(): Promise<{ success: boolean; message: string }> {
    return apiService.delete('/profile/photo');
  },
};

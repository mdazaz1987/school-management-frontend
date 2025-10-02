import apiService from './api';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    // First, login to get token
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    
    if (response.accessToken) {
      // Store token
      localStorage.setItem('token', response.accessToken);
      
      // Decode JWT to get user info (basic decoding, just get the payload)
      try {
        const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
        console.log('JWT Payload:', payload);
        
        // Create user object from JWT payload
        const user: User = {
          id: payload.sub || payload.userId || '',
          email: payload.email || credentials.email,
          firstName: payload.firstName || '',
          lastName: payload.lastName || '',
          // Handle both comma-separated string and array format
          roles: typeof payload.roles === 'string' 
            ? payload.roles.split(',').map((r: string) => r.trim().replace('ROLE_', ''))
            : (payload.roles || payload.authorities?.map((a: string) => a.replace('ROLE_', '')) || []),
          schoolId: payload.schoolId || '',
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        
        console.log('Parsed user from JWT:', user);
        localStorage.setItem('user', JSON.stringify(user));
        
        return { user, token: response.accessToken };
      } catch (error) {
        console.error('Error decoding JWT:', error);
        throw new Error('Failed to decode authentication token');
      }
    }
    
    throw new Error('No access token received');
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/register', data);
  },

  async getCurrentUser(): Promise<User> {
    return apiService.get<User>('/auth/me');
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

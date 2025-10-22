import axios, { AxiosInstance, AxiosError } from 'axios';

// Infer API base URL at runtime. This prevents accidental localhost calls in production.
function inferApiBaseUrl(): string {
  // 1) Respect explicit env if provided at build time
  if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim() !== '') {
    return process.env.REACT_APP_API_URL;
  }

  // 2) If running in browser, infer from current hostname
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname } = window.location;
    // Common setup: frontend served on :4001, backend on :9090
    // Fallback to same host with backend port 9090
    return `${protocol}//${hostname}:9090/api`;
  }

  // 3) Dev fallback
  return 'http://localhost:8080/api';
}

const API_BASE_URL = inferApiBaseUrl();
// Try to derive the API origin (scheme+host+port) from API_BASE_URL
const API_ORIGIN = (() => {
  try {
    const u = new URL(API_BASE_URL);
    return u.origin;
  } catch {
    try { return window.location.origin; } catch { return ''; }
  }
})();

// Resolve a URL or API path (like "/api/..." or "//host/..." or absolute) to an absolute URL
export function resolveUrl(pathOrUrl: string): string {
  try {
    if (!pathOrUrl) return '';
    // Already absolute (http/https)
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    // API path -> resolve against API origin so it hits backend server, not frontend origin
    if (pathOrUrl.startsWith('/api/')) return `${API_ORIGIN}${pathOrUrl}`;
    // Protocol-relative
    if (/^\/\//.test(pathOrUrl)) return `${window.location.protocol}${pathOrUrl}`;
    // Starts with / -> relative to current origin
    if (pathOrUrl.startsWith('/')) return `${window.location.origin}${pathOrUrl}`;
    // Otherwise return as-is
    return pathOrUrl;
  } catch {
    return pathOrUrl;
  }
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Log the resolved API base URL once
    try {
      // eslint-disable-next-line no-console
      console.log('[API] Using base URL:', API_BASE_URL);
    } catch {}

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        console.log('[API Interceptor] Request:', {
          url: config.url,
          method: config.method,
          baseURL: config.baseURL,
          fullURL: (config.baseURL || '') + (config.url || ''),
          hasToken: !!token,
          tokenPreview: token ? token.substring(0, 50) + '...' : 'No token',
        });
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('[API Interceptor] Authorization header set');
        } else {
          console.warn('[API Interceptor] No token found in localStorage!');
        }
        
        console.log('[API Interceptor] Final headers:', config.headers);
        return config;
      },
      (error) => {
        console.error('[API Interceptor] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.api.get<T>(url, { params });
    return response.data;
  }

  // For paginated endpoints that need full response
  async getWithFullResponse<T>(url: string, params?: any): Promise<T> {
    const response = await this.api.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete<T>(url);
    return response.data;
  }

  // Method to get raw axios instance for special cases
  getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

export const apiService = new ApiService();
export default apiService;

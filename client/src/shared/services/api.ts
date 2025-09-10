/**
 * Base API client for all services
 * Centralized HTTP client with error handling and authentication
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
// import { STORAGE_KEYS } from '@shared/constants'; // TODO: Fix constants

const baseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL,
      withCredentials: true,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Log errors in development
        if (import.meta.env.DEV && 
            !(error.response?.status === 401 && error.config?.url?.includes('/auth/me')) &&
            !(!error.response && error.config?.url?.includes('/auth/me'))) {
          console.group('API ERROR');
          console.error('Request URL:', error.config?.url);
          console.error('Request Method:', error.config?.method);
          console.error('Response Status:', error.response?.status);
          console.error('Response Data:', error.response?.data);
          console.error('Timestamp:', new Date().toISOString());
          console.groupEnd();
        }

        // Handle 401 errors
        if (error.response?.status === 401) {
          if (!error.config?.url?.includes('/auth/me')) {
            console.log('🟡 API: Got 401 error, user not authenticated');
          }
          this.clearAuthToken();
          return Promise.reject(error);
        }

        // Handle server errors
        if (error.response?.status >= 500) {
          console.log('🟡 API: Got 5xx error, but skipping redirect for debugging');
          return Promise.reject(error);
        }

        // Handle network errors
        if (!error.response && error.code !== 'ERR_CANCELED') {
          if (!error.config?.url?.includes('/auth/me')) {
            console.log('🟡 API: Network error - server may be down');
          }
          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  // Auth Token Management
  getAuthToken(): string | null {
    try {
      return localStorage.getItem('authToken'); // STORAGE_KEYS.AUTH_TOKEN
    } catch (error) {
      console.warn('Failed to get auth token from localStorage:', error);
      return null;
    }
  }

  setAuthToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
    } catch (error) {
      console.warn('Failed to set auth token in localStorage:', error);
    }
  }

  clearAuthToken(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.warn('Failed to clear auth token:', error);
    }
  }

  // Get raw axios instance for advanced usage
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

// Helper functions  
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token); // STORAGE_KEYS.AUTH_TOKEN
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('authToken'); // STORAGE_KEYS.AUTH_TOKEN
};

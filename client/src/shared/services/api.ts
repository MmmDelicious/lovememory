import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

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
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;


        if (error.response?.status === 401) {
          this.clearAuthToken();
          return Promise.reject(error);
        }

        if (error.response?.status >= 500) {
          return Promise.reject(error);
        }

        if (!error.response && error.code !== 'ERR_CANCELED') {
          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );
  }
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

  getAuthToken(): string | null {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  }

  setAuthToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
    }
  }

  clearAuthToken(): void {
    try {
      localStorage.removeItem('authToken');
    } catch (error) {
    }
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient;

export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

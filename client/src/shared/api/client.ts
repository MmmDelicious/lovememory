/**
 * Base API client with improved architecture
 */
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api')

export interface ApiResponse<T = any> {
  data: T
  status: 'success' | 'error'
  message?: string
}

class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL,
      withCredentials: true,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add request timestamp for debugging
        if (import.meta.env.DEV) {
          config.metadata = { startTime: Date.now() }
        }
        return config
      },
      (error: AxiosError) => Promise.reject(error)
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log request duration in development
        if (import.meta.env.DEV && response.config.metadata) {
          const duration = Date.now() - response.config.metadata.startTime
          console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)
        }
        return response.data
      },
      async (error: AxiosError) => {
        await this.handleApiError(error)
        return Promise.reject(error)
      }
    )
  }

  private async handleApiError(error: AxiosError) {
    // Only log errors in development, excluding expected 401s for auth checks
    if (import.meta.env.DEV && 
        !(error.response?.status === 401 && error.config?.url?.includes('/auth/me'))) {
      console.group('🚨 API Error')
      console.error('URL:', error.config?.url)
      console.error('Method:', error.config?.method?.toUpperCase())
      console.error('Status:', error.response?.status)
      console.error('Data:', error.response?.data)
      console.groupEnd()
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Let the component/hook handle auth state cleanup
      // httpOnly cookies are managed by the server
    }

    // Handle server errors
    if (error.response?.status && error.response.status >= 500) {
      console.error('[API] Server error:', error.response.status)
    }

    // Handle network errors
    if (!error.response && error.code !== 'ERR_CANCELED') {
      console.error('[API] Network error - server may be unreachable')
    }
  }

  // HTTP methods
  async get<T = any>(url: string, config?: any): Promise<T> {
    return this.instance.get(url, config)
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.instance.post(url, data, config)
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.instance.put(url, data, config)
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.instance.patch(url, data, config)
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    return this.instance.delete(url, config)
  }

  // File upload helper
  async uploadFile<T = any>(url: string, file: File, config?: any): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)
    
    return this.instance.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    })
  }

  // Get base URLs for file access
  get apiBaseURL(): string {
    return baseURL
  }

  get filesBaseURL(): string {
    return baseURL.replace(/\/?api$/, '')
  }
}

// Singleton instance
export const apiClient = new ApiClient()
export default apiClient

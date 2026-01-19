// API Configuration
const API_BASE_URL = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL 
  : 'http://localhost:8000'

// API Client with interceptors
class APIClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Merge custom headers
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }


    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    })

    // Handle 401 - Try to refresh token
    if (response.status === 401 && token) {
      const refreshed = await this.refreshToken()
      if (refreshed) {
        // Retry the original request
        return this.request(endpoint, options)
      } else {
        // Refresh failed - logout
        if (typeof window !== 'undefined') {
          localStorage.clear()
          window.location.href = '/login'
        }
        throw new Error('Session expired')
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
      
      // Handle different error formats
      let errorMessage = `HTTP ${response.status}`
      
      if (typeof error.detail === 'string') {
        errorMessage = error.detail
      } else if (Array.isArray(error.detail)) {
        // Validation errors from FastAPI
        errorMessage = error.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ')
      } else if (error.detail && typeof error.detail === 'object') {
        errorMessage = JSON.stringify(error.detail)
      } else if (error.message) {
        errorMessage = error.message
      }
      
      throw new Error(errorMessage)
    }

    return response.json()
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
      if (!refreshToken) return false

      const response = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.access_token)
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    const formData = new FormData()
    formData.append('file', file)

    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
      throw new Error(error.detail)
    }

    return response.json()
  }

}

export const api = new APIClient(API_BASE_URL)

import { api } from '../api-client'
import type { User } from '../types'

interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

interface RegisterData {
  email: string
  password: string
  full_name: string
  student_id?: string
}

export const authAPI = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return api.post<LoginResponse>('/api/v1/auth/login', { email, password })
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    return api.post<LoginResponse>('/api/v1/auth/register', data)
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/v1/auth/logout')
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.clear()
      }
    }
  },

  async getCurrentUser(): Promise<User> {
    return api.get<User>('/api/v1/users/me')
  },
}

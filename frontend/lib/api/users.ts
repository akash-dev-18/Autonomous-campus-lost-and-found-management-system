import { api } from '../api-client'
import type { User } from '../types'

interface UpdateProfileData {
  full_name?: string
  phone?: string
}

export const usersAPI = {
  async getProfile(): Promise<User> {
    return api.get<User>('/api/v1/users/me')
  },

  async updateProfile(data: UpdateProfileData): Promise<User> {
    return api.put<User>('/api/v1/users/me', data)
  },

  async searchUsers(query: string): Promise<User[]> {
    return api.get<User[]>(`/api/v1/users/search/?query=${encodeURIComponent(query)}`)
  },

  async listUsers(): Promise<User[]> {
    return api.get<User[]>('/api/v1/users/')
  },

  async getUser(userId: string): Promise<User> {
    return api.get<User>(`/api/v1/users/${userId}`)
  },
}

import { api } from '../api-client'
import type { Item } from '../types'

interface ItemsResponse {
  items: Item[]
  total: number
  skip: number
  limit: number
}

interface ItemFilters {
  type?: 'lost' | 'found'
  category?: string
  status?: 'active' | 'claimed' | 'returned'
  location?: string
  search?: string
  skip?: number
  limit?: number
}

export const itemsAPI = {
  async getItems(filters: ItemFilters = {}): Promise<ItemsResponse> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
    const query = params.toString()
    return api.get<ItemsResponse>(`/api/v1/items/${query ? `?${query}` : ''}`)
  },

  async getItem(id: string): Promise<Item> {
    return api.get<Item>(`/api/v1/items/${id}`)
  },

  async createItem(data: Partial<Item>): Promise<Item> {
    return api.post<Item>('/api/v1/items/', data)
  },

  async updateItem(id: string, data: Partial<Item>): Promise<Item> {
    return api.put<Item>(`/api/v1/items/${id}`, data)
  },

  async deleteItem(id: string): Promise<void> {
    return api.delete(`/api/v1/items/${id}`)
  },

  async uploadImage(itemId: string, file: File): Promise<{ image_url: string }> {
    return api.uploadFile(`/api/v1/items/${itemId}/upload-image`, file)
  },

  async getMyItems(): Promise<Item[]> {
    return api.get<Item[]>('/api/v1/items/user/me')
  },
}

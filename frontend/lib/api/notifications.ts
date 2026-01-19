import { api } from '../api-client'
import type { Notification } from '../types'

interface NotificationsResponse {
  notifications: Notification[]
}

export const notificationsAPI = {
  async getNotifications(isRead?: boolean, limit?: number): Promise<Notification[]> {
    const params = new URLSearchParams()
    if (isRead !== undefined) params.append('is_read', String(isRead))
    if (limit) params.append('limit', String(limit))
    const query = params.toString()
    
    const response = await api.get<NotificationsResponse>(`/api/v1/notifications/${query ? `?${query}` : ''}`)
    return response.notifications || []
  },

  async markAsRead(id: string): Promise<Notification> {
    return api.put<Notification>(`/api/v1/notifications/${id}/read`, {})
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/api/v1/notifications/read-all', {})
  },
}

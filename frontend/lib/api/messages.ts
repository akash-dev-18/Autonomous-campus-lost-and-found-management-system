import { api } from '../api-client'
import type { Message } from '../types'

interface SendMessageData {
  receiver_id: string
  content: string
}

export const messagesAPI = {
  async getConversations(): Promise<any[]> {
    // Backend returns list of conversations with user info
    return api.get<any[]>('/api/v1/messages/conversations')
  },

  async getMessages(userId: string): Promise<Message[]> {
    // Get conversation with specific user
    return api.get<Message[]>(`/api/v1/messages/conversations/${userId}`)
  },

  async sendMessage(data: SendMessageData): Promise<Message> {
    return api.post<Message>('/api/v1/messages/', data)
  },

  async markAsRead(messageId: string): Promise<Message> {
    return api.put<Message>(`/api/v1/messages/${messageId}/read`, {})
  },
}

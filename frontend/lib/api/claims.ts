import { api } from '../api-client'
import type { Claim } from '../types'

interface CreateClaimData {
  item_id: string
  verification_answers: Record<string, any>
}

export const claimsAPI = {
  async getClaims(status?: string): Promise<Claim[]> {
    const query = status ? `?status=${status}` : ''
    return api.get<Claim[]>(`/api/v1/claims/${query}`)
  },

  async createClaim(data: CreateClaimData): Promise<Claim> {
    return api.post<Claim>('/api/v1/claims/', data)
  },

  async updateClaimStatus(id: string, status: string): Promise<Claim> {
    return api.put<Claim>(`/api/v1/claims/${id}/status`, { status })
  },
}

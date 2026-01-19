import { api } from '../api-client'
import type { Match } from '../types'

interface MatchesResponse {
  matches: Match[]
}

export const matchesAPI = {
  async getItemMatches(itemId: string): Promise<Match[]> {
    return api.get<Match[]>(`/api/v1/matches/item/${itemId}`)
  },

  async getMyMatches(): Promise<Match[]> {
    // TODO: Backend endpoint /my-matches doesn't exist yet
    // Return empty array for now
    return Promise.resolve([])
  },
}

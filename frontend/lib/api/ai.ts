import { api } from '../api-client'

export interface AIAnalysisResult {
  category: string
  tags: string[]
  confidence: number
}

export const aiAPI = {
  async analyzeImage(file: File): Promise<AIAnalysisResult> {
    return api.uploadFile<AIAnalysisResult>('/api/v1/ai/analyze-image', file)
  },
}

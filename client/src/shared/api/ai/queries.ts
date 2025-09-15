/**
 * AI API queries and mutations
 */
import { apiClient } from '../client'
import type { AIChatRequest, AIResponse } from './types'

const AI_ENDPOINTS = {
  CHAT: '/ai/chat',
  RECOMMENDATIONS: '/ai/recommendations',
} as const

export class AIAPI {
  /**
   * Send message to AI chat
   */
  async askAI(data: AIChatRequest): Promise<AIResponse> {
    try {
      return await apiClient.post<AIResponse>(AI_ENDPOINTS.CHAT, data)
    } catch (error: any) {
      // Provide user-friendly error message
      const errorMessage = error.response?.data?.message || 
                          'Не удалось получить ответ от AI. Попробуйте позже.'
      return { text: errorMessage }
    }
  }

  /**
   * Get AI recommendations
   */
  async getRecommendations(context?: any): Promise<AIResponse> {
    return apiClient.post<AIResponse>(AI_ENDPOINTS.RECOMMENDATIONS, { context })
  }
}

// Singleton instance
export const aiAPI = new AIAPI()
export default aiAPI

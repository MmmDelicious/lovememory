/**
 * Recommendations API queries and mutations
 */
import { apiClient } from '../client'
import type {
  RecommendationItem,
  RecommendationsRequest,
  RecommendationClickRequest,
  ModelMetrics,
  ModelWeights
} from './types'

const RECOMMENDATIONS_ENDPOINTS = {
  RECOMMENDATIONS: (pairId: string) => `/recommendations/${pairId}`,
  CLICK: (pairId: string) => `/recommendations/${pairId}/click`,
  METRICS: '/recommendations/metrics',
  WEIGHTS: '/recommendations/weights',
} as const

export class RecommendationsAPI {
  /**
   * Get recommendations for a pair
   */
  async getRecommendations(
    pairId: string, 
    topK: number = 10, 
    userLocation?: { lat: number; lon: number }
  ): Promise<RecommendationItem[]> {
    const params: any = { top_k: topK }
    
    if (userLocation) {
      params.user_location = JSON.stringify(userLocation)
    }

    return apiClient.get<RecommendationItem[]>(
      RECOMMENDATIONS_ENDPOINTS.RECOMMENDATIONS(pairId),
      { params }
    )
  }

  /**
   * Log recommendation click
   */
  async logRecommendationClick(pairId: string, item: RecommendationClickRequest['item']): Promise<any> {
    return apiClient.post<any>(RECOMMENDATIONS_ENDPOINTS.CLICK(pairId), {
      item_id: item.item_id,
      item_title: item.title,
      score: item.score
    })
  }

  /**
   * Get model metrics
   */
  async getModelMetrics(): Promise<ModelMetrics> {
    return apiClient.get<ModelMetrics>(RECOMMENDATIONS_ENDPOINTS.METRICS)
  }

  /**
   * Update model weights
   */
  async updateModelWeights(weights: ModelWeights): Promise<any> {
    return apiClient.put<any>(RECOMMENDATIONS_ENDPOINTS.WEIGHTS, { weights })
  }
}

export const recommendationsAPI = new RecommendationsAPI()
export default recommendationsAPI

/**
 * Recommendations domain types
 */

export interface RecommendationItem {
  item_id: string
  title: string
  category: string
  score: number
  reasons: string[]
  price: number
  location?: [number, number]
}

export interface RecommendationsRequest {
  pairId: string
  topK?: number
  userLocation?: { lat: number; lon: number }
}

export interface RecommendationClickRequest {
  pairId: string
  item: {
    item_id: string
    title: string
    score: number
  }
}

export interface ModelMetrics {
  accuracy?: number
  precision?: number
  recall?: number
  f1_score?: number
  [key: string]: any
}

export interface ModelWeights {
  [key: string]: number
}

/**
 * AI domain types
 */

export interface AIChatRequest {
  prompt: string
  context?: any
}

export interface AIResponse {
  text: string
  suggestions?: string[]
  metadata?: {
    model?: string
    confidence?: number
    responseTime?: number
  }
}

export interface AIError {
  message: string
  code?: string
}

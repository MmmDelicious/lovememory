/**
 * Date Generator domain types
 */

export interface DateOption {
  id: string
  title: string
  category: string
  description: string
  budget: number
  duration: number
  location?: string
  activities: string[]
  reasoning: string[]
}

export interface ReasoningStep {
  id: string
  text: string
  icon?: string
  timestamp: number
}

export interface DateGeneratorResult {
  options: DateOption[]
  reasoning: ReasoningStep[]
  userPreferences: any
}

export interface CreateDateEventRequest {
  selectedOption: DateOption
  selectedDate: string
}

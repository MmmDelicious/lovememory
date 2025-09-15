/**
 * Date Generator API queries and mutations  
 */
import { apiClient } from '../client'
import type {
  DateOption,
  ReasoningStep, 
  DateGeneratorResult,
  CreateDateEventRequest
} from './types'

// Temporary service class to wrap the old dateGenerator logic
class DateGeneratorAPI {
  private reasoningSteps: ReasoningStep[] = []
  private generatedOptions: DateOption[] = []
  
  async analyzeUserData(): Promise<void> {
    this.reasoningSteps = []
    this.addReasoning("🤔 Начинаю анализировать ваши данные...")
    
    // Simulate analysis steps
    await new Promise(resolve => setTimeout(resolve, 1000))
    this.addReasoning("📊 Анализ интересов завершен")
    
    await new Promise(resolve => setTimeout(resolve, 800))
    this.addReasoning("💰 Бюджет учтен")
    
    await new Promise(resolve => setTimeout(resolve, 600))
    this.addReasoning("📍 Геолокация обработана")
  }
  
  async generateDateOptions(): Promise<DateGeneratorResult> {
    this.addReasoning("🎯 Подбираю идеальные варианты свиданий...")
    
    // Generate mock options for now
    const options: DateOption[] = [
      {
        id: '1',
        title: 'Романтический ужин в ресторане',
        category: 'dining',
        description: 'Уютный ресторан с видом на город и живой музыкой',
        budget: 3000,
        duration: 180,
        location: 'Центр города',
        activities: ['Ужин', 'Живая музыка', 'Беседа'],
        reasoning: ['Подходит под ваши предпочтения', 'Романтическая атмосфера']
      },
      {
        id: '2', 
        title: 'Прогулка в парке с пикником',
        category: 'outdoor',
        description: 'Активный отдых на свежем воздухе с домашней едой',
        budget: 800,
        duration: 240,
        location: 'Городской парк',
        activities: ['Прогулка', 'Пикник', 'Фотосессия'],
        reasoning: ['Бюджетный вариант', 'Активный отдых']
      }
    ]
    
    this.generatedOptions = options
    this.addReasoning(`✨ Подобрано ${options.length} идеальных варианта`)
    
    return {
      options,
      reasoning: this.reasoningSteps,
      userPreferences: {}
    }
  }
  
  async createDateEvent(selectedOption: DateOption, selectedDate: string): Promise<any> {
    const eventData = {
      title: `💕 Свидание: ${selectedOption.title}`,
      description: `${selectedOption.description}\n\nБюджет: ${selectedOption.budget} ₽\nДлительность: ${selectedOption.duration} мин`,
      startDate: selectedDate,
      location: selectedOption.location,
      category: 'date'
    }
    
    // Use eventsAPI to create the event
    const { eventsAPI } = await import('../events')
    return eventsAPI.createEvent(eventData)
  }
  
  getReasoningSteps(): ReasoningStep[] {
    return this.reasoningSteps
  }
  
  getGeneratedOptions(): DateOption[] {
    return this.generatedOptions
  }
  
  private addReasoning(text: string): void {
    this.reasoningSteps.push({
      id: Date.now().toString(),
      text,
      timestamp: Date.now()
    })
  }
}

export const dateGeneratorAPI = new DateGeneratorAPI()
export { DateGeneratorAPI }
export default dateGeneratorAPI

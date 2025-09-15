/**
 * Lessons API queries and mutations
 */
import { apiClient } from '../client'
import type { Lesson, LessonProgress } from './types'

const LESSONS_ENDPOINTS = {
  LESSONS: '/lessons',
  LESSON: (id: string) => `/lessons/${id}`,
  PROGRESS: '/lessons/progress',
  LESSON_PROGRESS: (id: string) => `/lessons/${id}/progress`,
} as const

export class LessonsAPI {
  /**
   * Get all lessons
   */
  async getLessons(): Promise<Lesson[]> {
    return apiClient.get<Lesson[]>(LESSONS_ENDPOINTS.LESSONS)
  }

  /**
   * Get lesson by ID
   */
  async getLesson(id: string): Promise<Lesson> {
    return apiClient.get<Lesson>(LESSONS_ENDPOINTS.LESSON(id))
  }

  /**
   * Update lesson progress
   */
  async updateProgress(lessonId: string, progress: number): Promise<LessonProgress> {
    return apiClient.post<LessonProgress>(LESSONS_ENDPOINTS.LESSON_PROGRESS(lessonId), {
      progress
    })
  }

  /**
   * Mark lesson as completed
   */
  async completeLesson(lessonId: string): Promise<LessonProgress> {
    return apiClient.post<LessonProgress>(LESSONS_ENDPOINTS.LESSON_PROGRESS(lessonId), {
      progress: 100,
      completed: true
    })
  }
}

export const lessonsAPI = new LessonsAPI()
export default lessonsAPI

/**
 * Lessons domain types
 */

export interface Lesson {
  id: string
  title: string
  content: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number
  completed?: boolean
  progress?: number
}

export interface LessonProgress {
  lessonId: string
  userId: string
  progress: number
  completed: boolean
  completedAt?: string
}

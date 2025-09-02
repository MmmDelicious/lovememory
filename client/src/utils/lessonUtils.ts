import lessonsData from '../assets/lessons/lessons.json';
import { themes as lessonThemes } from '../assets/lessons';

export interface Lesson {
  id: string;
  title: string;
  text: string;
  source: string;
  tags: string[];
  triggers: {
    love_language: string[];
    context: string[];
    relationship_stage: string[];
    attachment_style: string[];
    gap_days: (number | string)[];
  };
  effect: {
    words: number;
    acts: number;
    gifts: number;
    time: number;
    touch: number;
    heat: number;
  };
  theme: string;
  interactive_type: 'prompt' | 'chat' | 'quiz' | 'photo' | 'choice';
  difficulty_level: number;
  required_streak: number;
  animation_file: string;
  base_coins_reward: number;
  stats_based?: boolean;
}

export interface LessonTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
  lessons: Lesson[];
  color?: string;
}

class LessonUtility {
  private lessons: Lesson[] = lessonsData as Lesson[];

  /**
   * Получить все уроки
   */
  getAllLessons(): Lesson[] {
    return this.lessons;
  }

  /**
   * Получить урок по ID
   */
  getLessonById(id: string): Lesson | null {
    return this.lessons.find(lesson => lesson.id === id) || null;
  }

  /**
   * Получить все темы с их уроками
   */
  getAllThemes(): LessonTheme[] {
    return Object.entries(lessonThemes).map(([themeId, theme]) => ({
      id: themeId,
      name: theme.name,
      description: theme.description,
      icon: theme.icon,
      count: theme.count,
      lessons: this.getLessonsByTheme(themeId)
    }));
  }

  /**
   * Получить уроки по теме
   */
  getLessonsByTheme(themeId: string): Lesson[] {
    return this.lessons.filter(lesson => lesson.theme === themeId);
  }

  /**
   * Получить рекомендованные уроки на основе профиля пользователя
   */
  getRecommendedLessons(userProfile: {
    love_language?: string;
    relationship_stage?: string;
    attachment_style?: string;
    heat_level?: 'low' | 'high';
    last_lesson_days_ago?: number;
    current_streak?: number;
  }, limit: number = 5): Lesson[] {
    const {
      love_language = 'words',
      relationship_stage = 'developing',
      attachment_style = 'secure',
      heat_level = 'low',
      last_lesson_days_ago = 0,
      current_streak = 0
    } = userProfile;

    const context = heat_level === 'high' ? 'high_heat' : 'low_heat';

    // Фильтруем уроки по критериям пользователя
    const filteredLessons = this.lessons.filter(lesson => {
      const triggers = lesson.triggers;
      
      // Проверяем язык любви
      const matchesLoveLanguage = triggers.love_language.includes(love_language) || 
                                 triggers.love_language.includes('any');
      
      // Проверяем контекст (heat level)
      const matchesContext = triggers.context.includes(context) || 
                             triggers.context.includes('any');
      
      // Проверяем стадию отношений
      const matchesStage = triggers.relationship_stage.includes(relationship_stage) || 
                          triggers.relationship_stage.includes('all');
      
      // Проверяем стиль привязанности
      const matchesAttachment = triggers.attachment_style.includes(attachment_style);
      
      // Проверяем требуемую полосу
      const meetsStreakRequirement = lesson.required_streak <= current_streak;
      
      // Проверяем разрыв в днях
      const meetsGapRequirement = this.checkGapRequirement(
        triggers.gap_days, 
        last_lesson_days_ago
      );

      return matchesLoveLanguage && matchesContext && matchesStage && 
             matchesAttachment && meetsStreakRequirement && meetsGapRequirement;
    });

    // Сортируем по приоритету (статистические уроки выше)
    const sortedLessons = filteredLessons.sort((a, b) => {
      // Статистические уроки имеют приоритет
      if (a.stats_based && !b.stats_based) return -1;
      if (!a.stats_based && b.stats_based) return 1;
      
      // Затем по количеству монет
      return b.base_coins_reward - a.base_coins_reward;
    });

    return sortedLessons.slice(0, limit);
  }

  /**
   * Проверить требование разрыва в днях
   */
  private checkGapRequirement(gapDays: (number | string)[], lastLessonDays: number): boolean {
    if (gapDays.length === 0) return true;
    
    const [min, max] = gapDays;
    
    if (typeof min === 'number' && typeof max === 'number') {
      return lastLessonDays >= min && lastLessonDays <= max;
    }
    
    if (typeof min === 'number' && max === 'more') {
      return lastLessonDays >= min;
    }
    
    if (typeof min === 'number') {
      return lastLessonDays >= min;
    }
    
    return true;
  }

  /**
   * Получить случайный урок из темы
   */
  getRandomLessonFromTheme(themeId: string): Lesson | null {
    const themeLessons = this.getLessonsByTheme(themeId);
    if (themeLessons.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * themeLessons.length);
    return themeLessons[randomIndex];
  }

  /**
   * Вычислить награду за урок с учетом стрика и бонусов
   */
  calculateLessonReward(lesson: Lesson, currentStreak: number, isPartnerCompleted: boolean = false): {
    baseCoins: number;
    streakBonus: number;
    partnerBonus: number;
    totalCoins: number;
  } {
    const baseCoins = lesson.base_coins_reward;
    
    // Бонус за стрик (10% за каждый день стрика, максимум 50%)
    const streakMultiplier = Math.min(currentStreak * 0.1, 0.5);
    const streakBonus = Math.floor(baseCoins * streakMultiplier);
    
    // Бонус за совместное выполнение (25%)
    const partnerBonus = isPartnerCompleted ? Math.floor(baseCoins * 0.25) : 0;
    
    const totalCoins = baseCoins + streakBonus + partnerBonus;
    
    return {
      baseCoins,
      streakBonus,
      partnerBonus,
      totalCoins
    };
  }

  /**
   * Получить статистику по темам
   */
  getThemeStats(): { [themeId: string]: { count: number; totalReward: number } } {
    const stats: { [themeId: string]: { count: number; totalReward: number } } = {};
    
    this.lessons.forEach(lesson => {
      if (!stats[lesson.theme]) {
        stats[lesson.theme] = { count: 0, totalReward: 0 };
      }
      stats[lesson.theme].count++;
      stats[lesson.theme].totalReward += lesson.base_coins_reward;
    });
    
    return stats;
  }

  /**
   * Поиск уроков по тегам
   */
  searchLessonsByTags(tags: string[]): Lesson[] {
    return this.lessons.filter(lesson => 
      lesson.tags.some(tag => 
        tags.some(searchTag => 
          tag.toLowerCase().includes(searchTag.toLowerCase())
        )
      )
    );
  }

  /**
   * Получить уроки по уровню сложности
   */
  getLessonsByDifficulty(difficulty: number): Lesson[] {
    return this.lessons.filter(lesson => lesson.difficulty_level === difficulty);
  }

  /**
   * Получить уроки по интерактивному типу
   */
  getLessonsByInteractiveType(type: 'prompt' | 'chat' | 'quiz' | 'photo' | 'choice'): Lesson[] {
    return this.lessons.filter(lesson => lesson.interactive_type === type);
  }
}

export const lessonUtils = new LessonUtility();
export default lessonUtils;

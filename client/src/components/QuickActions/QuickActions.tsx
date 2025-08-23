import React, { useState } from 'react';
import { Calendar, BookOpen, Gift, Coffee, MapPin, Heart, Clock, ArrowRight, Sparkles } from 'lucide-react';
import styles from './QuickActions.module.css';

interface QuickAction {
  id: string;
  type: 'book' | 'lesson' | 'gift' | 'date' | 'plan' | 'surprise';
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  gradient: string;
  estimatedTime?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  cost?: 'free' | 'low' | 'medium' | 'high';
  handler: () => void;
  popular?: boolean;
}

interface QuickActionsProps {
  recommendations: QuickAction[];
  title?: string;
  subtitle?: string;
  maxVisible?: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  recommendations,
  title = "Рекомендуемые действия",
  subtitle = "Основано на анализе ваших отношений",
  maxVisible = 6
}) => {
  const [visibleCount, setVisibleCount] = useState(maxVisible);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'Легко';
      case 'medium': return 'Средне';
      case 'hard': return 'Сложно';
      default: return '';
    }
  };

  const getCostIcon = (cost?: string) => {
    switch (cost) {
      case 'free': return '🆓';
      case 'low': return '💰';
      case 'medium': return '💰💰';
      case 'high': return '💰💰💰';
      default: return '';
    }
  };

  const visibleRecommendations = recommendations.slice(0, visibleCount);
  const hasMore = recommendations.length > visibleCount;

  return (
    <div className={styles.quickActions}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        
        {recommendations.some(r => r.popular) && (
          <div className={styles.popularBadge}>
            <Sparkles size={16} />
            <span>Популярные</span>
          </div>
        )}
      </div>

      <div className={styles.actionsGrid}>
        {visibleRecommendations.map((action) => {
          const IconComponent = action.icon;
          const isHovered = hoveredId === action.id;
          
          return (
            <div
              key={action.id}
              className={`${styles.actionCard} ${action.popular ? styles.popular : ''}`}
              onMouseEnter={() => setHoveredId(action.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={action.handler}
              style={{ 
                background: isHovered ? action.gradient : 'white',
                color: isHovered ? 'white' : 'inherit'
              }}
            >
              {action.popular && (
                <div className={styles.popularIndicator}>
                  <Sparkles size={12} />
                  <span>Популярно</span>
                </div>
              )}

              <div className={styles.actionIcon} style={{ backgroundColor: action.color }}>
                <IconComponent size={24} />
              </div>

              <div className={styles.actionContent}>
                <h4 className={styles.actionTitle}>{action.title}</h4>
                <p className={styles.actionDescription}>{action.description}</p>

                <div className={styles.actionMeta}>
                  {action.estimatedTime && (
                    <div className={styles.metaItem}>
                      <Clock size={14} />
                      <span>{action.estimatedTime}</span>
                    </div>
                  )}

                  {action.difficulty && (
                    <div 
                      className={styles.metaItem}
                      style={{ color: getDifficultyColor(action.difficulty) }}
                    >
                      <span className={styles.difficultyDot} 
                            style={{ backgroundColor: getDifficultyColor(action.difficulty) }} />
                      <span>{getDifficultyLabel(action.difficulty)}</span>
                    </div>
                  )}

                  {action.cost && (
                    <div className={styles.metaItem}>
                      <span>{getCostIcon(action.cost)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.actionArrow}>
                <ArrowRight size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className={styles.showMore}>
          <button 
            className={styles.showMoreButton}
            onClick={() => setVisibleCount(prev => prev + maxVisible)}
          >
            Показать еще {Math.min(maxVisible, recommendations.length - visibleCount)} действий
          </button>
        </div>
      )}
    </div>
  );
};

// Sample data for development
export const sampleQuickActions: QuickAction[] = [
  {
    id: 'book_restaurant',
    type: 'book',
    title: 'Забронировать ресторан',
    description: 'Романтический ужин в итальянском ресторане рядом с вами',
    icon: Calendar,
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    estimatedTime: '30 мин',
    difficulty: 'easy',
    cost: 'medium',
    popular: true,
    handler: () => console.log('Booking restaurant...')
  },
  {
    id: 'love_lesson',
    type: 'lesson',
    title: 'Урок общения',
    description: 'Изучите, как лучше выражать свои чувства',
    icon: BookOpen,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    estimatedTime: '15 мин',
    difficulty: 'easy',
    cost: 'free',
    handler: () => console.log('Starting lesson...')
  },
  {
    id: 'surprise_gift',
    type: 'gift',
    title: 'Подарить сюрприз',
    description: 'Персональные рекомендации подарков для вашего партнера',
    icon: Gift,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    estimatedTime: '1 час',
    difficulty: 'medium',
    cost: 'low',
    handler: () => console.log('Selecting gift...')
  },
  {
    id: 'coffee_date',
    type: 'date',
    title: 'Кофе-свидание',
    description: 'Найдите уютное кафе для неспешной беседы',
    icon: Coffee,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    estimatedTime: '2 часа',
    difficulty: 'easy',
    cost: 'low',
    popular: true,
    handler: () => console.log('Finding coffee shop...')
  },
  {
    id: 'plan_weekend',
    type: 'plan',
    title: 'Спланировать выходные',
    description: 'Создайте идеальный план на выходные вместе',
    icon: MapPin,
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    estimatedTime: '45 мин',
    difficulty: 'medium',
    cost: 'medium',
    handler: () => console.log('Planning weekend...')
  },
  {
    id: 'romantic_surprise',
    type: 'surprise',
    title: 'Романтический сюрприз',
    description: 'Подготовьте особенный сюрприз для своего партнера',
    icon: Heart,
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    estimatedTime: '3 часа',
    difficulty: 'hard',
    cost: 'high',
    handler: () => console.log('Preparing surprise...')
  }
];

export default QuickActions;

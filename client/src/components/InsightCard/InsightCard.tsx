import React, { useState } from 'react';
import { FaLightbulb, FaHeart, FaChartLine, FaTimes, FaStar, FaGift, FaCalendarPlus } from 'react-icons/fa';
import styles from './InsightCard.module.css';

export interface InsightData {
  id: string;
  insight_type: 'compatibility' | 'activity_pattern' | 'recommendation' | 'love_language' | 'conflict_analysis' | 'growth_opportunity';
  summary: string;
  details: any;
  generated_at: string;
  model_version?: string;
}

interface InsightCardProps {
  insight: InsightData;
  onDismiss?: (insightId: string) => void;
  onCreateEvent?: (insight: InsightData) => void;
  isNew?: boolean;
}

const insightTypeConfig = {
  compatibility: {
    icon: FaHeart,
    label: 'Совместимость',
    color: '#e91e63',
    bgColor: '#fef2f2'
  },
  activity_pattern: {
    icon: FaChartLine,
    label: 'Активность',
    color: '#2196f3',
    bgColor: '#f0f8ff'
  },
  recommendation: {
    icon: FaLightbulb,
    label: 'Рекомендация',
    color: '#ff9800',
    bgColor: '#fff8e1'
  },
  love_language: {
    icon: FaStar,
    label: 'Язык любви',
    color: '#9c27b0',
    bgColor: '#f8f0ff'
  },
  conflict_analysis: {
    icon: FaTimes,
    label: 'Анализ',
    color: '#f44336',
    bgColor: '#ffebee'
  },
  growth_opportunity: {
    icon: FaGift,
    label: 'Развитие',
    color: '#4caf50',
    bgColor: '#e8f5e8'
  }
};

const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onDismiss,
  onCreateEvent,
  isNew = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const config = insightTypeConfig[insight.insight_type] || insightTypeConfig.recommendation;
  const IconComponent = config.icon;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss(insight.id);
    }
  };

  const handleCreateEvent = () => {
    if (onCreateEvent) {
      onCreateEvent(insight);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.RelativeTimeFormatter('ru', { numeric: 'auto' }).format(
      Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  const renderDetails = () => {
    if (!insight.details || !isExpanded) return null;

    switch (insight.insight_type) {
      case 'compatibility':
        return renderCompatibilityDetails();
      case 'activity_pattern':
        return renderActivityPatternDetails();
      case 'recommendation':
        return renderRecommendationDetails();
      default:
        return renderGenericDetails();
    }
  };

  const renderCompatibilityDetails = () => {
    const { common_interests_count, compatibility_score, top_common_interests, recommendation } = insight.details;
    
    return (
      <div className={styles.detailsContent}>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{common_interests_count}</span>
            <span className={styles.statLabel}>общих интересов</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{Math.round(compatibility_score * 10)}%</span>
            <span className={styles.statLabel}>совместимость</span>
          </div>
        </div>
        
        {top_common_interests && (
          <div className={styles.interestsList}>
            <h4 className={styles.detailsTitle}>Топ общих интересов:</h4>
            {top_common_interests.map((interest: any, index: number) => (
              <div key={index} className={styles.interestItem}>
                <span className={styles.interestEmoji}>{interest.emoji}</span>
                <span className={styles.interestName}>{interest.name}</span>
                <span className={styles.interestScore}>{interest.compatibility_score}/10</span>
              </div>
            ))}
          </div>
        )}
        
        {recommendation && (
          <div className={styles.recommendationText}>
            💡 {recommendation}
          </div>
        )}
      </div>
    );
  };

  const renderActivityPatternDetails = () => {
    const { pattern, recent_events_count, days_since_last_event, recommendation } = insight.details;
    
    return (
      <div className={styles.detailsContent}>
        <div className={styles.patternInfo}>
          <div className={styles.patternType}>
            Паттерн: <strong>{pattern === 'low_activity' ? 'Низкая активность' : 
                              pattern === 'high_activity' ? 'Высокая активность' : 
                              'Повторяющийся тип'}</strong>
          </div>
          
          {recent_events_count !== undefined && (
            <div className={styles.eventCount}>
              События за месяц: <strong>{recent_events_count}</strong>
            </div>
          )}
          
          {days_since_last_event !== undefined && (
            <div className={styles.daysSince}>
              Дней с последнего события: <strong>{days_since_last_event}</strong>
            </div>
          )}
        </div>
        
        {recommendation && (
          <div className={styles.recommendationText}>
            💡 {recommendation}
          </div>
        )}
      </div>
    );
  };

  const renderRecommendationDetails = () => {
    const { suggested_interest, unused_interest, specific_recommendations, seasonal_activities } = insight.details;
    
    return (
      <div className={styles.detailsContent}>
        {suggested_interest && (
          <div className={styles.suggestedInterest}>
            <span className={styles.interestEmoji}>{suggested_interest.emoji}</span>
            <div className={styles.interestInfo}>
              <div className={styles.interestName}>{suggested_interest.name}</div>
              <div className={styles.interestCategory}>{suggested_interest.category}</div>
            </div>
          </div>
        )}
        
        {unused_interest && (
          <div className={styles.suggestedInterest}>
            <span className={styles.interestEmoji}>{unused_interest.emoji}</span>
            <div className={styles.interestInfo}>
              <div className={styles.interestName}>{unused_interest.name}</div>
              <div className={styles.interestCategory}>{unused_interest.category}</div>
            </div>
          </div>
        )}
        
        {specific_recommendations && (
          <div className={styles.specificRecommendations}>
            <h4 className={styles.detailsTitle}>Конкретные идеи:</h4>
            <ul className={styles.recommendationsList}>
              {specific_recommendations.map((rec: string, index: number) => (
                <li key={index} className={styles.recommendationItem}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
        
        {seasonal_activities && (
          <div className={styles.seasonalActivities}>
            <h4 className={styles.detailsTitle}>Сезонные активности:</h4>
            <ul className={styles.recommendationsList}>
              {seasonal_activities.map((activity: string, index: number) => (
                <li key={index} className={styles.recommendationItem}>{activity}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderGenericDetails = () => {
    return (
      <div className={styles.detailsContent}>
        <pre className={styles.rawDetails}>
          {JSON.stringify(insight.details, null, 2)}
        </pre>
      </div>
    );
  };

  const canCreateEvent = insight.insight_type === 'recommendation' && onCreateEvent;

  return (
    <div className={`${styles.card} ${isNew ? styles.new : ''}`} style={{ borderLeftColor: config.color }}>
      {isNew && <div className={styles.newBadge}>Новый</div>}
      
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.iconContainer} style={{ backgroundColor: config.bgColor, color: config.color }}>
          <IconComponent />
        </div>
        
        <div className={styles.content}>
          <div className={styles.meta}>
            <span className={styles.type} style={{ color: config.color }}>
              {config.label}
            </span>
            <span className={styles.date}>
              {formatDate(insight.generated_at)}
            </span>
          </div>
          
          <h3 className={styles.summary}>{insight.summary}</h3>
        </div>
        
        <div className={styles.actions}>
          {canCreateEvent && (
            <button
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                handleCreateEvent();
              }}
              title="Создать событие"
            >
              <FaCalendarPlus />
            </button>
          )}
          
          <button
            className={styles.dismissButton}
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            title="Скрыть"
          >
            <FaTimes />
          </button>
        </div>
      </div>
      
      {renderDetails()}
      
      {isExpanded && insight.model_version && (
        <div className={styles.footer}>
          <span className={styles.modelVersion}>
            Версия модели: {insight.model_version}
          </span>
        </div>
      )}
    </div>
  );
};

export default InsightCard;

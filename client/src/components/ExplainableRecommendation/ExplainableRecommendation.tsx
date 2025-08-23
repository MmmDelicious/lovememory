import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, Brain, BarChart3, Heart, Calendar, MessageCircle, Camera } from 'lucide-react';
import styles from './ExplainableRecommendation.module.css';

interface DataSource {
  type: 'messages' | 'photos' | 'events' | 'activities' | 'games' | 'profile';
  description: string;
  weight: number;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
}

interface ExplainableRecommendationProps {
  title: string;
  description: string;
  reasoning: string;
  confidence: number;
  dataSources: DataSource[];
  action?: {
    type: 'book' | 'lesson' | 'gift' | 'custom';
    label: string;
    handler: () => void;
  };
  onDismiss?: () => void;
}

const ExplainableRecommendation: React.FC<ExplainableRecommendationProps> = ({
  title,
  description,
  reasoning,
  confidence,
  dataSources,
  action,
  onDismiss
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#10b981'; // green
    if (confidence >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'Высокая уверенность';
    if (confidence >= 60) return 'Средняя уверенность';
    return 'Низкая уверенность';
  };

  return (
    <div className={styles.recommendationCard}>
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
          </div>
          
          <div className={styles.confidenceSection}>
            <div 
              className={styles.confidenceBadge}
              style={{ backgroundColor: getConfidenceColor(confidence) }}
            >
              <Brain size={16} />
              <span>{confidence}%</span>
            </div>
            <span className={styles.confidenceLabel}>
              {getConfidenceLabel(confidence)}
            </span>
          </div>
        </div>

        <button 
          className={styles.explainButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Info size={16} />
          <span>Почему эта рекомендация?</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isExpanded && (
          <div className={styles.explanation}>
            <div className={styles.reasoning}>
              <h4>Обоснование</h4>
              <p>{reasoning}</p>
            </div>

            <div className={styles.dataSources}>
              <h4>Использованные данные</h4>
              <div className={styles.sourcesList}>
                {dataSources.map((source, index) => {
                  const IconComponent = source.icon;
                  return (
                    <div key={index} className={styles.sourceItem}>
                      <div 
                        className={styles.sourceIcon}
                        style={{ backgroundColor: source.color }}
                      >
                        <IconComponent size={16} />
                      </div>
                      <div className={styles.sourceInfo}>
                        <span className={styles.sourceDescription}>
                          {source.description}
                        </span>
                        <div className={styles.weightBar}>
                          <div 
                            className={styles.weightFill}
                            style={{ 
                              width: `${source.weight}%`,
                              backgroundColor: source.color 
                            }}
                          />
                        </div>
                        <span className={styles.weightLabel}>
                          Влияние: {source.weight}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.aiNote}>
              <Brain size={20} />
              <div>
                <strong>AI анализ:</strong>
                <p>Рекомендация основана на анализе ваших данных за последние 3 месяца. 
                   Алгоритм учитывает паттерны поведения, предпочтения и успешные взаимодействия.</p>
              </div>
            </div>
          </div>
        )}

        {action && (
          <div className={styles.actionSection}>
            <button 
              className={styles.actionButton}
              onClick={action.handler}
            >
              {action.label}
            </button>
            {onDismiss && (
              <button 
                className={styles.dismissButton}
                onClick={onDismiss}
              >
                Скрыть
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplainableRecommendation;

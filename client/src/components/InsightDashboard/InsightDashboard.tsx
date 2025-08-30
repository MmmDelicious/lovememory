import React, { useState, useEffect } from 'react';
import { FaRefresh, FaBrain, FaChartBar, FaFilter, FaPlus } from 'react-icons/fa';
import InsightCard, { InsightData } from '../InsightCard/InsightCard';
import Button from '../Button/Button';
import insightService from '../../services/insight.service';
import eventService from '../../services/event.service';
import styles from './InsightDashboard.module.css';

interface InsightDashboardProps {
  pairId: string;
  userId: string;
}

interface InsightStats {
  total_insights: number;
  recent_insights: number;
  insights_by_type: Record<string, number>;
  last_generated: string | null;
}

const InsightDashboard: React.FC<InsightDashboardProps> = ({
  pairId,
  userId
}) => {
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [stats, setStats] = useState<InsightStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [lastReadDate, setLastReadDate] = useState<string | null>(null);

  const insightTypeLabels = {
    compatibility: 'Совместимость',
    activity_pattern: 'Активность',
    recommendation: 'Рекомендации',
    love_language: 'Языки любви',
    conflict_analysis: 'Анализ конфликтов',
    growth_opportunity: 'Возможности роста'
  };

  useEffect(() => {
    loadInsights();
    loadStats();
    
    // Загружаем последнюю дату прочтения из localStorage
    const saved = localStorage.getItem(`insights_last_read_${pairId}`);
    if (saved) {
      setLastReadDate(saved);
    }
  }, [pairId]);

  const loadInsights = async () => {
    try {
      setIsLoading(true);
      const params = filter !== 'all' ? { type: filter } : {};
      const data = await insightService.getInsightsForPair(pairId, params);
      setInsights(data);
    } catch (error) {
      console.error('Error loading insights:', error);
      setError('Не удалось загрузить инсайты');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await insightService.getInsightStats(pairId);
      setStats(data);
    } catch (error) {
      console.error('Error loading insight stats:', error);
    }
  };

  const handleGenerateInsights = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const result = await insightService.generateInsights(pairId);
      
      if (result.generated_count > 0) {
        // Обновляем список инсайтов
        await loadInsights();
        await loadStats();
        
        // Показываем уведомление
        console.log(`Сгенерировано ${result.generated_count} новых инсайтов`);
      } else {
        setError('Новых инсайтов пока нет. Попробуйте позже!');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      setError('Не удалось сгенерировать инсайты');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    // При изменении фильтра, загружаем инсайты заново
    setTimeout(loadInsights, 100);
  };

  const handleDismissInsight = async (insightId: string) => {
    try {
      await insightService.deleteInsight(insightId);
      setInsights(prev => prev.filter(insight => insight.id !== insightId));
      await loadStats();
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
  };

  const handleCreateEventFromInsight = async (insight: InsightData) => {
    try {
      // Создаем событие на основе инсайта
      const eventData = {
        title: `💡 ${insight.summary}`,
        description: `Основано на инсайте: ${insight.summary}`,
        event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // завтра
        event_type: 'plan',
        isShared: true,
        source: 'AI_SUGGESTED', // Важно! Событие создано на основе AI инсайта
        metadata: {
          based_on_insight: insight.id,
          insight_type: insight.insight_type
        }
      };

      await eventService.createEvent(eventData);
      console.log('Событие создано на основе инсайта');
    } catch (error) {
      console.error('Error creating event from insight:', error);
    }
  };

  const markAsRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem(`insights_last_read_${pairId}`, now);
    setLastReadDate(now);
  };

  const getNewInsights = () => {
    if (!lastReadDate) return insights;
    return insights.filter(insight => new Date(insight.generated_at) > new Date(lastReadDate));
  };

  const filteredInsights = insights.filter(insight => 
    filter === 'all' || insight.insight_type === filter
  );

  const newInsights = getNewInsights();

  if (isLoading && insights.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Загружаем ваши инсайты...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>
            <FaBrain className={styles.titleIcon} />
            Персональные инсайты
          </h2>
          <p className={styles.subtitle}>
            Умные наблюдения о вашей паре на основе активности и интересов
          </p>
        </div>

        <div className={styles.actions}>
          <Button
            type="secondary"
            onClick={handleGenerateInsights}
            loading={isGenerating}
            disabled={isGenerating}
          >
            <FaRefresh />
            {isGenerating ? 'Генерируем...' : 'Обновить'}
          </Button>
        </div>
      </div>

      {stats && (
        <div className={styles.statsSection}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.total_insights}</div>
            <div className={styles.statLabel}>Всего инсайтов</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.recent_insights}</div>
            <div className={styles.statLabel}>За неделю</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {Object.keys(stats.insights_by_type).length}
            </div>
            <div className={styles.statLabel}>Типов инсайтов</div>
          </div>
        </div>
      )}

      <div className={styles.filterSection}>
        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            <FaFilter />
            Все ({insights.length})
          </button>
          {Object.entries(insightTypeLabels).map(([type, label]) => {
            const count = stats?.insights_by_type[type] || 0;
            if (count === 0) return null;
            
            return (
              <button
                key={type}
                className={`${styles.filterButton} ${filter === type ? styles.active : ''}`}
                onClick={() => handleFilterChange(type)}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {newInsights.length > 0 && (
          <div className={styles.newInsightsAlert}>
            <span>У вас {newInsights.length} новых инсайтов!</span>
            <button onClick={markAsRead} className={styles.markReadButton}>
              Пометить как прочитанные
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <p>{error}</p>
          <button onClick={() => setError(null)} className={styles.closeError}>
            ✕
          </button>
        </div>
      )}

      <div className={styles.insightsList}>
        {filteredInsights.length === 0 ? (
          <div className={styles.emptyState}>
            <FaBrain className={styles.emptyIcon} />
            <h3>Пока нет инсайтов</h3>
            <p>
              {filter === 'all' 
                ? 'Проводите больше времени вместе, и мы сгенерируем персональные инсайты!'
                : `Нет инсайтов типа "${insightTypeLabels[filter] || filter}"`
              }
            </p>
            <Button type="primary" onClick={handleGenerateInsights} loading={isGenerating}>
              <FaPlus />
              Сгенерировать инсайты
            </Button>
          </div>
        ) : (
          filteredInsights.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              isNew={newInsights.some(ni => ni.id === insight.id)}
              onDismiss={handleDismissInsight}
              onCreateEvent={handleCreateEventFromInsight}
            />
          ))
        )}
      </div>

      {stats?.last_generated && (
        <div className={styles.footer}>
          <p className={styles.lastGenerated}>
            Последнее обновление: {new Date(stats.last_generated).toLocaleString('ru')}
          </p>
        </div>
      )}
    </div>
  );
};

export default InsightDashboard;

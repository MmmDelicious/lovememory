import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../store/hooks';
import { usePairing } from '../../hooks/usePairing';
import api from '../../services/api';
import styles from './ActivityTracker.module.css';

interface ActivityData {
  steps: number;
  calories: number;
  activeMinutes: number;
  distance: number;
}

interface TrackerStats {
  current: {
    steps: number;
    calories: number;
    activeMinutes: number;
    distance: number;
    goalProgress: number;
  };
  goals: {
    daily: number;
    weekly: number;
  };
  streaks: {
    current: number;
    longest: number;
    totalDays: number;
  };
  achievements: string[];
  trends: {
    trend: string;
    change: number;
    changePercent: number;
    direction: string;
  };
  weeklyActivity: Array<{
    date: string;
    steps: number;
    goalAchieved: boolean;
  }>;
}

const ActivityTracker: React.FC = () => {
  const user = useUser();
  const { pairing } = usePairing(user);
  const [stats, setStats] = useState<TrackerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualData, setManualData] = useState<ActivityData>({
    steps: 0,
    calories: 0,
    activeMinutes: 0,
    distance: 0
  });

  // Загружаем статистику при монтировании
  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await api.get('/activity-tracker/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load activity stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateActivity = useCallback(async (activityData: ActivityData) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await api.post('/activity-tracker/activity', activityData);
      
      // Показываем уведомление о достижениях
      if (response.data.data.newAchievements.length > 0) {
        alert(response.data.data.message);
      }
      // Перезагружаем статистику
      await loadStats();
      setShowManualInput(false);
      setManualData({ steps: 0, calories: 0, activeMinutes: 0, distance: 0 });
    } catch (error) {
      console.error('Failed to update activity:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadStats]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualData.steps > 0) {
      updateActivity(manualData);
    }
  };

  const handleQuickUpdate = (steps: number) => {
    updateActivity({
      steps,
      calories: Math.round(steps * 0.04), // Примерный расчет калорий
      activeMinutes: Math.round(steps / 100), // Примерный расчет активных минут
      distance: Math.round((steps * 0.0008) * 100) / 100 // Примерный расчет расстояния в км
    });
  };

  const updateGoals = useCallback(async (dailyGoal: number, weeklyGoal: number) => {
    if (!user) return;
    
    try {
      await api.put('/activity-tracker/goals', { dailyGoal, weeklyGoal });
      await loadStats();
    } catch (error) {
      console.error('Failed to update goals:', error);
    }
  }, [user, loadStats]);

  if (!user) return null;

  if (isLoading && !stats) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка статистики активности...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🎯 Трекер активности</h2>
        <p>Отслеживайте свои шаги и укрепляйте отношения через активность</p>
      </div>

      {stats ? (
        <>
          {/* Основные метрики */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>👣</div>
              <div className={styles.metricValue}>{stats.current.steps.toLocaleString()}</div>
              <div className={styles.metricLabel}>Шаги сегодня</div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${Math.min(stats.current.goalProgress, 100)}%` }}
                />
              </div>
              <div className={styles.goalText}>
                {stats.current.goalProgress}% от цели ({stats.goals.daily.toLocaleString()})
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>🔥</div>
              <div className={styles.metricValue}>{stats.current.calories}</div>
              <div className={styles.metricLabel}>Калории</div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>⏰</div>
              <div className={styles.metricValue}>{stats.current.activeMinutes}</div>
              <div className={styles.metricLabel}>Активные минуты</div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>📏</div>
              <div className={styles.metricValue}>{stats.current.distance} км</div>
              <div className={styles.metricLabel}>Расстояние</div>
            </div>
          </div>

          {/* Серии и достижения */}
          <div className={styles.statsRow}>
            <div className={styles.statsCard}>
              <h3>🔥 Серии активности</h3>
              <div className={styles.streakInfo}>
                <div className={styles.streakItem}>
                  <span className={styles.streakLabel}>Текущая серия:</span>
                  <span className={styles.streakValue}>{stats.streaks.current} дней</span>
                </div>
                <div className={styles.streakItem}>
                  <span className={styles.streakLabel}>Лучшая серия:</span>
                  <span className={styles.streakValue}>{stats.streaks.longest} дней</span>
                </div>
                <div className={styles.streakItem}>
                  <span className={styles.streakLabel}>Всего активных дней:</span>
                  <span className={styles.streakValue}>{stats.streaks.totalDays}</span>
                </div>
              </div>
            </div>

            <div className={styles.statsCard}>
              <h3>🏆 Достижения</h3>
              <div className={styles.achievementsList}>
                {stats.achievements.length > 0 ? (
                  stats.achievements.map((achievement, index) => (
                    <div key={index} className={styles.achievement}>
                      <span className={styles.achievementIcon}>🎖️</span>
                      <span className={styles.achievementText}>{achievement}</span>
                    </div>
                  ))
                ) : (
                  <p className={styles.noAchievements}>Пока нет достижений. Достигайте целей!</p>
                )}
              </div>
            </div>
          </div>

          {/* Тренды */}
          <div className={styles.trendsCard}>
            <h3>📈 Тренды активности</h3>
            <div className={styles.trendInfo}>
              <div className={`${styles.trendIndicator} ${styles[stats.trends.direction]}`}>
                {stats.trends.direction === 'up' && '↗️'}
                {stats.trends.direction === 'down' && '↘️'}
                {stats.trends.direction === 'stable' && '→'}
              </div>
              <div className={styles.trendDetails}>
                <span className={styles.trendLabel}>
                  {stats.trends.trend === 'increasing' && 'Активность растет!'}
                  {stats.trends.trend === 'decreasing' && 'Активность снижается'}
                  {stats.trends.trend === 'stable' && 'Активность стабильна'}
                </span>
                <span className={styles.trendChange}>
                  {stats.trends.change > 0 && '+'}
                  {stats.trends.change} шагов ({stats.trends.changePercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Недельная активность */}
          <div className={styles.weeklyCard}>
            <h3>📅 Активность за неделю</h3>
            <div className={styles.weeklyChart}>
              {stats.weeklyActivity.map((day, index) => (
                <div key={index} className={styles.weekDay}>
                  <div className={styles.dayLabel}>
                    {new Date(day.date).toLocaleDateString('ru-RU', { weekday: 'short' })}
                  </div>
                  <div className={styles.dayBar}>
                    <div 
                      className={`${styles.barFill} ${day.goalAchieved ? styles.goalAchieved : ''}`}
                      style={{ 
                        height: `${Math.min((day.steps / stats.goals.daily) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <div className={styles.daySteps}>{day.steps.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className={styles.noData}>
          <p>Трекер активности не найден. Создайте его, чтобы начать отслеживать активность!</p>
        </div>
      )}

      {/* Быстрые действия */}
      <div className={styles.quickActions}>
        <h3>⚡ Быстрые действия</h3>
        <div className={styles.actionButtons}>
          <button 
            className={styles.actionBtn}
            onClick={() => handleQuickUpdate(5000)}
            disabled={isLoading}
          >
            +5,000 шагов
          </button>
          <button 
            className={styles.actionBtn}
            onClick={() => handleQuickUpdate(10000)}
            disabled={isLoading}
          >
            +10,000 шагов
          </button>
          <button 
            className={styles.actionBtn}
            onClick={() => handleQuickUpdate(15000)}
            disabled={isLoading}
          >
            +15,000 шагов
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.primary}`}
            onClick={() => setShowManualInput(!showManualInput)}
          >
            📝 Ручной ввод
          </button>
        </div>
      </div>

      {/* Ручной ввод */}
      {showManualInput && (
        <div className={styles.manualInput}>
          <h3>📝 Ручной ввод активности</h3>
          <form onSubmit={handleManualSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="steps">Шаги:</label>
              <input
                type="number"
                id="steps"
                value={manualData.steps}
                onChange={(e) => setManualData(prev => ({ ...prev, steps: parseInt(e.target.value) || 0 }))}
                placeholder="Количество шагов"
                min="0"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="calories">Калории:</label>
              <input
                type="number"
                id="calories"
                value={manualData.calories}
                onChange={(e) => setManualData(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                placeholder="Сожженные калории"
                min="0"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="activeMinutes">Активные минуты:</label>
              <input
                type="number"
                id="activeMinutes"
                value={manualData.activeMinutes}
                onChange={(e) => setManualData(prev => ({ ...prev, activeMinutes: parseInt(e.target.value) || 0 }))}
                placeholder="Активные минуты"
                min="0"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="distance">Расстояние (км):</label>
              <input
                type="number"
                id="distance"
                value={manualData.distance}
                onChange={(e) => setManualData(prev => ({ ...prev, distance: parseFloat(e.target.value) || 0 }))}
                placeholder="Расстояние в км"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={isLoading || manualData.steps === 0}
              >
                {isLoading ? 'Обновление...' : 'Обновить активность'}
              </button>
              <button 
                type="button" 
                className={styles.cancelBtn}
                onClick={() => setShowManualInput(false)}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Управление целями */}
      <div className={styles.goalsSection}>
        <h3>🎯 Управление целями</h3>
        <div className={styles.goalsForm}>
          <div className={styles.goalInput}>
            <label htmlFor="dailyGoal">Дневная цель (шаги):</label>
            <input
              type="number"
              id="dailyGoal"
              defaultValue={stats?.goals.daily || 10000}
              min="1000"
              step="1000"
            />
          </div>
          
          <div className={styles.goalInput}>
            <label htmlFor="weeklyGoal">Недельная цель (шаги):</label>
            <input
              type="number"
              id="weeklyGoal"
              defaultValue={stats?.goals.weekly || 70000}
              min="7000"
              step="1000"
            />
          </div>
          
          <button 
            className={styles.updateGoalsBtn}
            onClick={() => {
              const dailyGoal = parseInt((document.getElementById('dailyGoal') as HTMLInputElement).value);
              const weeklyGoal = parseInt((document.getElementById('weeklyGoal') as HTMLInputElement).value);
              if (dailyGoal && weeklyGoal) {
                updateGoals(dailyGoal, weeklyGoal);
              }
            }}
            disabled={isLoading}
          >
            Обновить цели
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityTracker;

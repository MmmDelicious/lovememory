import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './LessonProgress.module.css';
interface LessonProgressProps {
  progress?: any;
  loading?: boolean;
  viewMode?: 'my' | 'pair';
}
const LessonProgress: React.FC<LessonProgressProps> = ({ progress, loading = false, viewMode = 'my' }) => {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const themeNames = {
    words_of_affirmation: 'Слова поддержки',
    acts_of_service: 'Дела заботы',
    receiving_gifts: 'Подарки',
    quality_time: 'Время вместе',
    physical_touch: 'Прикосновения',
    heat_boosters: 'Разжигание страсти',
    attachment_healing: 'Исцеление привязанности'
  };
  const themeEmojis = {
    words_of_affirmation: '💬',
    acts_of_service: '🤲',
    receiving_gifts: '🎁',
    quality_time: '⏰',
    physical_touch: '🤗',
    heat_boosters: '🔥',
    attachment_healing: '💚'
  };
  const themeColors = {
    words_of_affirmation: '#4CAF50',
    acts_of_service: '#FF9800',
    receiving_gifts: '#E91E63',
    quality_time: '#2196F3',
    physical_touch: '#9C27B0',
    heat_boosters: '#F44336',
    attachment_healing: '#00BCD4'
  };
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загружаем ваш прогресс...</p>
        </div>
      </div>
    );
  }
  if (!progress) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Не удалось загрузить прогресс</h3>
          <p>Попробуйте обновить страницу</p>
        </div>
      </div>
    );
  }
  const { pair, user, partner, themes } = progress;
  return (
    <div className={styles.container}>
      {}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.overallStats}
      >
        <h2>🎯 Общий прогресс</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔥</div>
            <div className={styles.statValue}>{pair?.streak || 0}</div>
            <div className={styles.statLabel}>Дней подряд</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statValue}>{pair?.fullyCompleted || 0}</div>
            <div className={styles.statLabel}>Уроков выполнено</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statValue}>{user?.totalReward || 0}</div>
            <div className={styles.statLabel}>Монет заработано</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📈</div>
            <div className={styles.statValue}>
              {pair?.completionRate ? Math.round(pair.completionRate) : 0}%
            </div>
            <div className={styles.statLabel}>Успешность</div>
          </div>
        </div>
      </motion.div>
      {}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={styles.themesSection}
      >
        <h2>📚 Прогресс по темам</h2>
        <div className={styles.themesGrid}>
          {Object.entries(themes || {}).map(([themeKey, themeData]: [string, any]) => {
            const themeName = themeNames[themeKey] || themeKey;
            const emoji = themeEmojis[themeKey] || '📖';
            const color = themeColors[themeKey] || '#666';
            const percentage = themeData?.percentage || 0;
            const completed = themeData?.user || 0;
            const total = themeData?.total || 0;
            return (
              <motion.div
                key={themeKey}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={styles.themeCard}
                style={{ '--theme-color': color } as any}
                onClick={() => setSelectedTheme(selectedTheme === themeKey ? null : themeKey)}
              >
                <div className={styles.themeHeader}>
                  <span className={styles.themeEmoji}>{emoji}</span>
                  <h3 className={styles.themeName}>{themeName}</h3>
                </div>
                <div className={styles.progressBar}>
                  <motion.div
                    className={styles.progressFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    style={{ backgroundColor: color }}
                  />
                </div>
                <div className={styles.progressText}>
                  <span className={styles.progressNumbers}>
                    {completed}/{total}
                  </span>
                  <span className={styles.progressPercent}>
                    {percentage}%
                  </span>
                </div>
                {selectedTheme === themeKey && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={styles.themeDetails}
                  >
                    <div className={styles.detailRow}>
                      <span>Вы:</span>
                      <span>{themeData?.user || 0}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Партнер:</span>
                      <span>{themeData?.partner || 0}</span>
                    </div>
                    {themeData?.lastCompleted && (
                      <div className={styles.lastCompleted}>
                        Последний: {new Date(themeData.lastCompleted).toLocaleDateString()}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
      {}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={styles.individualStats}
      >
        <div className={styles.statsComparison}>
          <div className={styles.playerStats}>
            <h3>👤 Ваша статистика</h3>
            <div className={styles.playerCard}>
              <div className={styles.playerRow}>
                <span>Всего уроков:</span>
                <span className={styles.playerValue}>{user?.totalCompleted || 0}</span>
              </div>
              <div className={styles.playerRow}>
                <span>За 30 дней:</span>
                <span className={styles.playerValue}>{user?.completedLast30Days || 0}</span>
              </div>
              <div className={styles.playerRow}>
                <span>Текущий streak:</span>
                <span className={styles.playerValue}>{user?.currentStreak || 0}</span>
              </div>
              <div className={styles.playerRow}>
                <span>Заработано монет:</span>
                <span className={styles.playerValue}>{user?.totalCoinsEarned || 0}</span>
              </div>
              <div className={styles.playerRow}>
                <span>Streak бонусы:</span>
                <span className={styles.playerValue}>{user?.totalStreakBonus || 0}</span>
              </div>
            </div>
          </div>
          <div className={styles.playerStats}>
            <h3>💕 Статистика партнера</h3>
            <div className={styles.playerCard}>
              <div className={styles.playerRow}>
                <span>Всего уроков:</span>
                <span className={styles.playerValue}>{partner?.totalCompleted || 0}</span>
              </div>
              <div className={styles.playerRow}>
                <span>За 30 дней:</span>
                <span className={styles.playerValue}>{partner?.completedLast30Days || 0}</span>
              </div>
              <div className={styles.playerRow}>
                <span>Заработано монет:</span>
                <span className={styles.playerValue}>{partner?.totalCoinsEarned || 0}</span>
              </div>
              <div className={styles.playerRow}>
                <span>Streak бонусы:</span>
                <span className={styles.playerValue}>{partner?.totalStreakBonus || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      {}
      {pair?.relationshipMetrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={styles.relationshipMetrics}
        >
          <h2>💞 Метрики отношений</h2>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Теплота отношений</span>
              <div className={styles.heatMeter}>
                <div 
                  className={styles.heatFill}
                  style={{ width: `${pair.relationshipMetrics.heat_score}%` }}
                />
              </div>
              <span className={styles.metricValue}>
                {Math.round(pair.relationshipMetrics.heat_score || 0)}%
              </span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Стадия отношений</span>
              <span className={styles.stageValue}>
                {pair.relationshipMetrics.relationship_stage === 'new' && '🌱 Новые'}
                {pair.relationshipMetrics.relationship_stage === 'developing' && '🌿 Развивающиеся'}
                {pair.relationshipMetrics.relationship_stage === 'established' && '🌳 Установленные'}
                {pair.relationshipMetrics.relationship_stage === 'mature' && '🌲 Зрелые'}
              </span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Основной язык любви</span>
              <span className={styles.languageValue}>
                {pair.relationshipMetrics.love_language_primary && 
                  themeNames[pair.relationshipMetrics.love_language_primary]
                }
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
export default LessonProgress;


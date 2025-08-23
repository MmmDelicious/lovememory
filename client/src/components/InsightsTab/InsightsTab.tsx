import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Clock, CheckCircle, TrendingUp, Star, Calendar } from 'lucide-react';
import styles from './InsightsTab.module.css';

interface InsightsTabProps {
  viewMode?: 'my' | 'pair';
  loading?: boolean;
}

interface HighlightItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

interface ActivityWeek {
  day: string;
  value: number;
}

const InsightsTab: React.FC<InsightsTabProps> = ({
  viewMode = 'my',
  loading = false
}) => {
  const dailyInsight = {
    title: 'Daily Insight',
    content: 'Regularly expressing affection can strengthen your relationship and enhance emotional intimacy.',
    emoji: '☕',
    badge: 'Daily Tip'
  };

  const highlights: HighlightItem[] = [
    {
      id: 'favorite_topic',
      icon: <Heart size={20} />,
      label: 'Favorite topic',
      value: 'Love',
      color: '#FF6B7A'
    },
    {
      id: 'average_lesson',
      icon: <Clock size={20} />,
      label: 'Average lesson',
      value: '12 min',
      color: '#FF8A50'
    },
    {
      id: 'strongest_skill',
      icon: <CheckCircle size={20} />,
      label: 'Strongest skill',
      value: 'Trust',
      color: '#4ADE80'
    }
  ];

  const activityData: ActivityWeek[] = [
    { day: 'Mon', value: 2 },
    { day: 'Tue', value: 1 },
    { day: 'Wed', value: 0 },
    { day: 'Thu', value: 3 },
    { day: 'Fri', value: 1 },
    { day: 'Sat', value: 2 },
    { day: 'Sun', value: 4 }
  ];

  const suggestions = [
    {
      id: 'trust_lesson',
      text: 'Try a lesson on trust tomorrow',
      cta: 'Continue'
    },
    {
      id: 'sharing_memories',
      text: 'Sharing memories can foster...',
      cta: 'Read more'
    },
    {
      id: 'celebrate_victories',
      text: 'Celebrate small victories',
      cta: 'Learn more'
    }
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Анализируем ваш прогресс...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Daily Insight Card */}
      <motion.div
        className={styles.dailyInsightCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className={styles.insightContent}>
          <div className={styles.insightInfo}>
            <div className={styles.insightBadge}>
              {dailyInsight.badge}
            </div>
            
            <h2 className={styles.insightTitle}>
              {dailyInsight.title}
            </h2>
            
            <p className={styles.insightText}>
              {dailyInsight.content}
            </p>
          </div>

          <div className={styles.insightVisual}>
            <div className={styles.insightIcon}>
              <span className={styles.insightEmoji}>
                {dailyInsight.emoji}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Highlights and Activity Grid */}
      <div className={styles.mainGrid}>
        {/* Highlights Section */}
        <motion.div
          className={styles.highlightsSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className={styles.sectionTitle}>Highlights</h3>
          <div className={styles.highlightsList}>
            {highlights.map((highlight, index) => (
              <motion.div
                key={highlight.id}
                className={styles.highlightItem}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div 
                  className={styles.highlightIcon}
                  style={{ backgroundColor: highlight.color }}
                >
                  {highlight.icon}
                </div>
                <div className={styles.highlightContent}>
                  <span className={styles.highlightLabel}>
                    {highlight.label}
                  </span>
                  <span className={styles.highlightValue}>
                    {highlight.value}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Activity Section */}
        <motion.div
          className={styles.activitySection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className={styles.sectionTitle}>Activity per week</h3>
          <div className={styles.activityChart}>
            {activityData.map((day, index) => (
              <div key={day.day} className={styles.activityDay}>
                <div 
                  className={styles.activityBar}
                  style={{ 
                    height: `${(day.value / 4) * 100}%`,
                    backgroundColor: day.value > 0 ? '#FF8A50' : '#F1F5F9'
                  }}
                ></div>
                <span className={styles.dayLabel}>{day.day}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Suggestions Section */}
      <motion.div
        className={styles.suggestionsSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className={styles.suggestionsList}>
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              className={styles.suggestionCard}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className={styles.suggestionContent}>
                <span className={styles.suggestionText}>
                  {suggestion.text}
                </span>
                <button className={styles.suggestionButton}>
                  {suggestion.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default InsightsTab;

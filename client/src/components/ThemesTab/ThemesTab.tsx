import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { ChevronRight, Filter } from 'lucide-react';
import styles from './ThemesTab.module.css';

// Импорт лоти анимаций
import loveAnimation from '../../assets/lessons/Love.json';
import relationshipAnimation from '../../assets/lessons/Relationship.json';
import coupleAnimation from '../../assets/lessons/Couple sharing and caring love.json';
import businessAnimation from '../../assets/lessons/Business Animations - Flat Concept.json';
import targetAnimation from '../../assets/lessons/Target Evaluation.json';
import marketAnimation from '../../assets/lessons/Market Research.json';
import onlineSalesAnimation from '../../assets/lessons/Online Sales.json';
import websiteAnimation from '../../assets/lessons/Website Construction.json';

interface Theme {
  id: string;
  title: string;
  description: string;
  color: string;
  animation: any;
  totalLessons: number;
  completedLessons: number;
  category: 'popular' | 'new' | 'recommended';
}

interface ThemesTabProps {
  onThemeSelect?: (themeId: string) => void;
}

const ThemesTab: React.FC<ThemesTabProps> = ({ onThemeSelect }) => {
  const [filter, setFilter] = useState<'all' | 'popular' | 'new' | 'recommended'>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const themes: Theme[] = [
    {
      id: 'trust',
      title: 'Доверие и честность',
      description: 'Как строить прозрачность, избегать недомолвок, обсуждать трудные темы',
      color: '#FADADD', // розовый пастельный
      animation: businessAnimation,
      totalLessons: 12,
      completedLessons: 3,
      category: 'popular'
    },
    {
      id: 'intimacy',
      title: 'Интимность и сексуальность',
      description: 'Понимание желаний, уважение границ, развитие близости',
      color: '#E6E0FF', // светло-лавандовый
      animation: coupleAnimation,
      totalLessons: 15,
      completedLessons: 0,
      category: 'recommended'
    },
    {
      id: 'emotional',
      title: 'Эмоциональная связь',
      description: 'Умение слушать, выражать чувства, поддержка в трудные периоды',
      color: '#DFF6FF', // небесно-голубой
      animation: loveAnimation,
      totalLessons: 18,
      completedLessons: 7,
      category: 'popular'
    },
    {
      id: 'conflicts',
      title: 'Конфликты и их решение',
      description: 'Конструктивные ссоры, техника "я-высказываний", нахождение компромисса',
      color: '#FFF2E5', // мягкий бежевый
      animation: targetAnimation,
      totalLessons: 14,
      completedLessons: 5,
      category: 'new'
    },
    {
      id: 'quality_time',
      title: 'Совместное время',
      description: 'Как создавать ритуалы, планировать свидания, наполнять отношения радостью',
      color: '#E0F7F4', // мятный
      animation: relationshipAnimation,
      totalLessons: 10,
      completedLessons: 8,
      category: 'popular'
    },
    {
      id: 'future',
      title: 'Будущее и цели',
      description: 'Разговоры о мечтах, планирование детей, финансов и долгосрочного пути',
      color: '#F0E6FF', // светло-фиолетовый
      animation: marketAnimation,
      totalLessons: 16,
      completedLessons: 2,
      category: 'recommended'
    },
    {
      id: 'care',
      title: 'Забота и поддержка',
      description: 'Малые действия каждый день: забота о здоровье, внимание, помощь',
      color: '#E8F5E8', // светло-зеленый
      animation: onlineSalesAnimation,
      totalLessons: 11,
      completedLessons: 6,
      category: 'new'
    },
    {
      id: 'fun',
      title: 'Веселье и креативность',
      description: 'Игры, совместные хобби, необычные активности, юмор в паре',
      color: '#FFF0E6', // светло-персиковый
      animation: websiteAnimation,
      totalLessons: 13,
      completedLessons: 4,
      category: 'popular'
    }
  ];

  const filteredThemes = themes.filter(theme => {
    if (filter === 'all') return true;
    return theme.category === filter;
  });

  const getProgressPercentage = (completed: number, total: number) => {
    return Math.round((completed / total) * 100);
  };

  const handleThemeClick = (themeId: string) => {
    if (onThemeSelect) {
      onThemeSelect(themeId);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          Выберите тему, которая важна для вас сейчас
        </h1>
        <p className={styles.subtitle}>
          Мы собрали уроки по ключевым областям отношений. Начните с того, что откликается вашей паре.
        </p>
      </div>

      {/* Filter */}
      <div className={styles.filterSection}>
        <div className={styles.filterContainer}>
          <Filter size={18} className={styles.filterIcon} />
          <div className={styles.filterButtons}>
            {[
              { key: 'all', label: 'Все темы' },
              { key: 'popular', label: 'Популярные' },
              { key: 'new', label: 'Новые' },
              { key: 'recommended', label: 'Рекомендуемые' }
            ].map((option) => (
              <button
                key={option.key}
                className={`${styles.filterButton} ${filter === option.key ? styles.active : ''}`}
                onClick={() => setFilter(option.key as any)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Themes Grid */}
      <motion.div 
        className={styles.themesGrid}
        layout
      >
        {filteredThemes.map((theme, index) => (
          <motion.div
            key={theme.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={styles.themeCard}
            style={{ backgroundColor: theme.color }}
            onMouseEnter={() => setHoveredCard(theme.id)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => handleThemeClick(theme.id)}
          >
            {/* Lottie Animation */}
            <div className={styles.animationContainer}>
              <Lottie
                animationData={theme.animation}
                loop={hoveredCard === theme.id}
                autoplay={hoveredCard === theme.id}
                className={styles.lottieAnimation}
              />
            </div>

            {/* Content */}
            <div className={styles.cardContent}>
              <h3 className={styles.themeTitle}>{theme.title}</h3>
              <p className={styles.themeDescription}>{theme.description}</p>
              
              {/* Progress */}
              <div className={styles.progressSection}>
                <div className={styles.progressText}>
                  {theme.completedLessons} из {theme.totalLessons} уроков
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${getProgressPercentage(theme.completedLessons, theme.totalLessons)}%` }}
                  />
                </div>
                <div className={styles.progressPercent}>
                  {getProgressPercentage(theme.completedLessons, theme.totalLessons)}%
                </div>
              </div>

              {/* Action Button */}
              <motion.button
                className={styles.openButton}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Открыть
                <ChevronRight size={16} className={styles.buttonIcon} />
              </motion.button>
            </div>

            {/* Hover overlay */}
            <motion.div
              className={styles.hoverOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: hoveredCard === theme.id ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Stats Summary */}
      <div className={styles.statsSection}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {themes.reduce((sum, theme) => sum + theme.completedLessons, 0)}
          </div>
          <div className={styles.statLabel}>Уроков пройдено</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {themes.reduce((sum, theme) => sum + theme.totalLessons, 0)}
          </div>
          <div className={styles.statLabel}>Всего уроков</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {Math.round((themes.reduce((sum, theme) => sum + theme.completedLessons, 0) / themes.reduce((sum, theme) => sum + theme.totalLessons, 0)) * 100)}%
          </div>
          <div className={styles.statLabel}>Общий прогресс</div>
        </div>
      </div>
    </div>
  );
};

export default ThemesTab;

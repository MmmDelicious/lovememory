import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { ChevronRight, Filter, BookOpen, Target } from 'lucide-react';
import styles from './ThemesTab.module.css';
import { themes as lessonThemes, getLessonAnimation } from '../../assets/lessons';
import { lessonService } from '../../services/lesson.service';
import { lessonUtils } from '../../utils/lessonUtils';

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

interface ThemeProgress {
  user: number;
  partner: number;
  total: number;
  percentage: number;
  lastCompleted?: string;
}

const ThemesTab: React.FC<ThemesTabProps> = ({ onThemeSelect }) => {
  const [filter, setFilter] = useState<'all' | 'popular' | 'new' | 'recommended'>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [themeProgress, setThemeProgress] = useState<{ [key: string]: ThemeProgress }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Маппинг для цветов и категорий тем
  const themeColors = {
    words_of_affirmation: '#FADADD', // розовый
    physical_touch: '#E6E0FF', // лавандовый
    quality_time: '#DFF6FF', // голубой
    acts_of_service: '#E8F5E8', // зеленый
    receiving_gifts: '#FFF0E6', // персиковый
    attachment_healing: '#F0E6FF', // фиолетовый
    heat_boosters: '#FFE6E6', // красноватый
    creative_time: '#E0F7F4' // мятный
  };

  const themeCategories = {
    words_of_affirmation: 'popular',
    physical_touch: 'popular',
    quality_time: 'popular',
    acts_of_service: 'new',
    receiving_gifts: 'new',
    attachment_healing: 'recommended',
    heat_boosters: 'recommended',
    creative_time: 'new'
  };

  // Маппинг анимаций для разных тем
  const themeAnimations = {
    words_of_affirmation: 'Love.json',
    physical_touch: 'Couple sharing and caring love.json',
    quality_time: 'Lover People Sitting on Garden Banch.json',
    acts_of_service: 'Business Animations - Flat Concept.json',
    receiving_gifts: 'Market Research.json',
    attachment_healing: 'Relationship.json',
    heat_boosters: 'Love.json',
    creative_time: 'Developer discussing different options.json'
  };

  // Загружаем прогресс по темам из API
  useEffect(() => {
    const loadThemeProgress = async () => {
      try {
        setLoading(true);
        const progressData = await lessonService.getProgress();
        setThemeProgress(progressData.themes || {});
      } catch (error) {
        console.error('Ошибка загрузки прогресса тем:', error);
        setError('Не удалось загрузить прогресс. Показаны тестовые данные.');
        // Fallback: используем тестовые данные
        const fallbackProgress: { [key: string]: ThemeProgress } = {};
        Object.keys(lessonThemes).forEach(themeId => {
          const totalLessons = lessonThemes[themeId as keyof typeof lessonThemes].count;
          fallbackProgress[themeId] = {
            user: Math.floor(Math.random() * totalLessons),
            partner: Math.floor(Math.random() * totalLessons),
            total: totalLessons,
            percentage: Math.floor(Math.random() * 100),
            lastCompleted: new Date().toISOString()
          };
        });
        setThemeProgress(fallbackProgress);
      } finally {
        setLoading(false);
      }
    };

    loadThemeProgress();
  }, []);

  // Создаем темы с реальными данными прогресса
  const themes: Theme[] = useMemo(() => 
    Object.entries(lessonThemes).map(([key, theme]) => {
      const progress = themeProgress[key];
      const userCompleted = progress?.user || 0;
      const totalLessons = theme.count;
      
      return {
        id: key,
        title: theme.name,
        description: theme.description,
        color: themeColors[key as keyof typeof themeColors] || '#DFF6FF',
        animation: getLessonAnimation(themeAnimations[key as keyof typeof themeAnimations] || 'Love.json'),
        totalLessons,
        completedLessons: userCompleted,
        category: (themeCategories[key as keyof typeof themeCategories] || 'new') as 'popular' | 'new' | 'recommended'
      };
    }), [lessonThemes, themeProgress]
  );

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

  const handleOpenButtonClick = (e: React.MouseEvent, themeId: string) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    handleThemeClick(themeId);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <h3>Загружаем ваш прогресс по темам...</h3>
          <p>Пожалуйста, подождите</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.errorBanner}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      
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
                onClick={(e) => handleOpenButtonClick(e, theme.id)}
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

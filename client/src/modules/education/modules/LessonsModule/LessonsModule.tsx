import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, BookOpen, ToggleLeft, ToggleRight, Users, User } from 'lucide-react';
import TodayTab from '../../components/TodayTab/TodayTab';
import ThemesTab from '../../components/ThemesTab/ThemesTab';
import { lessonService } from '../../../../services/lesson.service';
import { lessonUtils } from '../../../../shared/utils/lessonUtils';
import styles from './LessonsModule.module.css';

type TabType = 'today' | 'topics';
type ViewMode = 'my' | 'pair';

interface LessonsModuleProps {
  userId?: string;
  className?: string;
}

/**
 * Самостоятельный модуль обучения с полной бизнес-логикой
 * Отвечает за: управление уроками, прогресс, темы, состояние
 * Содержит собственное состояние, API-вызовы, обработку ошибок
 */
export const LessonsModule: React.FC<LessonsModuleProps> = ({
  userId,
  className
}) => {
  // Состояние модуля
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [viewMode, setViewMode] = useState<ViewMode>('my');
  const [todayLesson, setTodayLesson] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Загрузка данных
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'today') {
        const lesson = await lessonService.getTodaysLesson();
        setTodayLesson(lesson as any);
        
        const progressData = await lessonService.getProgress();
        setProgress(progressData as any);
      }
      
    } catch (err: any) {
      console.error('❌ LessonsModule: Error loading data:', err);
      setError(err.message || 'Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  // Эффекты
  useEffect(() => {
    loadData();
  }, [refreshKey]);

  useEffect(() => {
    if (!loading) {
      loadData();
    }
  }, [activeTab, viewMode]);

  // Обработчики событий
  const handleCompleteLesson = async (feedback: string) => {
    try {
      if (!todayLesson?.Lesson?.id) return;
      await lessonService.completeLesson(todayLesson.Lesson.id, feedback);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || 'Не удалось выполнить урок');
    }
  };

  const handleLessonCompleted = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleThemeSelect = (themeId: string) => {
    const themeLessons = lessonUtils.getLessonsByTheme(themeId);
    alert(`Функция просмотра уроков темы будет добавлена в следующем обновлении!`);
  };

  // Конфигурация вкладок
  const tabs = [
    { id: 'today' as const, label: 'Today', icon: Calendar },
    { id: 'topics' as const, label: 'Темы', icon: BookOpen }
  ];

  // Анимации
  const tabVariants = {
    inactive: { opacity: 0.7, scale: 0.95 },
    active: { opacity: 1, scale: 1 }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className={`${styles.lessonsModule} ${className || ''}`}>
      {/* Панель инструментов */}
      <section className={styles.headerRow}>
        <div className={styles.headerContent}>
          <motion.div 
            className={styles.viewModeToggle}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className={styles.toggleLabel}>
              {viewMode === 'my' ? 'Мой прогресс' : 'Прогресс пары'}
            </span>
            <button
              className={styles.toggleButton}
              onClick={() => setViewMode(viewMode === 'my' ? 'pair' : 'my')}
              aria-label={`Переключить на ${viewMode === 'my' ? 'прогресс пары' : 'мой прогресс'}`}
            >
              {viewMode === 'my' ? (
                <>
                  <User size={16} />
                  <ToggleLeft size={24} className={styles.toggleIcon} />
                </>
              ) : (
                <>
                  <Users size={16} />
                  <ToggleRight size={24} className={styles.toggleIcon} />
                </>
              )}
            </button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={styles.tabsInline}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  variants={tabVariants}
                  animate={activeTab === tab.id ? 'active' : 'inactive'}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={20} className={styles.tabIcon} />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Контент */}
      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {activeTab === 'today' && (
            <motion.div
              key="today"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <TodayTab
                lesson={todayLesson?.Lesson}
                onComplete={handleCompleteLesson}
                loading={loading}
                completionStatus={todayLesson?.completionStatus}
                viewMode={viewMode}
                streakDays={progress?.pair?.streak || progress?.user?.currentStreak || 3}
                lessonsCompleted={progress?.user?.totalCompleted || 12}
                coinsEarned={progress?.user?.totalCoinsEarned || 450}
                onLessonCompleted={handleLessonCompleted}
              />
            </motion.div>
          )}
          
          {activeTab === 'topics' && (
            <motion.div
              key="topics"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <ThemesTab onThemeSelect={handleThemeSelect} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Баннер ошибки */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={styles.errorBanner}
          >
            <div className={styles.errorContent}>
              <span className={styles.errorIcon}>!</span>
              <span>{error}</span>
              <button 
                onClick={() => {
                  setError(null);
                  setRefreshKey(prev => prev + 1);
                }}
                className={styles.retryButton}
              >
                Повторить
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
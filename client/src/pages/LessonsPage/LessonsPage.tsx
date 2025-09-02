import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, BookOpen, ToggleLeft, ToggleRight, Users, User } from 'lucide-react';
import DailyLesson from '../../components/DailyLesson/DailyLesson';
import TodayTab from '../../components/TodayTab/TodayTab';
import LessonProgress from '../../components/LessonProgress/LessonProgress';
import PsychologyTips from '../../components/PsychologyTips/PsychologyTips';
import ThemesTab from '../../components/ThemesTab/ThemesTab';

import { lessonService } from '../../services/lesson.service';
import { lessonUtils, type Lesson } from '../../utils/lessonUtils';
import styles from './LessonsPage.module.css';
const LessonsPage: React.FC = () => {
  // New tab structure: Today, Topics
  const [activeTab, setActiveTab] = useState<'today' | 'topics'>('today');
  
  // Partner mode toggle
  const [viewMode, setViewMode] = useState<'my' | 'pair'>('my');
  
  // Data states
  const [todayLesson, setTodayLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    loadData();
  }, [refreshKey]);
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load data based on active tab
      if (activeTab === 'today') {
        const lesson = await lessonService.getTodaysLesson();
        setTodayLesson(lesson);
      } 
      
      if (activeTab === 'today') {
        const progressData = await lessonService.getProgress();
        setProgress(progressData);
      }
      
      if (activeTab === 'topics') {
        // ThemesTab component handles its own data
      }
      
    } catch (err: any) {
      console.error('❌ LessonsPage: Error loading data:', err);
      setError(err.message || 'Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!loading) {
      loadData();
    }
  }, [activeTab, viewMode]);
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
    // Обновляем данные после завершения урока
    setRefreshKey(prev => prev + 1);
  };

  const handleThemeSelect = (themeId: string) => {
    // TODO: Переход к списку уроков темы
    const themeLessons = lessonUtils.getLessonsByTheme(themeId);
    console.log(`Выбрана тема ${themeId}, доступно ${themeLessons.length} уроков`);
    alert(`Функция просмотра уроков темы будет добавлена в следующем обновлении!`);
  };
  const tabVariants = {
    inactive: { opacity: 0.7, scale: 0.95 },
    active: { opacity: 1, scale: 1 }
  };
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };
  // New tab structure with updated icons and labels
  const tabs = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'topics', label: 'Темы', icon: BookOpen }
  ];
  return (
    <div className={styles.container}>
      {}
      {/* Header with progress toggle and tabs side by side */}
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
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  variants={tabVariants}
                  animate={activeTab === tab.id ? 'active' : 'inactive'}
                  onClick={() => setActiveTab(tab.id as any)}
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
      {}
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
              <ThemesTab
                onThemeSelect={handleThemeSelect}
              />
            </motion.div>
          )}


        </AnimatePresence>
      </div>
      {}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={styles.errorBanner}
          >
            <div className={styles.errorContent}>
              <span className={styles.errorIcon}>⚠️</span>
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
export default LessonsPage;

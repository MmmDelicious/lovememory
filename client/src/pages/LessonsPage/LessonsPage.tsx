import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, TrendingUp, Map, Lightbulb, User } from 'lucide-react';
import DailyLesson from '../../components/DailyLesson/DailyLesson';
import LessonProgress from '../../components/LessonProgress/LessonProgress';
import LessonPath from '../../components/LessonPath/LessonPath';
import PsychologyTips from '../../components/PsychologyTips/PsychologyTips';
import { lessonService } from '../../services/lesson.service';
import styles from './LessonsPage.module.css';

const LessonsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'progress' | 'path' | 'psychology'>('daily');
  const [dailyLesson, setDailyLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Загрузка данных
  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    console.log('🎯 LessonsPage: Loading data for tab:', activeTab);
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'daily') {
        console.log('📚 LessonsPage: Fetching daily lesson...');
        const lesson = await lessonService.getTodaysLesson();
        console.log('✅ LessonsPage: Daily lesson loaded:', lesson);
        setDailyLesson(lesson);
      } else if (activeTab === 'progress' || activeTab === 'path') {
        console.log('📊 LessonsPage: Fetching progress...');
        const progressData = await lessonService.getProgress();
        console.log('✅ LessonsPage: Progress loaded:', progressData);
        setProgress(progressData);
      }
    } catch (err: any) {
      console.error('❌ LessonsPage: Error loading data:', err);
      setError(err.message || 'Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  // Обновление данных при смене табов
  useEffect(() => {
    if (!loading) {
      loadData();
    }
  }, [activeTab]);

  const handleCompleteLesson = async (feedback: string) => {
    try {
      if (!dailyLesson?.Lesson?.id) return;

      await lessonService.completeLesson(dailyLesson.Lesson.id, feedback);
      
      // Обновляем данные
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || 'Не удалось выполнить урок');
    }
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

  const tabs = [
    { id: 'daily', label: 'Урок дня', icon: BookOpen },
    { id: 'progress', label: 'Прогресс', icon: TrendingUp },
    { id: 'path', label: 'Путь', icon: Map },
    { id: 'psychology', label: 'Советы', icon: Lightbulb }
  ];

  return (
    <div className={styles.container}>


      {/* Навигационные табы */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={styles.tabsContainer}
      >
        <div className={styles.tabs}>
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
        </div>
      </motion.div>

      {/* Основной контент */}
      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {activeTab === 'daily' && (
            <motion.div
              key="daily"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <DailyLesson
                lesson={dailyLesson}
                onComplete={handleCompleteLesson}
                loading={loading}
                completionStatus={dailyLesson?.completionStatus}
              />
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <LessonProgress
                progress={progress}
                loading={loading}
              />
            </motion.div>
          )}

          {activeTab === 'path' && (
            <motion.div
              key="path"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <LessonPath
                completedLessons={progress?.completedLessons || []}
                currentLesson={progress?.currentLesson || 'lesson_1'}
                totalLessons={progress?.totalLessons || 30}
                streakDays={progress?.streakDays || 0}
                onLessonSelect={(lessonId) => {
                  console.log('Selected lesson:', lessonId);
                  // TODO: Navigate to specific lesson
                }}
              />
            </motion.div>
          )}

          {activeTab === 'psychology' && (
            <motion.div
              key="psychology"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <PsychologyTips
                userPreferences={{
                  focusAreas: ['communication', 'intimacy'],
                  relationshipStage: 'developing'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ошибка */}
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
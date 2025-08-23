import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Map, BookOpen, BarChart3, ToggleLeft, ToggleRight, Users, User } from 'lucide-react';
import DailyLesson from '../../components/DailyLesson/DailyLesson';
import TodayTab from '../../components/TodayTab/TodayTab';
import LessonProgress from '../../components/LessonProgress/LessonProgress';
import LessonPath from '../../components/LessonPath/LessonPath';
import PsychologyTips from '../../components/PsychologyTips/PsychologyTips';
import InsightsTab from '../../components/InsightsTab/InsightsTab';
import { lessonService } from '../../services/lesson.service';
import styles from './LessonsPage.module.css';
const LessonsPage: React.FC = () => {
  // New tab structure: Today, Path, Topics, Insights
  const [activeTab, setActiveTab] = useState<'today' | 'path' | 'topics' | 'insights'>('today');
  
  // Partner mode toggle
  const [viewMode, setViewMode] = useState<'my' | 'pair'>('my');
  
  // Data states
  const [todayLesson, setTodayLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [topics, setTopics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    loadData();
  }, [refreshKey]);
  const loadData = async () => {
    console.log('🎯 LessonsPage: Loading data for tab:', activeTab, 'viewMode:', viewMode);
    try {
      setLoading(true);
      setError(null);
      
      // Load data based on active tab
      if (activeTab === 'today') {
        console.log('📅 LessonsPage: Fetching today\'s lesson...');
        const lesson = await lessonService.getTodaysLesson();
        console.log('✅ LessonsPage: Today lesson loaded:', lesson);
        setTodayLesson(lesson);
      } 
      
      if (activeTab === 'path' || activeTab === 'insights') {
        console.log('📊 LessonsPage: Fetching progress...');
        const progressData = await lessonService.getProgress();
        console.log('✅ LessonsPage: Progress loaded:', progressData);
        setProgress(progressData);
      }
      
      if (activeTab === 'topics') {
        console.log('📚 LessonsPage: Fetching topics...');
        // TODO: Implement getTopics service method
        const topicsData = null; // await lessonService.getTopics();
        setTopics(topicsData);
      }
      
      if (activeTab === 'insights') {
        console.log('💡 LessonsPage: Fetching insights...');
        // TODO: Implement getInsights service method
        const insightsData = null; // await lessonService.getInsights();
        setInsights(insightsData);
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
    { id: 'path', label: 'Путь', icon: Map },
    { id: 'topics', label: 'Темы', icon: BookOpen },
    { id: 'insights', label: 'Insights', icon: BarChart3 }
  ];
  return (
    <div className={styles.container}>
      {}
      {/* Compact header with partner mode toggle only */}
      <section className={styles.compactHeader}>
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
        </div>
      </section>
      {}
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
                streakDays={progress?.streakDays || 3}
                lessonsCompleted={progress?.completedLessons?.length || 12}
                coinsEarned={progress?.totalCoins || 450}
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
              <div className={styles.placeholderContent}>
                <h3>🚧 Topics Tab - В разработке</h3>
                <p>Здесь будет навигация по темам уроков с drill-down функциональностью</p>
                <div className={styles.placeholderFeatures}>
                  <div>📚 Темы уроков</div>
                  <div>🎯 Drill-down по урокам</div>
                  <div>📈 Прогресс по каждой теме</div>
                  <div>💡 Рекомендации</div>
                </div>
              </div>
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
                viewMode={viewMode}
                onLessonSelect={(lessonId) => {
                  console.log('Selected lesson:', lessonId);
                  // TODO: Navigate to lesson or open lesson modal
                }}
              />
            </motion.div>
          )}
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <InsightsTab
                viewMode={viewMode}
                loading={loading}
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

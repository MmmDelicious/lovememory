import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, Heart, Coffee, MessageCircle, Target, Users, Coins, Calendar, Share2 } from 'lucide-react';
import Lottie from 'lottie-react';
import { getLessonAnimation } from '../../assets/lessons';
import styles from './TodayTab.module.css';

interface TodayTabProps {
  lesson?: any;
  onComplete: (feedback: string) => void;
  loading?: boolean;
  completionStatus?: {
    userCompleted: boolean;
    partnerCompleted: boolean;
  };
  viewMode?: 'my' | 'pair';
  streakDays?: number;
  lessonsCompleted?: number;
  coinsEarned?: number;
}

interface RecommendationCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  duration?: string;
  category: string;
}

interface LessonStep {
  id: string;
  title: string;
  completed: boolean;
}

const TodayTab: React.FC<TodayTabProps> = ({
  lesson,
  onComplete,
  loading = false,
  completionStatus,
  viewMode = 'my',
  streakDays = 0,
  lessonsCompleted = 0,
  coinsEarned = 0
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);
  const [showSteps, setShowSteps] = useState(false);

  // Загружаем анимацию Lottie
  useEffect(() => {
    console.log('🎭 Loading Lottie animation...');
    
    // Список доступных анимаций для попытки загрузки
    const animationFiles = [
      'Couple sharing and caring love.json',
      'Love.json', 
      'Relationship.json',
      'Lover People Sitting on Garden Banch.json'
    ];
    
    for (const filename of animationFiles) {
      const animation = getLessonAnimation(filename);
      if (animation) {
        console.log('🎭 Successfully loaded:', filename);
        setAnimationData(animation);
        return;
      }
    }
    
    console.warn('🎭 No animations found!');
  }, []);

  const [steps, setSteps] = useState<LessonStep[]>([
    {
      id: 'read',
      title: 'Прочитайте стихотворение',
      completed: false
    },
    {
      id: 'hide',
      title: 'Скройте текст',
      completed: false
    },
    {
      id: 'recite',
      title: 'Расскажите наизусть',
      completed: false
    }
  ]);

  const recommendations: RecommendationCard[] = [
    {
      id: 'appreciation',
      title: 'Выразите благодарность',
      icon: <Heart size={20} />,
      description: 'Скажите партнеру, что вы цените в нем',
      duration: '2 мин',
      category: 'affirmation'
    },
    {
      id: 'walk',
      title: 'Прогуляйтесь вместе',
      icon: <Coffee size={20} />,
      description: 'Совершите осознанную прогулку на природе',
      duration: '15 мин',
      category: 'quality_time'
    },
    {
      id: 'values',
      title: 'Обсудите ваши ценности',
      icon: <MessageCircle size={20} />,
      description: 'Поделитесь тем, что важно для вас обоих',
      duration: '10 мин',
      category: 'communication'
    },
    {
      id: 'goals',
      title: 'Поставьте цели на неделю',
      icon: <Target size={20} />,
      description: 'Запланируйте что-то значимое вместе',
      duration: '5 мин',
      category: 'planning'
    }
  ];

  const handleStart = async () => {
    setIsStarting(true);
    // Simulate lesson start
    setTimeout(() => {
      setIsStarting(false);
      // Navigate to lesson or trigger lesson modal
    }, 1000);
  };

  const handleRecommendationAction = (recommendationId: string) => {
    console.log('Starting recommendation:', recommendationId);
    // TODO: Implement recommendation action
  };

  const handleSchedule = () => {
    console.log('Scheduling lesson with partner');
    // TODO: Implement schedule functionality
  };

  const handleShare = () => {
    console.log('Sharing lesson');
    // TODO: Implement share functionality
  };

  const toggleStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: !step.completed } : step
    ));
  };

  const handleMarkComplete = () => {
    const allCompleted = steps.every(step => step.completed);
    if (allCompleted) {
      onComplete('Урок завершен через чеклист');
    } else {
      // Отметить все шаги как выполненные
      setSteps(prev => prev.map(step => ({ ...step, completed: true })));
    }
  };

  const isCompleted = completionStatus?.userCompleted && completionStatus?.partnerCompleted;
  const progress = completionStatus?.userCompleted ? (completionStatus?.partnerCompleted ? 100 : 50) : 0;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загружаем урок дня...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      {/* Main Lesson Card */}
      <motion.div
        className={styles.mainLessonCard}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className={styles.lessonContent}>
          <div className={styles.lessonInfo}>
            {/* Встроенная статистика */}
            <div className={styles.inlineStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{streakDays}</span>
                <span className={styles.statText}>дней подряд</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{lessonsCompleted}</span>
                <span className={styles.statText}>уроков пройдено</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{coinsEarned}</span>
                <span className={styles.statText}>монет заработано</span>
              </div>
            </div>

            <div className={styles.lessonBadge}>
              УРОК ДНЯ
            </div>
            
            <h2 className={styles.lessonTitle}>
              {lesson?.title || 'Запомните короткое стихотворение'}
            </h2>
            
            <p className={styles.lessonDescription}>
              {lesson?.description || 'Выучите краткий стих наизусть'}
            </p>

            <div className={styles.lessonMeta}>
              <div className={styles.metaItem}>
                <Clock size={16} />
                <span>{lesson?.duration || '7'} мин</span>
              </div>
              <div className={styles.metaItem}>
                <Star size={16} />
                <span>{lesson?.difficulty || '3'}/3</span>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.avatars}>
                  <div className={styles.avatar}></div>
                  <div className={styles.avatar}></div>
                </div>
                <span>{progress}%</span>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <motion.button
                className={styles.startButton}
                onClick={handleStart}
                disabled={isStarting || isCompleted}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isStarting ? 'Запуск...' : isCompleted ? 'Завершено' : 'Начать'}
              </motion.button>
              
              <button className={styles.scheduleButton} onClick={handleSchedule}>
                Запланировать
              </button>
            </div>

            <div className={styles.shareSection}>
              <span className={styles.shareLabel}>Поделиться</span>
              <div className={styles.shareRewards}>
                <div className={styles.rewardItem}>
                  <Heart size={16} />
                  <span>3</span>
                </div>
                <div className={styles.rewardItem}>
                  <Coins size={16} />
                  <span>20</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.lessonVisual}>
            {/* Lottie Animation */}
            <div className={styles.animationContainer}>
              {animationData ? (
                <Lottie
                  animationData={animationData}
                  loop={true}
                  autoplay={true}
                  className={styles.lottieAnimation}
                />
              ) : (
                <div className={styles.animationPlaceholder}>
                  <div className={styles.placeholderContent}>
                    <span className={styles.placeholderEmoji}>💕</span>
                    <span className={styles.placeholderText}>Загрузка...</span>
                  </div>
                </div>
              )}
            </div>
            
         
          </div>
             {/* Steps Section */}
             <div className={styles.stepsSection}>
              <h3 className={styles.stepsTitle}>Шаги</h3>
              <div className={styles.stepsList}>
                {steps.map((step) => (
                  <div 
                    key={step.id} 
                    className={`${styles.stepItem} ${step.completed ? styles.completed : ''}`}
                    onClick={() => toggleStep(step.id)}
                  >
                    <div className={`${styles.stepCheckbox} ${step.completed ? styles.completed : ''}`}>
                      {step.completed && '✓'}
                    </div>
                    <span className={styles.stepTitle}>{step.title}</span>
                  </div>
                ))}
              </div>
              
              <button 
                className={styles.markCompleteButton}
                onClick={handleMarkComplete}
              >
                {steps.every(step => step.completed) ? 'Завершить урок' : 'Отметить как завершенное'}
              </button>
            </div>
        </div>
      </motion.div>

      {/* Recommendations Section */}
      <motion.div
        className={styles.recommendationsSection}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className={styles.sectionTitle}>Рекомендуется для вас</h3>
        
        <div className={styles.recommendationsGrid}>
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.id}
              className={styles.recommendationCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className={styles.recIcon}>
                {rec.icon}
              </div>
              <div className={styles.recContent}>
                <h4 className={styles.recTitle}>{rec.title}</h4>
                <p className={styles.recDescription}>{rec.description}</p>
                {rec.duration && (
                  <span className={styles.recDuration}>{rec.duration}</span>
                )}
              </div>
              <button 
                className={styles.recButton}
                onClick={() => handleRecommendationAction(rec.id)}
              >
                Do
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Invite Partner Section */}
      <motion.div
        className={styles.inviteSection}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button className={styles.inviteButton}>
          <Users size={20} />
          Пригласить партнера
        </button>
      </motion.div>
    </div>
  );
};

export default TodayTab;

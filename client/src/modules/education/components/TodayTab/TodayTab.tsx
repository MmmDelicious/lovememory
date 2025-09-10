import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, Heart, Coffee, MessageCircle, Target, Users, Coins, Calendar, Share2, CheckCircle } from 'lucide-react';
import Lottie from 'lottie-react';
import { getLessonAnimation } from '../../assets/lessons';
import { lessonUtils, type Lesson } from '../../../../shared/utils/lessonUtils';
import { lessonService } from '../../../../services/lesson.service';
import styles from './TodayTab.module.css';

interface TodayTabProps {
  lesson?: Lesson;
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
  onLessonCompleted?: () => void;
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
  coinsEarned = 0,
  onLessonCompleted
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionFeedback, setCompletionFeedback] = useState('');
  const [coinReward, setCoinReward] = useState<{
    baseCoins: number;
    streakBonus: number;
    partnerBonus: number;
    totalCoins: number;
  } | null>(null);

  // Загружаем анимацию Lottie для урока
  useEffect(() => {
    if (lesson?.animation_file) {
      const animation = getLessonAnimation(lesson.animation_file);
      if (animation) {
        setAnimationData(animation);
        return;
      }
    }
    
    // Fallback анимации
    const fallbackAnimations = [
      'Couple sharing and caring love.json',
      'Love.json', 
      'Relationship.json',
      'Lover People Sitting on Garden Banch.json'
    ];
    
    for (const filename of fallbackAnimations) {
      const animation = getLessonAnimation(filename);
      if (animation) {
        setAnimationData(animation);
        return;
      }
    }
    
  }, [lesson]);

  // Вычисляем награду за урок
  useEffect(() => {
    if (lesson) {
      const reward = lessonUtils.calculateLessonReward(
        lesson,
        streakDays,
        completionStatus?.partnerCompleted || false
      );
      setCoinReward(reward);
    }
  }, [lesson, streakDays, completionStatus?.partnerCompleted]);

  // Генерируем шаги на основе типа урока
  const generateStepsForLesson = (lesson: Lesson): LessonStep[] => {
    switch (lesson.interactive_type) {
      case 'prompt':
        return [
          { id: 'read', title: 'Прочитайте задание', completed: false },
          { id: 'execute', title: 'Выполните действие', completed: false },
          { id: 'reflect', title: 'Поделитесь впечатлениями', completed: false }
        ];
      case 'chat':
        return [
          { id: 'read', title: 'Изучите тему для разговора', completed: false },
          { id: 'discuss', title: 'Обсудите с партнером', completed: false },
          { id: 'complete', title: 'Завершите беседу', completed: false }
        ];
      case 'quiz':
        return [
          { id: 'prepare', title: 'Подготовьте вопросы', completed: false },
          { id: 'play', title: 'Проведите викторину', completed: false },
          { id: 'results', title: 'Обсудите результаты', completed: false }
        ];
      case 'photo':
        return [
          { id: 'prepare', title: 'Подготовьте материалы', completed: false },
          { id: 'create', title: 'Создайте/сфотографируйте', completed: false },
          { id: 'share', title: 'Поделитесь результатом', completed: false }
        ];
      case 'choice':
        return [
          { id: 'read', title: 'Изучите варианты', completed: false },
          { id: 'choose', title: 'Сделайте выбор', completed: false },
          { id: 'execute', title: 'Выполните выбранное', completed: false }
        ];
      default:
        return [
          { id: 'read', title: 'Прочитайте урок', completed: false },
          { id: 'execute', title: 'Выполните задание', completed: false },
          { id: 'complete', title: 'Завершите урок', completed: false }
        ];
    }
  };

  const [steps, setSteps] = useState<LessonStep[]>(
    lesson ? generateStepsForLesson(lesson) : []
  );

  // Обновляем шаги при изменении урока
  useEffect(() => {
    if (lesson) {
      setSteps(generateStepsForLesson(lesson));
    }
  }, [lesson]);

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
    
    // Показываем шаги урока
    setShowSteps(true);
    
    setTimeout(() => {
      setIsStarting(false);
    }, 1000);
  };

  const handleRecommendationAction = (recommendationId: string) => {
    // Простое уведомление для пользователя
    alert(`Начинаем рекомендацию: ${recommendations.find(r => r.id === recommendationId)?.title}`);
    
    // В реальном приложении здесь был бы переход к конкретному уроку или активности
  };

  const handleSchedule = () => {
    // Простое уведомление
    alert('Функция планирования будет доступна в следующем обновлении!');
  };

  const handleShare = () => {
    // Простое уведомление
    if (navigator.share) {
      navigator.share({
        title: 'Урок дня - LoveMemory',
        text: lesson?.title || 'Запомните короткое стихотворение',
        url: window.location.href
      });
    } else {
      alert('Ссылка скопирована в буфер обмена!');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const toggleStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: !step.completed } : step
    ));
  };

  const handleMarkComplete = async () => {
    const allCompleted = steps.every(step => step.completed);
    
    if (!allCompleted) {
      // Отметить все шаги как выполненные
      setSteps(prev => prev.map(step => ({ ...step, completed: true })));
      return;
    }

    if (!lesson) return;

    setIsCompleting(true);
    
    try {
      // Отправляем завершение урока на сервер
      await lessonService.completeLesson(lesson.id, completionFeedback);
      
      // Уведомляем родительский компонент
      onComplete(completionFeedback || 'Урок завершен успешно!');
      
      // Обновляем данные
      if (onLessonCompleted) {
        onLessonCompleted();
      }
      
    } catch (error) {
      console.error('Ошибка при завершении урока:', error);
      alert('Произошла ошибка при сохранении урока. Попробуйте еще раз.');
    } finally {
      setIsCompleting(false);
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
              {lesson?.title || 'Урок дня загружается...'}
            </h2>
            
            <p className={styles.lessonDescription}>
              {lesson?.text || 'Описание урока будет доступно после загрузки'}
            </p>

            <div className={styles.lessonMeta}>
              <div className={styles.metaItem}>
                <Clock size={16} />
                <span>{lesson?.difficulty_level ? `${lesson.difficulty_level * 2 + 3}` : '7'} мин</span>
              </div>
              <div className={styles.metaItem}>
                <Star size={16} />
                <span>{lesson?.difficulty_level || 2}/5</span>
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
                className="btn-prototype"
                onClick={handleStart}
                disabled={isStarting || isCompleted}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isStarting ? 'Запуск...' : isCompleted ? 'Завершено' : 'Начать'}
              </motion.button>
              
              <button className="btn-prototype btn-prototype--outline" onClick={handleSchedule}>
                Запланировать
              </button>
              
              <button className="btn-prototype btn-prototype--outline" onClick={handleShare}>
                <Share2 size={16} />
                Поделиться
              </button>
            </div>

            <div className={styles.shareSection}>
              <span className={styles.shareLabel}>Награда за урок</span>
              <div className={styles.shareRewards}>
                {coinReward && (
                  <>
                    <div className={styles.rewardItem}>
                      <Coins size={16} />
                      <span>{coinReward.baseCoins}</span>
                      <small>базовая</small>
                    </div>
                    {coinReward.streakBonus > 0 && (
                      <div className={styles.rewardItem}>
                        <Star size={16} />
                        <span>+{coinReward.streakBonus}</span>
                        <small>стрик</small>
                      </div>
                    )}
                    {coinReward.partnerBonus > 0 && (
                      <div className={styles.rewardItem}>
                        <Heart size={16} />
                        <span>+{coinReward.partnerBonus}</span>
                        <small>вместе</small>
                      </div>
                    )}
                    <div className={styles.rewardTotal}>
                      <strong>Итого: {coinReward.totalCoins}</strong>
                    </div>
                  </>
                )}
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
             {/* Steps Section - показывается только после нажатия "Начать" */}
             {showSteps && (
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
                
                {!steps.every(step => step.completed) ? (
                  <button 
                    className="btn-prototype"
                    onClick={handleMarkComplete}
                  >
                    Отметить все как выполненное
                  </button>
                ) : (
                  <div className={styles.completionSection}>
                    <textarea
                      className={styles.feedbackInput}
                      placeholder="Поделитесь впечатлениями от урока (необязательно)..."
                      value={completionFeedback}
                      onChange={(e) => setCompletionFeedback(e.target.value)}
                      rows={3}
                    />
                    <button 
                      className="btn-prototype"
                      onClick={handleMarkComplete}
                      disabled={isCompleting}
                    >
                      {isCompleting ? (
                        <>
                          <div className={styles.completingSpinner}></div>
                          Сохраняем...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Завершить урок
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
             )}
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
        <button className="btn-prototype btn-prototype--outline">
          <Users size={20} />
          Пригласить партнера
        </button>
      </motion.div>
    </div>
  );
};

export default TodayTab;

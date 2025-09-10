import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Clock, CheckCircle } from 'lucide-react';
import Lottie from 'lottie-react';
import { getLessonAnimation } from '../../assets/lessons';
// Removed useDevice import - hook was deleted
import styles from './DailyLesson.module.css';

import type { Lesson } from '../../../types/common';

interface DailyLessonProps {
  lesson?: Lesson;
  onComplete: (feedback: string) => void;
  loading?: boolean;
  completionStatus?: {
    userCompleted: boolean;
    partnerCompleted: boolean;
  };
  viewMode?: 'my' | 'pair';
}

const DailyLesson: React.FC<DailyLessonProps> = ({
  lesson,
  onComplete,
  loading = false,
  completionStatus,
  viewMode = 'my'
}) => {
  const [feedback, setFeedback] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);
  const [startTime] = useState(Date.now());
  const isMobile = false; // useDevice removed - default to desktop
  
  
  const getAnimationSize = () => {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 480) {
      return { width: '150px', height: '150px' };
    } else if (screenWidth <= 768) {
      return { width: '180px', height: '180px' };
    }
    return { width: '240px', height: '240px' };
  };
  
  const [animationSize, setAnimationSize] = useState(getAnimationSize());
  
  // Обновляем размер анимации при изменении размера экрана
  useEffect(() => {
    const handleResize = () => {
      setAnimationSize(getAnimationSize());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Загружаем анимацию Lottie
  useEffect(() => {
    const animationFile = lesson?.Lesson?.animation_file || lesson?.animation_file;
    if (animationFile) {
      const animation = getLessonAnimation(animationFile);
      if (animation) {
        setAnimationData(animation);
      } else {
      }
    }
  }, [lesson?.Lesson?.animation_file, lesson?.animation_file]);

  const handleComplete = async () => {
    if (!lesson) return;
    
    setIsCompleting(true);
    const completionTime = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      await onComplete(feedback);
    } finally {
      setIsCompleting(false);
    }
  };

  const isUserCompleted = completionStatus?.userCompleted;
  const isPartnerCompleted = completionStatus?.partnerCompleted;
  const isBothCompleted = isUserCompleted && isPartnerCompleted;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Подбираем идеальный урок для вас...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h3>Урок недоступен</h3>
          <p>Попробуйте обновить страницу или обратитесь в поддержку.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.lessonCard}
      >
        {/* Анимация Lottie */}
        {animationData && (
          <div className={styles.animationContainer}>
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              width={parseInt(animationSize.width)}
              height={parseInt(animationSize.height)}
              style={{
                maxWidth: '100%',
                maxHeight: '100%'
              }}
              className={styles.animation}
            />
          </div>
        )}

        {/* Заголовок урока */}
        <div className={styles.header}>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={styles.title}
          >
            {lesson?.Lesson?.title || lesson?.title || 'Загрузка...'}
          </motion.h2>
          
          <div className={styles.rewardBadge}>
            <Coins size={16} className={styles.coinIcon} />
            <span>{lesson?.Lesson?.base_coins_reward || lesson?.base_coins_reward || 0}</span>
            {(lesson?.streak_bonus || lesson?.Lesson?.streak_bonus) && ((lesson?.streak_bonus && lesson.streak_bonus > 0) || (lesson?.Lesson?.streak_bonus && lesson.Lesson.streak_bonus > 0)) && (
              <span className={styles.streakBonus}>+{lesson?.streak_bonus || lesson?.Lesson?.streak_bonus}</span>
            )}
          </div>
        </div>

        {/* Описание урока */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={styles.content}
        >
          <p className={styles.description}>
            {lesson?.Lesson?.text || lesson?.text || 'Описание урока...'}
          </p>
        </motion.div>

        {/* Статус выполнения */}
        <div className={styles.completionStatus}>
          <div className={`${styles.statusItem} ${isUserCompleted ? styles.completed : ''}`}>
            <span className={styles.statusIcon}>
              {isUserCompleted ? <CheckCircle size={20} /> : <Clock size={20} />}
            </span>
            <span>Вы</span>
          </div>
          <div className={`${styles.statusItem} ${isPartnerCompleted ? styles.completed : ''}`}>
            <span className={styles.statusIcon}>
              {isPartnerCompleted ? <CheckCircle size={20} /> : <Clock size={20} />}
            </span>
            <span>Партнер</span>
          </div>
        </div>

        {/* Интерактивная часть */}
        <AnimatePresence>
          {!isUserCompleted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={styles.interactiveSection}
            >
              {(lesson?.Lesson?.interactive_type || lesson?.interactive_type) === 'chat' && (
                <div className={styles.chatInput}>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Поделитесь своими мыслями или опишите, как прошел урок..."
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
              )}

              {(lesson?.Lesson?.interactive_type || lesson?.interactive_type) === 'prompt' && (
                <div className={styles.promptInput}>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Опишите, как вы выполнили это задание..."
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
              )}

              {(lesson?.Lesson?.interactive_type || lesson?.interactive_type) === 'photo' && (
                <div className={styles.photoInput}>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className={styles.photoLabel}>
                    📸 Добавить фото
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Расскажите о фото..."
                    className={styles.textarea}
                    rows={2}
                  />
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleComplete}
                disabled={isCompleting}
                className={styles.completeButton}
              >
                {isCompleting ? (
                  <div className={styles.buttonSpinner}>
                    <div className={styles.miniSpinner}></div>
                    Выполняется...
                  </div>
                ) : (
                  <>
                    <span>✨ Выполнить урок</span>
                    <span className={styles.reward}>
                      +{lesson?.Lesson?.base_coins_reward || lesson?.base_coins_reward || 0} <Coins size={16} />
                    </span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Сообщение о завершении */}
        {isUserCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.completedMessage}
          >
            <div className={styles.celebrationIcon}>🎉</div>
            <h3>Урок выполнен!</h3>
            <p>
              {isBothCompleted 
                ? 'Отлично! Вы оба выполнили урок сегодня!' 
                : 'Ждем, когда партнер тоже выполнит урок.'
              }
            </p>
          </motion.div>
        )}

        {/* Теги урока */}
        <div className={styles.tags}>
          {(lesson?.Lesson?.tags || lesson?.tags || []).map((tag: string, index: number) => (
            <span key={index} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default DailyLesson;

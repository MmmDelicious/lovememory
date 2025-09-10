import React, { useState, useEffect } from 'react';
import { FaStar, FaHeart, FaTimes, FaClock } from 'react-icons/fa';
import FeedbackModal from '../FeedbackModal/FeedbackModal';
import feedbackService from '../../services/feedback.service';
import styles from './FeedbackNotification.module.css';

interface PendingRecommendation {
  id: string;
  pair_id: string;
  entity_type: 'place' | 'activity' | 'event' | 'insight' | 'date_idea' | 'gift' | 'lesson' | 'game' | 'other';
  entity_id: string;
  entity_data: {
    name: string;
    description?: string;
    location?: string;
    image?: string;
  };
  recommendation_context?: any;
  recommendation_date: string;
  days_passed: number;
}

interface FeedbackNotificationProps {
  pairId: string;
  onFeedbackSubmitted?: () => void;
}

const FeedbackNotification: React.FC<FeedbackNotificationProps> = ({
  pairId,
  onFeedbackSubmitted
}) => {
  const [pendingRecommendations, setPendingRecommendations] = useState<PendingRecommendation[]>([]);
  const [currentRecommendation, setCurrentRecommendation] = useState<PendingRecommendation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPendingFeedback();
  }, [pairId]);

  const loadPendingFeedback = async () => {
    try {
      setIsLoading(true);
      // В реальной реализации здесь будет запрос к API для получения рекомендаций без фидбэка
      // Пока создаем mock данные для демонстрации
      const mockRecommendations: PendingRecommendation[] = [
        {
          id: '1',
          pair_id: pairId,
          entity_type: 'place',
          entity_id: 'restaurant_123',
          entity_data: {
            name: 'Кафе "Уютное место"',
            description: 'Романтичное кафе с видом на город',
            location: 'ул. Пушкина, 15'
          },
          recommendation_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 дня назад
          days_passed: 2
        }
      ];

      // Фильтруем только те рекомендации, которые старше 1 дня
      const oldRecommendations = mockRecommendations.filter(r => r.days_passed >= 1);
      setPendingRecommendations(oldRecommendations);
    } catch (error) {
      console.error('Error loading pending feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFeedback = (recommendation: PendingRecommendation) => {
    setCurrentRecommendation(recommendation);
    setIsModalOpen(true);
  };

  const handleFeedbackSubmit = async (feedbackData: any) => {
    try {
      await feedbackService.createFeedback(feedbackData);
      
      // Удаляем рекомендацию из списка ожидающих
      setPendingRecommendations(prev => 
        prev.filter(r => r.id !== currentRecommendation?.id)
      );
      
      setIsModalOpen(false);
      setCurrentRecommendation(null);
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error; // Пробрасываем ошибку для обработки в модалке
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Можно сохранить в localStorage, что пользователь отклонил уведомления
    localStorage.setItem(`feedback_dismissed_${pairId}`, Date.now().toString());
  };

  const handleDismissAll = () => {
    setPendingRecommendations([]);
    setIsDismissed(true);
  };

  // Проверяем, не отклонял ли пользователь уведомления недавно
  useEffect(() => {
    const dismissedTime = localStorage.getItem(`feedback_dismissed_${pairId}`);
    if (dismissedTime) {
      const timePassed = Date.now() - parseInt(dismissedTime);
      const hoursPassed = timePassed / (1000 * 60 * 60);
      
      // Если прошло меньше 24 часов с момента отклонения, не показываем уведомления
      if (hoursPassed < 24) {
        setIsDismissed(true);
      }
    }
  }, [pairId]);

  if (isLoading || isDismissed || pendingRecommendations.length === 0) {
    return null;
  }

  return (
    <>
      <div className={styles.notification}>
        <div className={styles.header}>
          <div className={styles.icon}>
            <FaStar />
          </div>
          <div className={styles.content}>
            <h3 className={styles.title}>Поделитесь впечатлениями!</h3>
            <p className={styles.subtitle}>
              У вас есть {pendingRecommendations.length} рекомендаций, которые ждут вашего отзыва
            </p>
          </div>
          <button className={styles.dismissButton} onClick={handleDismiss}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.recommendations}>
          {pendingRecommendations.slice(0, 3).map(recommendation => (
            <div key={recommendation.id} className={styles.recommendationCard}>
              <div className={styles.cardContent}>
                <div className={styles.cardIcon}>
                  {recommendation.entity_type === 'place' && '📍'}
                  {recommendation.entity_type === 'activity' && '🎯'}
                  {recommendation.entity_type === 'event' && '📅'}
                  {recommendation.entity_type === 'date_idea' && '💕'}
                </div>
                <div className={styles.cardDetails}>
                  <h4 className={styles.cardTitle}>{recommendation.entity_data.name}</h4>
                  <p className={styles.cardSubtitle}>
                    <FaClock /> {recommendation.days_passed} {recommendation.days_passed === 1 ? 'день' : 'дня'} назад
                  </p>
                  {recommendation.entity_data.location && (
                    <p className={styles.cardLocation}>{recommendation.entity_data.location}</p>
                  )}
                </div>
                <button 
                  className={styles.feedbackButton}
                  onClick={() => handleOpenFeedback(recommendation)}
                >
                  Оценить
                </button>
              </div>
            </div>
          ))}
        </div>

        {pendingRecommendations.length > 3 && (
          <div className={styles.moreCount}>
            И еще {pendingRecommendations.length - 3} рекомендаций...
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.actionButton} onClick={handleDismissAll}>
            Напомнить позже
          </button>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleOpenFeedback(pendingRecommendations[0])}
          >
            Начать оценку
          </button>
        </div>
      </div>

      {currentRecommendation && (
        <FeedbackModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setCurrentRecommendation(null);
          }}
          onSubmit={handleFeedbackSubmit}
          recommendation={currentRecommendation}
        />
      )}
    </>
  );
};

export default FeedbackNotification;

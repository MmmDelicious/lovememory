import React, { useState } from 'react';
import { FaStar, FaThumbsUp, FaThumbsDown, FaTimes, FaHeart, FaMapMarkerAlt } from 'react-icons/fa';
import Button from '../Button/Button';
import styles from './FeedbackModal.module.css';

export interface FeedbackData {
  pair_id: string;
  entity_type: 'place' | 'activity' | 'event' | 'insight' | 'date_idea' | 'gift' | 'lesson' | 'game' | 'other';
  entity_id: string;
  entity_data: {
    name: string;
    description?: string;
    location?: string;
    image?: string;
    [key: string]: any;
  };
  value: number;
  comment?: string;
  recommendation_context?: any;
  feedback_type: 'rating' | 'visited' | 'not_visited' | 'cancelled';
  visit_date?: string;
  tags?: string[];
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FeedbackData) => Promise<void>;
  recommendation: {
    pair_id: string;
    entity_type: FeedbackData['entity_type'];
    entity_id: string;
    entity_data: FeedbackData['entity_data'];
    recommendation_context?: any;
    recommendation_date?: string;
  };
}

const entityTypeLabels = {
  place: { label: 'Место', icon: '📍' },
  activity: { label: 'Активность', icon: '🎯' },
  event: { label: 'Событие', icon: '📅' },
  insight: { label: 'Совет', icon: '💡' },
  date_idea: { label: 'Идея свидания', icon: '💕' },
  gift: { label: 'Подарок', icon: '🎁' },
  lesson: { label: 'Урок', icon: '📚' },
  game: { label: 'Игра', icon: '🎮' },
  other: { label: 'Другое', icon: '📋' }
};

const ratingLabels = [
  { value: 1, label: 'Ужасно', emoji: '😤', color: '#f44336' },
  { value: 2, label: 'Плохо', emoji: '😞', color: '#ff5722' },
  { value: 3, label: 'Не очень', emoji: '😐', color: '#ff9800' },
  { value: 4, label: 'Нормально', emoji: '🙂', color: '#ffc107' },
  { value: 5, label: 'Неплохо', emoji: '😊', color: '#ffeb3b' },
  { value: 6, label: 'Хорошо', emoji: '😄', color: '#cddc39' },
  { value: 7, label: 'Здорово', emoji: '😍', color: '#8bc34a' },
  { value: 8, label: 'Отлично', emoji: '🤩', color: '#4caf50' },
  { value: 9, label: 'Потрясающе', emoji: '🥰', color: '#2196f3' },
  { value: 10, label: 'Идеально!', emoji: '🔥', color: '#9c27b0' }
];

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  recommendation
}) => {
  const [rating, setRating] = useState<number>(7);
  const [feedbackType, setFeedbackType] = useState<'rating' | 'visited' | 'not_visited' | 'cancelled'>('rating');
  const [comment, setComment] = useState('');
  const [visitDate, setVisitDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'type' | 'rating' | 'details'>('type');

  React.useEffect(() => {
    if (isOpen) {
      // Сброс состояния при открытии
      setRating(7);
      setFeedbackType('rating');
      setComment('');
      setVisitDate('');
      setStep('type');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const entityInfo = entityTypeLabels[recommendation.entity_type];
  const currentRatingInfo = ratingLabels.find(r => r.value === rating);

  const handleTypeSelection = (type: typeof feedbackType) => {
    setFeedbackType(type);
    if (type === 'visited') {
      setStep('rating');
    } else {
      setStep('details');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const feedbackData: FeedbackData = {
        pair_id: recommendation.pair_id,
        entity_type: recommendation.entity_type,
        entity_id: recommendation.entity_id,
        entity_data: recommendation.entity_data,
        value: rating,
        comment: comment.trim() || undefined,
        recommendation_context: recommendation.recommendation_context,
        feedback_type: feedbackType,
        visit_date: visitDate || undefined,
        tags: [] // Можно добавить автоматические теги на основе рейтинга
      };

      await onSubmit(feedbackData);
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepType = () => (
    <div className={styles.stepContent}>
      <h3 className={styles.stepTitle}>Как прошло?</h3>
      <p className={styles.stepSubtitle}>
        Расскажите о своем опыте с рекомендацией
      </p>

      <div className={styles.typeOptions}>
        <button
          className={`${styles.typeOption} ${feedbackType === 'visited' ? styles.selected : ''}`}
          onClick={() => handleTypeSelection('visited')}
        >
          <div className={styles.typeIcon}>✅</div>
          <div className={styles.typeText}>
            <div className={styles.typeLabel}>Были там</div>
            <div className={styles.typeDescription}>Посетили это место</div>
          </div>
        </button>

        <button
          className={`${styles.typeOption} ${feedbackType === 'not_visited' ? styles.selected : ''}`}
          onClick={() => handleTypeSelection('not_visited')}
        >
          <div className={styles.typeIcon}>❌</div>
          <div className={styles.typeText}>
            <div className={styles.typeLabel}>Не пошли</div>
            <div className={styles.typeDescription}>Решили не идти</div>
          </div>
        </button>

        <button
          className={`${styles.typeOption} ${feedbackType === 'cancelled' ? styles.selected : ''}`}
          onClick={() => handleTypeSelection('cancelled')}
        >
          <div className={styles.typeIcon}>⏰</div>
          <div className={styles.typeText}>
            <div className={styles.typeLabel}>Отменили</div>
            <div className={styles.typeDescription}>Планы изменились</div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderStepRating = () => (
    <div className={styles.stepContent}>
      <h3 className={styles.stepTitle}>Оцените впечатления</h3>
      <p className={styles.stepSubtitle}>
        Как вам понравилось {recommendation.entity_data.name}?
      </p>

      <div className={styles.ratingSection}>
        <div className={styles.ratingDisplay}>
          <div 
            className={styles.ratingEmoji}
            style={{ color: currentRatingInfo?.color }}
          >
            {currentRatingInfo?.emoji}
          </div>
          <div className={styles.ratingText}>
            <div className={styles.ratingValue}>{rating}/10</div>
            <div className={styles.ratingLabel}>{currentRatingInfo?.label}</div>
          </div>
        </div>

        <div className={styles.ratingSlider}>
          <input
            type="range"
            min="1"
            max="10"
            value={rating}
            onChange={(e) => setRating(parseInt(e.target.value))}
            className={styles.slider}
            style={{
              background: `linear-gradient(to right, ${currentRatingInfo?.color} 0%, ${currentRatingInfo?.color} ${(rating - 1) * 11.11}%, #e0e0e0 ${(rating - 1) * 11.11}%, #e0e0e0 100%)`
            }}
          />
          <div className={styles.ratingTicks}>
            {ratingLabels.map((r, index) => (
              <div 
                key={r.value} 
                className={`${styles.ratingTick} ${rating === r.value ? styles.active : ''}`}
                onClick={() => setRating(r.value)}
              >
                {r.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.stepActions}>
        <Button type="secondary" onClick={() => setStep('details')}>
          Далее
        </Button>
      </div>
    </div>
  );

  const renderStepDetails = () => (
    <div className={styles.stepContent}>
      <h3 className={styles.stepTitle}>Дополнительная информация</h3>
      
      {feedbackType === 'visited' && (
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Когда были?</label>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className={styles.dateInput}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          Комментарий <span className={styles.optional}>(необязательно)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={
            feedbackType === 'visited' 
              ? 'Поделитесь впечатлениями...' 
              : 'Расскажите, почему не пошли...'
          }
          className={styles.textarea}
          rows={4}
          maxLength={500}
        />
        <div className={styles.charCount}>{comment.length}/500</div>
      </div>

      <div className={styles.stepActions}>
        {feedbackType === 'visited' && (
          <Button type="secondary" onClick={() => setStep('rating')}>
            Назад
          </Button>
        )}
        <Button 
          type="primary" 
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Отправляем...' : 'Отправить отзыв'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.entityInfo}>
            <span className={styles.entityIcon}>{entityInfo.icon}</span>
            <div className={styles.entityDetails}>
              <h2 className={styles.entityName}>{recommendation.entity_data.name}</h2>
              <p className={styles.entityType}>{entityInfo.label}</p>
              {recommendation.entity_data.location && (
                <p className={styles.entityLocation}>
                  <FaMapMarkerAlt /> {recommendation.entity_data.location}
                </p>
              )}
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.content}>
          {step === 'type' && renderStepType()}
          {step === 'rating' && renderStepRating()}
          {step === 'details' && renderStepDetails()}
        </div>

        <div className={styles.footer}>
          <div className={styles.steps}>
            <div className={`${styles.stepIndicator} ${step === 'type' ? styles.active : styles.completed}`}>1</div>
            {feedbackType === 'visited' && (
              <div className={`${styles.stepIndicator} ${step === 'rating' ? styles.active : step === 'details' ? styles.completed : ''}`}>2</div>
            )}
            <div className={`${styles.stepIndicator} ${step === 'details' ? styles.active : ''}`}>{feedbackType === 'visited' ? '3' : '2'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;

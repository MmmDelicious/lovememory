import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DayDetailModule } from '../../modules';
import { useAuth } from '../../../auth/hooks/useAuth';
import styles from './DayDetailPage.module.css';
/**
 * Тонкая страница детального просмотра дня
 * Содержит только навигационную логику, всю бизнес-логику делегирует модулю DayDetailModule
 */
const DayDetailPage = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Обработчики навигации
  const handleNavigateBack = () => {
    navigate(-1);
  };

  const handleEventEdit = (eventId) => {
    navigate(`/event/edit/${eventId}`);
  };

  const handleEventCreate = (eventData) => {
    navigate('/dashboard', { state: { quickAdd: eventData.template, date } });
  };

  if (!date) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Неверная дата</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Необходима авторизация</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <DayDetailModule
        date={date}
        userId={user?.id}
        onNavigateBack={handleNavigateBack}
        onEventEdit={handleEventEdit}
        onEventCreate={handleEventCreate}
      />
    </div>
  );
};

export default DayDetailPage;

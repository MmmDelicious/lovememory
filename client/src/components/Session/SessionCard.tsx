import React, { useState } from 'react';
import { Session } from '../../../types/models';
import sessionService from '../../services/session.service';
import styles from './SessionCard.module.css';

interface SessionCardProps {
  session: Session;
  onUpdate?: (session: Session) => void;
  onDelete?: (sessionId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onUpdate,
  onDelete,
  showActions = true,
  compact = false
}) => {
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🔴'; // Active/Live
      case 'paused':
        return '⏸️'; // Paused
      case 'completed':
        return '✅'; // Completed
      case 'cancelled':
        return '❌'; // Cancelled
      default:
        return '⏱️'; // Default
    }
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'date':
        return '💕';
      case 'activity':
        return '🎯';
      case 'conversation':
        return '💬';
      case 'planning':
        return '📋';
      case 'reflection':
        return '🤔';
      case 'exercise':
        return '🏃‍♀️';
      case 'learning':
        return '📚';
      default:
        return '📝';
    }
  };

  const formatDuration = (durationMinutes: number) => {
    if (!durationMinutes) return 'Не указано';
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
  };

  const handleAction = async (action: string) => {
    if (loading) return;
    
    setLoading(true);
    try {
      let updatedSession;
      
      switch (action) {
        case 'pause':
          await sessionService.pauseSession(session.id);
          updatedSession = { ...session, status: 'paused' };
          break;
        case 'resume':
          await sessionService.resumeSession(session.id);
          updatedSession = { ...session, status: 'active' };
          break;
        case 'complete':
          await sessionService.completeSession(session.id);
          updatedSession = { ...session, status: 'completed', ended_at: new Date().toISOString() };
          break;
        case 'cancel':
          const reason = prompt('Причина отмены (необязательно):');
          await sessionService.cancelSession(session.id, reason);
          updatedSession = { ...session, status: 'cancelled' };
          break;
        case 'delete':
          if (window.confirm('Вы уверены, что хотите удалить эту сессию?')) {
            onDelete?.(session.id);
          }
          return;
        default:
          return;
      }
      
      onUpdate?.(updatedSession);
    } catch (error) {
      console.error(`Error ${action} session:`, error);
      alert(`Ошибка при ${action === 'pause' ? 'приостановке' : action === 'resume' ? 'возобновлении' : action === 'complete' ? 'завершении' : 'отмене'} сессии`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async () => {
    const goal = prompt('Введите новую цель:');
    if (!goal) return;
    
    try {
      await sessionService.addGoalToSession(session.id, goal);
      const updatedSession = {
        ...session,
        goals: [...(session.goals || []), goal]
      };
      onUpdate?.(updatedSession);
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Ошибка при добавлении цели');
    }
  };

  const handleAddAchievement = async () => {
    const achievement = prompt('Введите достижение:');
    if (!achievement) return;
    
    try {
      await sessionService.addAchievementToSession(session.id, achievement);
      const updatedSession = {
        ...session,
        achievements: [...(session.achievements || []), achievement]
      };
      onUpdate?.(updatedSession);
    } catch (error) {
      console.error('Error adding achievement:', error);
      alert('Ошибка при добавлении достижения');
    }
  };

  if (compact) {
    return (
      <div className={`${styles.sessionCard} ${styles.compact}`}>
        <div className={styles.compactHeader}>
          <span className={styles.typeIcon}>
            {getSessionTypeIcon(session.session_type)}
          </span>
          <span className={styles.title}>{session.title || 'Без названия'}</span>
          <span className={styles.status}>
            {getStatusIcon(session.status)}
          </span>
        </div>
        <div className={styles.compactMeta}>
          <span className={styles.duration}>
            {formatDuration(session.duration_minutes)}
          </span>
          {session.quality_rating && (
            <span className={styles.rating}>
              {'⭐'.repeat(session.quality_rating)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sessionCard}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <span className={styles.typeIcon}>
            {getSessionTypeIcon(session.session_type)}
          </span>
          <div>
            <h3 className={styles.title}>
              {session.title || `Сессия ${session.session_type}`}
            </h3>
            <p className={styles.description}>{session.description}</p>
          </div>
        </div>
        <div className={styles.statusSection}>
          <span className={styles.status}>
            {getStatusIcon(session.status)} {session.status}
          </span>
          {session.quality_rating && (
            <span className={styles.rating}>
              {'⭐'.repeat(session.quality_rating)}
            </span>
          )}
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.timeInfo}>
          <span>📅 {new Date(session.started_at).toLocaleString()}</span>
          {session.ended_at && (
            <span>🏁 {new Date(session.ended_at).toLocaleString()}</span>
          )}
          <span>⏱️ {formatDuration(session.duration_minutes)}</span>
        </div>

        {session.participants && session.participants.length > 0 && (
          <div className={styles.participants}>
            <span>👥 Участники: {session.participants.length}</span>
          </div>
        )}

        {(session.goals?.length > 0 || session.achievements?.length > 0) && (
          <button 
            className={styles.detailsToggle}
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '🔼 Скрыть детали' : '🔽 Показать детали'}
          </button>
        )}

        {showDetails && (
          <div className={styles.expandedDetails}>
            {session.goals && session.goals.length > 0 && (
              <div className={styles.goalsSection}>
                <h4>🎯 Цели:</h4>
                <ul>
                  {session.goals.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
              </div>
            )}

            {session.achievements && session.achievements.length > 0 && (
              <div className={styles.achievementsSection}>
                <h4>🏆 Достижения:</h4>
                <ul>
                  {session.achievements.map((achievement, index) => (
                    <li key={index}>{achievement}</li>
                  ))}
                </ul>
              </div>
            )}

            {session.notes && (
              <div className={styles.notesSection}>
                <h4>📝 Заметки:</h4>
                <p>{session.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showActions && (
        <div className={styles.actions}>
          {session.status === 'active' && (
            <>
              <button 
                onClick={() => handleAction('pause')}
                disabled={loading}
                className={styles.pauseButton}
              >
                ⏸️ Пауза
              </button>
              <button 
                onClick={() => handleAction('complete')}
                disabled={loading}
                className={styles.completeButton}
              >
                ✅ Завершить
              </button>
            </>
          )}

          {session.status === 'paused' && (
            <>
              <button 
                onClick={() => handleAction('resume')}
                disabled={loading}
                className={styles.resumeButton}
              >
                ▶️ Продолжить
              </button>
              <button 
                onClick={() => handleAction('complete')}
                disabled={loading}
                className={styles.completeButton}
              >
                ✅ Завершить
              </button>
            </>
          )}

          {(session.status === 'active' || session.status === 'paused') && (
            <>
              <button 
                onClick={handleAddGoal}
                disabled={loading}
                className={styles.goalButton}
              >
                🎯 Цель
              </button>
              <button 
                onClick={handleAddAchievement}
                disabled={loading}
                className={styles.achievementButton}
              >
                🏆 Достижение
              </button>
              <button 
                onClick={() => handleAction('cancel')}
                disabled={loading}
                className={styles.cancelButton}
              >
                ❌ Отменить
              </button>
            </>
          )}

          {session.status === 'completed' && (
            <button 
              onClick={() => handleAction('delete')}
              disabled={loading}
              className={styles.deleteButton}
            >
              🗑️ Удалить
            </button>
          )}
        </div>
      )}
    </div>
  );
};

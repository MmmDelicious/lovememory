import React, { useState, useEffect } from 'react';
import { Session } from '../../../types/models';
import sessionService from '../../services/session.service';
import { SessionCard } from './SessionCard';
import { SessionStartModal } from './SessionStartModal';
import styles from './SessionList.module.css';

interface SessionListProps {
  pairId?: string;
  showCreateButton?: boolean;
  filters?: {
    status?: string;
    session_type?: string;
    limit?: number;
  };
  compact?: boolean;
  title?: string;
}

export const SessionList: React.FC<SessionListProps> = ({
  pairId,
  showCreateButton = true,
  filters = {},
  compact = false,
  title = 'Сессии'
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadSessions();
  }, [pairId, filters]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (pairId) {
        data = await sessionService.getSessionsForPair(pairId, filters);
      } else {
        data = await sessionService.getMySessions(filters.limit || 20, 0);
      }
      
      setSessions(data.data || []);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Ошибка при загрузке сессий');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionUpdate = (updatedSession: Session) => {
    setSessions(sessions.map(session => 
      session.id === updatedSession.id ? updatedSession : session
    ));
  };

  const handleSessionDelete = (sessionId: string) => {
    setSessions(sessions.filter(session => session.id !== sessionId));
  };

  const handleSessionStart = async (sessionData: any) => {
    try {
      const response = await sessionService.startSession(pairId!, sessionData);
      const newSession = response.data;
      setSessions([newSession, ...sessions]);
      setShowStartModal(false);
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Ошибка при создании сессии');
    }
  };

  const getFilteredSessions = () => {
    if (activeFilter === 'all') return sessions;
    return sessions.filter(session => session.status === activeFilter);
  };

  const getStatusCounts = () => {
    const counts = {
      all: sessions.length,
      active: sessions.filter(s => s.status === 'active').length,
      paused: sessions.filter(s => s.status === 'paused').length,
      completed: sessions.filter(s => s.status === 'completed').length,
      cancelled: sessions.filter(s => s.status === 'cancelled').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();
  const filteredSessions = getFilteredSessions();

  if (loading) {
    return (
      <div className={styles.sessionList}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Загрузка сессий...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.sessionList}>
        <div className={styles.error}>
          <span>❌ {error}</span>
          <button onClick={loadSessions} className={styles.retryButton}>
            🔄 Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sessionList}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.headerActions}>
          {showCreateButton && pairId && (
            <button 
              onClick={() => setShowStartModal(true)}
              className={styles.createButton}
            >
              ▶️ Начать сессию
            </button>
          )}
          <button 
            onClick={loadSessions}
            className={styles.refreshButton}
            disabled={loading}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          className={`${styles.filterTab} ${activeFilter === 'all' ? styles.active : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          Все ({statusCounts.all})
        </button>
        <button
          className={`${styles.filterTab} ${activeFilter === 'active' ? styles.active : ''}`}
          onClick={() => setActiveFilter('active')}
        >
          🔴 Активные ({statusCounts.active})
        </button>
        <button
          className={`${styles.filterTab} ${activeFilter === 'paused' ? styles.active : ''}`}
          onClick={() => setActiveFilter('paused')}
        >
          ⏸️ На паузе ({statusCounts.paused})
        </button>
        <button
          className={`${styles.filterTab} ${activeFilter === 'completed' ? styles.active : ''}`}
          onClick={() => setActiveFilter('completed')}
        >
          ✅ Завершенные ({statusCounts.completed})
        </button>
        {statusCounts.cancelled > 0 && (
          <button
            className={`${styles.filterTab} ${activeFilter === 'cancelled' ? styles.active : ''}`}
            onClick={() => setActiveFilter('cancelled')}
          >
            ❌ Отмененные ({statusCounts.cancelled})
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className={styles.sessionsContainer}>
        {filteredSessions.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📝</div>
            <h3>
              {activeFilter === 'all' 
                ? 'Сессий пока нет' 
                : `Нет сессий со статусом "${activeFilter}"`
              }
            </h3>
            <p>
              {activeFilter === 'all' && showCreateButton && pairId
                ? 'Начните первую сессию, чтобы отслеживать ваши активности'
                : 'Попробуйте изменить фильтр или создать новую сессию'
              }
            </p>
            {showCreateButton && pairId && activeFilter === 'all' && (
              <button 
                onClick={() => setShowStartModal(true)}
                className={styles.emptyActionButton}
              >
                ▶️ Начать первую сессию
              </button>
            )}
          </div>
        ) : (
          <div className={styles.sessionCards}>
            {filteredSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onUpdate={handleSessionUpdate}
                onDelete={handleSessionDelete}
                compact={compact}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {filteredSessions.length >= (filters.limit || 20) && (
        <div className={styles.loadMore}>
          <button 
            onClick={() => {
              // TODO: Implement pagination
              console.log('Load more sessions');
            }}
            className={styles.loadMoreButton}
          >
            Загрузить еще
          </button>
        </div>
      )}

      {/* Start Session Modal */}
      {showStartModal && (
        <SessionStartModal
          pairId={pairId!}
          onStart={handleSessionStart}
          onClose={() => setShowStartModal(false)}
        />
      )}
    </div>
  );
};

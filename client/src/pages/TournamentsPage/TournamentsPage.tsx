import React, { useState, useEffect } from 'react';
import { TournamentList } from '../../components/Tournament/TournamentList';
import { SessionList } from '../../components/Session';
import tournamentService from '../../services/tournament.service';
import styles from './TournamentsPage.module.css';

export const TournamentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'browse' | 'my' | 'sessions'>('browse');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [active, my, participations] = await Promise.all([
        tournamentService.getActiveTournaments(),
        tournamentService.getMyTournaments(),
        tournamentService.getMyParticipations()
      ]);

      setStats({
        activeTournaments: active.data?.length || 0,
        myTournaments: my.data?.length || 0,
        myParticipations: participations.data?.length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'browse':
        return (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2>🏆 Доступные турниры</h2>
              <p>Найдите турниры для участия и соревнуйтесь с другими парами</p>
            </div>
            <TournamentList 
              title="Активные турниры"
              filters={{ status: 'registering,active' }}
            />
          </div>
        );
      
      case 'my':
        return (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2>👑 Мои турниры</h2>
              <p>Турниры, которые вы создали, и ваши участия</p>
            </div>
            
            <div className={styles.myTournamentsSection}>
              <h3>Созданные мной</h3>
              <TournamentList 
                title=""
                showCreateButton={true}
                filters={{ creator: 'me' }}
                customFilters={{ my: true }}
              />
            </div>
            
            <div className={styles.participationsSection}>
              <h3>Мои участия</h3>
              <TournamentList 
                title=""
                showCreateButton={false}
                customFilters={{ participations: true }}
              />
            </div>
          </div>
        );
      
      case 'sessions':
        return (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h2>📝 Сессии активности</h2>
              <p>Отслеживайте ваши совместные активности и достижения</p>
            </div>
            <SessionList 
              title="Мои сессии"
              showCreateButton={false}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={styles.tournamentsPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>🎮 Турниры и Активности</h1>
          <p className={styles.subtitle}>
            Участвуйте в турнирах, создавайте собственные соревнования и отслеживайте активности
          </p>
        </div>
        
        {stats && (
          <div className={styles.statsCards}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats.activeTournaments}</div>
              <div className={styles.statLabel}>Активных турниров</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats.myTournaments}</div>
              <div className={styles.statLabel}>Мои турниры</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats.myParticipations}</div>
              <div className={styles.statLabel}>Участий</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === 'browse' ? styles.active : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          🔍 Обзор турниров
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'my' ? styles.active : ''}`}
          onClick={() => setActiveTab('my')}
        >
          👑 Мои турниры
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'sessions' ? styles.active : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          📝 Сессии
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.contentContainer}>
        {renderTabContent()}
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <div className={styles.actionCard}>
          <div className={styles.actionIcon}>🏆</div>
          <div className={styles.actionContent}>
            <h3>Создать турнир</h3>
            <p>Организуйте собственное соревнование</p>
          </div>
          <button className={styles.actionButton}>
            Создать
          </button>
        </div>
        
        <div className={styles.actionCard}>
          <div className={styles.actionIcon}>📝</div>
          <div className={styles.actionContent}>
            <h3>Начать сессию</h3>
            <p>Отследите новую совместную активность</p>
          </div>
          <button className={styles.actionButton}>
            Начать
          </button>
        </div>
        
        <div className={styles.actionCard}>
          <div className={styles.actionIcon}>📊</div>
          <div className={styles.actionContent}>
            <h3>Аналитика</h3>
            <p>Посмотрите статистику участий</p>
          </div>
          <button className={styles.actionButton}>
            Открыть
          </button>
        </div>
      </div>
    </div>
  );
};

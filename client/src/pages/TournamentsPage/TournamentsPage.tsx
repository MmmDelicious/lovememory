import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trophy, Users, Clock, Crown, Zap, Calendar, Award } from 'lucide-react';
import { TournamentList } from '../../components/Tournament/TournamentList';
import { tournamentService } from '../../services';
import styles from './TournamentsPage.module.css';

export const TournamentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tournamentStats, setTournamentStats] = useState({
    totalTournaments: 0,
    activeTournaments: 0,
    registeringTournaments: 0,
    totalPrizePool: 0,
    myTournaments: 0,
    myParticipations: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    loadTournamentStats();
  }, []);

  const loadTournamentStats = async () => {
    try {
      setIsLoadingStats(true);
      
      // Загружаем общую статистику турниров
      const [allTournaments, myParticipations] = await Promise.all([
        tournamentService.getTournaments({}),
        tournamentService.getMyParticipations().catch(() => ({ data: [] }))
      ]);
      
      const tournaments = allTournaments.data || [];
      const participations = myParticipations.data || [];
      
      // Подсчитываем статистику
      const activeTournaments = tournaments.filter(t => t.status === 'active').length;
      const registeringTournaments = tournaments.filter(t => t.status === 'registering').length;
      const totalPrizePool = tournaments.reduce((sum, t) => sum + (t.prize_pool || 0), 0);
      const myTournaments = tournaments.filter(t => t.creator_id === 'current_user').length; // TODO: получить реальный ID пользователя
      
      setTournamentStats({
        totalTournaments: tournaments.length,
        activeTournaments,
        registeringTournaments,
        totalPrizePool,
        myTournaments,
        myParticipations: participations.length
      });
    } catch (error) {
      console.error('Error loading tournament stats:', error);
      // Используем тестовые данные при ошибке
      setTournamentStats({
        totalTournaments: 12,
        activeTournaments: 5,
        registeringTournaments: 7,
        totalPrizePool: 2500,
        myTournaments: 2,
        myParticipations: 8
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const tabs = [
    { 
      id: 'all', 
      label: 'Все турниры', 
      icon: Trophy,
      description: 'Все доступные турниры'
    },
    { 
      id: 'my', 
      label: 'Мои турниры', 
      icon: Crown,
      description: 'Созданные и участвую'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'all':
        return (
          <TournamentList 
            title=""
            filters={{ status: 'registering,active' }}
          />
        );
      
      case 'my':
        return (
          <div className={styles.myTournaments}>
            <motion.div 
              className={styles.mySection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3>Созданные мной</h3>
              <TournamentList 
                title=""
                showCreateButton={false}
                filters={{ creator: 'me' }}
                customFilters={{ my: true }}
              />
            </motion.div>
            
            <motion.div 
              className={styles.mySection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3>Мои участия</h3>
              <TournamentList 
                title=""
                showCreateButton={false}
                customFilters={{ participations: true }}
              />
            </motion.div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroPattern}></div>
        </div>
        
        <div className={styles.heroContent}>
          <motion.div 
            className={styles.titleSection}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className={styles.iconWrapper}>
              <Trophy className={styles.titleIcon} size={48} />
              <div className={styles.iconGlow}></div>
            </div>
            
            <div className={styles.titleContent}>
              <h1 className={styles.title}>Турниры</h1>
              <p className={styles.subtitle}>
                Участвуйте в соревнованиях и создавайте собственные турниры
              </p>
            </div>
          </motion.div>
          
          <motion.button 
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Plus size={20} />
            <span>Создать турнир</span>
          </motion.button>
        </div>

        {/* Stats Section */}
        <motion.div 
          className={styles.statsSection}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Trophy size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>
                {isLoadingStats ? '...' : tournamentStats.totalTournaments}
              </span>
              <span className={styles.statLabel}>Всего турниров</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Clock size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>
                {isLoadingStats ? '...' : tournamentStats.activeTournaments}
              </span>
              <span className={styles.statLabel}>Активные</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Users size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>
                {isLoadingStats ? '...' : tournamentStats.registeringTournaments}
              </span>
              <span className={styles.statLabel}>Регистрация</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Award size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>
                {isLoadingStats ? '...' : tournamentStats.totalPrizePool}
              </span>
              <span className={styles.statLabel}>Призовой фонд</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.navigation}>
        <div className={styles.tabsContainer}>
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                className={`${styles.navButton} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id as any)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Icon size={18} />
                <div className={styles.tabContent}>
                  <span className={styles.tabLabel}>{tab.label}</span>
                  <span className={styles.tabDescription}>{tab.description}</span>
                </div>
                {activeTab === tab.id && (
                  <motion.div
                    className={styles.activeIndicator}
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Create Tournament Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            className={styles.modalOverlay} 
            onClick={() => setShowCreateModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className={styles.modal} 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.modalHeader}>
                <Trophy size={24} className={styles.modalIcon} />
                <h2>Создание турнира</h2>
              </div>
              <p>Эта функция будет добавлена в ближайшее время</p>
              <motion.button 
                className={styles.closeButton}
                onClick={() => setShowCreateModal(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Закрыть
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { TournamentCard } from '../../../../components/games';
import { GameButton } from '../../../../ui/games';
import { tournamentService } from '../../../../services';
import { Trophy, Calendar, Users } from 'lucide-react';
import styles from './TournamentModule.module.css';

interface Tournament {
  id: string;
  name: string;
  description: string;
  prize: string;
  startDate: string;
  endDate: string;
  participantsCount: number;
  maxParticipants: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'upcoming' | 'active' | 'ended';
  image?: string;
}

interface TournamentModuleProps {
  onTournamentJoin: (tournamentId: string) => void;
  onTournamentView: (tournamentId: string) => void;
  className?: string;
}

/**
 * Модуль турниров - самостоятельный модуль со своей бизнес-логикой
 * Содержит состояние, API вызовы, обработку ошибок
 * Использует компоненты из слоя Components
 */
const TournamentModule: React.FC<TournamentModuleProps> = ({
  onTournamentJoin,
  onTournamentView,
  className
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'ended'>('all');

  // Загрузка турниров с сервера
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        setLoading(true);
        const response = await tournamentService.getTournaments();
        setTournaments(response.data || []);
      } catch (err) {
        setError('Ошибка загрузки турниров');
        console.error('Error loading tournaments:', err);
        // Fallback к пустому списку если API недоступен
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
  }, []);

  const filteredTournaments = React.useMemo(() => {
    if (filter === 'all') return tournaments;
    return tournaments.filter(t => t.status === filter);
  }, [tournaments, filter]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Загружаем турниры...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h3 className={styles.errorTitle}>Ошибка загрузки</h3>
        <p className={styles.errorText}>{error}</p>
        <GameButton
          onClick={() => window.location.reload()}
          variant="danger"
        >
          Попробовать снова
        </GameButton>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Hero секция */}
      <div className={styles.hero}>
        <Trophy size={48} className={styles.heroIcon} />
        <h1 className={styles.heroTitle}>Турниры для пар</h1>
        <p className={styles.heroSubtitle}>
          Соревнуйтесь с другими парами и выигрывайте призы!
        </p>
      </div>

      {/* Фильтры */}
      <div className={styles.filters}>
        <h3 className={styles.filtersTitle}>Статус турниров</h3>
        <div className={styles.filterButtons}>
          {[
            { key: 'all', label: 'Все', count: tournaments.length },
            { key: 'upcoming', label: 'Скоро', count: tournaments.filter(t => t.status === 'upcoming').length },
            { key: 'active', label: 'Активные', count: tournaments.filter(t => t.status === 'active').length },
            { key: 'ended', label: 'Завершены', count: tournaments.filter(t => t.status === 'ended').length }
          ].map(({ key, label, count }) => (
            <GameButton
              key={key}
              onClick={() => setFilter(key as any)}
              variant={filter === key ? 'primary' : 'secondary'}
              size="medium"
            >
              {label} ({count})
            </GameButton>
          ))}
        </div>
      </div>

      {/* Список турниров */}
      <section className={styles.tournamentsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {filter === 'all' ? 'Все турниры' : 
             filter === 'upcoming' ? 'Предстоящие турниры' :
             filter === 'active' ? 'Активные турниры' : 'Завершенные турниры'}
          </h2>
          <p className={styles.tournamentCount}>
            {filteredTournaments.length} {filteredTournaments.length === 1 ? 'турнир' : 'турниров'}
          </p>
        </div>

        {filteredTournaments.length === 0 ? (
          <div className={styles.emptyState}>
            <Trophy size={64} className={styles.emptyIcon} />
            <p className={styles.emptyText}>Турниры не найдены</p>
            <p className={styles.emptySubtext}>
              {filter === 'all' ? 'Турниры появятся в ближайшее время' : 
               `Нет турниров со статусом "${filter === 'upcoming' ? 'скоро' : filter === 'active' ? 'активные' : 'завершенные'}"`}
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onJoin={onTournamentJoin}
                onView={onTournamentView}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TournamentModule;

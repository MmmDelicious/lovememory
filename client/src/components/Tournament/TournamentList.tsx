import React, { useState, useEffect } from 'react';
import { useUser } from '../../store/hooks';
import { tournamentService } from '../../services';
import { Tournament, TournamentStats, TournamentFilters } from '../../types/models';
import TournamentCard from './TournamentCard';
import { 
  Plus, 
  Filter, 
  Search, 
  Trophy, 
  Users,
  Calendar,
  Loader2
} from 'lucide-react';
import styles from './TournamentList.module.css';

interface TournamentWithStats extends Tournament {
  stats?: TournamentStats;
  userRegistered?: boolean;
}

interface TournamentListProps {
  title?: string;
  filters?: any;
  showCreateButton?: boolean;
  customFilters?: any;
}

// Export interface for TypeScript
export type { TournamentListProps };

const TournamentList: React.FC<TournamentListProps> = ({ 
  title = "Турниры", 
  filters: externalFilters = {},
  showCreateButton = true,
  customFilters = {}
}) => {
  const user = useUser();
  const [tournaments, setTournaments] = useState<TournamentWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Фильтры
  const [filters, setFilters] = useState<TournamentFilters>({
    ...externalFilters,
    status: 'registering',
    has_space: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Статистика
  const [totalStats, setTotalStats] = useState({
    total: 0,
    active: 0,
    registering: 0,
    completed: 0
  });

  useEffect(() => {
    loadTournaments();
  }, [filters]);

  const loadTournaments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await tournamentService.getTournaments(filters);
      

      const tournamentsWithData = await Promise.all(
        response.data.map(async (tournament: Tournament) => {
          try {
            const [stats, registrations] = await Promise.all([
              tournamentService.getTournamentStats(tournament.id),
              tournamentService.getMyParticipations()
            ]);
            
            const userRegistered = registrations.data.some(
              (reg: any) => reg.tournament_id === tournament.id
            );
            
            return {
              ...tournament,
              stats: stats.data,
              userRegistered
            };
          } catch (err) {

            return tournament;
          }
        })
      );
      
      setTournaments(tournamentsWithData);
      

      setTotalStats({
        total: tournamentsWithData.length,
        active: tournamentsWithData.filter(t => t.status === 'active').length,
        registering: tournamentsWithData.filter(t => t.status === 'registering').length,
        completed: tournamentsWithData.filter(t => t.status === 'completed').length,
      });
      
    } catch (err) {
      setError('Не удалось загрузить турниры');
      console.error('Error loading tournaments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (tournamentId: string) => {
    if (!user) return;
    
    try {
      setActionLoading(tournamentId);
      await tournamentService.registerForTournament(tournamentId);
      
      setTournaments(prev => 
        prev.map(t => 
          t.id === tournamentId 
            ? { ...t, userRegistered: true }
            : t
        )
      );
      
    } catch (err) {
      console.error('Error registering for tournament:', err);
      alert('Не удалось зарегистрироваться в турнире');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnregister = async (tournamentId: string) => {
    if (!user) return;
    
    try {
      setActionLoading(tournamentId);
      await tournamentService.unregisterFromTournament(tournamentId);
      
      setTournaments(prev => 
        prev.map(t => 
          t.id === tournamentId 
            ? { ...t, userRegistered: false }
            : t
        )
      );
      
    } catch (err) {
      console.error('Error unregistering from tournament:', err);
      alert('Не удалось отменить регистрацию');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTournaments = tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tournament.description && tournament.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Загрузка турниров...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <Trophy size={48} />
        <h3>Ошибка загрузки</h3>
        <p>{error}</p>
        <button 
          className={styles.retryBtn}
          onClick={() => loadTournaments()}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className={styles.tournamentList}>

      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2>{title}</h2>
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <Trophy size={16} />
              <span>Всего: {totalStats.total}</span>
            </div>
            <div className={styles.statItem}>
              <Users size={16} />
              <span>Регистрация: {totalStats.registering}</span>
            </div>
            <div className={styles.statItem}>
              <Calendar size={16} />
              <span>Активные: {totalStats.active}</span>
            </div>
          </div>
        </div>
        
        {showCreateButton && (
          <button className={styles.createBtn}>
            <Plus size={16} />
            Создать турнир
          </button>
        )}
      </div>

      {/* Поиск и фильтры */}
      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Поиск турниров..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <button 
          className={`${styles.filterBtn} ${showFilters ? styles.active : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Фильтры
        </button>
      </div>

      {/* Панель фильтров */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label>Статус:</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({...filters, status: e.target.value as any})}
            >
              <option value="">Все</option>
              <option value="registering">Регистрация</option>
              <option value="active">Активные</option>
              <option value="completed">Завершенные</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label>Тип:</label>
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters({...filters, type: e.target.value as any})}
            >
              <option value="">Все типы</option>
              <option value="single_elimination">На выбывание</option>
              <option value="round_robin">Круговая система</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label>
              <input
                type="checkbox"
                checked={filters.has_space || false}
                onChange={(e) => setFilters({...filters, has_space: e.target.checked})}
              />
              Только с местами
            </label>
          </div>
        </div>
      )}

      {/* Список турниров */}
      <div className={styles.tournamentGrid}>
        {filteredTournaments.length === 0 ? (
          <div className={styles.emptyState}>
            <Trophy size={48} />
            <h3>Турниры не найдены</h3>
            <p>Попробуйте изменить фильтры или создать новый турнир</p>
          </div>
        ) : (
          filteredTournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              stats={tournament.stats}
              userRegistered={tournament.userRegistered}
              onRegister={handleRegister}
              onUnregister={handleUnregister}
              isLoading={actionLoading === tournament.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

export { TournamentList };
export default TournamentList;

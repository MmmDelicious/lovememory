import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Users, Coins, ArrowLeft, Plus, Gamepad2, Filter, Clock, Trophy, Star } from 'lucide-react';
import styles from './GameLobbyPage.module.css';
import { useGameLobby } from '../../hooks/useGameLobby';
import CreateRoomModal from '../../components/CreateRoomModal/CreateRoomModal';

interface GameLobbyPageProps {
  gameType?: string;
}

interface Room {
  id: string;
  bet: number;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'in_progress' | 'finished';
  Host?: {
    first_name: string;
    avatar?: string;
  };
  created_at: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  isPrivate?: boolean;
}

const GAME_DISPLAY_NAMES: Record<string, string> = {
  'tic-tac-toe': 'Крестики-нолики',
  'chess': 'Шахматы',
  'poker': 'Покер',
  'quiz': 'Квиз',
};

const GAME_DESCRIPTIONS: Record<string, string> = {
  'tic-tac-toe': 'Классическая игра для двоих',
  'chess': 'Стратегическая битва умов',
  'poker': 'Карточная игра на удачу и мастерство',
  'quiz': 'Проверьте свои знания вместе',
};

const GameLobbyPage: React.FC<GameLobbyPageProps> = ({ gameType: gameTypeProp }) => {
  const { gameType: gameTypeParam } = useParams<{ gameType: string }>();
  const gameType = gameTypeProp || gameTypeParam || '';

  const { rooms, isLoading, error, createRoom } = useGameLobby(gameType);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [maxBet, setMaxBet] = useState(1000);
  const [sortBy, setSortBy] = useState<'newest' | 'bet' | 'players'>('newest');
  const navigate = useNavigate();

  const handleCreateRoom = async (formData: any) => {
    try {
      const newRoom = await createRoom({ ...formData, gameType });
      setIsModalOpen(false);
      const path = gameType === 'poker' ? `/games/poker/${newRoom.id}` : `/games/room/${newRoom.id}`;
      navigate(path);
    } catch (err: any) {
      alert(`Ошибка: ${err.response?.data?.message || 'Не удалось создать комнату.'}`);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    const room = rooms.find((r: Room) => r.id === roomId);
    if (!room) return;
    const path = gameType === 'poker' ? `/games/poker/${roomId}` : `/games/room/${roomId}`;
    navigate(path);
  };

  const filteredAndSortedRooms = useMemo(() => {
    let filtered = rooms
      .filter((room: Room) => room.bet <= maxBet)
      .filter((room: Room) => {
        const hostName = room.Host?.first_name || '';
        const roomId = room.id || '';
        return hostName.toLowerCase().includes(searchTerm.toLowerCase()) || 
               roomId.toLowerCase().includes(searchTerm.toLowerCase());
      });

    // Сортировка
    filtered.sort((a: Room, b: Room) => {
      switch (sortBy) {
        case 'bet':
          return b.bet - a.bet;
        case 'players':
          return b.playerCount - a.playerCount;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [rooms, searchTerm, maxBet, sortBy]);
  
  const gameName = GAME_DISPLAY_NAMES[gameType] || 'Игровые комнаты';
  const gameDescription = GAME_DESCRIPTIONS[gameType] || 'Найдите партнера для игры';

  const activeRooms = rooms.filter((room: Room) => room.status === 'waiting').length;
  const playingRooms = rooms.filter((room: Room) => room.status === 'in_progress').length;

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroPattern}></div>
        </div>
        
        <header className={styles.header}>
          <button 
            onClick={() => navigate('/games')} 
            className={styles.backButton}
            aria-label="Назад к играм"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className={styles.headerContent}>
            <div className={styles.gameIconWrapper}>
              <div className={styles.gameIcon}>
                <Gamepad2 size={28} />
              </div>
              <div className={styles.gameIconGlow}></div>
            </div>
            
            <div className={styles.titleSection}>
              <h1 className={styles.title}>{gameName}</h1>
              <p className={styles.subtitle}>{gameDescription}</p>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  <Users size={16} />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statNumber}>{activeRooms}</span>
                  <span className={styles.statLabel}>Ожидают</span>
                </div>
              </div>
              
              <div className={styles.statDivider}></div>
              
              <div className={styles.statItem}>
                <div className={styles.statIcon}>
                  <Clock size={16} />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statNumber}>{playingRooms}</span>
                  <span className={styles.statLabel}>Играют</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)} 
            className={styles.createButton}
          >
            <Plus size={20} />
            <span>Создать</span>
          </button>
        </header>
      </div>

      {/* Controls Section */}
      <div className={styles.controlsSection}>
        <div className={styles.searchAndFilter}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Поиск по имени или ID..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className={styles.filterControls}>
            <div className={styles.sortWrapper}>
              <Filter size={16} />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'bet' | 'players')}
                className={styles.sortSelect}
              >
                <option value="newest">Новые</option>
                <option value="bet">По ставке</option>
                <option value="players">По игрокам</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className={styles.betFilter}>
          <div className={styles.betFilterHeader}>
            <span className={styles.betFilterLabel}>Максимальная ставка</span>
            <span className={styles.betFilterValue}>
              <Coins size={14} />
              {maxBet}
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={maxBet}
            onChange={(e) => setMaxBet(Number(e.target.value))}
            className={styles.betSlider}
          />
        </div>
      </div>

      {/* Rooms Section */}
      <div className={styles.roomsSection}>
        {isLoading && (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <h3>Загружаем комнаты...</h3>
            <p>Поиск активных игр</p>
          </div>
        )}
        
        {error && (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3>Ошибка загрузки</h3>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}
        
        {!isLoading && !error && (
          <div className={styles.roomsGrid}>
            {filteredAndSortedRooms.length > 0 ? (
              filteredAndSortedRooms.map((room: Room) => {
                const isFull = room.playerCount >= room.maxPlayers;
                const isInProgress = room.status === 'in_progress';
                const canJoin = !isFull && !isInProgress;
                
                return (
                  <div 
                    key={room.id} 
                    className={`${styles.roomCard} ${!canJoin ? styles.disabled : ''} ${isInProgress ? styles.inProgress : ''}`}
                    onClick={() => canJoin && handleJoinRoom(room.id)}
                  >
                    <div className={styles.cardGlow}></div>
                    
                    <div className={styles.cardHeader}>
                      <div className={styles.hostSection}>
                        <div className={styles.hostAvatar}>
                          {room.Host?.avatar ? (
                            <img src={room.Host.avatar} alt="Host" />
                          ) : (
                            <span>{(room.Host?.first_name || 'A')[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div className={styles.hostInfo}>
                          <span className={styles.hostLabel}>Хост</span>
                          <h3 className={styles.hostName}>{room.Host?.first_name || 'Аноним'}</h3>
                        </div>
                      </div>
                      
                      <div className={styles.roomStatus}>
                        {isInProgress ? (
                          <div className={styles.statusBadge}>
                            <div className={styles.statusDot}></div>
                            <span>Играют</span>
                          </div>
                        ) : isFull ? (
                          <div className={`${styles.statusBadge} ${styles.fullBadge}`}>
                            <span>Полная</span>
                          </div>
                        ) : (
                          <div className={`${styles.statusBadge} ${styles.waitingBadge}`}>
                            <span>Ожидает</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.cardContent}>
                      <div className={styles.roomInfo}>
                        <div className={styles.infoItem}>
                          <Users size={16} />
                          <span>{room.playerCount}/{room.maxPlayers}</span>
                        </div>
                        
                        <div className={styles.infoItem}>
                          <Coins size={16} />
                          <span>{room.bet}</span>
                        </div>
                        
                        {room.difficulty && (
                          <div className={styles.infoItem}>
                            <Trophy size={16} />
                            <span className={styles.difficulty}>
                              {room.difficulty === 'easy' && '🟢 Легко'}
                              {room.difficulty === 'medium' && '🟡 Средне'}
                              {room.difficulty === 'hard' && '🔴 Сложно'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className={styles.roomId}>
                        ID: #{room.id.substring(0, 8)}
                      </div>
                    </div>

                    {canJoin && (
                      <div className={styles.joinOverlay}>
                        <div className={styles.joinButton}>
                          <span>Присоединиться</span>
                          <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Gamepad2 size={48} />
                </div>
                <h3>Пока нет активных комнат</h3>
                <p>Создайте первую комнату и начните играть с другими игроками!</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className={styles.emptyCreateButton}
                >
                  <Plus size={20} />
                  <span>Создать комнату</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRoom}
        gameType={gameType}
      />
    </div>
  );
};

export default GameLobbyPage;
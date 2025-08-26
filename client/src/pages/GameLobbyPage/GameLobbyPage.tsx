import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Coins, ArrowLeft, Plus, Gamepad2, Trophy, Clock, Star, Crown, Zap } from 'lucide-react';
import styles from './GameLobbyPage.module.css';
import { useGameLobby } from '../../hooks/useGameLobby';
import CreateRoomModal from '../../components/CreateRoomModal/CreateRoomModal';
import { toast } from '../../context/ToastContext';

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

const GAME_CONFIGS: Record<string, any> = {
  'tic-tac-toe': {
    name: 'Крестики-нолики',
    description: 'Классическая игра для двоих',
    icon: '⭕',
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
  },
  'chess': {
    name: 'Шахматы',
    description: 'Стратегическая битва умов',
    icon: '♚',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
  },
  'poker': {
    name: 'Покер',
    description: 'Карточная игра на мастерство',
    icon: '🃏',
    color: '#EF4444',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  },
  'quiz': {
    name: 'Квиз',
    description: 'Проверьте свои знания',
    icon: '🧠',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  },
  'codenames': {
    name: 'Codenames',
    description: 'Командная игра на ассоциации',
    icon: '🔤',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  },
  'memory': {
    name: 'Мемори',
    description: 'Тренируйте память',
    icon: '🧩',
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
  },
  'wordle': {
    name: 'Wordle',
    description: 'Угадайте слово за 6 попыток',
    icon: '📝',
    color: '#06B6D4',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
  },
};

const GameLobbyPage: React.FC<GameLobbyPageProps> = ({ gameType: gameTypeProp }) => {
  const { gameType: gameTypeParam } = useParams<{ gameType: string }>();
  const gameType = gameTypeProp || gameTypeParam || '';
  const { rooms, isLoading, error, createRoom } = useGameLobby(gameType);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const gameConfig = GAME_CONFIGS[gameType] || GAME_CONFIGS['tic-tac-toe'];

  const handleCreateRoom = async (formData: any) => {
    try {
      const newRoom = await createRoom({ ...formData, gameType });
      setIsModalOpen(false);
      const path = gameType === 'poker' ? `/games/poker/${newRoom.id}` : `/games/room/${newRoom.id}`;
      navigate(path);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Не удалось создать комнату.', 'Ошибка создания комнаты');
    }
  };

  const handleJoinRoom = (roomId: string) => {
    const room = rooms.find((r: Room) => r.id === roomId);
    if (!room) return;
    if (gameType === 'poker') {
      navigate(`/games/poker/${roomId}`);
    } else {
      navigate(`/games/room/${roomId}`);
    }
  };

  const filteredRooms = useMemo(() => {
    return rooms
      .filter((room: Room) => room.status === 'waiting')
      .filter((room: Room) => {
        if (!searchTerm) return true;
        const hostName = room.Host?.first_name || '';
        return hostName.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a: Room, b: Room) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [rooms, searchTerm]);

  const stats = useMemo(() => {
    const activeRooms = rooms.filter((r: Room) => r.status === 'waiting').length;
    const playingRooms = rooms.filter((r: Room) => r.status === 'in_progress').length;
    const avgBet = rooms.length > 0 ? Math.round(rooms.reduce((sum, room) => sum + room.bet, 0) / rooms.length) : 0;
    
    return { activeRooms, playingRooms, avgBet };
  }, [rooms]);

  return (
    <div className={styles.page}>
      {/* Hero Header */}
      <div className={styles.hero} style={{ background: gameConfig.gradient }}>
        <div className={styles.heroContent}>
          <motion.button 
            onClick={() => navigate('/games')} 
            className={styles.backButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          
          <div className={styles.gameInfo}>
            <motion.div 
              className={styles.gameIconWrapper}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <span className={styles.gameIcon}>{gameConfig.icon}</span>
              <div className={styles.iconGlow}></div>
            </motion.div>
            
            <motion.div 
              className={styles.titleSection}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className={styles.title}>{gameConfig.name}</h1>
              <p className={styles.subtitle}>{gameConfig.description}</p>
            </motion.div>
          </div>
          
          <motion.button 
            onClick={() => setIsModalOpen(true)} 
            className={styles.createButton}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Plus size={20} />
            <span>Создать</span>
          </motion.button>
        </div>

        {/* Stats Section */}
        <motion.div 
          className={styles.statsSection}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Users size={16} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{stats.activeRooms}</span>
              <span className={styles.statLabel}>Ожидают</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Clock size={16} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{stats.playingRooms}</span>
              <span className={styles.statLabel}>Играют</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Coins size={16} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{stats.avgBet}</span>
              <span className={styles.statLabel}>Средняя ставка</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search Section */}
      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Найти игрока..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div 
              className={styles.loadingState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.spinner}></div>
              <p>Загружаем комнаты...</p>
            </motion.div>
          )}

          {error && (
            <motion.div 
              className={styles.errorState}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className={styles.errorIcon}>⚠️</div>
              <h3>Ошибка загрузки</h3>
              <p>{error}</p>
            </motion.div>
          )}

          {!isLoading && !error && (
            <motion.div 
              className={styles.roomsList}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room: Room, index) => {
                  const isFull = room.playerCount >= room.maxPlayers;
                  const canJoin = !isFull;

                  return (
                    <motion.div 
                      key={room.id} 
                      className={`${styles.roomCard} ${!canJoin ? styles.disabled : ''}`}
                      onClick={() => canJoin && handleJoinRoom(room.id)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={canJoin ? { y: -4, scale: 1.02 } : {}}
                      whileTap={canJoin ? { scale: 0.98 } : {}}
                    >
                      <div className={styles.roomHeader}>
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
                            <h4 className={styles.hostName}>
                              {room.Host?.first_name || 'Аноним'}
                            </h4>
                          </div>
                        </div>
                        
                        <div className={styles.roomStatus}>
                          {isFull ? (
                            <div className={styles.statusBadge}>
                              <span>Заполнена</span>
                            </div>
                          ) : (
                            <div className={`${styles.statusBadge} ${styles.waiting}`}>
                              <div className={styles.statusDot}></div>
                              <span>Ожидает</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.roomMeta}>
                        <div className={styles.metaItem}>
                          <Users size={16} />
                          <span>{room.playerCount}/{room.maxPlayers}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <Coins size={16} />
                          <span>{room.bet}</span>
                        </div>
                        {room.difficulty && (
                          <div className={styles.metaItem}>
                            {room.difficulty === 'easy' && <span className={styles.difficultyBadge}>🟢 Легко</span>}
                            {room.difficulty === 'medium' && <span className={styles.difficultyBadge}>🟡 Средне</span>}
                            {room.difficulty === 'hard' && <span className={styles.difficultyBadge}>🔴 Сложно</span>}
                          </div>
                        )}
                      </div>

                      <div className={styles.roomFooter}>
                        <span className={styles.roomId}>#{room.id.substring(0, 8)}</span>
                        {canJoin && (
                          <div className={styles.joinHint}>
                            <span>Нажмите для входа</span>
                            <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                          </div>
                        )}
                      </div>

                      {canJoin && (
                        <div className={styles.cardGlow}></div>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <motion.div 
                  className={styles.emptyState}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className={styles.emptyIcon}>
                    <Gamepad2 size={48} />
                  </div>
                  <h3>Нет доступных комнат</h3>
                  <p>Создайте первую комнату и начните играть!</p>
                  <motion.button 
                    onClick={() => setIsModalOpen(true)}
                    className={styles.emptyCreateButton}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus size={20} />
                    <span>Создать комнату</span>
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
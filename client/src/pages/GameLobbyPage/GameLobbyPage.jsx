import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './GameLobbyPage.module.css';
import { useGameLobby } from '../../hooks/useGameLobby';
import CreateRoomModal from '../../components/CreateRoomModal/CreateRoomModal';
import { FaSearch } from 'react-icons/fa';

const GAME_DISPLAY_NAMES = {
  'tic-tac-toe': 'Крестики-нолики',
  'chess': 'Шахматы',
  'poker': 'Покер',
  'quiz': 'Квиз',
};

const GameLobbyPage = ({ gameType: gameTypeProp }) => {
  const { gameType: gameTypeParam } = useParams();
  const gameType = gameTypeProp || gameTypeParam;

  const { rooms, isLoading, error, createRoom } = useGameLobby(gameType);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [maxBet, setMaxBet] = useState(1000); 
  const navigate = useNavigate();

  const handleCreateRoom = async (formData) => {
    try {
      const newRoom = await createRoom({ ...formData, gameType });
      setIsModalOpen(false);
      const path = gameType === 'poker' ? `/love-vegas/poker/${newRoom.id}` : `/games/room/${newRoom.id}`;
      navigate(path);
    } catch (err) {
      alert(`Ошибка: ${err.response?.data?.message || 'Не удалось создать комнату.'}`);
    }
  };

  const handleJoinRoom = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const path = gameType === 'poker' ? `/love-vegas/poker/${roomId}` : `/games/room/${roomId}`;
    navigate(path);
  };

  const filteredRooms = useMemo(() => {
    return rooms
      .filter(room => room.bet <= maxBet)
      .filter(room => {
        const hostName = room.Host?.first_name || '';
        const roomId = room.id || '';
        return hostName.toLowerCase().includes(searchTerm.toLowerCase()) || roomId.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [rooms, searchTerm, maxBet]);
  
  const gameName = GAME_DISPLAY_NAMES[gameType] || 'Game Rooms';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{gameName}</h1>
        <button onClick={() => setIsModalOpen(true)} className={`${styles.createButton} ${styles.desktopButton}`}>
          Create Room
        </button>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search"
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterWrapper}>
          <label htmlFor="bet-filter" className={styles.filterLabel}>Max Bet: {maxBet}</label>
          <input
            id="bet-filter"
            type="range"
            min="10"
            max="1000"
            step="10"
            value={maxBet}
            onChange={(e) => setMaxBet(Number(e.target.value))}
            className={styles.filterSlider}
          />
        </div>
      </div>
      
      <button onClick={() => setIsModalOpen(true)} className={`${styles.createButton} ${styles.mobileButton}`}>
        Create Room
      </button>

      {isLoading && <p className={styles.statusText}>Loading rooms...</p>}
      {error && <p className={`${styles.statusText} ${styles.error}`}>{error}</p>}
      
      {!isLoading && !error && (
        <div className={styles.roomsGrid}>
          {filteredRooms.length > 0 ? (
            filteredRooms.map(room => {
              const isFull = room.playerCount >= room.maxPlayers;
              const isInProgress = room.status === 'in_progress';
              return (
                <div 
                  key={room.id} 
                  className={`${styles.roomCard} ${isFull ? styles.disabled : ''} ${isInProgress ? styles.inProgress : ''}`}
                  onClick={() => handleJoinRoom(room.id)}
                >
                  <div className={styles.cardContent}>
                    <span className={styles.createdBy}>Created by</span>
                    <h3 className={styles.hostName}>{room.Host?.first_name || 'Anonymous'}</h3>
                    {isInProgress && (
                      <div className={styles.statusBadge}>Игра идет</div>
                    )}
                  </div>
                   <div className={styles.playerCount}>
                      {room.playerCount} / {room.maxPlayers}
                   </div>
                  <div className={styles.cardFooter}>
                    <div className={styles.betInfo}>
                      <div className={styles.coinIcon}></div>
                      <span>Bet {room.bet}</span>
                    </div>
                    <div className={styles.idInfo}>
                      <span>ID</span>
                      <span className={styles.roomId}>#{room.id.substring(0, 6)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className={styles.statusText}>No rooms found.</p>
          )}
        </div>
      )}
      
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
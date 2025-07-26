import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './GameLobbyPage.module.css';
import gameService from '../../services/game.service';
import { useCurrency } from '../../context/CurrencyContext';
import CreateRoomModal from '../../components/CreateRoomModal/CreateRoomModal';

// ИЗМЕНЕНИЕ: Создаем словарь для названий игр. Легко расширять.
const GAME_DISPLAY_NAMES = {
  'tic-tac-toe': 'Крестики-нолики',
  'chess': 'Шахматы',
  'poker': 'Покер',
  'quiz': 'Квиз',
};

const GameLobbyPage = ({ gameType: gameTypeProp }) => {
  const { gameType: gameTypeParam } = useParams();
  const gameType = gameTypeProp || gameTypeParam;
  
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { refreshCoins } = useCurrency();

  useEffect(() => {
    const fetchRooms = async () => {
      if (!gameType) return;
      try {
        setIsLoading(true);
        const fetchedRooms = await gameService.getRooms(gameType);
        if (Array.isArray(fetchedRooms)) {
          setRooms(fetchedRooms);
        } else {
          setRooms([]);
        }
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
        setRooms([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [gameType]);

  const handleCreateRoom = async (formData) => {
    const { bet } = formData;
    if (!bet || bet <= 0) {
      alert("Ставка должна быть положительным числом.");
      return;
    }

    try {
      const newRoom = await gameService.createRoom(bet, gameType);
      await refreshCoins();
      setIsModalOpen(false); // Закрываем модалку после успеха
      const path = gameType === 'poker' ? `/love-vegas/poker/${newRoom.id}` : `/games/room/${newRoom.id}`;
      navigate(path);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Не удалось создать комнату.';
      alert(`Ошибка: ${errorMessage}`);
    }
  };

  const handleJoinRoom = (roomId) => {
    const path = gameType === 'poker' ? `/love-vegas/poker/${roomId}` : `/games/room/${roomId}`;
    navigate(path);
  };

  // ИСПОЛЬЗОВАНИЕ: Получаем красивое имя из словаря.
  // Если игра неизвестна, показываем запасной вариант.
  const gameName = GAME_DISPLAY_NAMES[gameType] || 'Неизвестная игра';

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>{gameName}</h1>
        <button onClick={() => setIsModalOpen(true)} className={styles.createButton}>
          Создать комнату
        </button>
      </div>
      <p className={styles.subtitle}>Присоединяйтесь к существующей комнате или создайте свою.</p>
      
      {isLoading ? (
        <p>Загрузка комнат...</p>
      ) : (
        <div className={styles.roomsList}>
          {rooms.length > 0 ? (
            rooms.map(room => (
              <div key={room.id} className={styles.roomCard}>
                <h3>Комната #{room.id.substring(0, 8)}</h3>
                <div className={styles.roomInfo}>
                  <span>Хост: <strong>{room.Host?.first_name || 'Неизвестно'}</strong></span>
                  <span>Ставка: <strong>{room.bet} 🪙</strong></span>
                  <span>Игроки: <strong>{(room.players || []).length} / 2</strong></span>
                </div>
                <button 
                  onClick={() => handleJoinRoom(room.id)} 
                  className={styles.joinButton}
                  disabled={(room.players || []).length >= 2}
                >
                  {(room.players || []).length >= 2 ? 'Заполнено' : 'Присоединиться'}
                </button>
              </div>
            ))
          ) : (
            <p className={styles.noRooms}>Активных комнат нет. Создайте первую!</p>
          )}
        </div>
      )}
      
      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRoom}
        gameType={gameName}
      />
    </div>
  );
};

export default GameLobbyPage;
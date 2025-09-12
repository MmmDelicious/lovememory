import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChessModule, 
  TicTacToeModule, 
  QuizModule, 
  MemoryModule 
} from '../../modules';
import { useAuth } from '../../../modules/auth/hooks/useAuth';
import styles from './GameLobbyPage.module.css';

/**
 * Тонкая страница лобби игры
 * Содержит только навигационную логику, всю бизнес-логику делегирует модулям конкретных игр
 */
const GameLobbyPage: React.FC = () => {
  const { gameType } = useParams<{ gameType: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Обработчики навигации
  const handleGameEnd = (result: any) => {
    console.log('Game ended:', result);
    // Можно показать результаты или перенаправить
  };

  const handleReturnToLobby = () => {
    navigate('/games');
  };

  if (!gameType) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Неверный тип игры</h2>
          <p>Пожалуйста, выберите игру из списка</p>
          <button 
            onClick={() => navigate('/games')} 
            className={styles.backButton}
          >
            Вернуться к играм
          </button>
        </div>
      </div>
    );
  }

  // Определяем какой модуль игры использовать
  const renderGameModule = () => {
    const gameId = `${gameType}-${Date.now()}`; // Генерируем ID игры
    const userId = user?.id;

    switch (gameType) {
      case 'tic-tac-toe':
        return (
          <TicTacToeModule
            gameId={gameId}
            userId={userId}
            onGameEnd={handleGameEnd}
            onReturnToLobby={handleReturnToLobby}
          />
        );
      
      case 'chess':
        return (
          <ChessModule
            gameId={gameId}
            userId={userId}
            onGameEnd={handleGameEnd}
            onReturnToLobby={handleReturnToLobby}
          />
        );
      
      case 'quiz':
        return (
          <QuizModule
            gameId={gameId}
            userId={userId}
            onGameEnd={handleGameEnd}
            onReturnToLobby={handleReturnToLobby}
          />
        );
      
      case 'memory':
        return (
          <MemoryModule
            gameId={gameId}
            userId={userId}
            onGameEnd={handleGameEnd}
            onReturnToLobby={handleReturnToLobby}
          />
        );
      
      default:
        return (
          <div className={styles.placeholder}>
            <h2>Игра "{gameType}" пока не реализована</h2>
            <p>Эта игра будет добавлена в следующих обновлениях</p>
            <button 
              onClick={handleReturnToLobby}
              className={styles.backButton}
            >
              Вернуться к играм
            </button>
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      {renderGameModule()}
    </div>
  );
};

export default GameLobbyPage;
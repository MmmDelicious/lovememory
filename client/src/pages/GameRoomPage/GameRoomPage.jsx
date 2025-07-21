// client/src/pages/GameRoomPage/GameRoomPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import LottiePlayer from 'react-lottie-player';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';


import styles from './GameRoomPage.module.css';
import victoryAnimation from '../../assets/victory.json';
import defeatAnimation from '../../assets/defeat.json';

const GameRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { setCoins } = useCurrency();
  
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    if (!token || !user) {
      alert('Ошибка аутентификации. Пожалуйста, войдите в систему.');
      navigate('/login');
      return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const newSocket = io(API_BASE_URL, { auth: { token } });
    setSocket(newSocket);

    const handleStateUpdate = (newGameState) => {
      setGameState(newGameState);
    };

    newSocket.on('connect', () => newSocket.emit('join_room', roomId));
    newSocket.on('connect_error', (err) => {
        console.error("Socket connection error:", err.message);
        alert("Не удалось подключиться к игре. Попробуйте обновить страницу.");
        navigate('/games');
    });

    newSocket.on('game_start', handleStateUpdate);
    newSocket.on('game_update', handleStateUpdate);
    newSocket.on('game_end', handleStateUpdate);
    newSocket.on('update_coins', setCoins);
    newSocket.on('error', (errorMessage) => {
        alert(`Ошибка: ${errorMessage}`);
        const gameType = gameState?.gameType || '';
        navigate(`/games/${gameType}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, token, user, navigate, setCoins]);

  const handleMakeMove = useCallback((move) => {
    console.log('[FRONT] handleMakeMove called with:', move);
    if (!socket) {
      console.log('[FRONT] No socket, move not sent');
      return;
    }
    socket.emit('make_move', { roomId, move });
  }, [socket, roomId]);

  const handleReturnToLobby = () => {
    const gameType = gameState?.gameType || '';
    navigate(`/games/${gameType}`);
  };
  
  const renderStatusMessage = () => {
    if (!gameState || !user) return "Загрузка...";
  
    if (gameState.status === 'finished') return "Игра окончена";
    if (gameState.status !== 'in_progress') return "Ожидание второго игрока...";
  
    if (gameState.currentPlayerId === user.id) {
      return "Ваш ход";
    }
    return "Ход соперника";
  };

  const renderGameEndOverlay = () => {
    if (!gameState || gameState.status !== 'finished' || !user) return null;

    let resultText, resultStyle, animationData;
    if (gameState.winner === 'draw') {
      resultText = 'Ничья!';
      resultStyle = styles.drawText;
    } else if (gameState.winner === user.id) {
      resultText = 'Победа!';
      resultStyle = styles.winnerText;
      animationData = victoryAnimation;
    } else {
      resultText = 'Поражение';
      resultStyle = styles.loserText;
      animationData = defeatAnimation;
    }

    return (
      <div className={styles.overlay}>
        <div className={styles.overlayContent}>
          {animationData && <LottiePlayer loop={false} play animationData={animationData} className={styles.lottieAnimation} />}
          <h2 className={resultStyle}>{resultText}</h2>
          <button onClick={handleReturnToLobby} className={styles.lobbyButton}>Вернуться в лобби</button>
        </div>
      </div>
    );
  };

  const renderGameBoard = () => {
    if (!gameState) return <div className={styles.boardPlaceholder}>Загрузка игровой доски...</div>;

    switch (gameState.gameType) {
        case 'tic-tac-toe':
            // Логика для крестиков-ноликов
            return (
                <div className={styles.ticTacToeBoard}>
                    {(gameState.board || Array(9).fill(null)).map((cell, index) => (
                    <div key={index} className={`${styles.cell} ${cell ? styles.filled : ''} ${gameState.status !== 'in_progress' ? styles.disabled : ''}`} onClick={() => handleMakeMove(index)}>
                        {cell}
                    </div>
                    ))}
                </div>
            );
        default:
            return <div className={styles.boardPlaceholder}>Неизвестный тип игры.</div>;
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* {renderGameEndOverlay()} */}
      <h1 className={styles.title}>Комната #{roomId.substring(0, 8)}</h1>
      <h2 className={styles.status}>{renderStatusMessage()}</h2>
      {renderGameBoard()}
    </div>
  );
};

export default GameRoomPage;
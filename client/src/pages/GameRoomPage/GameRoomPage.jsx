// client/src/pages/GameRoomPage/GameRoomPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import LottiePlayer from 'react-lottie-player';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import Avatar from '../../components/Avatar/Avatar';
import LottieMascot from '../../components/LottieMascot/LottieMascot';

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
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  useEffect(() => {
  }, [gameState?.currentQuestion?.questionNumber, gameState?.currentQuestion?.timeRemaining]);

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
      console.log('[CLIENT] Received game state update:', newGameState);
      setGameState(prevState => {
        if (newGameState.gameType === 'quiz') {
          // Проверяем, есть ли новый текущий вопрос
          if (newGameState.currentQuestion) {
            const isNewQuestion = !prevState?.currentQuestion || 
              prevState.currentQuestion.questionNumber !== newGameState.currentQuestion.questionNumber;
            
            if (isNewQuestion) {
              console.log('[CLIENT] New question detected, resetting state');
              setSelectedAnswer(null);
              setIsAnswerSubmitted(false);
            }
            
            // Синхронизируем таймер с сервером
            setTimeRemaining(newGameState.currentQuestion.timeRemaining || 0);
          }
          
          // Убираем логику показа результатов между вопросами
          // Результаты показываем только в конце игры
        }
        
        return newGameState;
      });
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

  // Убираем клиентский таймер, так как теперь используем серверный
  // useEffect для таймера больше не нужен

  const handleMakeMove = useCallback((move) => {
    console.log('[FRONT] handleMakeMove called with:', move);
    if (!socket) {
      console.log('[FRONT] No socket, move not sent');
      return;
    }
    
    // Проверяем, можем ли мы отправить ответ
    if (isAnswerSubmitted || timeRemaining <= 0) {
      console.log('[FRONT] Cannot submit answer: submitted=', isAnswerSubmitted, 'time=', timeRemaining);
      return;
    }
    
    if (gameState && gameState.status === 'in_progress') {
      if (gameState.gameType === 'quiz') {
        // Для quiz - сохраняем выбранный ответ и отправляем
        console.log(`[CLIENT] Player selected answer index: ${move}`);
        console.log(`[CLIENT] Question: ${gameState.currentQuestion?.question}`);
        console.log(`[CLIENT] Selected option: ${gameState.currentQuestion?.options[move]}`);
        setSelectedAnswer(move);
        setIsAnswerSubmitted(true);
      }
    }
    
    socket.emit('make_move', { roomId, move });
  }, [socket, roomId, gameState, isAnswerSubmitted, timeRemaining]);

  const handleReturnToLobby = () => {
    const gameType = gameState?.gameType || '';
    navigate(`/games/${gameType}`);
  };
  
  const renderStatusMessage = () => {
    if (!gameState || !user) return "Загрузка...";

    if (gameState.status === 'finished') return "Игра окончена";
    if (gameState.status !== 'in_progress') return "Ожидание второго игрока...";

    if (gameState.gameType === 'quiz') {
      if (isAnswerSubmitted) return "Ответ отправлен! Ожидание других игроков...";
      if (timeRemaining <= 0) return "Время вышло!";
      return "Выберите ответ";
    }

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

  const renderQuizGame = () => {
    // Если игра завершена, показываем экран результатов
    if (gameState.status === 'finished') {
      const isWinner = gameState.winner === user.id;
      const isDraw = gameState.winner === 'draw';
      
      let resultText = '';
      let resultStyle = '';
      let animationData = null;
      
      if (isDraw) {
        resultText = 'Ничья!';
        resultStyle = styles.drawText;
      } else if (isWinner) {
        resultText = 'Победа!';
        resultStyle = styles.winnerText;
        animationData = victoryAnimation;
      } else {
        resultText = 'Поражение';
        resultStyle = styles.loserText;
        animationData = defeatAnimation;
      }

      return (
        <div className={styles.quizContainer}>
          <div className={styles.gameEndContainer}>
            {animationData && <LottiePlayer loop={false} play animationData={animationData} className={styles.lottieAnimation} />}
            
            <h2 className={`${styles.gameOverTitle} ${resultStyle}`}>{resultText}</h2>
            
            <div className={styles.finalScores}>
              <h3 className={styles.scoresTitle}>Финальный счет:</h3>
              {gameState.players.map(playerId => (
                <div key={playerId} className={`${styles.finalPlayerScore} ${playerId === gameState.winner ? styles.winnerScore : ''}`}>
                  <span className={styles.playerName}>
                    {playerId === user.id ? 'Вы' : 'Соперник'}
                  </span>
                  <span className={styles.scoreValue}>
                    {gameState.scores[playerId]}/{gameState.totalQuestions}
                  </span>
                  {playerId === gameState.winner && !isDraw && (
                    <span className={styles.winnerBadge}>👑</span>
                  )}
                </div>
              ))}
            </div>
            
            <div className={styles.coinsInfo}>
              <div className={styles.coinsMessage}>
                {isDraw 
                  ? "Ничья! Монеты возвращаются игрокам"
                  : isWinner 
                    ? "Поздравляем с победой! Вы получаете монеты!"
                    : "Удача в следующий раз! Монеты переходят сопернику"
                }
              </div>
            </div>
            
            <button 
              onClick={handleReturnToLobby} 
              className={styles.returnButton}
            >
              Вернуться к играм
            </button>
          </div>
        </div>
      );
    }

    // Если нет текущего вопроса, показываем загрузку
    if (!gameState.currentQuestion) {
      return <div className={styles.boardPlaceholder}>Загрузка вопроса...</div>;
    }

    // Показываем текущий вопрос
    const { question, options, questionNumber, totalQuestions } = gameState.currentQuestion;
    
    return (
      <div className={styles.quizContainer}>
        <div className={styles.quizHeader}>
          <div className={styles.playerProfiles}>
            {gameState.players.map(playerId => (
              <div key={playerId} className={styles.playerProfile}>
                <Avatar 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${playerId === user.id ? user.name : 'Opponent'}`}
                  alt={playerId === user.id ? user.name : 'Соперник'}
                  size="large"
                  variant="circle"
                  className={styles.playerAvatar}
                />
                <div className={styles.playerName}>
                  {playerId === user.id ? user.name : 'Соперник'}
                </div>
                <div className={styles.playerScore}>
                  {gameState.scores[playerId]}/{gameState.totalQuestions}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.questionSection}>
          <div className={styles.questionProgress}>
            Вопрос {questionNumber} из {totalQuestions}
          </div>
          <div className={styles.timer}>
            {timeRemaining}с
          </div>
          <h2 className={styles.questionText}>{question}</h2>
        </div>

        <div className={styles.optionsGrid}>
          {options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isDisabled = isAnswerSubmitted || timeRemaining <= 0;
            
            return (
              <button 
                key={index}
                className={`${styles.optionButton} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleMakeMove(index)}
                disabled={isDisabled}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className={styles.answerStatus}>
          {isAnswerSubmitted ? 'Ответ отправлен! Ожидаем других игроков...' : 
           timeRemaining <= 0 ? 'Время вышло!' :
           'Выберите ответ'}
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
        case 'quiz':
            return renderQuizGame();
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
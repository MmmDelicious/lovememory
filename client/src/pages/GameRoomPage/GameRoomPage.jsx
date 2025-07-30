import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LottiePlayer from 'react-lottie-player';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useGameSocket } from '../../hooks/useGameSocket';

import Avatar from '../../components/Avatar/Avatar';
import styles from './GameRoomPage.module.css';
import victoryAnimation from '../../assets/victory.json';
import defeatAnimation from '../../assets/defeat.json';

const GameRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { setCoins } = useCurrency();
  const { gameState, makeMove } = useGameSocket(roomId, token, setCoins);

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  useEffect(() => {
    if (gameState?.gameType === 'quiz' && gameState?.currentQuestion) {
      const isNewQuestion = selectedAnswer !== null || isAnswerSubmitted;
      if (gameState.currentQuestion.questionNumber !== gameState.lastQuestionNumber) {
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
      }
    }
  }, [gameState?.currentQuestion?.questionNumber]);

  const handleReturnToLobby = () => {
    const gameType = gameState?.gameType || '';
    navigate(`/games/${gameType}`);
  };

  const handleQuizMove = (move) => {
    if (isAnswerSubmitted || (gameState?.currentQuestion?.timeRemaining <= 0)) return;
    setSelectedAnswer(move);
    setIsAnswerSubmitted(true);
    makeMove(move);
  };

  const renderStatusMessage = () => {
    if (!gameState || !user) return "Подключение к игре...";
    if (gameState.status === 'finished') return "Игра окончена";
    if (gameState.status !== 'in_progress') return "Ожидание второго игрока...";

    if (gameState.gameType === 'quiz') {
      if (isAnswerSubmitted) return "Ответ принят! Ожидание...";
      if (gameState.currentQuestion?.timeRemaining <= 0) return "Время вышло!";
      return "Выберите ответ";
    }

    return gameState.currentPlayerId === user.id ? "Ваш ход" : "Ход соперника";
  };

  const renderQuizGame = () => {
    if (gameState.status === 'finished') {
      const isWinner = gameState.winner === user.id;
      const isDraw = gameState.winner === 'draw';
      let resultText = isDraw ? 'Ничья!' : isWinner ? 'Победа!' : 'Поражение';
      let resultStyle = isDraw ? styles.drawText : isWinner ? styles.winnerText : styles.loserText;
      let animationData = isWinner ? victoryAnimation : defeatAnimation;
      if (isDraw) animationData = null;

      return (
        <div className={styles.gameEndContainer}>
          {animationData && <LottiePlayer loop={false} play animationData={animationData} className={styles.lottieAnimation} />}
          <h2 className={`${styles.gameOverTitle} ${resultStyle}`}>{resultText}</h2>
          <div className={styles.finalScores}>
            <h3 className={styles.scoresTitle}>Финальный счет:</h3>
            {gameState.players.map(playerId => (
              <div key={playerId} className={`${styles.finalPlayerScore} ${playerId === gameState.winner ? styles.winnerScore : ''}`}>
                <span className={styles.playerName}>{playerId === user.id ? 'Вы' : 'Соперник'}</span>
                <span className={styles.scoreValue}>{gameState.scores[playerId]}/{gameState.totalQuestions}</span>
                {playerId === gameState.winner && !isDraw && <span className={styles.winnerBadge}>👑</span>}
              </div>
            ))}
          </div>
          <button onClick={handleReturnToLobby} className={styles.returnButton}>Вернуться к играм</button>
        </div>
      );
    }

    if (!gameState.currentQuestion) return <div className={styles.boardPlaceholder}>Загрузка вопроса...</div>;
    const { question, options, questionNumber, totalQuestions, timeRemaining } = gameState.currentQuestion;

    return (
      <div className={styles.quizContainer}>
        <div className={styles.quizHeader}>
          {gameState.players.map(playerId => (
            <div key={playerId} className={styles.playerProfile}>
              <Avatar src={`https://api.dicebear.com/7.x/initials/svg?seed=${playerId}`} alt="avatar" size="large" variant="circle" />
              <div className={styles.playerName}>{playerId === user.id ? user.first_name : 'Соперник'}</div>
              <div className={styles.playerScore}>{gameState.scores[playerId]}/{gameState.totalQuestions}</div>
            </div>
          ))}
        </div>
        <div className={styles.questionSection}>
          <div className={styles.questionProgress}>Вопрос {questionNumber} из {totalQuestions}</div>
          <div className={styles.timer}>{timeRemaining}с</div>
          <h2 className={styles.questionText}>{question}</h2>
        </div>
        <div className={styles.optionsGrid}>
          {options.map((option, index) => (
            <button key={index}
              className={`${styles.optionButton} ${selectedAnswer === index ? styles.selected : ''}`}
              onClick={() => handleQuizMove(index)}
              disabled={isAnswerSubmitted || timeRemaining <= 0}>
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderGameBoard = () => {
    if (!gameState) return <div className={styles.boardPlaceholder}>Загрузка игровой доски...</div>;
    if (gameState.status === 'finished' && gameState.gameType !== 'quiz') return renderGameEndOverlay();

    switch (gameState.gameType) {
      case 'tic-tac-toe':
        return (
          <div className={styles.ticTacToeBoard}>
            {(gameState.board || Array(9).fill(null)).map((cell, index) => (
              <div key={index}
                className={`${styles.cell} ${cell ? styles.filled : ''} ${gameState.status !== 'in_progress' || gameState.currentPlayerId !== user.id ? styles.disabled : ''}`}
                onClick={() => makeMove(index)}>
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
  
  const renderGameEndOverlay = () => {
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
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Комната #{roomId.substring(0, 8)}</h1>
      <h2 className={styles.status}>{renderStatusMessage()}</h2>
      {renderGameBoard()}
    </div>
  );
};

export default GameRoomPage;
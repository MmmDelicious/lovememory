import React, { useState, useEffect } from 'react';
import styles from './QuizGame.module.css';

const QuizGame = ({ gameState, user, makeMove, handleReturnToLobby }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  useEffect(() => {
    if (gameState?.currentQuestion) {
      if (gameState.currentQuestion.questionNumber !== gameState.lastQuestionNumber) {
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
      }
    }
  }, [gameState?.currentQuestion?.questionNumber, gameState?.lastQuestionNumber]);

  const handleQuizMove = (move) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(move);
    setIsAnswerSubmitted(true);
    makeMove(move);
  };

  if (gameState.status === 'finished') {
    const isWinner = gameState.winner === user.id;
    const isDraw = gameState.winner === 'draw';
    let resultText = isDraw ? 'Ничья!' : isWinner ? 'Победа!' : 'Поражение';
    
    // Получаем информацию о монетах из результатов экономической системы
    const userEconomyResult = gameState.economyResults?.[user.id];
    let coinsInfo = null;
    
    if (userEconomyResult) {
      if (userEconomyResult.type === 'winner') {
        coinsInfo = `Выигрыш: +${userEconomyResult.coinsChange} монет`;
      } else if (userEconomyResult.type === 'loser') {
        coinsInfo = `Потеряно: ${userEconomyResult.coinsChange} монет`;
      } else if (userEconomyResult.type === 'draw') {
        coinsInfo = `Ставка возвращена: +${userEconomyResult.coinsChange} монет`;
      }
    }

    return (
      <div className={styles.gameEndContainer}>
        <h3 className={styles.brandTitle}>Lovememory</h3>
        <h1 className={styles.gameTitle}>Игра окончена</h1>
        <div className={styles.results}>
          <h2 className={styles.resultText}>{resultText}</h2>
          {coinsInfo && (
            <div className={styles.coinsInfo}>
              <div className={styles.coinsIcon}>💰</div>
              <span>{coinsInfo}</span>
            </div>
          )}
          <div className={styles.finalScores}>
            {gameState.players.map(playerId => (
              <div key={playerId} className={styles.finalPlayerScore}>
                <span className={styles.playerName}>{playerId === user.id ? 'Вы' : 'Соперник'}</span>
                <span className={styles.scoreValue}>{gameState.scores[playerId]}/{gameState.totalQuestions}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={handleReturnToLobby} className={styles.returnButton}>Вернуться к играм</button>
      </div>
    );
  }

  if (!gameState.currentQuestion) return <div className={styles.boardPlaceholder}>Загрузка вопроса...</div>;
  const { question, options, questionNumber, totalQuestions, timeRemaining } = gameState.currentQuestion;

  const progressPercentage = (questionNumber / totalQuestions) * 100;

  return (
    <div className={styles.quizContainer}>
        <h3 className={styles.brandTitle}>Lovememory</h3>
        <h1 className={styles.gameTitle}>Couples Quiz</h1>

        <div className={styles.progressContainer}>
            <span className={styles.progressText}>Question {questionNumber} of {totalQuestions}</span>
            <div className={styles.progressBar}>
                <div className={styles.progressBarFill} style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <span className={styles.timer}>{timeRemaining !== undefined ? timeRemaining : 15} sec</span>
        </div>

        <div className={styles.questionArea}>
            <div className={styles.playerIndicatorContainer}>
                <div className={`${styles.playerIndicator} ${styles.player1}`}></div>
                <p className={styles.playerName}>Player 1</p>
            </div>
            <h2 className={styles.questionText}>{question}</h2>
            <div className={styles.playerIndicatorContainer}>
                <div className={`${styles.playerIndicator} ${styles.player2}`}></div>
                <p className={styles.playerName}>Player 2</p>
            </div>
        </div>

        <div className={styles.optionsGrid}>
            {options.map((option, index) => (
                <button 
                    key={index}
                    className={`${styles.optionButton} ${selectedAnswer === index ? styles.selected : ''}`}
                    onClick={() => handleQuizMove(index)}
                    disabled={isAnswerSubmitted}
                >
                    {option}
                </button>
            ))}
        </div>
    </div>
  );
};

export default QuizGame;
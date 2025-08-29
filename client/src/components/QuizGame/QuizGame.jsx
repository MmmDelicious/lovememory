import React, { useState, useEffect } from 'react';
import styles from './QuizGame.module.css';
const QuizGame = ({ gameState, user, makeMove, handleReturnToLobby }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [localTimeRemaining, setLocalTimeRemaining] = useState(15);
  // Правильная синхронизация при смене вопроса
  useEffect(() => {
    // Сбрасываем состояние при смене вопроса
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    // Сбрасываем локальный таймер до серверного значения
    if (gameState?.questionTimeRemaining !== undefined) {
      setLocalTimeRemaining(gameState.questionTimeRemaining);
    }
  }, [gameState?.currentQuestionIndex]);

  // Обновляем локальный таймер на основе серверного (авторитетного)
  useEffect(() => {
    if (gameState?.questionTimeRemaining !== undefined) {
      setLocalTimeRemaining(Math.max(0, gameState.questionTimeRemaining)); // Защита от отрицательных значений
    }
  }, [gameState?.questionTimeRemaining]);

  // Запускаем локальный таймер, который обновляется каждую секунду
  useEffect(() => {
    if (gameState?.status !== 'in_progress' || isAnswerSubmitted) {
      return;
    }

    const timer = setInterval(() => {
      setLocalTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState?.status, gameState?.currentQuestionIndex, isAnswerSubmitted]);
  const handleQuizMove = async (move) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(move);
    setIsAnswerSubmitted(true);
    
    try {
      // Поддерживаем как Promise, так и синхронные вызовы
      const result = makeMove(move);
      if (result && typeof result.then === 'function') {
        await result; // Ожидаем Promise
      }
    } catch (error) {
      console.error('[QuizGame] Error submitting answer:', error);
      // Откатываем состояние при ошибке
      setIsAnswerSubmitted(false);
      setSelectedAnswer(null);
      // Можно добавить показ ошибки пользователю
      alert('Ошибка при отправке ответа: ' + (error.message || 'Неизвестная ошибка'));
    }
  };
  if (gameState.status === 'finished') {
    let isWinner, isDraw, resultText;
    if (gameState.gameFormat === '2v2') {
      const userTeam = gameState.teams?.team1?.includes(user.id) ? 'team1' : 'team2';
      isWinner = gameState.winner === userTeam;
      isDraw = gameState.winner === 'draw';
      resultText = isDraw ? 'Ничья!' : isWinner ? 'Победа команды!' : 'Поражение команды';
    } else {
      isWinner = gameState.winner === user.id;
      isDraw = gameState.winner === 'draw';
      resultText = isDraw ? 'Ничья!' : isWinner ? 'Победа!' : 'Поражение';
    }
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
            {gameState.gameFormat === '2v2' ? (
              <div className={styles.teamResults}>
                <div className={styles.teamResult}>
                  <div className={styles.teamResultHeader}>
                    <span className={styles.teamResultName}>Команда 1</span>
                    <span className={styles.teamResultScore}>{gameState.teamScores?.team1 || 0}</span>
                  </div>
                  <div className={styles.teamResultMembers}>
                    {gameState.teams?.team1?.map(playerId => (
                      <div key={playerId} className={styles.teamMemberResult}>
                        <span>{playerId === user.id ? 'Вы' : 'Игрок'}</span>
                        <span>{gameState.scores[playerId]}/{gameState.totalQuestions}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.teamResult}>
                  <div className={styles.teamResultHeader}>
                    <span className={styles.teamResultName}>Команда 2</span>
                    <span className={styles.teamResultScore}>{gameState.teamScores?.team2 || 0}</span>
                  </div>
                  <div className={styles.teamResultMembers}>
                    {gameState.teams?.team2?.map(playerId => (
                      <div key={playerId} className={styles.teamMemberResult}>
                        <span>{playerId === user.id ? 'Вы' : 'Игрок'}</span>
                        <span>{gameState.scores[playerId]}/{gameState.totalQuestions}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              gameState.players.map(playerId => (
                <div key={playerId} className={styles.finalPlayerScore}>
                  <span className={styles.playerName}>{playerId === user.id ? 'Вы' : 'Соперник'}</span>
                  <span className={styles.scoreValue}>{gameState.scores[playerId]}/{gameState.totalQuestions}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <button onClick={handleReturnToLobby} className={styles.returnButton}>Вернуться к играм</button>
      </div>
    );
  }
  const isWaiting = !gameState.currentQuestion || gameState.status === 'waiting';
  // Защита от undefined и некорректных значений
  const safeCurrentQuestionIndex = gameState?.currentQuestionIndex || 0;
  const safeTotalQuestions = gameState?.totalQuestions || 10;
  
  const { question, options } = gameState.currentQuestion || {
    question: "Ожидание соперника...",
    options: ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"]
  };
  
  // Читаем questionNumber из top-level полей с фолбэком
  const questionNumber = Math.max(1, safeCurrentQuestionIndex + 1);
  const totalQuestions = Math.max(1, safeTotalQuestions);
  
  // Нормализованный прогресс с защитой от деления на ноль
  const progressPercentage = Math.max(0, Math.min(100, (questionNumber / totalQuestions) * 100));
  return (
    <div className={`${styles.quizContainer} ${isWaiting ? styles.waiting : ''}`}>
        <h3 className={styles.brandTitle}>Lovememory</h3>
        <h1 className={styles.gameTitle}>Couples Quiz</h1>
        <div className={styles.progressContainer}>
            <span className={styles.progressText}>Question {questionNumber} of {totalQuestions}</span>
            <div className={styles.progressBar}>
                <div className={styles.progressBarFill} style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <span className={`${styles.timer} ${localTimeRemaining <= 5 ? styles.timerWarning : ''}`}>
              {localTimeRemaining} sec
            </span>
        </div>
        {gameState?.gameFormat === '2v2' && (
          <div className={styles.teamScores}>
            <div className={styles.teamScore}>
              <div className={styles.teamHeader}>
                <span className={styles.teamName}>
                  {gameState?.teams?.team1?.includes(user.id) ? '🏆 Ваша команда' : '⚔️ Команда 1'}
                </span>
                <span className={styles.teamPoints}>{gameState?.teamScores?.team1 || 0}</span>
              </div>
              <div className={styles.teamMembers}>
                {gameState?.teams?.team1?.map((playerId) => (
                  <div key={playerId} className={styles.teamMember}>
                    {playerId === user.id ? 'Вы' : `Игрок`}
                    <span>({gameState?.scores?.[playerId] || 0})</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.teamScore}>
              <div className={styles.teamHeader}>
                <span className={styles.teamName}>
                  {gameState?.teams?.team2?.includes(user.id) ? '🏆 Ваша команда' : '⚔️ Команда 2'}
                </span>
                <span className={styles.teamPoints}>{gameState?.teamScores?.team2 || 0}</span>
              </div>
              <div className={styles.teamMembers}>
                {gameState?.teams?.team2?.map((playerId) => (
                  <div key={playerId} className={styles.teamMember}>
                    {playerId === user.id ? 'Вы' : `Игрок`}
                    <span>({gameState?.scores?.[playerId] || 0})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className={styles.questionArea}>
            {gameState?.gameFormat !== '2v2' && (
              <div className={styles.playerIndicatorContainer}>
                  <div className={`${styles.playerIndicator} ${styles.player1}`}></div>
                  <p className={styles.playerName}>Player 1</p>
              </div>
            )}
            <h2 className={styles.questionText}>{question}</h2>
            {gameState?.gameFormat !== '2v2' && (
              <div className={styles.playerIndicatorContainer}>
                  <div className={`${styles.playerIndicator} ${styles.player2}`}></div>
                  <p className={styles.playerName}>Player 2</p>
              </div>
            )}
        </div>
        <div className={styles.optionsGrid}>
            {options.map((option, index) => (
                <button 
                    key={index}
                    className={`${styles.optionButton} ${selectedAnswer === index ? styles.selected : ''}`}
                    onClick={() => handleQuizMove(index)}
                    disabled={isAnswerSubmitted || isWaiting}
                >
                    {option}
                </button>
            ))}
        </div>
    </div>
  );
};
export default QuizGame;

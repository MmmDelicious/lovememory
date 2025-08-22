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
  const { question, options, questionNumber, totalQuestions, timeRemaining } = gameState.currentQuestion || {
    question: "Ожидание соперника...",
    options: ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
    questionNumber: 1,
    totalQuestions: 10,
    timeRemaining: 15
  };
  const progressPercentage = (questionNumber / totalQuestions) * 100;
  return (
    <div className={`${styles.quizContainer} ${isWaiting ? styles.waiting : ''}`}>
        <h3 className={styles.brandTitle}>Lovememory</h3>
        <h1 className={styles.gameTitle}>Couples Quiz</h1>
        <div className={styles.progressContainer}>
            <span className={styles.progressText}>Question {questionNumber} of {totalQuestions}</span>
            <div className={styles.progressBar}>
                <div className={styles.progressBarFill} style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <span className={styles.timer}>{timeRemaining !== undefined ? timeRemaining : 15} sec</span>
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

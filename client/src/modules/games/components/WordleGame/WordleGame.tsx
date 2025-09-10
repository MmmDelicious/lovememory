import React, { useState, useEffect } from 'react';
import styles from './WordleGame.module.css';
interface WordleGameProps {
  gameState: any;
  user: { id: string; email: string };
  makeMove: (guess: string) => void;
  handleReturnToLobby: () => void;
}
type LetterStatus = 'correct' | 'present' | 'absent' | 'unused';
const KEYBOARD_ROWS = [
  ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х'],
  ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
  ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю']
];
const ENGLISH_KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];
const WordleGame: React.FC<WordleGameProps> = ({ gameState, user, makeMove, handleReturnToLobby }) => {
  const [currentGuess, setCurrentGuess] = useState('');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [notificationTimeoutId, setNotificationTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const wordLength = gameState?.targetWordLength || 5;
  const maxAttempts = gameState?.maxAttempts || 6;
  const playerGuesses = gameState?.playerGuesses || [];
  const playerResults = gameState?.playerResults || [];
  const language = gameState?.language || 'russian';
  const keyboardRows = language === 'english' ? ENGLISH_KEYBOARD_ROWS : KEYBOARD_ROWS;
  useEffect(() => {
    }, [gameState, playerGuesses, playerResults]);
  // Исправляем очистку currentGuess - очищаем только при успешном отправлении собственного хода
  const [lastSubmittedGuess, setLastSubmittedGuess] = useState<string>('');
  
  useEffect(() => {

    if (lastSubmittedGuess && currentGuess.toUpperCase() === lastSubmittedGuess && 
        playerGuesses.length > 0 && playerGuesses[playerGuesses.length - 1] === lastSubmittedGuess) {
      setCurrentGuess('');
      setLastSubmittedGuess(''); // Сбрасываем флаг
    }
  }, [playerGuesses, currentGuess, lastSubmittedGuess]);
  const getLetterStatus = (letter: string): LetterStatus => {
    let bestStatus: LetterStatus = 'unused';
    
    // Проходим по всем попыткам и позициям
    for (let i = playerResults.length - 1; i >= 0; i--) {
      const guess = playerGuesses[i];
      const result = playerResults[i];
      
      if (!guess || !result) continue;
      
      // Итерируем по позициям, а не используем indexOf
      for (let j = 0; j < guess.length; j++) {
        if (guess[j] === letter) {
          const status = result[j];
          
          // Приоритет: correct > present > absent > unused
          if (status === 'correct') {
            return 'correct'; // Наивысший приоритет
          } else if (status === 'present' && bestStatus !== 'correct') {
            bestStatus = 'present';
          } else if (status === 'absent' && bestStatus === 'unused') {
            bestStatus = 'absent';
          }
        }
      }
    }
    
    return bestStatus;
  };
  const handleKeyPress = (letter: string) => {
    if (currentGuess.length < wordLength) { // Параметризованная длина
      setCurrentGuess(prev => prev + letter);
      setError('');
      setNotification('');
    }
  };
  const handleBackspace = () => {
    setCurrentGuess(prev => prev.slice(0, -1));
    setError('');
    setNotification('');
  };
  const showNotification = (message: string) => {

    if (notificationTimeoutId) {
      clearTimeout(notificationTimeoutId);
    }
    
    setNotification(message);
    const timeoutId = setTimeout(() => {
      setNotification('');
      setNotificationTimeoutId(null);
    }, 3000);
    
    setNotificationTimeoutId(timeoutId);
  };
  
  
  useEffect(() => {
    return () => {
      if (notificationTimeoutId) {
        clearTimeout(notificationTimeoutId);
      }
    };
  }, [notificationTimeoutId]);
  const handleSubmit = async () => {
    if (currentGuess.length !== wordLength) {
      showNotification(`Введите ${wordLength} букв`);
      return;
    }
    // Убираем клиентскую проверку словаря - единый источник правды на сервере
    // Сервер вернёт ошибку, если слово невалидно
    try {
      // Поддерживаем как Promise, так и синхронные вызовы
      const result = makeMove(currentGuess);
      if (result && typeof result.then === 'function') {
        await result; // Ожидаем Promise
      }
      setLastSubmittedGuess(currentGuess.toUpperCase()); // Запоминаем отправленное слово
      setError('');
      setNotification('');
    } catch (error: any) {
      console.error('[WordleGame] Error submitting guess:', error);
      showNotification(error.message || 'Ошибка при отправке слова');
      setError(error.message || 'Ошибка при отправке слова');
    }
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWaiting) return;
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else {
        // Валидируем ввод в зависимости от языка
        const isValidLetter = language === 'english' 
          ? /^[a-z]$/i.test(e.key) // Английские буквы
          : /^[а-яё]$/i.test(e.key); // Русские буквы
        
        if (isValidLetter) {
          handleKeyPress(e.key.toUpperCase());
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameState, isWaiting]); // Добавляем isWaiting в deps
  if (gameState?.status === 'finished') {
    const isWinner = gameState.winner === user.id;
    const isDraw = gameState.winner === 'draw';
    let resultText = isDraw ? 'Ничья!' : isWinner ? 'Победа!' : 'Поражение';
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
          {gameState.targetWord && (
            <div className={styles.targetWord}>
              Загаданное слово: <strong>{gameState.targetWord}</strong>
            </div>
          )}
          <div className={styles.finalScores}>
            {(gameState?.players || [])
              .filter((playerId: string, index: number, array: string[]) => array.indexOf(playerId) === index) // Убираем дубликаты
              .map((playerId: string) => (
              <div key={playerId} className={styles.finalPlayerScore}>
                <span className={styles.playerName}>
                  {playerId === user.id ? 'Вы' : 'Соперник'}
                </span>
                <span className={styles.scoreValue}>
                  {gameState?.scores?.[playerId] || 0} очков
                </span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={handleReturnToLobby} className={styles.returnButton}>
          Вернуться к играм
        </button>
      </div>
    );
  }
  const isWaiting = !gameState || gameState.status === 'waiting';
  return (
    <div className={`${styles.wordleContainer} ${isWaiting ? styles.waiting : ''}`}>
      <div className={styles.gameInfo}>
        <div className={styles.round}>
          Раунд {gameState?.currentRound || 1} из {gameState?.maxRounds || 3}
        </div>
        <div className={styles.language}>
          Язык: {language === 'russian' ? '🇷🇺 Русский' : '🇺🇸 English'}
        </div>
        <div className={styles.scores}>
          {gameState?.gameFormat === '2v2' ? (
            <div className={styles.teamScores}>
              <div className={styles.teamScore}>
                <div className={styles.teamHeader}>
                  <span className={styles.teamName}>
                    {gameState?.playerTeam === 'team1' ? '🏆 Ваша команда' : '⚔️ Команда 1'}
                  </span>
                  <span className={styles.teamPoints}>{gameState?.teamScores?.team1 || 0}</span>
                </div>
                <div className={styles.teamMembers}>
                  {gameState?.teams?.team1?.map((playerId: string) => (
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
                    {gameState?.playerTeam === 'team2' ? '🏆 Ваша команда' : '⚔️ Команда 2'}
                  </span>
                  <span className={styles.teamPoints}>{gameState?.teamScores?.team2 || 0}</span>
                </div>
                <div className={styles.teamMembers}>
                  {gameState?.teams?.team2?.map((playerId: string) => (
                    <div key={playerId} className={styles.teamMember}>
                      {playerId === user.id ? 'Вы' : `Игрок`}
                      <span>({gameState?.scores?.[playerId] || 0})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            (gameState?.players || [])
              .filter((player: any, index: number, array: any[]) => array.findIndex(p => p.id === player.id) === index)
              .map((player: any) => (
                <div key={player.id} className={styles.playerScore}>
                  <span>{player.id === user.id ? 'Вы' : 'Соперник'}</span>
                  <span>{gameState?.scores?.[player.id] || 0}</span>
                </div>
              ))
          )}
        </div>
      </div>
      <div className={styles.gameBoard}>
        {}
        <div className={styles.guessGrid}>
          {Array.from({ length: maxAttempts }, (_, rowIndex) => (
            <div key={rowIndex} className={styles.guessRow}>
              {Array.from({ length: wordLength }, (_, colIndex) => {
                let letter = '';
                let status = '';
                if (rowIndex < playerGuesses.length) {
                  const guess = playerGuesses[rowIndex] || '';
                  const result = (playerResults[rowIndex] || []); // Смягченный доступ
                  letter = guess[colIndex] || '';
                  status = result[colIndex] || ''; // Безопасный доступ
                } else if (rowIndex === playerGuesses.length) {
                  letter = currentGuess[colIndex] || '';
                }
                const cellClasses = `${styles.letterCell} ${status ? styles[status] : ''} ${
                  rowIndex === playerGuesses.length ? styles.current : ''
                }`;
                return (
                  <div
                    key={colIndex}
                    className={cellClasses}
                    title={`Row: ${rowIndex}, Col: ${colIndex}, Status: ${status}, Letter: ${letter}, GuessesCount: ${playerGuesses.length}, CurrentGuess: ${currentGuess}`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {}
        {error && <div className={styles.error}>{error}</div>}
        {}
        {notification && <div className={styles.notification}>{notification}</div>}
        {}
        <div className={styles.keyboard}>
          {keyboardRows.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.keyboardRow}>
              {rowIndex === keyboardRows.length - 1 && (
                <button
                  className={`${styles.key} ${styles.specialKey}`}
                  onClick={handleSubmit}
                  disabled={currentGuess.length !== wordLength || isWaiting}
                >
                  ВВОД
                </button>
              )}
              {row.map(letter => (
                <button
                  key={letter}
                  className={`${styles.key} ${styles[getLetterStatus(letter)]}`}
                  onClick={() => handleKeyPress(letter)}
                  disabled={currentGuess.length >= wordLength || isWaiting}
                >
                  {letter}
                </button>
              ))}
              {rowIndex === keyboardRows.length - 1 && (
                <button
                  className={`${styles.key} ${styles.specialKey}`}
                  onClick={handleBackspace}
                  disabled={currentGuess.length === 0 || isWaiting}
                >
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default WordleGame;


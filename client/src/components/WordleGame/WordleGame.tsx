import React, { useState, useEffect } from 'react';
import styles from './WordleGame.module.css';
import { ENGLISH_WORDS, RUSSIAN_WORDS } from '../../utils/dictionaries';

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

  const wordLength = gameState?.targetWordLength || 5;
  const maxAttempts = gameState?.maxAttempts || 6;
  const playerGuesses = gameState?.playerGuesses || [];
  const playerResults = gameState?.playerResults || [];
  const language = gameState?.language || 'russian';
  const keyboardRows = language === 'english' ? ENGLISH_KEYBOARD_ROWS : KEYBOARD_ROWS;

  // Отладка для проверки данных
  useEffect(() => {
    console.log('[WordleGame] Game state updated:', {
      playerGuesses,
      playerResults,
      gameState
    });
  }, [gameState, playerGuesses, playerResults]);

  // Очищаем currentGuess когда получаем новое состояние с нашим словом
  useEffect(() => {
    if (playerGuesses.length > 0) {
      const lastGuess = playerGuesses[playerGuesses.length - 1];
      if (lastGuess && currentGuess.toUpperCase() === lastGuess) {
        console.log('[WordleGame] Clearing current guess after server confirmation');
        setCurrentGuess('');
      }
    }
  }, [playerGuesses, currentGuess]);

  // Определяем статус каждой буквы для клавиатуры
  const getLetterStatus = (letter: string): LetterStatus => {
    for (let i = playerResults.length - 1; i >= 0; i--) {
      const guess = playerGuesses[i];
      const result = playerResults[i];
      
      const letterIndex = guess.indexOf(letter);
      if (letterIndex !== -1) {
        const status = result[letterIndex];
        if (status === 'correct') return 'correct';
        if (status === 'present') return 'present';
        if (status === 'absent') return 'absent';
      }
    }
    return 'unused';
  };

  const handleKeyPress = (letter: string) => {
    if (currentGuess.length < 5) { // Жестко 5 букв
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
    setNotification(message);
    setTimeout(() => setNotification(''), 3000); // Убираем через 3 секунды
  };

  const handleSubmit = () => {
    if (currentGuess.length !== 5) {
      showNotification('Введите 5 букв');
      return;
    }

    // Проверяем слово в словаре на фронте
    const dictionary = language === 'english' ? ENGLISH_WORDS : RUSSIAN_WORDS;
    
    const fiveLetterWords = dictionary.filter((word: string) => word.length === 5);
    const normalizedGuess = currentGuess.toLowerCase();
    
    if (!fiveLetterWords.includes(normalizedGuess)) {
      showNotification('Этого слова нет в нашем словаре');
      return; // НЕ очищаем currentGuess
    }

    console.log('[WordleGame] Submitting guess:', currentGuess);
    try {
      makeMove(currentGuess);
      // НЕ очищаем currentGuess здесь - дождемся обновления состояния
      setError('');
      setNotification('');
    } catch (error: any) {
      console.error('[WordleGame] Error submitting guess:', error);
      setError(error.message || 'Ошибка при отправке слова');
    }
  };

  // Обработка клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState?.status !== 'in_progress') return;

      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key.match(/^[а-яёa-z]$/i)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameState]);

  // Отображение завершенной игры
  if (gameState?.status === 'finished') {
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

  if (!gameState || gameState.status === 'waiting') {
    return <div className={styles.boardPlaceholder}>Ожидание соперника...</div>;
  }

  return (
    <div className={styles.wordleContainer}>
      <div className={styles.gameInfo}>
        <div className={styles.round}>
          Раунд {gameState.currentRound} из {gameState.maxRounds}
        </div>
        <div className={styles.language}>
          Язык: {language === 'russian' ? '🇷🇺 Русский' : '🇺🇸 English'}
        </div>
        <div className={styles.scores}>
          {(gameState?.players || [])
            .filter((playerId: string, index: number, array: string[]) => array.indexOf(playerId) === index) // Убираем дубликаты
            .map((playerId: string) => (
            <div key={playerId} className={styles.playerScore}>
              <span>{playerId === user.id ? 'Вы' : 'Соперник'}</span>
              <span>{gameState?.scores?.[playerId] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.gameBoard}>
        {/* Сетка попыток */}
        <div className={styles.guessGrid}>
          {Array.from({ length: maxAttempts }, (_, rowIndex) => (
            <div key={rowIndex} className={styles.guessRow}>
              {Array.from({ length: wordLength }, (_, colIndex) => {
                let letter = '';
                let status = '';

                if (rowIndex < playerGuesses.length) {
                  // Завершенная попытка
                  const guess = playerGuesses[rowIndex] || '';
                  const result = playerResults[rowIndex] || [];
                  letter = guess[colIndex] || '';
                  status = result[colIndex] || '';
                } else if (rowIndex === playerGuesses.length) {
                  // Текущая попытка
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

        {/* Ошибка */}
        {error && <div className={styles.error}>{error}</div>}
        
        {/* Уведомление */}
        {notification && <div className={styles.notification}>{notification}</div>}

        {/* Виртуальная клавиатура */}
        <div className={styles.keyboard}>
          {keyboardRows.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.keyboardRow}>
              {rowIndex === keyboardRows.length - 1 && (
                <button
                  className={`${styles.key} ${styles.specialKey}`}
                  onClick={handleSubmit}
                  disabled={currentGuess.length !== 5}
                >
                  ВВОД
                </button>
              )}
              
              {row.map(letter => (
                <button
                  key={letter}
                  className={`${styles.key} ${styles[getLetterStatus(letter)]}`}
                  onClick={() => handleKeyPress(letter)}
                  disabled={currentGuess.length >= wordLength}
                >
                  {letter}
                </button>
              ))}
              
              {rowIndex === keyboardRows.length - 1 && (
                <button
                  className={`${styles.key} ${styles.specialKey}`}
                  onClick={handleBackspace}
                  disabled={currentGuess.length === 0}
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

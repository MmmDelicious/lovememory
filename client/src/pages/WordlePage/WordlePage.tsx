import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ArrowLeft,
  Trophy,
  Target,
  Zap,
  Crown,
  Play,
  X,
  User
} from 'lucide-react';
import styles from './WordlePage.module.css';
import { getDictionary, getRandomWord } from '../../utils/dictionaries';

type GamePhase = 'setup' | 'playing' | 'finished';

type LetterStatus = 'correct' | 'present' | 'absent';



const KEYBOARD_ROWS = [
  ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З'],
  ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж'],
  ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю', 'Э']
];

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getRandomWordForGame() {
  return getRandomWord('russian');
}

function PlayerStats(props: {
  name: string;
  score: number;
  currentWord: string;
  attempts: number;
  isYou?: boolean;
  isLeading?: boolean;
  timeLeft: number;
}) {
  const { name, score, currentWord, attempts, isYou, isLeading } = props;
  return (
    <div className={`${styles.playerStats} ${isLeading ? styles.leadingPlayer : ''}`}>
      <div
        className={styles.playerStatsGradient}
        style={{
          background: isLeading
            ? 'linear-gradient(180deg, #D97A6C 0%, #E89F93 100%)'
            : 'linear-gradient(180deg, #FFFFFF 0%, #FFF8F6 100%)'
        }}
      >
        <div className={styles.playerStatsHeader}>
          <div className={styles.playerInfo}>
            <div
              className={styles.playerAvatar}
              style={{ backgroundColor: isLeading ? 'rgba(255,255,255,0.2)' : '#EADFD8' }}
            >
              <User size={16} color={isLeading ? '#FFFFFF' : '#D97A6C'} strokeWidth={2} />
            </div>
            <div>
              <div
                className={styles.playerName}
                style={{ color: isLeading ? '#FFFFFF' : '#4A3F3D' }}
              >
                {name} {isYou ? '(Вы)' : ''}
              </div>
              <div
                className={styles.playerScore}
                style={{ color: isLeading ? 'rgba(255,255,255,0.8)' : '#8C7F7D' }}
              >
                {score} слов
              </div>
            </div>
          </div>
          {isLeading && <Crown size={16} color="#FFFFFF" strokeWidth={2} />}
        </div>

        <div className={styles.playerProgress}>
          <div
            className={styles.currentWordLabel}
            style={{ color: isLeading ? 'rgba(255,255,255,0.8)' : '#8C7F7D' }}
          >
            Текущее слово:
          </div>
          <div
            className={styles.currentWord}
            style={{ color: isLeading ? '#FFFFFF' : '#4A3F3D' }}
          >
            {currentWord || '-----'}
          </div>
          <div
            className={styles.attempts}
            style={{ color: isLeading ? 'rgba(255,255,255,0.7)' : '#B8A8A4' }}
          >
            Попытка {attempts}/6
          </div>
        </div>
      </div>
    </div>
  );
}

function WordGrid(props: {
  guesses: string[];
  currentGuess: string;
  targetWord: string;
}) {
  const { guesses, currentGuess, targetWord } = props;

  const getLetterStatus = (letter: string, position: number, guess: string): LetterStatus | 'default' => {
    if (!targetWord) return 'default';
    if (targetWord[position] === letter) return 'correct';
    if (targetWord.includes(letter)) return 'present';
    return 'absent';
  };

  const renderRow = (guess: string, rowIndex: number, isCurrentRow = false) => {
    const letters = guess.padEnd(5, ' ').split('');
    return (
      <div key={rowIndex} className={styles.wordRow}>
        {letters.map((letter, index) => {
          const status = guess.length === 5 && !isCurrentRow ? getLetterStatus(letter, index, guess) : 'default';
          return (
            <div
              key={index}
              className={[
                styles.letterCell,
                status === 'correct' ? styles.correctCell : '',
                status === 'present' ? styles.presentCell : '',
                status === 'absent' ? styles.absentCell : '',
                isCurrentRow && letter !== ' ' ? styles.filledCell : ''
              ].join(' ')}
            >
              <span className={[
                styles.letterText,
                (status === 'correct' || status === 'present' || status === 'absent') ? styles.letterTextWhite : ''
              ].join(' ')}>
                {letter !== ' ' ? letter : ''}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.wordGrid}>
      {guesses.map((guess, index) => renderRow(guess, index))}
      {guesses.length < 6 && renderRow(currentGuess, guesses.length, true)}
      {Array.from({ length: Math.max(0, 5 - guesses.length) }, (_, index) => renderRow('', guesses.length + index + 1))}
    </div>
  );
}

function Keyboard(props: {
  onKeyPress: (key: string) => void;
  guessedLetters: Record<string, LetterStatus>;
}) {
  const { onKeyPress, guessedLetters } = props;
  return (
    <div className={styles.keyboard}>
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.keyboardRow}>
          {rowIndex === 2 && (
            <button className={`${styles.key} ${styles.actionKey}`} onClick={() => onKeyPress('ENTER')}>
              <span className={styles.actionKeyText}>ВВОД</span>
            </button>
          )}
          {row.map((key) => (
            <button
              key={key}
              className={[
                styles.key,
                guessedLetters[key] === 'correct' ? styles.correctKey : '',
                guessedLetters[key] === 'present' ? styles.presentKey : '',
                guessedLetters[key] === 'absent' ? styles.absentKey : ''
              ].join(' ')}
              onClick={() => onKeyPress(key)}
            >
              <span className={[styles.keyText, guessedLetters[key] ? styles.keyTextWhite : ''].join(' ')}>{key}</span>
            </button>
          ))}
          {rowIndex === 2 && (
            <button className={`${styles.key} ${styles.actionKey}`} onClick={() => onKeyPress('BACKSPACE')}>
              <span className={styles.actionKeyText}>←</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function WordlePage() {
  const navigate = useNavigate();

  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [timeLeft, setTimeLeft] = useState(180);
  const [gameDuration, setGameDuration] = useState(180);
  const [showSetupModal, setShowSetupModal] = useState(true);

  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerGuesses, setPlayerGuesses] = useState<string[]>([]);
  const [playerCurrentGuess, setPlayerCurrentGuess] = useState('');
  const [playerAttempts, setPlayerAttempts] = useState(1);
  const [playerTargetWord, setPlayerTargetWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<Record<string, LetterStatus>>({});

  const [opponentCurrentWord, setOpponentCurrentWord] = useState('');
  const [opponentAttempts, setOpponentAttempts] = useState(1);

  useEffect(() => {
    if (gamePhase === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft === 0 && gamePhase === 'playing') {
      setGamePhase('finished');
    }
  }, [timeLeft, gamePhase]);

  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const interval = setInterval(() => {
      if (Math.random() < 0.05) {
        setOpponentScore((prev) => prev + 1);
        setOpponentCurrentWord(getRandomWordForGame());
        setOpponentAttempts(Math.floor(Math.random() * 4) + 1);
        setTimeout(() => {
          setOpponentCurrentWord('');
          setOpponentAttempts(1);
        }, 2000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gamePhase]);

  const handleStart = (duration: number) => {
    setGameDuration(duration);
    setTimeLeft(duration);
    setGamePhase('playing');
    setShowSetupModal(false);
    setPlayerTargetWord(getRandomWordForGame());
  };

  const handleKeyPress = (key: string) => {
    if (gamePhase !== 'playing') return;
    if (key === 'BACKSPACE') {
      setPlayerCurrentGuess((prev) => prev.slice(0, -1));
    } else if (key === 'ENTER') {
      if (playerCurrentGuess.length === 5) submitGuess();
    } else if (playerCurrentGuess.length < 5) {
      const letter = key.toUpperCase();
      if (/^[А-ЯЁ]$/.test(letter)) setPlayerCurrentGuess((prev) => prev + letter);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gamePhase !== 'playing') return;
      if (e.key === 'Backspace') return handleKeyPress('BACKSPACE');
      if (e.key === 'Enter') return handleKeyPress('ENTER');
      const letter = e.key.toUpperCase();
      if (/^[А-ЯЁ]$/.test(letter)) handleKeyPress(letter);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gamePhase, playerCurrentGuess]);

  const submitGuess = () => {
    if (playerCurrentGuess.length !== 5) return;
    const words = getDictionary('russian');
    if (!words.includes(playerCurrentGuess)) {
      return;
    }
    const newGuesses = [...playerGuesses, playerCurrentGuess];
    setPlayerGuesses(newGuesses);

    const newGuessed: Record<string, LetterStatus> = { ...guessedLetters };
    for (let i = 0; i < playerCurrentGuess.length; i++) {
      const letter = playerCurrentGuess[i];
      if (playerTargetWord[i] === letter) newGuessed[letter] = 'correct';
      else if (playerTargetWord.includes(letter) && newGuessed[letter] !== 'correct') newGuessed[letter] = 'present';
      else if (!playerTargetWord.includes(letter)) newGuessed[letter] = 'absent';
    }
    setGuessedLetters(newGuessed);

    if (playerCurrentGuess === playerTargetWord) {
      setPlayerScore((prev) => prev + 1);
      setPlayerCurrentGuess('');
      setPlayerGuesses([]);
      setPlayerAttempts(1);
      setPlayerTargetWord(getRandomWordForGame());
      setGuessedLetters({});
    } else if (newGuesses.length >= 6) {
      setPlayerCurrentGuess('');
      setPlayerGuesses([]);
      setPlayerAttempts(1);
      setPlayerTargetWord(getRandomWordForGame());
      setGuessedLetters({});
    } else {
      setPlayerCurrentGuess('');
      setPlayerAttempts((prev) => prev + 1);
    }
  };

  const isWinner = useMemo(() => playerScore > opponentScore, [playerScore, opponentScore]);
  const coinReward = isWinner ? 75 : 25;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} color="#4A3F3D" strokeWidth={2} />
        </button>
        <div className={styles.headerCenter}>
          <div className={styles.headerTitle}>Wordle PvP</div>
          <div className={styles.headerSubtitle}>Соревнование на время</div>
        </div>
        <div className={styles.timerContainer}>
          <Clock size={16} color={timeLeft <= 30 ? '#D35D5D' : '#D97A6C'} strokeWidth={2} />
          <div className={`${styles.timerText} ${timeLeft <= 30 ? styles.timerTextUrgent : ''}`}>{formatTime(timeLeft)}</div>
        </div>
      </div>

      <div className={styles.playersContainer}>
        <PlayerStats
          name="Вы"
          score={playerScore}
          currentWord={''}
          attempts={playerAttempts}
          isYou
          isLeading={playerScore >= opponentScore}
          timeLeft={timeLeft}
        />
        <PlayerStats
          name="Соперник"
          score={opponentScore}
          currentWord={opponentCurrentWord}
          attempts={opponentAttempts}
          isLeading={opponentScore > playerScore}
          timeLeft={timeLeft}
        />
      </div>

      <div className={styles.gameArea}>
        <WordGrid guesses={playerGuesses} currentGuess={playerCurrentGuess} targetWord={playerTargetWord} />
      </div>

      <Keyboard onKeyPress={handleKeyPress} guessedLetters={guessedLetters} />

      {showSetupModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalGradient}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>Настройка игры</div>
                <button className={styles.modalCloseButton} onClick={() => navigate(-1)}>
                  <X size={24} color="#8C7F7D" strokeWidth={2} />
                </button>
              </div>
              <div className={styles.modalSubtitle}>Выберите продолжительность матча</div>
              <div className={styles.durationOptions}>
                {[{ value: 60, label: '1 минута', subtitle: 'Быстрая игра' }, { value: 180, label: '3 минуты', subtitle: 'Стандартная игра' }, { value: 300, label: '5 минут', subtitle: 'Длинная игра' }, { value: 600, label: '10 минут', subtitle: 'Марафон' }].map((d) => (
                  <button
                    key={d.value}
                    className={`${styles.durationOption} ${gameDuration === d.value ? styles.selectedDurationOption : ''}`}
                    onClick={() => setGameDuration(d.value)}
                  >
                    <div className={styles.durationOptionContent}>
                      <div className={`${styles.durationRadio} ${gameDuration === d.value ? styles.selectedDurationRadio : ''}`}>
                        {gameDuration === d.value && <div className={styles.durationRadioDot} />}
                      </div>
                      <div className={styles.durationInfo}>
                        <div className={`${styles.durationLabel} ${gameDuration === d.value ? styles.selectedDurationLabel : ''}`}>{d.label}</div>
                        <div className={styles.durationSubtitle}>{d.subtitle}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelButton} onClick={() => navigate(-1)}>Отмена</button>
                <button className={styles.startButton} onClick={() => handleStart(gameDuration)}>
                  <div className={styles.startButtonGradient}>
                    <Play size={16} color="#FFFFFF" strokeWidth={2} />
                    <span className={styles.startButtonText}>Начать игру</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {gamePhase === 'finished' && (
        <div className={styles.resultContainer}>
          <div className={styles.resultCard}>
            <div
              className={styles.resultGradient}
              style={{
                background: isWinner
                  ? 'linear-gradient(180deg, #D97A6C 0%, #E89F93 100%)'
                  : 'linear-gradient(180deg, #8C7F7D 0%, #B8A8A4 100%)'
              }}
            >
              <Trophy size={56} color="#FFFFFF" strokeWidth={2} />
              <div className={styles.resultTitle}>{isWinner ? '🎉 Победа!' : '😔 Поражение'}</div>
              <div className={styles.resultScore}>{playerScore} : {opponentScore}</div>
              <div className={styles.resultStats}>
                <div className={styles.resultStat}>
                  <Target size={16} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                  <div className={styles.resultStatText}>{playerScore} слов отгадано</div>
                </div>
                <div className={styles.resultStat}>
                  <Zap size={16} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                  <div className={styles.resultStatText}>+{coinReward} монет</div>
                </div>
              </div>
              <div className={styles.resultText}>
                {isWinner ? 'Отличная игра! Ваш словарный запас впечатляет.' : 'Хорошая попытка! Тренируйтесь и станете лучше.'}
              </div>
              <div className={styles.resultActions}>
                <button
                  className={styles.playAgainButton}
                  onClick={() => {
                    setGamePhase('setup');
                    setShowSetupModal(true);
                    setPlayerScore(0);
                    setOpponentScore(0);
                    setPlayerCurrentGuess('');
                    setPlayerGuesses([]);
                    setPlayerAttempts(1);
                    setGuessedLetters({});
                    setTimeLeft(180);
                    setGameDuration(180);
                  }}
                >
                  <span className={styles.playAgainText}>Играть еще</span>
                </button>
                <button className={styles.backToLobbyButton} onClick={() => navigate('/games')}>
                  <span className={styles.backToLobbyText}>В лобби</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



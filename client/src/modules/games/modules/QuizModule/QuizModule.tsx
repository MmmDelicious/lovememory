import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { QuizQuestion, QuizProgress, QuizResults } from '../../../../components/games';
import { useGameSocket } from '../../hooks/useGameSocket';
import styles from './QuizModule.module.css';

interface QuizModuleProps {
  gameId: string;
  userId: string;
  onGameEnd?: (result: any) => void;
  onReturnToLobby?: () => void;
  className?: string;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
}

interface Player {
  id: string;
  name: string;
  score: number;
  answers: { questionId: string; answer: number; time: number; correct: boolean }[];
}

/**
 * Модуль квиз-игры - самостоятельный модуль со своей бизнес-логикой
 * Отвечает за: логику квиза, вопросы, таймер, подсчет очков
 * Использует компоненты из слоя Components для отображения
 */
export const QuizModule: React.FC<QuizModuleProps> = ({
  gameId,
  userId,
  onGameEnd,
  onReturnToLobby,
  className
}) => {
  // Состояние модуля
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [players, setPlayers] = useState<Player[]>([]);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Игровой сокет
  const { gameState, makeMove, sendMessage, isConnected, error } = useGameSocket({
    gameId,
    userId,
    gameType: 'quiz'
  });

  // Обновление состояния из gameState
  useEffect(() => {
    if (gameState) {
      setQuestions(gameState.questions || []);
      setCurrentQuestionIndex(gameState.currentQuestionIndex || 0);
      setTimeLeft(gameState.timeLeft || 30);
      setGameStatus(gameState.status || 'waiting');
      setPlayers(gameState.players || []);
      setShowResults(gameState.showResults || false);
      
      // Сброс выбранного ответа при смене вопроса
      if (gameState.currentQuestionIndex !== currentQuestionIndex) {
        setSelectedAnswer(null);
        setQuestionStartTime(Date.now());
      }
    }
  }, [gameState, currentQuestionIndex]);

  // Таймер вопроса
  useEffect(() => {
    if (gameStatus === 'playing' && timeLeft > 0 && !selectedAnswer) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Время истекло, автоматически отправляем пустой ответ
            handleAnswerSubmit(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameStatus, timeLeft, selectedAnswer]);

  // Обработка выбора ответа
  const handleAnswerSelect = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null || gameStatus !== 'playing') return;
    
    setSelectedAnswer(answerIndex);
    
    // Небольшая задержка для показа выбранного ответа
    setTimeout(() => {
      handleAnswerSubmit(answerIndex);
    }, 1000);
  }, [selectedAnswer, gameStatus]);

  // Отправка ответа
  const handleAnswerSubmit = useCallback((answerIndex: number | null) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const timeSpent = Date.now() - questionStartTime;
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    // Подсчет очков (больше очков за быстрый и правильный ответ)
    let points = 0;
    if (isCorrect) {
      const timeBonus = Math.max(0, (currentQuestion.timeLimit - timeSpent / 1000) / currentQuestion.timeLimit);
      const difficultyMultiplier = currentQuestion.difficulty === 'easy' ? 1 : 
                                   currentQuestion.difficulty === 'medium' ? 1.5 : 2;
      points = Math.round((100 + timeBonus * 50) * difficultyMultiplier);
    }

    const answerData = {
      questionId: currentQuestion.id,
      questionIndex: currentQuestionIndex,
      answer: answerIndex,
      timeSpent,
      points,
      correct: isCorrect
    };

    makeMove(answerData);
    
    // Обновляем локальное состояние
    setUserAnswers(prev => [...prev, answerData]);
    
  }, [questions, currentQuestionIndex, questionStartTime, makeMove]);

  // Следующий вопрос
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setTimeLeft(questions[currentQuestionIndex + 1]?.timeLimit || 30);
      setQuestionStartTime(Date.now());
    } else {
      // Игра завершена
      setGameStatus('finished');
      setShowResults(true);
      
      if (onGameEnd) {
        const userPlayer = players.find(p => p.id === userId);
        onGameEnd({
          score: userPlayer?.score || 0,
          totalQuestions: questions.length,
          correctAnswers: userAnswers.filter(a => a.correct).length,
          players
        });
      }
    }
  }, [currentQuestionIndex, questions, players, userId, userAnswers, onGameEnd]);

  // Новая игра
  const handleNewGame = useCallback(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setTimeLeft(30);
    setGameStatus('waiting');
    setUserAnswers([]);
    setShowResults(false);
    
    sendMessage({ type: 'new_game' });
  }, [sendMessage]);

  // Возврат в лобби
  const handleReturnToLobby = useCallback(() => {
    if (onReturnToLobby) {
      onReturnToLobby();
    }
  }, [onReturnToLobby]);

  // Мемоизированные данные
  const currentQuestion = useMemo(() => 
    questions[currentQuestionIndex], [questions, currentQuestionIndex]);

  const userPlayer = useMemo(() => 
    players.find(p => p.id === userId), [players, userId]);

  const progress = useMemo(() => ({
    current: currentQuestionIndex + 1,
    total: questions.length,
    percentage: questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0
  }), [currentQuestionIndex, questions.length]);

  const sortedPlayers = useMemo(() => 
    [...players].sort((a, b) => b.score - a.score), [players]);

  // Условные состояния после всех хуков
  if (error) {
    return (
      <div className={`${styles.error} ${className || ''}`}>
        <h3>Ошибка подключения</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Попробовать снова</button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={`${styles.loading} ${className || ''}`}>
        <h3>Подключение к игре...</h3>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className={`${styles.quizModule} ${className || ''}`}>
        <div className={styles.quizPlaceholder}>
          <h2>Результаты квиза</h2>
          <p>Результаты: {userPlayer?.score || 0} очков</p>
          <button onClick={handleNewGame}>Новая игра</button>
          <button onClick={handleReturnToLobby}>В лобби</button>
        </div>
      </div>
    );
  }

  if (gameStatus === 'waiting') {
    return (
      <div className={`${styles.quizModule} ${className || ''}`}>
        <div className={styles.waiting}>
          <h2>Подготовка к квизу...</h2>
          <p>Ожидание других игроков</p>
          <div className={styles.playersList}>
            {players.map(player => (
              <div key={player.id} className={styles.playerCard}>
                {player.name} {player.id === userId && '(Вы)'}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className={`${styles.quizModule} ${className || ''}`}>
        <div className={styles.loading}>
          <h3>Загрузка вопросов...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.quizModule} ${className || ''}`}>
      {/* Заглушка для квиза */}
      <div className={styles.quizPlaceholder}>
        <h2>Квиз-игра</h2>
        <p>Модуль квиза в разработке. Здесь будет реализована игра в викторину.</p>
        <div className={styles.gameInfo}>
          <p>Вопрос: {progress.current} из {progress.total}</p>
          <p>Игроки: {players.length}</p>
          <p>Времени осталось: {timeLeft}с</p>
        </div>
        <button onClick={handleReturnToLobby} className={styles.returnButton}>
          Вернуться в лобби
        </button>
      </div>
    </div>
  );
};

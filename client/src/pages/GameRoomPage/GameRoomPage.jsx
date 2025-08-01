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
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [quizTimer, setQuizTimer] = useState(15);

  useEffect(() => {
    if (gameState?.gameType === 'quiz' && gameState?.currentQuestion) {
      const isNewQuestion = selectedAnswer !== null || isAnswerSubmitted;
      if (gameState.currentQuestion.questionNumber !== gameState.lastQuestionNumber) {
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
        setQuizTimer(15); // Сбрасываем таймер для нового вопроса
      }
    }
  }, [gameState?.currentQuestion?.questionNumber]);

  // Клиентский таймер для квиза
  useEffect(() => {
    if (gameState?.gameType === 'quiz' && gameState?.status === 'in_progress' && !isAnswerSubmitted) {
      const timer = setInterval(() => {
        setQuizTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState?.gameType, gameState?.status, isAnswerSubmitted]);

  // Очищаем возможные ходы при смене хода в шахматах
  useEffect(() => {
    if (gameState?.gameType === 'chess' && gameState?.currentPlayerId !== user.id) {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [gameState?.currentPlayerId, gameState?.gameType, user.id]);

  const handleReturnToLobby = () => {
    const gameType = gameState?.gameType || '';
    navigate(`/games/${gameType}`);
  };

  const handleQuizMove = (move) => {
    if (isAnswerSubmitted || quizTimer <= 0) return;
    setSelectedAnswer(move);
    setIsAnswerSubmitted(true);
    makeMove(move);
  };

  const handleChessSquareClick = (square) => {
    if (gameState.status !== 'in_progress' || gameState.currentPlayerId !== user.id) return;
    
    // Проверяем, что это наша фигура
    const piece = gameState.board[square];
    if (!piece) {
      // Если клетка пустая и у нас выбран квадрат, пытаемся сделать ход
      if (selectedSquare) {
        console.log(`[CLIENT] Making move from ${selectedSquare} to ${square}`);
        handleChessMove(selectedSquare, square);
      }
      return;
    }
    
    // Определяем цвет фигуры
    const isPlayerWhite = gameState.players[0] === user.id;
    const isWhitePiece = piece === piece.toUpperCase(); // Заглавные = белые, строчные = черные
    
    console.log(`[CLIENT] Clicked square ${square}, piece: ${piece}, isPlayerWhite: ${isPlayerWhite}, isWhitePiece: ${isWhitePiece}`);
    
    // Проверяем, что это наша фигура
    if ((isPlayerWhite && !isWhitePiece) || (!isPlayerWhite && isWhitePiece)) {
      // Это фигура соперника, нельзя выбирать
      console.log(`[CLIENT] Cannot select opponent's piece`);
      return;
    }
    
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }
    
    // Выбираем квадрат
    console.log(`[CLIENT] Selecting square ${square}`);
    setSelectedSquare(square);
    // Временно убираем запрос возможных ходов
    // fetchValidMoves(square);
  };

  const handleChessMove = (from, to) => {
    if (gameState.status !== 'in_progress' || gameState.currentPlayerId !== user.id) return;
    
    // Временно убираем проверку возможных ходов
    // if (!validMoves.includes(to)) {
    //   console.log('Invalid move:', from, 'to', to);
    //   return;
    // }
    
    const move = {
      from: from,
      to: to
    };
    
    // Добавляем повышение только если пешка дошла до последней линии
    const isPawnMove = gameState.board[from]?.toLowerCase() === 'p';
    const isPromotionRank = to[1] === '8' || to[1] === '1';
    
    if (isPawnMove && isPromotionRank) {
      move.promotion = 'q'; // Автоматическое повышение до ферзя
    }
    
    makeMove(move);
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const fetchValidMoves = async (square) => {
    try {
      // Проверяем, что это наша фигура
      const piece = gameState.board[square];
      if (!piece) return;
      
      const isPlayerWhite = gameState.players[0] === user.id;
      const isWhitePiece = piece === piece.toUpperCase(); // Заглавные = белые, строчные = черные
      
      // Проверяем, что это наша фигура
      if ((isPlayerWhite && !isWhitePiece) || (!isPlayerWhite && isWhitePiece)) {
        return;
      }
      
      const response = await fetch(`/api/games/valid-moves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId: roomId,
          square: square
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setValidMoves(data.validMoves || []);
      }
    } catch (error) {
      console.error('Error fetching valid moves:', error);
    }
  };

  const renderStatusMessage = () => {
    if (!gameState || !user) return "Подключение к игре...";
    if (gameState.status === 'finished') return "Игра окончена";
    if (gameState.status !== 'in_progress') return "Ожидание второго игрока...";

    if (gameState.gameType === 'quiz') {
      if (isAnswerSubmitted) return "Ответ принят! Ожидание...";
      if (quizTimer <= 0) return "Время вышло!";
      return "Выберите ответ";
    }

    if (gameState.gameType === 'chess') {
      return gameState.currentPlayerId === user.id ? "Ваш ход" : "Ход соперника";
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
    const { question, options, questionNumber, totalQuestions } = gameState.currentQuestion;

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
          <div className={styles.timer}>{quizTimer}с</div>
          <h2 className={styles.questionText}>{question}</h2>
        </div>
        <div className={styles.optionsGrid}>
          {options.map((option, index) => (
            <button key={index}
              className={`${styles.optionButton} ${selectedAnswer === index ? styles.selected : ''}`}
              onClick={() => handleQuizMove(index)}
              disabled={isAnswerSubmitted || quizTimer <= 0}>
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderChessBoard = () => {
    if (!gameState.board) return <div className={styles.boardPlaceholder}>Загрузка шахматной доски...</div>;
    
    // Отладочная информация
    console.log('[CLIENT] Chess game state:', {
      players: gameState.players,
      currentPlayerId: gameState.currentPlayerId,
      user: user.id,
      isPlayerWhite: gameState.players[0] === user.id,
      turn: gameState.turn
    });
    
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    // Определяем, нужно ли перевернуть доску
    const isPlayerWhite = gameState.players[0] === user.id;
    const shouldFlipBoard = !isPlayerWhite; // Если игрок черные, переворачиваем доску
    
    const getSquareClass = (file, rank) => {
      const square = `${file}${rank}`;
      const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 0;
      let className = `${styles.chessSquare} ${isLight ? styles.light : styles.dark}`;
      
      if (selectedSquare === square) {
        className += ` ${styles.selected}`;
      }
      
      // Временно убираем отображение возможных ходов
      // if (gameState.currentPlayerId === user.id && validMoves.includes(square)) {
      //   const piece = gameState.board[square];
      //   if (piece) {
      //     className += ` ${styles.capture}`;
      //   } else {
      //     className += ` ${styles.validMove}`;
      //   }
      // }
      
      if (gameState.status !== 'in_progress' || gameState.currentPlayerId !== user.id) {
        className += ` ${styles.disabled}`;
      }
      
      return className;
    };
    
    const getPieceSymbol = (piece) => {
      const symbols = {
        'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
        'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
      };
      return symbols[piece] || '';
    };
    
    // Создаем массив квадратов в правильном порядке
    const squares = [];
    for (let rankIndex = 0; rankIndex < ranks.length; rankIndex++) {
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const rank = ranks[rankIndex];
        const file = files[fileIndex];
        const square = `${file}${rank}`;
        const piece = gameState.board[square];
        squares.push({ square, piece, rank, file });
      }
    }
    
    // Если нужно перевернуть доску, меняем порядок
    if (shouldFlipBoard) {
      squares.reverse();
    }
    
    return (
      <div className={styles.chessContainer}>
        <div className={styles.chessInfo}>
          <div className={`${styles.chessPlayer} ${gameState.currentPlayerId === gameState.players[0] ? styles.active : ''}`}>
            <div className={`${styles.chessPlayerColor} ${styles.white}`}></div>
            <span className={styles.chessPlayerName}>
              {gameState.players[0] === user.id ? 'Вы (Белые)' : 'Соперник (Белые)'}
            </span>
          </div>
          <div className={`${styles.chessPlayer} ${gameState.currentPlayerId === gameState.players[1] ? styles.active : ''}`}>
            <div className={`${styles.chessPlayerColor} ${styles.black}`}></div>
            <span className={styles.chessPlayerName}>
              {gameState.players[1] === user.id ? 'Вы (Черные)' : 'Соперник (Черные)'}
            </span>
          </div>
        </div>
        
        <div className={styles.chessBoard}>
          {squares.map(({ square, piece, rank, file }) => (
            <div
              key={square}
              className={getSquareClass(file, rank)}
              onClick={() => handleChessSquareClick(square)}
            >
              {piece && getPieceSymbol(piece)}
            </div>
          ))}
        </div>
        
        {gameState.moveHistory && gameState.moveHistory.length > 0 && (
          <div className={styles.chessMoveHistory}>
            <h3>История ходов</h3>
            {gameState.moveHistory.map((move, index) => (
              <div key={index} className={styles.chessMove}>
                <span className={styles.chessMoveNumber}>{Math.floor(index / 2) + 1}.</span>
                <span className={styles.chessMoveText}>
                  {move}
                </span>
              </div>
            ))}
          </div>
        )}
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
      case 'chess':
        return renderChessBoard();
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
import React, { useState, useEffect } from 'react';
import {
  FaChessPawn, FaChessRook, FaChessKnight, FaChessBishop, FaChessQueen, FaChessKing
} from 'react-icons/fa';
import styles from './ChessGame.module.css';

const pieceMap = {
  'P': { component: FaChessPawn, colorClass: styles.whitePiece },
  'R': { component: FaChessRook, colorClass: styles.whitePiece },
  'N': { component: FaChessKnight, colorClass: styles.whitePiece },
  'B': { component: FaChessBishop, colorClass: styles.whitePiece },
  'Q': { component: FaChessQueen, colorClass: styles.whitePiece },
  'K': { component: FaChessKing, colorClass: styles.whitePiece },
  'p': { component: FaChessPawn, colorClass: styles.blackPiece },
  'r': { component: FaChessRook, colorClass: styles.blackPiece },
  'n': { component: FaChessKnight, colorClass: styles.blackPiece },
  'b': { component: FaChessBishop, colorClass: styles.blackPiece },
  'q': { component: FaChessQueen, colorClass: styles.blackPiece },
  'k': { component: FaChessKing, colorClass: styles.blackPiece },
};

const ChessPiece = ({ piece }) => {
  const PieceInfo = pieceMap[piece];
  if (!PieceInfo) return null;
  const { component: PieceComponent, colorClass } = PieceInfo;
  return <PieceComponent className={`${styles.piece} ${colorClass}`} />;
};

const formatTime = (timeInSeconds) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const ChessGame = ({ gameState, user, makeMove, token, roomId }) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [whiteTime, setWhiteTime] = useState(180);
  const [blackTime, setBlackTime] = useState(180);

  useEffect(() => {
    if (gameState) {
      setWhiteTime(gameState.whiteTime);
      setBlackTime(gameState.blackTime);
    }
  }, [gameState?.whiteTime, gameState?.blackTime]);

  useEffect(() => {
    if (gameState?.status !== 'in_progress') return;

    const timer = setInterval(() => {
      if (gameState.currentPlayerId === gameState.players[0]) {
        setWhiteTime(t => Math.max(0, t - 1));
      } else {
        setBlackTime(t => Math.max(0, t - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState?.status, gameState?.currentPlayerId, gameState?.players]);


  useEffect(() => {
    if (gameState?.currentPlayerId !== user.id) {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [gameState?.currentPlayerId, user.id]);

  const handleChessMove = (from, to) => {
    const move = { from, to };
    const piece = gameState.board[from];
    const isPawnMove = piece.toUpperCase() === 'P';
    const promotionRank = piece === 'P' ? '8' : '1';

    if (isPawnMove && to[1] === promotionRank) {
      move.promotion = 'q';
    }

    makeMove(move);
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const fetchValidMoves = async (square) => {
    try {
      const response = await fetch(`/api/games/valid-moves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId, square })
      });
      if (response.ok) {
        const data = await response.json();
        setValidMoves(data.validMoves || []);
      } else {
        setValidMoves([]);
      }
    } catch (error) {
      console.error('Error fetching valid moves:', error);
      setValidMoves([]);
    }
  };

  const handleChessSquareClick = (square) => {
    if (gameState.status !== 'in_progress' || gameState.currentPlayerId !== user.id) {
      return;
    }

    if (selectedSquare && validMoves.includes(square)) {
      handleChessMove(selectedSquare, square);
      return;
    }

    const pieceOnSquare = gameState.board[square];
    if (!pieceOnSquare) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    const isPlayerWhite = gameState.players[0] === user.id;
    const isPieceWhite = pieceOnSquare === pieceOnSquare.toUpperCase();

    if (isPlayerWhite === isPieceWhite) {
      if (square === selectedSquare) {
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        setSelectedSquare(square);
        fetchValidMoves(square);
      }
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  if (!gameState.board) return <div className={styles.boardPlaceholder}>Загрузка шахматной доски...</div>;

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const isPlayerWhite = gameState.players[0] === user.id;
  const shouldFlipBoard = !isPlayerWhite;

  const getSquareClass = (file, rank) => {
    const square = `${file}${rank}`;
    const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 !== 0;
    let className = `${styles.chessSquare} ${isLight ? styles.light : styles.dark}`;

    if (selectedSquare === square) className += ` ${styles.selected}`;
    
    if (validMoves.includes(square)) {
      const pieceOnTarget = gameState.board[square];
      className += ` ${pieceOnTarget ? styles.capture : styles.validMove}`;
    }

    return className;
  };

  const boardRanks = shouldFlipBoard ? [...ranks].reverse() : ranks;
  const boardFiles = shouldFlipBoard ? [...files].reverse() : files;

  return (
    <div className={styles.chessGameContainer}>
        <div className={styles.boardWrapper}>
            <div className={styles.chessBoard}>
                {boardRanks.map(rank => 
                    boardFiles.map(file => {
                        const square = `${file}${rank}`;
                        const piece = gameState.board[square];
                        return (
                            <div
                                key={square}
                                className={getSquareClass(file, rank)}
                                onClick={() => handleChessSquareClick(square)}
                            >
                                {piece && <ChessPiece piece={piece} />}
                            </div>
                        );
                    })
                )}
            </div>
        </div>

        <div className={styles.gameInfoPanel}>
            <div className={styles.playersInfo}>
                <div className={`${styles.playerCard} ${gameState.currentPlayerId === gameState.players[0] ? styles.active : ''}`}>
                    <span className={styles.playerName}>{gameState.players[0] === user.id ? 'Вы (Белые)' : 'Соперник (Белые)'}</span>
                    <span className={styles.timer}>{formatTime(whiteTime)}</span>
                </div>
                <div className={`${styles.playerCard} ${gameState.currentPlayerId === gameState.players[1] ? styles.active : ''}`}>
                    <span className={styles.playerName}>{gameState.players[1] === user.id ? 'Вы (Черные)' : 'Соперник (Черные)'}</span>
                    <span className={styles.timer}>{formatTime(blackTime)}</span>
                </div>
            </div>

            {gameState.moveHistory && gameState.moveHistory.length > 0 && (
                <div className={styles.moveHistory}>
                    <div className={styles.moveList}>
                        {gameState.moveHistory.map((move, index) => (
                            <div key={index} className={styles.moveEntry}>
                                {index % 2 === 0 && <span className={styles.moveNumber}>{Math.floor(index / 2) + 1}.</span>}
                                <span className={styles.moveText}>{move}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default ChessGame;
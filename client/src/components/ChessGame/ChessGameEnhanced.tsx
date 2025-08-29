import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FaChessPawn, FaChessRook, FaChessKnight, FaChessBishop, FaChessQueen, FaChessKing,
  FaClock, FaFlag, FaHandshake, FaUndo, FaPause, FaPlay, FaTrophy, FaUser
} from 'react-icons/fa';
import type { ChessGameState, GameComponentProps } from '../../../types/game.types';
import styles from './ChessGame.module.css';
interface PieceInfo {
  component: React.ComponentType<{ className: string }>;
  colorClass: string;
}
const pieceMap: Record<string, PieceInfo> = {
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
interface ChessPieceProps {
  piece: string;
  isSelected?: boolean;
  isAnimating?: boolean;
}
const ChessPiece: React.FC<ChessPieceProps> = ({ piece, isSelected, isAnimating }) => {
  const PieceInfo = pieceMap[piece];
  if (!PieceInfo) return null;
  const { component: PieceComponent, colorClass } = PieceInfo;
  const pieceClasses = [
    styles.piece,
    colorClass,
    isSelected && styles.selectedPiece,
    isAnimating && styles.animatingPiece
  ].filter(Boolean).join(' ');
  return <PieceComponent className={pieceClasses} />;
};
interface PlayerInfoProps {
  name: string;
  rating: number;
  timeLeft: number;
  isActive: boolean;
  isTop?: boolean;
  capturedPieces: string[];
  isCurrentUser: boolean;
}
const PlayerInfo: React.FC<PlayerInfoProps> = ({ 
  name, 
  rating, 
  timeLeft, 
  isActive, 
  isTop = false, 
  capturedPieces,
  isCurrentUser 
}) => {
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  const isLowTime = timeLeft < 60;
  return (
    <div className={`${styles.playerInfo} ${isTop ? styles.playerInfoTop : ''} ${isActive ? styles.active : ''}`}>
      <div className={styles.playerHeader}>
        <div className={styles.playerDetails}>
          <div className={styles.playerAvatar}>
            <FaUser />
          </div>
          <div className={styles.playerText}>
            <div className={styles.playerName}>
              {isCurrentUser ? `Вы (${name})` : name}
            </div>
            <div className={styles.ratingContainer}>
              <FaTrophy className={styles.ratingIcon} />
              <span className={styles.playerRating}>{rating}</span>
            </div>
          </div>
        </div>
        <div className={`${styles.timeContainer} ${isLowTime ? styles.lowTime : ''}`}>
          <FaClock className={styles.timeIcon} />
          <span className={styles.timeText}>{formatTime(timeLeft)}</span>
        </div>
      </div>
      {capturedPieces.length > 0 && (
        <div className={styles.capturedPieces}>
          <span className={styles.capturedLabel}>Взято:</span>
          <div className={styles.capturedList}>
            {capturedPieces.slice(0, 8).map((piece, index) => (
              <ChessPiece key={index} piece={piece} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}
const ActionButton: React.FC<ActionButtonProps> = ({ 
  icon, 
  label, 
  onClick, 
  variant = 'default', 
  disabled = false 
}) => {
  return (
    <button 
      className={`${styles.actionButton} ${variant === 'danger' ? styles.dangerButton : ''} ${disabled ? styles.disabled : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className={styles.actionIcon}>
        {icon}
      </div>
      <span className={styles.actionText}>{label}</span>
    </button>
  );
};
interface ChessGameEnhancedProps extends Omit<GameComponentProps, 'gameState'> {
  gameState: ChessGameState;
}
const ChessGame: React.FC<ChessGameEnhancedProps> = ({ 
  gameState, 
  user, 
  makeMove, 
  token, 
  roomId 
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  
  const [whiteTimeLocal, setWhiteTimeLocal] = useState<number>(gameState.whiteTime || 300);
  const [blackTimeLocal, setBlackTimeLocal] = useState<number>(gameState.blackTime || 300);
  const [showDrawModal, setShowDrawModal] = useState<boolean>(false);
  const [showResignModal, setShowResignModal] = useState<boolean>(false);
  const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);
  const [animatingPiece, setAnimatingPiece] = useState<string | null>(null);
  const [showPromotionModal, setShowPromotionModal] = useState<boolean>(false);
  const [promotionMove, setPromotionMove] = useState<{from: string, to: string} | null>(null);
  const isPlayerWhite = useMemo(() => {
    // В шахматах первый игрок в массиве всегда играет белыми
    // Правильная типизация: players может быть Player[] или string[]
    if (!gameState.players || gameState.players.length === 0) return false;
    
    const firstPlayer = gameState.players[0] as any;
    const firstPlayerId = typeof firstPlayer === 'string' ? firstPlayer : firstPlayer?.id;
    const result = firstPlayerId === user.id;
    
    return result;
  }, [gameState.players, user.id]);
  
  const playerColor = isPlayerWhite ? 'белые' : 'черные';
  const opponentColor = isPlayerWhite ? 'черные' : 'белые';
  const capturedPieces = useMemo(() => {
    return gameState.capturedPieces || { white: [], black: [] };
  }, [gameState.capturedPieces]);
  
  const isPaused = gameState.isPaused || false;
  const getInitialBoard = () => {
    return {
      'a8': 'r', 'b8': 'n', 'c8': 'b', 'd8': 'q', 'e8': 'k', 'f8': 'b', 'g8': 'n', 'h8': 'r',
      'a7': 'p', 'b7': 'p', 'c7': 'p', 'd7': 'p', 'e7': 'p', 'f7': 'p', 'g7': 'p', 'h7': 'p',
      'a2': 'P', 'b2': 'P', 'c2': 'P', 'd2': 'P', 'e2': 'P', 'f2': 'P', 'g2': 'P', 'h2': 'P',
      'a1': 'R', 'b1': 'N', 'c1': 'B', 'd1': 'Q', 'e1': 'K', 'f1': 'B', 'g1': 'N', 'h1': 'R'
    };
  };
  const board = gameState.board || getInitialBoard();
  const isWaiting = gameState.status === 'waiting';
  useEffect(() => {
    if (gameState) {
      setWhiteTimeLocal(gameState.whiteTime || 300);
      setBlackTimeLocal(gameState.blackTime || 300);
    }
  }, [gameState?.whiteTime, gameState?.blackTime]);
  useEffect(() => {
    if (gameState?.status !== 'in_progress' || isPaused) return;
    const timer = setInterval(() => {
      if (gameState.currentPlayerId === gameState.players[0]) {
        setWhiteTimeLocal(t => Math.max(0, t - 1));
      } else {
        setBlackTimeLocal(t => Math.max(0, t - 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState?.status, gameState?.currentPlayerId, gameState?.players, isPaused]);
  useEffect(() => {
    if (gameState?.currentPlayerId !== user.id) {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [gameState?.currentPlayerId, user.id]);
  useEffect(() => {
    if (gameState?.drawOffer && gameState.drawOffer !== user.id) {
      setShowDrawModal(true);
    }
  }, [gameState?.drawOffer, user.id]);
  const handleChessMove = useCallback((from: string, to: string) => {
    const piece = gameState.board[from];
    const isPawnMove = piece?.toUpperCase() === 'P';
    const promotionRank = piece === 'P' ? '8' : '1';
    

    if (isPawnMove && to[1] === promotionRank) {
      setPromotionMove({ from, to });
      setShowPromotionModal(true);
      return;
    }
    
    // Обычный ход
    const move = { from, to };
    setLastMove({ from, to });
    setAnimatingPiece(to);
    setTimeout(() => setAnimatingPiece(null), 300);
    makeMove(move);
    setSelectedSquare(null);
    setValidMoves([]);
  }, [gameState.board, makeMove]);
  
  const handlePromotion = useCallback((promotionPiece: 'q' | 'r' | 'b' | 'n') => {
    if (!promotionMove) return;
    
    const move = { ...promotionMove, promotion: promotionPiece };
    setLastMove(promotionMove);
    setAnimatingPiece(promotionMove.to);
    setTimeout(() => setAnimatingPiece(null), 300);
    makeMove(move);
    setSelectedSquare(null);
    setValidMoves([]);
    setShowPromotionModal(false);
    setPromotionMove(null);
  }, [promotionMove, makeMove]);
  const fetchValidMoves = useCallback(async (square: string) => {
    if (isWaiting || gameState.status !== 'in_progress') {
      setValidMoves([]);
      return;
    }
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
  }, [token, roomId, isWaiting, gameState.status]);
  const handleChessSquareClick = useCallback((square: string) => {
    if (gameState.status !== 'in_progress' || gameState.currentPlayerId !== user.id || isPaused) {
      return;
    }
    if (selectedSquare && validMoves.includes(square)) {
      handleChessMove(selectedSquare, square);
      return;
    }
    const pieceOnSquare = board[square];
    if (!pieceOnSquare) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }
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
  }, [gameState, user.id, isPaused, selectedSquare, validMoves, handleChessMove, isPlayerWhite, fetchValidMoves, isWaiting, board]);
  const handlePause = useCallback(() => {
    makeMove({ action: 'pause' });
  }, [makeMove]);
  const handleOfferDraw = useCallback(() => {
    makeMove({ action: 'offer_draw' });
  }, [makeMove]);
  const handleResign = useCallback(() => {
    if (window.confirm('Вы уверены, что хотите сдаться? Это действие нельзя отменить.')) {
      makeMove({ action: 'resign' });
    }
  }, [makeMove]);
  const handleAcceptDraw = useCallback(() => {
    makeMove({ action: 'accept_draw' });
    setShowDrawModal(false);
  }, [makeMove]);
  const handleDeclineDraw = useCallback(() => {
    makeMove({ action: 'decline_draw' });
    setShowDrawModal(false);
  }, [makeMove]);
  const handleUndo = useCallback(() => {
    makeMove({ action: 'request_undo' });
  }, [makeMove]);
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  // Правильная ориентация доски:
  // - Белый игрок: белые фигуры снизу (1-я линия снизу) - НЕ флипать
  // - Черный игрок: черные фигуры снизу (8-я линия снизу) - ФЛИПАТЬ
  const shouldFlipBoard = !isPlayerWhite;
  const boardRanks = shouldFlipBoard ? [...ranks].reverse() : ranks;
  const boardFiles = shouldFlipBoard ? [...files].reverse() : files;
  const getSquareClass = (file: string, rank: string): string => {
    const square = `${file}${rank}`;
    const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 !== 0;
    let className = `${styles.chessSquare} ${isLight ? styles.light : styles.dark}`;
    if (selectedSquare === square) className += ` ${styles.selected}`;
    if (lastMove && (lastMove.from === square || lastMove.to === square)) {
      className += ` ${styles.lastMove}`;
    }
    if (validMoves.includes(square) && !isWaiting) {
      const pieceOnTarget = gameState.board[square];
      className += ` ${pieceOnTarget ? styles.capture : styles.validMove}`;
    }
    return className;
  };
  const getPlayerName = (playerId: string, color: string): string => {
    return playerId === user.id ? `Вы (${color})` : `Соперник (${color})`;
  };
  const currentGameStatus = gameState.gameStatus || 
    (gameState.isCheckmate ? 'checkmate' : 
     gameState.isCheck ? 'check' : 
     gameState.isDraw || gameState.isStalemate ? 'draw' : 
     gameState.status === 'finished' ? 'checkmate' : 'playing');
  return (
    <div className={`${styles.chessGameContainer} ${isWaiting ? styles.waiting : ''}`}>
      {}
      <div className={styles.gameHeader}>
        <div className={styles.headerCenter}>
          <h2 className={styles.headerTitle}>Шахматы</h2>
          <p className={styles.headerSubtitle}>Ход {Math.floor((gameState.moveHistorySan?.length || gameState.moveHistory?.length || 0) / 2) + 1}</p>
        </div>
        <button className={styles.pauseButton} onClick={handlePause}>
          {isPaused ? <FaPlay /> : <FaPause />}
        </button>
      </div>
      {}
      <PlayerInfo
        name={getPlayerName(gameState.players[isPlayerWhite ? 1 : 0], opponentColor)}
        rating={1420}
        timeLeft={isPlayerWhite ? blackTimeLocal : whiteTimeLocal}
        isActive={gameState.currentPlayerId === gameState.players[isPlayerWhite ? 1 : 0] && !isPaused}
        isTop={true}
        capturedPieces={isPlayerWhite ? capturedPieces.white : capturedPieces.black}
        isCurrentUser={false}
      />
      <div className={styles.boardWrapper}>
        <div className={styles.chessBoard}>
          {boardRanks.map(rank => 
            boardFiles.map(file => {
              const square = `${file}${rank}`;
                                  const piece = board[square];
              return (
                <div
                  key={square}
                  className={getSquareClass(file, rank)}
                  onClick={() => handleChessSquareClick(square)}
                >
                  {piece && (
                    <ChessPiece 
                      piece={piece} 
                      isSelected={selectedSquare === square}
                      isAnimating={animatingPiece === square}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
        {}
        <div className={styles.coordinates}>
          <div className={styles.files}>
            {boardFiles.map((file, index) => (
              <span key={file} className={styles.coordinateText}>{file}</span>
            ))}
          </div>
          <div className={styles.ranks}>
            {boardRanks.map((rank, index) => (
              <span key={rank} className={styles.coordinateText}>{rank}</span>
            ))}
          </div>
        </div>
      </div>
      {}
      <PlayerInfo
        name={getPlayerName(gameState.players[isPlayerWhite ? 0 : 1], playerColor)}
        rating={1380}
        timeLeft={isPlayerWhite ? whiteTimeLocal : blackTimeLocal}
        isActive={gameState.currentPlayerId === gameState.players[isPlayerWhite ? 0 : 1] && !isPaused}
        capturedPieces={isPlayerWhite ? capturedPieces.black : capturedPieces.white}
        isCurrentUser={true}
      />
      {}
      <div className={styles.controls}>
        <ActionButton
          icon={<FaHandshake />}
          label="Ничья"
          onClick={handleOfferDraw}
          disabled={gameState.status !== 'in_progress' || isPaused}
        />
        <ActionButton
          icon={<FaUndo />}
          label="Отменить"
          onClick={handleUndo}
          disabled={!(gameState.moveHistorySan?.length || gameState.moveHistory?.length) || gameState.status !== 'in_progress'}
        />
        <ActionButton
          icon={<FaFlag />}
          label="Сдаться"
          onClick={handleResign}
          variant="danger"
          disabled={gameState.status !== 'in_progress'}
        />
      </div>
      {}
              {(gameState.moveHistorySan || gameState.moveHistory) && (gameState.moveHistorySan?.length || gameState.moveHistory?.length || 0) > 0 && (
        <div className={styles.moveHistory}>
          <h4 className={styles.moveHistoryTitle}>История ходов</h4>
          <div className={styles.moveList}>
            {(gameState.moveHistorySan || gameState.moveHistory || []).map((move, index) => (
              <div key={index} className={styles.moveEntry}>
                {index % 2 === 0 && (
                  <span className={styles.moveNumber}>{Math.floor(index / 2) + 1}.</span>
                )}
                <span className={styles.moveText}>{move}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {}
      {showDrawModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Предложение ничьей</h3>
            <p>Соперник предлагает ничью. Принять?</p>
            <div className={styles.modalButtons}>
              <button className={styles.modalButtonSecondary} onClick={handleDeclineDraw}>
                Отклонить
              </button>
              <button className={styles.modalButtonPrimary} onClick={handleAcceptDraw}>
                Принять
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модаль выбора фигуры при promotion */}
      {showPromotionModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Выберите фигуру для превращения</h3>
            <div className={styles.promotionOptions}>
              <button 
                className={styles.promotionButton} 
                onClick={() => handlePromotion('q')}
                title="Ферзь"
              >
                <FaChessQueen className={`${styles.piece} ${isPlayerWhite ? styles.whitePiece : styles.blackPiece}`} />
                <span>Ферзь</span>
              </button>
              <button 
                className={styles.promotionButton} 
                onClick={() => handlePromotion('r')}
                title="Ладья"
              >
                <FaChessRook className={`${styles.piece} ${isPlayerWhite ? styles.whitePiece : styles.blackPiece}`} />
                <span>Ладья</span>
              </button>
              <button 
                className={styles.promotionButton} 
                onClick={() => handlePromotion('b')}
                title="Слон"
              >
                <FaChessBishop className={`${styles.piece} ${isPlayerWhite ? styles.whitePiece : styles.blackPiece}`} />
                <span>Слон</span>
              </button>
              <button 
                className={styles.promotionButton} 
                onClick={() => handlePromotion('n')}
                title="Конь"
              >
                <FaChessKnight className={`${styles.piece} ${isPlayerWhite ? styles.whitePiece : styles.blackPiece}`} />
                <span>Конь</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {}
      {(currentGameStatus !== 'playing' || isPaused) && (
        <div className={styles.statusOverlay}>
          <div className={styles.statusContainer}>
            {isPaused ? (
              <>
                <FaPause className={styles.statusIcon} />
                <h3 className={styles.statusTitle}>Пауза</h3>
                <p className={styles.statusText}>Игра приостановлена</p>
                <button className={styles.resumeButton} onClick={handlePause}>
                  Продолжить
                </button>
              </>
            ) : (
              <>
                <FaTrophy className={styles.statusIcon} />
                <h3 className={styles.statusTitle}>
                  {currentGameStatus === 'checkmate' ? 'Мат!' : 
                   currentGameStatus === 'check' ? 'Шах!' : 
                   currentGameStatus === 'draw' ? 'Ничья!' : 'Игра окончена'}
                </h3>
                <p className={styles.statusText}>
                  {gameState.status === 'finished' && gameState.winner !== 'draw' && (
                    `Победил: ${getPlayerName(gameState.winner!, gameState.winner === gameState.players[0] ? 'Белые' : 'Черные')}`
                  )}
                  {gameState.winner === 'draw' && 'Партия завершена вничью'}
                  {currentGameStatus === 'check' && 'Король под угрозой'}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default ChessGame;


import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import styles from './ChessBoard.module.css';

function ChessBoard({ initialFen, onMove, playerColor, isMyTurn, isGameOver }) {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState('');
  const [moveOptions, setMoveOptions] = useState({});

  useEffect(() => {
    try {
      const gameInstance = new Chess(initialFen);
      setGame(gameInstance);
    } catch (error) {
      console.error("Failed to load FEN:", initialFen, error);
      setGame(new Chess());
    }
    setSelectedSquare('');
    setMoveOptions({});
  }, [initialFen]);

  function onSquareClick(square) {
    if (isGameOver || !isMyTurn) {
      return;
    }

    if (selectedSquare) {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({ from: selectedSquare, to: square, promotion: 'q' });
      
      if (move) {
        setGame(gameCopy);
        onMove({ from: selectedSquare, to: square });
      } else {
        const pieceOnTarget = game.get(square);
        if (pieceOnTarget && pieceOnTarget.color === playerColor) {
          selectPiece(square);
          return;
        }
      }
      setSelectedSquare('');
      setMoveOptions({});
    } else {
      selectPiece(square);
    }
  }

  function selectPiece(square) {
    const piece = game.get(square);
    if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      const possibleMoves = game.moves({ square, verbose: true });
      const options = {};
      possibleMoves.forEach(move => {
        options[move.to] = { background: 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)', borderRadius: '50%' };
      });
      setMoveOptions(options);
    }
  }

  const squareStyles = {
    ...moveOptions,
    ...(selectedSquare && { [selectedSquare]: { background: 'rgba(255, 255, 0, 0.4)' } })
  };

  return (
    <div className={styles.boardContainer}>
      <Chessboard
        position={game.fen()}
        onSquareClick={onSquareClick}
        boardOrientation={playerColor === 'w' ? 'white' : 'black'}
        isDraggablePiece={({ piece }) => piece.color === playerColor && isMyTurn && !isGameOver}
        customSquareStyles={squareStyles}
        lightSquareStyle={{ backgroundColor: 'var(--color-background, #FFFBF8)' }}
        darkSquareStyle={{ backgroundColor: 'var(--color-secondary, #C3ACD0)' }}
      />
    </div>
  );
}

export default ChessBoard;
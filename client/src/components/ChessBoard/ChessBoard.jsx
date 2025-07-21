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
      setGame(new Chess(initialFen));
    } catch (error) {
      setGame(new Chess());
    }
    setSelectedSquare('');
    setMoveOptions({});
  }, [initialFen]);

  function selectPiece(square) {
    const piece = game.get(square);
    if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      const possibleMoves = game.moves({ square, verbose: true });
      const options = {};
      possibleMoves.forEach(move => {
        options[move.to] = {
          background: 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
          borderRadius: '50%',
        };
      });
      setMoveOptions(options);
    }
  }

  function onSquareClick(square) {
    if (isGameOver || !isMyTurn) {
      return;
    }

    if (selectedSquare) {
      const gameCopy = new Chess(game.fen());
      const possibleMoves = game.moves({ square: selectedSquare, verbose: true });
      const move = possibleMoves.find(m => m.to === square);

      if (move) {
        const moveData = { from: selectedSquare, to: square };
        if (move.flags.includes('p')) {
          moveData.promotion = 'q';
        }
        const result = gameCopy.move(moveData);
        if (result) {
          setGame(gameCopy);
          onMove(moveData);
        }
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

  const squareStyles = {
    ...moveOptions,
    ...(selectedSquare && { [selectedSquare]: { background: 'rgba(255, 255, 0, 0.4)' } }),
  };

  return (
    <div className={styles.boardContainer}>
      <Chessboard
        position={game.fen()}
        onSquareClick={onSquareClick}
        boardOrientation={playerColor === 'w' ? 'white' : 'black'}
        isDraggablePiece={() => false}
        customSquareStyles={squareStyles}
        lightSquareStyle={{ backgroundColor: 'var(--color-background, #FFFBF8)' }}
        darkSquareStyle={{ backgroundColor: 'var(--color-secondary, #C3ACD0)' }}
      />
    </div>
  );
}

export default ChessBoard;
import React from 'react';
import styles from './TicTacToeBoard.module.css';

type CellValue = 'X' | 'O' | null;

interface TicTacToeBoardProps {
  board: CellValue[];
  onCellClick: (index: number) => void;
  winningLine: number[];
  disabled?: boolean;
  className?: string;
}

/**
 * Компонент доски для крестиков-ноликов
 * Только отображение и обработка кликов, без бизнес-логики
 */
export const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({
  board,
  onCellClick,
  winningLine,
  disabled = false,
  className
}) => {
  return (
    <div className={`${styles.board} ${className || ''}`}>
      {board.map((cell, index) => (
        <button
          key={index}
          className={`${styles.cell} ${
            cell ? styles.filled : ''
          } ${
            winningLine.includes(index) ? styles.winner : ''
          } ${
            disabled ? styles.disabled : ''
          }`}
          onClick={() => !disabled && onCellClick(index)}
          disabled={disabled || !!cell}
        >
          {cell && (
            <span 
              className={`${styles.symbol} ${
                cell === 'X' ? styles.symbolX : styles.symbolO
              }`}
            >
              {cell}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

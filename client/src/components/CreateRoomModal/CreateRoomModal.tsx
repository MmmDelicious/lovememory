import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './CreateRoomModal.module.css';
import {
  TicTacToeSettings,
  ChessSettings,
  QuizSettings,
  PokerSettings,
  MemorySettings,
  WordleSettings,
  CodenamesSettings
} from './GameSettings';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  gameType: string;
}

interface GameConfig {
  name: string;
  description: string;
  icon: string;
  minBet: number;
  maxBet: number;
  defaultBet: number;
}

const GAME_CONFIGS: Record<string, GameConfig> = {
  'tic-tac-toe': {
    name: 'Крестики-нолики',
    description: 'Быстрая игра на логику',
    icon: '⭕',
    minBet: 10,
    maxBet: 500,
    defaultBet: 25,
  },
  'chess': {
    name: 'Шахматы',
    description: 'Стратегическая битва умов',
    icon: '♚',
    minBet: 50,
    maxBet: 2000,
    defaultBet: 100,
  },
  'quiz': {
    name: 'Квиз',
    description: 'Проверьте свои знания',
    icon: '🧠',
    minBet: 20,
    maxBet: 1000,
    defaultBet: 50,
  },
  'poker': {
    name: 'Покер',
    description: 'Карточная игра на мастерство',
    icon: '🃏',
    minBet: 100,
    maxBet: 5000,
    defaultBet: 200,
  },
  'memory': {
    name: 'Мемори',
    description: 'Тренируйте память',
    icon: '🧩',
    minBet: 15,
    maxBet: 300,
    defaultBet: 30,
  },
  'wordle': {
    name: 'Wordle',
    description: 'Угадайте слово за 6 попыток',
    icon: '📝',
    minBet: 20,
    maxBet: 200,
    defaultBet: 50,
  },
  'codenames': {
    name: 'Codenames',
    description: 'Командная игра на ассоциации',
    icon: '🔤',
    minBet: 15,
    maxBet: 750,
    defaultBet: 40,
  },
};

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  gameType
}) => {
  const gameConfig = GAME_CONFIGS[gameType] || GAME_CONFIGS['tic-tac-toe'];
  
  const [bet, setBet] = useState(gameConfig.defaultBet);
  const [gameSettings, setGameSettings] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = {
      bet,
      ...gameSettings,
    };
    
    onSubmit(formData);
  };

  const updateGameSettings = (newSettings: any) => {
    setGameSettings(prev => ({ ...prev, ...newSettings }));
  };

  const renderGameSettings = () => {
    const commonProps = {
      onSettingsChange: updateGameSettings,
      initialSettings: gameSettings,
    };

    switch (gameType) {
      case 'tic-tac-toe':
        return <TicTacToeSettings {...commonProps} />;
      case 'chess':
        return <ChessSettings {...commonProps} />;
      case 'quiz':
        return <QuizSettings {...commonProps} />;
      case 'poker':
        return <PokerSettings {...commonProps} />;
      case 'memory':
        return <MemorySettings {...commonProps} />;
      case 'wordle':
        return <WordleSettings {...commonProps} />;
      case 'codenames':
        return <CodenamesSettings {...commonProps} />;
      default:
        return <TicTacToeSettings {...commonProps} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.gameInfo}>
            <span className={styles.gameIcon}>{gameConfig.icon}</span>
            <div>
              <h2 className={styles.title}>{gameConfig.name}</h2>
              <p className={styles.subtitle}>{gameConfig.description}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className={styles.content}>
          <div className={styles.formContent}>
            {/* Bet Section */}
            <div className={styles.section}>
            <label className={styles.label}>
              Ставка
              <span className={styles.labelHint}>
                {gameConfig.minBet} - {gameConfig.maxBet} монет
              </span>
            </label>
            <div className={styles.betContainer}>
              <span className={styles.coinIcon}>🪙</span>
              <input
                type="number"
                min={gameConfig.minBet}
                max={gameConfig.maxBet}
                step="10"
                value={bet}
                onChange={e => setBet(Number(e.target.value))}
                className={styles.betInput}
              />
            </div>
            {gameType !== 'poker' && (
              <p className={styles.betInfo}>
                Победитель получит <strong>{bet * (gameSettings.maxPlayers || 2)} монет</strong>
              </p>
            )}
          </div>

            {/* Game-specific settings */}
            <div className={styles.section}>
              {renderGameSettings()}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" className={styles.createButton}>
              <span>Создать</span>
              <span className={styles.betBadge}>{bet}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;
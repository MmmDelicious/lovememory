import React, { useState } from 'react';
import { X, Users, Coins, Trophy, Clock, Shield, Target, Crown, Brain, Sparkles, Zap } from 'lucide-react';
import { GAMES_CONFIG } from '../../config/games.config';
import styles from './CreateRoomModal.module.css';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  gameType: string;
}

interface GameSettings {
  name: string;
  icon: React.ReactNode;
  maxPlayersOptions: number[];
  defaultMaxPlayers: number;
  hasDifficulty: boolean;
  hasTimeLimit: boolean;
  hasPrivateRooms: boolean;
  minBet: number;
  maxBet: number;
  defaultBet: number;
  description: string;
  specialSettings?: {
    label: string;
    options: { value: string; label: string }[];
    default: string;
  }[];
}



// Преобразование конфигурации игры в настройки модала
const getGameSettings = (gameType: string): GameSettings => {
  const game = GAMES_CONFIG[gameType];
  if (!game) {
    // Fallback на tic-tac-toe если игра не найдена
    return getGameSettings('tic-tac-toe');
  }

  return {
    name: game.name,
    icon: <game.Icon size={20} />,
    maxPlayersOptions: gameType === 'poker' ? [2, 3, 4, 5, 6] : gameType === 'memory' ? [2, 3, 4] : [2],
    defaultMaxPlayers: gameType === 'poker' ? 4 : 2,
    hasDifficulty: ['chess', 'memory'].includes(gameType),
    hasTimeLimit: ['tic-tac-toe', 'chess', 'quiz'].includes(gameType),
    hasPrivateRooms: ['chess', 'poker'].includes(gameType),
    minBet: game.minBet || 10,
    maxBet: game.maxBet || 1000,
    defaultBet: game.defaultBet || 50,
    description: game.description || '',
    specialSettings: gameType === 'tic-tac-toe' ? [
      {
        label: 'Лимит времени на ход',
        options: [
          { value: '30', label: '30 секунд' },
          { value: '60', label: '1 минута' },
          { value: '120', label: '2 минуты' },
          { value: 'unlimited', label: 'Без лимита' }
        ],
        default: '60'
      }
    ] : gameType === 'chess' ? [
      {
        label: 'Контроль времени',
        options: [
          { value: 'blitz', label: 'Блиц (5 мин)' },
          { value: 'rapid', label: 'Рапид (15 мин)' },
          { value: 'classical', label: 'Классика (30 мин)' },
          { value: 'unlimited', label: 'Без лимита' }
        ],
        default: 'rapid'
      }
    ] : undefined
  };
};

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  gameType
}) => {
  const gameSettings = getGameSettings(gameType);
  
  const [formData, setFormData] = useState({
    bet: gameSettings.defaultBet,
    maxPlayers: gameSettings.defaultMaxPlayers,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    isPrivate: false,
    timeLimit: gameSettings.specialSettings?.[0]?.default || '',
    specialSettings: gameSettings.specialSettings?.reduce((acc, setting) => {
      acc[setting.label] = setting.default;
      return acc;
    }, {} as Record<string, string>) || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateSpecialSetting = (label: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specialSettings: {
        ...prev.specialSettings,
        [label]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.gameInfo}>
            <div className={styles.gameIcon}>
              {gameSettings.icon}
            </div>
            <div>
              <h2 className={styles.title}>Создать комнату</h2>
              <p className={styles.gameTitle}>{gameSettings.name}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.gameDescription}>
          <p>{gameSettings.description}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Ставка */}
          <div className={styles.field}>
            <label className={styles.label}>
              <Coins size={16} />
              Ставка
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                min={gameSettings.minBet}
                max={gameSettings.maxBet}
                step="10"
                value={formData.bet}
                onChange={e => updateFormData('bet', Number(e.target.value))}
                className={styles.input}
              />
              <span className={styles.inputHint}>
                {gameSettings.minBet} - {gameSettings.maxBet} монет
              </span>
            </div>
          </div>

          {/* Количество игроков */}
          <div className={styles.field}>
            <label className={styles.label}>
              <Users size={16} />
              Количество игроков
            </label>
            <div className={styles.playerOptions}>
              {gameSettings.maxPlayersOptions.map(count => (
                <button
                  key={count}
                  type="button"
                  className={`${styles.playerOption} ${formData.maxPlayers === count ? styles.active : ''}`}
                  onClick={() => updateFormData('maxPlayers', count)}
                >
                  <Users size={16} />
                  <span>{count} {count === 2 ? 'игрока' : count <= 4 ? 'игрока' : 'игроков'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Сложность (если поддерживается) */}
          {gameSettings.hasDifficulty && (
            <div className={styles.field}>
              <label className={styles.label}>
                <Trophy size={16} />
                Сложность
              </label>
              <div className={styles.difficultyOptions}>
                {[
                  { value: 'easy', label: '🟢 Легко', description: 'Для новичков' },
                  { value: 'medium', label: '🟡 Средне', description: 'Стандартная игра' },
                  { value: 'hard', label: '🔴 Сложно', description: 'Для опытных' }
                ].map(option => (
                  <label key={option.value} className={styles.difficultyLabel}>
                    <input
                      type="radio"
                      name="difficulty"
                      value={option.value}
                      checked={formData.difficulty === option.value}
                      onChange={e => updateFormData('difficulty', e.target.value)}
                      className={styles.radioInput}
                    />
                    <div className={styles.difficultyCard}>
                      <span className={styles.difficultyEmoji}>{option.label}</span>
                      <span className={styles.difficultyDescription}>{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Специальные настройки для каждой игры */}
          {gameSettings.specialSettings?.map(setting => (
            <div key={setting.label} className={styles.field}>
              <label className={styles.label}>
                <Clock size={16} />
                {setting.label}
              </label>
              <select
                value={formData.specialSettings[setting.label] || setting.default}
                onChange={e => updateSpecialSetting(setting.label, e.target.value)}
                className={styles.select}
              >
                {setting.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Приватная комната (если поддерживается) */}
          {gameSettings.hasPrivateRooms && (
            <div className={styles.field}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={e => updateFormData('isPrivate', e.target.checked)}
                  className={styles.checkbox}
                />
                <div className={styles.checkboxCustom}>
                  <Shield size={14} />
                </div>
                <div className={styles.checkboxText}>
                  <span>Приватная комната</span>
                  <span className={styles.checkboxDescription}>
                    Только по приглашению
                  </span>
                </div>
              </label>
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" className={styles.submitButton}>
              <span>Создать комнату</span>
              <Coins size={16} />
              <span>{formData.bet}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import { GAMES_CONFIG } from '../../config/games.config';
import styles from './CreateRoomModal.module.css';

const CreateRoomModal = ({ isOpen, onClose, onSubmit, gameType }) => {
  const [formData, setFormData] = useState({
    bet: 10,
    maxPlayers: 2,
    tableType: 'standard',
    timeControl: '10+0',
    difficulty: 'medium',
    category: 'general',
    quizMode: '1v1'
  });
  const [error, setError] = useState('');

  const gameConfig = GAMES_CONFIG[gameType];

  useEffect(() => {
    setFormData({
      bet: getDefaultBet(gameType),
      maxPlayers: getDefaultMaxPlayers(gameType),
      tableType: 'standard',
      timeControl: '10+0',
      difficulty: 'medium',
      category: 'general',
      quizMode: '1v1'
    });
    setError('');
  }, [gameType]);

  const getDefaultBet = (type) => {
    switch (type) {
      case 'poker': return 100;
      case 'chess': return 50;
      case 'quiz': return 25;
      case 'tic-tac-toe': return 10;
      default: return 10;
    }
  };

  const getDefaultMaxPlayers = (type) => {
    switch (type) {
      case 'poker': return 5;
      case 'quiz': return 2;
      default: return 2;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    const { bet, maxPlayers } = formData;

    if (bet <= 0) {
      setError('Ставка должна быть больше нуля');
      return false;
    }

    if (gameType === 'poker') {
      const tableInfo = getTableInfo(formData.tableType);
      if (bet < tableInfo.minBuyIn || bet > tableInfo.maxBuyIn) {
        setError(`Бай-ин должен быть от ${tableInfo.minBuyIn} до ${tableInfo.maxBuyIn}`);
        return false;
      }
    }

    if (maxPlayers < 2 || maxPlayers > 10) {
      setError('Количество игроков должно быть от 2 до 10');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const payload = {
      bet: formData.bet,
      maxPlayers: formData.maxPlayers,
      gameType
    };

    switch (gameType) {
      case 'poker':
        payload.tableType = formData.tableType;
        break;
      case 'chess':
        payload.timeControl = formData.timeControl;
        break;
      case 'quiz':
        payload.difficulty = formData.difficulty;
        payload.category = formData.category;
        payload.quizMode = formData.quizMode;
        break;
      case 'tic-tac-toe':
        break;
    }

    setError('');
    onSubmit(payload);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getTableInfo = (tableType) => {
    switch (tableType) {
      case 'standard':
        return { blinds: '5/10', minBuyIn: 100, maxBuyIn: 500, name: 'Стандартный' };
      case 'premium':
        return { blinds: '25/50', minBuyIn: 250, maxBuyIn: 1000, name: 'Премиум' };
      case 'elite':
        return { blinds: '100/200', minBuyIn: 1000, maxBuyIn: 2000, name: 'Элитный' };
      default:
        return { blinds: '5/10', minBuyIn: 100, maxBuyIn: 500, name: 'Стандартный' };
    }
  };

  const renderGameSpecificOptions = () => {
    switch (gameType) {
      case 'poker':
        return renderPokerOptions();
      case 'chess':
        return renderChessOptions();
      case 'quiz':
        return renderQuizOptions();
      case 'tic-tac-toe':
        return renderTicTacToeOptions();
      default:
        return renderDefaultOptions();
    }
  };

  const renderPokerOptions = () => {
    const tableInfo = getTableInfo(formData.tableType);
    
    return (
      <>
        <div className={styles.optionsSection}>
          <h3 className={styles.sectionTitle}>Тип стола</h3>
          
          <div className={styles.optionsGrid}>
            {[
              { type: 'standard', icon: '🃏', recommended: false },
              { type: 'premium', icon: '👑', recommended: true },
              { type: 'elite', icon: '💎', recommended: false }
            ].map(({ type, icon, recommended }) => {
              const info = getTableInfo(type);
              const isSelected = formData.tableType === type;
              
              return (
                <div
                  key={type}
                  className={`${styles.optionCard} ${isSelected ? styles.selected : ''}`}
                  onClick={() => {
                    handleInputChange('tableType', type);
                    handleInputChange('bet', info.minBuyIn);
                  }}
                >
                  <div className={styles.optionHeader}>
                    <div className={styles.optionIcon}>{icon}</div>
                    <div className={styles.optionTitle}>
                      {info.name}
                      {recommended && <span className={styles.recommendedTag}>Рекомендуется</span>}
                    </div>
                  </div>
                  <div className={styles.optionDescription}>
                    {info.blinds} | {info.minBuyIn}-{info.maxBuyIn} 🪙
                  </div>
                  <div className={styles.optionControl}>
                    <div className={`${styles.radioButton} ${isSelected ? styles.radioSelected : ''}`}>
                      {isSelected && <div className={styles.radioDot} />}
                    </div>
                    <button 
                      className={`${styles.selectButton} ${isSelected ? styles.selectButtonActive : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInputChange('tableType', type);
                        handleInputChange('bet', info.minBuyIn);
                      }}
                    >
                      {isSelected ? 'Выбрано' : 'Выбрать'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.optionsSection}>
          <h3 className={styles.sectionTitle}>Игроков</h3>
          <div className={styles.optionsGrid}>
            {[2, 3, 4, 5, 6, 7, 8].map(num => (
              <div
                key={num}
                className={`${styles.optionCard} ${formData.maxPlayers === num ? styles.selected : ''}`}
                onClick={() => handleInputChange('maxPlayers', num)}
              >
                <div className={styles.optionHeader}>
                  <div className={styles.optionIcon}>👥</div>
                  <div className={styles.optionTitle}>{num} игроков</div>
                </div>
                <div className={styles.optionControl}>
                  <div className={`${styles.radioButton} ${formData.maxPlayers === num ? styles.radioSelected : ''}`}>
                    {formData.maxPlayers === num && <div className={styles.radioDot} />}
                  </div>
                  <button 
                    className={`${styles.selectButton} ${formData.maxPlayers === num ? styles.selectButtonActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInputChange('maxPlayers', num);
                    }}
                  >
                    {formData.maxPlayers === num ? 'Выбрано' : 'Выбрать'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderChessOptions = () => {
    return (
      <div className={styles.optionsSection}>
        <h3 className={styles.sectionTitle}>Время</h3>
        
        <div className={styles.optionsGrid}>
          {[
            { value: '1+0', label: '1 мин', icon: '⚡' },
            { value: '3+0', label: '3 мин', icon: '⏱️' },
            { value: '5+0', label: '5 мин', icon: '⏰' },
            { value: '10+0', label: '10 мин', icon: '🕐', recommended: true },
            { value: '15+10', label: '15+10', icon: '⏳' },
            { value: '30+0', label: '30 мин', icon: '🕙' }
          ].map(({ value, label, icon, recommended }) => (
            <div
              key={value}
              className={`${styles.optionCard} ${formData.timeControl === value ? styles.selected : ''}`}
              onClick={() => handleInputChange('timeControl', value)}
            >
              <div className={styles.optionHeader}>
                <div className={styles.optionIcon}>{icon}</div>
                <div className={styles.optionTitle}>
                  {label}
                  {recommended && <span className={styles.recommendedTag}>Популярно</span>}
                </div>
              </div>
              <div className={styles.optionControl}>
                <div className={`${styles.radioButton} ${formData.timeControl === value ? styles.radioSelected : ''}`}>
                  {formData.timeControl === value && <div className={styles.radioDot} />}
                </div>
                <button 
                  className={`${styles.selectButton} ${formData.timeControl === value ? styles.selectButtonActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInputChange('timeControl', value);
                  }}
                >
                  {formData.timeControl === value ? 'Выбрано' : 'Выбрать'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQuizOptions = () => {
    return (
      <>
        <div className={styles.optionsSection}>
          <h3 className={styles.sectionTitle}>Режим</h3>
          
          <div className={styles.optionsGrid}>
            {[
              { mode: '1v1', icon: '👤', name: '1 на 1', recommended: true },
              { mode: 'team', icon: '👥', name: 'Команды' }
            ].map(({ mode, icon, name, recommended }) => (
              <div
                key={mode}
                className={`${styles.optionCard} ${formData.quizMode === mode ? styles.selected : ''}`}
                onClick={() => {
                  handleInputChange('quizMode', mode);
                  handleInputChange('maxPlayers', mode === '1v1' ? 2 : 4);
                }}
              >
                <div className={styles.optionHeader}>
                  <div className={styles.optionIcon}>{icon}</div>
                  <div className={styles.optionTitle}>
                    {name}
                    {recommended && <span className={styles.recommendedTag}>Популярно</span>}
                  </div>
                </div>
                <div className={styles.optionControl}>
                  <div className={`${styles.radioButton} ${formData.quizMode === mode ? styles.radioSelected : ''}`}>
                    {formData.quizMode === mode && <div className={styles.radioDot} />}
                  </div>
                  <button 
                    className={`${styles.selectButton} ${formData.quizMode === mode ? styles.selectButtonActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInputChange('quizMode', mode);
                      handleInputChange('maxPlayers', mode === '1v1' ? 2 : 4);
                    }}
                  >
                    {formData.quizMode === mode ? 'Выбрано' : 'Выбрать'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.optionsSection}>
          <h3 className={styles.sectionTitle}>Сложность</h3>
          <div className={styles.optionsGrid}>
            {[
              { value: 'easy', icon: '😊', name: 'Легкая' },
              { value: 'medium', icon: '😐', name: 'Средняя', recommended: true },
              { value: 'hard', icon: '😤', name: 'Сложная' }
            ].map(({ value, icon, name, recommended }) => (
              <div
                key={value}
                className={`${styles.optionCard} ${formData.difficulty === value ? styles.selected : ''}`}
                onClick={() => handleInputChange('difficulty', value)}
              >
                <div className={styles.optionHeader}>
                  <div className={styles.optionIcon}>{icon}</div>
                  <div className={styles.optionTitle}>
                    {name}
                    {recommended && <span className={styles.recommendedTag}>Популярно</span>}
                  </div>
                </div>
                <div className={styles.optionControl}>
                  <div className={`${styles.radioButton} ${formData.difficulty === value ? styles.radioSelected : ''}`}>
                    {formData.difficulty === value && <div className={styles.radioDot} />}
                  </div>
                  <button 
                    className={`${styles.selectButton} ${formData.difficulty === value ? styles.selectButtonActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInputChange('difficulty', value);
                    }}
                  >
                    {formData.difficulty === value ? 'Выбрано' : 'Выбрать'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderTicTacToeOptions = () => {
    return (
      <div className={styles.optionsSection}>
        <h3 className={styles.sectionTitle}>Настройки</h3>
        
        <div className={styles.optionsGrid}>
          <div className={`${styles.optionCard} ${styles.selected}`}>
            <div className={styles.optionHeader}>
              <div className={styles.optionIcon}>⭕</div>
              <div className={styles.optionTitle}>Классическая игра</div>
            </div>
            <div className={styles.optionControl}>
              <div className={`${styles.radioButton} ${styles.radioSelected}`}>
                <div className={styles.radioDot} />
              </div>
              <button className={`${styles.selectButton} ${styles.selectButtonActive}`}>
                Выбрано
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDefaultOptions = () => {
    return (
      <div className={styles.optionsSection}>
        <h3 className={styles.sectionTitle}>Настройки</h3>
        
        <div className={styles.optionsGrid}>
          <div className={`${styles.optionCard} ${styles.selected}`}>
            <div className={styles.optionHeader}>
              <div className={styles.optionIcon}>🎮</div>
              <div className={styles.optionTitle}>Стандартные настройки</div>
            </div>
            <div className={styles.optionControl}>
              <div className={`${styles.radioButton} ${styles.radioSelected}`}>
                <div className={styles.radioDot} />
              </div>
              <button className={`${styles.selectButton} ${styles.selectButtonActive}`}>
                Выбрано
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Создать игру: ${gameConfig?.name || gameType}`}>
      <div className={styles.content}>
        <div className={styles.gameInfo}>
          <div className={styles.gameIcon}>
            {gameConfig?.icon && gameConfig.icon}
          </div>
          <div className={styles.gameDetails}>
            <h3 className={styles.gameName}>{gameConfig?.name}</h3>
            <p className={styles.gameCategory}>{gameConfig?.category}</p>
          </div>
        </div>

        {renderGameSpecificOptions()}
        
        {error && <p className={styles.errorText}>{error}</p>}
        
        <div className={styles.actions}>
          <Button onClick={onClose} variant="secondary">
            Отмена
          </Button>
          <Button onClick={handleSubmit} variant="primary">
            Создать и закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};

CreateRoomModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  gameType: PropTypes.string.isRequired,
};

export default CreateRoomModal;
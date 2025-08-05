import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import styles from './CreateRoomModal.module.css';

const CreateRoomModal = ({ isOpen, onClose, onSubmit, gameType }) => {
  const [bet, setBet] = useState(10);
  const [error, setError] = useState('');
  const [selectedTable, setSelectedTable] = useState('standard');

  const handleSubmit = () => {
    if (bet <= 0) {
      setError('Ставка должна быть больше нуля.');
      return;
    }
    
    const payload = {
      bet,
      maxPlayers: gameType === 'love-vegas' ? 5 : 2
    };

    if (gameType === 'love-vegas') {
      const tableInfo = getTableInfo(selectedTable);
      if (bet < tableInfo.minBuyIn || bet > tableInfo.maxBuyIn) {
        setError(`Для этого стола бай-ин должен быть между ${tableInfo.minBuyIn} и ${tableInfo.maxBuyIn}.`);
        return;
      }
      payload.tableType = selectedTable;
    }
    
    setError('');
    onSubmit(payload);
  };

  const getTableInfo = (tableType) => {
    switch (tableType) {
      case 'standard':
        return { blinds: '5/10', minBuyIn: 100, maxBuyIn: 500, name: 'Стандартный стол' };
      case 'premium':
        return { blinds: '25/50', minBuyIn: 250, maxBuyIn: 1000, name: 'Премиум стол' };
      case 'elite':
        return { blinds: '100/200', minBuyIn: 1000, maxBuyIn: 2000, name: 'Элитный стол' };
      default:
        return { blinds: '5/10', minBuyIn: 100, maxBuyIn: 500, name: 'Стандартный стол' };
    }
  };

  const renderGameSpecificFields = () => {
    if (gameType === 'love-vegas') {
      const tableInfo = getTableInfo(selectedTable);
      
      return (
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Тип стола:</label>
          <div className={styles.tableSelector}>
            {['standard', 'premium', 'elite'].map((type) => {
              const info = getTableInfo(type);
              return (
                <div
                  key={type}
                  className={`${styles.tableOption} ${selectedTable === type ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedTable(type);
                    setBet(info.minBuyIn);
                  }}
                >
                  <div className={styles.tableName}>{info.name}</div>
                  <div className={styles.tableBlinds}>Блайнды: {info.blinds}</div>
                  <div className={styles.tableBuyIn}>
                    Бай-ин: {info.minBuyIn}-{info.maxBuyIn} 🪙
                  </div>
                </div>
              );
            })}
          </div>

          <label htmlFor="bet-input" className={styles.label}>
            Ваш бай-ин ({tableInfo.minBuyIn}-{tableInfo.maxBuyIn} монет):
          </label>
          <div className={styles.inputWrapper}>
            <span className={styles.currencyIcon}>🪙</span>
            <input
              id="bet-input"
              type="number"
              value={bet}
              onChange={(e) => setBet(parseInt(e.target.value, 10) || 0)}
              className={styles.input}
              min={tableInfo.minBuyIn}
              max={tableInfo.maxBuyIn}
              placeholder={`От ${tableInfo.minBuyIn} до ${tableInfo.maxBuyIn}`}
            />
            <span className={styles.chipsConversion}>= {bet * 10} фишек</span>
          </div>
          {error && <p className={styles.errorText}>{error}</p>}
        </div>
      );
    }
    
    return (
      <div className={styles.fieldGroup}>
        <label htmlFor="bet-input" className={styles.label}>
          Ваша ставка:
        </label>
        <div className={styles.inputWrapper}>
          <span className={styles.currencyIcon}>🪙</span>
          <input
            id="bet-input"
            type="number"
            value={bet}
            onChange={(e) => setBet(parseInt(e.target.value, 10) || 0)}
            className={styles.input}
            min="1"
            placeholder="Например, 10"
          />
        </div>
        {error && <p className={styles.errorText}>{error}</p>}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Создать комнату: ${gameType}`}>
      <div className={styles.content}>
        {renderGameSpecificFields()}
        <div className={styles.actions}>
          <Button onClick={onClose} variant="secondary">
            Отмена
          </Button>
          <Button onClick={handleSubmit} variant="primary">
            Создать
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
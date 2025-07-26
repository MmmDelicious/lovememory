import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import styles from './CreateRoomModal.module.css';

const CreateRoomModal = ({ isOpen, onClose, onSubmit, gameType }) => {
  const [bet, setBet] = useState(10);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (bet <= 0) {
      setError('Ставка должна быть больше нуля.');
      return;
    }
    setError('');
    onSubmit({ bet });
  };

  const renderGameSpecificFields = () => {
    // В будущем здесь можно будет добавлять другие поля для других игр.
    // Например, для шахмат можно добавить выбор цвета фигур или контроль времени.
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
            onChange={(e) => setBet(parseInt(e.target.value, 10))}
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
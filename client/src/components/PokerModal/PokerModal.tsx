import React, { useState } from 'react';
import { X, Coins, DollarSign, RefreshCw } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import styles from './PokerModal.module.css';
interface PokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  maxAmount: number;
  mode: 'buyin' | 'rebuy';
  roomName?: string;
  currentStack?: number;
}
const PokerModal: React.FC<PokerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  maxAmount,
  mode,
  roomName,
  currentStack = 0
}) => {
  const { coins } = useCurrency();
  const [amount, setAmount] = useState(Math.min(maxAmount, coins, 200));
  const actualMax = Math.min(maxAmount, coins);
  const minAmount = Math.min(50, actualMax);
  const handleConfirm = () => {
    if (amount >= minAmount && amount <= actualMax) {
      onConfirm(amount);
      if (mode === 'rebuy') {
        onClose();
      }
    }
  };
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(Number(e.target.value));
  };
  const setPresetAmount = (percentage: number) => {
    const calculatedAmount = Math.floor(actualMax * percentage);
    setAmount(Math.max(minAmount, calculatedAmount));
  };
  if (!isOpen) return null;
  const canAfford = coins >= minAmount;
  const isValidAmount = amount >= minAmount && amount <= actualMax;
  const isBuyIn = mode === 'buyin';
  const isRebuy = mode === 'rebuy';
  const config = {
    buyin: {
      icon: <DollarSign size={24} />,
      title: 'Покерный стол',
      subtitle: roomName ? `Вход в ${roomName}` : 'Выберите сумму для игры',
      sectionLabel: 'Сумма для игры',
      confirmText: 'Войти в игру',
      errorMessage: 'Для игры в покер необходимо минимум'
    },
    rebuy: {
      icon: <RefreshCw size={24} />,
      title: 'Rebuy',
      subtitle: 'Докупить фишки к стеку',
      sectionLabel: 'Сумма rebuy',
      confirmText: 'Rebuy',
      errorMessage: 'Для rebuy необходимо минимум'
    }
  };
  const currentConfig = config[mode];
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <div className={styles.icon}>
              {currentConfig.icon}
            </div>
            <div>
              <h2 className={styles.title}>{currentConfig.title}</h2>
              <p className={styles.subtitle}>{currentConfig.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.content}>
          {!canAfford ? (
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>⚠️</div>
              <h3>Недостаточно средств</h3>
              <p>
                {currentConfig.errorMessage} {minAmount} монет.<br />
                У вас на счету: {coins} монет.
              </p>
            </div>
          ) : (
            <>
              {}
              {isBuyIn && (
                <div className={styles.balanceInfo}>
                  <div className={styles.balanceItem}>
                    <Coins size={16} />
                    <span>Ваш баланс: {coins} монет</span>
                  </div>
                  <div className={styles.balanceItem}>
                    <span>Лимит стола: {maxAmount} монет</span>
                  </div>
                </div>
              )}
              {isRebuy && (
                <div className={styles.statusInfo}>
                  <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>Текущий стек:</span>
                    <span className={styles.statusValue}>{currentStack} фишек</span>
                  </div>
                  <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>Ваш баланс:</span>
                    <span className={styles.statusValue}>
                      <Coins size={16} />
                      {coins} монет
                    </span>
                  </div>
                  <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>Лимит rebuy:</span>
                    <span className={styles.statusValue}>{maxAmount} монет</span>
                  </div>
                </div>
              )}
              {}
              <div className={styles.amountSection}>
                <label className={styles.label}>
                  {currentConfig.sectionLabel}
                </label>
                <div className={styles.amountDisplay}>
                  <div className={styles.amountValue}>
                    {amount} монет
                  </div>
                  <div className={styles.amountRange}>
                    {minAmount} - {actualMax} монет
                  </div>
                </div>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    min={minAmount}
                    max={actualMax}
                    step="10"
                    value={amount}
                    onChange={handleSliderChange}
                    className={styles.slider}
                  />
                  <div className={styles.sliderLabels}>
                    <span>{minAmount}</span>
                    <span>{actualMax}</span>
                  </div>
                </div>
                <div className={styles.presetButtons}>
                  <button 
                    type="button" 
                    onClick={() => setPresetAmount(0.25)}
                    className={styles.presetButton}
                  >
                    25%
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPresetAmount(0.5)}
                    className={styles.presetButton}
                  >
                    50%
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPresetAmount(0.75)}
                    className={styles.presetButton}
                  >
                    75%
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPresetAmount(1)}
                    className={styles.presetButton}
                  >
                    Макс
                  </button>
                </div>
              </div>
              {}
              {isBuyIn && (
                <div className={styles.infoBox}>
                  <div className={styles.infoIcon}>ℹ️</div>
                  <div className={styles.infoText}>
                    <strong>Как это работает:</strong>
                    <ul>
                      <li>Выбранная сумма будет списана с вашего счета</li>
                      <li>Вы играете только на эти деньги</li>
                      <li>При выходе оставшиеся деньги вернутся на счет</li>
                      <li>Можно сделать rebuy если деньги закончатся</li>
                    </ul>
                  </div>
                </div>
              )}
              {isRebuy && (
                <div className={styles.resultPreview}>
                  <div className={styles.previewLabel}>После rebuy:</div>
                  <div className={styles.previewValue}>
                    Стек: {currentStack + amount} фишек
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className={styles.actions}>
          <button 
            type="button" 
            onClick={onClose} 
            className={styles.cancelButton}
          >
            Отмена
          </button>
          <button 
            type="button"
            onClick={handleConfirm}
            disabled={!canAfford || !isValidAmount}
            className={styles.confirmButton}
          >
            {currentConfig.icon}
            <span>{currentConfig.confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default PokerModal;


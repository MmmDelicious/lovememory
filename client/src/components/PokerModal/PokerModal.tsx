import React, { useState } from 'react';
import { X, Coins, DollarSign, RefreshCw } from 'lucide-react';
import styles from './PokerModal.module.css';
interface PokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  maxAmount: number;
  mode: 'buyin' | 'rebuy';
  roomName?: string;
  currentStack?: number;
  // КРИТИЧНО: Настраиваемые значения вместо hardcode
  defaultAmount?: number;
  minAmount?: number;
  sliderStep?: number;
  maxAmountFallback?: number;
}
const PokerModal: React.FC<PokerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  maxAmount,
  mode,
  roomName,
  currentStack = 0,
  // КРИТИЧНО: Настраиваемые значения
  defaultAmount = 200,
  minAmount: propMinAmount = 50,
  sliderStep = 10,
  maxAmountFallback = 1000
}) => {
  const coins = 1000; // Default coins value
  const [amount, setAmount] = useState(Math.min(maxAmount, coins, defaultAmount));
  const actualMax = Math.min(maxAmount, coins);
  const minAmount = Math.min(propMinAmount, actualMax);
  const handleConfirm = () => {
    if (amount >= minAmount && amount <= actualMax) {
      onConfirm(amount);
      // КРИТИЧНО: Консистентное поведение - закрываем для любого режима
      onClose();
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
                    <span>Ваш баланс: {coins || 0} монет</span>
                  </div>
                  <div className={styles.balanceItem}>
                    <span>Лимит стола: {maxAmount || maxAmountFallback} монет</span>
                  </div>
                </div>
              )}
              {isRebuy && (
                <div className={styles.statusInfo}>
                  <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>Текущий стек:</span>
                    <span className={styles.statusValue}>{currentStack || 0} фишек</span>
                  </div>
                  <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>Ваш баланс:</span>
                    <span className={styles.statusValue}>
                      <Coins size={16} />
                      {coins || 0} монет
                    </span>
                  </div>
                  <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>Лимит rebuy:</span>
                    <span className={styles.statusValue}>{maxAmount || maxAmountFallback} монет</span>
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
                
                {/* КРИТИЧНО: Добавлено input validation */}
                <div className={styles.inputContainer}>
                  <input
                    type="number"
                    min={minAmount}
                    max={actualMax}
                    step={sliderStep}
                    value={amount}
                    onChange={(e) => {
                      const value = Math.max(minAmount, Math.min(actualMax, Number(e.target.value) || minAmount));
                      setAmount(value);
                    }}
                    className={styles.numberInput}
                    aria-label="Сумма для игры"
                  />
                  <span className={styles.inputLabel}>монет</span>
                </div>
                
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    min={minAmount}
                    max={actualMax}
                    step={sliderStep.toString()}
                    value={amount}
                    onChange={handleSliderChange}
                    className={styles.slider}
                    aria-label="Слайдер суммы"
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
                    aria-label="Установить 25% от максимума"
                  >
                    25%
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPresetAmount(0.5)}
                    className={styles.presetButton}
                    aria-label="Установить 50% от максимума"
                  >
                    50%
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPresetAmount(0.75)}
                    className={styles.presetButton}
                    aria-label="Установить 75% от максимума"
                  >
                    75%
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPresetAmount(1)}
                    className={styles.presetButton}
                    aria-label="Установить максимальную сумму"
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
                    Стек: {(currentStack || 0) + amount} фишек
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


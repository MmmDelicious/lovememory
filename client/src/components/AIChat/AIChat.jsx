import React, { useState } from 'react';
import { useAIMascot, useMascotActions, useUser } from '../../store/hooks';
import styles from './AIChat.module.css';

const MAX_PROMPT_LENGTH = 500;

const AIChat = () => {
  // Получаем состояние из Redux вместо Context
  const { isLoading } = useAIMascot();
  
  // Получаем действия из Redux
  const { sendMessageToAI, setMessage } = useMascotActions();
  
  const user = useUser();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue || isLoading) {
      return;
    }
    
    if (trimmedValue.length > MAX_PROMPT_LENGTH) {
      setMessage('Сэр, это слишком длинное сообщение. Пожалуйста, будьте лаконичнее.');
      return;
    }

    const context = {
      user: {
        name: user.name,
        gender: user.gender,
        city: user.city,
        coins: user.coins,
      },
      partner: user.partner ? {
        name: user.partner.name,
        gender: user.partner.gender,
        city: user.partner.city,
      } : null
    };

    sendMessageToAI(trimmedValue, context);
    setInputValue('');
  };

  return (
    <div className={styles.chatInputContainer}>
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Спросите что-нибудь, сэр..."
          disabled={isLoading}
          maxLength={MAX_PROMPT_LENGTH + 1}
          autoFocus
        />
        <button type="submit" disabled={isLoading}>
          ➤
        </button>
      </form>
    </div>
  );
};

export default AIChat;

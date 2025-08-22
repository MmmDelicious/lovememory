import React, { useState } from 'react';
import { useAIMascot } from '../../context/AIMascotContext';
import { useAuth } from '../../context/AuthContext';
import styles from './AIChat.module.css';
const MAX_PROMPT_LENGTH = 500;
const AIChat = () => {
  const { sendMessageToAI, isAILoading, setGlobalMascotMessage } = useAIMascot();
  const { user, partner } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isAILoading) {
      return;
    }
    if (trimmedValue.length > MAX_PROMPT_LENGTH) {
      setGlobalMascotMessage(`Сэр, это слишком длинное сообщение. Пожалуйста, будьте лаконичнее.`);
      return;
    }
    const context = {
      user: {
        name: user.name,
        gender: user.gender,
        city: user.city,
        coins: user.coins,
      },
      partner: partner ? {
        name: partner.name,
        gender: partner.gender,
        city: partner.city,
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
          disabled={isAILoading}
          maxLength={MAX_PROMPT_LENGTH + 1}
          autoFocus
        />
        <button type="submit" disabled={isAILoading}>➤</button>
      </form>
    </div>
  );
};
export default AIChat;

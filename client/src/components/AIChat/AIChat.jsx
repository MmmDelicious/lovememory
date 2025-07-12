import React, { useState } from 'react';
import { useMascot } from '../../context/MascotContext';
import styles from './AIChat.module.css';

const AIChat = () => {
  const { sendMessageToAI, isAILoading } = useMascot();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isAILoading) {
      sendMessageToAI(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className={styles.chatInputContainer}>
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Спросите что-нибудь..."
          disabled={isAILoading}
          autoFocus
        />
        <button type="submit" disabled={isAILoading}>➤</button>
      </form>
    </div>
  );
};

export default AIChat;
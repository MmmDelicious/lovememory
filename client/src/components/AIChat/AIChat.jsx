import React, { useState, useRef, useEffect } from 'react';
import { useMascot } from '../../context/MascotContext';
import styles from './AIChat.module.css';

const AIChat = () => {
  const { messages, sendMessageToAI, isAILoading } = useMascot();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isAILoading) {
      sendMessageToAI(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className={styles.chatWindow}>
      <div className={styles.messageList}>
        {messages.map((msg, index) => (
          <div key={index} className={`${styles.message} ${styles[msg.sender]}`}>
            {msg.text}
          </div>
        ))}
        {isAILoading && (
          <div className={`${styles.message} ${styles.ai}`}>
            <div className={styles.typingIndicator}>
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Спросите что-нибудь..."
          disabled={isAILoading}
        />
        <button type="submit" disabled={isAILoading}>➤</button>
      </form>
    </div>
  );
};

export default AIChat;
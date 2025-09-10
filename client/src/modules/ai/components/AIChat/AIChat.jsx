import React, { useState } from 'react';
import { useAIMascot, useMascotActions, useUser } from '../../store/hooks';
import { usePairing } from '../../hooks/usePairing';
import styles from './AIChat.module.css';

const MAX_PROMPT_LENGTH = 500;

const AIChat = () => {
  const { isLoading } = useAIChat();
  
  const { sendMessageToAI, setMessage } = useMascotActions();
  
  const user = useUser();
  const { pairing } = usePairing(user);
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


    if (!user) {
      setMessage('Ошибка: данные пользователя не загружены');
      return;
    }

    const partner = pairing?.status === 'active' 
      ? (pairing?.Requester?.id === user?.id ? pairing?.Receiver : pairing?.Requester)
      : null;

    const context = {
      user: {
        name: user?.first_name || user?.display_name || user?.name || user?.email || 'Пользователь',
        full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.display_name || user?.email || 'Пользователь',
        gender: user?.gender || null,
        city: user?.city || 'Не указан',
        age: user?.age || null,
        coins: user?.coins || 0,
        email: user?.email || null
      },
      partner: partner ? {
        name: partner?.first_name || partner?.display_name || partner?.name || partner?.email || 'Партнер',
        full_name: `${partner?.first_name || ''} ${partner?.last_name || ''}`.trim() || partner?.display_name || partner?.email || 'Партнер',
        gender: partner?.gender || null,
        city: partner?.city || 'Не указан',
        age: partner?.age || null
      } : null,
      relationship: {
        status: pairing?.status || 'single',
        duration: pairing?.created_at ? Math.floor((Date.now() - new Date(pairing.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
      }
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

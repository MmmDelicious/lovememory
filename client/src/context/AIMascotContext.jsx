import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { askAI } from '../services/ai.service';
import { MASCOT_CONFIG } from '../config/mascot.config';
import globalMascotAnimation from '../assets/AI.json';

const AIMascotContext = createContext();

export const useAIMascot = () => useContext(AIMascotContext);

export const AIMascotProvider = ({ children }) => {
  const [globalMascot, setGlobalMascot] = useState({ position: { x: 80, y: 70 }, direction: 'left', message: '' });
  const [isAIVisible, setIsAIVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [interceptedMascot, setInterceptedMascot] = useState(null);

  const moveGlobalMascotToPosition = useCallback((newPosition) => {
    setGlobalMascot(prev => {
      const newDirection = newPosition.x < prev.position.x ? 'left' : 'right';
      return { ...prev, position: newPosition, direction: newDirection };
    });
  }, []);

  const setGlobalMascotMessage = useCallback((message, duration = MASCOT_CONFIG.DEFAULT_MESSAGE_DURATION) => {
    setGlobalMascot(prev => ({ ...prev, message }));
    const timer = setTimeout(() => { setGlobalMascot(prev => ({ ...prev, message: '' })); }, duration);
    return () => clearTimeout(timer);
  }, []);

  const handleMascotInterception = useCallback((config, helperAnimation) => {
    const rect = config.element.getBoundingClientRect();
    const targetX = Math.min(95, Math.max(5, (rect.left + rect.width / 2) / window.innerWidth * 100));
    const targetY = Math.min(95, Math.max(5, (rect.top + rect.height / 2) / window.innerHeight * 100));
    const targetPosition = { x: targetX, y: targetY };

    const line = MASCOT_CONFIG.INTERCEPTION_LINES[Math.floor(Math.random() * MASCOT_CONFIG.INTERCEPTION_LINES.length)];

    // Сначала двигаем AI маскота к цели
    moveGlobalMascotToPosition(targetPosition);
    
    // Показываем сообщение через небольшую задержку
    setTimeout(() => {
      setGlobalMascotMessage(line, MASCOT_CONFIG.INTERCEPTION_MESSAGE_DURATION);
      
      // Показываем анимацию перехваченного маскота
      setTimeout(() => {
        setInterceptedMascot({ position: targetPosition, animationData: helperAnimation });
        setTimeout(() => setInterceptedMascot(null), MASCOT_CONFIG.INTERCEPTION_ANIMATION_DURATION); 
      }, 500); // Небольшая задержка после сообщения
    }, 800); // Задержка перед показом сообщения
  }, [moveGlobalMascotToPosition, setGlobalMascotMessage]);

  const moveGlobalMascot = useCallback(() => {
    setGlobalMascot(prev => {
      const newPosition = { x: Math.round(10 + Math.random() * 80), y: Math.round(10 + Math.random() * 80) };
      const newDirection = newPosition.x < prev.position.x ? 'left' : 'right';
      return { ...prev, position: newPosition, direction: newDirection, message: '' };
    });
  }, []);

  useEffect(() => {
    if (isAIVisible && !isChatOpen) {
      const moveInterval = setInterval(moveGlobalMascot, MASCOT_CONFIG.IDLE_MOVE_INTERVAL);
      const talkInterval = setInterval(() => {
        const phrase = MASCOT_CONFIG.IDLE_PHRASES[Math.floor(Math.random() * MASCOT_CONFIG.IDLE_PHRASES.length)];
        setGlobalMascotMessage(phrase);
      }, MASCOT_CONFIG.IDLE_TALK_INTERVAL);
      return () => { clearInterval(moveInterval); clearInterval(talkInterval); };
    }
  }, [isAIVisible, isChatOpen, moveGlobalMascot, setGlobalMascotMessage]);

  const toggleAIMascot = useCallback(() => {
    const nextVisibility = !isAIVisible;
    setIsAIVisible(nextVisibility);
    if (!nextVisibility) setIsChatOpen(false);
  }, [isAIVisible]);

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => {
      const nextState = !prev;
      if (nextState) {
        setGlobalMascot(gm => ({ ...gm, position: MASCOT_CONFIG.AI_CHAT_POSITION, message: '' }));
      }
      return nextState;
    });
  }, []);

  const sendMessageToAI = useCallback(async (prompt, context) => {
    setIsAILoading(true);
    try {
      if (context && MASCOT_CONFIG.CONTEXT_MENU_ACTIONS[context]) {
        const responses = MASCOT_CONFIG.CONTEXT_MENU_ACTIONS[context].responses;
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setGlobalMascotMessage(randomResponse);
      } else {
        const response = await askAI(prompt, context);
        setGlobalMascotMessage(response.text);
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
      setGlobalMascotMessage("Что-то пошло не так... Попробуйте еще раз.");
    } finally {
      setIsAILoading(false);
    }
  }, [setGlobalMascotMessage]);

  const value = {
    globalMascot,
    globalMascotAnimation,
    isAIVisible,
    toggleAIMascot,
    isChatOpen,
    toggleChat,
    isAILoading,
    sendMessageToAI,
    interceptedMascot,
    handleMascotInterception,
    setGlobalMascotMessage,
  };

  return <AIMascotContext.Provider value={value}>{children}</AIMascotContext.Provider>;
};
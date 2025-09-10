import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import runnerAnimation from '../assets/running-character.json';
import flyerAnimation from '../assets/2.json';
import greetAnimation from '../assets/greet.json';
import globalMascotAnimation from '../assets/AI.json';
import { askAI } from '../services/ai.service';
import { MASCOT_CONFIG } from '../config/mascot.config.js';
import smartMascotService from '../services/smartMascot.service';
import { useUser } from '../store/hooks';
const MascotContext = createContext(undefined); // Инициализируем с undefined
export const useMascot = () => {
  const context = useContext(MascotContext);
  if (context === undefined) {
    // Эта ошибка будет выведена, если компонент, использующий хук,
    // не находится внутри MascotProvider.
    throw new Error('useMascot must be used within a MascotProvider');
  }
  return context;
};
const generateMessage = (page, data, user = null, partner = null) => {
  if (user) {
    smartMascotService.updateUserContext(user, partner);
  }
  if (page === 'pairing' && data?.requesterName) {
    const userName = user?.name || '';
    return `${userName ? userName + ', к' : 'К'}ажется, ${data.requesterName} хочет создать с вами пару! Примем приглашение? 💕`;
  }
  if (page === 'dashboard' && data?.event) {
    const eventDate = new Date(data.event.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return smartMascotService.generatePastMemoryMessage(data.event);
    } else {
      return smartMascotService.generateFutureEventMessage(data.event);
    }
  }
  return data?.message || smartMascotService.generateContextualMessage();
};
export const MascotProvider = ({ children }) => {
  const user = useUser();
  const [mascot, setMascot] = useState(null);
  const [mascotTargets, setMascotTargets] = useState([]);
  const [isLoopActive, setIsLoopActive] = useState(false);
  const hideTimerRef = useRef(null);
  const [globalMascot, setGlobalMascot] = useState({ position: { x: 80, y: 70 }, direction: 'left', message: '' });
  const [isAIVisible, setIsAIVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [interceptedMascot, setInterceptedMascot] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const hideMascot = useCallback(() => { if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; } setMascot(null); }, []);
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
    moveGlobalMascotToPosition(targetPosition);
    setGlobalMascotMessage(line, MASCOT_CONFIG.INTERCEPTION_MESSAGE_DURATION);
    setTimeout(() => {
        setInterceptedMascot({ position: targetPosition, animationData: helperAnimation });
        setTimeout(() => setInterceptedMascot(null), MASCOT_CONFIG.INTERCEPTION_ANIMATION_DURATION); 
    }, MASCOT_CONFIG.INTERCEPTION_DELAY);
  }, [moveGlobalMascotToPosition, setGlobalMascotMessage]);
  const showMascot = useCallback((config) => {
    if (isMobile || !config.element) return;

    // Добавляем проверку, что элемент все еще в DOM
    if (!config.element.isConnected) {
      console.warn('Mascot target element is no longer in the DOM. Aborting showMascot.');
      return;
    }
    
    let helperAnimation, mascotType;
    if (config.type === 'flyer') { helperAnimation = flyerAnimation; mascotType = 'flyer'; }
    else if (config.type === 'greeter') { helperAnimation = greetAnimation; mascotType = 'greeter'; }
    else { helperAnimation = runnerAnimation; mascotType = 'runner'; }
    smartMascotService.recordInteraction('mascot_shown', {
      page: config.page,
      eventData: config.data,
      messageType: config.type
    });
    if (isAIVisible && !isChatOpen) {
        handleMascotInterception(config, helperAnimation);
        return;
    }
    hideMascot();
    setTimeout(() => {
      // Дополнительная проверка на случай, если элемент исчез за 100мс таймаута
      if (!config.element.isConnected) {
        console.warn('Mascot target element disappeared during the showMascot timeout.');
        return;
      }
      const message = config.message || generateMessage(config.page, config.data, user, user?.partner);
      const elementRect = config.element.getBoundingClientRect();
      const finalConfig = { ...config, message, animationData: helperAnimation, mascotType, isTumbling: config.isTumbling ?? (mascotType === 'flyer' && Math.random() > 0.5), side: config.side ?? (elementRect.left < window.innerWidth / 2 ? 'right' : 'left'), };
      setMascot(finalConfig);
      if (config.duration) { hideTimerRef.current = setTimeout(() => { if (config.onDismiss) { config.onDismiss(); } else { hideMascot(); } }, config.duration); }
    }, 100);
  }, [isMobile, hideMascot, isAIVisible, isChatOpen, handleMascotInterception, user]);
  const registerMascotTargets = useCallback((targets) => setMascotTargets(targets), []);
  const clearMascotTargets = useCallback(() => setMascotTargets([]), []);
  const startMascotLoop = useCallback(() => setIsLoopActive(true), []);
  const stopMascotLoop = useCallback(() => setIsLoopActive(false), []);
  useEffect(() => {
    if (!isLoopActive || mascotTargets.length === 0 || isMobile) return;
    const triggerRandomMascot = () => {
        const target = mascotTargets[Math.floor(Math.random() * mascotTargets.length)];
        if (!target.containerRef.current || !target.element) return;
        const isFlyer = Math.random() > 0.5;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const eventDate = new Date(target.data.event.event_date);
        const isPast = eventDate < today;
        showMascot({ ...target, buttonText: isPast ? 'Вспомнить' : 'Посмотреть', type: isFlyer ? 'flyer' : 'runner', side: isFlyer ? 'top' : undefined, duration: MASCOT_CONFIG.BASE_DURATION + Math.random() * MASCOT_CONFIG.RANDOM_DURATION, });
    };
    const intervalId = setInterval(triggerRandomMascot, MASCOT_CONFIG.LOOP_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isLoopActive, mascotTargets, isMobile, showMascot]);
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
    mascot, showMascot, hideMascot, registerMascotTargets, clearMascotTargets, startMascotLoop, stopMascotLoop,
    interceptedMascot,
    globalMascot, globalMascotAnimation, isAIVisible, toggleAIMascot,
    isChatOpen, toggleChat, sendMessageToAI, isAILoading,
  };
  return <MascotContext.Provider value={value}>{children}</MascotContext.Provider>;
};

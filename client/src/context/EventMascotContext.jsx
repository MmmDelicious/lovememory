import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import runnerAnimation from '../assets/running-character.json';
import flyerAnimation from '../assets/2.json';
import greetAnimation from '../assets/greet.json';
import { MASCOT_CONFIG } from '../config/mascot.config.js';
import { useAIMascot } from './AIMascotContext';
import { useDevice } from '../hooks/useDevice';

const EventMascotContext = createContext();

export const useEventMascot = () => useContext(EventMascotContext);

const generateMessage = (page, data) => {
  if (page === 'pairing' && data?.requesterName) return `Кажется, ${data.requesterName} хочет создать с вами пару! Примем приглашение?`;
  if (page === 'dashboard' && data?.event) {
    const eventDate = new Date(data.event.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const eventDateStr = new Date(data.event.event_date).toLocaleDateString('ru-RU', { month: 'long', day: 'numeric' });
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return `Эх, сегодня классный день будет! Глянем планы: "${data.event.title}"`;
    if (diffDays === 1) return `Ух ты! Завтра у нас по плану "${data.event.title}". Не забыли?`;
    if (diffDays > 1) return `Через ${diffDays} дней у нас будет "${data.event.title}"! Уже в предвкушении!`;
    if (diffDays < 0) return `Помните, ${eventDateStr} был хороший денёк? "${data.event.title}". Давайте освежим воспоминания!`;
  }
  return data?.message || 'Привет! Я здесь, чтобы помочь!';
};

export const EventMascotProvider = ({ children }) => {
  const [mascot, setMascot] = useState(null);
  const [mascotTargets, setMascotTargets] = useState([]);
  const [isLoopActive, setIsLoopActive] = useState(false);
  const hideTimerRef = useRef(null);
  
  const { isMobile } = useDevice();
  const { isAIVisible, isChatOpen, handleMascotInterception } = useAIMascot();

  const hideMascot = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setMascot(null);
  }, []);

  const showMascot = useCallback((config) => {
    if (isMobile || !config.element) return;

    let helperAnimation, mascotType;
    if (config.type === 'flyer') {
      helperAnimation = flyerAnimation;
      mascotType = 'flyer';
    } else if (config.type === 'greeter') {
      helperAnimation = greetAnimation;
      mascotType = 'greeter';
    } else {
      helperAnimation = runnerAnimation;
      mascotType = 'runner';
    }
    
    if (isAIVisible && !isChatOpen) {
      handleMascotInterception(config, helperAnimation);
      return;
    }
    
    hideMascot();
    setTimeout(() => {
      const message = config.message || generateMessage(config.page, config.data);
      const elementRect = config.element.getBoundingClientRect();
      const finalConfig = {
        ...config,
        message,
        animationData: helperAnimation,
        mascotType,
        isTumbling: config.isTumbling ?? (mascotType === 'flyer' && Math.random() > 0.5),
        side: config.side ?? (elementRect.left < window.innerWidth / 2 ? 'right' : 'left'),
      };
      setMascot(finalConfig);
      if (config.duration) {
        hideTimerRef.current = setTimeout(() => {
          if (config.onDismiss) {
            config.onDismiss();
          } else {
            hideMascot();
          }
        }, config.duration);
      }
    }, 100);
  }, [isMobile, hideMascot, isAIVisible, isChatOpen, handleMascotInterception]);

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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(target.data.event.event_date);
      const isPast = eventDate < today;
      showMascot({
        ...target,
        buttonText: isPast ? 'Вспомнить' : 'Посмотреть',
        type: isFlyer ? 'flyer' : 'runner',
        side: isFlyer ? 'top' : undefined,
        duration: MASCOT_CONFIG.BASE_DURATION + Math.random() * MASCOT_CONFIG.RANDOM_DURATION,
      });
    };
    
    const intervalId = setInterval(triggerRandomMascot, MASCOT_CONFIG.LOOP_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isLoopActive, mascotTargets, isMobile, showMascot]);

  const value = {
    mascot,
    showMascot,
    hideMascot,
    registerMascotTargets,
    clearMascotTargets,
    startMascotLoop,
    stopMascotLoop,
  };

  return <EventMascotContext.Provider value={value}>{children}</EventMascotContext.Provider>;
};
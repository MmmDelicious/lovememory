import { useState, useRef, useEffect, useCallback } from 'react';
const defaultPhrases = {
  annoyed: ['Пожалуйста, не надо так настойчиво кликать.'],
  easterEgg: ['Ого, вы настойчивый.'],
  idle: ['Ну что, задумались?'],
  story: ['Тут одна пара вчера пароль забыла, представляете?'],
  error: ['Хм, что-то не так. Проверьте данные, пожалуйста.'],
};
const getRandomPhrase = (phrases) => phrases[Math.floor(Math.random() * phrases.length)];
export const useInteractiveMascot = (config) => {
  const { initialMessage, phrases } = config;
  const allPhrases = { ...defaultPhrases, ...phrases };
  const [mascotMessage, setMascotMessage] = useState(initialMessage);
  const [clickCount, setClickCount] = useState(0);
  const messageTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const storyTimerRef = useRef(null);
  const setTemporaryMessage = useCallback((message, duration) => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    setMascotMessage(message);
    messageTimerRef.current = setTimeout(() => {
      setMascotMessage(initialMessage);
    }, duration);
  }, [initialMessage]);
  const resetIdleTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setTemporaryMessage(getRandomPhrase(allPhrases.idle), 5000);
    }, 10000);
    storyTimerRef.current = setTimeout(() => {
      setTemporaryMessage(getRandomPhrase(allPhrases.story), 7000);
    }, 20000);
  }, [allPhrases.idle, allPhrases.story, setTemporaryMessage]);
  useEffect(() => {
    resetIdleTimers();
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    };
  }, [resetIdleTimers]);
  const handleAvatarClick = () => {
    resetIdleTimers();
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    if (newClickCount >= 5) {
      setClickCount(0);
      setTemporaryMessage(getRandomPhrase(allPhrases.easterEgg), 6000);
    } else {
      setTemporaryMessage(getRandomPhrase(allPhrases.annoyed), 4000);
    }
  };
  const handleInteraction = () => {
    resetIdleTimers();
  };
  const triggerError = (serverMessage) => {
    const errorMessage = serverMessage || getRandomPhrase(allPhrases.error);
    setTemporaryMessage(errorMessage, 7000);
  };
  return { mascotMessage, handleAvatarClick, handleInteraction, triggerError };
};

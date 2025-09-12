import React, { createContext, useContext, useCallback, useEffect } from 'react';
import globalMascotAnimation from '../shared/assets/AI.json';
import { askAI } from '../services/ai.service';
import { MASCOT_CONFIG } from '../shared/mascot/config/mascot.config.js';
import { useMascotLogic } from './hooks/useMascotLogic';
import { MascotContextType, MascotTarget, MascotConfig } from './types/MascotTypes';

const MascotContext = createContext<MascotContextType | undefined>(undefined);

export const useMascot = () => {
  const context = useContext(MascotContext);
  if (context === undefined) {
    throw new Error('useMascot must be used within a MascotProvider');
  }
  return context;
};

interface MascotProviderProps {
  children: React.ReactNode;
}

export const MascotProvider: React.FC<MascotProviderProps> = ({ children }) => {
  const {
    mascot,
    mascotTargets,
    setMascotTargets,
    isLoopActive,
    setIsLoopActive,
    globalMascot,
    setGlobalMascot,
    isAIVisible,
    setIsAIVisible,
    isChatOpen,
    setIsChatOpen,
    isAILoading,
    setIsAILoading,
    interceptedMascot,
    isMobile,
    hideMascot,
    showMascot,
    setGlobalMascotMessage
  } = useMascotLogic();

  const registerMascotTargets = useCallback((targets: MascotTarget[]) => {
    setMascotTargets(targets);
  }, [setMascotTargets]);

  const clearMascotTargets = useCallback(() => {
    setMascotTargets([]);
  }, [setMascotTargets]);

  const startMascotLoop = useCallback(() => {
    setIsLoopActive(true);
  }, [setIsLoopActive]);

  const stopMascotLoop = useCallback(() => {
    setIsLoopActive(false);
  }, [setIsLoopActive]);

  // Mascot loop effect
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
      
      const config: MascotConfig = {
        ...target,
        type: isFlyer ? 'flyer' : 'runner',
        side: isFlyer ? 'top' : undefined,
        duration: MASCOT_CONFIG.BASE_DURATION + Math.random() * MASCOT_CONFIG.RANDOM_DURATION,
      };
      
      showMascot(config);
    };
    
    const intervalId = setInterval(triggerRandomMascot, MASCOT_CONFIG.LOOP_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isLoopActive, mascotTargets, isMobile, showMascot]);

  const moveGlobalMascot = useCallback(() => {
    setGlobalMascot(prev => {
      const newPosition = { 
        x: Math.round(10 + Math.random() * 80), 
        y: Math.round(10 + Math.random() * 80) 
      };
      const newDirection = newPosition.x < prev.position.x ? 'left' : 'right';
      return { ...prev, position: newPosition, direction: newDirection, message: '' };
    });
  }, [setGlobalMascot]);

  // AI mascot idle behavior
  useEffect(() => {
    if (isAIVisible && !isChatOpen) {
      const moveInterval = setInterval(moveGlobalMascot, MASCOT_CONFIG.IDLE_MOVE_INTERVAL);
      const talkInterval = setInterval(() => {
        const phrase = MASCOT_CONFIG.IDLE_PHRASES[Math.floor(Math.random() * MASCOT_CONFIG.IDLE_PHRASES.length)];
        setGlobalMascotMessage(phrase);
      }, MASCOT_CONFIG.IDLE_TALK_INTERVAL);
      
      return () => {
        clearInterval(moveInterval);
        clearInterval(talkInterval);
      };
    }
  }, [isAIVisible, isChatOpen, moveGlobalMascot, setGlobalMascotMessage]);

  const toggleAIMascot = useCallback(() => {
    const nextVisibility = !isAIVisible;
    setIsAIVisible(nextVisibility);
    if (!nextVisibility) setIsChatOpen(false);
  }, [isAIVisible, setIsAIVisible, setIsChatOpen]);

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => {
      const nextState = !prev;
      if (nextState) {
        setGlobalMascot(gm => ({ 
          ...gm, 
          position: MASCOT_CONFIG.AI_CHAT_POSITION, 
          message: '' 
        }));
      }
      return nextState;
    });
  }, [setIsChatOpen, setGlobalMascot]);

  const sendMessageToAI = useCallback(async (prompt: string, context?: string) => {
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
  }, [setIsAILoading, setGlobalMascotMessage]);

  const value: MascotContextType = {
    mascot,
    showMascot,
    hideMascot,
    registerMascotTargets,
    clearMascotTargets,
    startMascotLoop,
    stopMascotLoop,
    interceptedMascot,
    globalMascot,
    globalMascotAnimation,
    isAIVisible,
    toggleAIMascot,
    isChatOpen,
    toggleChat,
    sendMessageToAI,
    isAILoading,
  };

  return (
    <MascotContext.Provider value={value}>
      {children}
    </MascotContext.Provider>
  );
};

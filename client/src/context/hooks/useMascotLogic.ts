import { useState, useRef, useCallback, useEffect } from 'react';
import { useUser } from '../../store/hooks';
import { askAI } from '../../services/ai.service';
import smartMascotService from '../../services/smartMascot.service';
import { MASCOT_CONFIG } from '../../shared/mascot/config/mascot.config.js';
import runnerAnimation from '../../shared/assets/running-character.json';
import flyerAnimation from '../../shared/assets/2.json';
import greetAnimation from '../../shared/assets/greet.json';
import { MascotConfig, MascotTarget, GlobalMascot, InterceptedMascot } from '../types/MascotTypes';

const generateMessage = (page?: string, data?: any, user: any = null, partner: any = null) => {
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
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return smartMascotService.generatePastMemoryMessage(data.event);
    } else {
      return smartMascotService.generateFutureEventMessage(data.event);
    }
  }
  
  return data?.message || smartMascotService.generateContextualMessage();
};

export const useMascotLogic = () => {
  const user = useUser();
  const [mascot, setMascot] = useState<MascotConfig | null>(null);
  const [mascotTargets, setMascotTargets] = useState<MascotTarget[]>([]);
  const [isLoopActive, setIsLoopActive] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [globalMascot, setGlobalMascot] = useState<GlobalMascot>({ 
    position: { x: 80, y: 70 }, 
    direction: 'left', 
    message: '' 
  });
  const [isAIVisible, setIsAIVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [interceptedMascot, setInterceptedMascot] = useState<InterceptedMascot | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hideMascot = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setMascot(null);
  }, []);

  const moveGlobalMascotToPosition = useCallback((newPosition: { x: number; y: number }) => {
    setGlobalMascot(prev => {
      const newDirection = newPosition.x < prev.position.x ? 'left' : 'right';
      return { ...prev, position: newPosition, direction: newDirection };
    });
  }, []);

  const setGlobalMascotMessage = useCallback((message: string, duration = MASCOT_CONFIG.DEFAULT_MESSAGE_DURATION) => {
    setGlobalMascot(prev => ({ ...prev, message }));
    const timer = setTimeout(() => {
      setGlobalMascot(prev => ({ ...prev, message: '' }));
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const handleMascotInterception = useCallback((config: MascotConfig, helperAnimation: any) => {
    if (!config.element) return;
    
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

  const showMascot = useCallback((config: MascotConfig) => {
    if (isMobile || !config.element) return;

    if (!config.element.isConnected) {
      console.warn('Mascot target element is no longer in the DOM. Aborting showMascot.');
      return;
    }
    
    let helperAnimation: any, mascotType: string;
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
      if (!config.element?.isConnected) {
        console.warn('Mascot target element disappeared during the showMascot timeout.');
        return;
      }
      
      const message = config.message || generateMessage(config.page, config.data, user, user?.partner);
      const elementRect = config.element.getBoundingClientRect();
      
      const finalConfig: MascotConfig = { 
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
  }, [isMobile, hideMascot, isAIVisible, isChatOpen, handleMascotInterception, user]);

  return {
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
    moveGlobalMascotToPosition,
    setGlobalMascotMessage,
    handleMascotInterception
  };
};

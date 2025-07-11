import React from 'react';
import { useMascot } from '../../context/MascotContext';
import AIChat from '../AIChat/AIChat';
import AIToggleButton from '../AIToggleButton/AIToggleButton';
import FreeRoamMascot from '../FreeRoamMascot/FreeRoamMascot';
import { useAuth } from '../../context/AuthContext';

const AIChatInterface = () => {
  const { 
    isChatOpen, 
    toggleChat, 
    isAIVisible, 
    globalMascot, 
    globalMascotAnimation 
  } = useMascot();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <>
      <AIToggleButton />
      {isAIVisible && (
        <FreeRoamMascot 
          state={globalMascot} 
          animationData={globalMascotAnimation}
          onClick={toggleChat}
        />
      )}
      {isChatOpen && <AIChat />}
    </>
  );
};

export default AIChatInterface;
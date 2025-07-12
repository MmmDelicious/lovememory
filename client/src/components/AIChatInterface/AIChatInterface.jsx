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
    globalMascotAnimation,
    isAILoading
  } = useMascot();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const aiInterfaceContainerStyle = {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    zIndex: 10000
  };

  return (
    <>
      {isAIVisible && (
        <FreeRoamMascot 
          state={globalMascot} 
          animationData={globalMascotAnimation}
          onClick={toggleChat}
          isAILoading={isAILoading}
        />
      )}
      <div style={aiInterfaceContainerStyle}>
        <AIToggleButton />
        {isChatOpen && <AIChat />}
      </div>
    </>
  );
};

export default AIChatInterface;
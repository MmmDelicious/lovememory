import React from 'react';
import { useAIMascot } from '../../context/AIMascotContext';
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
    isAILoading,
    sendMessageToAI,
    toggleAIMascot
  } = useAIMascot();
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

  const handleContextMenuAction = (actionId) => {
    switch (actionId) {
      case 'chat':
        toggleChat();
        break;
      case 'joke':
        sendMessageToAI('Расскажи мне смешную шутку или анекдот', 'joke');
        break;
      case 'dance':
        sendMessageToAI('Потанцуй для меня! Покажи свои лучшие движения!', 'dance');
        break;
      case 'advice':
        sendMessageToAI('Дай мне мудрый совет на сегодня', 'advice');
        break;
      case 'weather':
        sendMessageToAI('Расскажи мне о погоде и как лучше провести день', 'weather');
        break;
      case 'mood':
        sendMessageToAI('Подними мне настроение! Расскажи что-нибудь позитивное', 'mood');
        break;
      case 'hide':
        toggleAIMascot();
        break;
      default:
        break;
    }
  };

  return (
    <>
      {isAIVisible && (
        <FreeRoamMascot 
          state={globalMascot} 
          animationData={globalMascotAnimation}
          onClick={toggleChat}
          isAILoading={isAILoading}
          onContextMenuAction={handleContextMenuAction}
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
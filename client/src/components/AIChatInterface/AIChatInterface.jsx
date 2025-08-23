import React from 'react';
import { useAIMascot, useMascotActions, useGlobalMascot, useUser } from '../../store/hooks';
import AIChat from '../AIChat/AIChat';
import AIToggleButton from '../AIToggleButton/AIToggleButton';
import FreeRoamMascot from '../FreeRoamMascot/FreeRoamMascot';
import DateGeneratorModal from '../DateGeneratorModal/DateGeneratorModal';

const AIChatInterface = () => {
  // Получаем состояние из Redux вместо Context
  const { isVisible, isChatOpen, isLoading } = useAIMascot();
  const globalMascot = useGlobalMascot();
  
  // Получаем действия из Redux
  const { toggleAI, toggleChat, sendMessageToAI, closeDateGenerator } = useMascotActions();
  
  const user = useUser();

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
      case 'generateDate':
        sendMessageToAI('Сгенерируй идеальное свидание для нас!', 'generateDate');
        break;
      case 'hide':
        toggleAI();
        break;
      default:
        break;
    }
  };

  const handleEventCreated = (event) => {
    // Event created successfully
  };

  return (
    <>
      {isVisible && (
        <FreeRoamMascot 
          state={globalMascot} 
          animationData={globalMascot.animationData}
          onClick={toggleChat}
          isAILoading={isLoading}
          onContextMenuAction={handleContextMenuAction}
        />
      )}
      <div style={aiInterfaceContainerStyle}>
        <AIToggleButton />
        {isChatOpen && <AIChat />}
      </div>
      <DateGeneratorModal
        isOpen={false} // Временно, пока не мигрируем DateGenerator
        onClose={closeDateGenerator}
        onEventCreated={handleEventCreated}
      />
    </>
  );
};

export default AIChatInterface;

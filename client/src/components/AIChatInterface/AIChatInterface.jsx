import React from 'react';
import { useAIMascot, useMascotActions, useGlobalMascot, useUser } from '../../store/hooks';
import { usePairing } from '../../hooks/usePairing';
import AIChat from '../AIChat/AIChat';
import AIToggleButton from '../AIToggleButton/AIToggleButton';
import FreeRoamMascot from '../FreeRoamMascot/FreeRoamMascot';
import DateGeneratorModal from '../DateGeneratorModal/DateGeneratorModal';

const AIChatInterface = () => {
  const { isVisible, isChatOpen, isLoading } = useAIMascot();
  const globalMascot = useGlobalMascot();
  
  const { toggleAI, toggleChat, sendMessageToAI, closeDateGenerator } = useMascotActions();
  
  const user = useUser();
  const { pairing } = usePairing(user);

  if (!user) {
    return null;
  }

  const aiInterfaceContainerStyle = {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    zIndex: 10000
  };

  const createContext = () => {
    if (!user) return null;

    const partner = pairing?.status === 'active' 
      ? (pairing?.Requester?.id === user?.id ? pairing?.Receiver : pairing?.Requester)
      : null;

    return {
      user: {
        name: user?.first_name || user?.display_name || user?.name || user?.email || 'Пользователь',
        full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.display_name || user?.email || 'Пользователь',
        gender: user?.gender || null,
        city: user?.city || 'Не указан',
        age: user?.age || null,
        coins: user?.coins || 0,
        email: user?.email || null
      },
      partner: partner ? {
        name: partner?.first_name || partner?.display_name || partner?.name || partner?.email || 'Партнер',
        full_name: `${partner?.first_name || ''} ${partner?.last_name || ''}`.trim() || partner?.display_name || partner?.email || 'Партнер',
        gender: partner?.gender || null,
        city: partner?.city || 'Не указан',
        age: partner?.age || null
      } : null,
      relationship: {
        status: pairing?.status || 'single',
        duration: pairing?.created_at ? Math.floor((Date.now() - new Date(pairing.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
      }
    };
  };

  const handleContextMenuAction = (actionId) => {
    const context = createContext();
    
    switch (actionId) {
      case 'chat':
        toggleChat();
        break;
      case 'joke':
        sendMessageToAI('Расскажи мне смешную шутку или анекдот', context);
        break;
      case 'dance':
        sendMessageToAI('Потанцуй для меня! Покажи свои лучшие движения!', context);
        break;
      case 'advice':
        sendMessageToAI('Дай мне мудрый совет на сегодня', context);
        break;
      case 'weather':
        sendMessageToAI('Расскажи мне о погоде и как лучше провести день', context);
        break;
      case 'mood':
        sendMessageToAI('Подними мне настроение! Расскажи что-нибудь позитивное', context);
        break;
      case 'generateDate':
        sendMessageToAI('Создай умное свидание с реальными местами!', context);
        break;
      case 'hide':
        toggleAI();
        break;
      default:
        break;
    }
  };

  const handleEventCreated = (event) => {
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
        isOpen={false}
        onClose={closeDateGenerator}
        onEventCreated={handleEventCreated}
      />
    </>
  );
};

export default AIChatInterface;

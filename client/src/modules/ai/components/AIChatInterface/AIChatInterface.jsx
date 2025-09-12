import React from 'react';
import { useAIMascot, useMascotActions, useGlobalMascot, useUser } from '../../../../store/hooks';
import { usePairing } from '../../../users/hooks/usePairing';
import AIChat from '../AIChat/AIChat';
import AIToggleButton from '../AIToggleButton/AIToggleButton';
import FreeRoamMascot from '../../../../shared/mascot/FreeRoamMascot/FreeRoamMascot';
import DateGeneratorModal from '../../../events/components/DateGeneratorModal/DateGeneratorModal';
import globalMascotAnimation from '../../../../shared/assets/AI.json';

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


  const handleEventCreated = (event) => {
  };

  return (
    <>
      {isVisible && (
        <FreeRoamMascot 
          state={globalMascot} 
          animationData={JSON.parse(JSON.stringify(globalMascotAnimation))}
          onClick={toggleChat}
          isAILoading={isLoading}
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

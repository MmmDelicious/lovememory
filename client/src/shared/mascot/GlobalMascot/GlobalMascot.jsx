import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LottieMascot from '../LottieMascot/LottieMascot';
import InterceptedMascot from '../InterceptedMascot/InterceptedMascot';
import { useMascot } from '../../../context/MascotContext';

const GlobalMascot = () => {
  const mascotContext = useMascot();

  // Добавляем проверку, чтобы избежать падения, если контекст по какой-то причине undefined
  if (!mascotContext) {
    // Можно вернуть null или какой-то заглушечный UI
    return null;
  }

  const { 
    mascot, 
    hideMascot, 
    interceptedMascot, 
    globalMascot, 
    globalMascotAnimation,
    isAIVisible,
    toggleAIMascot 
  } = mascotContext;
  
  const location = useLocation();

  useEffect(() => {
    hideMascot();
  }, [location.pathname, hideMascot]);

  const handleActionClick = (startDismiss) => {
    if (mascot?.onActionClick) {
      mascot.onActionClick();
    }
    startDismiss();
  };

  return (
    <>
      {interceptedMascot && <InterceptedMascot {...interceptedMascot} />}
      {mascot && (
        <LottieMascot
          {...mascot}
          onActionClick={handleActionClick}
          onDismiss={hideMascot}
        />
      )}
    </>
  );
};

export default GlobalMascot;

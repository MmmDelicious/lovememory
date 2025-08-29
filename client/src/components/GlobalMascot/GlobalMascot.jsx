import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LottieMascot from '../LottieMascot/LottieMascot';
import InterceptedMascot from '../InterceptedMascot/InterceptedMascot';
import { useMascot } from '../../context/MascotContext';

const GlobalMascot = () => {
  const { 
    mascot, 
    hideMascot, 
    interceptedMascot, 
    globalMascot, 
    globalMascotAnimation,
    isAIVisible,
    toggleAIMascot 
  } = useMascot();
  
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

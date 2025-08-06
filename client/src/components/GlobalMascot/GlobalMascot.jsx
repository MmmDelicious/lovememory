import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LottieMascot from '../LottieMascot/LottieMascot';
import InterceptedMascot from '../InterceptedMascot/InterceptedMascot';
import { useEventMascot } from '../../context/EventMascotContext';
import { useAIMascot } from '../../context/AIMascotContext';

const GlobalMascot = () => {
  const { mascot, hideMascot } = useEventMascot();
  const { interceptedMascot } = useAIMascot();
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

  if (interceptedMascot) {
    return <InterceptedMascot {...interceptedMascot} />;
  }
  
  if (mascot) {
    return (
      <LottieMascot
        {...mascot}
        onActionClick={handleActionClick}
        onDismiss={hideMascot}
      />
    );
  }

  return null;
};

export default GlobalMascot;
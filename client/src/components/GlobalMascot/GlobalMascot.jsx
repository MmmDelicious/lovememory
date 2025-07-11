import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LottieMascot from '../LottieMascot/LottieMascot';
import InterceptedMascot from '../InterceptedMascot/InterceptedMascot';
import { useMascot } from '../../context/MascotContext';

const GlobalMascot = () => {
  const { mascot, hideMascot, interceptedMascot } = useMascot();
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
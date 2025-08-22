import React, { useEffect, useReducer, useRef, useState, useLayoutEffect } from 'react';
import Lottie from 'lottie-react';
import styles from './LottieMascot.module.css';
const animationDuration = 2500;
const bubbleFadeOutDuration = 2000;
const initialState = {
  phase: 'before-animate',
  showInterruptBubble: false,
  showDismissBubble: false,
};
function reducer(state, action) {
  switch (action.type) {
    case 'START_ANIMATION':
      return { ...state, phase: 'appearing' };
    case 'ARRIVE':
      return { ...state, phase: 'arrived' };
    case 'INTERRUPT':
      return { ...state, phase: 'interrupted', showInterruptBubble: true };
    case 'DISMISS':
      return { ...state, phase: 'dismissed', showDismissBubble: true };
    case 'HIDE_BUBBLES':
      return { ...state, showInterruptBubble: false, showDismissBubble: false };
    case 'RESET':
      return initialState;
    default:
      throw new Error();
  }
}
const LottieMascot = ({ message, buttonText, imageUrl, onActionClick, onDismiss, side, animationData, mascotType, isTumbling, element: targetElement }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [position, setPosition] = useState(null);
  const lottieRef = useRef();
  useLayoutEffect(() => {
    if (!targetElement) return;
    const updatePosition = () => {
      const targetRect = targetElement.getBoundingClientRect();
      setPosition({
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top + targetRect.height / 2
      });
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [targetElement]);
  useEffect(() => {
    if (position) {
      const timer = setTimeout(() => dispatch({ type: 'START_ANIMATION' }), 10);
      return () => clearTimeout(timer);
    }
  }, [position]);
  useEffect(() => {
    let timer;
    if (state.phase === 'appearing') {
      timer = setTimeout(() => dispatch({ type: 'ARRIVE' }), animationDuration);
    } else if (state.phase === 'interrupted' || state.phase === 'dismissed') {
      const bubbleTimer = setTimeout(() => dispatch({ type: 'HIDE_BUBBLES' }), bubbleFadeOutDuration);
      const dismissTimer = setTimeout(onDismiss, animationDuration);
      return () => {
        clearTimeout(bubbleTimer);
        clearTimeout(dismissTimer);
      };
    }
    return () => clearTimeout(timer);
  }, [state.phase, onDismiss]);
  const startDismissal = () => {
    dispatch({ type: 'DISMISS' });
  };
  const handleClick = (e) => {
    if (state.phase === 'dismissed' || state.phase === 'interrupted') return;
    if (state.phase === 'arrived') {
      startDismissal();
    } else {
      e.stopPropagation();
      dispatch({ type: 'INTERRUPT' });
    }
  };
  const handleButtonClick = () => {
    if (onActionClick) {
      onActionClick(startDismissal);
    }
  };
  const getInitialPosition = () => {
    switch (side) {
      case 'top': return { top: '-150px', left: position.x + 'px' };
      case 'bottom': return { top: `calc(${window.innerHeight}px + 150px)`, left: position.x + 'px' };
      case 'right': return { top: position.y + 'px', left: `calc(${window.innerWidth}px + 150px)` };
      case 'left':
      default: return { top: position.y + 'px', left: '-150px' };
    }
  };
  const getTargetPosition = () => {
    if (state.phase === 'interrupted' || state.phase === 'dismissed') {
      if (mascotType === 'flyer') {
        return { top: `calc(${window.innerHeight}px + 150px)`, left: position.x + 'px' };
      }
      return getInitialPosition();
    }
    return { top: position.y + 'px', left: position.x + 'px' };
  };
  if (!position) return null;
  const isLeaving = state.phase === 'interrupted' || state.phase === 'dismissed';
  const isArrived = state.phase === 'arrived';
  const playerClasses = [
    styles.lottiePlayer,
    isArrived ? styles.arrived : '',
    isLeaving && mascotType === 'flyer' ? styles.interruptedFlyer : '',
    styles[mascotType],
    isTumbling && !isLeaving ? styles.tumbling : ''
  ].join(' ');
  const flipDirection = isLeaving ? (side === 'left' ? -1 : 1) : (side === 'right' ? -1 : 1);
  return (
    <div
      className={styles.mascotContainer}
      style={{
        '--animation-duration': `${animationDuration / 1000}s`,
        ...(state.phase === 'before-animate' ? getInitialPosition() : getTargetPosition()),
      }}
    >
      <div
        className={playerClasses}
        style={{ '--flip-direction': flipDirection }}
        onClick={handleClick}
      >
        <Lottie lottieRef={lottieRef} animationData={animationData} loop={true} />
      </div>
      {state.showInterruptBubble && (
        <div className={styles.infoBubble}>
          <p>Ой! Я хотел сказать кое-что важное...</p>
        </div>
      )}
      {state.showDismissBubble && (
        <div className={styles.infoBubble}>
          <p>Всё-всё, я на секундочку, уже ухожу!</p>
        </div>
      )}
      {isArrived && (
        <div className={`${styles.speechBubble} ${styles.thoughtBubble} ${styles[side]}`}>
          {imageUrl && <img src={imageUrl} alt="Воспоминание" className={styles.bubbleImage} />}
          <p>{message}</p>
          {buttonText && <button onClick={handleButtonClick}>{buttonText}</button>}
        </div>
      )}
    </div>
  );
};
export default LottieMascot;

import React from 'react';
import StaticMascot from '../../../../shared/mascot/StaticMascot/StaticMascot';
import greetAnimation from '../../../../shared/assets/greet.json';
import styles from './AuthMascot.module.css';

interface AuthMascotProps {
  mode: 'login' | 'register';
  message: string;
  onAvatarClick: () => void;
  hasErrors?: boolean;
  className?: string;
}

/**
 * Компонент маскота для авторизации
 * Простой компонент обертка над StaticMascot
 * Мемоизирован для предотвращения лишних перерисовок
 */
const AuthMascotComponent: React.FC<AuthMascotProps> = ({
  mode,
  message,
  onAvatarClick,
  hasErrors = false,
  className
}) => {
  return (
    <div className={`${mode === 'register' ? styles.mascotContainer : styles.mascotPositioner} ${className || ''}`}>
      <StaticMascot
        bubbleKey={message}
        message={message}
        animationData={greetAnimation}
        onAvatarClick={onAvatarClick}
        isError={hasErrors}
        mode={mode}
      />
    </div>
  );
};

// Мемоизируем компонент для предотвращения лишних перерисовок
export const AuthMascot = React.memo(AuthMascotComponent);

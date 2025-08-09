import React from 'react';
import styles from './Button.module.css';

const Button = ({ children, onClick, type = 'primary', variant, submit = false, disabled = false }) => {
  const visualType = (variant || type);
  const buttonClass =
    visualType === 'secondary' ? styles.secondary :
    visualType === 'outline' ? styles.outline :
    styles.primary;

  return (
    <button
      type={submit ? 'submit' : 'button'}
      className={`${styles.button} ${buttonClass}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
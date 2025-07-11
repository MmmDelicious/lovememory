import React from 'react';
import styles from './Button.module.css';

const Button = ({ children, onClick, type = 'primary', submit = false }) => {
  const buttonClass = type === 'secondary' ? styles.secondary : styles.primary;

  return (
    <button
      type={submit ? 'submit' : 'button'}
      className={`${styles.button} ${buttonClass}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
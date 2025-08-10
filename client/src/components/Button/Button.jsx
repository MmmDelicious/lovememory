import React from 'react';
import styles from './Button.module.css';

const Button = ({
  children,
  onClick,
  type = 'primary',
  variant,
  submit = false,
  disabled = false,
  size = 'md', // 'sm' | 'md'
  fullWidth = false,
}) => {
  const visualType = (variant || type);
  const buttonClass =
    visualType === 'secondary' ? styles.secondary :
    visualType === 'outline' ? styles.outline :
    styles.primary;

  const sizeClass = size === 'sm' ? styles.sm : '';
  const widthClass = fullWidth ? styles.fullWidth : '';

  return (
    <button
      type={submit ? 'submit' : 'button'}
      className={`${styles.button} ${buttonClass} ${sizeClass} ${widthClass}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
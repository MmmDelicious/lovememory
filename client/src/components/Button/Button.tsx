import React from 'react';
import styles from './Button.module.css';

type ButtonType = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'sm' | 'md';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: ButtonType;
  variant?: ButtonType;
  submit?: boolean;
  disabled?: boolean;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick = undefined,
  type = 'primary',
  variant = undefined,
  submit = false,
  disabled = false,
  size = 'md',
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

import React from 'react';
import { LucideIcon } from 'lucide-react';
import styles from './FormInput.module.css';

interface FormInputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Переиспользуемый инпут для форм
 * Чистый UI компонент без бизнес-логики
 */
const FormInput: React.FC<FormInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  disabled = false,
  required = false,
  maxLength,
  size = 'medium',
  className = ''
}) => {
  const inputId = React.useId();

  return (
    <div className={`${styles.container} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={`${styles.inputContainer} ${styles[size]} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''}`}>
        {Icon && (
          <div className={styles.iconContainer}>
            <Icon size={size === 'small' ? 16 : size === 'large' ? 24 : 20} className={styles.icon} />
          </div>
        )}
        
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          className={styles.input}
        />
      </div>
      
      {error && (
        <div className={styles.errorText}>{error}</div>
      )}
    </div>
  );
};

export default FormInput;

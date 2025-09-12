import React from 'react';
import Button from '../../../../shared/components/Button/Button';
import GenderSelector from '../../../users/components/GenderSelector/GenderSelector';
import styles from './AuthForm.module.css';

type AuthMode = 'login' | 'register';

interface FormData {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  gender?: 'male' | 'female' | 'other';
  city?: string;
  age?: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  gender?: string;
  city?: string;
  age?: string;
}

interface AuthFormProps {
  mode: AuthMode;
  formData: FormData;
  fieldErrors: FieldErrors;
  isSubmitting: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

/**
 * Компонент формы авторизации
 * Содержит простую логику отображения полей в зависимости от режима
 * Не содержит бизнес-логики валидации или отправки
 */
export const AuthFormComponent: React.FC<AuthFormProps> = ({
  mode,
  formData,
  fieldErrors,
  isSubmitting,
  onInputChange,
  onSubmit,
  className
}) => {
  const handleGenderChange = (gender: 'male' | 'female' | 'other') => {
    onInputChange({ target: { name: 'gender', value: gender } } as any);
  };

  if (mode === 'register') {
    return (
      <div className={`${styles.formScroll} ${className || ''}`}>
        <form onSubmit={onSubmit} className={styles.form} noValidate>
          <div className={styles.formGrid}>
            <input
              name="name"
              type="text"
              placeholder="Ваше имя"
              className={`${styles.input} ${styles.register} ${fieldErrors.name ? `${styles.inputError} ${styles.register}` : ''}`}
              value={formData.name || ''}
              onChange={onInputChange}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              className={`${styles.input} ${styles.register} ${fieldErrors.email ? `${styles.inputError} ${styles.register}` : ''}`}
              value={formData.email || ''}
              onChange={onInputChange}
            />
            <input
              name="password"
              type="password"
              placeholder="Пароль (мин. 6 симв.)"
              className={`${styles.input} ${styles.register} ${fieldErrors.password ? `${styles.inputError} ${styles.register}` : ''}`}
              value={formData.password || ''}
              onChange={onInputChange}
            />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Подтвердите пароль"
              className={`${styles.input} ${styles.register} ${fieldErrors.confirmPassword ? `${styles.inputError} ${styles.register}` : ''}`}
              value={formData.confirmPassword || ''}
              onChange={onInputChange}
            />
            <div className={styles.gridSpanFull}>
              <GenderSelector
                selectedGender={formData.gender || 'male'}
                onGenderChange={handleGenderChange}
              />
            </div>
            <input
              name="city"
              type="text"
              placeholder="Город"
              className={`${styles.input} ${styles.register} ${fieldErrors.city ? `${styles.inputError} ${styles.register}` : ''}`}
              value={formData.city || ''}
              onChange={onInputChange}
            />
            <input
              name="age"
              type="number"
              placeholder="Возраст (18+)"
              className={`${styles.input} ${styles.register} ${fieldErrors.age ? `${styles.inputError} ${styles.register}` : ''}`}
              value={formData.age || ''}
              onChange={onInputChange}
              min="18"
              max="99"
            />
          </div>
          <Button type="primary" submit size="sm" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Отправляем...' : 'Отправить анкету'}
          </Button>
        </form>
      </div>
    );
  }

  // Login form
  return (
    <form onSubmit={onSubmit} className={`${styles.form} ${className || ''}`} noValidate>
      <div className={styles.formColumn}>
        <input
          name="email"
          type="email"
          placeholder="Email"
          className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
          value={formData.email || ''}
          onChange={onInputChange}
        />
        <input
          name="password"
          type="password"
          placeholder="Пароль"
          className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
          value={formData.password || ''}
          onChange={onInputChange}
        />
      </div>
      <Button type="primary" submit size="sm" fullWidth disabled={isSubmitting}>
        {isSubmitting ? 'Входим...' : 'Войти'}
      </Button>
    </form>
  );
};

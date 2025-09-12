import { useState, useCallback } from 'react';
import React from 'react'; // Added missing import for React.useEffect
import { useDispatch, useSelector } from 'react-redux';
import { setFieldErrors, selectFieldErrors } from '@/store';

type AuthMode = 'login' | 'register';

interface AuthFormData {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  gender?: 'male' | 'female' | 'other';
  city?: string;
  age?: string;
}

interface UseAuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: any) => Promise<any>;
  onSuccess: () => void;
  triggerError: (message: string) => void;
  handleInteraction: () => void;
}

export const useAuthForm = ({ mode, onSubmit, onSuccess, triggerError, handleInteraction }: UseAuthFormProps) => {
  const dispatch = useDispatch();
  
  // Получаем состояние ошибок из Redux store
  const fieldErrors = useSelector(selectFieldErrors);
  
  const [formData, setFormData] = useState<AuthFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'male',
    city: '',
    age: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Функции для обновления состояния ошибок через Redux
  const updateFieldErrors = useCallback((newFieldErrors: Record<string, boolean>) => {
    dispatch(setFieldErrors(newFieldErrors));
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => {
    const fieldName = e.target.name;
    const value = e.target.value;
    
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    
    // Очистка ошибки поля при изменении
    if (fieldErrors[fieldName]) {
      updateFieldErrors({ ...fieldErrors, [fieldName]: false });
    }
    
    // Реал-тайм валидация для лучшего UX
    if (mode === 'register' && value) {
      const currentErrors = { ...fieldErrors };
      
      // Валидация email
      if (fieldName === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          currentErrors.email = true;
          triggerError('Введите корректный email адрес');
        } else if (currentErrors.email) {
          currentErrors.email = false;
        }
      }
      
      // Валидация пароля
      if (fieldName === 'password' && value) {
        if (value.length < 6) {
          currentErrors.password = true;
          triggerError('Пароль должен быть не менее 6 символов');
        } else if (currentErrors.password) {
          currentErrors.password = false;
        }
      }
      
      // Валидация подтверждения пароля
      if (fieldName === 'confirmPassword' && value) {
        if (value !== formData.password) {
          currentErrors.confirmPassword = true;
          triggerError('Пароли не совпадают');
        } else if (currentErrors.confirmPassword) {
          currentErrors.confirmPassword = false;
        }
      }
      
      // Валидация возраста
      if (fieldName === 'age' && value) {
        const age = parseInt(value);
        if (isNaN(age) || age < 18 || age > 99) {
          currentErrors.age = true;
          triggerError('Возраст должен быть от 18 до 99 лет');
        } else if (currentErrors.age) {
          currentErrors.age = false;
        }
      }
      
      updateFieldErrors(currentErrors);
    }
    
    handleInteraction();
  };

  const validateForm = (): { isValid: boolean; errors: Record<string, boolean>; errorMessage: string } => {
    const errors: Record<string, boolean> = {};
    let errorMessage = '';

    if (mode === 'register') {
      // Поэтапная валидация с понятными сообщениями
      if (!formData.name?.trim()) {
        errors.name = true;
        errorMessage = 'Пожалуйста, введите ваше имя';
      } else if (!formData.email?.trim()) {
        errors.email = true;
        errorMessage = 'Пожалуйста, введите email адрес';
      } else if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = true;
        errorMessage = 'Введите корректный email адрес';
      } else if (!formData.password) {
        errors.password = true;
        errorMessage = 'Пожалуйста, введите пароль';
      } else if (formData.password.length < 6) {
        errors.password = true;
        errorMessage = 'Пароль должен содержать минимум 6 символов';
      } else if (!formData.confirmPassword) {
        errors.confirmPassword = true;
        errorMessage = 'Пожалуйста, подтвердите пароль';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = true;
        errorMessage = 'Пароли должны совпадать';
      } else if (!formData.city?.trim()) {
        errors.city = true;
        errorMessage = 'Пожалуйста, укажите ваш город';
      } else if (!formData.age) {
        errors.age = true;
        errorMessage = 'Пожалуйста, укажите ваш возраст';
      } else if (isNaN(parseInt(formData.age)) || parseInt(formData.age) < 18 || parseInt(formData.age) > 99) {
        errors.age = true;
        errorMessage = 'Возраст должен быть от 18 до 99 лет';
      }
    } else {
      // Login validation - более дружественные сообщения
      if (!formData.email?.trim()) {
        errors.email = true;
        errorMessage = 'Пожалуйста, введите ваш email';
      } else if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = true;
        errorMessage = 'Введите корректный email адрес';
      } else if (!formData.password) {
        errors.password = true;
        errorMessage = 'Пожалуйста, введите ваш пароль';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      errorMessage
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Защита от повторных отправок
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    updateFieldErrors({});
    
    const { isValid, errors, errorMessage: validationErrorMessage } = validateForm();

    // Показываем ошибку через маскота БЕЗ отправки запроса
    if (!isValid) {
      updateFieldErrors(errors);
      setIsSubmitting(false);
      triggerError(validationErrorMessage);
      return; // Не отправляем запрос при ошибках валидации
    }

    try {
      const result = await onSubmit(mode === 'register' ? {
        email: formData.email,
        password: formData.password,
        first_name: formData.name,
        gender: formData.gender,
        city: formData.city,
        age: parseInt(formData.age!)
      } : {
        email: formData.email,
        password: formData.password
      });

      // Правильная обработка Redux Toolkit async thunk результата
      if (result.meta?.requestStatus === 'rejected') {
        const errorPayload = result.payload || result.error?.message || (mode === 'register' ? 'Registration failed' : 'Login failed');
        throw errorPayload;
      } else if (result.type?.endsWith('/rejected')) {
        // Fallback для старого формата
        const errorPayload = result.payload || result.error || (mode === 'register' ? 'Registration failed' : 'Login failed');
        throw errorPayload;
      }

      // Если дошли сюда - успех
      onSuccess();
    } catch (err: any) {
      // Извлекаем сообщение об ошибке из разных возможных структур
      const serverMessage = typeof err === 'string' ? err : (err?.response?.data?.message || err?.data?.message || err?.message || '');
      
      let mascotMessage: string;
      const serverErrors: Record<string, boolean> = {};

      // Определяем тип ошибки и создаем соответствующие сообщения
      if (mode === 'register') {
        if (serverMessage.toLowerCase().includes('email') || serverMessage.toLowerCase().includes('exists') || serverMessage.toLowerCase().includes('зарегистрирован')) {
          mascotMessage = 'Ой! Кажется, такой email уже зарегистрирован. Попробуйте другой или войдите в существующий аккаунт.';
          serverErrors.email = true;
        } else {
          mascotMessage = 'Хм, анкета заполнена некорректно. Проверьте данные и попробуйте ещё раз!';
        }
      } else {
        if (serverMessage.toLowerCase().includes('not found') || serverMessage.toLowerCase().includes('найден')) {
          mascotMessage = 'Стоп! Такого пользователя не существует. Проверьте email или зарегистрируйтесь.';
          serverErrors.email = true;
        } else if (serverMessage.toLowerCase().includes('password') || serverMessage.toLowerCase().includes('пароль') || serverMessage.toLowerCase().includes('invalid')) {
          mascotMessage = 'Ой-ой! Кажется, пароль неправильный. Попробуйте ещё раз!';
          serverErrors.password = true;
        } else {
          mascotMessage = 'Эй, что-то не так! Проверьте email и пароль - один из них неверный.';
          serverErrors.email = true;
          serverErrors.password = true;
        }
      }
      
      updateFieldErrors(serverErrors);
      triggerError(mascotMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Очистка ошибок при смене режима отключена для сохранения состояния

  return {
    formData,
    fieldErrors,
    isSubmitting,
    handleInputChange,
    handleSubmit,
  };
};

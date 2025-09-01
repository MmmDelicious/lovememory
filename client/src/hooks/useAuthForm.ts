import { useState } from 'react';

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
  const [formData, setFormData] = useState<AuthFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'male',
    city: '',
    age: ''
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [isError, setIsError] = useState(false);

  const handleError = (message: string) => {
    console.group('useAuthForm: handleError called');
    console.log('Error message:', message);
    console.log('Setting isError to true');
    
    setIsError(true);
    
    console.log('Calling triggerError with message:', message);
    triggerError(message);
    
    console.log('Setting timeout to clear error state in 1000ms');
    setTimeout(() => {
      console.log('Clearing error state (isError = false)');
      setIsError(false);
    }, 1000);
    
    console.log('handleError completed');
    console.groupEnd();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => {
    const fieldName = e.target.name;
    const value = e.target.value;
    
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: false }));
    }
    
    handleInteraction();
  };

  const validateForm = (): { isValid: boolean; errors: Record<string, boolean>; errorMessage: string } => {
    const errors: Record<string, boolean> = {};
    let errorMessage = '';

    if (mode === 'register') {
      if (!formData.name?.trim()) {
        errors.name = true;
        errorMessage = 'Введите ваше имя';
      } else if (!formData.email?.trim()) {
        errors.email = true;
        errorMessage = 'Введите email';
      } else if (!formData.password) {
        errors.password = true;
        errorMessage = 'Введите пароль';
      } else if (formData.password.length < 6) {
        errors.password = true;
        errorMessage = 'Пароль должен быть не менее 6 символов';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = true;
        errorMessage = 'Пароли не совпадают';
      } else if (!formData.city?.trim()) {
        errors.city = true;
        errorMessage = 'Введите ваш город';
      } else if (!formData.age || isNaN(parseInt(formData.age)) || parseInt(formData.age) < 18 || parseInt(formData.age) > 99) {
        errors.age = true;
        errorMessage = 'Возраст должен быть от 18 до 99 лет';
      }
    } else {
      // Login validation
      if (!formData.email?.trim()) {
        errors.email = true;
        errorMessage = 'Введите email';
      } else if (!formData.password) {
        errors.password = true;
        errorMessage = 'Введите пароль';
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

    setFieldErrors({});
    const { isValid, errors, errorMessage } = validateForm();

    if (!isValid) {
      setFieldErrors(errors);
      return handleError(errorMessage);
    }

    try {
      if (mode === 'register') {
        await onSubmit({
          email: formData.email,
          password: formData.password,
          first_name: formData.name,
          gender: formData.gender,
          city: formData.city,
          age: parseInt(formData.age!)
        }).unwrap();
      } else {
        await onSubmit({
          email: formData.email,
          password: formData.password
        }).unwrap();
      }

      onSuccess();
    } catch (err: any) {
      console.group('useAuthForm: Handling error');
      console.error('Original error:', err);
      console.error('Error type:', typeof err);
      console.error('Error response:', err?.response);
      console.error('Error data:', err?.response?.data);
      console.error('Current mode:', mode);
      
      // ВАЖНО: предотвращаем любые перезагрузки
      try {
        let errorMessage: string;
        let mascotMessage: string;
        
        // Извлекаем сообщение об ошибке из разных возможных структур
        const serverMessage = err?.response?.data?.message || err?.data?.message || err?.message || '';
        console.log('Extracted server message:', serverMessage);
        
        // Определяем тип ошибки и создаем соответствующие сообщения
        if (mode === 'register') {
          if (serverMessage.toLowerCase().includes('email') || serverMessage.toLowerCase().includes('exists') || serverMessage.toLowerCase().includes('зарегистрирован')) {
            errorMessage = 'Пользователь с таким email уже существует';
            mascotMessage = 'Ой! Кажется, такой email уже зарегистрирован. Попробуйте другой или войдите в существующий аккаунт.';
          } else if (serverMessage.toLowerCase().includes('validation') || serverMessage.toLowerCase().includes('required')) {
            errorMessage = 'Пожалуйста, заполните все обязательные поля';
            mascotMessage = 'Стоп! Проверьте все поля - что-то не заполнено или заполнено неправильно.';
          } else {
            errorMessage = serverMessage || 'Ошибка регистрации';
            mascotMessage = 'Хм, анкета заполнена некорректно. Проверьте данные и попробуйте ещё раз!';
          }
        } else {
          if (serverMessage.toLowerCase().includes('not found') || serverMessage.toLowerCase().includes('найден')) {
            errorMessage = 'Пользователь с таким email не найден';
            mascotMessage = 'Стоп! Такого пользователя не существует. Проверьте email или зарегистрируйтесь.';
          } else if (serverMessage.toLowerCase().includes('password') || serverMessage.toLowerCase().includes('пароль') || serverMessage.toLowerCase().includes('invalid')) {
            errorMessage = 'Неверный пароль';
            mascotMessage = 'Ой-ой! Кажется, пароль неправильный. Попробуйте ещё раз!';
          } else {
            errorMessage = serverMessage || 'Неверный email или пароль';
            mascotMessage = 'Эй, что-то не так! Проверьте email и пароль - один из них неверный.';
          }
        }
        
        console.log('Final messages:', { errorMessage, mascotMessage });
        
        // Определяем какие поля подсвечивать на основе ошибки
        const serverErrors: Record<string, boolean> = {};
        const lowerErrorMsg = errorMessage.toLowerCase();
        
        if (lowerErrorMsg.includes('email') || lowerErrorMsg.includes('пользователь') || lowerErrorMsg.includes('найден')) {
          serverErrors.email = true;
        }
        if (lowerErrorMsg.includes('пароль') || lowerErrorMsg.includes('password')) {
          serverErrors.password = true;
        }
        if (lowerErrorMsg.includes('возраст')) {
          serverErrors.age = true;
        }
        if (lowerErrorMsg.includes('город')) {
          serverErrors.city = true;
        }
        if (lowerErrorMsg.includes('имя')) {
          serverErrors.name = true;
        }

        console.log('Setting field errors:', serverErrors);
        setFieldErrors(serverErrors);
        
        console.log('Calling handleError with mascot message:', mascotMessage);
        handleError(mascotMessage);
        
        console.log('useAuthForm: Error handling completed successfully');
      } catch (handlingError) {
        console.error('Error while handling auth error:', handlingError);
        // Fallback обработка
        setFieldErrors({});
        handleError('Произошла ошибка. Попробуйте снова.');
      }
      
      console.groupEnd();
    }
  };

  return {
    formData,
    fieldErrors,
    isError,
    handleInputChange,
    handleSubmit,
    handleError
  };
};

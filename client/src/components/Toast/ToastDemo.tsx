import React from 'react';
import { toast } from '../../context/ToastContext';
import Button from '../Button/Button';
const ToastDemo: React.FC = () => {
  const showSuccessToast = () => {
    toast.success('Операция выполнена успешно!', 'Успех');
  };
  const showErrorToast = () => {
    toast.error('Произошла ошибка при выполнении операции', 'Ошибка');
  };
  const showWarningToast = () => {
    toast.warning('Внимание! Проверьте введенные данные', 'Предупреждение');
  };
  const showInfoToast = () => {
    toast.info('Новая функция доступна в настройках', 'Информация');
  };
  const showLongToast = () => {
    toast.info(
      'Это очень длинное уведомление, которое демонстрирует, как тостер обрабатывает большие объемы текста и правильно переносит строки.',
      'Длинное уведомление',
      8000
    );
  };
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '20px' }}>
      <Button onClick={showSuccessToast} variant="primary">
        Успех
      </Button>
      <Button onClick={showErrorToast} variant="secondary">
        Ошибка
      </Button>
      <Button onClick={showWarningToast} variant="outline">
        Предупреждение
      </Button>
      <Button onClick={showInfoToast} variant="ghost">
        Информация
      </Button>
      <Button onClick={showLongToast} variant="primary">
        Длинный тост
      </Button>
    </div>
  );
};
export default ToastDemo;


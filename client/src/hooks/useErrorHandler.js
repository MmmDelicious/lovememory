import { useNavigate } from 'react-router-dom';
export const useErrorHandler = () => {
  const navigate = useNavigate();
  const handleError = (error, customMessage = null) => {
    console.error('Error occurred:', error);
    let errorCode = 500;
    let errorMessage = customMessage || 'Произошла непредвиденная ошибка';
    if (error.response) {
      errorCode = error.response.status;
      switch (errorCode) {
        case 400:
          errorMessage = 'Неверный запрос';
          break;
        case 401:
          errorMessage = 'Необходима авторизация';
          break;
        case 403:
          errorMessage = 'Доступ запрещен';
          break;
        case 404:
          errorMessage = 'Страница не найдена';
          break;
        case 500:
          errorMessage = 'Ошибка сервера';
          break;
        default:
          errorMessage = error.response.data?.message || errorMessage;
      }
    } else if (error.request) {
      errorCode = 0;
      errorMessage = 'Проблемы с подключением к серверу';
    } else {
      errorMessage = error.message || errorMessage;
    }
    navigate('/error', { 
      state: { 
        errorCode, 
        errorMessage 
      },
      replace: true 
    });
  };
  return { handleError };
}; 

import React from 'react';
import ErrorPage from '../../pages/ErrorPage/ErrorPage';
import { logError } from '../../utils/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Обновляем состояние, чтобы следующий рендер показал fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Логируем ошибку
    logError(error, 'ErrorBoundary');
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Сохраняем информацию об ошибке в состоянии
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Можно рендерить любой кастомный fallback UI
      return (
        <ErrorPage 
          errorCode={500}
          errorMessage="Что-то пошло не так. Попробуйте обновить страницу."
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
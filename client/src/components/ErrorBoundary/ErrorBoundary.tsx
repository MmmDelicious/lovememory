import React, { Component, ReactNode, ErrorInfo } from 'react';
import ErrorPage from '../../pages/ErrorPage/ErrorPage';
import { logError } from '../../utils/errorHandler';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Обновляем состояние, чтобы следующий рендер показал fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Логируем ошибку
    logError(error, 'ErrorBoundary');
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Сохраняем информацию об ошибке в состоянии
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render(): ReactNode {
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

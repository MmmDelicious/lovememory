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
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logError(error, 'ErrorBoundary');
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }
  render(): ReactNode {
    if (this.state.hasError) {
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


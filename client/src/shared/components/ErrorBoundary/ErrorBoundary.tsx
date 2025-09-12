import React, { Component, ReactNode, ErrorInfo } from 'react';
import ErrorDisplay from '../ErrorDisplay/ErrorDisplay';
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
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }
  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          errorCode={500}
          errorMessage="Что-то пошло не так"
          errorDetails={this.state.error?.message}
          onRetry={() => window.location.reload()}
          onGoHome={() => window.location.href = '/dashboard'}
        />
      );
    }
    return this.props.children;
  }
}

export { ErrorBoundary };
export default ErrorBoundary;

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ErrorDisplay from '../../components/ErrorDisplay/ErrorDisplay';
const ErrorPage = ({ errorCode = 404, errorMessage = 'Страница не найдена' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorInfo, setErrorInfo] = useState({ 
    errorCode, 
    errorMessage,
    errorDetails: null 
  });
  useEffect(() => {
    const state = location.state;
    if (state?.errorCode || state?.errorMessage || state?.errorDetails) {
      setErrorInfo({
        errorCode: state.errorCode || errorCode,
        errorMessage: state.errorMessage || errorMessage,
        errorDetails: state.errorDetails || null
      });
      return;
    }
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      try {
        const parsedError = JSON.parse(decodeURIComponent(errorParam));
        setErrorInfo({
          errorCode: parsedError.errorCode || errorCode,
          errorMessage: parsedError.errorMessage || errorMessage,
          errorDetails: parsedError.errorDetails || null
        });
      } catch (e) {
        console.error('Failed to parse error from URL:', e);
        setErrorInfo({ 
          errorCode, 
          errorMessage,
          errorDetails: null 
        });
      }
    }
  }, [location, errorCode, errorMessage]);
  const handleGoHome = () => {
    navigate('/dashboard');
  };
  const handleRetry = () => {
    window.location.reload();
  };
  return (
    <ErrorDisplay
      errorCode={errorInfo.errorCode}
      errorMessage={errorInfo.errorMessage}
      errorDetails={errorInfo.errorDetails}
      onRetry={handleRetry}
      onGoHome={handleGoHome}
    />
  );
};
export default ErrorPage; 

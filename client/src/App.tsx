import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ToastProvider } from './context/ToastContext';
import { MascotProvider } from './context/MascotContext';
import AppRoutes from './AppRoutes';
import GlobalMascot from './components/GlobalMascot/GlobalMascot';
import AIChatInterface from './components/AIChatInterface/AIChatInterface';
import { setupGlobalErrorHandler } from './utils/errorHandler';
import { useAuthActions, useCurrencyActions } from './store/hooks';
import { getAuthToken, clearAuthToken } from './services/api';
import { authService } from './services';

const AppInitializer: React.FC = () => {
  const { setUser, setLoading } = useAuthActions();
  const { setCoins, resetCurrency } = useCurrencyActions();

  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      
      const token = getAuthToken();
      
      if (token) {
        try {
          const userData = await authService.getMe();
          
          setUser({
            ...userData,
            token: token
          });
          
          if (userData.coins !== undefined && userData.coins !== null) {
            setCoins(userData.coins);
          } else {
            setCoins(1000);
          }
        } catch (error) {
          console.warn('Failed to get user info during app init:', error);
          clearAuthToken();
          resetCurrency();
        }
      }
      
      setLoading(false);
    };

    checkAuthStatus();
  }, [setUser, setCoins, setLoading, resetCurrency]);

  return null;
};

const App: React.FC = () => {
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  return (
    <Provider store={store}>
      <ToastProvider>
        <MascotProvider>
          <Router>
            <AppInitializer />
            <GlobalMascot />
            <AIChatInterface />
            <AppRoutes />
          </Router>
        </MascotProvider>
      </ToastProvider>
    </Provider>
  );
};

export default App;


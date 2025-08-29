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

const AppInitializer: React.FC = () => {
  const { setUser, setLoading } = useAuthActions();
  const { setCoins, resetCurrency } = useCurrencyActions();

  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/auth/me`;
          const response = await fetch(apiUrl, {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            
            setUser({
              ...userData,
              token: token
            });
            
            if (userData.coins !== undefined && userData.coins !== null) {
              setCoins(userData.coins);
            } else {
              setCoins(1000);
            }
          } else {
            localStorage.removeItem('authToken');
            resetCurrency();
          }
        } catch (error) {
          localStorage.removeItem('authToken');
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


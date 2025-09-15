import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ToastProvider } from './context/ToastContext';
import { MascotProvider } from './context/MascotContext';
import AppRoutes from './AppRoutes';
import GlobalMascot from './shared/mascot/GlobalMascot/GlobalMascot';
import AIChatInterface from './modules/ai/components/AIChatInterface/AIChatInterface';
import { useAuthActions } from './store/hooks';
import { authService } from './modules/auth';

const AppInitializer: React.FC = () => {
  const { setUser, setLoading } = useAuthActions();

  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      
      try {
        // Всегда проверяем сервер независимо от localStorage
        // так как токен теперь в httpOnly cookie
        const userData = await authService.getMe();
        
        setUser(userData);
      } catch (error) {
        // Это нормальное поведение когда пользователь не авторизован
        // httpOnly cookie управляется сервером автоматически
        console.log('[Auth] User not authenticated - this is normal');
      }
      
      setLoading(false);
    };

    checkAuthStatus();
  }, [setUser, setLoading]);

  return null;
};

const App: React.FC = () => {

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


import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ToastProvider } from './context/ToastContext';
import { MascotProvider } from './context/MascotContext';
import AppRoutes from './AppRoutes';
import GlobalMascot from './components/GlobalMascot/GlobalMascot';
import AIChatInterface from './components/AIChatInterface/AIChatInterface';
// import { setupGlobalErrorHandler } from './utils/errorHandler'; // Уже инициализирован в main.tsx
import { useAuthActions, useCurrencyActions } from './store/hooks';
import { clearAuthToken } from './services/api';
import { authService } from './services';

const AppInitializer: React.FC = () => {
  const { setUser, setLoading } = useAuthActions();
  const { setCoins, resetCurrency } = useCurrencyActions();

  useEffect(() => {
    // ВРЕМЕННО ОТКЛЮЧЕНО ДЛЯ ТЕСТИРОВАНИЯ - см. AUTH_DISABLE.md для возврата
    // const checkAuthStatus = async () => {
    //   setLoading(true);
    //   
    //   try {
    //     // Всегда проверяем сервер независимо от localStorage
    //     // так как токен теперь в httpOnly cookie
    //     const userData = await authService.getMe();
    //     
    //     setUser(userData);
    //     
    //     if (userData.coins !== undefined && userData.coins !== null) {
    //       setCoins(userData.coins);
    //     } else {
    //       setCoins(1000);
    //     }
    //   } catch (error) {
    //     // Это нормальное поведение когда пользователь не авторизован
    //     // Очищаем только localStorage, httpOnly cookie управляется сервером
    //     clearAuthToken();
    //     resetCurrency();
    //   }
    //   
    //   setLoading(false);
    // };

    // checkAuthStatus();
    
    // ТЕСТОВАЯ ЗАГЛУШКА: устанавливаем фейкового пользователя
    setLoading(true);
    setTimeout(() => {
      setUser({
        id: 'test-user-id',
        email: 'test@example.com',
        first_name: 'Тест',
        last_name: 'Пользователь'
      });
      setCoins(1000);
      setLoading(false);
    }, 1000);
  }, [setUser, setCoins, setLoading, resetCurrency]);

  return null;
};

const App: React.FC = () => {
  // setupGlobalErrorHandler() уже вызван в main.tsx

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


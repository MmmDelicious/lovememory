import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ToastProvider } from './context/ToastContext';
import AppRoutes from './AppRoutes';
import GlobalMascot from './components/GlobalMascot/GlobalMascot';
import AIChatInterface from './components/AIChatInterface/AIChatInterface';
import { setupGlobalErrorHandler } from './utils/errorHandler';
import { useAuthActions, useCurrencyActions } from './store/hooks';

// Компонент для инициализации данных
const AppInitializer: React.FC = () => {
  const { setUser, setLoading } = useAuthActions();
  const { setCoins } = useCurrencyActions();

  useEffect(() => {
    // Проверяем, есть ли сохраненный токен в localStorage
    const checkAuthStatus = async () => {
      setLoading(true); // 🔥 ВАЖНО: Устанавливаем загрузку!
      
      const token = localStorage.getItem('authToken');
      console.log('🔍 Проверяем токен:', token ? 'Есть' : 'Нет');
      
      if (token) {
        try {
          const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/auth/me`;
          console.log('🌐 Вызываем API:', apiUrl);
          console.log('🔑 Токен:', token.substring(0, 20) + '...');
          
          // Пытаемся получить данные пользователя по токену
          const response = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('📡 Ответ сервера:', response.status, response.statusText);
          
          if (response.ok) {
            const userData = await response.json();
            console.log('✅ Получили данные пользователя:', userData);
            
            setUser({
              ...userData,
              token: token
            });
            
            // Правильно устанавливаем монеты
            if (userData.coins !== undefined) {
              console.log('💰 Устанавливаем монеты в Redux:', userData.coins);
              setCoins(userData.coins);
            } else {
              console.log('⚠️ Монеты не найдены в данных пользователя');
              setCoins(0);
            }
            
            console.log('✅ Пользователь установлен в Redux store');
          } else {
            // Токен недействителен, удаляем его
            console.log('❌ Токен недействителен, удаляем');
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.error('💥 Ошибка проверки аутентификации:', error);
          localStorage.removeItem('authToken');
        }
      } else {
        console.log('⚠️ Токен отсутствует в localStorage');
      }
      
      // 🔥 ВАЖНО: Завершаем загрузку в любом случае
      setLoading(false);
    };

    checkAuthStatus();
  }, [setUser, setCoins, setLoading]);

  return null;
};

const App: React.FC = () => {
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  return (
    <Provider store={store}>
      <ToastProvider>
        <Router>
          <AppInitializer />
          <GlobalMascot />
          <AIChatInterface />
          <AppRoutes />
        </Router>
      </ToastProvider>
    </Provider>
  );
};

export default App;


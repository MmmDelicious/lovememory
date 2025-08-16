import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AIMascotProvider } from './context/AIMascotContext';
import { EventMascotProvider } from './context/EventMascotContext';
import { CurrencyProvider } from './context/CurrencyContext';
import AppRoutes from './AppRoutes';
import GlobalMascot from './components/GlobalMascot/GlobalMascot';
import AIChatInterface from './components/AIChatInterface/AIChatInterface';
import { setupGlobalErrorHandler } from './utils/errorHandler';

const App: React.FC = () => {
  useEffect(() => {
    // Инициализируем глобальный обработчик ошибок
    setupGlobalErrorHandler();
  }, []);

  return (
    <AuthProvider>
      <CurrencyProvider>
        <AIMascotProvider>
          <EventMascotProvider>
            <Router>
              <GlobalMascot />
              <AIChatInterface />
              <AppRoutes />
            </Router>
          </EventMascotProvider>
        </AIMascotProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
};

export default App;

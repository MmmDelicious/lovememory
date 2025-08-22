import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AIMascotProvider } from './context/AIMascotContext';
import { EventMascotProvider } from './context/EventMascotContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ToastProvider } from './context/ToastContext';
import AppRoutes from './AppRoutes';
import GlobalMascot from './components/GlobalMascot/GlobalMascot';
import AIChatInterface from './components/AIChatInterface/AIChatInterface';
import { setupGlobalErrorHandler } from './utils/errorHandler';
const App: React.FC = () => {
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);
  return (
    <ToastProvider>
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
    </ToastProvider>
  );
};
export default App;


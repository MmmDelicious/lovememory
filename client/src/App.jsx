import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
// ИСПРАВЛЕНИЕ: MascotProvider импортируется как именованный экспорт (в фигурных скобках)
import { MascotProvider } from './context/MascotContext';
import { CurrencyProvider } from './context/CurrencyContext';
import AppRoutes from './AppRoutes';
import GlobalMascot from './components/GlobalMascot/GlobalMascot';
import AIChatInterface from './components/AIChatInterface/AIChatInterface';
import './App.css';

function App() {
  return (
    <MascotProvider>
      <AuthProvider>
        <CurrencyProvider>
          <Router>
            <GlobalMascot />
            <AIChatInterface />
            <AppRoutes />
          </Router>
        </CurrencyProvider>
      </AuthProvider>
    </MascotProvider>
  );
}

export default App;
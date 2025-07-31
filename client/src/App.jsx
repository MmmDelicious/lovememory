import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MascotProvider } from './context/MascotContext';
import { CurrencyProvider } from './context/CurrencyContext';
import AppRoutes from './AppRoutes';
import GlobalMascot from './components/GlobalMascot/GlobalMascot';
import AIChatInterface from './components/AIChatInterface/AIChatInterface';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <MascotProvider>
          <Router>
            <GlobalMascot />
            <AIChatInterface />
            <AppRoutes />
          </Router>
        </MascotProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
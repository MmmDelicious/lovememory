import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import DayDetailPage from './pages/DayDetailPage/DayDetailPage';
import PairingPage from './pages/PairingPage/PairingPage';
import { GamesPage } from './pages/GamesPage/GamesPage';
import GameLobbyPage from './pages/GameLobbyPage/GameLobbyPage';
import GameRoomPage from './pages/GameRoomPage/GameRoomPage';
import LoveVegasPage from './pages/LoveVegasPage';
import PokerPage from './pages/PokerPage';
import Header from './components/Header/Header';
import { CurrencyProvider } from './context/CurrencyContext';
import './App.css';

const MainLayout = () => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
    <Header />
    <main className="mainContent">
      <Outlet />
    </main>
  </div>
);

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      
      <Route element={user ? <CurrencyProvider><MainLayout /></CurrencyProvider> : <Navigate to="/login" />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/day/:date" element={<DayDetailPage />} />
        <Route path="/pairing" element={<PairingPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/:gameType" element={<GameLobbyPage />} />
        <Route path="/games/room/:roomId" element={<GameRoomPage />} />
        <Route path="/love-vegas" element={<LoveVegasPage />} />
        <Route path="/love-vegas/poker" element={<GameLobbyPage gameType="poker" />} />
      </Route>
      
      {/* Полноэкранная покерная страница без хедера */}
      <Route 
        path="/love-vegas/poker/:roomId" 
        element={user ? <CurrencyProvider><PokerPage /></CurrencyProvider> : <Navigate to="/login" />} 
      />
      
      <Route 
        path="*" 
        element={<Navigate to={user ? "/dashboard" : "/login"} />} 
      />
    </Routes>
  );
};

export default AppRoutes;
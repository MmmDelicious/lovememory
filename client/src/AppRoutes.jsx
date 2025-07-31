import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import MainLayout from './layouts/MainLayout/MainLayout';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import PairingPage from './pages/PairingPage/PairingPage';
import { GamesPage } from './pages/GamesPage/GamesPage';
import GameLobbyPage from './pages/GameLobbyPage/GameLobbyPage';
import GameRoomPage from './pages/GameRoomPage/GameRoomPage';
import LoveVegasPage from './pages/LoveVegasPage/LoveVegasPage';
import PokerPage from './pages/PokerPage/PokerPage';

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pairing" element={<PairingPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/:gameType" element={<GameLobbyPage />} />
        <Route path="/games/room/:roomId" element={<GameRoomPage />} />
        <Route path="/love-vegas" element={<LoveVegasPage />} />
        <Route path="/love-vegas/poker" element={<GameLobbyPage gameType="poker" />} />
      </Route>
      
      <Route path="/love-vegas/poker/:roomId" element={<PokerPage />} />
      
      <Route path="/login" element={<Navigate to="/dashboard" />} />
      <Route path="/register" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

export default AppRoutes;
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import MainLayout from './layouts/MainLayout/MainLayout';
import GameLayout from './layouts/GameLayout/GameLayout';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import DayDetailPage from './pages/DayDetailPage/DayDetailPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import GamesPage from './pages/GamesPage/GamesPage';
import GameLobbyPage from './pages/GameLobbyPage/GameLobbyPage';
import InsightsPage from './pages/InsightsPage/InsightsPage.tsx';
import GameRoomPage from './pages/GameRoomPage/GameRoomPage';
import PokerPage from './pages/PokerPage/PokerPage';
import ErrorPage from './pages/ErrorPage/ErrorPage';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import ErrorTest from './components/ErrorTest/ErrorTest';
import ErrorDemo from './components/ErrorDemo/ErrorDemo';
import AuthCallbackPage from './pages/AuthCallbackPage/AuthCallbackPage';

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:gameType" element={<GameLobbyPage />} />
          <Route path="/day/:date" element={<DayDetailPage />} />
        </Route>
        
        <Route element={<GameLayout />}>
          <Route path="/games/room/:roomId" element={<GameRoomPage />} />
          <Route path="/games/poker/:roomId" element={<PokerPage />} />
        </Route>
        
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/error-test" element={<ErrorTest />} />
        <Route path="/error-demo" element={<ErrorDemo />} />
        
        <Route path="/login" element={<Navigate to="/dashboard" />} />
        <Route path="/register" element={<Navigate to="/dashboard" />} />
        <Route path="/auth/callback" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default AppRoutes;
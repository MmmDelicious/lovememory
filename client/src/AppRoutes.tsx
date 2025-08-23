import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser, useAuthLoading } from './store/hooks';

import MainLayout from './layouts/MainLayout/MainLayout';
import GameLayout from './layouts/GameLayout/GameLayout';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import DayDetailPage from './pages/DayDetailPage/DayDetailPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import GamesPage from './pages/GamesPage/GamesPage';
import LessonsPage from './pages/LessonsPage/LessonsPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { TournamentPage } from './pages/TournamentPage/TournamentPage';

import GameLobbyPage from './pages/GameLobbyPage/GameLobbyPage';
import InsightsPage from './pages/InsightsPage/InsightsPage';
import ShopPage from './pages/ShopPage/ShopPage';
import GameRoomPage from './pages/GameRoomPage/GameRoomPage';
import PokerPage from './pages/PokerPage/PokerPage';
import ErrorPage from './pages/ErrorPage/ErrorPage';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

import AuthCallbackPage from './pages/AuthCallbackPage/AuthCallbackPage';

const AppRoutes: React.FC = () => {
  const user = useUser();
  const isLoading = useAuthLoading();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--color-background, #f5f5f5)',
        fontSize: '18px',
        color: 'var(--color-text, #333)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            marginBottom: '16px',
            fontSize: '48px'
          }}>💕</div>
          <div>Загрузка LoveMemory...</div>
        </div>
      </div>
    );
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
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:gameType" element={<GameLobbyPage />} />
          <Route path="/games/tournaments" element={<TournamentsPage />} />
          <Route path="/tournaments/:id" element={<TournamentPage />} />
          <Route path="/lessons" element={<LessonsPage />} />
          <Route path="/day/:date" element={<DayDetailPage />} />
        </Route>
        
        <Route element={<GameLayout />}>
          <Route path="/games/room/:roomId" element={<GameRoomPage />} />
          <Route path="/games/poker/:roomId" element={<PokerPage />} />
        </Route>
        
        <Route path="/error" element={<ErrorPage />} />

        
        <Route path="/login" element={<Navigate to="/dashboard" />} />
        <Route path="/register" element={<Navigate to="/dashboard" />} />
        <Route path="/auth/callback" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default AppRoutes;

import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppRoutesData } from './store/hooks';

import MainLayout from './shared/layout/MainLayout/MainLayout';
import GameLayout from './shared/layout/GameLayout/GameLayout';
import { ErrorBoundary } from './shared/components/ErrorBoundary/ErrorBoundary';

// Lazy loading для основных страниц
const AuthPage = React.lazy(() => import('./modules/auth/pages/AuthPage/AuthPage'));
// const AboutPage = React.lazy(() => import('./pages/AboutPage')); // TODO: Create AboutPage or find it
const DashboardPage = React.lazy(() => import('./modules/dashboard/pages/DashboardPage/DashboardPage'));
const DayDetailPage = React.lazy(() => import('./modules/events/pages/DayDetailPage/DayDetailPage'));
const ProfilePage = React.lazy(() => import('./modules/users/pages/ProfilePage/ProfilePage'));
const GamesPage = React.lazy(() => import('./modules/games/pages/GamesPage/GamesPage'));
const LessonsPage = React.lazy(() => import('./modules/education/pages/LessonsPage/LessonsPage'));
const TournamentsPage = React.lazy(() => import('./modules/games/pages/TournamentsPage/TournamentsPage'));
const TournamentPage = React.lazy(() => import('./modules/games/pages/TournamentPage/TournamentPage'));

const GameLobbyPage = React.lazy(() => import('./modules/games/pages/GameLobbyPage/GameLobbyPage'));
const GameRoomPage = React.lazy(() => import('./modules/games/pages/GameRoomPage/GameRoomPage'));
const PokerPage = React.lazy(() => import('./modules/games/pages/PokerPage/PokerPage'));
// const ErrorPage = React.lazy(() => import('./pages/ErrorPage/ErrorPage')); // TODO: Create ErrorPage

const AuthCallbackPage = React.lazy(() => import('./modules/auth/pages/AuthCallbackPage/AuthCallbackPage'));
const OnboardingInterestsPage = React.lazy(() => import('./modules/users/pages/OnboardingInterestsPage/OnboardingInterestsPage'));

// Компонент загрузки
const LoadingFallback = () => (
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
      <div>Загрузка...</div>
    </div>
  </div>
);

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAppRoutesData();

  // Показываем загрузку пока определяется статус аутентификации
  // Это предотвращает преждевременные редиректы
  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* <Route path="/about" element={<AboutPage />} /> */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            {/* <Route path="/error" element={<ErrorPage />} /> */}
            <Route path="/" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/about" />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Онбординг интересов - без основного лэйаута */}
          <Route path="/onboarding/interests" element={<OnboardingInterestsPage />} />
          
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
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
          
          {/* <Route path="/error" element={<ErrorPage />} /> */}

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth/callback" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;

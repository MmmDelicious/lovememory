import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppRoutesData } from './store/hooks';

import MainLayout from './layouts/MainLayout/MainLayout';
import GameLayout from './layouts/GameLayout/GameLayout';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// Lazy loading для основных страниц
const AuthPage = React.lazy(() => import('./pages/AuthPage/AuthPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage/DashboardPage'));
const DayDetailPage = React.lazy(() => import('./pages/DayDetailPage/DayDetailPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage/ProfilePage'));
const GamesPage = React.lazy(() => import('./pages/GamesPage/GamesPage'));
const LessonsPage = React.lazy(() => import('./pages/LessonsPage/LessonsPage'));
const TournamentsPage = React.lazy(() => import('./pages/TournamentsPage').then(module => ({ default: module.TournamentsPage })));
const TournamentPage = React.lazy(() => import('./pages/TournamentPage/TournamentPage').then(module => ({ default: module.TournamentPage })));

const GameLobbyPage = React.lazy(() => import('./pages/GameLobbyPage/GameLobbyPage'));
const InsightsPage = React.lazy(() => import('./pages/InsightsPage/InsightsPage'));
const ShopPage = React.lazy(() => import('./pages/ShopPage/ShopPage'));
const GameRoomPage = React.lazy(() => import('./pages/GameRoomPage/GameRoomPage'));
const PokerPage = React.lazy(() => import('./pages/PokerPage/PokerPage'));
const ErrorPage = React.lazy(() => import('./pages/ErrorPage/ErrorPage'));

const AuthCallbackPage = React.lazy(() => import('./pages/AuthCallbackPage/AuthCallbackPage'));
const OnboardingInterestsPage = React.lazy(() => import('./pages/OnboardingInterestsPage/OnboardingInterestsPage'));

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

  // ВРЕМЕННО ОТКЛЮЧЕНО ДЛЯ ТЕСТИРОВАНИЯ - см. AUTH_DISABLE.md для возврата
  // if (!user) {
  //   return (
  //     <ErrorBoundary>
  //       <Suspense fallback={<LoadingFallback />}>
  //         <Routes>
  //           <Route path="/about" element={<AboutPage />} />
  //           <Route path="/login" element={<AuthPage />} />
  //           <Route path="/register" element={<AuthPage />} />
  //           <Route path="/auth/callback" element={<AuthCallbackPage />} />
  //           <Route path="/error" element={<ErrorPage />} />
  //           <Route path="/" element={<AboutPage />} />
  //           <Route path="*" element={<Navigate to="/about" />} />
  //         </Routes>
  //       </Suspense>
  //     </ErrorBoundary>
  //   );
  // }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Онбординг интересов - без основного лэйаута */}
          <Route path="/onboarding/interests" element={<OnboardingInterestsPage />} />
          
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

          {/* ВРЕМЕННОЕ ИЗМЕНЕНИЕ: добавляем About страницу доступную всегда */}
          <Route path="/about" element={<AboutPage />} />
          
          <Route path="/" element={<Navigate to="/about" replace />} />
          <Route path="/login" element={<Navigate to="/about" replace />} />
          <Route path="/register" element={<Navigate to="/about" replace />} />
          <Route path="/auth/callback" element={<Navigate to="/about" replace />} />
          <Route path="*" element={<Navigate to="/about" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;

import { lazy } from 'react';

// Ленивая загрузка тяжёлых страниц и компонентов
export const LazyLessonsPage = lazy(() => import('../pages/LessonsPage/LessonsPage'));
export const LazyInsightsPage = lazy(() => import('../pages/InsightsPage/InsightsPage'));
export const LazyPokerPage = lazy(() => import('../pages/PokerPage/PokerPage'));
export const LazyChessGameEnhanced = lazy(() => import('../components/ChessGame/ChessGameEnhanced'));
export const LazyPokerTable = lazy(() => import('../components/PokerGame/PokerTable'));
export const LazyDateGeneratorModal = lazy(() => import('../components/DateGeneratorModal/DateGeneratorModal'));


// Компонент загрузчика
export const ComponentLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    color: 'var(--color-text-secondary)'
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid var(--color-border)',
        borderTop: '3px solid var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span>Загрузка...</span>
    </div>
  </div>
);

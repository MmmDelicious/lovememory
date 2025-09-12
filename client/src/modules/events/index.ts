// Events module exports

// Pages (тонкие страницы)
export { default as DayDetailPage } from './pages/DayDetailPage/DayDetailPage';
export { default as CalendarPage } from './pages/CalendarPage/CalendarPage';

// Modules (самостоятельные модули с бизнес-логикой)
export * from './modules';

// Legacy exports (будут удалены после cleanup)
export { default as Calendar } from './components/Calendar/Calendar';
export { default as EventTemplateModal } from './components/EventTemplateModal/EventTemplateModal';

// Hooks
// export { useDayStory } from './hooks/useDayStory'; // LEGACY - будет переделан
export { useEvents } from './hooks/useEvents';
export { useEventTemplates } from './hooks/useEventTemplates';
export { useCalendar } from './hooks/useCalendar';
export { useDayDetail } from './hooks/useDayDetail';
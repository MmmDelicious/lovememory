// Education module exports

// Pages (тонкие страницы)
export { default as LessonsPage } from './pages/LessonsPage/LessonsPage';

// Modules (самостоятельные модули с бизнес-логикой)
export * from './modules';

// Legacy exports (будут удалены после cleanup)
export { default as DailyLesson } from './components/DailyLesson/DailyLesson';
export { default as ThemesTab } from './components/ThemesTab/ThemesTab'
export { default as TodayTab } from './components/TodayTab/TodayTab'

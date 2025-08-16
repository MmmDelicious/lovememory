import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { setupGlobalErrorHandler } from './utils/errorHandler'

// Настраиваем глобальный обработчик ошибок
setupGlobalErrorHandler();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(
  <App />
)

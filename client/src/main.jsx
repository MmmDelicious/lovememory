import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { setupGlobalErrorHandler } from './utils/errorHandler'

// Настраиваем глобальный обработчик ошибок
setupGlobalErrorHandler();

createRoot(document.getElementById('root')).render(
  <App />
)

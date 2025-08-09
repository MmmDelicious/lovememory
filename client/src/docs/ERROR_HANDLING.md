# 🚨 Система обработки ошибок

## Обзор

Новая система обработки ошибок предоставляет красивый и информативный интерфейс для отображения различных типов ошибок с использованием Lottie анимаций.

## 🎯 Основные возможности

- **Красивые Lottie анимации** для разных типов ошибок
- **Детальная информация** об ошибках с возможностью просмотра стека
- **Адаптивный дизайн** для всех устройств
- **Поддержка темной темы**
- **Автоматическое логирование** ошибок
- **Удобные утилиты** для вызова ошибок из компонентов

## 📁 Структура файлов

```
src/
├── components/
│   ├── ErrorDisplay/
│   │   ├── ErrorDisplay.jsx          # Основной компонент отображения ошибок
│   │   └── ErrorDisplay.module.css   # Стили компонента
│   ├── ErrorDemo/
│   │   ├── ErrorDemo.jsx             # Демо-страница
│   │   └── ErrorDemo.module.css      # Стили демо
│   └── ErrorTest/
│       ├── ErrorTest.jsx             # Тестовая страница
│       └── ErrorTest.module.css      # Стили тестов
├── pages/
│   └── ErrorPage/
│       └── ErrorPage.jsx             # Страница ошибок
├── utils/
│   └── errorHandler.js               # Глобальный обработчик и утилиты
└── assets/
    ├── Worker404.json                # Lottie анимация для 404
    └── Worker500.json                # Lottie анимация для 500+
```

## 🚀 Использование

### Глобальный обработчик

Глобальный обработчик автоматически инициализируется в `App.jsx`:

```javascript
import { setupGlobalErrorHandler } from './utils/errorHandler';

useEffect(() => {
  setupGlobalErrorHandler();
}, []);
```

### Утилиты для вызова ошибок

```javascript
import { 
  showError, 
  showNetworkError, 
  showServerError, 
  showNotFoundError, 
  showAuthError, 
  showPermissionError 
} from './utils/errorHandler';

// Кастомная ошибка
showError(418, 'Я чайник!', {
  message: 'Кастомное сообщение',
  type: 'Custom Error',
  details: 'Дополнительные детали'
});

// Сетевая ошибка
showNetworkError();

// Ошибка сервера
showServerError({
  message: 'Ошибка сервера',
  type: 'Server Error',
  details: 'Детали ошибки'
});

// Ошибка 404
showNotFoundError('ресурс');

// Ошибка авторизации
showAuthError();

// Ошибка доступа
showPermissionError();
```

### Компонент ErrorDisplay

```javascript
import ErrorDisplay from './components/ErrorDisplay/ErrorDisplay';

<ErrorDisplay
  errorCode={404}
  errorMessage="Страница не найдена"
  errorDetails={{
    message: "Детали ошибки",
    stack: "Стек ошибки"
  }}
  onRetry={() => window.location.reload()}
  onGoHome={() => navigate('/dashboard')}
/>
```

## 🎨 Lottie анимации

Система автоматически выбирает подходящую анимацию:

- **Worker404.json** - для ошибок 4xx (404, 403, 401)
- **Worker500.json** - для ошибок 5xx (500, 502, 503)

## 📱 Адаптивность

Система полностью адаптивна и корректно отображается на:
- Десктопах
- Планшетах
- Мобильных устройствах

## 🌙 Темная тема

Автоматическая поддержка темной темы через CSS media queries:

```css
@media (prefers-color-scheme: dark) {
  /* Стили для темной темы */
}
```

## 🧪 Тестирование

### Демо-страница
Перейдите на `/error-demo` для интерактивной демонстрации всех возможностей.

### Тестовая страница
Перейдите на `/error-test` для тестирования различных типов ошибок.

## 📊 Логирование

Все ошибки автоматически логируются с информацией:
- Сообщение ошибки
- Стек ошибки
- Контекст
- Временная метка
- User Agent
- URL страницы

## 🔧 Настройка

### Добавление новых типов ошибок

1. Добавьте новый case в `getErrorTitle()` и `getErrorDescription()` в `ErrorDisplay.jsx`
2. Создайте соответствующую Lottie анимацию
3. Добавьте утилиту в `errorHandler.js`

### Кастомизация стилей

Все стили находятся в CSS модулях и легко настраиваются:
- `ErrorDisplay.module.css` - основные стили
- `ErrorDemo.module.css` - стили демо-страницы
- `ErrorTest.module.css` - стили тестовой страницы

## 🚨 Типы обрабатываемых ошибок

- **JavaScript ошибки** - необработанные исключения
- **Promise rejections** - отклонения промисов
- **Сетевые ошибки** - отсутствие интернета
- **Ошибки загрузки ресурсов** - скрипты, стили
- **HTTP ошибки** - 401, 403, 404, 500, 502, 503
- **Кастомные ошибки** - любые коды ошибок

## 📈 Мониторинг

Для добавления мониторинга ошибок раскомментируйте и настройте в `logError()`:

```javascript
// sendToErrorService(errorInfo);
```

## 🔄 Обработка ошибок в компонентах

```javascript
try {
  // Ваш код
} catch (error) {
  showError(500, 'Ошибка операции', {
    message: error.message,
    stack: error.stack,
    context: 'Component Name'
  });
}
```

## 🎯 Лучшие практики

1. **Всегда передавайте контекст** при вызове ошибок
2. **Используйте подходящие коды ошибок**
3. **Предоставляйте полезные сообщения** для пользователей
4. **Логируйте детали** для разработчиков
5. **Тестируйте обработку ошибок** регулярно 
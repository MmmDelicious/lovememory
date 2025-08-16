# Полная структура файлов проекта LoveMemory

## 📁 Корневая папка
```
lovememory/
├── .git/                          # Git репозиторий
├── .github/                       # GitHub Actions и конфигурация
├── .husky/                        # Git hooks
├── .gitignore                     # Игнорируемые файлы Git
├── package.json                   # Корневой package.json
├── package-lock.json              # Lock файл зависимостей
├── node_modules/                  # Корневые node_modules
├── server/                        # Серверная часть
├── client/                        # Веб-клиент
└── mobile/                        # Мобильное приложение
```

## 🖥️ Серверная часть (server/)
```
server/
├── 📁 config/                     # Конфигурационные файлы
├── 📁 controllers/                # Контроллеры API
│   ├── ai.controller.js           # AI контроллер
│   ├── auth.controller.js         # Аутентификация
│   ├── event.controller.js        # События
│   ├── eventTemplate.controller.js # Шаблоны событий
│   ├── game.controller.js         # Игры
│   ├── gift.controller.js         # Подарки
│   ├── pair.controller.js         # Пары
│   └── user.controller.js         # Пользователи
├── 📁 gameLogic/                  # Логика игр
├── 📁 logs/                       # Логи сервера
├── 📁 middleware/                 # Middleware функции
├── 📁 migrations/                 # Миграции базы данных
├── 📁 models/                     # Модели данных
│   ├── Event.js                   # Модель событий
│   ├── EventTemplate.js           # Модель шаблонов событий
│   ├── GameRoom.js                # Модель игровых комнат
│   ├── Gift.js                    # Модель подарков
│   ├── index.js                   # Индекс моделей
│   ├── Media.js                   # Модель медиа
│   ├── Pair.js                    # Модель пар
│   └── User.js                    # Модель пользователей
├── 📁 routes/                     # Маршруты API
│   ├── ai.routes.js               # AI маршруты
│   ├── auth.routes.js             # Аутентификация
│   ├── event.routes.js            # События
│   ├── eventTemplate.routes.js    # Шаблоны событий
│   ├── game.routes.js             # Игры
│   ├── gift.routes.js             # Подарки
│   ├── index.js                   # Главный роутер
│   ├── media.routes.js            # Медиа
│   ├── pair.routes.js             # Пары
│   └── user.routes.js             # Пользователи
├── 📁 scripts/                    # Скрипты
├── 📁 services/                   # Сервисы
├── 📁 socket/                     # Socket.io логика
├── 📁 uploads/                    # Загруженные файлы
├── 📁 utils/                      # Утилиты
├── 📁 node_modules/               # Зависимости сервера
├── eslint.config.mjs              # ESLint конфигурация
├── index.js                       # Главный файл сервера
├── package.json                   # Зависимости сервера
├── package-lock.json              # Lock файл сервера
├── test-auth.js                   # Тесты аутентификации
└── test-pair.js                   # Тесты пар
```

## 🌐 Веб-клиент (client/)
```
client/
├── 📁 dist/                       # Собранное приложение
├── 📁 node_modules/               # Зависимости клиента
├── 📁 public/                     # Публичные файлы
├── 📁 src/                        # Исходный код
│   ├── 📁 assets/                 # Статические ресурсы
│   ├── 📁 components/             # React компоненты
│   │   ├── 📁 AIChat/             # AI чат
│   │   ├── 📁 AIChatInterface/    # Интерфейс AI чата
│   │   ├── 📁 AIToggleButton/     # Кнопка переключения AI
│   │   ├── 📁 Avatar/             # Аватары
│   │   ├── 📁 Button/             # Кнопки
│   │   ├── 📁 Calendar/           # Календарь
│   │   ├── 📁 ChessGame/          # Шахматы
│   │   ├── 📁 CreateRoomModal/    # Модал создания комнаты
│   │   ├── 📁 DateGeneratorModal/ # Модал генерации дат
│   │   ├── 📁 DebugDataViewer/    # Просмотр отладочных данных
│   │   ├── 📁 ErrorBoundary/      # Границы ошибок
│   │   ├── 📁 ErrorDemo/          # Демо ошибок
│   │   ├── 📁 ErrorDisplay/       # Отображение ошибок
│   │   ├── 📁 ErrorTest/          # Тесты ошибок
│   │   ├── 📁 EventTemplateModal/ # Модал шаблонов событий
│   │   ├── 📁 FreeRoamMascot/     # Бродячий талисман
│   │   ├── 📁 GenderSelector/     # Выбор пола
│   │   ├── 📁 GiftDisplay/        # Отображение подарков
│   │   ├── 📁 GlobalMascot/       # Глобальный талисман
│   │   ├── 📁 Header/             # Заголовок
│   │   ├── 📁 InterceptedMascot/  # Перехваченный талисман
│   │   ├── 📁 LeaveGameButton/    # Кнопка выхода из игры
│   │   ├── 📁 LottieMascot/       # Lottie талисман
│   │   ├── 📁 MobileNavigation/   # Мобильная навигация
│   │   ├── 📁 Modal/              # Модальные окна
│   │   ├── 📁 NotificationDropdown/ # Выпадающий список уведомлений
│   │   ├── 📁 PlayingCard/        # Игральные карты
│   │   ├── 📁 PokerBuyInModal/    # Модал покупки фишек
│   │   ├── 📁 PokerGame/          # Покер
│   │   ├── 📁 PokerRebuyModal/    # Модал перепокупки
│   │   ├── 📁 PremiumModal/       # Премиум модал
│   │   ├── 📁 Profile/            # Профиль
│   │   ├── 📁 ProfileStats/       # Статистика профиля
│   │   ├── 📁 QuizGame/           # Викторина
│   │   ├── 📁 RadialMenu/         # Радиальное меню
│   │   ├── 📁 Sidebar/            # Боковая панель
│   │   ├── 📁 StaticMascot/       # Статичный талисман
│   │   ├── 📁 UI/                 # UI компоненты
│   │   ├── 📁 UserAvatar/         # Аватар пользователя
│   │   └── 📁 UserDropdown/       # Выпадающий список пользователя
│   ├── 📁 config/                 # Конфигурация
│   ├── 📁 context/                # React контексты
│   ├── 📁 docs/                   # Документация
│   ├── 📁 hooks/                  # React хуки
│   ├── 📁 layouts/                # Макеты страниц
│   ├── 📁 pages/                  # Страницы приложения
│   │   ├── 📁 AuthCallbackPage/   # Страница обратного вызова аутентификации
│   │   ├── 📁 DashboardPage/      # Главная страница
│   │   ├── 📁 DayDetailPage/      # Детали дня
│   │   ├── 📁 ErrorPage/          # Страница ошибок
│   │   ├── 📁 GameLobbyPage/      # Лобби игр
│   │   ├── 📁 GameRoomPage/       # Игровая комната
│   │   ├── 📁 GamesPage/          # Страница игр
│   │   ├── 📁 InsightsPage/       # Аналитика
│   │   ├── 📁 LoginPage/          # Страница входа
│   │   ├── 📁 MobileDashboard/    # Мобильная главная
│   │   ├── 📁 PokerPage/          # Страница покера
│   │   ├── 📁 ProfilePage/        # Страница профиля
│   │   ├── 📁 RegisterPage/       # Страница регистрации
│   │   ├── 📁 ShopPage/           # Магазин
│   │   └── 📁 WordlePage/         # Страница Wordle
│   ├── 📁 services/               # Сервисы
│   ├── 📁 styles/                 # Стили
│   ├── 📁 utils/                  # Утилиты
│   ├── App.tsx                    # Главный компонент приложения
│   ├── AppRoutes.tsx              # Маршруты приложения
│   ├── index.css                  # Глобальные стили
│   ├── index.d.ts                 # TypeScript определения
│   ├── main.tsx                   # Точка входа
│   ├── types.d.ts                 # Типы TypeScript
│   └── vite-env.d.ts              # Vite типы
├── 📁 types/                      # TypeScript типы
├── 📁 utils/                      # Утилиты клиента
├── .gitignore                     # Игнорируемые файлы
├── eslint.config.js               # ESLint конфигурация
├── index.html                     # HTML шаблон
├── package.json                   # Зависимости клиента
├── package-lock.json              # Lock файл клиента
├── README.md                      # Документация
├── tsconfig.json                  # TypeScript конфигурация
└── vite.config.js                 # Vite конфигурация
```

## 📱 Мобильное приложение (mobile/)
```
mobile/
├── 📁 .expo/                      # Expo конфигурация
├── 📁 app/                        # Основные экраны приложения
│   ├── 📁 (auth)/                 # Экран аутентификации
│   ├── 📁 (games)/                # Игровые экраны
│   ├── 📁 (tabs)/                 # Табы навигации
│   ├── +not-found.tsx             # Страница 404
│   └── _layout.tsx                # Главный макет
├── 📁 assets/                     # Ресурсы приложения
├── 📁 auth/                       # Аутентификация
├── 📁 components/                 # React компоненты
│   ├── MascotOverlay.tsx          # Оверлей талисмана
│   └── MascotOverlay.web.tsx      # Веб версия оверлея талисмана
├── 📁 context/                    # React контексты
├── 📁 games/                      # Игры
├── 📁 hooks/                      # React хуки
├── 📁 node_modules/               # Зависимости мобильного приложения
├── 📁 services/                   # Сервисы
├── 📁 styles/                     # Стили
├── 📁 tabs/                       # Табы
├── 📁 utils/                      # Утилиты
├── .gitignore                     # Игнорируемые файлы
├── .npmrc                         # NPM конфигурация
├── .prettierrc                    # Prettier конфигурация
├── app.json                       # Конфигурация Expo
├── expo-env.d.ts                  # Expo типы
├── layout.tsx                     # Макет
├── not-found.tsx                  # Страница не найдена
├── package.json                   # Зависимости мобильного приложения
├── package-lock.json              # Lock файл мобильного приложения
└── tsconfig.json                  # TypeScript конфигурация
```

## 📋 Основные файлы конфигурации

### Корневые файлы:
- `package.json` - Корневые зависимости и скрипты
- `.gitignore` - Игнорируемые Git файлы
- `.husky/` - Git hooks для автоматизации

### Серверные файлы:
- `server/index.js` - Точка входа сервера
- `server/package.json` - Зависимости сервера
- `server/eslint.config.mjs` - ESLint конфигурация

### Клиентские файлы:
- `client/package.json` - Зависимости веб-клиента
- `client/vite.config.js` - Конфигурация Vite
- `client/tsconfig.json` - TypeScript конфигурация
- `client/index.html` - HTML шаблон

### Мобильные файлы:
- `mobile/package.json` - Зависимости мобильного приложения
- `mobile/app.json` - Конфигурация Expo
- `mobile/tsconfig.json` - TypeScript конфигурация

## 🏗️ Архитектура проекта

### Серверная часть:
- **Express.js** - веб-фреймворк
- **Socket.io** - реальное время
- **MongoDB** - база данных
- **JWT** - аутентификация

### Веб-клиент:
- **React** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик
- **Socket.io-client** - клиент для реального времени

### Мобильное приложение:
- **React Native** - мобильная разработка
- **Expo** - платформа разработки
- **TypeScript** - типизация

## 🎯 Основные функции

1. **Аутентификация и авторизация**
2. **Управление парами пользователей**
3. **События и календарь**
4. **Игры (Покер, Шахматы, Wordle, Викторина)**
5. **AI чат и помощник**
6. **Подарки и магазин**
7. **Профили пользователей**
8. **Мобильное приложение**
9. **Реальное время через WebSocket**


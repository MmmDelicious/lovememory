# 🏗️ LoveMemory Frontend Architecture

## 📋 Принципы архитектуры

### 🎯 **Простота и понятность**
- Минимум абстракций
- Явные зависимости
- Предсказуемые пути импорта

### 🔧 **Разделение ответственности**
- **Pages** - только роутинг и композиция
- **Modules** - изолированная бизнес-логика 
- **Shared** - переиспользуемые компоненты

---

## 📁 Структура папок

```
src/
├── pages/              # 🎯 Простые страницы-роуты
│   ├── AuthPage.tsx    #   Только композиция компонентов
│   ├── DashboardPage.tsx
│   └── AboutPageSimple.tsx
│
├── modules/            # 🏢 Бизнес-модули (изолированные)
│   ├── auth/           #   Авторизация
│   ├── games/          #   Игры
│   ├── events/         #   События и календарь
│   ├── users/          #   Пользователи
│   └── education/      #   Уроки
│
├── shared/             # 🔄 Общие компоненты
│   ├── components/     #   UI-кит (Button, Avatar, etc.)
│   ├── layout/         #   Лейауты
│   ├── hooks/          #   Общие хуки
│   ├── utils/          #   Чистые функции
│   └── assets/         #   Статические ресурсы
│
├── store/              # 🏪 Глобальное состояние
│   ├── slices/         #   Redux слайсы
│   └── hooks.ts        #   Типизированные хуки
│
└── services/           # 🌐 API сервисы
    ├── api.js          #   Основной HTTP клиент
    └── *.service.js    #   Специфичные сервисы
```

---

## 🚫 Что ЗАПРЕЩЕНО

### ❌ **Кривые импорты**
```javascript
// ПЛОХО
import Button from '../../../shared/components/Button/Button'

// ХОРОШО  
import { Button } from '@/shared'
```

### ❌ **Дублирование сервисов**
```javascript
// ПЛОХО - один сервис в двух местах
/services/user.service.js
/modules/users/services/user.service.js

// ХОРОШО - один источник истины
/services/user.service.js
```

### ❌ **Умные компоненты**
```javascript
// ПЛОХО - логика в компоненте
const Calendar = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  // 500+ строк логики...
}

// ХОРОШО - логика в хуке
const Calendar = () => {
  const calendar = useCalendar(props)
  return <CalendarUI {...calendar} />
}
```

---

## ✅ Правила импорта

### 🎯 **Алиасы (настроены в vite.config.js)**
```javascript
@/             -> src/
@/shared       -> src/shared/
@/modules      -> src/modules/
@/services     -> src/services/
@/store        -> src/store/
```

### 📦 **Barrel exports**
```javascript
// shared/index.ts
export { Button } from './components/Button/Button'
export { useToast } from './hooks/useToast'

// Использование
import { Button, useToast } from '@/shared'
```

---

## 🏢 Структура модуля

```
modules/auth/
├── components/         # Компоненты модуля
├── hooks/             # Бизнес-логика в хуках
├── pages/             # Страницы модуля  
├── services/          # Специфичные сервисы
├── store/             # Локальное состояние
├── types/             # TypeScript типы
└── index.ts           # Barrel exports
```

### 📋 **Принципы модуля:**
- ✅ Модуль НЕ знает о других модулях
- ✅ Импортирует только из `@/shared` и `@/store`
- ✅ Экспортирует через `index.ts`
- ✅ Вся логика в хуках, компоненты "глупые"

---

## 🛠️ Примеры лучших практик

### 📄 **Простая страница**
```javascript
// pages/GamesPage.tsx
import React from 'react'
import GamesPage from '@/modules/games/pages/GamesPage/GamesPage'

const GamesPageRoute: React.FC = () => {
  return <GamesPage />
}
```

### 🧩 **Глупый компонент**
```javascript
// modules/games/components/GameCard.tsx
interface GameCardProps {
  title: string
  players: number
  onJoin: () => void
}

const GameCard: React.FC<GameCardProps> = ({ title, players, onJoin }) => {
  return (
    <div>
      <h3>{title}</h3>
      <p>{players} игроков</p>
      <button onClick={onJoin}>Играть</button>
    </div>
  )
}
```

### 🎣 **Умный хук**
```javascript
// modules/games/hooks/useGameLobby.ts
export const useGameLobby = (gameType: string) => {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(false)
  
  const joinGame = useCallback(async (gameId: string) => {
    // Вся логика здесь
  }, [])
  
  return { games, loading, joinGame }
}
```

---

## 🎯 Результаты рефакторинга

### ✅ **Что исправлено:**
- ✅ Создан слой `pages/` для простых роутов
- ✅ Убраны кривые импорты `../../../`
- ✅ Удалено дублирование сервисов
- ✅ Настроены алиасы и barrel exports
- ✅ Создан хук `useCalendar` для выноса логики

### 🚧 **TODO (по приоритету):**
1. Разбить огромный Calendar компонент (906 строк)
2. Перенести AboutPage из shared в pages
3. Упростить остальные "умные" компоненты
4. Создать хуки для всех страниц
5. Добавить TypeScript типы везде

---

*Документ обновлён: 10.09.2025*


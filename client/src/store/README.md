# Миграция на Redux - Пошаговое руководство

## Обзор

Этот проект постепенно мигрирует с React Context API на Redux Toolkit для лучшего управления состоянием, особенно в игровой логике и масотах.

## Структура Redux Store

```
src/store/
├── index.ts              # Основной store
├── types.ts              # Типы для Redux
├── hooks.ts              # Типизированные хуки
└── slices/
    ├── gameSlice.ts      # Игровая логика
    └── mascotSlice.ts    # Масоты и AI
```

## Пошаговая миграция

### Этап 1: Игровая логика (Высокий приоритет)

#### Компоненты для миграции:
- `PokerGame` - сложная игровая логика
- `ChessGame` - состояние доски и ходов
- `GameLobbyPage` - управление комнатами
- `CreateRoomModal` - создание игр

#### Пример миграции:
```typescript
// БЫЛО (Context):
const { gameState, setGameState } = useGameContext();

// СТАЛО (Redux):
const dispatch = useAppDispatch();
const gameState = useGameStateData();
dispatch(setGameState({ gameState: newState }));
```

### Этап 2: Масоты (Средний приоритет)

#### Компоненты для миграции:
- `GlobalMascot` - основной масот
- `AIChatInterface` - AI чат
- `AIToggleButton` - переключение AI
- `EventMascotContext` - масоты событий

#### Пример миграции:
```typescript
// БЫЛО (Context):
const { globalMascot, setGlobalMascot } = useMascot();

// СТАЛО (Redux):
const dispatch = useAppDispatch();
const globalMascot = useGlobalMascot();
dispatch(setMascotPosition({ position: newPos }));
```

### Этап 3: WebSocket интеграция (Высокий приоритет)

#### Создать middleware для WebSocket:
```typescript
// store/middleware/socketMiddleware.ts
export const socketMiddleware = createListenerMiddleware();
socketMiddleware.startListening({
  actionCreator: gameActions.connectToGameSocket,
  effect: async (action, listenerApi) => {
    const socket = io('/game');
    socket.on('gameStateUpdate', (gameState) => {
      listenerApi.dispatch(gameActions.setGameState({ gameState }));
    });
  }
});
```

## Преимущества миграции

### 1. Централизованное состояние
- Все игровые данные в одном месте
- Легче отслеживать изменения
- Проще синхронизировать между компонентами

### 2. DevTools для отладки
- Redux DevTools для анализа состояния
- Time-travel debugging
- Логирование всех действий

### 3. Middleware возможности
- WebSocket обработка
- Логирование
- Асинхронные операции

### 4. Производительность
- Оптимизированные ре-рендеры
- Селекторы для вычисляемых значений
- Нормализованное состояние

## Советы по миграции

### 1. Постепенная замена
- Не переписывать все сразу
- Начинать с самых сложных компонентов
- Тестировать каждый этап

### 2. Сохранение совместимости
- Оставлять старые Context работающими
- Постепенно заменять импорты
- Использовать адаптеры при необходимости

### 3. Типизация
- Всегда использовать TypeScript
- Создавать интерфейсы для состояний
- Типизировать actions и reducers

### 4. Тестирование
- Тестировать каждый slice отдельно
- Проверять интеграцию с компонентами
- Тестировать async thunks

## Следующие шаги

1. **Создать WebSocket middleware** для игр
2. **Мигрировать PokerGame** на Redux
3. **Добавить нормализацию** для игровых данных
4. **Создать селекторы** для вычисляемых значений
5. **Добавить Redux DevTools** в development

## Полезные ссылки

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React-Redux Hooks](https://react-redux.js.org/api/hooks)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [Redux Toolkit Query](https://redux-toolkit.js.org/rtk-query/overview)


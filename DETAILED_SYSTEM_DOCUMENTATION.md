# 📚 LoveMemory - Подробная Документация Архитектуры

**Полное описание компонентов системы и их взаимодействий**

---

## 📋 Содержание

1. [Обзор системы](#обзор-системы)
2. [Client (Фронтенд)](#client-фронтенд)
3. [Server (Бэкенд)](#server-бэкенд)
4. [AI (Искусственный интеллект)](#ai-искусственный-интеллект)
5. [Интеграция и взаимодействие](#интеграция-и-взаимодействие)

---

## 🎯 Обзор системы

**LoveMemory** - это полнофункциональная платформа для создания воспоминаний в парах, объединяющая игры, события, AI-рекомендации и социальные функции.

### 🏗️ Архитектура системы
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│     CLIENT      │────│     SERVER      │────│       AI        │
│   (React App)   │    │  (Node.js API)  │    │  (Python ML)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
     WebSocket                  REST API              FastAPI
    Real-time                 PostgreSQL            ML Models
   Gaming/Chat                  Redis               Recommendations
```

### 📦 Основные технологии
- **Frontend**: React 19.1 + TypeScript + Redux Toolkit + Vite
- **Backend**: Node.js + Express 5.1 + PostgreSQL + Redis + Socket.io
- **AI**: Python + FastAPI + scikit-learn + LightGBM + Transformers

---

## 🎨 Client (Фронтенд)

### 📁 Структура папки `client/`

```
client/
├── 📄 package.json          # Конфигурация проекта и зависимости
├── 🔧 vite.config.js        # Конфигурация сборщика Vite
├── 📝 tsconfig.json         # Настройки TypeScript
├── 🎯 index.html            # Точка входа HTML
├── 📁 dist/                 # Собранные статические файлы
├── 📁 public/               # Публичные ресурсы
└── 📁 src/                  # Исходный код приложения
    ├── 📄 App.tsx           # Корневой компонент
    ├── 📄 AppRoutes.tsx     # Маршрутизация
    ├── 📄 main.tsx          # Точка входа приложения
    ├── 📁 modules/          # Модульная архитектура
    ├── 📁 shared/           # Общие компоненты
    ├── 📁 store/            # Глобальное состояние
    ├── 📁 services/         # API сервисы
    ├── 📁 components/       # Переиспользуемые компоненты
    ├── 📁 context/          # React контексты
    └── 📁 ui/               # UI компоненты
```

### 🏗️ Архитектурные принципы

#### 1. **Модульная архитектура**
Каждый модуль изолирован и содержит свою логику:

```
modules/
├── auth/              # Авторизация
│   ├── components/    # Компоненты модуля
│   ├── hooks/         # Бизнес-логика в хуках
│   ├── pages/         # Страницы модуля
│   ├── services/      # API сервисы модуля
│   ├── store/         # Локальное состояние
│   └── types/         # TypeScript типы
├── games/             # Игровая система
├── events/            # События и календарь
├── users/             # Управление пользователями
├── dashboard/         # Главная панель
└── education/         # Обучающие материалы
```

#### 2. **Разделение ответственности**

**🎯 Pages** - Тонкие страницы для роутинга:
```tsx
// Только композиция, никакой бизнес-логики
const GamesPage = () => {
  return <GamesModule userId={user.id} />
}
```

**🏢 Modules** - Бизнес-логика модулей:
```tsx
// Вся логика в хуках
const GamesModule = ({ userId }) => {
  const games = useGameLobby(gameType)
  return <GamesUI {...games} />
}
```

**🧩 Components** - "Глупые" UI компоненты:
```tsx
// Только отображение, никакой логики
const GameCard = ({ title, players, onJoin }) => (
  <div>
    <h3>{title}</h3>
    <button onClick={onJoin}>Играть</button>
  </div>
)
```

#### 3. **Управление состоянием**

**Redux Toolkit** для глобального состояния:
```typescript
// store/slices/gameSlice.ts
export const gameSlice = createSlice({
  name: 'game',
  initialState: {
    currentRoom: null,
    isConnected: false,
    gameState: null
  },
  reducers: {
    setCurrentRoom: (state, action) => {
      state.currentRoom = action.payload
    }
  }
})
```

**React Hooks** для локального состояния:
```typescript
// Вся бизнес-логика в хуках
export const useGameLobby = (gameType: string) => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  
  const joinGame = useCallback(async (gameId) => {
    // Логика подключения к игре
  }, [])
  
  return { rooms, loading, joinGame }
}
```

### 🌐 Ключевые модули

#### 1. **Games Module** 🎮
Полная игровая экосистема:

```
games/
├── components/
│   ├── ChessBoard/           # Шахматная доска
│   ├── TicTacToeBoard/       # Крестики-нолики
│   ├── PokerTable/           # Покерный стол
│   └── GameLobby/            # Лобби игр
├── hooks/
│   ├── useGameSocket.ts      # WebSocket подключение
│   ├── usePokerGame.ts       # Логика покера
│   └── useGameLobby.ts       # Управление лобби
├── modules/
│   ├── ChessModule/          # Шахматный модуль
│   ├── PokerModule/          # Покерный модуль
│   └── TournamentModule/     # Турниры
└── services/
    └── game.service.js       # API для игр
```

**WebSocket интеграция**:
```typescript
const usePokerGame = (roomId: string) => {
  const socketRef = useRef<Socket | null>(null)
  
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: { token: user.token },
      transports: ['websocket', 'polling']
    })
    
    socket.on('game_update', (gameState) => {
      setGameState(gameState)
    })
    
    socketRef.current = socket
  }, [roomId])
  
  const makeMove = useCallback((action, value) => {
    socketRef.current?.emit('make_move', { 
      roomId, action, value 
    })
  }, [roomId])
}
```

#### 2. **Events Module** 📅
Календарь и управление событиями:

```
events/
├── components/
│   ├── Calendar/             # Календарь событий
│   ├── EventCard/            # Карточка события
│   └── EventFilters/         # Фильтры событий
├── modules/
│   ├── CalendarModule/       # Бизнес-логика календаря
│   └── DayDetailModule/      # Детали дня
└── hooks/
    ├── useCalendar.ts        # Управление календарем
    └── useEvents.ts          # Работа с событиями
```

#### 3. **AI Module** 🤖
Интеграция с AI сервисами:

```
ai/
├── components/
│   ├── RecommendationList/   # Список рекомендаций
│   ├── ChatInterface/        # Чат с AI
│   └── DateGenerator/        # Генератор свиданий
├── services/
│   └── ai.service.js         # API для AI
└── hooks/
    ├── useRecommendations.ts # Получение рекомендаций
    └── useAIChat.ts          # Чат с AI
```

### 🔧 Сервисы и API

**Централизованная работа с API**:
```javascript
// services/api.js
class ApiClient {
  constructor() {
    this.baseURL = process.env.VITE_API_BASE_URL
    this.setupInterceptors()
  }
  
  async get(endpoint) {
    return await axios.get(`${this.baseURL}${endpoint}`)
  }
}

export default new ApiClient()
```

**Специализированные сервисы**:
```javascript
// services/game.service.js
export const gameService = {
  async getRooms(gameType) {
    return api.get(`/games/${gameType}/rooms`)
  },
  
  async createRoom(gameType, settings) {
    return api.post(`/games/${gameType}/rooms`, settings)
  }
}
```

---

## ⚙️ Server (Бэкенд)

### 📁 Структура папки `server/`

```
server/
├── 📄 index.js              # Точка входа сервера
├── 📄 package.json          # Зависимости и скрипты
├── 📁 config/               # Конфигурации
│   ├── database.js          # Настройки БД
│   ├── passport.js          # Аутентификация
│   └── redis.js             # Настройки Redis
├── 📁 controllers/          # Обработчики запросов
├── 📁 models/               # Модели данных (Sequelize)
├── 📁 routes/               # Маршруты API
├── 📁 services/             # Бизнес-логика
├── 📁 middleware/           # Промежуточные обработчики
├── 📁 gameLogic/            # Игровая логика
├── 📁 socket/               # WebSocket обработчики
├── 📁 migrations/           # Миграции БД
└── 📁 uploads/              # Загруженные файлы
```

### 🏗️ Архитектура сервера

#### 1. **MVC Pattern**

**Models** - Модели данных с Sequelize:
```javascript
// models/User.js
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true },
  username: { type: DataTypes.STRING, unique: true },
  passwordHash: DataTypes.STRING,
  coins: { type: DataTypes.INTEGER, defaultValue: 0 }
})
```

**Controllers** - Обработка HTTP запросов:
```javascript
// controllers/game.controller.js
const gameController = {
  async getRooms(req, res) {
    try {
      const { gameType } = req.params
      const rooms = await gameService.getActiveRooms(gameType)
      res.json({ success: true, data: rooms })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}
```

**Routes** - Маршрутизация:
```javascript
// routes/game.routes.js
const router = express.Router()

router.get('/:gameType/rooms', authenticateToken, gameController.getRooms)
router.post('/:gameType/rooms', authenticateToken, gameController.createRoom)

module.exports = router
```

#### 2. **Service Layer Pattern**

**Services** содержат всю бизнес-логику:
```javascript
// services/game.service.js
class GameService {
  async createRoom(gameType, settings, creatorId) {
    // Валидация
    if (!this.validateGameSettings(gameType, settings)) {
      throw new Error('Invalid game settings')
    }
    
    // Создание комнаты
    const room = await GameRoom.create({
      gameType,
      settings,
      creatorId,
      status: 'waiting'
    })
    
    // Уведомление через WebSocket
    io.emit('room_created', room)
    
    return room
  }
}
```

### 🎮 Игровая система

#### 1. **Game Logic Architecture**

```
gameLogic/
├── base/
│   ├── BaseGame.ts          # Базовый класс игры
│   ├── RealtimeGame.ts      # Real-time игры
│   ├── TurnBasedGame.ts     # Пошаговые игры
│   └── TeamGame.ts          # Командные игры
├── games/
│   ├── ChessGame.ts         # Шахматы
│   ├── TicTacToeGame.ts     # Крестики-нолики
│   └── QuizGame.ts          # Викторины
└── poker/
    ├── PokerGame.ts         # Основная логика покера
    ├── PokerPlayer.ts       # Игрок в покере
    └── PokerHand.ts         # Покерная рука
```

**Базовый игровой класс**:
```typescript
// gameLogic/base/BaseGame.ts
export abstract class BaseGame {
  protected gameState: GameState
  protected players: Map<string, Player>
  
  abstract makeMove(playerId: string, move: any): GameState
  abstract isGameFinished(): boolean
  abstract getWinner(): string | null
  
  protected validateMove(playerId: string, move: any): boolean {
    // Общая валидация ходов
  }
  
  protected notifyPlayers(event: string, data: any) {
    this.players.forEach(player => {
      io.to(player.socketId).emit(event, data)
    })
  }
}
```

**Покерная логика**:
```typescript
// gameLogic/poker/PokerGame.ts
export class PokerGame extends TurnBasedGame {
  private deck: Card[]
  private pot: number = 0
  private communityCards: Card[] = []
  
  makeMove(playerId: string, action: PokerAction): GameState {
    const player = this.players.get(playerId)
    
    switch (action.type) {
      case 'fold':
        return this.handleFold(player)
      case 'call':
        return this.handleCall(player)
      case 'raise':
        return this.handleRaise(player, action.amount)
    }
  }
}
```

#### 2. **WebSocket Integration**

```javascript
// socket/index.js
const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: allowedOrigins }
  })
  
  io.use(authenticateSocket) // Middleware аутентификации
  
  io.on('connection', (socket) => {
    socket.on('join_room', async (roomId) => {
      const room = await gameService.joinRoom(roomId, socket.userId)
      socket.join(roomId)
      socket.emit('room_joined', room)
    })
    
    socket.on('make_move', async (data) => {
      const { roomId, action, value } = data
      const result = await gameService.makeMove(roomId, socket.userId, { action, value })
      io.to(roomId).emit('game_update', result)
    })
  })
  
  return io
}
```

### 🔐 Безопасность и аутентификация

#### 1. **JWT Authentication**
```javascript
// middleware/auth.middleware.js
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied' })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' })
  }
}
```

#### 2. **Rate Limiting**
```javascript
// middleware/rateLimit.middleware.js
const createRateLimit = (windowMs, max) => rateLimit({
  windowMs,
  max,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false
})

const apiLimiter = createRateLimit(15 * 60 * 1000, 100) // 100 requests per 15 minutes
```

### 🗄️ База данных

#### 1. **PostgreSQL с Sequelize**

**Модели отношений**:
```javascript
// models/Pair.js
const Pair = sequelize.define('Pair', {
  id: { type: DataTypes.UUID, primaryKey: true },
  user1Id: { type: DataTypes.UUID, references: { model: 'Users' }},
  user2Id: { type: DataTypes.UUID, references: { model: 'Users' }},
  status: { type: DataTypes.ENUM('pending', 'active', 'ended') },
  createdAt: DataTypes.DATE
})

// Связи
User.hasMany(Pair, { as: 'InitiatedPairs', foreignKey: 'user1Id' })
User.hasMany(Pair, { as: 'ReceivedPairs', foreignKey: 'user2Id' })
```

#### 2. **Redis для кэширования**
```javascript
// config/redis.js
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
})

// Кэширование игровых состояний
const cacheGameState = async (roomId, gameState) => {
  await redis.setex(`game:${roomId}`, 3600, JSON.stringify(gameState))
}
```

### 🤖 AI Integration

#### 1. **AI Controller**
```javascript
// controllers/ai.controller.js
const handleChat = async (req, res) => {
  try {
    const { prompt } = req.body
    const userId = req.user.id
    
    // Вызов AI Orchestrator
    const response = await aiOrchestrator.handleRequest(prompt, userId)
    
    res.json({
      success: true,
      data: {
        message: response.message,
        intent: response.intent,
        suggestions: response.suggestions
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}
```

#### 2. **Recommendation Controller**
```javascript
// controllers/recommendation.controller.js
class RecommendationController {
  async getRecommendations(req, res) {
    try {
      const { pairId, topK = 10 } = req.params
      
      // Вызов Python AI сервиса
      const recommendations = await this.callPythonRecommender(pairId, topK)
      
      res.json({
        success: true,
        data: recommendations,
        metadata: { generatedAt: new Date() }
      })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
  
  async callPythonRecommender(pairId, topK) {
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001'
    
    const response = await axios.post(`${AI_SERVICE_URL}/recommend`, {
      pair_id: pairId,
      top_k: topK,
      include_explanations: true
    })
    
    return response.data
  }
}
```

---

## 🧠 AI (Искусственный интеллект)

### 📁 Структура папки `ai/`

```
ai/
├── 📄 main.py                        # Точка входа FastAPI
├── 📄 ultimate_ai_service.py         # Центральный AI сервис
├── 📄 requirements.txt               # Python зависимости
├── 📁 data/                          # Данные для обучения
│   └── synthetic_v1/                 # Синтетические данные v1
├── 📁 models/                        # Обученные модели
├── 📁 notebooks/                     # Jupyter ноутбуки
├── 📄 content_recommender.py         # Content-based рекомендации
├── 📄 collaborative_filtering.py     # Коллаборативная фильтрация
├── 📄 embedding_service.py           # Векторные представления
├── 📄 learning_to_rank_service.py    # Learning to Rank
├── 📄 llm_wrapper.py                 # LLM генерация
├── 📄 explainability_service.py      # Объяснимость AI
├── 📄 context_awareness_engine.py    # Контекстная осведомленность
├── 📄 personality_engine.py          # Личностные модели
├── 📄 shared_memory_bank.py          # Копилка воспоминаний
└── 📄 monitoring_service.py          # Мониторинг системы
```

### 🎯 AI Архитектура

#### 1. **Многослойная система рекомендаций**

```
┌─────────────────────────────────────────────────────────┐
│                 Ultimate AI Service                      │
│              (Центральный оркестратор)                   │
└─────────────────┬───────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────────────────────────────┐
    │             │                                     │
    ▼             ▼                                     ▼
┌─────────┐  ┌─────────┐  ┌─────────────┐  ┌─────────────┐
│Learning │  │Enhanced │  │   Content   │  │Collaborative│
│to Rank  │  │ Hybrid  │  │   Based     │  │ Filtering   │
│(LightGBM│  │         │  │             │  │   (SVD)     │
└─────────┘  └─────────┘  └─────────────┘  └─────────────┘
    │             │              │              │
    └─────────────┼──────────────┼──────────────┘
                  │              │
                  ▼              ▼
            ┌─────────────┐  ┌─────────────┐
            │ Embeddings  │  │    LLM      │
            │ + ANN       │  │ Generation  │
            │ (Faiss)     │  │             │
            └─────────────┘  └─────────────┘
```

#### 2. **Ultimate AI Service - Центральный хаб**

```python
# ultimate_ai_service.py
class UltimateAIService:
    def __init__(self, data_path: str = 'data/synthetic_v1'):
        self.content_recommender = ContentBasedRecommender(data_path)
        self.cf_recommender = CollaborativeFilteringRecommender(data_path)
        self.embedding_service = EmbeddingService(data_path)
        self.ltr_service = LearningToRankService(data_path)
        self.llm_wrapper = LLMWrapper()
        self.explainer = ExplainabilityService()
        
        # Статус компонентов
        self.components_status = {
            'content_based': False,
            'collaborative_filtering': False,
            'embeddings': False,
            'learning_to_rank': False,
            'llm_generation': False
        }
        
        # Кэширование
        self.recommendation_cache = {}
        self.cache_ttl_seconds = 300
    
    async def get_recommendations(self, request: RecommendationRequest):
        """Интеллектуальное переключение между методами"""
        
        # 1. Проверяем кэш
        cache_key = f"{request.pair_id}_{request.top_k}"
        if cache_key in self.recommendation_cache:
            return self.recommendation_cache[cache_key]
        
        # 2. Выбираем лучший доступный метод
        recommendations = None
        
        if self.components_status['learning_to_rank']:
            # Лучший метод - Learning to Rank
            recommendations = await self._get_ltr_recommendations(request)
        elif self.components_status['collaborative_filtering']:
            # Fallback к Enhanced Hybrid
            recommendations = await self._get_hybrid_recommendations(request)
        elif self.components_status['content_based']:
            # Fallback к Content-based
            recommendations = await self._get_content_recommendations(request)
        else:
            # Аварийный fallback
            recommendations = self._get_fallback_recommendations(request)
        
        # 3. Кэшируем результат
        self.recommendation_cache[cache_key] = recommendations
        
        return recommendations
```

### 🔬 Компоненты AI системы

#### 1. **Content-Based Recommender**

```python
# content_recommender.py
class ContentBasedRecommender:
    def __init__(self, data_path: str):
        self.users_df = pd.read_csv(f"{data_path}/users.csv")
        self.products_df = pd.read_csv(f"{data_path}/product_catalog.csv")
        
    def recommend(self, pair_id: str, top_k: int = 10):
        """Рекомендации на основе совпадения интересов"""
        
        # Получаем данные пары
        pair_data = self._get_pair_data(pair_id)
        
        # Вычисляем скоры для каждого продукта
        scores = []
        for _, product in self.products_df.iterrows():
            score = self._calculate_content_score(pair_data, product)
            scores.append({
                'product_id': product['id'],
                'score': score,
                'explanation': self._explain_score(pair_data, product)
            })
        
        # Сортируем и возвращаем топ-K
        scores.sort(key=lambda x: x['score'], reverse=True)
        return scores[:top_k]
    
    def _calculate_content_score(self, pair_data, product):
        """Weighted scoring: interests(60%) + distance(20%) + price(20%)"""
        
        # 1. Совпадение интересов
        interest_score = self._calculate_interest_overlap(
            pair_data['interests'], product['tags']
        )
        
        # 2. Географическая близость
        distance_score = self._calculate_distance_score(
            pair_data['location'], (product['latitude'], product['longitude'])
        )
        
        # 3. Соответствие бюджету
        price_score = self._calculate_price_match(
            pair_data['budget'], product['price']
        )
        
        # Взвешенная сумма
        total_score = (
            interest_score * 0.6 +
            distance_score * 0.2 +
            price_score * 0.2
        )
        
        return total_score
```

#### 2. **Collaborative Filtering**

```python
# collaborative_filtering.py
class CollaborativeFilteringRecommender:
    def __init__(self, data_path: str):
        self.interactions_df = pd.read_csv(f"{data_path}/interactions.csv")
        self.model = TruncatedSVD(n_components=5, random_state=42)
        self._train_model()
    
    def _train_model(self):
        """Обучение SVD модели"""
        
        # Создаем user-item матрицу
        user_item_matrix = self.interactions_df.pivot_table(
            index='pair_id', 
            columns='product_id', 
            values='rating',
            fill_value=0
        )
        
        # Обучаем SVD
        self.model.fit(user_item_matrix)
        self.user_item_matrix = user_item_matrix
        
        # Кросс-валидация
        scores = cross_val_score(self.model, user_item_matrix, cv=5)
        print(f"CV Score: {scores.mean():.3f} (+/- {scores.std() * 2:.3f})")
    
    def recommend(self, pair_id: str, top_k: int = 10):
        """CF рекомендации с предсказанием рейтингов"""
        
        if pair_id not in self.user_item_matrix.index:
            return self._handle_cold_start(pair_id, top_k)
        
        # Получаем вектор пользователя в латентном пространстве
        user_idx = self.user_item_matrix.index.get_loc(pair_id)
        user_vector = self.model.transform(self.user_item_matrix.iloc[[user_idx]])
        
        # Предсказываем рейтинги для всех продуктов
        predicted_ratings = self.model.inverse_transform(user_vector)[0]
        
        # Убираем уже оцененные продукты
        user_ratings = self.user_item_matrix.iloc[user_idx]
        predicted_ratings[user_ratings > 0] = -1
        
        # Топ-K рекомендаций
        top_indices = predicted_ratings.argsort()[-top_k:][::-1]
        top_products = self.user_item_matrix.columns[top_indices]
        
        recommendations = []
        for i, product_id in enumerate(top_products):
            recommendations.append({
                'product_id': product_id,
                'predicted_rating': predicted_ratings[top_indices[i]],
                'cf_score': (predicted_ratings[top_indices[i]] + 5) / 10  # Normalize to 0-1
            })
        
        return recommendations
```

#### 3. **Embedding Service + ANN Search**

```python
# embedding_service.py
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

class EmbeddingService:
    def __init__(self, data_path: str):
        # Multilingual модель для русского языка
        self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        self.dimension = 384
        
        # FAISS индекс для быстрого поиска
        self.index = faiss.IndexFlatL2(self.dimension)
        self.product_ids = []
        
        self._build_product_embeddings(data_path)
    
    def _build_product_embeddings(self, data_path: str):
        """Создаем векторные представления продуктов"""
        
        products_df = pd.read_csv(f"{data_path}/product_catalog.csv")
        
        # Создаем текстовые описания
        descriptions = []
        for _, product in products_df.iterrows():
            description = f"{product['name']} {product['category']} {product['tags']}"
            descriptions.append(description)
        
        # Векторизация
        embeddings = self.model.encode(descriptions, show_progress_bar=True)
        
        # Добавляем в FAISS индекс
        self.index.add(embeddings.astype('float32'))
        self.product_ids = products_df['id'].tolist()
        
        print(f"Built embeddings for {len(descriptions)} products")
    
    def recommend(self, pair_id: str, top_k: int = 10):
        """Семантический поиск похожих продуктов"""
        
        # Создаем профиль пары
        pair_profile = self._build_pair_profile(pair_id)
        
        # Векторизуем профиль
        query_embedding = self.model.encode([pair_profile])
        
        # ANN поиск
        distances, indices = self.index.search(
            query_embedding.astype('float32'), top_k
        )
        
        recommendations = []
        for i, idx in enumerate(indices[0]):
            recommendations.append({
                'product_id': self.product_ids[idx],
                'similarity_score': 1 / (1 + distances[0][i]),  # Convert distance to similarity
                'semantic_distance': float(distances[0][i])
            })
        
        return recommendations
```

#### 4. **Learning to Rank**

```python
# learning_to_rank_service.py
import lightgbm as lgb

class LearningToRankService:
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.model = None
        self.feature_names = []
        self._train_model()
    
    def _train_model(self):
        """Обучение LightGBM Ranker"""
        
        # Подготавливаем данные для обучения
        train_data = self._prepare_training_data()
        
        # Создаем датасет для ранжирования
        lgb_train = lgb.Dataset(
            train_data['features'],
            label=train_data['labels'],
            group=train_data['groups'],  # Группировка по парам
            feature_name=self.feature_names
        )
        
        # Параметры модели
        params = {
            'objective': 'lambdarank',
            'metric': 'ndcg',
            'ndcg_at': [1, 3, 5, 10],
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.9,
            'verbose': -1
        }
        
        # Обучение с кросс-валидацией
        self.model = lgb.train(
            params,
            lgb_train,
            num_boost_round=100,
            valid_sets=[lgb_train],
            callbacks=[lgb.early_stopping(10), lgb.log_evaluation(0)]
        )
        
        print("LTR model trained successfully")
    
    def _prepare_training_data(self):
        """Подготовка фичей для обучения"""
        
        features = []
        labels = []
        groups = []
        
        # Загружаем все данные
        interactions_df = pd.read_csv(f"{self.data_path}/interactions.csv")
        
        # Группируем по парам
        for pair_id, group in interactions_df.groupby('pair_id'):
            pair_features = []
            pair_labels = []
            
            for _, interaction in group.iterrows():
                # Извлекаем 40+ фичей для каждого взаимодействия
                feature_vector = self._extract_features(pair_id, interaction['product_id'])
                pair_features.append(feature_vector)
                pair_labels.append(interaction['rating'])
            
            features.extend(pair_features)
            labels.extend(pair_labels)
            groups.append(len(pair_features))
        
        return {
            'features': np.array(features),
            'labels': np.array(labels),
            'groups': np.array(groups)
        }
    
    def _extract_features(self, pair_id: str, product_id: str):
        """Извлечение 40+ фичей для ранжирования"""
        
        features = []
        
        # 1. Content-based фичи
        cb_score = self.content_recommender.get_score(pair_id, product_id)
        features.extend([cb_score['interest_overlap'], cb_score['distance_score'], cb_score['price_match']])
        
        # 2. Collaborative filtering фичи
        cf_score = self.cf_recommender.get_score(pair_id, product_id)
        features.append(cf_score['predicted_rating'])
        
        # 3. Embedding фичи
        emb_score = self.embedding_service.get_score(pair_id, product_id)
        features.append(emb_score['similarity_score'])
        
        # 4. Временные фичи
        features.extend([
            self._get_time_of_day_preference(pair_id),
            self._get_seasonality_score(product_id),
            self._get_weekday_preference(pair_id)
        ])
        
        # 5. Популярность и новизна
        features.extend([
            self._get_product_popularity(product_id),
            self._get_product_novelty(product_id),
            self._get_user_exploration_tendency(pair_id)
        ])
        
        # ... еще 30+ фичей
        
        return features
    
    def recommend(self, pair_id: str, top_k: int = 10):
        """LTR ранжирование всех продуктов"""
        
        if not self.model:
            raise Exception("LTR model not trained")
        
        # Получаем все продукты
        products_df = pd.read_csv(f"{self.data_path}/product_catalog.csv")
        
        # Извлекаем фичи для каждого продукта
        features = []
        for _, product in products_df.iterrows():
            feature_vector = self._extract_features(pair_id, product['id'])
            features.append(feature_vector)
        
        # Предсказываем скоры
        scores = self.model.predict(np.array(features))
        
        # Создаем рекомендации
        recommendations = []
        for i, (_, product) in enumerate(products_df.iterrows()):
            recommendations.append({
                'product_id': product['id'],
                'ltr_score': float(scores[i]),
                'rank': i + 1
            })
        
        # Сортируем по скору и берем топ-K
        recommendations.sort(key=lambda x: x['ltr_score'], reverse=True)
        return recommendations[:top_k]
```

#### 5. **LLM Wrapper для генерации**

```python
# llm_wrapper.py
class LLMWrapper:
    def __init__(self):
        self.model_name = "gpt-3.5-turbo"  # или другая модель
        self.templates = {
            'date_scenario': self._load_date_templates(),
            'gift_description': self._load_gift_templates(),
            'explanation': self._load_explanation_templates()
        }
    
    async def generate_date_scenario(self, pair_data: dict, product_data: dict):
        """Генерация сценария свидания"""
        
        prompt = f"""
        Создай романтический сценарий свидания для пары:
        
        Интересы пары: {pair_data['interests']}
        Место: {product_data['name']}
        Категория: {product_data['category']}
        Бюджет: {product_data['price']} руб.
        
        Создай подробный план свидания с временной схемой, включающий:
        1. Подготовку (что взять с собой)
        2. Основную активность
        3. Дополнительные идеи
        4. Романтические детали
        
        Ответ должен быть практичным и вдохновляющим.
        """
        
        response = await self._call_llm(prompt)
        return {
            'scenario': response,
            'generated_at': datetime.now().isoformat(),
            'model_used': self.model_name
        }
    
    async def explain_recommendation(self, recommendation_data: dict):
        """Объяснение рекомендации понятным языком"""
        
        prompt = f"""
        Объясни простым языком, почему мы рекомендуем это место для свидания:
        
        Название: {recommendation_data['product_name']}
        Скор совместимости: {recommendation_data['score']:.2f}
        Основные причины: {recommendation_data['reasons']}
        
        Создай теплое, персональное объяснение (2-3 предложения).
        """
        
        response = await self._call_llm(prompt)
        return response
```

### 📊 Мониторинг и метрики

```python
# monitoring_service.py
class MonitoringService:
    def __init__(self):
        self.metrics_storage = {}
        self.performance_log = []
    
    def track_recommendation_performance(self, request_data: dict, response_data: dict, processing_time: float):
        """Отслеживание производительности рекомендаций"""
        
        metric = {
            'timestamp': datetime.now().isoformat(),
            'pair_id': request_data['pair_id'],
            'method_used': response_data['method'],
            'processing_time_ms': processing_time,
            'recommendations_count': len(response_data['recommendations']),
            'cache_hit': response_data.get('from_cache', False)
        }
        
        self.performance_log.append(metric)
        
        # Агрегированные метрики
        self._update_aggregated_metrics(metric)
    
    def get_system_health(self):
        """Здоровье AI системы"""
        
        recent_requests = [m for m in self.performance_log if 
                          datetime.fromisoformat(m['timestamp']) > datetime.now() - timedelta(hours=1)]
        
        if not recent_requests:
            return {'status': 'no_data', 'requests_last_hour': 0}
        
        avg_latency = np.mean([r['processing_time_ms'] for r in recent_requests])
        cache_hit_rate = np.mean([r['cache_hit'] for r in recent_requests])
        
        return {
            'status': 'healthy' if avg_latency < 1000 else 'degraded',
            'requests_last_hour': len(recent_requests),
            'avg_latency_ms': avg_latency,
            'cache_hit_rate': cache_hit_rate,
            'active_components': self._get_active_components()
        }
```

---

## 🔗 Интеграция и взаимодействие

### 🌐 Схема взаимодействия компонентов

```
     ┌─────────────┐      HTTP REST API       ┌─────────────┐
     │             │────────────────────────▶ │             │
     │   CLIENT    │                          │   SERVER    │
     │ (React App) │◀────────────────────────│ (Node.js)   │
     │             │      JSON Responses      │             │
     └─────────────┘                          └─────────────┘
            │                                         │
            │                                         │
            │ WebSocket                               │ HTTP API
            │ Real-time                               │ REST calls
            │                                         │
            ▼                                         ▼
     ┌─────────────┐                          ┌─────────────┐
     │  Socket.io  │                          │     AI      │
     │   Server    │                          │  (Python)   │
     │             │                          │   FastAPI   │
     └─────────────┘                          └─────────────┘
```

### 📊 Типы взаимодействий

#### 1. **Client ↔ Server**

**HTTP REST API** для основных операций:
```typescript
// client/src/services/api.js
class ApiClient {
  async get(endpoint: string) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    })
    return response.json()
  }
  
  async post(endpoint: string, data: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}
```

**WebSocket** для real-time функций:
```typescript
// client/src/hooks/useGameSocket.ts
const useGameSocket = (roomId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  
  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      auth: { token: user.token },
      transports: ['websocket', 'polling']
    })
    
    socketInstance.on('connect', () => {
      socketInstance.emit('join_room', roomId)
    })
    
    socketInstance.on('game_update', (gameState) => {
      setGameState(gameState)
    })
    
    setSocket(socketInstance)
    
    return () => socketInstance.disconnect()
  }, [roomId])
  
  const makeMove = useCallback((action: string, value: number) => {
    socket?.emit('make_move', { roomId, action, value })
  }, [socket, roomId])
  
  return { socket, makeMove }
}
```

#### 2. **Server ↔ AI**

**HTTP API** для AI рекомендаций:
```javascript
// server/controllers/recommendation.controller.js
class RecommendationController {
  async getRecommendations(req, res) {
    try {
      const { pairId, topK = 10 } = req.params
      
      // Вызов Python AI сервиса
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/recommend`, {
        pair_id: pairId,
        top_k: topK,
        user_location: req.body.location,
        context: {
          time_of_day: new Date().getHours(),
          day_of_week: new Date().getDay(),
          weather: req.body.weather
        },
        include_explanations: true,
        include_scenarios: true
      })
      
      const recommendations = aiResponse.data.recommendations
      
      // Обогащаем данными из БД
      const enrichedRecommendations = await this.enrichWithDatabaseData(recommendations)
      
      res.json({
        success: true,
        data: enrichedRecommendations,
        metadata: {
          generatedAt: new Date(),
          aiModelVersion: aiResponse.data.model_versions,
          processingTime: aiResponse.data.processing_time_ms
        }
      })
      
    } catch (error) {
      console.error('AI service error:', error)
      
      // Fallback к базовым рекомендациям
      const fallbackRecommendations = await this.getFallbackRecommendations(req.params.pairId)
      
      res.json({
        success: true,
        data: fallbackRecommendations,
        metadata: { fallback: true, reason: 'AI service unavailable' }
      })
    }
  }
}
```

#### 3. **Данные и состояние**

**Поток данных для рекомендаций**:
```
1. Client запрашивает рекомендации
   ↓
2. Server получает запрос + контекст пользователя
   ↓
3. Server собирает данные пары из PostgreSQL
   ↓
4. Server вызывает AI сервис с полным контекстом
   ↓
5. AI анализирует данные и генерирует рекомендации
   ↓
6. Server обогащает рекомендации данными из БД
   ↓
7. Client получает финальные рекомендации + объяснения
```

**Поток данных для игр**:
```
1. Client подключается к игровой комнате через WebSocket
   ↓
2. Server создает/находит игровую сессию
   ↓
3. Client отправляет ход через WebSocket
   ↓
4. Server обрабатывает ход через GameLogic
   ↓
5. Server обновляет состояние игры в Redis
   ↓
6. Server отправляет обновление всем игрокам
   ↓
7. Client обновляет UI в реальном времени
```

### 🗄️ Управление данными

#### 1. **PostgreSQL Schema**

```sql
-- Основные таблицы
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    coins INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pairs (
    id UUID PRIMARY KEY,
    user1_id UUID REFERENCES users(id),
    user2_id UUID REFERENCES users(id),
    status VARCHAR CHECK (status IN ('pending', 'active', 'ended')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE events (
    id UUID PRIMARY KEY,
    pair_id UUID REFERENCES pairs(id),
    title VARCHAR NOT NULL,
    description TEXT,
    date_time TIMESTAMP,
    location VARCHAR,
    category VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE game_rooms (
    id UUID PRIMARY KEY,
    game_type VARCHAR NOT NULL,
    creator_id UUID REFERENCES users(id),
    settings JSONB,
    status VARCHAR DEFAULT 'waiting',
    max_players INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI-related таблицы
CREATE TABLE recommendation_history (
    id UUID PRIMARY KEY,
    pair_id UUID REFERENCES pairs(id),
    product_id VARCHAR,
    score DECIMAL,
    method VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    prompt TEXT,
    response TEXT,
    intent VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. **Redis Caching Strategy**

```javascript
// server/services/cache.service.js
class CacheService {
  // Кэширование игровых состояний
  async cacheGameState(roomId, gameState, ttl = 3600) {
    await redis.setex(`game:${roomId}`, ttl, JSON.stringify(gameState))
  }
  
  async getGameState(roomId) {
    const cached = await redis.get(`game:${roomId}`)
    return cached ? JSON.parse(cached) : null
  }
  
  // Кэширование AI рекомендаций
  async cacheRecommendations(pairId, recommendations, ttl = 1800) {
    const key = `recommendations:${pairId}`
    await redis.setex(key, ttl, JSON.stringify(recommendations))
  }
  
  async getRecommendations(pairId) {
    const cached = await redis.get(`recommendations:${pairId}`)
    return cached ? JSON.parse(cached) : null
  }
  
  // Кэширование пользовательских сессий
  async cacheUserSession(userId, sessionData, ttl = 86400) {
    await redis.setex(`session:${userId}`, ttl, JSON.stringify(sessionData))
  }
}
```

### 🚀 Deployment и Production

#### 1. **Environment Configuration**

```javascript
// server/.env
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lovememory
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d

# AI Service
AI_SERVICE_URL=http://localhost:8001
AI_GATEWAY_URL=https://your-ai-gateway.com

# External APIs
GOOGLE_CLIENT_ID=your-google-client-id
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# CORS
CLIENT_URL=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://admin.your-domain.com
```

```python
# ai/.env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lovememory

# AI Models
HF_TOKEN=your-huggingface-token
OPENAI_API_KEY=your-openai-key

# Service
AI_SERVICE_PORT=8001
AI_SERVICE_HOST=0.0.0.0
```

#### 2. **Docker Configuration**

```yaml
# docker-compose.yml
version: '3.8'

services:
  client:
    build: ./client
    ports:
      - "3000:80"
    environment:
      - VITE_API_BASE_URL=http://server:5000
      - VITE_SOCKET_URL=http://server:5000
    depends_on:
      - server

  server:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/lovememory
      - REDIS_URL=redis://redis:6379
      - AI_SERVICE_URL=http://ai:8001
    depends_on:
      - db
      - redis
      - ai

  ai:
    build: ./ai
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432
    volumes:
      - ./ai/models:/app/models
      - ./ai/data:/app/data
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=lovememory
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 🔧 Мониторинг и логирование

```javascript
// server/middleware/monitoring.middleware.js
const monitoringMiddleware = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    
    // Логирование метрик
    console.log({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    })
    
    // Отправка метрик в мониторинг
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`)
    }
  })
  
  next()
}
```

---

## 📈 Связь с папкой AI

### 🔄 Интеграционные точки

#### 1. **Recommendation Engine Integration**

**Server → AI** для получения рекомендаций:
```javascript
// server/services/ai.service.js
class AiService {
  async getRecommendations(pairId, options = {}) {
    const aiEndpoint = `${process.env.AI_SERVICE_URL}/recommend`
    
    const payload = {
      pair_id: pairId,
      top_k: options.topK || 10,
      user_location: options.location,
      context: {
        time_of_day: new Date().getHours(),
        day_of_week: new Date().getDay(),
        weather: options.weather,
        budget_range: options.budget
      },
      include_scenarios: true,
      include_explanations: true
    }
    
    try {
      const response = await axios.post(aiEndpoint, payload, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      })
      
      return {
        success: true,
        recommendations: response.data.recommendations,
        metadata: response.data.metadata,
        processingTime: response.data.processing_time_ms
      }
    } catch (error) {
      console.error('AI service error:', error.message)
      
      // Fallback к простым рекомендациям
      return this.getFallbackRecommendations(pairId, options)
    }
  }
}
```

**AI → Server** возвращает структурированные рекомендации:
```python
# ai/ultimate_ai_service.py
@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    start_time = time.time()
    
    try:
        # Получение рекомендаций от AI
        recommendations = await ai_service.get_recommendations(request)
        
        # Генерация сценариев через LLM
        if request.include_scenarios:
            for rec in recommendations:
                scenario = await llm_wrapper.generate_date_scenario(
                    request.pair_id, rec['product_id']
                )
                rec['scenario'] = scenario
        
        # Добавление объяснений
        if request.include_explanations:
            explanations = explainer.explain_recommendations(recommendations)
            for i, explanation in enumerate(explanations):
                recommendations[i]['explanation'] = explanation
        
        processing_time = (time.time() - start_time) * 1000
        
        return RecommendationResponse(
            recommendations=recommendations,
            metadata={
                'total_count': len(recommendations),
                'method_used': ai_service.last_method_used,
                'cache_hit': False
            },
            processing_time_ms=processing_time,
            model_versions=ai_service.get_model_versions()
        )
        
    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

#### 2. **Chat Integration**

**Client** отправляет сообщения в AI чат:
```typescript
// client/src/hooks/useAIChat.ts
const useAIChat = () => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  
  const sendMessage = async (prompt: string) => {
    setIsLoading(true)
    
    try {
      const response = await api.post('/intelligence/chat', { prompt })
      
      const aiMessage = {
        id: generateId(),
        text: response.data.message,
        sender: 'ai',
        timestamp: new Date(),
        intent: response.data.intent,
        suggestions: response.data.suggestions
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return { messages, sendMessage, isLoading }
}
```

**Server** обрабатывает через AI Orchestrator:
```javascript
// server/controllers/intelligence.controller.ts
export const handleChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt } = req.body
    const userId = req.user?.id
    
    // Сборка контекста пользователя
    const context = await userContextService.buildContext(userId)
    
    // Обращение к AI Orchestrator
    const response = await aiOrchestrator.handleRequest(prompt, userId)
    
    res.json({
      success: true,
      data: {
        message: response.message,
        intent: response.intent,
        confidence: response.confidence,
        suggestions: response.suggestions,
        data: response.data
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}
```

#### 3. **Data Flow для Machine Learning**

**Сбор данных** из приложения для обучения:
```javascript
// server/services/analytics.service.js
class AnalyticsService {
  async trackUserInteraction(userId, action, data) {
    // Сохраняем в БД для AI
    await ActivityLog.create({
      userId,
      action,
      data: JSON.stringify(data),
      timestamp: new Date()
    })
    
    // Отправляем в AI для online learning
    if (this.shouldSendToAI(action)) {
      await this.sendToAIService({
        user_id: userId,
        interaction_type: action,
        interaction_data: data,
        timestamp: new Date().toISOString()
      })
    }
  }
  
  async sendToAIService(interactionData) {
    try {
      await axios.post(`${AI_SERVICE_URL}/learn`, interactionData)
    } catch (error) {
      console.error('Failed to send data to AI:', error)
      // Не критично, продолжаем работу
    }
  }
}
```

**AI система** получает обратную связь:
```python
# ai/monitoring_service.py
@app.post("/learn")
async def receive_user_feedback(interaction: UserInteraction):
    """Получение обратной связи для online learning"""
    
    try:
        # Сохраняем взаимодействие
        await save_interaction_to_db(interaction)
        
        # Обновляем метрики качества
        if interaction.interaction_type == 'recommendation_click':
            await update_recommendation_metrics(
                interaction.user_id,
                interaction.interaction_data['product_id'],
                positive_feedback=True
            )
        
        # Триггерим переобучение если нужно
        if should_retrain():
            await trigger_model_retraining()
        
        return {"status": "success", "message": "Feedback received"}
        
    except Exception as e:
        logger.error(f"Error processing feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

### 🎯 Результирующая экосистема

**Полный цикл работы системы:**

1. **Пользователь** заходит в приложение → **Client** (React)
2. **Client** запрашивает рекомендации → **Server** (Node.js)
3. **Server** собирает контекст пользователя → **PostgreSQL**
4. **Server** вызывает AI сервис → **AI** (Python FastAPI)
5. **AI** анализирует данные через ML модели → **Рекомендации**
6. **AI** генерирует объяснения через LLM → **Сценарии свиданий**
7. **Server** обогащает данные из БД → **Полные рекомендации**
8. **Client** отображает персонализированные рекомендации → **UI**
9. **Пользователь** взаимодействует с рекомендациями → **Feedback**
10. **System** отправляет обратную связь в AI → **Continuous Learning**

---

**Система спроектирована как единая экосистема, где каждый компонент имеет четкую ответственность, но все работают синхронно для создания seamless пользовательского опыта.**


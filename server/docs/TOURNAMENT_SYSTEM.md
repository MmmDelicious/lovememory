# 🏆 Система турниров

## Обзор

Новая система турниров предоставляет полноценную платформу для проведения соревнований между пользователями. Система поддерживает различные форматы турниров, автоматическое формирование сеток и управление матчами.

## 🏗️ Архитектура

### Основные компоненты

1. **Tournament** - основная модель турнира
2. **TournamentMatch** - модель матча в турнире
3. **GameParticipant** - участник турнира
4. **TournamentController** - API контроллер
5. **Tournament Routes** - API маршруты

### Схема базы данных

```
tournaments
├── id (UUID, PK)
├── name (STRING)
├── description (TEXT)
├── type (ENUM: single_elimination, double_elimination, round_robin, swiss)
├── status (ENUM: preparing, registering, active, completed, cancelled)
├── max_participants (INTEGER)
├── entry_fee_coins (INTEGER)
├── prize_pool (INTEGER)
├── start_date (DATE)
├── end_date (DATE)
├── creator_id (UUID, FK -> users)
└── metadata (JSONB)

tournament_matches
├── id (UUID, PK)
├── tournament_id (UUID, FK -> tournaments)
├── round (INTEGER)
├── position (INTEGER)
├── participant1_id (UUID, FK -> game_participants)
├── participant2_id (UUID, FK -> game_participants)
├── winner_id (UUID, FK -> game_participants)
├── status (ENUM: pending, waiting, active, completed)
├── game_room_id (UUID, FK -> game_rooms)
└── metadata (JSONB)
```

## 🔄 Жизненный цикл турнира

### 1. Создание (preparing)
- Турнир создается в статусе `preparing`
- Настраиваются параметры: тип, количество участников, призовой фонд

### 2. Регистрация (registering)
- Турнир переходит в статус `registering`
- Пользователи могут регистрироваться
- Регистрация закрывается при достижении лимита или по времени

### 3. Активный (active)
- Турнир запускается автоматически при вызове `start()`
- Генерируется сетка матчей
- Матчи проходят по очереди

### 4. Завершен (completed)
- Определяется победитель
- Выплачиваются призовые
- Турнир архивируется

## 🎯 Типы турниров

### Single Elimination
- Классическая система на выбывание
- Победитель каждого матча проходит дальше
- Проигравший выбывает

### Double Elimination
- Winners bracket + Losers bracket
- Участник выбывает только после двух поражений
- Сложная, но справедливая система

### Round Robin
- Каждый играет с каждым
- Побеждает участник с наибольшим количеством побед
- Подходит для небольших турниров

### Swiss
- Система с рейтингом
- Участники играют с равными по силе соперниками
- Рейтинг обновляется после каждого тура

## 🚀 API Endpoints

### Турниры
- `GET /tournaments` - список турниров
- `POST /tournaments` - создать турнир
- `GET /tournaments/:id` - получить турнир
- `PUT /tournaments/:id` - обновить турнир
- `POST /tournaments/:id/start` - запустить турнир

### Участие
- `POST /tournaments/:id/register` - зарегистрироваться
- `DELETE /tournaments/:id/register` - отменить регистрацию

### Матчи
- `GET /tournaments/:id/matches` - список матчей
- `GET /tournaments/:id/matches/:matchId` - получить матч
- `POST /tournaments/:id/matches/:matchId/ready` - готов к матчу
- `POST /tournaments/:id/matches/:matchId/start` - начать матч
- `POST /tournaments/:id/matches/:matchId/complete` - завершить матч

### Лобби
- `GET /tournaments/:id/lobby` - состояние турнира
- `GET /tournaments/:id/participants` - участники
- `GET /tournaments/:id/stats` - статистика

## 🎮 Match Lobby System

### Состояния матча
1. **pending** - матч создан, ждет готовности участников
2. **waiting** - оба участника готовы, можно начинать
3. **active** - матч идет
4. **completed** - матч завершен

### Процесс готовности
1. Участник вызывает `/ready` endpoint
2. Система отмечает участника как готового
3. Когда оба готовы, матч переходит в статус `waiting`
4. Матч можно начинать

## 🔧 Использование

### Создание турнира
```javascript
const tournament = await Tournament.createTournament({
  name: 'Мой турнир',
  type: 'single_elimination',
  max_participants: 16,
  entry_fee_coins: 100,
  prize_pool: 1000
});
```

### Запуск турнира
```javascript
await tournament.start(); // Автоматически генерирует сетку
```

### Получение состояния
```javascript
const state = await tournament.getTournamentState();
console.log(`Раунд ${state.currentRound} из ${state.totalRounds}`);
```

### Продвижение победителя
```javascript
await tournament.advanceWinner(matchId, winnerId);
```

## 🧪 Тестирование

Запустите тестовый скрипт:
```bash
node server/scripts/test-tournament-bracket.js
```

## 📝 Миграции

Выполните миграцию для создания таблицы `tournament_matches`:
```bash
npx sequelize-cli db:migrate
```

## 🔮 Планы развития

- [ ] Интеграция с WebSocket для real-time обновлений
- [ ] Автоматическое создание GameRoom для матчей
- [ ] Система рейтингов и сезонных турниров
- [ ] Статистика и аналитика турниров
- [ ] Система призов и достижений

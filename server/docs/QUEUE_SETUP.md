# 🚀 Job Queue Setup - LoveMemory Intelligence Core

## Обзор системы

Система фоновых задач позволяет выполнять тяжелые операции анализа не блокируя API ответы пользователям.

### Архитектура

```
[API Server] → [Redis Queue] → [Worker Process] → [Database]
     ↓              ↓              ↓
  Мгновенный    Надёжное        Фоновый
   ответ       хранение        анализ
```

## Требования

1. **Redis Server** - для хранения очередей задач
2. **Node.js** - для работы API и воркеров
3. **PostgreSQL** - основная база данных

## Установка Redis

### Windows (через chocolatey)
```bash
choco install redis-64
redis-server
```

### macOS (через homebrew)
```bash
brew install redis
brew services start redis
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

### Docker (универсально)
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

## Переменные окружения

Добавьте в ваш `.env` файл:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # оставьте пустым для локальной разработки
REDIS_DB=0
```

## Запуск системы

### 1. Запуск основного API сервера
```bash
cd server
npm run dev
```

### 2. Запуск воркера фоновых задач (в отдельном терминале)
```bash
cd server
npm run worker
```

Или для разработки с автоперезагрузкой:
```bash
npm run worker:dev
```

## API Endpoints

### Статус системы
```bash
GET /api/queue/health
GET /api/queue/status
```

### Ручное добавление задач
```bash
# Анализ пользователя
POST /api/queue/analysis
{
  "priority": 10,
  "delay": 0
}

# Генерация инсайтов
POST /api/queue/insight
{
  "eventId": "uuid",
  "priority": 20,
  "delay": 5000
}
```

### Управление очередями
```bash
# Пауза/возобновление
POST /api/queue/manage
{
  "queueName": "analysis",
  "action": "pause"
}

# Очистка (только в development)
DELETE /api/queue/clear-all
```

## Автоматические триггеры

Система автоматически добавляет задачи в очередь при:

1. **Создании нового события** → Анализ + Инсайты (10-15 сек задержка)
2. **Регистрации пользователя** → Первичный анализ (30 сек задержка)
3. **Обновлении профиля** → Переанализ (60 сек задержка)

## Типы задач

### 1. Analysis Queue (`analysis`)
- **Задача**: Полный анализ пользователя
- **Время выполнения**: 5-15 секунд
- **Приоритет**: 10-30 (меньше = выше)
- **Повторы**: 3 попытки с экспоненциальной задержкой

### 2. Insights Queue (`insights`)  
- **Задача**: Генерация инсайтов по событиям
- **Время выполнения**: 3-8 секунд
- **Приоритет**: 20-25
- **Повторы**: 3 попытки

### 3. Maintenance Queue (`maintenance`)
- **Задача**: Очистка данных, статистика
- **Время выполнения**: 1-30 секунд
- **Приоритет**: 30+ (низкий)
- **Повторы**: 2 попытки

## Мониторинг

### Логи воркера
```bash
npm run worker
# 📊 Processing analysis job for user abc-123
# ✅ Analysis completed for user abc-123
# 💡 Processing insight job for user abc-123, event def-456
```

### Web интерфейс (опционально)
Установите Bull Dashboard:
```bash
npm install bull-board
```

### Проверка здоровья
```bash
curl http://localhost:5000/api/queue/health
```

Ответ:
```json
{
  "success": true,
  "data": {
    "overall": "healthy",
    "redis": "connected",
    "queues": {
      "status": "healthy",
      "queues": ["analysis", "insights", "maintenance"]
    }
  }
}
```

## Производственная среда

### Масштабирование
```bash
# Запуск нескольких воркеров
npm run worker &  # Воркер 1
npm run worker &  # Воркер 2
npm run worker &  # Воркер 3
```

### Process Manager (PM2)
```bash
npm install -g pm2

# API сервер
pm2 start index.js --name "lovememory-api"

# Воркеры
pm2 start worker.js --name "lovememory-worker-1"
pm2 start worker.js --name "lovememory-worker-2"

# Автозапуск
pm2 startup
pm2 save
```

### Redis в продакшене
- Используйте Redis Cluster для высокой доступности
- Настройте персистентность (AOF + RDB)
- Мониторинг через Redis Sentinel
- Бэкап данных очередей

## Troubleshooting

### Redis не подключается
```bash
# Проверка Redis
redis-cli ping
# Ответ: PONG

# Проверка портов
netstat -an | grep 6379

# Логи Redis
tail -f /var/log/redis/redis-server.log
```

### Воркер не обрабатывает задачи
1. Проверьте соединение с Redis
2. Убедитесь что очереди не на паузе
3. Проверьте логи воркера на ошибки
4. Перезапустите воркер

### Задачи застревают
```bash
# Очистка застрявших задач
curl -X DELETE http://localhost:5000/api/queue/clear-all
```

### Performance Tips
- Увеличьте `concurrency` в воркерах для параллельной обработки
- Настройте `removeOnComplete` и `removeOnFail` для экономии памяти
- Используйте `priority` для важных задач
- Мониторьте использование памяти Redis

## Преимущества системы

✅ **Мгновенные ответы** - API не ждёт анализа  
✅ **Надёжность** - задачи не теряются при сбоях  
✅ **Масштабируемость** - легко добавить воркеров  
✅ **Мониторинг** - полная видимость процессов  
✅ **Приоритизация** - важные задачи обрабатываются первыми  

🎯 **Результат**: Пользователи получают мгновенные ответы, а тяжёлый анализ происходит в фоне!




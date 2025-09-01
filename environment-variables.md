# Environment Variables для Railway

## Backend (Server) Service

```
# Database (Railway PostgreSQL)
DATABASE_URL=${PGDATABASE}  # Railway автоматически предоставит
DB_HOST=${PGHOST}
DB_PORT=${PGPORT}
DB_NAME=${PGDATABASE}
DB_USER=${PGUSER}
DB_PASSWORD=${PGPASSWORD}

# Redis (Railway Redis)
REDIS_URL=${REDIS_URL}  # Railway автоматически предоставит
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_DB=0

# JWT & Session
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-session-secret-key-min-32-chars

# Google OAuth (получить в Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google AI (получить в Google AI Studio)
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Telegram Bot (получить у @BotFather)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Yandex Maps API
YANDEX_API_KEY=your-yandex-maps-api-key

# URLs (обновить после деплоя)
CLIENT_URL=https://your-frontend-service.railway.app
ALLOWED_ORIGINS=https://your-frontend-service.railway.app

# Environment
NODE_ENV=production
PORT=$PORT  # Railway автоматически установит
```

## Frontend (Client) Service

```
# API URL (обновить после деплоя backend)
VITE_API_URL=https://your-backend-service.railway.app

# Environment
NODE_ENV=production
```

## Инструкции:

1. **Сначала** создайте Backend service с PostgreSQL и Redis
2. **Получите URL backend'а** и укажите его в VITE_API_URL для frontend
3. **Получите URL frontend'а** и укажите его в CLIENT_URL и ALLOWED_ORIGINS для backend
4. **Обновите переменные** после получения реальных доменов Railway

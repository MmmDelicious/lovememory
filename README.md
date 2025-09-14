# 💕 LoveMemory AI - Система рекомендаций для отношений

> **Студенческий проект 2024-2025** | AI-powered система для генерации персонализированных рекомендаций подарков, свиданий и поиска общих интересов в парах.

## 🎯 Основные функции

- **🎁 Рекомендации подарков** - AI анализ предпочтений и языков любви
- **💕 Планирование свиданий** - Персонализированные идеи с реальными местами
- **🔍 Поиск общих интересов** - Анализ совместимости и рекомендации активностей

## 🏗️ Архитектура

```
lovememory/
├── client/          # React + TypeScript фронтенд
├── server/          # Node.js + Express API
├── mobile/          # React Native мобильное приложение
├── ai/              # Python AI сервис (FastAPI)
├── infra/           # Docker, docker-compose
└── docs/            # Документация
```

## 🚀 Быстрый старт

### 1. Клонирование и установка

```bash
git clone <repository-url>
cd lovememory

# Установка зависимостей для всех сервисов
npm install
cd server && npm install
cd ../client && npm install
cd ../mobile && npm install
cd ../ai && pip install -r requirements.txt
```

### 2. Настройка базы данных

```bash
# Запуск PostgreSQL и Redis через Docker
cd infra
docker-compose up -d postgres redis

# Применение миграций
cd ../server
npx sequelize-cli db:migrate

# Загрузка начальных данных (83+ интереса)
npx sequelize-cli db:seed:all
```

### 3. Запуск сервисов

```bash
# Терминал 1: Backend API
cd server
npm run dev

# Терминал 2: Frontend
cd client
npm run dev

# Терминал 3: AI Service
cd ai
uvicorn main:app --reload --port 8001

# Терминал 4: Mobile (опционально)
cd mobile
npm start
```

### 4. Генерация синтетических данных (Фаза 3)

```bash
cd ai
python generate_synthetic.py
```

## 📊 Статус реализации

### ✅ Фаза 0 - Предподготовка (Завершена)
- [x] Структура репозитория
- [x] Python AI сервис с FastAPI
- [x] Docker-compose конфигурация
- [x] Базовые зависимости и requirements.txt

### ✅ Фаза 1 - Схема данных (Завершена)
- [x] Таблицы: users, pairs, interests, user_interests
- [x] Activity logging система
- [x] Relationship profiles
- [x] Product catalog, recommendation history, model metadata

### ✅ Фаза 2 - Onboarding (Завершена)
- [x] Расширенный онбординг с 83+ интересами
- [x] Бюджетные предпочтения (low/medium/high)
- [x] Временные предпочтения (утро/день/вечер/ночь)
- [x] Языки любви с slider'ами интенсивности

### ✅ Фаза 3 - Synthetic Dataset (Завершена)
- [x] 6 архетипов пользователей (Gourmets, Homebodies, Gamers, Travelers, Fitness, ArtLovers)
- [x] Генератор 2000+ виртуальных пар
- [x] 2000+ товаров/мест в каталоге
- [x] Реалистичные взаимодействия с шумом
- [x] Notebook для анализа данных

### 🔄 В разработке
- [ ] Триггеры фидбека после событий
- [ ] Микровзаимодействия (лайки/дизлайки)
- [ ] Yandex.Maps интеграция
- [ ] ML модели рекомендаций

## 🎭 Архетипы пользователей

| Архетип | Основные интересы | Язык любви | Бюджет |
|---------|------------------|------------|--------|
| **Gourmets** | Кулинария, рестораны, вино | Качественное время | Средний |
| **Homebodies** | Домашние активности, сериалы | Физическое прикосновение | Низкий |
| **Gamers** | Видеоигры, квесты, технологии | Получение подарков | Средний |
| **Travelers** | Путешествия, фотография | Качественное время | Высокий |
| **Fitness** | Спорт, здоровье, активность | Акты служения | Средний |
| **ArtLovers** | Искусство, творчество, культура | Слова поддержки | Средний |

## 🛠️ Технологический стек

### Frontend
- **React 18** + TypeScript
- **Vite** для сборки
- **CSS Modules** для стилизации
- **React Router** для навигации

### Backend
- **Node.js** + Express
- **Sequelize** ORM
- **PostgreSQL** база данных
- **Redis** для кэширования
- **Socket.io** для real-time

### AI Service
- **Python 3.9+**
- **FastAPI** для API
- **Pandas** + NumPy для анализа данных
- **Scikit-learn** для ML
- **Sentence-transformers** для embeddings

### Mobile
- **React Native** + Expo
- **TypeScript**
- **React Navigation**

## 📱 API Endpoints

### Основные
- `POST /api/auth/login` - Авторизация
- `POST /api/auth/register` - Регистрация
- `GET /api/interests` - Список интересов
- `POST /api/user-interests` - Сохранение интересов пользователя

### AI Рекомендации
- `POST /api/recommendations/gifts` - Рекомендации подарков
- `POST /api/recommendations/dates` - Рекомендации свиданий
- `POST /api/analysis/compatibility` - Анализ совместимости

### Activity Logging
- `POST /api/log` - Логирование активности
- `GET /api/activity-logs` - История активности

## 🗄️ База данных

### Основные таблицы
- `users` - Пользователи
- `pairs` - Пары
- `interests` - Интересы (83+)
- `user_interests` - Интересы пользователей с интенсивностью
- `relationship_profiles` - Профили отношений
- `activity_logs` - Логи активности
- `product_catalog` - Каталог товаров/мест
- `recommendation_history` - История рекомендаций
- `model_metadata` - Метаданные ML моделей

## 🧪 Тестирование

```bash
# Backend тесты
cd server
npm test

# Frontend тесты
cd client
npm test

# AI сервис тесты
cd ai
python -m pytest
```

## 📈 Мониторинг

- **Логи**: Все действия логируются в `activity_logs`
- **Метрики**: Время ответа, количество запросов, ошибки
- **A/B тесты**: Поддержка экспериментов через `experiment_id`

## 🔧 Разработка

### Добавление новых интересов
```bash
cd server
node seeders/interests-extended-seed.js
```

### Генерация новых синтетических данных
```bash
cd ai
python generate_synthetic.py
```

### Анализ данных
```bash
cd ai/notebooks
jupyter notebook 01_synthetic_explore.ipynb
```

## 📝 Лицензия

MIT License - см. файл LICENSE для деталей.

## 👥 Команда

- **Разработчик**: [Ваше имя]
- **Наставник**: [Имя наставника]
- **Университет**: [Название университета]

## 📞 Контакты

- **Email**: [ваш-email@example.com]
- **GitHub**: [ваш-github]
- **Telegram**: [ваш-telegram]

---

**Создано с ❤️ для LoveMemory**

*AI-powered система для укрепления отношений через персонализированные рекомендации!*

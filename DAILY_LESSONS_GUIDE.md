# 📚 Система ежедневных уроков LoveMemory

## 🎯 Описание

Система ежедневных уроков - это персонализированная платформа для укрепления отношений через интерактивные микро-задания. Каждый день алгоритм подбирает уникальный урок для пары на основе их метрик отношений, языков любви и активности.

## 🏗️ Архитектура

### Backend (Node.js/Express)

#### Модели базы данных:
- **RelationshipMetrics** - метрики отношений пары
- **Lesson** - библиотека уроков с триггерами и эффектами
- **UserLessonProgress** - индивидуальный прогресс пользователей
- **PairDailyLesson** - назначенные уроки для пар

#### Ключевые файлы:
```
server/
├── models/
│   ├── RelationshipMetrics.js
│   ├── Lesson.js
│   ├── UserLessonProgress.js
│   └── PairDailyLesson.js
├── services/
│   └── lesson.service.js
├── routes/
│   └── lesson.routes.js
├── migrations/
│   ├── 20250129000000-update-users-for-lessons.js
│   ├── 20250129000001-create-relationship-metrics.js
│   ├── 20250129000002-create-lessons.js
│   ├── 20250129000003-create-user-lesson-progress.js
│   └── 20250129000004-create-pair-daily-lessons.js
└── seeders/
    └── 20250129000000-seed-lessons.js
```

### Frontend (React/TypeScript)

#### Компоненты:
- **DailyLesson** - отображение урока дня
- **LessonProgress** - прогресс по урокам и темам
- **LessonsPage** - основная страница с табами

#### Ключевые файлы:
```
client/src/
├── components/
│   ├── DailyLesson/
│   │   ├── DailyLesson.tsx
│   │   └── DailyLesson.module.css
│   └── LessonProgress/
│       ├── LessonProgress.tsx
│       └── LessonProgress.module.css
├── pages/
│   └── LessonsPage/
│       ├── LessonsPage.tsx
│       └── LessonsPage.module.css
└── services/
    └── lesson.service.ts
```

## 🔧 Алгоритм подбора уроков

### 1. Сбор данных
- Метрики отношений пары (scores, heat_score, стадия отношений)
- Streak пользователей
- Количество дней с последней активности

### 2. Фильтрация по триггерам
```javascript
triggers: {
  love_language: ['words', 'acts'],
  context: ['low_heat'],
  gap_days: [2, 'more'],
  relationship_stage: ['established', 'mature']
}
```

### 3. Расчет скора
```javascript
score = (match_language * 0.6) + (heat_impact * 0.3) + (novelty * 0.1)
```

### 4. Выбор с элементом рандомности
Выбирается один из топ-3 уроков для разнообразия.

## 🎮 Интерактивные типы уроков

1. **prompt** - простое текстовое задание
2. **chat** - обмен сообщениями с партнером
3. **photo** - загрузка фотографии
4. **quiz** - вопросы с выбором ответа
5. **choice** - выбор из предложенных активностей

## 💰 Система наград

### Базовые награды:
- 10 монет за обычный урок
- 15-25 монет за сложные уроки

### Streak бонусы:
- День 1: +0
- День 2: +5
- День 3: +10
- ...
- День 10+: +50 (максимум)

### Эффекты на метрики:
```javascript
effect: {
  words: 2,    // +2 к языку любви "слова"
  heat: 1,     // +1 к heat_score
  acts: 3      // +3 к языку любви "дела"
}
```

## 🔄 WebSocket синхронизация

### События:
- `lesson:join-room` - присоединение к комнате урока
- `lesson:completed` - завершение урока партнером
- `lesson:progress-updated` - обновление прогресса
- `lesson:start-together` - начало совместного урока

## 📊 API эндпоинты

```
GET    /api/lessons/daily           - Урок дня
POST   /api/lessons/:id/complete    - Выполнить урок
GET    /api/lessons/progress        - Прогресс пары
GET    /api/lessons/history         - История уроков
GET    /api/lessons/stats           - Статистика пользователя
GET    /api/lessons/themes          - Прогресс по темам
POST   /api/lessons/relationship/metrics - Обновить метрики
GET    /api/lessons/weekly          - Уроки недели
```

## 🎨 Темы уроков

1. **words_of_affirmation** - Слова поддержки
2. **acts_of_service** - Дела заботы
3. **receiving_gifts** - Подарки
4. **quality_time** - Время вместе
5. **physical_touch** - Прикосновения
6. **heat_boosters** - Разжигание страсти
7. **attachment_healing** - Исцеление привязанности

## 🚀 Запуск системы

### 1. Запуск миграций:
```bash
cd server
npx sequelize-cli db:migrate
```

### 2. Заполнение данными:
```bash
npx sequelize-cli db:seed:all
```

### 3. Запуск сервера:
```bash
npm run dev
```

### 4. Запуск клиента:
```bash
cd client
npm run dev
```

## 📱 Анимации Lottie

В папке `client/src/assets/lessons/` находятся анимации для уроков:
- Love.json
- Relationship.json
- Couple sharing and caring love.json
- И другие...

Анимации автоматически подгружаются для каждого урока.

## 🔮 Будущие улучшения

1. **AI-персонализация** - использование ИИ для создания уникальных уроков
2. **Голосовые уроки** - аудио-задания
3. **Видео-уроки** - интерактивные видео
4. **Групповые вызовы** - совместные уроки в реальном времени
5. **Достижения** - система бейджей и наград
6. **Календарь привычек** - визуализация streak
7. **Напоминания** - push-уведомления
8. **Экспорт прогресса** - отчеты о развитии отношений

## 🎯 Ключевые метрики успеха

- **Retention rate** - процент пользователей, возвращающихся каждый день
- **Completion rate** - процент выполненных уроков
- **Pair engagement** - активность обоих партнеров
- **Heat score improvement** - улучшение показателей отношений
- **Streak length** - длительность streak пользователей

## 🛠️ Техническая документация

### Зависимости:
- **Backend**: Express, Sequelize, Socket.io, JWT
- **Frontend**: React, TypeScript, Framer Motion, Lottie React

### Конфигурация:
- PostgreSQL база данных
- Redis для кеширования (опционально)
- WebSocket для real-time синхронизации

---

**Система готова к использованию!** 🎉

Все компоненты интегрированы и протестированы. Пользователи могут начать получать персонализированные уроки для укрепления своих отношений.

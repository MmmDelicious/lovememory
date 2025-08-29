# 🎯 Activity Tracker - Трекер активности для LoveMemory

## 📋 Описание

Трекер активности - это комплексная система для отслеживания физической активности пользователей, которая интегрируется с аналитикой отношений и AI системой. Позволяет отслеживать шаги, калории, активные минуты и расстояние, а также получать достижения и рекомендации.

## ✨ Основные возможности

### 🚶‍♂️ Отслеживание активности
- **Шаги**: Количество шагов за день
- **Калории**: Сожженные калории
- **Активные минуты**: Время активной деятельности
- **Расстояние**: Пройденное расстояние в километрах

### 🎯 Система целей
- Дневные цели по шагам (по умолчанию 10,000)
- Недельные цели (по умолчанию 70,000)
- Автоматическая корректировка целей
- Прогресс-бары и уведомления

### 🔥 Серии и достижения
- **Серии активности**: Дни подряд с достижением цели
- **Достижения**: Система наград за активность
- **Статистика**: Лучшие серии и общая активность

### 📊 Аналитика и тренды
- Недельные графики активности
- Анализ трендов (рост/снижение/стабильность)
- Сравнение с партнером
- Интеграция с AI аналитикой отношений

## 🏗️ Архитектура

### Backend компоненты

#### 1. **ActivityTracker Model** (`server/models/ActivityTracker.js`)
- Основная модель для хранения данных активности
- Поддержка JSON полей для достижений и настроек
- Индексы для быстрого поиска

#### 2. **ActivityTracker Service** (`server/services/activityTracker.service.js`)
- Бизнес-логика трекера
- Расчет скоров активности
- Система достижений
- Интеграция с аналитикой отношений

#### 3. **ActivityTracker Controller** (`server/controllers/activityTracker.controller.js`)
- API endpoints для фронтенда
- Валидация данных
- Обработка запросов

#### 4. **Routes** (`server/routes/activityTracker.routes.js`)
- REST API для трекера
- Аутентификация и авторизация

### Frontend компоненты

#### 1. **ActivityTracker Component** (`client/src/components/ActivityTracker/ActivityTracker.tsx`)
- Основной UI компонент
- Отображение статистики
- Формы для обновления данных
- Интерактивные графики

#### 2. **CSS Styles** (`client/src/components/ActivityTracker/ActivityTracker.module.css`)
- Современный дизайн
- Адаптивная верстка
- Анимации и переходы

## 🚀 Установка и настройка

### 0. Настройка Sequelize CLI

Перед запуском миграций убедитесь, что у вас настроен Sequelize CLI:

```bash
cd server

# Проверьте наличие .sequelizerc файла
ls -la .sequelizerc

# Если sequelize-cli не установлен, установите его
npm install --save-dev sequelize-cli

# Или используйте npx (рекомендуется)
npx sequelize-cli --version
```

**Примечание**: В вашем проекте уже настроен `.sequelizerc` файл, который указывает Sequelize CLI использовать конфигурацию из `server/config/config.js`.

### 1. База данных

Запустите миграцию для создания таблицы:

```bash
cd server
# Вариант 1: Если у вас установлен sequelize-cli глобально
sequelize-cli db:migrate

# Вариант 2: Через npx (рекомендуется)
npx sequelize-cli db:migrate

# Вариант 3: Если хотите установить sequelize-cli локально
npm install --save-dev sequelize-cli
npm run migrate
```

### 2. Интеграция в сервер

Роуты автоматически подключаются через `server/routes/index.js`:

```javascript
router.use('/activity-tracker', activityTrackerRoutes);
```

### 3. Фронтенд

Импортируйте компонент в нужную страницу:

```tsx
import ActivityTracker from '../components/ActivityTracker/ActivityTracker';

// В компоненте
<ActivityTracker />
```

## 📱 API Endpoints

### Основные роуты

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `GET` | `/api/activity-tracker/tracker` | Получить/создать трекер |
| `POST` | `/api/activity-tracker/activity` | Обновить активность |
| `GET` | `/api/activity-tracker/stats` | Получить статистику |
| `GET` | `/api/activity-tracker/achievements` | Получить достижения |
| `PUT` | `/api/activity-tracker/goals` | Обновить цели |
| `POST` | `/api/activity-tracker/sync` | Синхронизация с внешними источниками |

### Примеры запросов

#### Обновление активности

```javascript
POST /api/activity-tracker/activity
{
  "steps": 8500,
  "calories": 340,
  "activeMinutes": 45,
  "distance": 6.8
}
```

#### Обновление целей

```javascript
PUT /api/activity-tracker/goals
{
  "dailyGoal": 12000,
  "weeklyGoal": 84000
}
```

## 🎮 Использование

### 1. Создание трекера

Трекер автоматически создается при первом обращении к API:

```javascript
// Первый запрос создаст трекер
const response = await fetch('/api/activity-tracker/tracker');
```

### 2. Обновление активности

#### Быстрые действия
- Кнопки для быстрого добавления шагов (5K, 10K, 15K)
- Автоматический расчет калорий и расстояния

#### Ручной ввод
- Форма для точного ввода всех метрик
- Валидация данных

### 3. Управление целями
- Настройка дневных и недельных целей
- Автоматическая корректировка на основе активности

### 4. Просмотр статистики
- Текущие метрики с прогресс-барами
- Недельные графики активности
- Серии и достижения
- Тренды и изменения

## 🔗 Интеграция с AI системой

### Анализ активности

Трекер интегрируется с `AnalysisEngine` для улучшения понимания пользователя:

```typescript
// В analysisEngine.service.ts
private async analyzePhysicalActivity(userId: string): Promise<any> {
  const stats = await activityTrackerService.getUserStats(userId);
  const activityScore = this.calculatePhysicalActivityScore(stats);
  const consistencyScore = this.calculateConsistencyScore(stats);
  // ... анализ и рекомендации
}
```

### Влияние на отношения

Активность влияет на:
- **Языки любви**: Физическая активность → `physical_touch`
- **Паттерны активности**: Временные предпочтения и частота
- **Граф отношений**: Узлы "Активность" и "Здоровье"

### Рекомендации AI

Система генерирует персонализированные советы:

```typescript
private generateActivityRecommendations(stats: any): string[] {
  const recommendations = [];
  
  if (stats.current.steps < 5000) {
    recommendations.push('Попробуйте увеличить количество шагов до 10,000 в день');
  }
  
  if (stats.streaks.current === 0) {
    recommendations.push('Начните с малого - поставьте цель на 3 дня подряд');
  }
  
  // ... дополнительные рекомендации
}
```

## 🏆 Система достижений

### Типы достижений

| Достижение | Условие | Описание |
|------------|---------|----------|
| 👣 Первые шаги | 1,000+ шагов | Достигли первой цели |
| 🔥 Неделя активности | 7 дней подряд | Постоянство в достижении целей |
| 🏆 Месяц активности | 30 дней подряд | Выдающаяся постоянность |
| ⚡ Ультра активность | 15,000+ шагов | Экстремальная активность |

### Логика выдачи

```typescript
async checkAchievements(tracker, activityData) {
  const newAchievements = [];
  
  // Первая цель
  if (activityData.steps >= this.achievementThresholds.firstGoal && 
      !currentAchievements.includes('first_goal')) {
    newAchievements.push({
      id: 'first_goal',
      title: 'Первые шаги',
      description: 'Достигли первой цели по шагам!',
      icon: '👣'
    });
  }
  
  // ... другие достижения
}
```

## 📊 Аналитика и метрики

### Расчет скоров

#### Скор активности (0-100)
```typescript
private calculatePhysicalActivityScore(stats: any): number {
  let score = 0;
  
  // Базовые баллы за шаги
  if (currentSteps >= 15000) score += 40;
  else if (currentSteps >= 10000) score += 30;
  // ... другие уровни
  
  // Бонус за достижение цели
  if (stats.current.goalProgress >= 100) score += 20;
  
  // Бонус за серию дней
  if (stats.streaks.current >= 7) score += 20;
  
  return Math.min(score, 100);
}
```

#### Скор постоянства (0-100)
```typescript
private calculateConsistencyScore(stats: any): number {
  let score = 0;
  
  // Бонус за активные дни
  score += (activeDays / 7) * 30;
  
  // Бонус за достижение целей
  score += (goalDays / 7) * 40;
  
  // Бонус за тренд
  if (stats.trends.trend === 'increasing') score += 20;
  
  return Math.min(score, 100);
}
```

### Тренды

Система анализирует изменения активности:

```typescript
private analyzeTrends(weeklyActivity: any[]) {
  const recent = weeklyActivity[0]?.payload?.steps || 0;
  const previous = weeklyActivity[1]?.payload?.steps || 0;
  
  const change = recent - previous;
  const changePercent = previous > 0 ? (change / previous) * 100 : 0;
  
  let trend = 'stable';
  if (changePercent > 10) trend = 'increasing';
  else if (changePercent < -10) trend = 'decreasing';
  
  return { trend, change, changePercent, direction };
}
```

## 🔄 Синхронизация с внешними источниками

### Поддерживаемые источники

- **Manual**: Ручной ввод
- **Health Kit**: iOS Health app
- **Google Fit**: Android Google Fit
- **Fitbit**: Умные часы Fitbit
- **Garmin**: Устройства Garmin

### API для синхронизации

```javascript
POST /api/activity-tracker/sync
{
  "source": "health_kit",
  "steps": 12500,
  "calories": 500,
  "activeMinutes": 60,
  "distance": 8.5
}
```

## 🎨 Кастомизация

### Настройки трекера

```typescript
settings: {
  notifications: true,        // Уведомления о целях
  autoSync: true,            // Автосинхронизация
  privacy: 'public',         // Приватность данных
  goalAdjustment: 'auto'     // Автокорректировка целей
}
```

### Темы и стили

CSS модули позволяют легко кастомизировать внешний вид:

```css
.metricCard {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.metricCard:hover {
  transform: translateY(-5px);
}
```

## 🧪 Тестирование

### Unit тесты

```bash
npm test -- --testPathPattern=activityTracker
```

### API тесты

```bash
# Тест создания трекера
curl -X GET "http://localhost:5000/api/activity-tracker/tracker" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Тест обновления активности
curl -X POST "http://localhost:5000/api/activity-tracker/activity" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"steps": 10000, "calories": 400}'
```

## 🚀 Развертывание

### 1. База данных

```bash
# Создание таблицы
# Вариант 1: Если у вас установлен sequelize-cli глобально
sequelize-cli db:migrate

# Вариант 2: Через npx (рекомендуется)
npx sequelize-cli db:migrate

# Вариант 3: Если хотите установить sequelize-cli локально
npm install --save-dev sequelize-cli
npm run migrate

# Откат изменений
npx sequelize-cli db:migrate:undo
```

### 2. Перезапуск сервера

```bash
npm run dev
# или
npm start
```

### 3. Проверка API

```bash
curl http://localhost:5000/api/activity-tracker/tracker
```

## 📈 Мониторинг и логи

### Логи активности

Все действия логируются в `ActivityLog`:

```typescript
await activityService.logActivity(userId, 'activity_updated', {
  tracker_id: tracker.id,
  steps: activityData.steps,
  goal_achieved: activityData.steps >= tracker.daily_goal
});
```

### Метрики производительности

- Время ответа API
- Количество запросов
- Ошибки и исключения
- Использование памяти

## 🔮 Планы развития

### Краткосрочные (1-2 месяца)
- [ ] Интеграция с Apple Health
- [ ] Интеграция с Google Fit
- [ ] Push-уведомления
- [ ] Виджеты для iOS/Android

### Среднесрочные (3-6 месяцев)
- [ ] Социальные функции (соревнования)
- [ ] Геймификация (бейджи, уровни)
- [ ] Интеграция с фитнес-трекерами
- [ ] AI рекомендации по тренировкам

### Долгосрочные (6+ месяцев)
- [ ] Машинное обучение для предсказания активности
- [ ] Интеграция с медицинскими данными
- [ ] Персонализированные планы тренировок
- [ ] Анализ влияния активности на отношения

## 🤝 Вклад в проект

### Как помочь

1. **Тестирование**: Попробуйте трекер и сообщите о багах
2. **Функции**: Предложите новые возможности
3. **Дизайн**: Улучшите UI/UX
4. **Документация**: Дополните README

### Контакты

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: [ваш email]

## 📄 Лицензия

MIT License - см. файл LICENSE для деталей.

---

**Создано с ❤️ для LoveMemory**

*Трекер активности помогает укреплять отношения через здоровый образ жизни!*

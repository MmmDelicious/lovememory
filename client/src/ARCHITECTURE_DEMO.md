# 🎯 Новая Модульная Архитектура Календаря

## 📁 Структура проекта

```
src/
├── 🎨 ui/                          # Базовые UI компоненты (без бизнес-логики)
│   └── calendar/
│       ├── MiniCalendar/           # Компактный календарь
│       ├── EventCard/              # Карточка события  
│       ├── FilterButton/           # Кнопка фильтра
│       ├── ActionButton/           # Кнопка действия
│       └── DateCell/               # Ячейка даты
│
├── 🧩 components/                  # Переиспользуемые компоненты (простая логика)
│   └── calendar/
│       ├── CalendarFilters/        # Панель фильтров
│       ├── EventTemplatesList/     # Список шаблонов событий
│       └── CalendarToolbar/        # Панель инструментов
│
├── 🏗️ modules/events/modules/     # Самостоятельные модули (бизнес-логика)
│   ├── CalendarModule/             # Управление календарем
│   ├── DayDetailModule/            # Детали дня
│   └── EventFormModule/            # Форма событий (будущее)
│
└── 📄 modules/events/pages/       # Тонкие страницы (навигация)
    ├── CalendarPage/               # Страница календаря
    └── DayDetailPage/              # Страница дня
```

## 🎯 Принципы SOLID в действии

### 🔸 Single Responsibility Principle (SRP)
- **UI компоненты**: Только представление
- **Components**: Простая логика взаимодействия  
- **Modules**: Бизнес-логика и состояние
- **Pages**: Навигация и маршрутизация

### 🔸 Open/Closed Principle (OCP)
- Модули легко расширяются новой функциональностью
- UI компоненты принимают пропсы для кастомизации

### 🔸 Interface Segregation Principle (ISP)
- Четкие интерфейсы между слоями
- Компоненты зависят только от нужных им данных

### 🔸 Dependency Inversion Principle (DIP)
- Pages зависят от модулей через интерфейсы
- Modules используют компоненты через props

## 📊 Поток данных

```
┌─────────────┐    использует    ┌─────────────┐
│   Pages     │ ─────────────────► │   Modules   │
│ (тонкие)    │                   │ (бизнес)    │
└─────────────┘                   └─────────────┘
                                         │
                                         │ использует
                                         ▼
                                  ┌─────────────┐
                                  │ Components  │
                                  │ (логика)    │
                                  └─────────────┘
                                         │
                                         │ использует
                                         ▼
                                  ┌─────────────┐
                                  │     UI      │
                                  │ (представл.) │
                                  └─────────────┘
```

## 🚀 Использование

### CalendarPage (тонкая страница)
```tsx
import { CalendarModule } from '../modules';

const CalendarPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <CalendarModule
      userId={user.id}
      onEventClick={(eventId, date) => navigate(`/day/${date}`)}
      onDateClick={(date) => navigate(`/day/${date}`)}
    />
  );
};
```

### CalendarModule (бизнес-логика)
```tsx
export const CalendarModule = ({ userId, onEventClick }) => {
  const { events, createEvent, updateEvent } = useEvents(userId);
  const { formattedEvents, handleEventDrop } = useCalendar({...});

  return (
    <>
      <CalendarToolbar {...toolbarProps} />
      <CalendarFilters {...filterProps} />
      <FullCalendar events={formattedEvents} onEventClick={onEventClick} />
    </>
  );
};
```

### CalendarFilters (простая логика)
```tsx
export const CalendarFilters = ({ activeFilter, onFilterChange }) => {
  return (
    <div>
      {FILTER_CONFIGS.map(filter => (
        <FilterButton
          key={filter.id}
          isActive={activeFilter === filter.id}
          onClick={() => onFilterChange(filter.id)}
        />
      ))}
    </div>
  );
};
```

### FilterButton (UI компонент)
```tsx
export const FilterButton = ({ isActive, onClick, children }) => {
  return (
    <button 
      className={isActive ? 'active' : ''}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

## ✅ Преимущества новой архитектуры

### 🎯 Четкое разделение ответственности
- UI компоненты: только представление
- Components: простая логика без состояния  
- Modules: вся бизнес-логика и API
- Pages: только навигация

### 🔄 Переиспользование компонентов
- UI компоненты используются во всех модулях
- Components переиспользуются между страницами
- Modules независимы и самодостаточны

### 🧪 Легкое тестирование
- UI компоненты: snapshot-тесты
- Components: unit-тесты логики
- Modules: integration-тесты
- Pages: e2e-тесты навигации

### 📈 Масштабируемость
- Новые модули добавляются независимо
- UI библиотека растет органично
- Pages остаются простыми

### 🐛 Упрощенная отладка
- Ошибки локализованы в конкретном слое
- Четкая трассировка потока данных
- Изолированное состояние модулей

## 🎨 Стилизация

### CSS Modules для изоляции
- Каждый компонент имеет свои стили
- Нет конфликтов имен классов
- Четкая структура стилей

### Единообразный дизайн
- UI компоненты следуют дизайн-системе
- Переменные CSS для цветов и размеров
- Responsive design из коробки

## 🏁 Результат

Получили чистую, масштабируемую архитектуру календаря, которая:
- ✅ Следует принципам SOLID
- ✅ Легко тестируется и поддерживается  
- ✅ Позволяет переиспользовать компоненты
- ✅ Упрощает добавление новой функциональности
- ✅ Обеспечивает четкое разделение ответственности

# BaseModal Component

Универсальный компонент модального окна для приложения LoveMemory.

## Использование

```tsx
import BaseModal from '../BaseModal/BaseModal';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Заголовок модала"
      maxWidth="md"
    >
      <p>Содержимое модала</p>
    </BaseModal>
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Открыто ли модальное окно |
| `onClose` | `() => void` | - | Функция закрытия модала |
| `title` | `string?` | - | Заголовок модала (опционально) |
| `children` | `React.ReactNode` | - | Содержимое модала |
| `maxWidth` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Максимальная ширина модала |
| `showCloseButton` | `boolean` | `true` | Показывать ли кнопку закрытия |
| `closeOnOverlayClick` | `boolean` | `true` | Закрывать ли при клике на overlay |
| `className` | `string` | `''` | Дополнительные CSS классы |

## Размеры

- `sm`: 400px
- `md`: 480px  
- `lg`: 640px
- `xl`: 800px

## Особенности

- ✅ Закрытие по клавише Escape
- ✅ Блокировка скролла body при открытии
- ✅ Плавные анимации появления/исчезновения
- ✅ Адаптивный дизайн для мобильных устройств
- ✅ Accessibility поддержка
- ✅ Настраиваемые размеры
- ✅ Опциональный заголовок и кнопка закрытия

## Замена существующих модалов

Для унификации интерфейса рекомендуется постепенно переводить все модальные окна на использование `BaseModal`:

```tsx
// Старый способ
<div className={styles.overlay}>
  <div className={styles.modal}>
    <div className={styles.header}>
      <h2>{title}</h2>
      <button onClick={onClose}>×</button>
    </div>
    <div className={styles.content}>
      {children}
    </div>
  </div>
</div>

// Новый способ
<BaseModal isOpen={isOpen} onClose={onClose} title={title}>
  {children}
</BaseModal>
```

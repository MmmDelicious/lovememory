# Инструкция по возврату авторизации

## Что было временно отключено

Для тестирования была временно отключена система авторизации. Сейчас приложение работает в режиме "без авторизации" со встречающей страницей About и доступом ко всем функциям.

## Измененные файлы

### 1. `client/src/App.tsx`
**Что изменено**: Закомментирован `checkAuthStatus` и добавлена тестовая заглушка

**Как вернуть**:
```typescript
const AppInitializer: React.FC = () => {
  const { setUser, setLoading } = useAuthActions();
  const { setCoins, resetCurrency } = useCurrencyActions();

  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      
      try {
        // Всегда проверяем сервер независимо от localStorage
        // так как токен теперь в httpOnly cookie
        const userData = await authService.getMe();
        
        setUser(userData);
        
        if (userData.coins !== undefined && userData.coins !== null) {
          setCoins(userData.coins);
        } else {
          setCoins(1000);
        }
      } catch (error) {
        // Это нормальное поведение когда пользователь не авторизован
        // Очищаем только localStorage, httpOnly cookie управляется сервером
        clearAuthToken();
        resetCurrency();
      }
      
      setLoading(false);
    };

    checkAuthStatus();
  }, [setUser, setCoins, setLoading, resetCurrency]);

  return null;
};
```

### 2. `client/src/AppRoutes.tsx`
**Что изменено**: 
- Закомментирована проверка `if (!user)`
- Изменены редиректы с `/dashboard` на `/about`

**Как вернуть**:

1. **Раскомментировать блок проверки авторизации**:
```typescript
if (!user) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/about" />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
```

2. **Вернуть оригинальные редиректы**:
```typescript
<Route path="/" element={<Navigate to="/dashboard" replace />} />
<Route path="/login" element={<Navigate to="/dashboard" replace />} />
<Route path="/register" element={<Navigate to="/dashboard" replace />} />
<Route path="/auth/callback" element={<Navigate to="/dashboard" replace />} />
<Route path="*" element={<Navigate to="/dashboard" replace />} />
```

3. **Убрать временную About страницу из авторизованного блока**:
```typescript
// Удалить эту строку:
<Route path="/about" element={<AboutPage />} />
```

## Как работает сейчас

1. **Стартовая страница**: `/about` (AboutPage)
2. **Все функции доступны**: календарь, игры, уроки, профиль, магазин, аналитика
3. **Фейковый пользователь**: устанавливается автоматически со следующими данными:
   ```javascript
   {
     id: 'test-user-id',
     email: 'test@example.com', 
     first_name: 'Тест',
     last_name: 'Пользователь'
   }
   ```
4. **Монеты**: 1000 (тестовое значение)

## Полное восстановление авторизации

1. Откройте `client/src/App.tsx`
2. Найдите комментарий `// ВРЕМЕННО ОТКЛЮЧЕНО ДЛЯ ТЕСТИРОВАНИЯ`
3. Раскомментируйте весь блок `checkAuthStatus`
4. Удалите тестовую заглушку с `setTimeout`

5. Откройте `client/src/AppRoutes.tsx`
6. Найдите комментарий `// ВРЕМЕННО ОТКЛЮЧЕНО ДЛЯ ТЕСТИРОВАНИЯ`
7. Раскомментируйте блок `if (!user)`
8. Верните оригинальные редиректы на `/dashboard`
9. Удалите временную About страницу из авторизованного блока

После этого приложение вернется к нормальной работе с авторизацией.

## Проверка восстановления

После возврата авторизации:
- Неавторизованные пользователи увидят только About/Auth страницы
- После авторизации будет редирект на `/dashboard`
- Все защищенные маршруты снова потребуют авторизации

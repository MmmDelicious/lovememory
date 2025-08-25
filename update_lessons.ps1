Write-Host "🚀 Обновляем уроки в базе данных..." -ForegroundColor Green

# Переходим в директорию сервера
Set-Location server

# Очищаем таблицу уроков
Write-Host "🗑️  Очищаем существующие уроки..." -ForegroundColor Yellow
npx sequelize-cli db:seed:undo --seed 20250129000000-seed-lessons.js

# Запускаем новый сидер с обновленными данными
Write-Host "📚 Загружаем новые уроки..." -ForegroundColor Blue
npx sequelize-cli db:seed --seed 20250129000000-seed-lessons.js

Write-Host "✅ Уроки успешно обновлены!" -ForegroundColor Green

# Возвращаемся в корневую директорию
Set-Location ..

Write-Host "🎯 Готово! Теперь можно запускать приложение." -ForegroundColor Cyan

#!/usr/bin/env node

/**
 * Скрипт для просмотра AI логов в удобном формате
 */

const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../logs/ai-requests.log');

console.log('📊 Просмотр AI логов LoveMemory\n');

if (!fs.existsSync(logFile)) {
  console.log('📝 Лог файл не найден. Возможно еще не было AI запросов.');
  console.log(`💡 Ожидаемый путь: ${logFile}`);
  process.exit(0);
}

const content = fs.readFileSync(logFile, 'utf8');

if (!content.trim()) {
  console.log('📝 Лог файл пустой. Возможно еще не было AI запросов.');
  process.exit(0);
}

// Разбиваем на записи
const entries = content.split('='.repeat(80));
const validEntries = entries.filter(entry => entry.trim().length > 0);

console.log(`📈 Найдено записей: ${validEntries.length}\n`);

// Показываем последние 5 записей
const recentEntries = validEntries.slice(-5);

recentEntries.forEach((entry, index) => {
  const lines = entry.trim().split('\n');
  const header = lines.find(line => line.includes('ЗАПУСК'));
  
  if (header) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(header);
    
    // Ищем основную информацию
    const userLine = lines.find(line => line.includes('👤 Пользователь:'));
    const pairLine = lines.find(line => line.includes('💑 Пара:'));
    const timeLine = lines.find(line => line.includes('📅 Время:'));
    
    if (timeLine) console.log(timeLine);
    if (userLine) console.log(userLine);
    if (pairLine) console.log(pairLine);
    
    // Ищем интересы
    const interestsStart = lines.findIndex(line => line.includes('🤝 ОБЩИЕ ИНТЕРЕСЫ'));
    if (interestsStart !== -1) {
      console.log('\n🤝 ОБЩИЕ ИНТЕРЕСЫ:');
      for (let i = interestsStart + 1; i < Math.min(interestsStart + 6, lines.length); i++) {
        if (lines[i].trim() && !lines[i].includes('🔧')) {
          console.log(lines[i]);
        }
      }
    }
    
    // Ищем результаты
    const resultStart = lines.findIndex(line => line.includes('📊 РЕЗУЛЬТАТ'));
    if (resultStart !== -1) {
      console.log('\n📊 РЕЗУЛЬТАТ:');
      for (let i = resultStart; i < Math.min(resultStart + 5, lines.length); i++) {
        if (lines[i].trim()) {
          console.log(lines[i]);
        }
      }
    }
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log('💡 Команды для управления логами:');
console.log('   node view-ai-logs.js              - показать последние 5 записей');
console.log('   tail -f ../logs/ai-requests.log   - следить за логами в реальном времени');
console.log('   ls -la ../logs/                   - посмотреть размер файлов логов');

// Статистика
const stats = fs.statSync(logFile);
console.log(`📊 Размер лог файла: ${(stats.size / 1024).toFixed(2)} KB`);
console.log(`📅 Последнее обновление: ${stats.mtime.toLocaleString()}`);

// Анализ типов запросов
const interestsCount = content.split('COMMON_INTERESTS').length - 1;
const giftsCount = content.split('GIFT_RECOMMENDATIONS').length - 1;
const datesCount = content.split('DATE_GENERATION').length - 1;

console.log('\n📈 Статистика запросов:');
console.log(`   🤝 Поиск интересов: ${interestsCount}`);
console.log(`   🎁 Подбор подарков: ${giftsCount}`);
console.log(`   💕 Генерация свиданий: ${datesCount}`);
console.log(`   📊 Всего: ${interestsCount + giftsCount + datesCount}`);

console.log('\n✅ Готово!');

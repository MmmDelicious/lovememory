#!/usr/bin/env node

/**
 * Скрипт для запуска AI сервиса в фоне
 * Использует PM2 или простой spawn для запуска Python AI
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Запускаем AI сервис для LoveMemory...');

const aiDir = path.join(__dirname, '../../ai');
const logDir = path.join(__dirname, '../logs');

// Создаем папку логов если её нет
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Проверяем наличие AI файлов
const aiFiles = [
  'ultimate_ai_service.py',
  'content_recommender.py', 
  'collaborative_filtering.py'
];

for (const file of aiFiles) {
  const filePath = path.join(aiDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Не найден AI файл: ${file}`);
    process.exit(1);
  }
}

console.log('✅ AI файлы найдены');

// Запускаем AI сервис
const pythonProcess = spawn('python', ['ultimate_ai_service.py'], {
  cwd: aiDir,
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { 
    ...process.env, 
    PYTHONPATH: aiDir,
    PYTHONUNBUFFERED: '1' // Для получения логов в реальном времени
  }
});

let isStarted = false;

pythonProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('🤖 AI:', output.trim());
  
  // Определяем когда сервис готов
  if (output.includes('Uvicorn running') || output.includes('Application startup complete')) {
    if (!isStarted) {
      console.log('✅ AI сервис запущен и готов к работе!');
      console.log('🔗 API доступен на: http://localhost:8000');
      console.log('📖 Документация: http://localhost:8000/docs');
      isStarted = true;
    }
  }
});

pythonProcess.stderr.on('data', (data) => {
  const error = data.toString();
  console.error('❌ AI Error:', error.trim());
});

pythonProcess.on('close', (code) => {
  console.log(`🛑 AI сервис завершен с кодом: ${code}`);
  if (code !== 0) {
    console.error('❌ AI сервис завершился с ошибкой');
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал завершения, останавливаем AI сервис...');
  pythonProcess.kill('SIGTERM');
  setTimeout(() => {
    pythonProcess.kill('SIGKILL');
    process.exit(0);
  }, 5000);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал SIGTERM, останавливаем AI сервис...');
  pythonProcess.kill('SIGTERM');
});

console.log('⏳ Ждем запуска AI сервиса...');
console.log('💡 Для остановки используйте Ctrl+C');

// Timeout для проверки запуска
setTimeout(() => {
  if (!isStarted) {
    console.warn('⚠️  AI сервис запускается дольше обычного...');
    console.log('🔍 Проверьте логи выше на наличие ошибок');
  }
}, 30000); // 30 секунд

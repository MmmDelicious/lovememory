#!/usr/bin/env node
/**
 * Скрипт для проверки и исправления дублирующих запросов пар
 */

const { User, Pair } = require('../models');
const { Op } = require('sequelize');

// Цвета для консоли
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkPairsTable() {
  try {
    log('cyan', '🔍 Проверяем таблицу pairs...\n');

    // Получаем все пары
    const allPairs = await Pair.findAll({
      include: [
        {
          model: User,
          as: 'Requester',
          attributes: ['id', 'email', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'Receiver', 
          attributes: ['id', 'email', 'first_name', 'last_name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    log('blue', `📊 Всего записей в таблице pairs: ${allPairs.length}\n`);

    if (allPairs.length === 0) {
      log('yellow', '⚠️  Таблица pairs пуста');
      return;
    }

    // Группируем по статусам
    const statuses = {};
    allPairs.forEach(pair => {
      if (!statuses[pair.status]) {
        statuses[pair.status] = [];
      }
      statuses[pair.status].push(pair);
    });

    // Выводим статистику по статусам
    Object.keys(statuses).forEach(status => {
      const count = statuses[status].length;
      const color = status === 'active' ? 'green' : status === 'pending' ? 'yellow' : 'red';
      log(color, `${status.toUpperCase()}: ${count} записей`);
    });

    console.log('\n' + '='.repeat(80) + '\n');

    // Детальный анализ каждой пары
    allPairs.forEach((pair, index) => {
      const requesterName = pair.Requester ? 
        `${pair.Requester.first_name || ''} ${pair.Requester.last_name || ''}`.trim() || pair.Requester.email :
        'Unknown';
      const receiverName = pair.Receiver ? 
        `${pair.Receiver.first_name || ''} ${pair.Receiver.last_name || ''}`.trim() || pair.Receiver.email :
        'Unknown';

      const statusColor = pair.status === 'active' ? 'green' : pair.status === 'pending' ? 'yellow' : 'red';
      
      log('bright', `${index + 1}. Пара ID: ${pair.id}`);
      log('reset', `   Статус: ${colors[statusColor]}${pair.status}${colors.reset}`);
      log('reset', `   Инициатор: ${requesterName} (${pair.user1_id})`);
      log('reset', `   Получатель: ${receiverName} (${pair.user2_id})`);
      log('reset', `   Создано: ${pair.createdAt}`);
      log('reset', `   Обновлено: ${pair.updatedAt}\n`);
    });

    // Поиск дублей
    await findDuplicatePairs(allPairs);

  } catch (error) {
    log('red', `❌ Ошибка при проверке таблицы pairs: ${error.message}`);
    console.error(error);
  }
}

async function findDuplicatePairs(allPairs) {
  log('cyan', '\n🔍 Поиск дублирующих запросов...\n');

  const pairsByUsers = {};
  
  // Группируем пары по комбинациям пользователей
  allPairs.forEach(pair => {
    const user1 = pair.user1_id;
    const user2 = pair.user2_id;
    
    // Создаём ключ независимо от порядка пользователей
    const key = [user1, user2].sort().join('-');
    
    if (!pairsByUsers[key]) {
      pairsByUsers[key] = [];
    }
    pairsByUsers[key].push(pair);
  });

  let duplicatesFound = false;

  // Ищем дубли
  Object.keys(pairsByUsers).forEach(key => {
    const pairs = pairsByUsers[key];
    
    if (pairs.length > 1) {
      duplicatesFound = true;
      log('red', `🚨 НАЙДЕНЫ ДУБЛИ для пользователей ${key}:`);
      
      pairs.forEach((pair, index) => {
        const requesterEmail = pair.Requester?.email || 'Unknown';
        const receiverEmail = pair.Receiver?.email || 'Unknown';
        
        log('yellow', `   ${index + 1}. ID: ${pair.id}, Статус: ${pair.status}`);
        log('reset', `      ${requesterEmail} -> ${receiverEmail}`);
        log('reset', `      Создано: ${pair.createdAt}`);
      });
      
      console.log();
    }
  });

  if (!duplicatesFound) {
    log('green', '✅ Дублирующих запросов не найдено!');
  } else {
    log('yellow', '\n💡 Для исправления дублей запустите: node scripts/fix-pairs.js');
  }
}

async function main() {
  try {
    log('bright', '🔍 ДИАГНОСТИКА ТАБЛИЦЫ PAIRS');
    log('bright', '=' * 50 + '\n');
    
    await checkPairsTable();
    
    process.exit(0);
  } catch (error) {
    log('red', `❌ Критическая ошибка: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

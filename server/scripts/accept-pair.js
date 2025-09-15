#!/usr/bin/env node
/**
 * Скрипт для принятия pending запроса пары
 */

const { User, Pair } = require('../models');

// Цвета для консоли
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function acceptPendingPair() {
  try {
    log('cyan', '🔧 Поиск pending запроса...\n');

    // Находим pending пару
    const pendingPair = await Pair.findOne({
      where: {
        status: 'pending'
      },
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
      ]
    });

    if (!pendingPair) {
      log('yellow', '⚠️  Нет pending запросов для принятия');
      return;
    }

    const requesterName = `${pendingPair.Requester.first_name} ${pendingPair.Requester.last_name}`.trim();
    const receiverName = `${pendingPair.Receiver.first_name} ${pendingPair.Receiver.last_name}`.trim();

    log('blue', `📋 Найден запрос:`);
    log('reset', `   От: ${requesterName} (${pendingPair.Requester.email})`);
    log('reset', `   К: ${receiverName} (${pendingPair.Receiver.email})`);
    log('reset', `   ID: ${pendingPair.id}\n`);

    // Принимаем запрос
    pendingPair.status = 'active';
    await pendingPair.save();

    log('green', '🎉 ЗАПРОС ПРИНЯТ!');
    log('green', `✅ ${requesterName} и ${receiverName} теперь подключены как партнёры!`);
    log('green', `📝 Пара ID: ${pendingPair.id} активирована`);

  } catch (error) {
    log('red', `❌ Ошибка: ${error.message}`);
    console.error(error);
  }
}

async function main() {
  try {
    log('bright', '💕 ПРИНЯТИЕ ЗАПРОСА НА ПОДКЛЮЧЕНИЕ');
    log('bright', '=' * 40 + '\n');
    
    await acceptPendingPair();
    
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

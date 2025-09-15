#!/usr/bin/env node
/**
 * Скрипт для исправления дублирующих запросов пар
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

async function fixAllMutualRequests() {
  try {
    log('cyan', '🔧 Начинаем исправление дублирующих запросов...\n');

    // Получаем все pending пары
    const allPairs = await Pair.findAll({
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

    log('blue', `📊 Найдено pending пар: ${allPairs.length}\n`);

    if (allPairs.length === 0) {
      log('green', '✅ Нет pending запросов для обработки');
      return;
    }

    // Группируем по парам пользователей
    const pairsByUsers = {};
    
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

    let fixedCount = 0;
    let deletedCount = 0;

    // Обрабатываем каждую группу
    for (const [key, pairs] of Object.entries(pairsByUsers)) {
      if (pairs.length > 1) {
        log('yellow', `🔍 Найдены взаимные запросы для пользователей ${key}:`);
        
        pairs.forEach((pair, index) => {
          const requesterEmail = pair.Requester?.email || 'Unknown';
          const receiverEmail = pair.Receiver?.email || 'Unknown';
          log('reset', `   ${index + 1}. ${requesterEmail} -> ${receiverEmail} (ID: ${pair.id})`);
        });

        // Берём первую пару как основную
        const mainPair = pairs[0];
        const duplicates = pairs.slice(1);

        try {
          // Удаляем дубли
          const duplicateIds = duplicates.map(p => p.id);
          await Pair.destroy({
            where: {
              id: { [Op.in]: duplicateIds }
            }
          });

          // Активируем основную пару
          mainPair.status = 'active';
          await mainPair.save();

          const requesterEmail = mainPair.Requester?.email || 'Unknown';
          const receiverEmail = mainPair.Receiver?.email || 'Unknown';

          log('green', `   ✅ Исправлено: ${requesterEmail} ↔ ${receiverEmail}`);
          log('green', `   📝 Активирована пара ID: ${mainPair.id}`);
          log('red', `   🗑️  Удалено дублей: ${duplicates.length}\n`);

          fixedCount++;
          deletedCount += duplicates.length;

        } catch (error) {
          log('red', `   ❌ Ошибка при исправлении пары ${key}: ${error.message}\n`);
        }
      }
    }

    // Итоговая статистика
    console.log('\n' + '='.repeat(60));
    log('bright', '📊 ИТОГОВАЯ СТАТИСТИКА:');
    log('green', `✅ Исправлено пар: ${fixedCount}`);
    log('red', `🗑️  Удалено дублей: ${deletedCount}`);
    
    if (fixedCount > 0) {
      log('green', '\n🎉 Все дубли успешно исправлены!');
    } else {
      log('blue', '\n💫 Дублей для исправления не найдено');
    }

  } catch (error) {
    log('red', `❌ Ошибка при исправлении дублей: ${error.message}`);
    console.error(error);
  }
}

async function main() {
  try {
    log('bright', '🔧 ИСПРАВЛЕНИЕ ДУБЛИРУЮЩИХ ПАР');
    log('bright', '=' * 40 + '\n');
    
    await fixAllMutualRequests();
    
    log('cyan', '\n💡 Рекомендуется запустить проверку: node scripts/check-pairs.js');
    
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

const { User, Pair, UserPair, Event, Media, GameRoom, ActivityLog } = require('../models');
const { Op } = require('sequelize');

/**
 * Скрипт для заполнения pair_id в существующих данных
 * ОСТОРОЖНО: Запускать только после backup БД!
 */

async function migrateExistingData() {
  console.log('🚀 Начинаем миграцию существующих данных...');

  try {
    // 1. Создаем UserPair записи для существующих Pair
    console.log('\n1️⃣ Создаем UserPair записи...');
    const existingPairs = await Pair.findAll();
    
    for (const pair of existingPairs) {
      console.log(`Обрабатываем пару ${pair.id}...`);
      
      // Создаем UserPair записи
      await UserPair.findOrCreate({
        where: { user_id: pair.user1Id, pair_id: pair.id },
        defaults: {
          role: 'member',
          accepted: pair.status === 'active',
          joined_at: pair.createdAt || new Date()
        }
      });

      await UserPair.findOrCreate({
        where: { user_id: pair.user2Id, pair_id: pair.id },
        defaults: {
          role: 'member', 
          accepted: pair.status === 'active',
          joined_at: pair.createdAt || new Date()
        }
      });
    }
    console.log(`✅ Создано UserPair записей для ${existingPairs.length} пар`);

    // 2. Заполняем pair_id в Events
    console.log('\n2️⃣ Заполняем pair_id в Events...');
    let eventsUpdated = 0;
    
    for (const pair of existingPairs) {
      const result = await Event.update(
        { pair_id: pair.id },
        { 
          where: { 
            userId: [pair.user1Id, pair.user2Id],
            pair_id: null // только для тех, где еще не установлен
          }
        }
      );
      eventsUpdated += result[0];
    }
    console.log(`✅ Обновлено ${eventsUpdated} событий`);

    // 3. Заполняем pair_id в Media через Events
    console.log('\n3️⃣ Заполняем pair_id в Media...');
    let mediaUpdated = 0;
    
    const eventsWithPairs = await Event.findAll({
      where: { pair_id: { [Op.not]: null } },
      include: [{ model: Media }]
    });

    for (const event of eventsWithPairs) {
      if (event.Media && event.Media.length > 0) {
        const result = await Media.update(
          { pair_id: event.pair_id },
          { 
            where: { 
              eventId: event.id,
              pair_id: null
            }
          }
        );
        mediaUpdated += result[0];
      }
    }
    console.log(`✅ Обновлено ${mediaUpdated} медиа файлов`);

    // 4. Заполняем pair_id в GameRooms
    console.log('\n4️⃣ Заполняем pair_id в GameRooms...');
    let gamesUpdated = 0;
    
    for (const pair of existingPairs) {
      const result = await GameRoom.update(
        { pair_id: pair.id },
        { 
          where: { 
            [Op.or]: [
              { hostId: pair.user1Id },
              { hostId: pair.user2Id }
            ],
            pair_id: null
          }
        }
      );
      gamesUpdated += result[0];
    }
    console.log(`✅ Обновлено ${gamesUpdated} игровых комнат`);

    // 5. Создаем первичные записи в ActivityLog
    console.log('\n5️⃣ Создаем записи в ActivityLog...');
    
    for (const pair of existingPairs) {
      // Логируем создание пары
      await ActivityLog.logEvent(pair.id, pair.user1Id, 'pair_created', {
        pair: {
          id: pair.id,
          status: pair.status,
          created_at: pair.createdAt
        },
        migrated: true // отмечаем что это мигрированные данные
      });
    }
    console.log(`✅ Создано ${existingPairs.length} записей в ActivityLog`);

    console.log('\n🎉 Миграция данных завершена успешно!');
    
    // Выводим статистику
    const stats = {
      pairs: existingPairs.length,
      userPairs: await UserPair.count(),
      eventsWithPairId: await Event.count({ where: { pair_id: { [Op.not]: null } } }),
      mediaWithPairId: await Media.count({ where: { pair_id: { [Op.not]: null } } }),
      gamesWithPairId: await GameRoom.count({ where: { pair_id: { [Op.not]: null } } }),
      activityLogs: await ActivityLog.count()
    };
    
    console.log('\n📊 Статистика после миграции:');
    console.table(stats);

  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    throw error;
  }
}

// Функция для проверки данных без изменений
async function checkDataIntegrity() {
  console.log('🔍 Проверяем целостность данных...');
  
  const users = await User.count();
  const pairs = await Pair.count();
  const events = await Event.count();
  const media = await Media.count();
  const games = await GameRoom.count();
  
  console.log('📊 Текущее состояние БД:');
  console.table({
    users,
    pairs,
    events,
    media,
    games,
    userPairs: await UserPair.count(),
    eventsWithPairId: await Event.count({ where: { pair_id: { [Op.not]: null } } }),
    mediaWithPairId: await Media.count({ where: { pair_id: { [Op.not]: null } } }),
    gamesWithPairId: await GameRoom.count({ where: { pair_id: { [Op.not]: null } } })
  });
}

// Если скрипт запущен напрямую
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'check') {
    checkDataIntegrity()
      .then(() => process.exit(0))
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else if (command === 'migrate') {
    migrateExistingData()
      .then(() => process.exit(0))
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else {
    console.log('Использование:');
    console.log('  node scripts/migrate-existing-data.js check    - проверить данные');
    console.log('  node scripts/migrate-existing-data.js migrate  - мигрировать данные');
  }
}

module.exports = {
  migrateExistingData,
  checkDataIntegrity
};

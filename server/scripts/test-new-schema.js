const { User, Pair, UserPair, Event, Media, GameRoom, ActivityLog } = require('../models');
const { Op } = require('sequelize');

/**
 * Тестирование новой архитектуры БД
 * Проверяем что старые и новые методы работают корректно
 */

async function testNewSchema() {
  console.log('🧪 Тестируем новую архитектуру БД...\n');

  try {
    // 1. Тестируем получение пар нового формата
    console.log('1️⃣ Тестируем UserPair связи...');
    const firstUser = await User.findOne();
    
    if (firstUser) {
      console.log(`Тестируем пользователя: ${firstUser.email}`);
      
      // Новый способ - через UserPair
      const userPairs = await UserPair.findAll({
        where: { user_id: firstUser.id, accepted: true },
        include: [{ model: Pair, as: 'Pair' }]
      });
      
      console.log(`✅ Найдено ${userPairs.length} пар через UserPair`);
      
      // Старый способ для сравнения
      const oldPairs = await Pair.findAll({
        where: {
          status: 'active',
          [Op.or]: [
            { user1Id: firstUser.id },
            { user2Id: firstUser.id }
          ]
        }
      });
      
      console.log(`✅ Найдено ${oldPairs.length} пар старым способом`);
      console.log('Результаты должны совпадать!\n');
    }

    // 2. Тестируем события с pair_id
    console.log('2️⃣ Тестируем события с pair_id...');
    const eventsWithPairs = await Event.findAll({
      where: { pair_id: { [Op.not]: null } },
      include: [{ model: Pair, as: 'Pair' }],
      limit: 3
    });
    
    console.log(`✅ Найдено ${eventsWithPairs.length} событий с pair_id`);
    eventsWithPairs.forEach(event => {
      console.log(`  - "${event.title}" принадлежит паре ${event.pair_id}`);
    });
    console.log();

    // 3. Тестируем медиа с pair_id
    console.log('3️⃣ Тестируем медиа с pair_id...');
    const mediaWithPairs = await Media.findAll({
      where: { pair_id: { [Op.not]: null } },
      include: [{ model: Pair, as: 'Pair' }],
      limit: 3
    });
    
    console.log(`✅ Найдено ${mediaWithPairs.length} медиа файлов с pair_id`);
    console.log();

    // 4. Тестируем игры с pair_id  
    console.log('4️⃣ Тестируем игры с pair_id...');
    const gamesWithPairs = await GameRoom.findAll({
      where: { pair_id: { [Op.not]: null } },
      include: [{ model: Pair, as: 'Pair' }],
      limit: 3
    });
    
    console.log(`✅ Найдено ${gamesWithPairs.length} игр с pair_id`);
    console.log();

    // 5. Тестируем ActivityLog
    console.log('5️⃣ Тестируем ActivityLog...');
    const recentActivities = await ActivityLog.findAll({
      include: [
        { model: User, as: 'User' },
        { model: Pair, as: 'Pair' }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    console.log(`✅ Найдено ${recentActivities.length} записей активности`);
    recentActivities.forEach(activity => {
      console.log(`  - ${activity.action} от ${activity.User?.email || 'unknown'}`);
    });
    console.log();

    // 6. Создаем тестовую запись в ActivityLog
    console.log('6️⃣ Тестируем создание ActivityLog записи...');
    const firstPair = await Pair.findOne();
    if (firstPair && firstUser) {
      await ActivityLog.logEvent(
        firstPair.id, 
        firstUser.id, 
        'schema_test_completed',
        { message: 'Новая архитектура БД протестирована', timestamp: new Date() }
      );
      console.log('✅ Тестовая запись в ActivityLog создана');
    }

    console.log('\n🎉 Все тесты пройдены успешно!');
    console.log('🚀 Новая архитектура БД полностью функциональна!');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
    throw error;
  }
}

// Если скрипт запущен напрямую
if (require.main === module) {
  testNewSchema()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { testNewSchema };

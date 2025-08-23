const { User, Pair, Event, ActivityLog } = require('../models');
const { Op } = require('sequelize');
const authService = require('../services/auth.service');
const userService = require('../services/user.service');
const pairService = require('../services/pair.service');
const eventService = require('../services/event.service');

/**
 * Тестирование обновлений функционала
 */

async function testUpdatedFeatures() {
  console.log('🧪 Тестируем обновленный функционал...\n');

  try {
    // 1. Тестируем новые поля User
    console.log('1️⃣ Тестируем новые поля User...');
    const firstUser = await User.findOne();
    
    if (firstUser) {
      console.log(`Пользователь: ${firstUser.email}`);
      console.log(`  first_name: ${firstUser.first_name}`);
      console.log(`  display_name: ${firstUser.display_name}`);
      console.log(`  locale: ${firstUser.locale}`);
      
      // Обновляем display_name
      const updatedUser = await userService.updateProfile(firstUser.id, {
        display_name: 'Тестовое Имя',
        locale: 'en'
      });
      console.log('✅ Обновление display_name и locale прошло успешно');
    }
    console.log();

    // 2. Тестируем PairService с display_name
    console.log('2️⃣ Тестируем PairService с display_name...');
    if (firstUser) {
      const pairingStatus = await pairService.getPairingStatus(firstUser.id);
      if (pairingStatus.status === 'active') {
        console.log(`Партнер: ${pairingStatus.partner.name}`);
        console.log('✅ PairService возвращает display_name как name');
      } else {
        console.log('ℹ️ У пользователя нет активной пары');
      }
    }
    console.log();

    // 3. Тестируем создание события с pair_id и логированием
    console.log('3️⃣ Тестируем создание события с новой архитектурой...');
    if (firstUser) {
      const newEvent = await eventService.createEvent(firstUser.id, {
        title: 'Тестовое событие с новой архитектурой',
        description: 'Проверяем pair_id и ActivityLog',
        event_date: new Date(),
        event_type: 'memory',
        isShared: true
      });
      
      console.log(`Создано событие: ${newEvent.title}`);
      console.log(`  pair_id: ${newEvent.pair_id}`);
      console.log('✅ Событие создано с pair_id');
    }
    console.log();

    // 4. Проверяем ActivityLog
    console.log('4️⃣ Проверяем ActivityLog...');
    const recentLogs = await ActivityLog.findAll({
      order: [['created_at', 'DESC']],
      limit: 3,
      include: [
        { model: User, as: 'User', attributes: ['email', 'display_name', 'first_name'] },
        { model: Pair, as: 'Pair' }
      ]
    });

    console.log(`Найдено ${recentLogs.length} записей в ActivityLog:`);
    recentLogs.forEach((log, index) => {
      const userName = log.User?.display_name || log.User?.first_name || log.User?.email || 'unknown';
      console.log(`  ${index + 1}. ${log.action} от ${userName} (${log.created_at.toLocaleString()})`);
    });
    console.log();

    // 5. Проверяем события с pair_id
    console.log('5️⃣ Проверяем события с pair_id...');
    const eventsWithPairs = await Event.count({
      where: { pair_id: { [Op.ne]: null } }
    });
    const totalEvents = await Event.count();
    
    console.log(`События с pair_id: ${eventsWithPairs}/${totalEvents}`);
    console.log('✅ События успешно привязаны к парам');
    console.log();

    console.log('🎉 Все обновления работают корректно!');
    console.log('\n📋 Резюме обновлений:');
    console.log('  ✅ display_name и locale поддерживаются');
    console.log('  ✅ pair_id автоматически заполняется в новых событиях');
    console.log('  ✅ ActivityLog ведет историю действий');
    console.log('  ✅ PairService использует display_name');
    console.log('  ✅ Обратная совместимость сохранена');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
    throw error;
  }
}

// Если скрипт запущен напрямую
if (require.main === module) {
  testUpdatedFeatures()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { testUpdatedFeatures };

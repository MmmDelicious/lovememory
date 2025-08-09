const { User, Pair } = require('../models');
const sequelize = require('../config/database');

async function debugPairs() {
  try {
    console.log('🔍 Диагностика пар в базе данных...\n');

    // Проверяем подключение к БД
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных успешно');

    // Получаем все пары
    const allPairs = await Pair.findAll({
      include: [
        {
          model: User,
          as: 'Requester',
          attributes: ['id', 'email', 'first_name'],
        },
        {
          model: User,
          as: 'Receiver',
          attributes: ['id', 'email', 'first_name'],
        },
      ],
    });

    console.log(`\n📊 Найдено пар в базе: ${allPairs.length}`);

    if (allPairs.length === 0) {
      console.log('❌ Пар в базе данных нет');
      return;
    }

    // Группируем по статусу
    const activePairs = allPairs.filter(pair => pair.status === 'active');
    const pendingPairs = allPairs.filter(pair => pair.status === 'pending');

    console.log(`\n✅ Активных пар: ${activePairs.length}`);
    console.log(`⏳ Ожидающих пар: ${pendingPairs.length}`);

    // Показываем детали активных пар
    if (activePairs.length > 0) {
      console.log('\n🔗 Активные пары:');
      activePairs.forEach((pair, index) => {
        console.log(`${index + 1}. ID: ${pair.id}`);
        console.log(`   Requester: ${pair.Requester.email} (${pair.Requester.first_name})`);
        console.log(`   Receiver: ${pair.Receiver.email} (${pair.Receiver.first_name})`);
        console.log(`   Status: ${pair.status}`);
        console.log(`   Created: ${pair.createdAt}`);
        console.log('');
      });
    }

    // Показываем детали ожидающих пар
    if (pendingPairs.length > 0) {
      console.log('\n⏳ Ожидающие пары:');
      pendingPairs.forEach((pair, index) => {
        console.log(`${index + 1}. ID: ${pair.id}`);
        console.log(`   Requester: ${pair.Requester.email} (${pair.Requester.first_name})`);
        console.log(`   Receiver: ${pair.Receiver.email} (${pair.Receiver.first_name})`);
        console.log(`   Status: ${pair.status}`);
        console.log(`   Created: ${pair.createdAt}`);
        console.log('');
      });
    }

    // Проверяем пользователей
    const allUsers = await User.findAll({
      attributes: ['id', 'email', 'first_name'],
    });

    console.log(`\n👥 Всего пользователей: ${allUsers.length}`);
    console.log('Пользователи:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.first_name}) - ID: ${user.id}`);
    });

  } catch (error) {
    console.error('❌ Ошибка при диагностике:', error);
  } finally {
    await sequelize.close();
  }
}

// Запускаем диагностику
debugPairs(); 
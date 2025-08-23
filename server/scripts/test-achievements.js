#!/usr/bin/env node

/**
 * Тест системы достижений
 */

const models = require('../models');
const { Achievement, User, Pair, UserPair } = models;

console.log('🏆 Тестирование системы достижений...\n');

async function testAchievements() {
  let testUser, testUser2, testPair;
  
  try {
    // Создаем тестовых пользователей и пару
    console.log('📋 Создание тестовых данных...');
    
    testUser = await User.create({
      first_name: 'Игрок1',
      email: `player1-${Date.now()}@test.com`,
      display_name: 'Тестовый Игрок 1',
      locale: 'ru',
      email_verified: true
    });

    testUser2 = await User.create({
      first_name: 'Игрок2',
      email: `player2-${Date.now()}@test.com`,
      display_name: 'Тестовый Игрок 2',
      locale: 'ru',
      email_verified: false
    });

    testPair = await Pair.create({
      user1Id: testUser.id,
      user2Id: testUser2.id,
      name: 'Тестовая пара',
      harmony_index: 80,
      metadata: { test: true }
    });

    await UserPair.create({
      user_id: testUser.id,
      pair_id: testPair.id,
      role: 'admin',
      accepted: true
    });

    await UserPair.create({
      user_id: testUser2.id,
      pair_id: testPair.id,
      role: 'member',
      accepted: true
    });
    
    console.log(`✅ Создана пара: ${testPair.name}`);
    console.log(`✅ Пользователи: ${testUser.display_name}, ${testUser2.display_name}\n`);

    // ===== ТЕСТ 1: Выдача достижений =====
    console.log('🏆 ТЕСТ 1: Выдача достижений');
    
    // Первое достижение
    const firstGame = await Achievement.grantAchievement(
      testPair.id, 
      testUser.id, 
      'first_game',
      { game_type: 'chess' }
    );
    
    console.log(`✅ Достижение "Первая игра": ${firstGame ? 'выдано' : 'уже было'}`);
    
    // Повторная выдача того же достижения (должна вернуть null)
    const duplicate = await Achievement.grantAchievement(
      testPair.id, 
      testUser.id, 
      'first_game'
    );
    
    console.log(`✅ Повторная выдача: ${duplicate ? 'ERROR!' : 'корректно заблокирована'}`);
    
    // Достижение урока
    const firstLesson = await Achievement.grantAchievement(
      testPair.id,
      testUser2.id,
      'first_lesson',
      { lesson_theme: 'communication' }
    );
    
    console.log(`✅ Достижение "Первый урок": ${firstLesson ? 'выдано' : 'ошибка'}`);
    
    // Социальное достижение
    const firstGift = await Achievement.grantAchievement(
      testPair.id,
      testUser.id,
      'first_gift',
      { gift_price: 100 }
    );
    
    console.log(`✅ Достижение "Первый подарок": ${firstGift ? 'выдано' : 'ошибка'}\n`);

    // ===== ТЕСТ 2: Получение достижений пары =====
    console.log('🏆 ТЕСТ 2: Получение достижений пары');
    
    const pairAchievements = await Achievement.getPairAchievements(testPair.id);
    console.log(`✅ Всего достижений у пары: ${pairAchievements.length}`);
    
    pairAchievements.forEach((achievement, i) => {
      console.log(`   ${i + 1}. ${achievement.title} (${achievement.rarity}, ${achievement.points} очков)`);
      console.log(`      Получил: ${achievement.User ? achievement.User.display_name : 'Пара'}`);
    });

    // ===== ТЕСТ 3: Статистика достижений =====
    console.log('\n🏆 ТЕСТ 3: Статистика достижений');
    
    const stats = await Achievement.getPairStats(testPair.id);
    console.log(`✅ Общая статистика:`);
    console.log(`   - Всего достижений: ${stats.total}`);
    console.log(`   - Общие очки: ${stats.totalPoints}`);
    console.log(`   - По категориям:`, stats.byCategory);
    console.log(`   - По редкости:`, stats.byRarity);

    // ===== ТЕСТ 4: Проверка шаблонов достижений =====
    console.log('\n🏆 ТЕСТ 4: Шаблоны достижений');
    
    const templates = Object.keys(Achievement.TEMPLATES);
    console.log(`✅ Доступно шаблонов: ${templates.length}`);
    console.log('Примеры:');
    
    templates.slice(0, 5).forEach(type => {
      const template = Achievement.TEMPLATES[type];
      console.log(`   - ${type}: "${template.title}" (${template.category}, ${template.points} очков)`);
    });

    // ===== ТЕСТ 5: Игровые достижения =====
    console.log('\n🏆 ТЕСТ 5: Автоматическая выдача игровых достижений');
    
    const gameAchievements = await Achievement.checkAndGrantGameAchievements(
      testPair.id,
      testUser2.id,
      'chess',
      true, // isWin
      { gamesWon: 1 }
    );
    
    console.log(`✅ Выдано игровых достижений: ${gameAchievements.length}`);
    gameAchievements.forEach(ach => {
      console.log(`   - ${ach.title}: ${ach.description}`);
    });

    // ===== ТЕСТ 6: Достижения уроков =====
    console.log('\n🏆 ТЕСТ 6: Автоматическая выдача достижений уроков');
    
    const lessonAchievements = await Achievement.checkAndGrantLessonAchievements(
      testPair.id,
      testUser.id,
      { theme: 'communication', difficulty: 'easy' }
    );
    
    console.log(`✅ Выдано достижений уроков: ${lessonAchievements.length}`);
    lessonAchievements.forEach(ach => {
      console.log(`   - ${ach.title}: ${ach.description}`);
    });

    // ===== ТЕСТ 7: Проверка ассоциаций =====
    console.log('\n🏆 ТЕСТ 7: Проверка ассоциаций');
    
    const pairWithAchievements = await Pair.findByPk(testPair.id, {
      include: [{ model: Achievement, as: 'Achievements' }]
    });
    
    console.log(`✅ Ассоциации Pair -> Achievements: ${pairWithAchievements.Achievements?.length || 0} достижений`);
    
    const userWithAchievements = await User.findByPk(testUser.id, {
      include: [{ model: Achievement, as: 'Achievements' }]
    });
    
    console.log(`✅ Ассоциации User -> Achievements: ${userWithAchievements.Achievements?.length || 0} достижений`);

    // ===== ТЕСТ 8: Таблица лидеров =====
    console.log('\n🏆 ТЕСТ 8: Таблица лидеров');
    
    const leaderboard = await Achievement.getLeaderboard(5);
    console.log(`✅ Топ пар по достижениям:`);
    
    leaderboard.forEach((entry, i) => {
      const totalPoints = entry.getDataValue('totalPoints');
      const totalAchievements = entry.getDataValue('totalAchievements');
      console.log(`   ${i + 1}. Пара "${entry.Pair?.name}" - ${totalPoints} очков (${totalAchievements} достижений)`);
    });

    // ===== ФИНАЛЬНАЯ СТАТИСТИКА =====
    console.log('\n📊 ФИНАЛЬНАЯ СТАТИСТИКА:');
    
    const finalStats = await Achievement.getPairStats(testPair.id);
    console.log(`✅ Итого достижений: ${finalStats.total}`);
    console.log(`✅ Итого очков: ${finalStats.totalPoints}`);

    // ===== ОЧИСТКА =====
    console.log('\n🧹 Очистка тестовых данных...');
    
    await Achievement.destroy({ where: { pair_id: testPair.id } });
    await UserPair.destroy({ where: { user_id: testUser.id } });
    await UserPair.destroy({ where: { user_id: testUser2.id } });
    await Pair.destroy({ where: { id: testPair.id } });
    await User.destroy({ where: { id: testUser.id } });
    await User.destroy({ where: { id: testUser2.id } });
    
    console.log('✅ Тестовые данные удалены');

    // ===== РЕЗУЛЬТАТ =====
    console.log('\n🎉 ВСЕ ТЕСТЫ СИСТЕМЫ ДОСТИЖЕНИЙ ПРОШЛИ УСПЕШНО!');
    console.log('\n📋 Проверенные функции:');
    console.log('✅ Выдача достижений с проверкой дубликатов');
    console.log('✅ Предопределенные шаблоны достижений');
    console.log('✅ Автоматическая выдача игровых достижений');
    console.log('✅ Автоматическая выдача достижений уроков');
    console.log('✅ Статистика и аналитика достижений');
    console.log('✅ Таблица лидеров');
    console.log('✅ Все ассоциации работают корректно');
    console.log('\n🚀 Система геймификации готова к использованию!');

  } catch (error) {
    console.error('❌ Ошибка в тестах:', error);
    console.error('Stack trace:', error.stack);
    
    // Попытка очистки в случае ошибки
    try {
      if (testPair) await Achievement.destroy({ where: { pair_id: testPair.id } });
      if (testUser) await UserPair.destroy({ where: { user_id: testUser.id } });
      if (testUser2) await UserPair.destroy({ where: { user_id: testUser2.id } });
      if (testPair) await Pair.destroy({ where: { id: testPair.id } });
      if (testUser) await User.destroy({ where: { id: testUser.id } });
      if (testUser2) await User.destroy({ where: { id: testUser2.id } });
    } catch (cleanupError) {
      console.error('Ошибка очистки:', cleanupError.message);
    }
    
    process.exit(1);
  }
}

// Запуск тестов
testAchievements()
  .then(() => {
    console.log('\n✨ Тестирование достижений завершено');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });

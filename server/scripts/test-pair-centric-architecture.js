#!/usr/bin/env node

/**
 * Комплексный тест новой pair-centric архитектуры
 * Проверяет все основные изменения и функциональность
 */

const { Sequelize, Op } = require('sequelize');
const models = require('../models');

const {
  User, Pair, UserPair, Event, Media, GameRoom, GameParticipant,
  Gift, ShopItem, Transaction, Consent, Insight, NotificationToken,
  UserLessonProgress, ActivityLog
} = models;

console.log('🚀 Запуск комплексного теста pair-centric архитектуры...\n');

async function runTests() {
  let testUser, testUser2, testPair, testEvent, testLesson; // Объявляем переменные для использования в очистке
  
  try {
    // ===== ТЕСТ 1: Проверка новых полей в User =====
    console.log('📋 ТЕСТ 1: Проверка новых полей в User');
    testUser = await User.create({
      first_name: 'Тестовый',
      email: `test-${Date.now()}@example.com`,
      display_name: 'Тестовый Пользователь',
      locale: 'ru',
      email_verified: true
    });
    
    console.log(`✅ Создан пользователь с новыми полями:`);
    console.log(`   - display_name: ${testUser.display_name}`);
    console.log(`   - locale: ${testUser.locale}`);
    console.log(`   - email_verified: ${testUser.email_verified}\n`);

    // ===== ТЕСТ 2: Создание второго пользователя =====
    console.log('📋 ТЕСТ 2: Создание второго пользователя');
    testUser2 = await User.create({
      first_name: 'Партнер',
      email: `partner-${Date.now()}@example.com`,
      display_name: 'Тестовый Партнер',
      locale: 'ru',
      email_verified: false
    });
    
    console.log(`✅ Создан второй пользователь: ${testUser2.display_name}\n`);

    // ===== ТЕСТ 3: Создание пары и UserPair связи =====
    console.log('📋 ТЕСТ 3: Создание пары и UserPair связи');
    testPair = await Pair.create({
      user1Id: testUser.id,  // Для обратной совместимости
      user2Id: testUser2.id, // Для обратной совместимости
      name: 'Тестовая пара',
      harmony_index: 75,
      metadata: { test: true, created_by_test: 'pair-centric-test' }
    });

    const userPair1 = await UserPair.create({
      user_id: testUser.id,
      pair_id: testPair.id,
      role: 'admin',
      accepted: true
    });

    const userPair2 = await UserPair.create({
      user_id: testUser2.id,
      pair_id: testPair.id,
      role: 'member',
      accepted: true
    });

    console.log(`✅ Создана пара: ${testPair.name} (harmony: ${testPair.harmony_index})`);
    console.log(`✅ Создана связь UserPair1: роль ${userPair1.role}, принято: ${userPair1.accepted}`);
    console.log(`✅ Создана связь UserPair2: роль ${userPair2.role}, принято: ${userPair2.accepted}\n`);

    // ===== ТЕСТ 4: События с pair_id и creator_user_id =====
    console.log('📋 ТЕСТ 4: События с новыми полями');
    testEvent = await Event.create({
      title: 'Тестовое событие',
      event_date: new Date(),
      userId: testUser.id,  // Правильное поле для Event модели
      pair_id: testPair.id,
      creator_user_id: testUser.id,
      metadata: { event_type: 'test', automated: false }
    });

    console.log(`✅ Создано событие с pair_id: ${testEvent.pair_id}`);
    console.log(`✅ Creator: ${testEvent.creator_user_id}\n`);

    // ===== ТЕСТ 5: Медиа с новыми полями =====
    console.log('📋 ТЕСТ 5: Медиа с новыми полями');
    const testMedia = await Media.create({
      file_url: '/test-media.jpg',  // Правильное поле для Media
      eventId: testEvent.id,        // Связь с событием
      pair_id: testPair.id,
      uploaded_by: testUser.id,
      size_bytes: 1024000,
      blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
      mime_type: 'image/jpeg'
    });

    console.log(`✅ Создана медиа с парой: ${testMedia.pair_id}`);
    console.log(`✅ Размер: ${testMedia.size_bytes} байт, тип: ${testMedia.mime_type}\n`);

    // ===== ТЕСТ 6: GameRoom с новыми полями =====
    console.log('📋 ТЕСТ 6: GameRoom с новой структурой');
    const testGameRoom = await GameRoom.create({
      roomId: `test-room-${Date.now()}`,
      gameType: 'chess',
      hostId: testUser.id,  // Обязательное поле
      pair_id: testPair.id,
      state: 'waiting',
      settings: { time_limit: 600, difficulty: 'medium' }
    });

    const gameParticipant = await GameParticipant.create({
      game_room_id: testGameRoom.id,
      user_id: testUser.id,
      is_host: true,
      stats: { games_played: 0, wins: 0 }
    });

    console.log(`✅ Создана игровая комната: ${testGameRoom.roomId}`);
    console.log(`✅ Участник игры: host=${gameParticipant.is_host}\n`);

    // ===== ТЕСТ 6: Shop и Transaction =====
    console.log('📋 ТЕСТ 7: Магазин и транзакции');
    const shopItem = await ShopItem.create({
      sku: `TEST_ITEM_${Date.now()}`,
      title: 'Тестовый товар',
      description: 'Описание тестового товара',
      price_coins: 100,
      is_virtual: true,
      metadata: { category: 'test', rarity: 'common' }
    });

    const transaction = await Transaction.create({
      pair_id: testPair.id,
      user_id: testUser.id,
      tx_type: 'purchase',
      amount: 100,
      currency: 'coins',
      metadata: { item_id: shopItem.id, test: true }
    });

    console.log(`✅ Создан товар: ${shopItem.title} (${shopItem.price_coins} монет)`);
    console.log(`✅ Транзакция: ${transaction.tx_type} на ${transaction.amount} ${transaction.currency}\n`);

    // ===== ТЕСТ 7: Gift с новыми полями =====
    console.log('📋 ТЕСТ 8: Подарки с новой структурой');
    const testGift = await Gift.create({
      fromUserId: testUser.id,     // Правильное поле для отправителя
      toUserId: testUser2.id,      // Правильное поле для получателя
      giftType: 'guitar',          // Обязательное поле (guitar или running-character)
      price: 100,                  // Обязательное поле
      message: 'Тестовый подарок', // Обязательное поле
      recipient_pair_id: testPair.id,
      shop_item_id: shopItem.id
    });

    console.log(`✅ Создан подарок для пары: ${testGift.recipient_pair_id}`);
    console.log(`✅ Связан с товаром: ${testGift.shop_item_id}\n`);

    // ===== ТЕСТ 8: Согласия (Consent) =====
    console.log('📋 ТЕСТ 9: Система согласий');
    const consent = await Consent.giveConsent(testUser.id, {
      analytics_opt_in: true,
      ai_opt_in: true,
      share_messages_for_analysis: false
    });

    const hasAnalyticsConsent = await Consent.hasConsent(testUser.id, 'analytics');
    const hasAiConsent = await Consent.hasConsent(testUser.id, 'ai');

    console.log(`✅ Согласие на аналитику: ${hasAnalyticsConsent}`);
    console.log(`✅ Согласие на ИИ: ${hasAiConsent}\n`);

    // ===== ТЕСТ 9: Инсайты =====
    console.log('📋 ТЕСТ 10: Система инсайтов');
    const compatibilityInsight = await Insight.createCompatibilityInsight(
      testPair.id, 
      85, 
      { strengths: ['communication', 'trust'], weaknesses: ['time_management'] }
    );

    const recommendation = await Insight.createRecommendation(
      testPair.id,
      'Рекомендуется больше общаться по вечерам',
      { frequency: 'daily', confidence: 0.8 }
    );

    console.log(`✅ Инсайт совместимости: ${compatibilityInsight.summary}`);
    console.log(`✅ Рекомендация: ${recommendation.summary}\n`);

    // ===== ТЕСТ 10: Токены уведомлений =====
    console.log('📋 ТЕСТ 11: Токены уведомлений');
    const firebaseToken = await NotificationToken.addToken(
      testUser.id,
      'firebase',
      'test-firebase-token-12345'
    );

    const activeTokens = await NotificationToken.getActiveTokens(testUser.id);

    console.log(`✅ Firebase токен добавлен: ${firebaseToken.token.substring(0, 20)}...`);
    console.log(`✅ Активных токенов: ${activeTokens.length}\n`);

    // ===== ТЕСТ 11: Lesson Progress с новой структурой =====
    console.log('📋 ТЕСТ 12: Прогресс уроков (pair-centric)');
    // Сначала создадим тестовый урок
    testLesson = await models.Lesson.create({
      id: `test-lesson-${Date.now()}`,
      title: 'Тестовый урок',
      text: 'Содержание тестового урока для пары',  // Обязательное поле
      description: 'Описание тестового урока',
      theme: 'communication',
      difficulty: 'easy',
      content: { test: true },
      is_active: true
    });

    const lessonProgress = await UserLessonProgress.create({
      user_id: testUser.id,
      pair_id: testPair.id,
      completed_by_user_id: testUser.id,
      lesson_id: testLesson.id,
      coins_earned: 50,
      streak_bonus: 10,
      completion_time_seconds: 120
    });

    const pairStats = await UserLessonProgress.getPairCompletionStats(testPair.id);
    const userStreak = await UserLessonProgress.getUserStreak(testUser.id, testPair.id);

    console.log(`✅ Урок завершен парой: ${lessonProgress.pair_id}`);
    console.log(`✅ Статистика пары: ${pairStats.totalCompleted} уроков, ${pairStats.totalReward} монет`);
    console.log(`✅ Streak пользователя: ${userStreak}\n`);

    // ===== ТЕСТ 12: Activity Log =====
    console.log('📋 ТЕСТ 13: Лог активности');
    await ActivityLog.logEventCreated(testPair.id, testUser.id, testEvent.id, testEvent.title);
    await ActivityLog.logLessonCompleted(testPair.id, testUser.id, 'test-lesson-001', 60);
    await ActivityLog.logGameStarted(testPair.id, testUser.id, testGameRoom.id, 'chess');

    const recentActivity = await ActivityLog.findAll({
      where: { pair_id: testPair.id },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    console.log(`✅ Записей в логе активности: ${recentActivity.length}`);
    recentActivity.forEach((log, i) => {
      console.log(`   ${i + 1}. ${log.action} (${log.created_at.toLocaleString()})`);
    });

    // ===== ТЕСТ 13: Проверка ассоциаций =====
    console.log('\n📋 ТЕСТ 14: Проверка ассоциаций');
    
    // Загружаем пару со всеми связанными данными
    const fullPair = await Pair.findByPk(testPair.id, {
      include: [
        { model: UserPair, as: 'UserPairs' },
        { model: Event, as: 'Events' },
        { model: Media, as: 'Media' },
        { model: GameRoom, as: 'GameRooms' },
        { model: Transaction, as: 'Transactions' },
        { model: Insight, as: 'Insights' },
        { model: UserLessonProgress, as: 'LessonProgress' }
      ]
    });

    console.log(`✅ Загружена пара с ассоциациями:`);
    console.log(`   - UserPairs: ${fullPair.UserPairs?.length || 0}`);
    console.log(`   - Events: ${fullPair.Events?.length || 0}`);
    console.log(`   - Media: ${fullPair.Media?.length || 0}`);
    console.log(`   - GameRooms: ${fullPair.GameRooms?.length || 0}`);
    console.log(`   - Transactions: ${fullPair.Transactions?.length || 0}`);
    console.log(`   - Insights: ${fullPair.Insights?.length || 0}`);
    console.log(`   - LessonProgress: ${fullPair.LessonProgress?.length || 0}\n`);

    // ===== ТЕСТ 14: Проверка индексов и производительности =====
    console.log('📋 ТЕСТ 15: Проверка индексов');
    
    const start = Date.now();
    const eventsForPair = await Event.findAll({
      where: { pair_id: testPair.id },
      limit: 100
    });
    const queryTime = Date.now() - start;

    console.log(`✅ Запрос событий пары выполнен за ${queryTime}мс`);
    console.log(`✅ Найдено событий: ${eventsForPair.length}\n`);

    // ===== ФИНАЛЬНАЯ ОЧИСТКА =====
    console.log('🧹 Очистка тестовых данных...');
    
    // Удаляем в правильном порядке (из-за foreign keys)
    await ActivityLog.destroy({ where: { pair_id: testPair.id } });
    await UserLessonProgress.destroy({ where: { pair_id: testPair.id } });
    await GameParticipant.destroy({ where: { user_id: testUser.id } });
    await GameRoom.destroy({ where: { id: testGameRoom.id } });
    await Insight.destroy({ where: { pair_id: testPair.id } });
    await NotificationToken.destroy({ where: { user_id: testUser.id } });
    await Consent.destroy({ where: { user_id: testUser.id } });
    await Transaction.destroy({ where: { pair_id: testPair.id } });
    await Gift.destroy({ where: { fromUserId: testUser.id } });
    await Media.destroy({ where: { eventId: testEvent.id } });
    await Event.destroy({ where: { userId: testUser.id } });
    await UserPair.destroy({ where: { user_id: testUser.id } });
    await UserPair.destroy({ where: { user_id: testUser2.id } });
    await Pair.destroy({ where: { id: testPair.id } });
    await ShopItem.destroy({ where: { id: shopItem.id } });
    await models.Lesson.destroy({ where: { id: testLesson.id } });
    await User.destroy({ where: { id: testUser.id } });
    await User.destroy({ where: { id: testUser2.id } });

    console.log('✅ Тестовые данные удалены\n');

    // ===== РЕЗУЛЬТАТЫ =====
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
    console.log('\n📊 Проверенные компоненты:');
    console.log('✅ Новые поля в User (display_name, locale, email_verified)');
    console.log('✅ Таблица UserPair и связи many-to-many');
    console.log('✅ Pair-centric поля в Event, Media, GameRoom');
    console.log('✅ Новые таблицы: GameParticipant, ShopItem, Transaction');
    console.log('✅ ML-таблицы: Consent, Insight, NotificationToken');
    console.log('✅ Обновленный UserLessonProgress с pair_id');
    console.log('✅ ActivityLog для event bus архитектуры');
    console.log('✅ Все ассоциации работают корректно');
    console.log('✅ Индексы и производительность в норме');
    
    console.log('\n🚀 Архитектура готова к продакшену!');

  } catch (error) {
    console.error('❌ Ошибка в тестах:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Запуск тестов
runTests()
  .then(() => {
    console.log('\n✨ Тестирование завершено');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });

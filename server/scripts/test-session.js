const { User, Pair, Session } = require('../models');

async function testSession() {
  console.log('🎮 Тестирование Session модели...');

  try {
    // 1. Создаем тестовые данные
    const testUser1 = await User.create({
      email: `test-session-1-${Date.now()}@example.com`,
      first_name: 'Test1',
      last_name: 'User1',
      display_name: 'Test User 1'
    });

    const testUser2 = await User.create({
      email: `test-session-2-${Date.now()}@example.com`,
      first_name: 'Test2',
      last_name: 'User2',
      display_name: 'Test User 2'
    });

    const testPair = await Pair.create({
      user1Id: testUser1.id,
      user2Id: testUser2.id,
      name: 'Test Session Pair',
      harmony_index: 85
    });

    console.log('✅ Созданы тестовые данные:', {
      pairId: testPair.id,
      user1Id: testUser1.id,
      user2Id: testUser2.id
    });

    // 2. Стартуем обучающую сессию
    const learningSession = await Session.startSession(testPair.id, testUser1.id, {
      session_type: 'learning',
      title: 'Изучение языков любви',
      description: 'Сессия изучения различных языков любви',
      participants: [testUser1.id, testUser2.id],
      goals: [
        'Узнать свой язык любви',
        'Понять язык любви партнера',
        'Улучшить коммуникацию'
      ],
      metadata: {
        lesson_type: 'interactive',
        difficulty: 'beginner'
      }
    });
    console.log('✅ Стартована обучающая сессия:', learningSession.id);

    // 3. Стартуем игровую сессию
    const gamingSession = await Session.startSession(testPair.id, testUser2.id, {
      session_type: 'gaming',
      title: 'Совместная игра в шахматы',
      description: 'Развитие стратегического мышления вместе',
      participants: [testUser1.id, testUser2.id],
      goals: ['Потренировать логику', 'Провести время вместе'],
      metadata: {
        game_type: 'chess',
        difficulty: 'intermediate'
      }
    });
    console.log('✅ Стартована игровая сессия:', gamingSession.id);

    // 4. Добавляем цели и достижения в обучающую сессию
    await learningSession.addGoal('Составить план развития отношений');
    await learningSession.addAchievement({
      type: 'milestone',
      title: 'Первое понимание',
      description: 'Успешно определили языки любви',
      earned_at: new Date()
    });
    console.log('✅ Добавлены цели и достижения');

    // 5. Обновляем прогресс
    await learningSession.updateProgress({
      completion_percentage: 75,
      current_step: 'discussing_results',
      notes: 'Хороший прогресс, партнеры активно участвуют'
    });
    console.log('✅ Обновлен прогресс сессии');

    // 6. Ставим сессию на паузу
    await gamingSession.pause();
    console.log('✅ Игровая сессия поставлена на паузу');

    // 7. Возобновляем сессию
    await gamingSession.resume();
    console.log('✅ Игровая сессия возобновлена');

    // 8. Завершаем обучающую сессию с оценкой
    await learningSession.complete({
      quality_rating: 9,
      achievements: [
        {
          type: 'completion',
          title: 'Урок завершен',
          description: 'Успешно завершили изучение языков любви'
        }
      ],
      notes: 'Отличная сессия! Много полезных инсайтов.'
    });
    console.log('✅ Обучающая сессия завершена с оценкой 9/10');

    // 9. Завершаем игровую сессию
    await gamingSession.complete({
      quality_rating: 8,
      notes: 'Интересная партия, улучшили навыки'
    });
    console.log('✅ Игровая сессия завершена с оценкой 8/10');

    // 10. Получаем активные сессии (должно быть 0)
    const activeSessions = await Session.getActiveSessions(testPair.id);
    console.log('✅ Активные сессии:', activeSessions.length);

    // 11. Получаем все сессии для пары
    const allSessions = await Session.getSessionsForPair(testPair.id);
    console.log('✅ Всего сессий для пары:', allSessions.length);

    // 12. Получаем сессии определенного типа
    const learningSessions = await Session.getSessionsForPair(testPair.id, {
      session_type: 'learning'
    });
    console.log('✅ Обучающие сессии:', learningSessions.length);

    // 13. Стартуем новую сессию для тестирования отмены
    const testSession = await Session.startSession(testPair.id, testUser1.id, {
      session_type: 'discussion',
      title: 'Тестовая дискуссия',
      description: 'Для тестирования отмены'
    });
    
    // 14. Отменяем сессию
    await testSession.cancel('Тестирование функции отмены');
    console.log('✅ Сессия отменена');

    // 15. Получаем статистику сессий
    const stats = await Session.getSessionStats(testPair.id, 'month');
    console.log('✅ Статистика сессий:', {
      totalSessions: stats.totalSessions,
      totalMinutes: stats.totalMinutes,
      averageRating: stats.averageRating,
      types: Object.keys(stats.typeStats)
    });

    // 16. Тестируем методы экземпляра
    const sessionInfo = learningSession.getDisplayInfo();
    console.log('✅ Информация о сессии:', sessionInfo);

    const duration = learningSession.getDuration();
    console.log('✅ Длительность сессии:', duration, 'минут');

    // 17. Получаем пару с сессиями через ассоциацию
    const pairWithSessions = await Pair.findByPk(testPair.id, {
      include: [
        {
          model: Session,
          as: 'Sessions',
          include: [
            {
              model: User,
              as: 'Creator',
              attributes: ['id', 'display_name']
            }
          ]
        }
      ]
    });
    console.log('✅ Пара с сессиями:', {
      pairId: pairWithSessions.id,
      sessionsCount: pairWithSessions.Sessions.length,
      sessionTypes: pairWithSessions.Sessions.map(s => s.session_type)
    });

    // 18. Получаем пользователя с созданными сессиями
    const userWithSessions = await User.findByPk(testUser1.id, {
      include: [
        {
          model: Session,
          as: 'CreatedSessions',
          attributes: ['id', 'title', 'session_type', 'status']
        }
      ]
    });
    console.log('✅ Пользователь с созданными сессиями:', {
      userId: userWithSessions.id,
      createdSessionsCount: userWithSessions.CreatedSessions.length
    });

    console.log('\n🎉 Все тесты Session модели прошли успешно!');

  } catch (error) {
    console.error('❌ Ошибка тестирования Session:', error.message);
    console.error(error.stack);
  }
}

// Запускаем тест
testSession().then(() => {
  console.log('✨ Тестирование завершено');
  process.exit(0);
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});

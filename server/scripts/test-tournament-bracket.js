const { Tournament, GameParticipant, TournamentMatch, User } = require('../models');
const sequelize = require('../config/database');

async function testTournamentBracket() {
  let tournament = null;
  let testUsers = [];
  
  try {
    console.log('🧪 Тестирование турнирной системы...');

    // Создаем тестовых пользователей
    for (let i = 1; i <= 7; i++) { // 6 участников + 1 создатель
      const user = await User.create({
        username: `testuser${i}`,
        email: `testuser${i}@test.com`,
        password_hash: 'test_hash',
        display_name: `Test User ${i}`,
        first_name: `User`,
        last_name: `${i}`
      });
      testUsers.push(user);
      console.log(`✅ Тестовый пользователь ${i} создан:`, user.id);
    }

    // Создаем тестовый турнир
    tournament = await Tournament.create({
      name: 'Тестовый турнир',
      description: 'Тест новой системы турниров',
      type: 'single_elimination',
      max_participants: 8,
      status: 'registering',
      creator_id: testUsers[0].id // Первый пользователь - создатель
    });

    console.log('✅ Турнир создан:', tournament.id);

    // Создаем тестовых участников
    const participants = [];
    for (let i = 1; i <= 6; i++) {
      const participant = await GameParticipant.create({
        tournament_id: tournament.id,
        user_id: testUsers[i].id, // Используем реальных пользователей
        is_host: false,
        stats: {}
      });
      participants.push(participant);
      console.log(`✅ Участник ${i} создан:`, participant.id);
    }

    // Запускаем турнир (это должно сгенерировать сетку)
    console.log('🚀 Запускаем турнир...');
    await tournament.start();
    console.log('✅ Турнир запущен, статус:', tournament.status);

    // Получаем сгенерированные матчи
    const matches = await TournamentMatch.getMatchesByTournament(tournament.id);
    console.log(`✅ Сгенерировано матчей: ${matches.length}`);

    // Показываем структуру сетки
    matches.forEach(match => {
      console.log(`🎯 Раунд ${match.round}, Позиция ${match.position}:`, {
        participant1: match.participant1_id,
        participant2: match.participant2_id,
        status: match.status
      });
    });

    // Тестируем готовность участников
    if (matches.length > 0) {
      const firstMatch = matches[0];
      console.log('🎮 Тестируем готовность участников...');
      
      if (firstMatch.participant1_id) {
        await firstMatch.setReady(firstMatch.participant1_id);
        console.log('✅ Участник 1 готов');
      }
      
      if (firstMatch.participant2_id) {
        await firstMatch.setReady(firstMatch.participant2_id);
        console.log('✅ Участник 2 готов');
      }
      
      console.log('📊 Статус матча после готовности:', firstMatch.status);
    }

    // Получаем состояние турнира
    const state = await tournament.getTournamentState();
    console.log('📊 Состояние турнира:', {
      currentRound: state.currentRound,
      totalRounds: state.totalRounds,
      matchesCount: state.matches.length,
      participantsCount: state.participants.length
    });

    console.log('🎉 Тест завершен успешно!');

    // Очищаем тестовые данные
    console.log('🧹 Очищаем тестовые данные...');
    if (tournament) {
      await TournamentMatch.destroy({ where: { tournament_id: tournament.id } });
      await GameParticipant.destroy({ where: { tournament_id: tournament.id } });
      await Tournament.destroy({ where: { id: tournament.id } });
    }
    for (const user of testUsers) {
      await User.destroy({ where: { id: user.id } });
    }
    console.log('✅ Тестовые данные очищены');

  } catch (error) {
    console.error('❌ Ошибка в тесте:', error);
  } finally {
    await sequelize.close();
  }
}

// Запускаем тест
testTournamentBracket();

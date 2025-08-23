const { User, Tournament, GameParticipant, Transaction, GameRoom } = require('../models');

async function testTournament() {
  console.log('🎯 Тестирование Tournament модели...');

  try {
    // 1. Создаем тестового пользователя
    const testUser = await User.create({
      email: `test-tournament-${Date.now()}@example.com`,
      first_name: 'Test',
      last_name: 'User',
      display_name: 'Test User Tournament'
    });
    console.log('✅ Создан тестовый пользователь:', testUser.id);

    // 2. Создаем турнир
    const tournament = await Tournament.createTournament({
      name: 'Test Championship',
      description: 'Test tournament for checking functionality',
      type: 'single_elimination',
      max_participants: 8,
      entry_fee_coins: 100,
      prize_pool: 500,
      creator_id: testUser.id,
      start_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // завтра
      metadata: {
        rules: 'Standard tournament rules',
        test: true
      }
    });
    console.log('✅ Создан турнир:', tournament.id, tournament.name);

    // 3. Переводим турнир в статус регистрации
    await tournament.update({ status: 'registering' });
    console.log('✅ Турнир переведен в статус регистрации');

    // 4. Регистрируем участника
    await tournament.register(testUser.id);
    console.log('✅ Пользователь зарегистрирован в турнире');

    // 5. Проверяем создание транзакции за вступительный взнос
    const entryTransaction = await Transaction.findOne({
      where: {
        user_id: testUser.id,
        tournament_id: tournament.id,
        tx_type: 'tournament_entry'
      }
    });
    console.log('✅ Транзакция вступительного взноса:', entryTransaction ? entryTransaction.amount : 'не найдена');

    // 6. Получаем турнир с участниками
    const tournamentWithParticipants = await Tournament.getTournamentWithParticipants(tournament.id);
    console.log('✅ Турнир с участниками получен:', {
      id: tournamentWithParticipants.id,
      participantsCount: tournamentWithParticipants.Participants.length,
      creatorName: tournamentWithParticipants.Creator.display_name
    });

    // 7. Получаем активные турниры
    const activeTournaments = await Tournament.getActiveTournaments();
    console.log('✅ Активные турниры найдены:', activeTournaments.length);

    // 8. Стартуем турнир
    await tournament.start();
    console.log('✅ Турнир запущен');

    // 9. Создаем игровую комнату для турнира
    const gameRoom = await GameRoom.create({
      gameType: 'chess',
      status: 'waiting',
      bet: 0,
      maxPlayers: 2,
      hostId: testUser.id,
      players: [testUser.id],
      tournament_id: tournament.id
    });
    console.log('✅ Создана игровая комната для турнира:', gameRoom.id);

    // 10. Проверяем ассоциации
    const tournamentWithRooms = await Tournament.findByPk(tournament.id, {
      include: [
        { model: GameRoom, as: 'GameRooms' },
        { model: Transaction, as: 'Transactions' }
      ]
    });
    console.log('✅ Ассоциации турнира:', {
      gameRooms: tournamentWithRooms.GameRooms.length,
      transactions: tournamentWithRooms.Transactions.length
    });

    // 11. Завершаем турнир с победителем
    await tournament.complete(testUser.id);
    console.log('✅ Турнир завершен с победителем');

    // 12. Проверяем создание призовой транзакции
    const prizeTransaction = await Transaction.findOne({
      where: {
        user_id: testUser.id,
        tournament_id: tournament.id,
        tx_type: 'tournament_prize'
      }
    });
    console.log('✅ Призовая транзакция:', prizeTransaction ? prizeTransaction.amount : 'не найдена');

    // 13. Тестируем попытку регистрации в завершенный турнир
    try {
      await tournament.register(testUser.id);
      console.log('❌ Ошибка: удалось зарегистрироваться в завершенный турнир');
    } catch (error) {
      console.log('✅ Правильно заблокирована регистрация в завершенный турнир');
    }

    // 14. Проверяем финальное состояние турнира
    const finalTournament = await Tournament.findByPk(tournament.id);
    console.log('✅ Финальное состояние турнира:', {
      status: finalTournament.status,
      winnerId: finalTournament.metadata.winner_id,
      startDate: finalTournament.start_date,
      endDate: finalTournament.end_date
    });

    console.log('\n🎉 Все тесты Tournament модели прошли успешно!');

  } catch (error) {
    console.error('❌ Ошибка тестирования Tournament:', error.message);
    console.error(error.stack);
  }
}

// Запускаем тест
testTournament().then(() => {
  console.log('✨ Тестирование завершено');
  process.exit(0);
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});

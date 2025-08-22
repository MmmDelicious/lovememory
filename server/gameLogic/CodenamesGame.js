class CodenamesGame {
  constructor(players, settings = {}) {
    if (Array.isArray(players) && players.length > 0 && typeof players[0] === 'object' && players[0].id) {
      this.players = players.map(player => player.id); // Массив ID игроков [captain1, player1, captain2, player2]
      this.playersInfo = {}; // Сохраняем информацию об игроках
      players.forEach(player => {
        this.playersInfo[player.id] = {
          id: player.id,
          name: player.name,
          first_name: player.first_name,
          last_name: player.last_name,
          username: player.username,
          avatarUrl: player.avatarUrl
        };
      });
    } else {
      this.players = players; // Массив ID игроков
      this.playersInfo = {};
    }
    this.gameType = 'codenames';
    this.status = 'in_progress';
    this.gameFormat = '2v2'; // Только формат 2v2
    this.maxPlayers = 4;
    this.settings = settings || {};
    this.teams = {
      team1: { captain: null, player: null, name: 'Красная команда', color: 'red' },
      team2: { captain: null, player: null, name: 'Синяя команда', color: 'blue' }
    };
    this.setupTeams();
    this.boardSize = 25; // 5x5 сетка
    this.words = [];
    this.board = [];
    this.cardTypes = {
      RED: 'red',     // Красные карты команды 1
      BLUE: 'blue',   // Синие карты команды 2  
      NEUTRAL: 'neutral', // Нейтральные карты
      ASSASSIN: 'assassin' // Карта убийцы
    };
    this.startingTeam = Math.random() < 0.5 ? 'team1' : 'team2';
    this.cardCounts = {
      red: this.startingTeam === 'team1' ? 9 : 8,
      blue: this.startingTeam === 'team2' ? 9 : 8,
      neutral: 7,
      assassin: 1
    };
    this.currentTeam = this.startingTeam; // Случайная команда ходит первой
    this.currentPhase = 'giving_clue'; // giving_clue, guessing
    this.currentClue = null;
    this.currentClueNumber = 0;
    this.guessesLeft = 0;
    this.canPass = false;
    this.turnStartTime = Date.now();
    this.turnTimeLimit = this.getTurnTimeLimit();
    this.winner = null;
    this.isDraw = false;
    this.gameHistory = [];
    this.revealed = new Set(); // Открытые карты
    this.generateBoard();
    console.log('[Codenames] Game created with players:', this.players);
    console.log('[Codenames] Teams:', this.teams);
    console.log('[Codenames] Starting team:', this.startingTeam);
    console.log('[Codenames] Card distribution:', this.cardCounts);
  }
  setupTeams() {
    if (this.players.length !== 4) {
      throw new Error(`Expected 4 players, got ${this.players.length}`);
    }
    this.teams.team1.captain = this.players[0];
    this.teams.team1.player = this.players[1];
    this.teams.team2.captain = this.players[2];
    this.teams.team2.player = this.players[3];
    console.log('[Codenames] Teams set up:', {
      team1: { captain: this.teams.team1.captain, player: this.teams.team1.player },
      team2: { captain: this.teams.team2.captain, player: this.teams.team2.player }
    });
  }
  getTurnTimeLimit() {
    const difficulty = this.settings.difficulty || 'normal';
    switch (difficulty) {
      case 'easy': return 180; // 3 минуты
      case 'normal': return 120; // 2 минуты  
      case 'hard': return 90; // 1.5 минуты
      default: return 120;
    }
  }
  isTimeUp() {
    const elapsed = (Date.now() - this.turnStartTime) / 1000;
    return elapsed >= this.turnTimeLimit;
  }
  getRemainingTime() {
    const elapsed = (Date.now() - this.turnStartTime) / 1000;
    return Math.max(0, this.turnTimeLimit - elapsed);
  }
  generateBoard() {
    const wordBank = [
      'АГЕНТ', 'АНГЛИЯ', 'АНГЕЛ', 'АНТАРКТИДА', 'АРМИЯ', 'АТОМ', 'АФРИКА', 'БАБОЧКА', 'БАНК',
      'БАССЕЙН', 'БАТАРЕЯ', 'БАШНЯ', 'БЕЛКА', 'БИЛЕТ', 'БЛОК', 'БОМБА', 'БОТИНОК', 'БРАСЛЕТ',
      'БРАТ', 'БУКВА', 'ВАМПИР', 'ВАЗА', 'ВЕЛИКАН', 'ВЕРБЛЮД', 'ВЕСЫ', 'ВЕТЕР', 'ВИЛКА',
      'ВОДА', 'ВОЛК', 'ВОРОТА', 'ВРАЧ', 'ВРЕМЯ', 'ГАЗЕТА', 'ГАЛАКТИКА', 'ГЕРМАНИЯ', 'ГИГАНТ',
      'ГЛАЗ', 'ГОЛОВА', 'ГОРА', 'ГОРОД', 'ГРУДЬ', 'ГРУППА', 'ДВЕРЬ', 'ДВОРЕЦ', 'ДЕВОЧКА',
      'ДЕДУШКА', 'ДЕЛЬФИН', 'ДЕНЬ', 'ДЕРЕВО', 'ДЕТАЛЬ', 'ДЕТИ', 'ДИНОЗАВР', 'ДИСК', 'ДОЖДЬ',
      'ДОМ', 'ДОРОГА', 'ДРАКОН', 'ДРУГ', 'ДУГА', 'ЕГИПЕТ', 'ЕДИНОРОГ', 'ЖАБА', 'ЖЕЛЕЗО',
      'ЖЕМЧУГ', 'ЖЕНЩИНА', 'ЖИЗНЬ', 'ЖУРНАЛ', 'ЗАВОД', 'ЗАМОК', 'ЗВЕЗДА', 'ЗВОНОК', 'ЗЕБРА',
      'ЗЕМЛЯ', 'ЗЕРКАЛО', 'ЗИМА', 'ЗОЛОТО', 'ЗОНТ', 'ЗУБА', 'ИГЛА', 'ИГРА', 'ИДЕЯ', 'ИКРА',
      'ИНДИЯ', 'ИНТЕРНЕТ', 'ИСКУССТВО', 'ИТАЛИЯ', 'КАБИНА', 'КАКТУС', 'КАМЕНЬ', 'КАПИТАН',
      'КАРТА', 'КАША', 'КИНО', 'КИТАЙ', 'КЛАСС', 'КЛЮЧ', 'КНИГА', 'КОГОТЬ', 'КОЛЕСО',
      'КОМАНДА', 'КОНЬ', 'КОРАБЛЬ', 'КОРОВА', 'КОСМОС', 'КОСТЬ', 'КОТ', 'КОФЕ', 'КРАСОТА',
      'КРОВЬ', 'КРУГ', 'КРЫША', 'КУКЛА', 'ЛАБИРИНТ', 'ЛАМПА', 'ЛАПА', 'ЛЕТО', 'ЛИМОН',
      'ЛИНИЯ', 'ЛИСТ', 'ЛУНА', 'ЛЁД', 'ЛЮБОВЬ', 'МАГИЯ', 'МАШИНА', 'МЕДВЕДЬ', 'МОЛОКО',
      'МОРЕ', 'МОСТ', 'МУЗЫКА', 'МЫШЬ', 'НЕБО', 'НЕФТЬ', 'НОГА', 'НОЖ', 'НОЧЬ', 'ОБЛАКО',
      'ОГОНЬ', 'ОЗЕРО', 'ОКЕАН', 'ОКНО', 'ОПЕРА', 'ОРЁЛ', 'ОСТРОВ', 'ПАЛЕЦ', 'ПАПА', 'ПАРК',
      'ПАУК', 'ПЕЧАТЬ', 'ПИРАМИДА', 'ПЛАНЕТА', 'ПОЕЗД', 'ПОЛК', 'ПОЧТА', 'ПРИНЦ', 'ПТИЦА',
      'ПУЛЯ', 'ПУСТЫНЯ', 'РАБОТА', 'РАДУГА', 'РЕКА', 'РОБОТ', 'РОССИЯ', 'РУКА', 'РЫБА',
      'САДЫ', 'САМОЛЁТ', 'СВЕТ', 'СВИНЬЯ', 'СЕДЛО', 'СЕМЬЯ', 'СЕРДЦЕ', 'СИЛА', 'СКАЗКА',
      'СЛОН', 'СНЕГ', 'СОБАКА', 'СОЛНЦЕ', 'СПОРТ', 'СТАКАН', 'СТЕНА', 'СТОЛ', 'СТРАНА',
      'ТАНК', 'ТЕАТР', 'ТЕЛЕФОН', 'ТЕНЬ', 'ТИГР', 'ТКАНЬ', 'ТОЧКА', 'ТРАВА', 'ТРУБА',
      'ТУЧА', 'УЛИЦА', 'УТКА', 'УХО', 'УЧИТЕЛЬ', 'ФАБРИКА', 'ФЕРМА', 'ФИГУРА', 'ФЛАГ',
      'ФОРМА', 'ФОТО', 'ФРАНЦИЯ', 'ФРУКТ', 'ХИМИЯ', 'ХЛЕБ', 'ХОЛМ', 'ЦВЕТ', 'ЦЕНТР',
      'ЦЕПЬ', 'ЦЕРКОВЬ', 'ЦИРК', 'ЧИСЛО', 'ЧАШКА', 'ЧЕЛОВЕК', 'ЧЕСТЬ', 'ШАПКА', 'ШКОЛА',
      'ШТОРМ', 'ЭЛЬФ', 'ЭНЕРГИЯ', 'ЮПИТЕР', 'ЯЗЫК',
      'АВТОБУС', 'АКТЁР', 'АЛЬБОМ', 'АПЕЛЬСИН', 'БАЛКОН', 'БАНАН', 'БАРАБАН', 'БЕГУН',
      'БИЛЛ', 'БИТВА', 'БЛЮДО', 'БОГАТСТВО', 'БОЛЕЗНЬ', 'БОЛЬНИЦА', 'БОРЬБА', 'БОТАНІК',
      'ВЕДРО', 'ВЕСЕЛЬЕ', 'ВЕЧЕР', 'ВИНТОВКА', 'ВКУС', 'ВОЗРАСТ', 'ВОЛШЕБНИК', 'ВОПРОС',
      'ВОСХОД', 'ВРАГ', 'ВУЛКАН', 'ВЫБОР', 'ГАЗ', 'ГАЛСТУК', 'ГАРАЖ', 'ГЕНИЙ', 'ГЕРОЙ',
      'ГИТАРА', 'ГЛУБИНА', 'ГНОМ', 'ГОЛОС', 'ГОРЛО', 'ГРАНИЦА', 'ГРЕЦИЯ', 'ГРОМ', 'ДАМА',
      'ДАННЫЕ', 'ДАРЕНИЕ', 'ДВИЖЕНИЕ', 'ДЕРЗОСТЬ', 'ДЕТСТВО', 'ДИВАН', 'ДОКТОР', 'ДОЛГ',
      'ДОЧЬ', 'ДРУЖБА', 'ДУША', 'ЕВРОПА', 'ЁЛКА', 'ЖАРА', 'ЖЕРТВА', 'ЖИВОТНОЕ', 'ЗАВТРАК',
      'ЗАГАДКА', 'ЗАКОН', 'ЗАПАХ', 'ЗАРПЛАТА', 'ЗАЩИТА', 'ЗДАНИЕ', 'ЗНАНИЕ', 'ЗНАМЯ', 'ИГРУШКА'
    ];
    const shuffled = [...wordBank].sort(() => Math.random() - 0.5);
    this.words = shuffled.slice(0, this.boardSize);
    const cardTypes = [
      ...Array(this.cardCounts.red).fill(this.cardTypes.RED),
      ...Array(this.cardCounts.blue).fill(this.cardTypes.BLUE),
      ...Array(this.cardCounts.neutral).fill(this.cardTypes.NEUTRAL),
      ...Array(this.cardCounts.assassin).fill(this.cardTypes.ASSASSIN)
    ];
    const shuffledTypes = cardTypes.sort(() => Math.random() - 0.5);
    this.board = this.words.map((word, index) => ({
      id: index,
      word: word,
      type: shuffledTypes[index],
      revealed: false
    }));
    console.log('[Codenames] Board generated with', this.board.length, 'cards');
  }
  getCurrentPlayerId() {
    if (this.currentPhase === 'giving_clue') {
      return this.teams[this.currentTeam].captain;
    } else {
      return this.teams[this.currentTeam].player;
    }
  }
  getPlayerRole(playerId) {
    for (const [teamId, team] of Object.entries(this.teams)) {
      if (team.captain === playerId) {
        return { team: teamId, role: 'captain' };
      }
      if (team.player === playerId) {
        return { team: teamId, role: 'player' };
      }
    }
    return null;
  }
  giveClue(playerId, clueWord, clueNumber) {
    console.log(`[Codenames] Player ${playerId} giving clue: "${clueWord}" for ${clueNumber} cards`);
    const playerRole = this.getPlayerRole(playerId);
    if (!playerRole || playerRole.team !== this.currentTeam || playerRole.role !== 'captain') {
      throw new Error('Только капитан текущей команды может давать подсказки');
    }
    if (this.currentPhase !== 'giving_clue') {
      throw new Error('Сейчас не время давать подсказки');
    }
    if (this.isTimeUp()) {
      console.log(`[Codenames] Time up for clue, auto-ending turn`);
      this.endTurn();
      throw new Error('Время на ход истекло');
    }
    if (!clueWord || typeof clueWord !== 'string' || clueWord.trim().length === 0) {
      throw new Error('Подсказка не может быть пустой');
    }
    if (!Number.isInteger(clueNumber) || clueNumber < 1 || clueNumber > 9) {
      throw new Error('Количество карт должно быть от 1 до 9');
    }
    const clueWordUpper = clueWord.toUpperCase().trim();
    const boardWords = this.board.map(card => card.word.toUpperCase());
    if (boardWords.includes(clueWordUpper)) {
      throw new Error('Подсказка не может совпадать со словом на поле');
    }
    const clueBase = clueWordUpper.replace(/[^\u0410-\u044F\u0401\u0451]/g, ''); // Только русские буквы
    for (const word of boardWords) {
      const wordBase = word.replace(/[^\u0410-\u044F\u0401\u0451]/g, '');
      if (clueBase.includes(wordBase) || wordBase.includes(clueBase)) {
        throw new Error('Подсказка не может содержать части слов на поле');
      }
    }
    this.currentClue = clueWord.trim();
    this.currentClueNumber = clueNumber;
    this.guessesLeft = clueNumber + 1; // +1 дополнительная попытка
    this.currentPhase = 'guessing';
    this.canPass = false;
    this.gameHistory.push({
      type: 'clue',
      team: this.currentTeam,
      player: playerId,
      clue: this.currentClue,
      number: this.currentClueNumber,
      timestamp: new Date().toISOString()
    });
    console.log(`[Codenames] Clue set: "${this.currentClue}" for ${this.currentClueNumber} cards`);
    return this.getState();
  }
  makeGuess(playerId, cardId) {
    console.log(`[Codenames] Player ${playerId} guessing card ${cardId}`);
    const playerRole = this.getPlayerRole(playerId);
    if (!playerRole || playerRole.team !== this.currentTeam || playerRole.role !== 'player') {
      throw new Error('Только игрок текущей команды может отгадывать');
    }
    if (this.currentPhase !== 'guessing') {
      throw new Error('Сейчас не время отгадывать');
    }
    if (this.guessesLeft <= 0) {
      throw new Error('Больше нет попыток отгадывания');
    }
    const card = this.board.find(c => c.id === cardId);
    if (!card) {
      throw new Error('Карта не найдена');
    }
    if (card.revealed) {
      throw new Error('Эта карта уже открыта');
    }
    card.revealed = true;
    this.revealed.add(cardId);
    this.guessesLeft--;
    this.gameHistory.push({
      type: 'guess',
      team: this.currentTeam,
      player: playerId,
      cardId: cardId,
      word: card.word,
      cardType: card.type,
      timestamp: new Date().toISOString()
    });
    console.log(`[Codenames] Card revealed: ${card.word} (${card.type})`);
    const currentTeamColor = this.teams[this.currentTeam].color;
    if (card.type === this.cardTypes.ASSASSIN) {
      this.winner = this.currentTeam === 'team1' ? 'team2' : 'team1';
      this.status = 'finished';
      console.log(`[Codenames] Game over! Team hit assassin. Winner: ${this.winner}`);
    } else if (card.type === currentTeamColor) {
      this.canPass = true;
      console.log(`[Codenames] Correct guess! Guesses left: ${this.guessesLeft}`);
      if (this.checkWinCondition()) {
        this.winner = this.currentTeam;
        this.status = 'finished';
        console.log(`[Codenames] Game won by ${this.winner}!`);
      } else if (this.guessesLeft === 0) {
        this.endTurn();
      }
    } else {
      console.log(`[Codenames] Wrong guess! Turn ends.`);
      this.endTurn();
    }
    return this.getState();
  }
  passTurn(playerId) {
    console.log(`[Codenames] Player ${playerId} passing turn`);
    const playerRole = this.getPlayerRole(playerId);
    if (!playerRole || playerRole.team !== this.currentTeam || playerRole.role !== 'player') {
      throw new Error('Только игрок текущей команды может пропустить ход');
    }
    if (this.currentPhase !== 'guessing' || !this.canPass) {
      throw new Error('Нельзя пропустить ход в данный момент');
    }
    this.gameHistory.push({
      type: 'pass',
      team: this.currentTeam,
      player: playerId,
      timestamp: new Date().toISOString()
    });
    this.endTurn();
    return this.getState();
  }
  endTurn() {
    console.log(`[Codenames] Ending turn for ${this.currentTeam}`);
    this.currentTeam = this.currentTeam === 'team1' ? 'team2' : 'team1';
    this.currentPhase = 'giving_clue';
    this.currentClue = null;
    this.currentClueNumber = 0;
    this.guessesLeft = 0;
    this.canPass = false;
    this.turnStartTime = Date.now();
    console.log(`[Codenames] Turn switched to ${this.currentTeam}`);
  }
  checkWinCondition() {
    const currentTeamColor = this.teams[this.currentTeam].color;
    const teamCards = this.board.filter(card => card.type === currentTeamColor);
    const revealedTeamCards = teamCards.filter(card => card.revealed);
    console.log(`[Codenames] Team ${this.currentTeam} revealed ${revealedTeamCards.length}/${teamCards.length} cards`);
    return revealedTeamCards.length === teamCards.length;
  }
  getState() {
    const playerRole = this.getPlayerRole(this.getCurrentPlayerId());
    const currentTeamData = this.teams[this.currentTeam];
    const teamProgress = {
      team1: {
        total: this.board.filter(card => card.type === this.teams.team1.color).length,
        revealed: this.board.filter(card => card.type === this.teams.team1.color && card.revealed).length
      },
      team2: {
        total: this.board.filter(card => card.type === this.teams.team2.color).length,
        revealed: this.board.filter(card => card.type === this.teams.team2.color && card.revealed).length
      }
    };
    return {
      gameType: this.gameType,
      status: this.status,
      currentTeam: this.currentTeam,
      currentPhase: this.currentPhase,
      currentPlayer: this.getCurrentPlayerId(),
      teams: this.teams,
      board: this.board.map(card => ({
        id: card.id,
        word: card.word,
        revealed: card.revealed,
        type: card.revealed ? card.type : null // Скрываем тип нераскрытых карт
      })),
      currentClue: this.currentClue,
      currentClueNumber: this.currentClueNumber,
      guessesLeft: this.guessesLeft,
      canPass: this.canPass,
      teamProgress: teamProgress,
      winner: this.winner,
      isDraw: this.isDraw,
      gameHistory: this.gameHistory.slice(-10), // Последние 10 ходов
      playerRole: playerRole,
      playersInfo: this.playersInfo,
      timeRemaining: Math.ceil(this.getRemainingTime()),
      turnTimeLimit: this.turnTimeLimit,
      turnStartTime: this.turnStartTime,
      startingTeam: this.startingTeam,
      gameFormat: this.gameFormat,
      settings: this.settings
    };
  }
  getCaptainState(playerId) {
    const playerRole = this.getPlayerRole(playerId);
    if (!playerRole || playerRole.role !== 'captain') {
      return this.getState(); // Обычное состояние для не-капитанов
    }
    const state = this.getState();
    state.board = this.board.map(card => ({
      id: card.id,
      word: card.word,
      revealed: card.revealed,
      type: card.type // Капитаны видят все типы
    }));
    return state;
  }
  makeMove(playerId, move) {
    console.log(`[Codenames] makeMove called by ${playerId} with move:`, move);
    try {
      switch (move.type) {
        case 'give_clue':
          return this.giveClue(playerId, move.clueWord, move.clueNumber);
        case 'guess':
          return this.makeGuess(playerId, move.cardId);
        case 'pass':
          return this.passTurn(playerId);
        default:
          throw new Error('Неизвестный тип хода');
      }
    } catch (error) {
      console.error(`[Codenames] Error in makeMove:`, error.message);
      return { error: error.message };
    }
  }
  forceEndTurn() {
    if (this.status !== 'in_progress') return;
    console.log(`[Codenames] Force ending turn due to timeout for ${this.currentTeam}`);
    this.gameHistory.push({
      type: 'timeout',
      team: this.currentTeam,
      phase: this.currentPhase,
      timestamp: new Date().toISOString()
    });
    this.endTurn();
    return this.getState();
  }
  checkGameEnd() {
    if (this.isTimeUp()) {
      return this.forceEndTurn();
    }
    if (this.checkWinCondition()) {
      this.winner = this.currentTeam;
      this.status = 'finished';
      return this.getState();
    }
    return null;
  }
  cleanup() {
    console.log('[Codenames] Cleaning up game resources');
    this.board = null;
    this.words = null;
    this.gameHistory = null;
  }
}
module.exports = CodenamesGame;

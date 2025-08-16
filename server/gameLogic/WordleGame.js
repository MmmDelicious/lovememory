const { getRandomWord, getDictionary } = require('./wordle/dictionaries');
const { evaluateGuess } = require('./wordle/utils');

class WordleGame {
  constructor(roomId, settings = {}, callback = null) {
    this.roomId = roomId;
    this.gameType = 'wordle'; // Добавляем gameType для совместимости с сокетами
    this.players = [];
    this.status = 'waiting'; // waiting, in_progress, finished
    this.language = settings.language || 'russian';
    this.maxAttempts = 6;
    this.targetWord = '';
    this.playerGuesses = {}; // playerId -> array of guesses
    this.playerResults = {}; // playerId -> array of results
    this.scores = {}; // playerId -> score
    this.gameStartTime = null;
    this.currentRound = 1;
    this.maxRounds = settings.rounds || 3;
    this.winner = null;
    this.onStateChange = callback;
  }

  addPlayer(playerId, playerName) {
    if (this.players.length >= 2) {
      throw new Error('Room is full');
    }

    const player = {
      id: playerId,
      name: playerName,
      ready: false
    };

    this.players.push(player);
    this.playerGuesses[playerId] = [];
    this.playerResults[playerId] = [];
    this.scores[playerId] = 0;

    return this.getGameState();
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    delete this.playerGuesses[playerId];
    delete this.playerResults[playerId];
    delete this.scores[playerId];

    if (this.players.length === 0) {
      this.status = 'finished';
    }

    return this.getGameState();
  }

  startGame() {
    if (this.players.length < 2) {
      throw new Error('Need at least 2 players');
    }

    this.status = 'in_progress';
    this.gameStartTime = Date.now();
    this.generateNewWord();
    
    return this.getGameState();
  }

  generateNewWord() {
    this.targetWord = getRandomWord(this.language).toUpperCase();
    console.log(`[WordleGame] Generated new word: "${this.targetWord}" for round ${this.currentRound}`);
    
    // Очищаем попытки для нового раунда
    for (const playerId of this.players.map(p => p.id)) {
      this.playerGuesses[playerId] = [];
      this.playerResults[playerId] = [];
      console.log(`[WordleGame] Cleared guesses/results for player ${playerId}`);
    }
  }

  makeMove(playerId, move) {
    return this.makeGuess(playerId, move);
  }

  makeGuess(playerId, guess) {
    console.log(`[WordleGame] Player ${playerId} making guess: "${guess}"`);
    
    if (this.status !== 'in_progress') {
      throw new Error('Game is not in progress');
    }

    if (!this.players.find(p => p.id === playerId)) {
      throw new Error('Player not in game');
    }

    const normalizedGuess = guess.toUpperCase();
    
    console.log(`[WordleGame] Normalized guess: "${normalizedGuess}", Target word: "${this.targetWord}"`);
    
    // Проверяем длину слова (должно быть ровно 5 букв)
    if (normalizedGuess.length !== 5) {
      throw new Error('Word must be exactly 5 letters');
    }

    // Словарь проверяется на фронте, тут просто обрабатываем

    // Добавляем попытку
    this.playerGuesses[playerId].push(normalizedGuess);
    
    // Оцениваем попытку
    const result = evaluateGuess(normalizedGuess, this.targetWord);
    this.playerResults[playerId].push(result);
    
    console.log(`[WordleGame] Guess result for "${normalizedGuess}":`, result);

    // Проверяем, угадал ли игрок
    const isCorrect = result.every(r => r === 'correct');
    
    if (isCorrect) {
      // Игрок угадал слово
      const attempts = this.playerGuesses[playerId].length;
      const points = Math.max(0, 7 - attempts); // Больше очков за меньше попыток
      this.scores[playerId] += points;
      
      this.nextRound();
    } else if (this.playerGuesses[playerId].length >= this.maxAttempts) {
      // Игрок исчерпал попытки - переходим к следующему раунду
      this.checkRoundEnd();
    }

    // Уведомляем о изменении состояния
    if (this.onStateChange) {
      this.onStateChange(this);
    }

    return this.getGameState();
  }

  checkRoundEnd() {
    // Проверяем, закончили ли все игроки раунд
    const allPlayersFinished = this.players.every(player => {
      const guesses = this.playerGuesses[player.id] || [];
      const results = this.playerResults[player.id] || [];
      
      // Игрок закончил, если:
      // 1. Потратил все попытки
      // 2. Угадал слово (последний результат - все 'correct')
      if (guesses.length >= this.maxAttempts) {
        return true;
      }
      
      if (results.length > 0) {
        const lastResult = results[results.length - 1];
        return lastResult && lastResult.every(r => r === 'correct');
      }
      
      return false;
    });

    console.log(`[WordleGame] checkRoundEnd: allPlayersFinished = ${allPlayersFinished}`);

    if (allPlayersFinished) {
      this.nextRound();
    }
  }

  nextRound() {
    console.log(`[WordleGame] nextRound: currentRound=${this.currentRound}, maxRounds=${this.maxRounds}`);
    
    if (this.currentRound >= this.maxRounds) {
      console.log(`[WordleGame] Game ending - max rounds reached`);
      this.endGame();
    } else {
      this.currentRound++;
      console.log(`[WordleGame] Moving to round ${this.currentRound}, generating new word`);
      this.generateNewWord();
    }
  }

  endGame() {
    this.status = 'finished';
    
    // Определяем победителя
    const maxScore = Math.max(...Object.values(this.scores));
    const winners = this.players.filter(p => this.scores[p.id] === maxScore);
    
    if (winners.length === 1) {
      this.winner = winners[0].id;
    } else {
      this.winner = 'draw';
    }
  }

  getState() {
    return this.getGameState();
  }

  getGameState() {
    return {
      roomId: this.roomId,
      gameType: 'wordle',
      status: this.status,
      players: this.players.map(p => p.id),
      language: this.language,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      maxAttempts: this.maxAttempts,
      scores: this.scores,
      winner: this.winner,
      targetWordLength: this.targetWord ? this.targetWord.length : 5,
      // Личные данные игрока добавляются в GameManager
    };
  }

  getStateForPlayer(playerId) {
    return this.getPlayerGameState(playerId);
  }

  getPlayerGameState(playerId) {
    const baseState = this.getGameState();
    
    return {
      ...baseState,
      playerGuesses: this.playerGuesses[playerId] || [],
      playerResults: this.playerResults[playerId] || [],
      // В финальном состоянии показываем правильное слово
      targetWord: this.status === 'finished' ? this.targetWord : undefined
    };
  }
}

module.exports = WordleGame;
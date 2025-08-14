const { getRandomWord, getDictionary } = require('./wordle/dictionaries');
const { evaluateGuess } = require('./wordle/utils');

class WordleGame {
  constructor(roomId, settings = {}) {
    this.roomId = roomId;
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
    
    // Очищаем попытки для нового раунда
    for (const playerId of this.players.map(p => p.id)) {
      this.playerGuesses[playerId] = [];
      this.playerResults[playerId] = [];
    }
  }

  makeMove(playerId, move) {
    return this.makeGuess(playerId, move);
  }

  makeGuess(playerId, guess) {
    if (this.status !== 'in_progress') {
      throw new Error('Game is not in progress');
    }

    if (!this.players.find(p => p.id === playerId)) {
      throw new Error('Player not in game');
    }

    const normalizedGuess = guess.toUpperCase();
    const dictionary = getDictionary(this.language);
    
    // Проверяем, что слово есть в словаре
    if (!dictionary.includes(normalizedGuess.toLowerCase())) {
      throw new Error('Word not in dictionary');
    }

    // Проверяем длину слова
    if (normalizedGuess.length !== this.targetWord.length) {
      throw new Error('Wrong word length');
    }

    // Добавляем попытку
    this.playerGuesses[playerId].push(normalizedGuess);
    
    // Оцениваем попытку
    const result = evaluateGuess(normalizedGuess, this.targetWord);
    this.playerResults[playerId].push(result);

    // Проверяем, угадал ли игрок
    const isCorrect = result.every(r => r === 'correct');
    
    if (isCorrect) {
      // Игрок угадал слово
      const attempts = this.playerGuesses[playerId].length;
      const points = Math.max(0, 7 - attempts); // Больше очков за меньше попыток
      this.scores[playerId] += points;
      
      this.nextRound();
    } else if (this.playerGuesses[playerId].length >= this.maxAttempts) {
      // Игрок исчерпал попытки
      this.checkRoundEnd();
    }

    return this.getGameState();
  }

  checkRoundEnd() {
    // Проверяем, закончили ли все игроки раунд
    const allPlayersFinished = this.players.every(player => {
      const guesses = this.playerGuesses[player.id];
      const lastResult = this.playerResults[player.id][this.playerResults[player.id].length - 1];
      
      return guesses.length >= this.maxAttempts || 
             (lastResult && lastResult.every(r => r === 'correct'));
    });

    if (allPlayersFinished) {
      this.nextRound();
    }
  }

  nextRound() {
    if (this.currentRound >= this.maxRounds) {
      this.endGame();
    } else {
      this.currentRound++;
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
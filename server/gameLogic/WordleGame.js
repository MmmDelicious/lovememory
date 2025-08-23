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
    this.gameFormat = settings.gameFormat || '1v1'; // '1v1' или '2v2'
    this.maxPlayers = this.gameFormat === '2v2' ? 4 : 2;
    this.teams = {}; // Для формата 2x2: team1, team2
    this.teamScores = {}; // Счет команд в формате 2x2
  }
  addPlayer(playerId, playerName) {
    if (this.players.length >= this.maxPlayers) {
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
    if (this.gameFormat === '2v2') {
      this.assignPlayerToTeam(playerId);
    }
    return this.getGameState();
  }
  assignPlayerToTeam(playerId) {
    if (!this.teams.team1) this.teams.team1 = [];
    if (!this.teams.team2) this.teams.team2 = [];
    if (this.teams.team1.length < 2) {
      this.teams.team1.push(playerId);
    } else if (this.teams.team2.length < 2) {
      this.teams.team2.push(playerId);
    }
    if (!this.teamScores.team1) this.teamScores.team1 = 0;
    if (!this.teamScores.team2) this.teamScores.team2 = 0;
  }
  updateTeamScore(playerId, points) {
    if (this.teams.team1 && this.teams.team1.includes(playerId)) {
      this.teamScores.team1 += points;
    } else if (this.teams.team2 && this.teams.team2.includes(playerId)) {
      this.teamScores.team2 += points;
    }
  }
  getPlayerTeam(playerId) {
    if (this.teams.team1 && this.teams.team1.includes(playerId)) {
      return 'team1';
    } else if (this.teams.team2 && this.teams.team2.includes(playerId)) {
      return 'team2';
    }
    return null;
  }
  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    delete this.playerGuesses[playerId];
    delete this.playerResults[playerId];
    delete this.scores[playerId];
    if (this.gameFormat === '2v2') {
      if (this.teams.team1) {
        this.teams.team1 = this.teams.team1.filter(id => id !== playerId);
      }
      if (this.teams.team2) {
        this.teams.team2 = this.teams.team2.filter(id => id !== playerId);
      }
    }
    if (this.players.length === 0) {
      this.status = 'finished';
    }
    return this.getGameState();
  }
  startGame() {
    const requiredPlayers = this.gameFormat === '2v2' ? 4 : 2;
    if (this.players.length < requiredPlayers) {
      throw new Error(`Need ${requiredPlayers} players for ${this.gameFormat} format`);
    }
    this.status = 'in_progress';
    this.gameStartTime = Date.now();
    this.generateNewWord();
    return this.getGameState();
  }
  generateNewWord() {
    this.targetWord = getRandomWord(this.language).toUpperCase();
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
    if (normalizedGuess.length !== 5) {
      throw new Error('Word must be exactly 5 letters');
    }
    this.playerGuesses[playerId].push(normalizedGuess);
    const result = evaluateGuess(normalizedGuess, this.targetWord);
    this.playerResults[playerId].push(result);
    const isCorrect = result.every(r => r === 'correct');
    if (isCorrect) {
      const attempts = this.playerGuesses[playerId].length;
      const points = Math.max(0, 7 - attempts); // Больше очков за меньше попыток
      this.scores[playerId] += points;
      if (this.gameFormat === '2v2') {
        this.updateTeamScore(playerId, points);
      }
      this.nextRound();
    } else if (this.playerGuesses[playerId].length >= this.maxAttempts) {
      this.checkRoundEnd();
    }
    if (this.onStateChange) {
      this.onStateChange(this);
    }
    return this.getGameState();
  }
  checkRoundEnd() {
    const allPlayersFinished = this.players.every(player => {
      const guesses = this.playerGuesses[player.id] || [];
      const results = this.playerResults[player.id] || [];
      if (guesses.length >= this.maxAttempts) {
        return true;
      }
      if (results.length > 0) {
        const lastResult = results[results.length - 1];
        return lastResult && lastResult.every(r => r === 'correct');
      }
      return false;
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
    if (this.gameFormat === '2v2') {
      if (this.teamScores.team1 > this.teamScores.team2) {
        this.winner = 'team1';
      } else if (this.teamScores.team2 > this.teamScores.team1) {
        this.winner = 'team2';
      } else {
        this.winner = 'draw';
      }
    } else {
      const maxScore = Math.max(...Object.values(this.scores));
      const winners = this.players.filter(p => this.scores[p.id] === maxScore);
      if (winners.length === 1) {
        this.winner = winners[0].id;
      } else {
        this.winner = 'draw';
      }
    }
  }
  getState() {
    return this.getGameState();
  }
  getGameState() {
    const baseState = {
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
      gameFormat: this.gameFormat,
    };
    if (this.gameFormat === '2v2') {
      baseState.teams = this.teams;
      baseState.teamScores = this.teamScores;
    }
    return baseState;
  }
  getStateForPlayer(playerId) {
    return this.getPlayerGameState(playerId);
  }
  getPlayerGameState(playerId) {
    const baseState = this.getGameState();
    const playerState = {
      ...baseState,
      playerGuesses: this.playerGuesses[playerId] || [],
      playerResults: this.playerResults[playerId] || [],
      targetWord: this.status === 'finished' ? this.targetWord : undefined
    };
    if (this.gameFormat === '2v2') {
      playerState.playerTeam = this.getPlayerTeam(playerId);
    }
    return playerState;
  }
}
module.exports = WordleGame;

const RUSSIAN_WORDS = ['СЛОВО','ВРЕМЯ','ИГРА','ДОМА','ВОДА','РУКА','НОГА','ГЛАЗ','ДЕНЬ','НОЧЬ','ЗАМОК','КЛЮЧИ','ОКЕАН','ПАРТА', 'СОНЦЕ', 'ЗЕМЛЯ', 'КНИГА', 'ПОЛКА'];

class WordleGame {
  constructor(playerIds, options = {}) {
    this.gameType = 'wordle';
    this.players = playerIds.map(id => ({
      id,
      score: 0,
      targetWord: this.getRandomWord(),
      guesses: [],
      currentGuess: '',
      attempts: 1,
      guessedLetters: {},
    }));
    this.status = 'in_progress';
    this.gameDuration = options.duration || 180;
    this.timeLeft = this.gameDuration;
    this.onStateChange = options.onStateChange || (() => {});
    
    this.start();
  }

  getRandomWord() {
    return RUSSIAN_WORDS[Math.floor(Math.random() * RUSSIAN_WORDS.length)];
  }

  start() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.endGame();
      }
      this.onStateChange(this);
    }, 1000);
  }

  endGame() {
    clearInterval(this.timer);
    this.status = 'finished';
    const player1 = this.players[0];
    const player2 = this.players[1];

    if (player1.score > player2.score) {
      this.winner = player1.id;
    } else if (player2.score > player1.score) {
      this.winner = player2.id;
    } else {
      this.winner = 'draw';
    }
    this.onStateChange(this);
  }

  makeMove(playerId, move) {
    if (this.status !== 'in_progress') {
      return { error: 'Игра уже окончена' };
    }
    
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { error: 'Игрок не найден' };

    const { guess } = move;
    if (guess.length !== 5) return { error: 'Слово должно состоять из 5 букв' };
    if (!RUSSIAN_WORDS.includes(guess.toUpperCase())) return { error: 'Такого слова нет в словаре' };

    player.guesses.push(guess);

    const newGuessed = { ...player.guessedLetters };
    for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        if (player.targetWord[i] === letter) newGuessed[letter] = 'correct';
        else if (player.targetWord.includes(letter) && newGuessed[letter] !== 'correct') newGuessed[letter] = 'present';
        else if (!player.targetWord.includes(letter)) newGuessed[letter] = 'absent';
    }
    player.guessedLetters = newGuessed;

    if (guess === player.targetWord) {
      player.score++;
      this.resetPlayerBoard(player);
    } else if (player.guesses.length >= 6) {
      this.resetPlayerBoard(player);
    } else {
      player.attempts++;
    }

    this.onStateChange(this);
    return { success: true };
  }

  resetPlayerBoard(player) {
    player.targetWord = this.getRandomWord();
    player.guesses = [];
    player.attempts = 1;
    player.guessedLetters = {};
  }
  
  getState() {
    return {
      gameType: this.gameType,
      status: this.status,
      timeLeft: this.timeLeft,
      winner: this.winner,
      playerScores: this.players.map(p => ({ id: p.id, score: p.score })),
    };
  }

  getStateForPlayer(playerId) {
    const player = this.players.find(p => p.id === playerId);
    const opponent = this.players.find(p => p.id !== playerId);

    if (!player) return null;

    return {
      ...this.getState(),
      playerState: {
        guesses: player.guesses,
        attempts: player.attempts,
        guessedLetters: player.guessedLetters,
        score: player.score,
      },
      opponentState: {
        score: opponent.score,
      }
    };
  }

  cleanup() {
    clearInterval(this.timer);
  }
}

module.exports = WordleGame;
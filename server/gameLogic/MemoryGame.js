class MemoryGame {
  constructor(roomId, settings = {}, callback = null) {
    this.roomId = roomId;
    this.gameType = 'memory';
    this.players = [];
    this.status = 'waiting'; // waiting, in_progress, finished
    this.maxPlayers = 2;
    this.currentPlayerIndex = 0;
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = [];
    this.scores = {}; // playerId -> score
    this.moves = {}; // playerId -> number of moves
    this.gameStartTime = null;
    this.winner = null;
    this.onStateChange = callback;
    this.difficulty = settings.difficulty || 'easy'; // easy: 6x4, medium: 6x6, hard: 8x6
    this.pendingFlipBack = false; // Флаг для предотвращения множественных переворотов
    this.initializeCards();
  }

  initializeCards() {
    const cardPairs = this.getCardPairs();
    this.cards = cardPairs.map((card, index) => ({
      id: index,
      value: card,
      isFlipped: false,
      isMatched: false,
      position: index
    }));
    this.shuffleCards();
  }

  getCardPairs() {
    const symbols = ['❤️', '🌟', '🎈', '🎨', '🎭', '🎪', '🎯', '🎲', '🎮', '🎸', '🎹', '🎺', '🎻', '🎼', '🎵', '🎶', '🎷', '🎸', '🎹', '🎺', '🎻', '🎼', '🎵', '🎶'];
    
    let pairCount;
    switch (this.difficulty) {
      case 'easy':
        pairCount = 12; // 6x4 grid
        break;
      case 'medium':
        pairCount = 18; // 6x6 grid
        break;
      case 'hard':
        pairCount = 24; // 8x6 grid
        break;
      default:
        pairCount = 12;
    }

    const selectedSymbols = symbols.slice(0, pairCount);
    return [...selectedSymbols, ...selectedSymbols]; // Duplicate for pairs
  }

  shuffleCards() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  addPlayer(playerId, playerName) {
    if (this.players.length >= this.maxPlayers) {
      throw new Error('Room is full');
    }

    const player = {
      id: playerId,
      name: playerName,
      ready: true // Игрок автоматически готов при присоединении
    };

    this.players.push(player);
    this.scores[playerId] = 0;
    this.moves[playerId] = 0;

    // Check if we can start the game
    if (this.players.length >= this.maxPlayers && this.status === 'waiting') {
      console.log(`[MEMORY] Starting game with ${this.players.length} players`);
      this.startGame();
    }

    return this.getGameState();
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    delete this.scores[playerId];
    delete this.moves[playerId];

    if (this.players.length === 0) {
      this.status = 'finished';
    }

    return this.getGameState();
  }

  setPlayerReady(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.ready = true;
      
      // Check if we can start the game
      if (this.players.length >= this.maxPlayers && 
          this.status === 'waiting' && 
          this.players.every(p => p.ready)) {
        this.startGame();
      }
    }
    return this.getGameState();
  }

  startGame() {
    console.log(`[MEMORY] startGame called with ${this.players.length} players`);
    console.log(`[MEMORY] Players ready status:`, this.players.map(p => ({ id: p.id, ready: p.ready })));
    
    if (this.players.length < this.maxPlayers) {
      throw new Error(`Need ${this.maxPlayers} players to start`);
    }

    // Check if all players are ready
    if (!this.players.every(p => p.ready)) {
      console.log(`[MEMORY] Not all players ready, cannot start`);
      throw new Error('Not all players are ready');
    }

    console.log(`[MEMORY] Starting game!`);
    this.status = 'in_progress';
    this.gameStartTime = Date.now();
    this.currentPlayerIndex = 0;
    this.flippedCards = [];
    this.matchedPairs = [];
    this.pendingFlipBack = false;
    this.initializeCards();

    return this.getGameState();
  }

  flipCard(playerId, cardId) {
    try {
      if (this.status !== 'in_progress') {
        throw new Error('Game is not in progress');
      }

      const currentPlayer = this.players[this.currentPlayerIndex];
      if (currentPlayer.id !== playerId) {
        throw new Error('Not your turn');
      }

      // Проверяем, что у игрока уже не открыто 2 карточки
      if (this.flippedCards.length >= 2) {
        throw new Error('Already have 2 cards flipped');
      }

      const card = this.cards.find(c => c.id === cardId);
      if (!card || card.isMatched || card.isFlipped) {
        throw new Error('Invalid card action');
      }

      // Flip the card
      card.isFlipped = true;
      this.flippedCards.push(card);

      // Check if we have two cards flipped
      if (this.flippedCards.length === 2) {
        this.moves[playerId]++;
        
        const [card1, card2] = this.flippedCards;
        
        if (card1.value === card2.value) {
          // Match found!
          card1.isMatched = true;
          card2.isMatched = true;
          this.matchedPairs.push(card1.value);
          this.scores[playerId] += 10;
          
          // Check if game is finished
          if (this.matchedPairs.length === this.cards.length / 2) {
            this.endGame();
          }
          
          // Clear flipped cards for match and continue turn
          this.flippedCards = [];
          // Игрок продолжает ход при совпадении
        } else {
          // No match - сразу переворачиваем карточки и меняем ход
          card1.isFlipped = false;
          card2.isFlipped = false;
          this.flippedCards = [];
          this.nextTurn();
        }
      }

      this.notifyStateChange();
      return this.getGameState();
    } catch (error) {
      console.error(`[MEMORY] Error in flipCard:`, error.message);
      throw error;
    }
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    console.log(`[MEMORY] Turn changed to player ${this.players[this.currentPlayerIndex]?.name} (${this.players[this.currentPlayerIndex]?.id})`);
  }

  endGame() {
    this.status = 'finished';
    
    // Determine winner
    const playerScores = Object.entries(this.scores).map(([id, score]) => ({
      id,
      score,
      moves: this.moves[id] || 0
    }));
    
    // Sort by score (higher is better), then by moves (lower is better)
    playerScores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.moves - b.moves;
    });
    
    this.winner = playerScores[0];
    
    this.notifyStateChange();
  }

  getGameState() {
    try {
      return {
        roomId: this.roomId,
        gameType: this.gameType,
        status: this.status,
        players: this.players,
        currentPlayerId: this.players[this.currentPlayerIndex]?.id,
        currentPlayerIndex: this.currentPlayerIndex,
        cards: this.cards.map(card => ({
          id: card.id,
          value: card.isFlipped || card.isMatched ? card.value : '?',
          isFlipped: card.isFlipped,
          isMatched: card.isMatched,
          position: card.position
        })),
        flippedCards: this.flippedCards.map(card => card.id),
        matchedPairs: this.matchedPairs,
        scores: this.scores,
        moves: this.moves,
        winner: this.winner,
        difficulty: this.difficulty,
        gameStartTime: this.gameStartTime,
        totalPairs: this.cards.length / 2
      };
    } catch (error) {
      console.error(`[MEMORY] Error in getGameState:`, error.message);
      return {
        roomId: this.roomId,
        gameType: this.gameType,
        status: 'error',
        error: error.message
      };
    }
  }

  notifyStateChange() {
    try {
      if (this.onStateChange) {
        this.onStateChange(this.getGameState());
      }
    } catch (error) {
      console.error(`[MEMORY] Error in notifyStateChange:`, error.message);
    }
  }

  cleanup() {
    // Cleanup resources if needed
    this.pendingFlipBack = false;
  }
}

module.exports = MemoryGame;

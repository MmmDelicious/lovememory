const Hand = require('pokersolver').Hand;

const STAGES = {
  PRE_FLOP: 'pre-flop',
  FLOP: 'flop',
  TURN: 'turn',
  RIVER: 'river',
  SHOWDOWN: 'showdown',
};

const ACTIONS = {
  BET: 'bet',
  CALL: 'call',
  RAISE: 'raise',
  CHECK: 'check',
  FOLD: 'fold',
  MUCK: 'muck',
  SHOW: 'show',
};

class PokerGame {
  constructor(playersInfo, blinds = { small: 5, big: 10 }, options = {}) {
    this.gameType = 'poker';
    this.onStateChange = options.onStateChange || null;
    this.onGameStart = options.onGameStart || null;
    
    if (!playersInfo || playersInfo.length === 0) {
      throw new Error("Player information is required to start a poker game.");
    }

    // Создаем игроков без buy-in (они сделают его потом)
    this.players = playersInfo.map(p => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      stack: 0, // Стек будет установлен после buy-in
      hand: [],
      currentBet: 0,
      inHand: false,
      hasActed: false,
      isWaitingToPlay: true,
      isAllIn: false,
      hasBoughtIn: false,
      showCards: false,
    }));
    
    this.blinds = blinds;
    this.dealerPosition = -1;
    this.status = 'waiting'; // Ждем buy-in от игроков
    this.lastRaiser = null;
    this.lastRaiseAmount = 0;
    this.turnTimeout = null;
    this.turnTimeLimit = 30000;
    this.pot = 0;
    this.communityCards = [];
    this.stage = STAGES.PRE_FLOP;
    this.currentPlayerIndex = 0;
    this.lastAction = null;
    this.winnersInfo = null;
    this.deck = [];
    this.sidePots = [];
    this.showdownPhase = false;
    this.playersToShow = new Set();
    this.showdownOrder = null;
    this.currentShowdownIndex = 0;
    this.showdownResults = new Map();
    this.showdownTimeout = null;
    
    // Не запускаем раздачу сразу - ждем buy-in
    console.log('[PokerGame] Game created, waiting for player buy-ins');
  }

  addPlayer(playerInfo) {
    if (this.players.find(p => p.id === playerInfo.id)) {
      console.warn(`[PokerGame] Player ${playerInfo.name} is already in the game.`);
      return;
    }
    console.log(`[PokerGame] Adding new player ${playerInfo.name}.`);
    this.players.push({
      id: playerInfo.id,
      name: playerInfo.name,
      gender: playerInfo.gender,
      stack: 0, // Стек будет установлен после buy-in
      hand: [],
      currentBet: 0,
      inHand: false,
      hasActed: false,
      isWaitingToPlay: true,
      isAllIn: false,
      hasBoughtIn: false,
      showCards: false,
    });
  }

  // Новый метод для обработки buy-in
  playerBuyIn(playerId, buyInAmount) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      console.error(`[PokerGame] Player ${playerId} not found for buy-in`);
      return false;
    }
    
    player.stack = buyInAmount;
    player.hasBoughtIn = true;
    
    // Анти-абуз: если игра уже идет, игрок должен внести блайнд сразу
    if (this.status === 'in_progress') {
      player.isWaitingToPlay = true; // Ждет следующей раздачи
      // Взимаем принудительный блайнд для защиты от подглядывания
      const forcedBlind = Math.min(this.blinds.big, player.stack);
      player.stack -= forcedBlind;
      this.pot += forcedBlind;
      console.log(`[PokerGame] Anti-abuse: ${player.name} paid forced blind ${forcedBlind}`);
    }
    
    console.log(`[PokerGame] Player ${player.name} bought in for ${buyInAmount}`);
    
    // Если достаточно игроков и игра не идет, можем начать
    const readyPlayers = this.players.filter(p => p.hasBoughtIn && p.stack > 0);
    console.log(`[PokerGame] Ready players: ${readyPlayers.length}, Game status: ${this.status}`);
    console.log(`[PokerGame] All players:`, this.players.map(p => ({ name: p.name, hasBoughtIn: p.hasBoughtIn, stack: p.stack })));
    
    if (readyPlayers.length >= 2 && this.status === 'waiting') {
      console.log(`[PokerGame] Starting game with ${readyPlayers.length} players`);
      this.startNewHand();
      
      // Уведомляем о начале игры для обновления статуса комнаты
      if (this.onGameStart) {
        console.log(`[PokerGame] Calling onGameStart callback`);
        this.onGameStart();
      } else {
        console.log(`[PokerGame] No onGameStart callback available`);
      }
    } else {
      console.log(`[PokerGame] Not starting game: readyPlayers=${readyPlayers.length}, status=${this.status}`);
    }
    
    return true;
  }

  startNewHand() {
    console.log('[PokerGame] ===== STARTING NEW HAND =====');
    this._clearTurnTimeout(); // Очищаем таймаут при начале новой раздачи
    
    console.log('[PokerGame] Players before new hand setup:', this.players.map(p => 
      `${p.name}: stack=${p.stack}, hasBoughtIn=${p.hasBoughtIn}, isWaiting=${p.isWaitingToPlay}`
    ));
    
    // Сбрасываем showdown состояние
    this.showdownPhase = false;
    this.playersToShow.clear();
    this.showdownOrder = null;
    this.currentShowdownIndex = 0;
    this.showdownResults = new Map();
    this._clearShowdownTimeout();
    
    this.players.forEach(p => {
      if (p.isWaitingToPlay && p.hasBoughtIn) {
        p.isWaitingToPlay = false;
        console.log(`[PokerGame] Player ${p.name} no longer waiting to play`);
      }
      p.hand = [];
      p.currentBet = 0;
      // Игрок участвует только если у него есть buy-in и стек > 0
      p.inHand = p.hasBoughtIn && p.stack > 0 && !p.isWaitingToPlay;
      p.hasActed = false;
      p.isAllIn = false;
      p.showCards = false;
    });

    const activePlayers = this.players.filter(p => p.inHand);
    console.log(`[PokerGame] Active players for new hand: ${activePlayers.length}`, 
      activePlayers.map(p => `${p.name}(${p.stack})`));
        
    if (activePlayers.length < 2) {
      console.log('[PokerGame] Not enough active players to start a new hand.');
      // Если остался только 1 игрок, он выигрывает весь банк
      if (activePlayers.length === 1) {
        const winner = activePlayers[0];
        const remainingPot = this.pot;
        winner.stack += remainingPot;
        this.pot = 0;
        console.log(`[PokerGame] ${winner.name} wins the remaining pot: ${remainingPot}, new stack: ${winner.stack}`);
      }
      this.status = 'waiting'; // Возвращаемся в ожидание новых игроков
      console.log('[PokerGame] Game status set to waiting for more players');
      return;
    }

    console.log('[PokerGame] Starting new hand with sufficient players');
    this.status = 'in_progress';
    this.winnersInfo = null;
    this.deck = this._createDeck();
    this._shuffleDeck();
    
    this.communityCards = [];
    this.pot = 0;
    this.sidePots = [];
    this.stage = STAGES.PRE_FLOP;
    
    // Находим следующего активного дилера
    this.dealerPosition = (this.dealerPosition + 1) % this.players.length;
    
    // Убеждаемся, что дилер - активный игрок
    while (!this.players[this.dealerPosition].inHand) {
      this.dealerPosition = (this.dealerPosition + 1) % this.players.length;
    }
    
    console.log(`[PokerGame] New dealer position: ${this.dealerPosition} (${this.players[this.dealerPosition].name})`);
    
    this.currentPlayerIndex = 0;
    this.lastAction = null;
    this.lastRaiser = null;
    this.lastRaiseAmount = 0; // Сбрасываем сумму последнего рейза
    
    this._dealCards();
    this._postBlindsAndStartBetting();
    this._setTurnTimeout(); // Устанавливаем таймаут для первого игрока
    
    console.log('[PokerGame] ===== NEW HAND STARTED SUCCESSFULLY =====');
  }

  makeMove(playerId, move) {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) throw new Error("Player not found.");
    
    const player = this.players[playerIndex];
    const { action, value } = move;

    // Обрабатываем muck/show действия в showdown фазе
    if (this.showdownPhase && (action === ACTIONS.MUCK || action === ACTIONS.SHOW)) {
      return this._handleShowdownAction(player, action);
    }

    if (playerIndex !== this.currentPlayerIndex) throw new Error("Not your turn.");
    if (!player.inHand) throw new Error("Player is not in hand.");
    
    const allowed = this._getAllowedActions(player);

    if (!allowed.actions.includes(action)) throw new Error(`Action ${action} is not allowed.`);

    // Валидация значения для рейза
    if (action === ACTIONS.RAISE) {
      if (value < allowed.minRaise || value > allowed.maxRaise) {
        throw new Error(`Raise amount ${value} is out of range [${allowed.minRaise}, ${allowed.maxRaise}].`);
      }
      // Проверяем, что у игрока достаточно фишек
      const requiredAmount = value - player.currentBet;
      if (requiredAmount > player.stack) {
        throw new Error(`Insufficient chips for raise. Required: ${requiredAmount}, Available: ${player.stack}`);
      }
    }

    // Очищаем таймаут при успешном ходе
    this._clearTurnTimeout();

    switch (action) {
      case ACTIONS.FOLD:
        player.inHand = false;
        break;
      case ACTIONS.CHECK:
        break;
      case ACTIONS.CALL:
        this._postBet(player, allowed.callAmount);
        break;
      case ACTIONS.RAISE: {
        // value — это новая итоговая ставка игрока (total), а не приращение
        const maxBetBefore = Math.max(...this.players.map(p => p.currentBet));
        const raiseAmount = value - player.currentBet;
        this._postBet(player, raiseAmount);
        this.lastRaiser = player;
        // Сохраняем размер последнего рейза (delta относительно предыдущего максимума)
        this.lastRaiseAmount = Math.max(0, value - maxBetBefore);
        this._resetActionFlags(player.id);
        break;
      }
      case ACTIONS.BET: {
        const maxBetBefore = Math.max(...this.players.map(p => p.currentBet));
        this._postBet(player, value);
        this.lastRaiser = player;
        // Для первой ставки размер "рейза" равен новой ставке минус предыдущий максимум (обычно 0)
        this.lastRaiseAmount = Math.max(0, player.currentBet - maxBetBefore);
        this._resetActionFlags(player.id);
        break;
      }
    }

    player.hasActed = true;
    this.lastAction = action;
    this._advanceTurn();
  }

  _handleShowdownAction(player, action) {
    // Проверяем, что это правильный игрок
    if (this.currentShowdownIndex >= this.showdownOrder.length || 
        this.showdownOrder[this.currentShowdownIndex].id !== player.id) {
      throw new Error("Not your turn to show/muck");
    }

    this._clearShowdownTimeout();

    if (action === ACTIONS.SHOW) {
      player.showCards = true;
      this.showdownResults.set(player.id, 'show');
      console.log(`[PokerGame] Player ${player.name} chose to show cards`);
    } else if (action === ACTIONS.MUCK) {
      player.showCards = false;
      this.showdownResults.set(player.id, 'muck');
      console.log(`[PokerGame] Player ${player.name} chose to muck cards`);
    }

    this.playersToShow.clear();
    this.currentShowdownIndex++;
    
    // Переходим к следующему игроку
    setTimeout(() => {
      this._showNextPlayerCards();
    }, 1000); // 1 секунда задержки для анимации
  }

  _determineShowdownOrder(activePlayers) {
    // Сначала определяем агрессора (кто делал последний рейз)
    let aggressor = this.lastRaiser;
    
    // Если нет агрессора (все только коллировали), начинаем с игрока слева от дилера
    if (!aggressor || !activePlayers.find(p => p.id === aggressor.id)) {
      const dealerIndex = this.players.findIndex(p => p === this.players[this.dealerPosition]);
      let nextIndex = this._getPlayerAfterIndex(dealerIndex);
      aggressor = this.players[nextIndex];
    }
    
    // Располагаем игроков в порядке: агрессор первый, затем остальные по часовой стрелке
    const aggressorIndex = activePlayers.findIndex(p => p.id === aggressor.id);
    const ordered = [
      ...activePlayers.slice(aggressorIndex),
      ...activePlayers.slice(0, aggressorIndex)
    ];
    
    console.log(`[PokerGame] Showdown order: aggressor=${aggressor.name}, order=${ordered.map(p => p.name)}`);
    return ordered;
  }

  _showNextPlayerCards() {
    if (this.currentShowdownIndex >= this.showdownOrder.length) {
      this._finalizeShowdown();
      return;
    }
    
    const currentPlayer = this.showdownOrder[this.currentShowdownIndex];
    
    if (this.currentShowdownIndex === 0) {
      // Первый игрок (агрессор) автоматически показывает карты
      currentPlayer.showCards = true;
      this.showdownResults.set(currentPlayer.id, 'show');
      console.log(`[PokerGame] Aggressor ${currentPlayer.name} automatically shows cards`);
      
      this.currentShowdownIndex++;
      setTimeout(() => {
        this._showNextPlayerCards();
      }, 2000); // 2 секунды на показ карт агрессора
    } else {
      // Остальные игроки выбирают
      this.playersToShow.clear();
      this.playersToShow.add(currentPlayer.id);
      console.log(`[PokerGame] Player ${currentPlayer.name} must decide: show or muck`);
      
      // Уведомляем об изменении состояния
      if (this.onStateChange) {
        this.onStateChange(this);
      }
    }
  }

  _setShowdownTimeout() {
    this.showdownTimeout = setTimeout(() => {
      this._handleShowdownTimeout();
    }, 15000); // 15 секунд на решение
  }

  _clearShowdownTimeout() {
    if (this.showdownTimeout) {
      clearTimeout(this.showdownTimeout);
      this.showdownTimeout = null;
    }
  }

  _handleShowdownTimeout() {
    if (!this.showdownPhase || this.currentShowdownIndex >= this.showdownOrder.length) return;
    
    const currentPlayer = this.showdownOrder[this.currentShowdownIndex];
    console.log(`[PokerGame] Showdown timeout - auto-muck for ${currentPlayer.name}`);
    
    // Автоматически muck карты
    currentPlayer.showCards = false;
    this.showdownResults.set(currentPlayer.id, 'muck');
    this.playersToShow.clear();
    
    this.currentShowdownIndex++;
    this._showNextPlayerCards();
  }

  _finalizeShowdown() {
    console.log('[PokerGame] Finalizing showdown phase');
    this._clearShowdownTimeout();
    this.showdownPhase = false;
    
    // Очищаем состояние showdown
    this.showdownOrder = null;
    this.currentShowdownIndex = 0;
    this.playersToShow.clear();
    
    console.log('[PokerGame] Showdown results:', Array.from(this.showdownResults.entries()));
    
    // Завершаем раздачу и показываем результаты
    this._endHand();
  }

  handlePlayerLeave(playerId) {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    const player = this.players[playerIndex];
    if (player.inHand) player.inHand = false;
    if (this.status === 'in_progress' && this.getCurrentPlayer()?.id === playerId) {
      this._advanceTurn();
    } else if (this.players.filter(p => p.inHand).length <= 1) {
      this._endHand();
    }
  }

  removePlayer(playerId) {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index === -1) return;
    
    if (this.dealerPosition > index) this.dealerPosition--;
    else if (this.dealerPosition === index) this.dealerPosition = (this.dealerPosition - 1 + this.players.length) % this.players.length;
    
    if (this.currentPlayerIndex > index) this.currentPlayerIndex--;
    else if (this.currentPlayerIndex === index) {
      this.currentPlayerIndex = index % (this.players.length - 1);
      if (this.currentPlayerIndex >= this.players.length - 1) this.currentPlayerIndex = 0;
    }

    this.players.splice(index, 1);
    if (this.players.length < 2 && this.status === 'in_progress') this._endHand();
  }

  _advanceTurn() {
    console.log(`[PokerGame] _advanceTurn called. Current index: ${this.currentPlayerIndex}, active players: ${this.players.filter(p => p.inHand).length}`);
    
    if (this.players.filter(p => p.inHand).length <= 1) {
      console.log(`[PokerGame] Only 1 or fewer active players, ending hand`);
      return this._endHand();
    }
    
    const activePlayers = this.players.filter(p => p.inHand);
    if (activePlayers.every(p => p.hasActed)) {
      // Если у всех равные ставки и никто не рейзил — завершаем раунд
      const maxBet = Math.max(...this.players.map(p => p.currentBet));
      const allMatched = activePlayers.every(p => p.currentBet === maxBet);
      if (allMatched) {
        console.log(`[PokerGame] All active players matched bets, ending betting round`);
        return this._endBettingRound();
      }
    }
    
    const oldIndex = this.currentPlayerIndex;
    this.currentPlayerIndex = this._getPlayerAfterIndex(this.currentPlayerIndex);
    console.log(`[PokerGame] Advanced turn from index ${oldIndex} to ${this.currentPlayerIndex}`);
    
    // Устанавливаем таймаут для текущего игрока
    this._setTurnTimeout();
  }

  _setTurnTimeout() {
    // Очищаем предыдущий таймаут
    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout);
    }
    
    // Устанавливаем новый таймаут
    this.turnTimeout = setTimeout(() => {
      this._handleTurnTimeout();
    }, this.turnTimeLimit);
  }

  _handleTurnTimeout() {
    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer && currentPlayer.inHand) {
      console.log(`[PokerGame] Player ${currentPlayer.name} timed out`);

      // Выбираем безопасное действие по таймауту:
      // если доступен CHECK — делаем check, иначе — fold
      const allowed = this._getAllowedActions(currentPlayer);
      if (allowed.actions.includes('check')) {
        try {
          // Вместо рекурсивного вызова makeMove, выполняем действие напрямую
          currentPlayer.hasActed = true;
          this.lastAction = 'check';
          console.log(`[PokerGame] Auto-check for ${currentPlayer.name}`);
          this._advanceTurn();
        } catch (e) {
          console.warn('[PokerGame] Auto-check failed, falling back to fold:', e);
          currentPlayer.inHand = false;
          currentPlayer.hasActed = true;
          console.log(`[PokerGame] Auto-fold for ${currentPlayer.name}`);
          this._advanceTurn();
        }
      } else {
        try {
          // Вместо рекурсивного вызова makeMove, выполняем действие напрямую
          currentPlayer.inHand = false;
          currentPlayer.hasActed = true;
          this.lastAction = 'fold';
          console.log(`[PokerGame] Auto-fold for ${currentPlayer.name}`);
          this._advanceTurn();
        } catch (e) {
          console.warn('[PokerGame] Auto-fold failed:', e);
          currentPlayer.inHand = false;
          currentPlayer.hasActed = true;
          this._advanceTurn();
        }
      }

      // Уведомляем слушателей об изменении состояния (для рассылки клиентам)
      if (this.onStateChange) {
        try { 
          this.onStateChange(this); 
        } catch (e) { 
          console.warn('[PokerGame] onStateChange handler error:', e); 
        }
      }
    }
  }

  _clearTurnTimeout() {
    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout);
      this.turnTimeout = null;
    }
  }
  
  _endBettingRound() {
    this._clearTurnTimeout(); // Очищаем таймаут
    this._collectBets();
    if (this.players.filter(p => p.inHand).length <= 1) return this._endHand();
    
    if (this.stage === STAGES.RIVER) {
      this.stage = STAGES.SHOWDOWN;
      return this._startShowdown();
    }
    
    this.stage = this.stage === STAGES.PRE_FLOP ? STAGES.FLOP : 
                this.stage === STAGES.FLOP ? STAGES.TURN : STAGES.RIVER;
    
    if (this.stage === STAGES.FLOP) this._dealCommunityCards(3);
    else this._dealCommunityCards(1);
    
    this.lastRaiser = null;
    this.lastRaiseAmount = 0; // Сбрасываем сумму рейза
    this.players.forEach(p => { 
      if (p.inHand) p.hasActed = false; 
    });
    
    // Начинаем с игрока после дилера
    this.currentPlayerIndex = this._getPlayerAfterIndex(this.dealerPosition);
    this._setTurnTimeout(); // Устанавливаем таймаут для нового раунда
  }

  _startShowdown() {
    console.log('[PokerGame] Starting showdown phase');
    this.showdownPhase = true;
    
    const activePlayers = this.players.filter(p => p.inHand);
    
    // Если только один игрок, он автоматически выигрывает
    if (activePlayers.length === 1) {
      this._endHand();
      return;
    }

    // Определяем порядок вскрытия карт
    this.showdownOrder = this._determineShowdownOrder(activePlayers);
    this.currentShowdownIndex = 0;
    this.showdownResults = new Map(); // Результаты вскрытия каждого игрока
    
    console.log('[PokerGame] Showdown order:', this.showdownOrder.map(p => p.name));
    
    // Первый игрок (агрессор) автоматически показывает карты
    this._showNextPlayerCards();
    
    // Устанавливаем timeout для каждого игрока (15 секунд)
    this._setShowdownTimeout();
    
    // Уведомляем об изменении состояния
    if (this.onStateChange) {
      this.onStateChange(this);
    }
  }

  _endHand() {
    console.log('[PokerGame] ===== ENDING HAND =====');
    this._clearTurnTimeout(); // Очищаем таймаут
    this._collectBets();
    
    console.log(`[PokerGame] Pot before determining winners: ${this.pot}`);
    console.log('[PokerGame] Players in hand:', this.players.filter(p => p.inHand).map(p => 
      `${p.name}: stack=${p.stack}, currentBet=${p.currentBet}`
    ));
    
    const winnersInfo = this._determineWinners();
    console.log('[PokerGame] Winners determined:', winnersInfo.map(w => 
      `${w.player.name}: ${w.handName}, pot=${w.pot}`
    ));
    
    this._awardPot(winnersInfo);
    
    console.log('[PokerGame] Final stacks after pot award:', this.players.map(p => 
      `${p.name}: ${p.stack}`
    ));
    
    this.status = 'finished';
    this.winnersInfo = winnersInfo;
    console.log('[PokerGame] ===== HAND ENDED =====');
    
    // Автоматически начинаем следующую раздачу через 5 секунд
    setTimeout(() => {
      this._startNextHandIfPossible();
    }, 5000);
  }

  _determineWinners() {
    const contenders = this.players.filter(p => p.inHand);
    if (contenders.length === 1) {
      return [{ 
        player: contenders[0], 
        handName: "the pot", 
        handCards: contenders[0].hand, 
        pot: this.pot 
      }];
    }
    
    // Только игроки, которые показали карты, участвуют в определении победителя
    const showingPlayers = contenders.filter(p => p.showCards === true);
    
    if (showingPlayers.length === 0) {
      // Если никто не показал карты, банк делится поровну
      return contenders.map(p => ({
        player: p,
        handName: "split pot",
        handCards: [],
        pot: this.pot / contenders.length
      }));
    }
    
    const hands = showingPlayers.map(p => {
      const toSolver = (c) => `${c.rank}${c.suit.toLowerCase()}`.replace('T', '10');
      const cardStrings = p.hand.map(toSolver)
        .concat(this.communityCards.map(toSolver));
      const solvedHand = Hand.solve(cardStrings);
      solvedHand.player = p;
      return solvedHand;
    });
    
    const winningHands = Hand.winners(hands);
    return winningHands.map(h => ({ 
      player: this.players.find(p => p.id === h.player.id), 
      handName: h.name, 
      handCards: h.cards.map(c => ({ 
        rank: c.value === '10' ? 'T' : String(c.value).toUpperCase(), 
        suit: String(c.suit).toUpperCase() 
      })), 
      pot: this.pot / winningHands.length 
    }));
  }

  _awardPot(winners) { 
    // Автоматически показываем карты всех победителей
    winners.forEach(winnerInfo => {
      const player = this.players.find(p => p.id === winnerInfo.player.id);
      if (player) {
        player.showCards = true;
        console.log(`[PokerGame] Auto-showing cards for winner: ${player.name}`);
      }
    });

    // Сначала распределяем side pots
    this.sidePots.forEach(sidePot => {
      const eligibleWinners = winners.filter(w => 
        sidePot.eligiblePlayers.includes(w.player.id)
      );
      
      if (eligibleWinners.length > 0) {
        const amountPerWinner = sidePot.amount / eligibleWinners.length;
        eligibleWinners.forEach(winner => {
          const player = this.players.find(p => p.id === winner.player.id);
          if (player) player.stack += amountPerWinner;
        });
      }
    });

    // Затем распределяем основной пот
    if (this.pot > 0) {
      winners.forEach(info => { 
        const p = this.players.find(p => p.id === info.player.id); 
        if (p) p.stack += info.pot; 
      }); 
    }
  }
  
  _collectBets() { 
    // Создаем side pots при алл-ине
    this._createSidePots();
    
    this.players.forEach(p => { 
      this.pot += p.currentBet; 
      p.currentBet = 0; 
    }); 
  }

  _createSidePots() {
    // Очищаем старые side pots перед созданием новых
    this.sidePots = [];

    const activePlayers = this.players.filter(p => p.inHand);
    if (activePlayers.length <= 1) return;

    // Проверяем, есть ли алл-ин
    const allInPlayers = activePlayers.filter(p => p.isAllIn);
    if (allInPlayers.length === 0) return;

    // Получаем уникальные уровни ставок и сортируем их
    const betLevels = [...new Set(activePlayers.map(p => p.currentBet))].sort((a, b) => a - b);

    // Создаем side pots для каждого уровня ставок
    for (let i = 0; i < betLevels.length; i++) {
      const currentLevel = betLevels[i];
      const prevLevel = i > 0 ? betLevels[i - 1] : 0;
      const levelDiff = currentLevel - prevLevel;

      if (levelDiff > 0) {
        // Игроки, которые могут претендовать на этот side pot
        const eligiblePlayers = activePlayers.filter(p => p.currentBet >= currentLevel);
        const sidePotAmount = levelDiff * eligiblePlayers.length;

        this.sidePots.push({
          amount: sidePotAmount,
          eligiblePlayers: eligiblePlayers.map(p => p.id)
        });
      }
    }

    console.log(`[PokerGame] Created ${this.sidePots.length} side pots:`, this.sidePots);
  }
  
  _postBlindsAndStartBetting() {
    const smallBlindIndex = this._getPlayerAfterIndex(this.dealerPosition, false);
    const bigBlindIndex = this._getPlayerAfterIndex(smallBlindIndex, false);
    const smallBlindPlayer = this.players[smallBlindIndex];
    const bigBlindPlayer = this.players[bigBlindIndex];
    
    this._postBet(smallBlindPlayer, this.blinds.small);
    this._postBet(bigBlindPlayer, this.blinds.big);
    
    this.pot = this.players.reduce((total, p) => total + p.currentBet, 0);
    this.lastRaiser = bigBlindPlayer;
    this.lastRaiseAmount = this.blinds.big; // Устанавливаем сумму рейза как большой блайнд
    
    // Начинаем с игрока после большого блайнда
    this.currentPlayerIndex = this._getPlayerAfterIndex(bigBlindIndex);
  }

  _postBet(player, amount) {
    const actualAmount = Math.min(amount, player.stack);
    player.stack -= actualAmount;
    player.currentBet += actualAmount;
    
    // Проверяем алл-ин
    if (player.stack === 0 && actualAmount > 0) {
      player.isAllIn = true;
    }
  }

  _resetActionFlags(excludePlayerId) {
    this.players.forEach(p => {
      if (p.id !== excludePlayerId && p.inHand) {
        p.hasActed = false;
      }
    });
  }

  _dealCards() { 
    this.players.forEach(p => { 
      if (p.inHand) p.hand = [this.deck.pop(), this.deck.pop()]; 
    }); 
  }
  
  _dealCommunityCards(count) { 
    for(let i = 0; i < count; i++) this.communityCards.push(this.deck.pop()); 
  }
  
  _createDeck() { 
    const suits = 'HDCS';
    const ranks = '23456789TJQKA'; 
    return ranks.split('').flatMap(rank => 
      suits.split('').map(suit => ({ rank, suit }))
    ); 
  }
  
  _shuffleDeck() { 
    for (let i = this.deck.length - 1; i > 0; i--) { 
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    } 
  }
  
  _getPlayerAfterIndex(startIndex, inHandOnly = true) {
    if (this.players.length === 0) return 0;
    let index = startIndex;
    let attempts = 0;
    const maxAttempts = this.players.length * 2;
    
    do {
      index = (index + 1) % this.players.length;
      const player = this.players[index];
      
      if (!player) {
        attempts++;
        continue;
      }
      
      if (inHandOnly && !player.inHand) {
        attempts++;
        continue;
      }
      
      // Нашли подходящего игрока
      return index;
    } while (attempts < maxAttempts);
    
    // Если не нашли подходящего игрока, возвращаем следующий индекс
    console.log(`[PokerGame] Warning: Could not find next player after index ${startIndex}, returning next index`);
    return (startIndex + 1) % this.players.length; 
  }

  _getAllowedActions(player) {
    if (!player || player.id !== this.players[this.currentPlayerIndex]?.id) return { actions: [], callAmount: 0, minRaise: 0, maxRaise: 0 };
    
    const maxBet = Math.max(...this.players.map(p => p.currentBet));
    const canRaise = player.stack > 0;
    let actions = [];
    
    if (maxBet > player.currentBet) {
      actions.push('fold', 'call'); 
      if (player.stack > maxBet - player.currentBet) actions.push('raise');
    } else {
      actions.push('check');
      if (canRaise) actions.push('raise');
    }
    
    const callAmount = Math.min(maxBet - player.currentBet, player.stack);
    
    // Минимальный total для рейза (новая итоговая ставка игрока)
    // Если был предыдущий рейз, минимальный размер повышения = размер предыдущего повышения
    // Итого: minRaiseTotal = maxBet + previousRaiseSize
    const previousRaiseSize = this.lastRaiseAmount > 0 ? this.lastRaiseAmount : this.blinds.big;
    let minRaise = maxBet + previousRaiseSize;
    // Минимальный total должен быть строго больше текущей ставки игрока
    minRaise = Math.max(minRaise, player.currentBet + 1);
    // Максимальный total = стек игрока + его текущая ставка
    const maxRaise = player.stack + player.currentBet;
    
    return { 
      actions, 
      callAmount, 
      minRaise, 
      maxRaise
    };
  }

  getStateForPlayer(playerId) {
    const state = this.getState();
    const player = this.players.find(p => p.id === playerId);
    const hasPlayerBoughtIn = player && player.hasBoughtIn;
    
    let visibleHands = [];
    if (state.stage === STAGES.SHOWDOWN || state.status === 'finished') {
      visibleHands = this.players
        .filter(p => (p.inHand && p.showCards === true) || (this.winnersInfo && this.winnersInfo.some(w => w.player.id === p.id)))
        .map(p => ({ playerId: p.id, hand: p.hand }));
    }

    // Получаем разрешенные действия для текущего игрока
    let allowedActions = { actions: [], minRaise: 0, maxRaise: 0, callAmount: 0 };
    
    if (this.showdownPhase && player && this.playersToShow.has(player.id) && 
        this.showdownOrder && this.currentShowdownIndex < this.showdownOrder.length &&
        this.showdownOrder[this.currentShowdownIndex].id === player.id) {
      // В фазе showdown игрок может выбрать muck или show (только если его очередь)
      allowedActions = { actions: ['muck', 'show'], minRaise: 0, maxRaise: 0, callAmount: 0 };
    } else if (this.getCurrentPlayer()?.id === playerId && hasPlayerBoughtIn && !player?.isWaitingToPlay && !this.showdownPhase) {
      allowedActions = this._getAllowedActions(player);
    }

    // Скрываем карты и некоторую информацию для игроков без buy-in
    const shouldHideCards = !hasPlayerBoughtIn;

    return {
      ...state,
      // Скрываем карты игрока если он не сделал buy-in
      yourHand: shouldHideCards ? [] : (player ? player.hand : []),
      yourStack: player ? player.stack : 0,
      yourCurrentBet: player ? player.currentBet : 0,
      isObserving: player ? (player.isWaitingToPlay || !player.hasBoughtIn) : true,
      canMakeAction: (this.getCurrentPlayer()?.id === playerId && hasPlayerBoughtIn && !player?.isWaitingToPlay) || 
                    (this.showdownPhase && player && this.playersToShow.has(player.id)),
      validActions: allowedActions.actions || [],
      minRaiseAmount: allowedActions.minRaise || 0,
      maxRaiseAmount: allowedActions.maxRaise || 0,
      callAmount: allowedActions.callAmount || 0,
      winningHandCards: this.winnersInfo ? this.winnersInfo.flatMap(w => w.handCards || []) : [],
      visibleHands: visibleHands,
      // Скрываем общие карты если игрок не сделал buy-in
      communityCards: shouldHideCards ? [] : state.communityCards,
      // Добавляем флаг для клиента
      needsBuyIn: !hasPlayerBoughtIn,
      hasBoughtIn: hasPlayerBoughtIn,
      showdownPhase: this.showdownPhase,
      playersToShow: Array.from(this.playersToShow),
      currentShowdownPlayer: this.showdownOrder && this.currentShowdownIndex < this.showdownOrder.length ? 
        this.showdownOrder[this.currentShowdownIndex].id : null,
      showdownOrder: this.showdownOrder ? this.showdownOrder.map(p => p.id) : null
    };
  }

  getState() {
    const winner = this.winnersInfo && this.winnersInfo.length > 0 ? 
      (this.winnersInfo.length === 1 ? this.winnersInfo[0].player.id : 'draw') : null;
    const currentPlayer = this.players[this.currentPlayerIndex];
    return {
      gameType: this.gameType,
      status: this.status,
      players: this.players.map(p => ({ 
        id: p.id, 
        name: p.name, 
        gender: p.gender, 
        stack: p.stack, 
        currentBet: p.currentBet, 
        inHand: p.inHand, 
        hasActed: p.hasActed, 
        isWaitingToPlay: p.isWaitingToPlay,
        isAllIn: p.isAllIn,
        hand: p.hand, // Добавляем карты игрока
        cards: p.hand, // Для совместимости с клиентом
        showCards: p.showCards
      })),
      currentPlayerId: this.status === 'in_progress' && currentPlayer ? currentPlayer.id : null,
      winner: winner,
      isDraw: this.winnersInfo ? this.winnersInfo.length > 1 : false,
      stage: this.stage,
      pot: this.pot,
      communityCards: this.communityCards || [],
      winnersInfo: this.winnersInfo,
      showdownPhase: this.showdownPhase
    };
  }

  getCurrentPlayer() { 
    return this.players[this.currentPlayerIndex] || null; 
  }
  
  getValidActions() { 
    const p = this.getCurrentPlayer(); 
    return p ? (this._getAllowedActions(p).actions || []) : []; 
  }
  
  _startNextHandIfPossible() {
    console.log('[PokerGame] Checking if next hand can be started...');
    
    // Убираем игроков с нулевым стеком
    this.players.forEach(p => {
      if (p.stack <= 0) {
        p.hasBoughtIn = false;
        p.isWaitingToPlay = true;
        console.log(`[PokerGame] Player ${p.name} eliminated (stack: ${p.stack})`);
      }
    });
    
    const activePlayers = this.players.filter(p => p.hasBoughtIn && p.stack > 0);
    console.log(`[PokerGame] Active players for next hand: ${activePlayers.length}`);
    
    if (activePlayers.length >= 2) {
      console.log('[PokerGame] Starting next hand...');
      this.startNewHand();
      
      // Уведомляем об изменении состояния
      if (this.onStateChange) {
        this.onStateChange(this);
      }
    } else {
      console.log('[PokerGame] Not enough players for next hand, waiting for buy-ins');
      this.status = 'waiting';
      
      // Уведомляем об изменении состояния
      if (this.onStateChange) {
        this.onStateChange(this);
      }
    }
  }

  cleanup() { 
    this._clearTurnTimeout(); // Очищаем таймаут при завершении игры
    this._clearShowdownTimeout(); // Очищаем showdown таймаут

    // Очищаем все ссылки для предотвращения утечек памяти
    this.players = [];
    this.deck = [];
    this.communityCards = [];
    this.sidePots = [];
    this.winnersInfo = null;
    this.onStateChange = null;
    this.showdownOrder = null;
    this.showdownResults = null;

    console.log(`[POKER] Game cleanup completed`); 
  }
}

module.exports = { PokerGame };

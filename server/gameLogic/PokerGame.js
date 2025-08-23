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
  }
  addPlayer(playerInfo) {
    if (this.players.find(p => p.id === playerInfo.id)) {
      return;
    }
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
  playerBuyIn(playerId, buyInAmount) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      console.error(`[PokerGame] Player ${playerId} not found for buy-in`);
      return false;
    }
    player.stack = buyInAmount;
    player.hasBoughtIn = true;
    if (this.status === 'in_progress') {
      player.isWaitingToPlay = true; // Ждет следующей раздачи
      const forcedBlind = Math.min(this.blinds.big, player.stack);
      player.stack -= forcedBlind;
      this.pot += forcedBlind;
    }
    const readyPlayers = this.players.filter(p => p.hasBoughtIn && p.stack > 0);
    if (readyPlayers.length >= 2 && this.status === 'waiting') {
      this.startNewHand();
      if (this.onGameStart) {
        this.onGameStart();
      }
    }
    return true;
  }
  startNewHand() {
    this._clearTurnTimeout(); // Очищаем таймаут при начале новой раздачи
    this.showdownPhase = false;
    this.playersToShow.clear();
    this.showdownOrder = null;
    this.currentShowdownIndex = 0;
    this.showdownResults = new Map();
    this._clearShowdownTimeout();
    this.players.forEach(p => {
      if (p.isWaitingToPlay && p.hasBoughtIn) {
        p.isWaitingToPlay = false;
      }
      p.hand = [];
      p.currentBet = 0;
      p.inHand = p.hasBoughtIn && p.stack > 0 && !p.isWaitingToPlay;
      p.hasActed = false;
      p.isAllIn = false;
      p.showCards = false;
    });
    const activePlayers = this.players.filter(p => p.inHand);
    if (activePlayers.length < 2) {
      if (activePlayers.length === 1) {
        const winner = activePlayers[0];
        const remainingPot = this.pot;
        winner.stack += remainingPot;
        this.pot = 0;
      }
      this.status = 'waiting'; // Возвращаемся в ожидание новых игроков
      return;
    }
    this.status = 'in_progress';
    this.winnersInfo = null;
    this.deck = this._createDeck();
    this._shuffleDeck();
    this.communityCards = [];
    this.pot = 0;
    this.sidePots = [];
    this.stage = STAGES.PRE_FLOP;
    this.dealerPosition = (this.dealerPosition + 1) % this.players.length;
    while (!this.players[this.dealerPosition].inHand) {
      this.dealerPosition = (this.dealerPosition + 1) % this.players.length;
    }
    this.currentPlayerIndex = 0;
    this.lastAction = null;
    this.lastRaiser = null;
    this.lastRaiseAmount = 0; // Сбрасываем сумму последнего рейза
    this._dealCards();
    this._postBlindsAndStartBetting();
    this._setTurnTimeout(); // Устанавливаем таймаут для первого игрока
  }
  makeMove(playerId, move) {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) throw new Error("Player not found.");
    const player = this.players[playerIndex];
    const { action, value } = move;
    if (this.showdownPhase && (action === ACTIONS.MUCK || action === ACTIONS.SHOW)) {
      return this._handleShowdownAction(player, action);
    }
    if (playerIndex !== this.currentPlayerIndex) throw new Error("Not your turn.");
    if (!player.inHand) throw new Error("Player is not in hand.");
    const allowed = this._getAllowedActions(player);
    if (!allowed.actions.includes(action)) throw new Error(`Action ${action} is not allowed.`);
    if (action === ACTIONS.RAISE) {
      if (value < allowed.minRaise || value > allowed.maxRaise) {
        throw new Error(`Raise amount ${value} is out of range [${allowed.minRaise}, ${allowed.maxRaise}].`);
      }
      const requiredAmount = value - player.currentBet;
      if (requiredAmount > player.stack) {
        throw new Error(`Insufficient chips for raise. Required: ${requiredAmount}, Available: ${player.stack}`);
      }
    }
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
        const maxBetBefore = Math.max(...this.players.map(p => p.currentBet));
        const raiseAmount = value - player.currentBet;
        this._postBet(player, raiseAmount);
        this.lastRaiser = player;
        this.lastRaiseAmount = Math.max(0, value - maxBetBefore);
        this._resetActionFlags(player.id);
        break;
      }
      case ACTIONS.BET: {
        const maxBetBefore = Math.max(...this.players.map(p => p.currentBet));
        this._postBet(player, value);
        this.lastRaiser = player;
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
    if (this.currentShowdownIndex >= this.showdownOrder.length || 
        this.showdownOrder[this.currentShowdownIndex].id !== player.id) {
      throw new Error("Not your turn to show/muck");
    }
    this._clearShowdownTimeout();
    if (action === ACTIONS.SHOW) {
      player.showCards = true;
      this.showdownResults.set(player.id, 'show');
    } else if (action === ACTIONS.MUCK) {
      player.showCards = false;
      this.showdownResults.set(player.id, 'muck');
    }
    this.playersToShow.clear();
    this.currentShowdownIndex++;
    setTimeout(() => {
      this._showNextPlayerCards();
    }, 1000); // 1 секунда задержки для анимации
  }
  _determineShowdownOrder(activePlayers) {
    let aggressor = this.lastRaiser;
    if (!aggressor || !activePlayers.find(p => p.id === aggressor.id)) {
      const dealerIndex = this.players.findIndex(p => p === this.players[this.dealerPosition]);
      let nextIndex = this._getPlayerAfterIndex(dealerIndex);
      aggressor = this.players[nextIndex];
    }
    const aggressorIndex = activePlayers.findIndex(p => p.id === aggressor.id);
    const ordered = [
      ...activePlayers.slice(aggressorIndex),
      ...activePlayers.slice(0, aggressorIndex)
    ];
    return ordered;
  }
  _showNextPlayerCards() {
    if (this.currentShowdownIndex >= this.showdownOrder.length) {
      this._finalizeShowdown();
      return;
    }
    const currentPlayer = this.showdownOrder[this.currentShowdownIndex];
    if (this.currentShowdownIndex === 0) {
      currentPlayer.showCards = true;
      this.showdownResults.set(currentPlayer.id, 'show');
      this.currentShowdownIndex++;
      setTimeout(() => {
        this._showNextPlayerCards();
      }, 2000); // 2 секунды на показ карт агрессора
    } else {
      this.playersToShow.clear();
      this.playersToShow.add(currentPlayer.id);
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
    currentPlayer.showCards = false;
    this.showdownResults.set(currentPlayer.id, 'muck');
    this.playersToShow.clear();
    this.currentShowdownIndex++;
    this._showNextPlayerCards();
  }
  _finalizeShowdown() {
    this._clearShowdownTimeout();
    this.showdownPhase = false;
    this.showdownOrder = null;
    this.currentShowdownIndex = 0;
    this.playersToShow.clear();
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
    if (this.players.filter(p => p.inHand).length <= 1) {
      return this._endHand();
    }
    const activePlayers = this.players.filter(p => p.inHand);
    if (activePlayers.every(p => p.hasActed)) {
      const maxBet = Math.max(...this.players.map(p => p.currentBet));
      const allMatched = activePlayers.every(p => p.currentBet === maxBet);
      if (allMatched) {
        return this._endBettingRound();
      }
    }
    const oldIndex = this.currentPlayerIndex;
    this.currentPlayerIndex = this._getPlayerAfterIndex(this.currentPlayerIndex);
    this._setTurnTimeout();
  }
  _setTurnTimeout() {
    if (this.turnTimeout) {
      clearTimeout(this.turnTimeout);
    }
    this.turnTimeout = setTimeout(() => {
      this._handleTurnTimeout();
    }, this.turnTimeLimit);
  }
  _handleTurnTimeout() {
    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer && currentPlayer.inHand) {
      const allowed = this._getAllowedActions(currentPlayer);
      if (allowed.actions.includes('check')) {
        try {
          currentPlayer.hasActed = true;
          this.lastAction = 'check';
          this._advanceTurn();
        } catch (e) {
          currentPlayer.inHand = false;
          currentPlayer.hasActed = true;
          this._advanceTurn();
        }
      } else {
        try {
          currentPlayer.inHand = false;
          currentPlayer.hasActed = true;
          this.lastAction = 'fold';
          this._advanceTurn();
        } catch (e) {
          currentPlayer.inHand = false;
          currentPlayer.hasActed = true;
          this._advanceTurn();
        }
      }
      if (this.onStateChange) {
        try { 
          this.onStateChange(this); 
        } catch (e) { 
          // Silent error handling
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
    this.currentPlayerIndex = this._getPlayerAfterIndex(this.dealerPosition);
    this._setTurnTimeout(); // Устанавливаем таймаут для нового раунда
  }
  _startShowdown() {
    this.showdownPhase = true;
    const activePlayers = this.players.filter(p => p.inHand);
    if (activePlayers.length === 1) {
      this._endHand();
      return;
    }
    this.showdownOrder = this._determineShowdownOrder(activePlayers);
    this.currentShowdownIndex = 0;
    this.showdownResults = new Map(); // Результаты вскрытия каждого игрока
    this._showNextPlayerCards();
    this._setShowdownTimeout();
    if (this.onStateChange) {
      this.onStateChange(this);
    }
  }
  _endHand() {
    this._clearTurnTimeout(); // Очищаем таймаут
    this._collectBets();
    const winnersInfo = this._determineWinners();
    this._awardPot(winnersInfo);
    this.status = 'finished';
    this.winnersInfo = winnersInfo;
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
    const showingPlayers = contenders.filter(p => p.showCards === true);
    if (showingPlayers.length === 0) {
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
    winners.forEach(winnerInfo => {
      const player = this.players.find(p => p.id === winnerInfo.player.id);
      if (player) {
        player.showCards = true;
      }
    });
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
    if (this.pot > 0) {
      winners.forEach(info => { 
        const p = this.players.find(p => p.id === info.player.id); 
        if (p) p.stack += info.pot; 
      }); 
    }
  }
  _collectBets() { 
    this._createSidePots();
    this.players.forEach(p => { 
      this.pot += p.currentBet; 
      p.currentBet = 0; 
    }); 
  }
  _createSidePots() {
    this.sidePots = [];
    const activePlayers = this.players.filter(p => p.inHand);
    if (activePlayers.length <= 1) return;
    const allInPlayers = activePlayers.filter(p => p.isAllIn);
    if (allInPlayers.length === 0) return;
    const betLevels = [...new Set(activePlayers.map(p => p.currentBet))].sort((a, b) => a - b);
    for (let i = 0; i < betLevels.length; i++) {
      const currentLevel = betLevels[i];
      const prevLevel = i > 0 ? betLevels[i - 1] : 0;
      const levelDiff = currentLevel - prevLevel;
      if (levelDiff > 0) {
        const eligiblePlayers = activePlayers.filter(p => p.currentBet >= currentLevel);
        const sidePotAmount = levelDiff * eligiblePlayers.length;
        this.sidePots.push({
          amount: sidePotAmount,
          eligiblePlayers: eligiblePlayers.map(p => p.id)
        });
      }
    }
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
    this.currentPlayerIndex = this._getPlayerAfterIndex(bigBlindIndex);
  }
  _postBet(player, amount) {
    const actualAmount = Math.min(amount, player.stack);
    player.stack -= actualAmount;
    player.currentBet += actualAmount;
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
      return index;
    } while (attempts < maxAttempts);
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
    const previousRaiseSize = this.lastRaiseAmount > 0 ? this.lastRaiseAmount : this.blinds.big;
    let minRaise = maxBet + previousRaiseSize;
    minRaise = Math.max(minRaise, player.currentBet + 1);
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
    let allowedActions = { actions: [], minRaise: 0, maxRaise: 0, callAmount: 0 };
    if (this.showdownPhase && player && this.playersToShow.has(player.id) && 
        this.showdownOrder && this.currentShowdownIndex < this.showdownOrder.length &&
        this.showdownOrder[this.currentShowdownIndex].id === player.id) {
      allowedActions = { actions: ['muck', 'show'], minRaise: 0, maxRaise: 0, callAmount: 0 };
    } else if (this.getCurrentPlayer()?.id === playerId && hasPlayerBoughtIn && !player?.isWaitingToPlay && !this.showdownPhase) {
      allowedActions = this._getAllowedActions(player);
    }
    const shouldHideCards = !hasPlayerBoughtIn;
    return {
      ...state,
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
      communityCards: shouldHideCards ? [] : state.communityCards,
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
    this.players.forEach(p => {
      if (p.stack <= 0) {
        p.hasBoughtIn = false;
        p.isWaitingToPlay = true;
      }
    });
    const activePlayers = this.players.filter(p => p.hasBoughtIn && p.stack > 0);
    if (activePlayers.length >= 2) {
      this.startNewHand();
      if (this.onStateChange) {
        this.onStateChange(this);
      }
    } else {
      this.status = 'waiting';
      if (this.onStateChange) {
        this.onStateChange(this);
      }
    }
  }
  cleanup() { 
    this._clearTurnTimeout(); // Очищаем таймаут при завершении игры
    this._clearShowdownTimeout(); // Очищаем showdown таймаут
    this.players = [];
    this.deck = [];
    this.communityCards = [];
    this.sidePots = [];
    this.winnersInfo = null;
    this.onStateChange = null;
    this.showdownOrder = null;
    this.showdownResults = null;
  }
}
module.exports = { PokerGame };


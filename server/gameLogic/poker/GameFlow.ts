import { 
  PokerStage, 
  PokerPlayer, 
  PokerCard, 
  PokerSettings,
  PlayerStatus 
} from '../../types/poker.types';

export class GameFlow {
  private stage: PokerStage = 'pre-flop';
  private dealerSeat: number = 0;
  private currentTurnSeat: number = 0;
  private lastBetSize: number = 0;
  private communityCards: PokerCard[] = [];
  private deck: PokerCard[] = [];
  private handNumber: number = 0;
  
  constructor(private settings: PokerSettings) {
    this.initializeDeck();
  }
  
  /**
   * Инициализируем колоду карт
   */
  private initializeDeck(): void {
    const suits: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: ('2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A')[] = 
      ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    this.deck = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        this.deck.push({ suit, rank });
      }
    }
  }
  
  /**
   * Перемешиваем колоду
   */
  private shuffleDeck(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }
  
  /**
   * Берем карту из колоды
   */
  private dealCard(): PokerCard | null {
    return this.deck.pop() || null;
  }
  
  /**
   * Начинаем новую раздачу
   */
  public startNewHand(players: PokerPlayer[]): void {
    this.handNumber++;
    this.stage = 'pre-flop';
    this.communityCards = [];
    this.lastBetSize = this.settings.bigBlind;
    
    // Перемешиваем колоду
    this.initializeDeck();
    this.shuffleDeck();
    
    // Двигаем дилера
    this.advanceDealer(players);
    
    // Сбрасываем состояние игроков
    this.resetPlayersForNewHand(players);
    
    // Раздаем карты
    this.dealHoleCards(players);
    
    // Ставим блайнды
    this.postBlinds(players);
    
    // Определяем первого игрока для действия
    this.setFirstPlayerToAct(players);
  }
  
  /**
   * Перемещаем фишку дилера
   */
  private advanceDealer(players: PokerPlayer[]): void {
    const activePlayers = players.filter(p => p.status !== 'busted');
    
    if (activePlayers.length < 2) {
      return;
    }
    
    // Находим следующего активного игрока для дилера
    let nextDealerIndex = 0;
    if (this.handNumber > 1) {
      const currentDealerPlayer = players.find(p => p.isDealer);
      if (currentDealerPlayer) {
        let startSeat = currentDealerPlayer.seat + 1;
        nextDealerIndex = this.findNextActiveSeat(players, startSeat);
      }
    }
    
    // Сбрасываем все позиции дилера/блайндов
    players.forEach(p => {
      p.isDealer = false;
      p.isSmallBlind = false;
      p.isBigBlind = false;
    });
    
    // Устанавливаем нового дилера
    this.dealerSeat = nextDealerIndex;
    const dealerPlayer = players[nextDealerIndex];
    if (dealerPlayer) {
      dealerPlayer.isDealer = true;
    }
    
    // Устанавливаем блайнды
    if (activePlayers.length === 2) {
      // Heads-up: дилер = малый блайнд
      dealerPlayer.isSmallBlind = true;
      const bigBlindSeat = this.findNextActiveSeat(players, this.dealerSeat + 1);
      const bigBlindPlayer = players[bigBlindSeat];
      if (bigBlindPlayer) {
        bigBlindPlayer.isBigBlind = true;
      }
    } else {
      // Обычная игра
      const smallBlindSeat = this.findNextActiveSeat(players, this.dealerSeat + 1);
      const bigBlindSeat = this.findNextActiveSeat(players, smallBlindSeat + 1);
      
      const smallBlindPlayer = players[smallBlindSeat];
      const bigBlindPlayer = players[bigBlindSeat];
      
      if (smallBlindPlayer) smallBlindPlayer.isSmallBlind = true;
      if (bigBlindPlayer) bigBlindPlayer.isBigBlind = true;
    }
  }
  
  /**
   * Находим следующее активное место за столом
   */
  private findNextActiveSeat(players: PokerPlayer[], startSeat: number): number {
    const activePlayers = players.filter(p => p.status !== 'busted');
    
    for (let i = 0; i < players.length; i++) {
      const seat = (startSeat + i) % players.length;
      const player = players[seat];
      if (player && activePlayers.includes(player)) {
        return seat;
      }
    }
    
    return 0; // fallback
  }
  
  /**
   * Сбрасываем состояние игроков для новой раздачи
   */
  private resetPlayersForNewHand(players: PokerPlayer[]): void {
    console.log(`🔄 [GameFlow] Resetting players for new hand`, {
      timestamp: new Date().toISOString(),
      totalPlayers: players.length,
      playerStates: players.map(p => ({ 
        id: p.id, 
        status: p.status, 
        stack: p.stack, 
        hasBoughtIn: p.hasBoughtIn 
      }))
    });

    players.forEach(player => {
      // Игроки, готовые играть: сделали buy-in, имеют фишки, не выбыли
      if (player.hasBoughtIn && player.stack > 0 && player.status !== 'busted') {
        player.status = 'playing';
        player.holeCards = [];
        player.currentBet = 0;
        player.totalBetThisHand = 0;
        player.hasActed = false;
        player.lastAction = undefined;
        player.showCards = false;
        
        console.log(`✅ [GameFlow] Player ready for hand`, {
          timestamp: new Date().toISOString(),
          playerId: player.id,
          name: player.name,
          status: player.status,
          stack: player.stack
        });
      } else {
        console.log(`⏭️  [GameFlow] Player not ready for hand`, {
          timestamp: new Date().toISOString(),
          playerId: player.id,
          name: player.name,
          status: player.status,
          stack: player.stack,
          hasBoughtIn: player.hasBoughtIn,
          reason: !player.hasBoughtIn ? 'No buy-in' : 
                  player.stack <= 0 ? 'No chips' : 
                  player.status === 'busted' ? 'Busted' : 'Unknown'
        });
      }
    });
  }
  
  /**
   * Раздаем карты игрокам
   */
  private dealHoleCards(players: PokerPlayer[]): void {
    // Игроки готовые к раздаче: сделали buy-in, имеют фишки, не выбыли
    const activePlayers = players.filter(p => 
      p.hasBoughtIn && p.stack > 0 && p.status !== 'busted'
    );
    
    console.log(`🃏 [GameFlow] Dealing cards to players`, {
      timestamp: new Date().toISOString(),
      totalPlayers: players.length,
      activePlayers: activePlayers.length,
      playerDetails: activePlayers.map(p => ({ 
        id: p.id, 
        name: p.name, 
        status: p.status, 
        stack: p.stack,
        hasBoughtIn: p.hasBoughtIn 
      }))
    });
    
    // Раздаем по 2 карты каждому
    for (let cardNum = 0; cardNum < 2; cardNum++) {
      for (const player of activePlayers) {
        const card = this.dealCard();
        if (card) {
          player.holeCards.push(card);
          console.log(`🎴 [GameFlow] Dealt card to player`, {
            timestamp: new Date().toISOString(),
            playerId: player.id,
            cardNumber: cardNum + 1,
            card: `${card.rank} of ${card.suit}`,
            totalCards: player.holeCards.length
          });
        }
      }
    }
    
    console.log(`✅ [GameFlow] Cards dealt successfully`, {
      timestamp: new Date().toISOString(),
      playersWithCards: activePlayers.filter(p => p.holeCards.length === 2).length
    });
  }
  
  /**
   * Ставим блайнды
   */
  private postBlinds(players: PokerPlayer[]): void {
    const smallBlindPlayer = players.find(p => p.isSmallBlind);
    const bigBlindPlayer = players.find(p => p.isBigBlind);
    
    if (smallBlindPlayer) {
      const sbAmount = Math.min(this.settings.smallBlind, smallBlindPlayer.stack);
      smallBlindPlayer.currentBet = sbAmount;
      smallBlindPlayer.totalBetThisHand = sbAmount;
      smallBlindPlayer.stack -= sbAmount;
      
      if (smallBlindPlayer.stack === 0) {
        smallBlindPlayer.status = 'all-in';
      }
    }
    
    if (bigBlindPlayer) {
      const bbAmount = Math.min(this.settings.bigBlind, bigBlindPlayer.stack);
      bigBlindPlayer.currentBet = bbAmount;
      bigBlindPlayer.totalBetThisHand = bbAmount;
      bigBlindPlayer.stack -= bbAmount;
      
      if (bigBlindPlayer.stack === 0) {
        bigBlindPlayer.status = 'all-in';
      }
    }
  }
  
  /**
   * Определяем первого игрока для действия в pre-flop
   */
  private setFirstPlayerToAct(players: PokerPlayer[]): void {
    const activePlayers = players.filter(p => p.status === 'playing');
    
    if (activePlayers.length === 2) {
      // Heads-up: первым ходит дилер (малый блайнд)
      const dealerPlayer = players.find(p => p.isDealer);
      this.currentTurnSeat = dealerPlayer ? dealerPlayer.seat : 0;
    } else {
      // Обычная игра: первым ходит игрок слева от большого блайнда
      const bigBlindPlayer = players.find(p => p.isBigBlind);
      if (bigBlindPlayer) {
        this.currentTurnSeat = this.findNextActiveSeat(players, bigBlindPlayer.seat + 1);
      }
    }
  }
  
  /**
   * Переходим к следующему этапу игры
   */
  public advanceToNextStage(players: PokerPlayer[]): boolean {
    switch (this.stage) {
      case 'pre-flop':
        this.stage = 'flop';
        this.dealFlop();
        break;
      case 'flop':
        this.stage = 'turn';
        this.dealTurn();
        break;
      case 'turn':
        this.stage = 'river';
        this.dealRiver();
        break;
      case 'river':
        this.stage = 'showdown';
        return true; // Раздача окончена
      case 'showdown':
        return true;
    }
    
    // Сбрасываем состояние торгов для нового этапа
    this.resetBettingRound(players);
    
    return false;
  }
  
  /**
   * Раздаем флоп (3 карты)
   */
  private dealFlop(): void {
    // Сжигаем карту
    this.dealCard();
    
    // Раздаем 3 карты на стол
    for (let i = 0; i < 3; i++) {
      const card = this.dealCard();
      if (card) {
        this.communityCards.push(card);
      }
    }
  }
  
  /**
   * Раздаем терн (1 карта)
   */
  private dealTurn(): void {
    // Сжигаем карту
    this.dealCard();
    
    // Раздаем 1 карту
    const card = this.dealCard();
    if (card) {
      this.communityCards.push(card);
    }
  }
  
  /**
   * Раздаем ривер (1 карта)
   */
  private dealRiver(): void {
    // Сжигаем карту
    this.dealCard();
    
    // Раздаем 1 карту
    const card = this.dealCard();
    if (card) {
      this.communityCards.push(card);
    }
  }
  
  /**
   * Сбрасываем состояние торгов для нового раунда
   */
  private resetBettingRound(players: PokerPlayer[]): void {
    this.lastBetSize = 0;
    
    players.forEach(player => {
      if (player.status === 'playing') {
        player.hasActed = false;
        player.currentBet = 0; // Сбрасываем ставки раунда
      }
    });
    
    // Первым в новом раунде ходит первый активный игрок слева от дилера
    this.currentTurnSeat = this.findNextActiveSeat(players, this.dealerSeat + 1);
  }
  
  /**
   * Определяем следующего игрока для хода
   */
  public determineNextPlayer(players: PokerPlayer[]): number {
    // Специальная логика для showdown
    if (this.stage === 'showdown') {
      return this.determineNextShowdownPlayer(players);
    }
    
    // Обычная логика для торгов
    const activePlayers = players.filter(p => 
      p.status === 'playing' && !p.hasActed
    );
    
    if (activePlayers.length === 0) {
      return -1; // Раунд торгов окончен
    }
    
    // Ищем следующего активного игрока от текущей позиции
    let nextSeat = this.currentTurnSeat;
    for (let i = 1; i <= players.length; i++) {
      nextSeat = (this.currentTurnSeat + i) % players.length;
      const player = players[nextSeat];
      
      if (player && activePlayers.includes(player)) {
        return nextSeat;
      }
    }
    
    return -1;
  }

  /**
   * Определяем следующего игрока для показа карт в showdown
   */
  private determineNextShowdownPlayer(players: PokerPlayer[]): number {
    // Игроки, которые могут принять решение в showdown
    const showdownPlayers = players.filter(p => 
      (p.status === 'playing' || p.status === 'all-in') && 
      !p.hasActed && 
      p.holeCards.length > 0
    );
    
    if (showdownPlayers.length === 0) {
      return -1; // Showdown завершен
    }
    
    // Ищем первого игрока, который должен действовать
    // В showdown порядок: слева от дилера по часовой стрелке
    let nextSeat = this.findNextActiveSeat(players, this.dealerSeat + 1);
    
    for (let i = 0; i < players.length; i++) {
      const player = players[nextSeat];
      if (player && showdownPlayers.includes(player)) {
        return nextSeat;
      }
      nextSeat = this.findNextActiveSeat(players, nextSeat + 1);
    }
    
    return -1;
  }
  
  /**
   * Проверяем, окончен ли раунд торгов
   */
  public isBettingRoundComplete(players: PokerPlayer[]): boolean {
    // Специальная логика для showdown
    if (this.stage === 'showdown') {
      return this.isShowdownComplete(players);
    }
    
    // Обычная логика для торгов
    const activePlayers = players.filter(p => 
      p.status === 'playing' || p.status === 'all-in'
    );
    
    if (activePlayers.length <= 1) {
      return true;
    }
    
    // Все активные игроки должны были действовать
    const playersNeedingAction = activePlayers.filter(p => 
      !p.hasActed && p.status === 'playing'
    );
    
    if (playersNeedingAction.length > 0) {
      return false;
    }
    
    // Все ставки должны быть уравнены
    const playingPlayers = activePlayers.filter(p => p.status === 'playing');
    if (playingPlayers.length === 0) {
      return true;
    }
    
    const currentBets = playingPlayers.map(p => p.currentBet);
    const maxBet = Math.max(...currentBets);
    
    return currentBets.every(bet => bet === maxBet);
  }

  /**
   * Проверяем, завершен ли showdown
   */
  private isShowdownComplete(players: PokerPlayer[]): boolean {
    // Игроки, которые должны принять решение в showdown
    const showdownPlayers = players.filter(p => 
      (p.status === 'playing' || p.status === 'all-in') && 
      p.holeCards.length > 0
    );
    
    if (showdownPlayers.length <= 1) {
      return true;
    }
    
    // Все игроки должны были принять решение (show/muck)
    const playersNeedingAction = showdownPlayers.filter(p => !p.hasActed);
    
    return playersNeedingAction.length === 0;
  }
  
  /**
   * Проверяем, закончена ли раздача
   */
  public isHandComplete(players: PokerPlayer[]): boolean {
    const activePlayers = players.filter(p => 
      p.status !== 'folded' && p.status !== 'busted'
    );
    
    // Если остался один или меньше игроков
    if (activePlayers.length <= 1) {
      return true;
    }
    
    // Если дошли до showdown, проверяем завершен ли он
    if (this.stage === 'showdown') {
      return this.isShowdownComplete(players);
    }
    
    return false;
  }
  
  // Геттеры
  public getStage(): PokerStage {
    return this.stage;
  }
  
  public getCommunityCards(): PokerCard[] {
    return [...this.communityCards];
  }
  
  public getDealerSeat(): number {
    return this.dealerSeat;
  }
  
  public getCurrentTurnSeat(): number {
    return this.currentTurnSeat;
  }
  
  public setCurrentTurnSeat(seat: number): void {
    this.currentTurnSeat = seat;
  }
  
  public getLastBetSize(): number {
    return this.lastBetSize;
  }
  
  public setLastBetSize(amount: number): void {
    this.lastBetSize = amount;
  }
  
  public getHandNumber(): number {
    return this.handNumber;
  }
}

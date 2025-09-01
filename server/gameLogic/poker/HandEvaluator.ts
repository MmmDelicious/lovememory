import { PokerCard, PokerPlayer, HandResult } from '../../types/poker.types';

const Hand = require('pokersolver').Hand;

export class HandEvaluator {
  
  /**
   * Преобразует нашу карту в формат pokersolver
   */
  private static convertCardToSolver(card: PokerCard): string {
    const rankMap: { [key: string]: string } = {
      '10': 'T',
      'J': 'J',
      'Q': 'Q', 
      'K': 'K',
      'A': 'A'
    };
    
    const suitMap: { [key: string]: string } = {
      'hearts': 'h',
      'diamonds': 'd',
      'clubs': 'c',
      'spades': 's'
    };
    
    const rank = rankMap[card.rank] || card.rank;
    const suit = suitMap[card.suit];
    
    return `${rank}${suit}`;
  }
  
  /**
   * Преобразует массив карт в формат pokersolver
   */
  private static convertCardsToSolver(cards: PokerCard[]): string[] {
    return cards.map(card => this.convertCardToSolver(card));
  }
  
  /**
   * Оценивает руку игрока с учетом общих карт
   */
  public static evaluatePlayerHand(
    holeCards: PokerCard[], 
    communityCards: PokerCard[]
  ): any {
    const allCards = [...holeCards, ...communityCards];
    const solverCards = this.convertCardsToSolver(allCards);
    
    try {
      return Hand.solve(solverCards);
    } catch (error) {
      console.error('Error evaluating hand:', error);
      return null;
    }
  }
  
  /**
   * Находит победителей среди активных игроков
   */
  public static findWinners(
    players: PokerPlayer[], 
    communityCards: PokerCard[]
  ): HandResult[] {
    const activePlayers = players.filter(p => 
      p.status !== 'folded' && p.status !== 'busted'
    );
    
    if (activePlayers.length === 0) {
      return [];
    }
    
    if (activePlayers.length === 1) {
      // Если остался один игрок, он победитель (все остальные сбросили)
      return [{
        player: activePlayers[0],
        hand: null,
        handName: 'Все сбросили',
        handRank: 999, // Максимальный ранг для случая когда все сбросили
        cards: activePlayers[0].holeCards,
        amount: 0,
        eligiblePots: ['main'] // Упрощенно, пока только основной банк
      }];
    }
    
    // Оцениваем руки всех активных игроков
    const handResults: HandResult[] = [];
    
    for (const player of activePlayers) {
      const hand = this.evaluatePlayerHand(player.holeCards, communityCards);
      
      if (hand) {
        handResults.push({
          player,
          hand,
          handName: hand.name || hand.descr || 'Unknown',
          handRank: hand.rank,
          cards: player.holeCards,
          amount: 0,
          eligiblePots: ['main'] // Пока упрощенно
        });
      }
    }
    
    // Сортируем по силе руки (меньший rank = сильнее рука в pokersolver)
    handResults.sort((a, b) => a.handRank - b.handRank);
    
    return handResults;
  }
  
  /**
   * Определяет победителей с учетом кикеров и равных рук
   */
  public static determineWinners(
    players: PokerPlayer[], 
    communityCards: PokerCard[]
  ): HandResult[] {
    const handResults = this.findWinners(players, communityCards);
    
    if (handResults.length === 0) {
      return [];
    }
    
    // Если остался один игрок после фолдов
    if (handResults.length === 1) {
      return handResults;
    }
    
    // Группируем игроков с одинаковой силой руки
    const winners: HandResult[] = [];
    const bestRank = handResults[0].handRank;
    
    // Используем pokersolver для точного сравнения рук
    const hands = handResults.map(result => result.hand);
    const solverWinners = Hand.winners(hands);
    
    // Находим соответствующих игроков
    for (const winningHand of solverWinners) {
      const result = handResults.find(r => 
        r.hand && this.handsEqual(r.hand, winningHand)
      );
      if (result) {
        winners.push(result);
      }
    }
    
    return winners;
  }
  
  /**
   * Сравнивает две руки pokersolver на равенство
   */
  private static handsEqual(hand1: any, hand2: any): boolean {
    if (!hand1 || !hand2) return false;
    
    // Сравниваем по рангу и картам
    return hand1.rank === hand2.rank && 
           JSON.stringify(hand1.cards) === JSON.stringify(hand2.cards);
  }
  
  /**
   * Получает читаемое название комбинации на русском
   */
  public static getHandNameRu(handName: string): string {
    const nameMap: { [key: string]: string } = {
      'High Card': 'Старшая карта',
      'Pair': 'Пара',
      'Two Pair': 'Две пары',
      'Three of a Kind': 'Сет',
      'Straight': 'Стрит',
      'Flush': 'Флеш',
      'Full House': 'Фулл хаус',
      'Four of a Kind': 'Каре',
      'Straight Flush': 'Стрит-флеш',
      'Royal Flush': 'Роял-флеш',
      'Все сбросили': 'Все сбросили'
    };
    
    return nameMap[handName] || handName;
  }
}

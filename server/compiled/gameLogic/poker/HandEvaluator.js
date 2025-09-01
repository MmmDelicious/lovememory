"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandEvaluator = void 0;
const Hand = require('pokersolver').Hand;
class HandEvaluator {
    /**
     * Преобразует нашу карту в формат pokersolver
     */
    static convertCardToSolver(card) {
        const rankMap = {
            '10': 'T',
            'J': 'J',
            'Q': 'Q',
            'K': 'K',
            'A': 'A'
        };
        const suitMap = {
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
    static convertCardsToSolver(cards) {
        return cards.map(card => this.convertCardToSolver(card));
    }
    /**
     * Оценивает руку игрока с учетом общих карт
     */
    static evaluatePlayerHand(holeCards, communityCards) {
        const allCards = [...holeCards, ...communityCards];
        const solverCards = this.convertCardsToSolver(allCards);
        try {
            return Hand.solve(solverCards);
        }
        catch (error) {
            console.error('Error evaluating hand:', error);
            return null;
        }
    }
    /**
     * Находит победителей среди активных игроков
     */
    static findWinners(players, communityCards) {
        const activePlayers = players.filter(p => p.status !== 'folded' && p.status !== 'busted');
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
        const handResults = [];
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
    static determineWinners(players, communityCards) {
        const handResults = this.findWinners(players, communityCards);
        if (handResults.length === 0) {
            return [];
        }
        // Если остался один игрок после фолдов
        if (handResults.length === 1) {
            return handResults;
        }
        // Группируем игроков с одинаковой силой руки
        const winners = [];
        const bestRank = handResults[0].handRank;
        // Используем pokersolver для точного сравнения рук
        const hands = handResults.map(result => result.hand);
        const solverWinners = Hand.winners(hands);
        // Находим соответствующих игроков
        for (const winningHand of solverWinners) {
            const result = handResults.find(r => r.hand && this.handsEqual(r.hand, winningHand));
            if (result) {
                winners.push(result);
            }
        }
        return winners;
    }
    /**
     * Сравнивает две руки pokersolver на равенство
     */
    static handsEqual(hand1, hand2) {
        if (!hand1 || !hand2)
            return false;
        // Сравниваем по рангу и картам
        return hand1.rank === hand2.rank &&
            JSON.stringify(hand1.cards) === JSON.stringify(hand2.cards);
    }
    /**
     * Получает читаемое название комбинации на русском
     */
    static getHandNameRu(handName) {
        const nameMap = {
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
exports.HandEvaluator = HandEvaluator;
//# sourceMappingURL=HandEvaluator.js.map
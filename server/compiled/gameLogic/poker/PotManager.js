"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PotManager = void 0;
class PotManager {
    constructor() {
        this.mainPot = 0;
        this.sidePots = [];
        this.reset();
    }
    /**
     * Сбрасываем все банки для новой раздачи
     */
    reset() {
        this.mainPot = 0;
        this.sidePots = [];
    }
    /**
     * Добавляем ставку игрока в банк
     */
    addBet(playerId, amount) {
        if (amount <= 0)
            return;
        this.mainPot += amount;
    }
    /**
     * Получаем общий размер всех банков
     */
    getTotalPot() {
        const sidePotTotal = this.sidePots.reduce((sum, pot) => sum + pot.amount, 0);
        return this.mainPot + sidePotTotal;
    }
    /**
     * Вычисляем банки с учетом all-in игроков
     */
    calculatePots(players) {
        // Сбрасываем старые side pots
        this.sidePots = [];
        // Получаем всех игроков, которые поставили что-то в эту раздачу
        const bettingPlayers = players.filter(p => p.totalBetThisHand > 0);
        if (bettingPlayers.length === 0) {
            this.mainPot = 0;
            return;
        }
        // Сортируем игроков по размеру их общей ставки в раздаче
        bettingPlayers.sort((a, b) => a.totalBetThisHand - b.totalBetThisHand);
        let remainingPlayers = [...bettingPlayers];
        let previousLevel = 0;
        let potIndex = 0;
        for (let i = 0; i < bettingPlayers.length; i++) {
            const currentLevel = bettingPlayers[i].totalBetThisHand;
            if (currentLevel > previousLevel) {
                const potAmount = (currentLevel - previousLevel) * remainingPlayers.length;
                if (potIndex === 0) {
                    // Основной банк
                    this.mainPot = potAmount;
                }
                else {
                    // Боковой банк
                    this.sidePots.push({
                        id: `side_${potIndex}`,
                        amount: potAmount,
                        eligiblePlayers: remainingPlayers.map(p => p.id)
                    });
                }
                previousLevel = currentLevel;
                potIndex++;
            }
            // Убираем игроков, которые больше не могут участвовать в следующих банках
            // (те, кто поставил все что мог на этом уровне)
            remainingPlayers = remainingPlayers.filter(p => p.totalBetThisHand > currentLevel || p.status === 'all-in');
        }
    }
    /**
     * Распределяем выигрыш между победителями
     */
    distributeWinnings(winners) {
        const distributions = [];
        if (winners.length === 0) {
            return distributions;
        }
        // Начинаем с основного банка
        if (this.mainPot > 0) {
            const mainPotWinners = winners.filter(w => w.eligiblePots?.includes('main'));
            if (mainPotWinners.length > 0) {
                const amountPerWinner = Math.floor(this.mainPot / mainPotWinners.length);
                const remainder = this.mainPot % mainPotWinners.length;
                distributions.push({
                    potId: 'main',
                    amount: this.mainPot,
                    winners: mainPotWinners.map((winner, index) => ({
                        player: winner.player,
                        playerId: winner.player.id,
                        handRank: winner.handRank,
                        handName: winner.handName,
                        cards: winner.cards,
                        amount: amountPerWinner + (index < remainder ? 1 : 0),
                        hand: winner.hand
                    })),
                    sidePots: []
                });
            }
        }
        // Обрабатываем боковые банки
        for (const sidePot of this.sidePots) {
            const eligibleWinners = winners.filter(w => sidePot.eligiblePlayers.includes(w.player.id));
            if (eligibleWinners.length > 0) {
                // Находим лучшую руку среди eligible игроков
                const bestRank = Math.min(...eligibleWinners.map(w => w.handRank));
                const potWinners = eligibleWinners.filter(w => w.handRank === bestRank);
                const amountPerWinner = Math.floor(sidePot.amount / potWinners.length);
                const remainder = sidePot.amount % potWinners.length;
                distributions.push({
                    potId: sidePot.id,
                    amount: sidePot.amount,
                    winners: potWinners.map((winner, index) => ({
                        player: winner.player,
                        playerId: winner.player.id,
                        handRank: winner.handRank,
                        handName: winner.handName,
                        cards: winner.cards,
                        amount: amountPerWinner + (index < remainder ? 1 : 0),
                        hand: winner.hand
                    })),
                    sidePots: []
                });
            }
        }
        return distributions;
    }
    /**
     * Применяем выигрыш к стекам игроков
     */
    applyWinnings(players, distributions) {
        for (const distribution of distributions) {
            for (const winner of distribution.winners) {
                const player = players.find(p => p.id === winner.playerId);
                if (player) {
                    player.stack += winner.amount;
                }
            }
        }
    }
    /**
     * Возвращаем некекьеннье ставки игрокам (uncalled bets)
     */
    returnUncalledBets(players) {
        // Находим максимальную ставку, которую кто-то call'нул
        const activePlayers = players.filter(p => p.status !== 'folded');
        if (activePlayers.length <= 1) {
            // Если остался один или меньше игроков, возвращаем все ставки кроме call'нутых
            for (const player of players) {
                if (player.currentBet > 0) {
                    // Простая логика: возвращаем текущую ставку если игрок не единственный активный
                    if (activePlayers.length === 0 || !activePlayers.includes(player)) {
                        player.stack += player.currentBet;
                        this.mainPot -= player.currentBet;
                        player.currentBet = 0;
                    }
                }
            }
            return;
        }
        // Находим максимальную ставку среди тех, кто не all-in
        const playersNotAllIn = activePlayers.filter(p => p.status !== 'all-in');
        if (playersNotAllIn.length === 0)
            return;
        const maxCalledBet = Math.max(...playersNotAllIn.map(p => p.currentBet));
        // Возвращаем превышение над максимальной call'нутой ставкой
        for (const player of players) {
            if (player.currentBet > maxCalledBet) {
                const excess = player.currentBet - maxCalledBet;
                player.stack += excess;
                player.currentBet = maxCalledBet;
                this.mainPot -= excess;
            }
        }
    }
    /**
     * Получаем информацию о банках для UI
     */
    getPotInfo() {
        return {
            main: this.mainPot,
            sides: [...this.sidePots]
        };
    }
}
exports.PotManager = PotManager;
//# sourceMappingURL=PotManager.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokerGameFactory = void 0;
const PokerEngine_1 = require("./PokerEngine");
class PokerGameFactory {
    /**
     * Создаем новую покерную игру с настройками
     */
    static createGame(gameId, players, options = {}) {
        console.log(`🏭 [PokerFactory] Creating poker game`, {
            timestamp: new Date().toISOString(),
            gameId,
            playersCount: players.length,
            players: players.map(p => ({ id: p.id, name: p.name, buyInCoins: p.buyInCoins })),
            options
        });
        // Определяем buy-in из настроек игроков или опций
        const buyInCoins = players[0]?.buyInCoins || options.buyInAmount || 1000;
        // Рассчитываем блайнды как процент от buy-in
        const smallBlind = options.smallBlind || Math.max(1, Math.floor(buyInCoins * 0.005)); // 0.5%
        const bigBlind = options.bigBlind || Math.max(2, Math.floor(buyInCoins * 0.01)); // 1%
        console.log(`💰 [PokerFactory] Calculated game parameters`, {
            timestamp: new Date().toISOString(),
            gameId,
            buyInCoins,
            smallBlind,
            bigBlind
        });
        const settings = {
            smallBlind,
            bigBlind,
            buyInAmount: buyInCoins,
            maxPlayers: options.maxPlayers || 8,
            minPlayers: options.minPlayers || 2,
            turnTimeLimit: options.turnTimeLimit || 30000, // 30 секунд
            allowRebuys: options.allowRebuys !== false, // По умолчанию true
            allowAddOns: options.allowAddOns !== false // По умолчанию true
        };
        console.log(`⚙️  [PokerFactory] Created game settings`, {
            timestamp: new Date().toISOString(),
            gameId,
            settings
        });
        const game = new PokerEngine_1.PokerEngine(gameId, settings);
        console.log(`🎲 [PokerFactory] PokerEngine instantiated`, {
            timestamp: new Date().toISOString(),
            gameId,
            engineStatus: game.status,
            engineType: game.gameType
        });
        // НЕ добавляем игроков автоматически для новой архитектуры
        // Игроки будут добавлены после buy-in через отдельные вызовы
        console.log(`⏭️  [PokerFactory] Skipping automatic player addition - waiting for buy-ins`, {
            timestamp: new Date().toISOString(),
            gameId,
            playersToAddLater: players.length
        });
        // УДАЛЕН СТАРЫЙ КОД:
        // for (const playerInfo of players) {
        //   game.addPlayer(
        //     playerInfo.id, 
        //     playerInfo.name || 'Игрок',
        //     playerInfo.buyInCoins || buyInCoins
        //   );
        // }
        console.log(`✅ [PokerFactory] Poker game created successfully`, {
            timestamp: new Date().toISOString(),
            gameId,
            finalStatus: game.status,
            playersInGame: game.players?.length || 0
        });
        return game;
    }
    /**
     * Создаем покер для heads-up (1 на 1)
     */
    static createHeadsUpGame(gameId, player1, player2, buyInAmount = 1000) {
        return this.createGame(gameId, [player1, player2], {
            maxPlayers: 2,
            minPlayers: 2,
            buyInAmount,
            smallBlind: Math.max(1, Math.floor(buyInAmount * 0.01)),
            bigBlind: Math.max(2, Math.floor(buyInAmount * 0.02)),
            turnTimeLimit: 30000
        });
    }
    /**
     * Создаем турнирный покер (увеличивающиеся блайнды)
     */
    static createTournamentGame(gameId, players, options = {}) {
        const buyInAmount = options.buyInAmount || 1500;
        return this.createGame(gameId, players, {
            ...options,
            buyInAmount,
            smallBlind: 10,
            bigBlind: 20,
            allowRebuys: false,
            allowAddOns: false,
            turnTimeLimit: 25000 // Быстрее в турнире
        });
    }
}
exports.PokerGameFactory = PokerGameFactory;
//# sourceMappingURL=PokerGameFactory.js.map
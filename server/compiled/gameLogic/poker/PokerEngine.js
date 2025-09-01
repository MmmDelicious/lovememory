"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokerEngine = void 0;
const HandEvaluator_1 = require("./HandEvaluator");
const PotManager_1 = require("./PotManager");
const GameFlow_1 = require("./GameFlow");
class PokerEngine {
    /**
     * Конвертирует карту из внутреннего формата в формат старого клиента
     */
    convertCardToOldFormat(card) {
        const suitMap = {
            'hearts': 'H',
            'diamonds': 'D',
            'clubs': 'C',
            'spades': 'S'
        };
        return {
            rank: card.rank,
            suit: suitMap[card.suit] || card.suit
        };
    }
    /**
     * Конвертирует массив карт в формат старого клиента
     */
    convertCardsToOldFormat(cards) {
        return cards.map(card => this.convertCardToOldFormat(card));
    }
    /**
     * Конвертирует игрока в формат старого клиента
     */
    convertPlayerToOldFormat(player, showCards = false) {
        const cards = showCards ? this.convertCardsToOldFormat(player.holeCards) : [];
        return {
            id: player.id,
            name: player.name,
            stack: player.stack,
            hand: cards,
            cards: cards, // Для совместимости
            currentBet: player.currentBet,
            inHand: player.status === 'playing' || player.status === 'all-in',
            hasActed: player.hasActed || false,
            isWaitingToPlay: player.status === 'waiting',
            isAllIn: player.status === 'all-in',
            hasBoughtIn: player.hasBoughtIn,
            showCards: player.showCards || false,
            seat: player.seat,
            status: player.status
        };
    }
    constructor(gameId, settings) {
        this.settings = settings;
        this._players = [];
        this.isHandActive = false;
        this.actionHistory = [];
        this.handWinners = []; // Сохраняем информацию о победителях раздачи
        console.log(`🎲 [PokerEngine] Constructor called`, {
            timestamp: new Date().toISOString(),
            gameId,
            settings: {
                ...settings,
                // Добавляем значения по умолчанию если отсутствуют
                minBuyIn: settings.minBuyIn || 50,
                maxBuyIn: settings.maxBuyIn || 1000
            }
        });
        this.gameId = gameId;
        this.potManager = new PotManager_1.PotManager();
        this.gameFlow = new GameFlow_1.GameFlow(settings);
        // Устанавливаем значения по умолчанию если отсутствуют
        if (!this.settings.minBuyIn) {
            this.settings.minBuyIn = 50;
        }
        if (!this.settings.maxBuyIn) {
            this.settings.maxBuyIn = 1000;
        }
        console.log(`✅ [PokerEngine] Initialized successfully`, {
            timestamp: new Date().toISOString(),
            gameId: this.gameId,
            finalSettings: this.settings
        });
    }
    /**
     * Добавляем игрока в игру
     */
    addPlayer(playerId, name, buyInAmount) {
        console.log(`👤 [PokerEngine] Adding player`, {
            timestamp: new Date().toISOString(),
            gameId: this.gameId,
            playerId,
            name,
            buyInAmount,
            currentPlayersCount: this._players.length,
            maxPlayers: this.settings.maxPlayers
        });
        // Проверяем лимиты
        if (this._players.length >= this.settings.maxPlayers) {
            console.error(`❌ [PokerEngine] Table is full`, {
                timestamp: new Date().toISOString(),
                gameId: this.gameId,
                playerId,
                currentPlayers: this._players.length,
                maxPlayers: this.settings.maxPlayers
            });
            return false;
        }
        // Проверяем, что игрок не добавлен уже
        if (this._players.find(p => p.id === playerId)) {
            console.error(`❌ [PokerEngine] Player already exists`, {
                timestamp: new Date().toISOString(),
                gameId: this.gameId,
                playerId
            });
            return false;
        }
        // Находим свободное место
        const seat = this.findEmptySeat();
        if (seat === -1) {
            console.error(`❌ [PokerEngine] No empty seats available`, {
                timestamp: new Date().toISOString(),
                gameId: this.gameId,
                playerId,
                occupiedSeats: this._players.map(p => p.seat)
            });
            return false;
        }
        // Определяем статус игрока и buy-in
        const isObserver = buyInAmount === 0;
        const actualBuyIn = isObserver ? 0 : (buyInAmount || this.settings.buyInAmount);
        const playerStatus = isObserver ? 'observer' : 'waiting';
        const hasBoughtIn = !isObserver;
        console.log(`💰 [PokerEngine] Player buy-in details`, {
            timestamp: new Date().toISOString(),
            gameId: this.gameId,
            playerId,
            seat,
            buyIn: actualBuyIn,
            isObserver,
            hasBoughtIn,
            status: playerStatus
        });
        const player = {
            id: playerId,
            name,
            seat,
            stack: actualBuyIn,
            currentBet: 0,
            totalBetThisHand: 0,
            holeCards: [],
            status: playerStatus,
            hasActed: false,
            hasBoughtIn,
            showCards: false,
            isDealer: false,
            isSmallBlind: false,
            isBigBlind: false
        };
        this._players.push(player);
        // Сортируем игроков по местам
        this._players.sort((a, b) => a.seat - b.seat);
        console.log(`✅ [PokerEngine] Player added successfully`, {
            timestamp: new Date().toISOString(),
            gameId: this.gameId,
            playerId,
            seat,
            stack: actualBuyIn,
            totalPlayersNow: this._players.length,
            playerOrder: this._players.map(p => ({ id: p.id, seat: p.seat }))
        });
        this.emitGameEvent({
            type: 'player_joined',
            data: { playerId, name, seat },
            timestamp: new Date()
        });
        // Автоматически начинаем игру если достаточно игроков
        this.checkAutoStart();
        return true;
    }
    /**
     * Удаляем игрока из игры
     */
    removePlayer(playerId) {
        const playerIndex = this._players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            return false;
        }
        const player = this._players[playerIndex];
        // Если игрок в активной раздаче, считаем его fold
        if (this.isHandActive && player.status === 'playing') {
            this.playerAction(playerId, { action: 'fold' });
        }
        this._players.splice(playerIndex, 1);
        this.emitGameEvent({
            type: 'player_left',
            data: { playerId },
            timestamp: new Date()
        });
        // Проверяем, можно ли продолжать игру
        this.checkMinPlayers();
        return true;
    }
    /**
     * Игрок совершает действие
     */
    playerAction(playerId, actionData) {
        console.log(`🎯 [POKER ENGINE] playerAction called`, {
            timestamp: new Date().toISOString(),
            gameId: this.gameId,
            playerId,
            actionData,
            currentStage: this.gameFlow.getStage(),
            currentTurnSeat: this.gameFlow.getCurrentTurnSeat(),
            isHandActive: this.isHandActive
        });
        const player = this.getPlayer(playerId);
        if (!player) {
            console.error(`❌ [POKER ENGINE] Player not found:`, { playerId });
            return false;
        }
        console.log(`👤 [POKER ENGINE] Player found:`, {
            playerId: player.id,
            seat: player.seat,
            status: player.status,
            stack: player.stack,
            currentBet: player.currentBet
        });
        // Проверяем, что сейчас ход этого игрока
        const currentTurn = this.gameFlow.getCurrentTurnSeat();
        if (currentTurn !== player.seat) {
            console.warn(`❌ [POKER ENGINE] Not player's turn:`, {
                playerSeat: player.seat,
                currentTurnSeat: currentTurn,
                playerId
            });
            return false;
        }
        console.log(`✅ [POKER ENGINE] Player turn confirmed`);
        // Проверяем, что действие валидно
        const isValid = this.isValidAction(player, actionData);
        if (!isValid) {
            console.warn(`❌ [POKER ENGINE] Invalid action:`, {
                playerId,
                actionData,
                playerStatus: player.status,
                validActions: this.getValidActions(player)
            });
            return false;
        }
        console.log(`✅ [POKER ENGINE] Action validated successfully`);
        // Выполняем действие
        console.log(`🔄 [POKER ENGINE] Executing action...`);
        this.executeAction(player, actionData);
        // Записываем в историю
        this.actionHistory.push({
            playerId,
            action: actionData.action,
            amount: actionData.amount,
            timestamp: new Date()
        });
        console.log(`📝 [POKER ENGINE] Action recorded in history`);
        // Проверяем, закончен ли раунд торгов
        const isBettingComplete = this.gameFlow.isBettingRoundComplete(this._players);
        console.log(`🔍 [POKER ENGINE] Betting round complete?`, { isBettingComplete });
        if (isBettingComplete) {
            console.log(`🏁 [POKER ENGINE] Completing betting round...`);
            this.completeBettingRound();
        }
        else {
            // Переходим к следующему игроку
            console.log(`➡️ [POKER ENGINE] Advancing to next player...`);
            this.advanceToNextPlayer();
        }
        console.log(`📤 [POKER ENGINE] Emitting state change...`);
        this.emitStateChange();
        console.log(`✅ [POKER ENGINE] playerAction completed successfully`);
        return true;
    }
    /**
     * Проверяем валидность действия
     */
    isValidAction(player, actionData) {
        const { action, amount = 0 } = actionData;
        if (player.status !== 'playing') {
            return false;
        }
        const maxBet = Math.max(...this._players.map(p => p.currentBet));
        const callAmount = maxBet - player.currentBet;
        switch (action) {
            case 'fold':
                return true;
            case 'check':
                return callAmount === 0;
            case 'call':
                return callAmount > 0 && player.stack >= callAmount;
            case 'bet':
                return callAmount === 0 && amount >= this.settings.bigBlind && amount <= player.stack;
            case 'raise':
                const minRaise = this.gameFlow.getLastBetSize();
                const totalAmount = callAmount + amount;
                return callAmount > 0 &&
                    amount >= minRaise &&
                    totalAmount <= player.stack;
            case 'all-in':
                return player.stack > 0;
            case 'show':
            case 'muck':
                return this.gameFlow.getStage() === 'showdown' && player.status === 'playing';
            default:
                return false;
        }
    }
    /**
     * Выполняем действие игрока
     */
    executeAction(player, actionData) {
        const { action, amount = 0 } = actionData;
        player.hasActed = true;
        player.lastAction = action;
        const maxBet = Math.max(...this._players.map(p => p.currentBet));
        const callAmount = maxBet - player.currentBet;
        switch (action) {
            case 'fold':
                player.status = 'folded';
                break;
            case 'check':
                // Ничего не делаем, просто передаем ход
                break;
            case 'call':
                const actualCall = Math.min(callAmount, player.stack);
                player.currentBet += actualCall;
                player.totalBetThisHand += actualCall;
                player.stack -= actualCall;
                this.potManager.addBet(player.id, actualCall);
                if (player.stack === 0) {
                    player.status = 'all-in';
                }
                break;
            case 'bet':
                const betAmount = Math.min(amount, player.stack);
                player.currentBet = betAmount;
                player.totalBetThisHand += betAmount;
                player.stack -= betAmount;
                this.potManager.addBet(player.id, betAmount);
                this.gameFlow.setLastBetSize(betAmount);
                // Сбрасываем hasActed у других игроков (они должны ответить на бет)
                this._players.forEach(p => {
                    if (p.id !== player.id && p.status === 'playing') {
                        p.hasActed = false;
                    }
                });
                if (player.stack === 0) {
                    player.status = 'all-in';
                }
                break;
            case 'raise':
                console.log(`💰 [POKER ENGINE] Processing raise action`, {
                    playerId: player.id,
                    raiseAmount: amount,
                    callAmount,
                    playerStack: player.stack,
                    currentBet: player.currentBet
                });
                const totalRaise = callAmount + amount;
                const actualRaise = Math.min(totalRaise, player.stack);
                console.log(`🔢 [POKER ENGINE] Raise calculations`, {
                    totalRaise,
                    actualRaise,
                    willBeAllIn: actualRaise === player.stack
                });
                player.currentBet += actualRaise;
                player.totalBetThisHand += actualRaise;
                player.stack -= actualRaise;
                this.potManager.addBet(player.id, actualRaise);
                this.gameFlow.setLastBetSize(amount);
                console.log(`🎰 [POKER ENGINE] Player state after raise`, {
                    newCurrentBet: player.currentBet,
                    newStack: player.stack,
                    totalBetThisHand: player.totalBetThisHand
                });
                // Сбрасываем hasActed у других игроков
                this._players.forEach(p => {
                    if (p.id !== player.id && p.status === 'playing') {
                        p.hasActed = false;
                    }
                });
                console.log(`🔄 [POKER ENGINE] Reset hasActed for other players`);
                if (player.stack === 0) {
                    player.status = 'all-in';
                    console.log(`🚀 [POKER ENGINE] Player went all-in`);
                }
                break;
            case 'all-in':
                const allInAmount = player.stack;
                player.currentBet += allInAmount;
                player.totalBetThisHand += allInAmount;
                player.stack = 0;
                player.status = 'all-in';
                this.potManager.addBet(player.id, allInAmount);
                // Если all-in больше текущего бета, это raise
                if (player.currentBet > maxBet) {
                    const raiseAmount = player.currentBet - maxBet;
                    this.gameFlow.setLastBetSize(raiseAmount);
                    // Сбрасываем hasActed у других игроков
                    this._players.forEach(p => {
                        if (p.id !== player.id && p.status === 'playing') {
                            p.hasActed = false;
                        }
                    });
                }
                break;
            case 'show':
                player.showCards = true;
                player.hasActed = true;
                break;
            case 'muck':
                player.status = 'folded'; // Скидываем карты
                player.showCards = false;
                player.hasActed = true;
                break;
        }
    }
    /**
     * Завершаем раунд торгов
     */
    completeBettingRound() {
        // Собираем все ставки в банк
        this.potManager.calculatePots(this._players);
        // Переходим к следующему этапу или завершаем раздачу
        const isHandComplete = this.gameFlow.advanceToNextStage(this._players);
        if (isHandComplete || this.gameFlow.isHandComplete(this._players)) {
            this.completeHand();
        }
        else {
            // Начинаем новый раунд торгов
            this.startNewBettingRound();
        }
    }
    /**
     * Начинаем новый раунд торгов
     */
    startNewBettingRound() {
        const firstPlayerSeat = this.gameFlow.determineNextPlayer(this._players);
        if (firstPlayerSeat !== -1) {
            this.gameFlow.setCurrentTurnSeat(firstPlayerSeat);
        }
        this.emitGameEvent({
            type: 'stage_change',
            data: {
                stage: this.gameFlow.getStage(),
                communityCards: this.gameFlow.getCommunityCards()
            },
            timestamp: new Date()
        });
    }
    /**
     * Переходим к следующему игроку
     */
    advanceToNextPlayer() {
        const nextPlayerSeat = this.gameFlow.determineNextPlayer(this._players);
        if (nextPlayerSeat !== -1) {
            this.gameFlow.setCurrentTurnSeat(nextPlayerSeat);
        }
    }
    /**
     * Завершаем раздачу
     */
    completeHand() {
        console.log(`🏁 [POKER ENGINE] completeHand called`, {
            timestamp: new Date().toISOString(),
            gameId: this.gameId,
            currentStage: this.gameFlow.getStage(),
            isHandActive: this.isHandActive,
            playersCount: this._players.length,
            playersStatus: this._players.map(p => ({ id: p.id, status: p.status, hasActed: p.hasActed }))
        });
        this.isHandActive = false;
        // Возвращаем невыкупленные ставки
        this.potManager.returnUncalledBets(this._players);
        // Определяем победителей
        const winners = HandEvaluator_1.HandEvaluator.determineWinners(this._players, this.gameFlow.getCommunityCards());
        // Сохраняем информацию о победителях для подсветки карт
        this.handWinners = winners;
        console.log(`🏆 [POKER ENGINE] Hand completed with winners`, {
            winnersCount: winners.length,
            winners: winners.map(w => ({
                playerId: w.player.id,
                handName: w.handName,
                cards: w.cards.map(c => `${c.rank}${c.suit}`)
            }))
        });
        // Распределяем выигрыш
        const distributions = this.potManager.distributeWinnings(winners);
        this.potManager.applyWinnings(this._players, distributions);
        this.emitGameEvent({
            type: 'hand_end',
            data: {
                winners: winners.map(w => ({
                    playerId: w.player.id,
                    handName: w.handName, // Уже в русском формате
                    amount: distributions.reduce((sum, d) => sum + (d.winners.find(dw => dw.playerId === w.player.id)?.amount || 0), 0),
                    handCards: w.cards // Добавляем победные карты
                })),
                distributions
            },
            timestamp: new Date()
        });
        // Подготавливаем к следующей раздаче
        setTimeout(() => {
            if (this.canStartNewHand()) {
                this.startNewHand();
            }
        }, 5000); // 5 секунд задержки
    }
    /**
     * Начинаем новую раздачу
     */
    startNewHand() {
        if (!this.canStartNewHand()) {
            return false;
        }
        // Сбрасываем состояние банка
        this.potManager.reset();
        this.actionHistory = [];
        this.handWinners = []; // Очищаем информацию о предыдущих победителях
        // Убираем игроков без фишек
        this._players = this._players.filter(p => p.stack > 0);
        if (this._players.length < this.settings.minPlayers) {
            return false;
        }
        // Начинаем новую раздачу через GameFlow
        this.gameFlow.startNewHand(this._players);
        this.isHandActive = true;
        this.emitGameEvent({
            type: 'hand_start',
            data: {
                handNumber: this.gameFlow.getHandNumber(),
                dealerSeat: this.gameFlow.getDealerSeat()
            },
            timestamp: new Date()
        });
        this.emitStateChange();
        return true;
    }
    /**
     * Проверяем, можно ли начать новую раздачу
     */
    canStartNewHand() {
        const activePlayers = this._players.filter(p => p.stack > 0 && p.hasBoughtIn);
        return activePlayers.length >= this.settings.minPlayers;
    }
    /**
     * Автоматически начинаем игру если достаточно игроков
     */
    checkAutoStart() {
        if (!this.isHandActive && this.canStartNewHand()) {
            this.startNewHand();
        }
    }
    /**
     * Проверяем минимальное количество игроков
     */
    checkMinPlayers() {
        if (this.isHandActive && this._players.length < this.settings.minPlayers) {
            // Завершаем текущую раздачу
            this.completeHand();
        }
    }
    /**
     * Находим свободное место за столом
     */
    findEmptySeat() {
        for (let seat = 0; seat < this.settings.maxPlayers; seat++) {
            if (!this._players.find(p => p.seat === seat)) {
                return seat;
            }
        }
        return -1;
    }
    /**
     * Получаем игрока по ID
     */
    getPlayer(playerId) {
        return this._players.find(p => p.id === playerId) || null;
    }
    /**
     * Получаем полное состояние игры
     */
    getGameState() {
        return {
            gameId: this.gameId,
            stage: this.gameFlow.getStage(),
            communityCards: this.gameFlow.getCommunityCards(),
            pot: this.potManager.getTotalPot(),
            sidePots: this.potManager.getPotInfo().sides,
            dealerSeat: this.gameFlow.getDealerSeat(),
            currentTurnSeat: this.gameFlow.getCurrentTurnSeat(),
            lastBetSize: this.gameFlow.getLastBetSize(),
            minRaiseAmount: this.getMinRaiseAmount(),
            activePlayers: this._players
                .filter(p => p.status !== 'folded' && p.status !== 'busted')
                .map(p => p.id),
            players: [...this._players],
            isHandActive: this.isHandActive,
            handNumber: this.gameFlow.getHandNumber()
        };
    }
    /**
     * Получаем состояние для конкретного игрока в формате старого клиента
     */
    getPlayerGameState(playerId) {
        console.log(`🔍 [PokerEngine] Getting state for player (OLD FORMAT)`, {
            timestamp: new Date().toISOString(),
            gameId: this.gameId,
            playerId,
            totalPlayersInGame: this._players.length,
            playersInGame: this._players.map(p => ({ id: p.id, name: p.name, hasBoughtIn: p.hasBoughtIn }))
        });
        const player = this.getPlayer(playerId);
        const gameState = this.getGameState();
        // Базовые данные для состояния
        const currentTurnSeat = this.gameFlow.getCurrentTurnSeat();
        const currentTurnPlayer = this._players.find(p => p.seat === currentTurnSeat);
        const baseState = {
            stage: gameState.stage,
            pot: gameState.pot,
            communityCards: this.convertCardsToOldFormat(gameState.communityCards),
            players: this._players.map(p => this.convertPlayerToOldFormat(p, false)),
            status: this.isHandActive ? 'in_progress' : 'waiting',
            currentPlayerId: currentTurnPlayer?.id || null, // ВАЖНО: ID игрока, а не seat!
            // Персональные данные (будут переопределены ниже)
            yourHand: [],
            yourStack: 0,
            yourCurrentBet: 0,
            isObserving: true,
            canMakeAction: false,
            validActions: [],
            minRaiseAmount: 0, // Будет переопределено ниже
            maxRaiseAmount: 0,
            callAmount: 0,
            // Дополнительные поля
            needsBuyIn: true,
            hasBoughtIn: false,
            handNumber: this.gameFlow.getHandNumber(),
            isHandActive: this.isHandActive,
            dealerSeat: this.gameFlow.getDealerSeat(),
            currentTurnSeat: currentTurnSeat
        };
        // Если игрок не в игре - это наблюдатель
        if (!player) {
            console.log(`👁️  [PokerEngine] Player not in game - returning observer state`, {
                timestamp: new Date().toISOString(),
                gameId: this.gameId,
                playerId
            });
            return baseState;
        }
        console.log(`🎮 [PokerEngine] Player found in game - returning player state`, {
            timestamp: new Date().toISOString(),
            gameId: this.gameId,
            playerId,
            playerSeat: player.seat,
            playerStack: player.stack,
            playerHasBoughtIn: player.hasBoughtIn
        });
        // Обновляем данные для конкретного игрока
        const maxBet = Math.max(...this._players.map(p => p.currentBet));
        const callAmount = Math.max(0, maxBet - player.currentBet);
        const validActions = this.getValidActions(player).map(action => action.toString());
        // Добавляем недостающие поля для старого клиента
        const isShowdownStage = gameState.stage === 'showdown';
        const hasShowdownActions = validActions.includes('show') || validActions.includes('muck');
        baseState.winnersInfo = []; // Пока пустой, будет заполнен при showdown
        baseState.showdownPhase = isShowdownStage && hasShowdownActions; // showdown с активными действиями
        baseState.playersToShow = [];
        baseState.currentShowdownPlayer = hasShowdownActions ? player.id : null;
        baseState.showdownOrder = null;
        console.log(`🎭 [POKER ENGINE] Showdown phase logic`, {
            isShowdownStage,
            hasShowdownActions,
            showdownPhase: baseState.showdownPhase,
            currentShowdownPlayer: baseState.currentShowdownPlayer,
            validActions: validActions
        });
        baseState.yourHand = this.convertCardsToOldFormat(player.holeCards);
        baseState.yourStack = player.stack;
        baseState.yourCurrentBet = player.currentBet;
        baseState.isObserving = player.status === 'observer';
        baseState.canMakeAction = this.gameFlow.getCurrentTurnSeat() === player.seat && player.status === 'playing';
        baseState.validActions = validActions;
        // Логика для рейза: старый клиент ожидает конкретные значения
        // minRaiseAmount - минимальная сумма рейза сверх текущей ставки
        const lastBetSize = this.gameFlow.getLastBetSize();
        const minRaiseIncrement = lastBetSize > 0 ? lastBetSize : this.settings.bigBlind;
        const currentMaxBet = Math.max(...this._players.map(p => p.currentBet));
        const minTotalRaise = currentMaxBet + minRaiseIncrement;
        baseState.minRaiseAmount = minTotalRaise; // Минимальная итоговая ставка при рейзе
        baseState.maxRaiseAmount = player.stack; // Максимум что игрок может поставить
        baseState.callAmount = callAmount;
        baseState.needsBuyIn = player.status === 'observer' || !player.hasBoughtIn;
        baseState.hasBoughtIn = player.hasBoughtIn;
        // Подсветка победных карт 
        if (this.handWinners.length > 0 && gameState.stage === 'showdown') {
            // Находим победителя среди этих игроков или берем первого
            const winner = this.handWinners.find(w => w.player.id === player.id) || this.handWinners[0];
            baseState.winningHandCards = this.convertCardsToOldFormat(winner.cards || []);
            baseState.winnersInfo = this.handWinners.map(w => ({
                player: { id: w.player.id, name: w.player.name },
                handName: w.handName, // Уже в русском формате из HandEvaluator
                handCards: this.convertCardsToOldFormat(w.cards || [])
            }));
            console.log(`🎯 [POKER ENGINE] Adding winning cards to player state`, {
                playerId: player.id,
                winningCards: baseState.winningHandCards.map(c => `${c.rank}${c.suit}`),
                winnersCount: this.handWinners.length
            });
        }
        else {
            baseState.winningHandCards = [];
            baseState.winnersInfo = [];
        }
        console.log(`📦 [PokerEngine] OLD FORMAT Player state created`, {
            timestamp: new Date().toISOString(),
            gameId: this.gameId,
            playerId,
            playerStatus: player.status,
            gameStatus: baseState.status,
            currentPlayerId: baseState.currentPlayerId,
            isPlayerTurn: baseState.currentPlayerId === playerId,
            needsBuyIn: baseState.needsBuyIn,
            hasBoughtIn: baseState.hasBoughtIn,
            callAmount: baseState.callAmount,
            validActionsCount: baseState.validActions.length,
            validActions: baseState.validActions,
            yourHandCount: baseState.yourHand.length,
            yourHand: baseState.yourHand.map(c => `${c.rank}${c.suit}`),
            gameStage: baseState.stage,
            communityCardsCount: baseState.communityCards.length,
            canMakeAction: baseState.canMakeAction,
            isHandActive: baseState.isHandActive
        });
        return baseState;
    }
    /**
     * Получаем валидные действия для игрока
     */
    getValidActions(player) {
        // Особая логика для showdown
        if (this.gameFlow.getStage() === 'showdown') {
            if (this.gameFlow.getCurrentTurnSeat() === player.seat && player.status === 'playing') {
                return ['show', 'muck'];
            }
            return [];
        }
        // Обычная игровая логика
        if (player.status !== 'playing' ||
            this.gameFlow.getCurrentTurnSeat() !== player.seat) {
            return [];
        }
        const actions = ['fold'];
        const maxBet = Math.max(...this._players.map(p => p.currentBet));
        const callAmount = maxBet - player.currentBet;
        if (callAmount === 0) {
            actions.push('check');
            if (player.stack >= this.settings.bigBlind) {
                actions.push('bet');
            }
        }
        else {
            if (player.stack >= callAmount) {
                actions.push('call');
            }
            if (player.stack > callAmount) {
                actions.push('raise');
            }
        }
        if (player.stack > 0) {
            actions.push('all-in');
        }
        return actions;
    }
    /**
     * Получаем минимальный размер рейза
     */
    getMinRaiseAmount() {
        return Math.max(this.settings.bigBlind, this.gameFlow.getLastBetSize());
    }
    /**
     * Отправляем изменение состояния
     */
    emitStateChange() {
        if (this.onStateChange) {
            this.onStateChange(this.getGameState());
        }
    }
    /**
     * Отправляем игровое событие
     */
    emitGameEvent(event) {
        if (this.onGameEvent) {
            this.onGameEvent(event);
        }
    }
    /**
     * Совместимость с socket сервером - адаптер для makeMove
     */
    makeMove(playerId, move) {
        console.log(`🎲 [POKER ENGINE] makeMove called`, {
            timestamp: new Date().toISOString(),
            gameId: this.gameId,
            playerId,
            move,
            currentStage: this.gameFlow.getStage(),
            currentTurnSeat: this.gameFlow.getCurrentTurnSeat(),
            isHandActive: this.isHandActive
        });
        if (!move || typeof move !== 'object') {
            console.error(`❌ [POKER ENGINE] Invalid move data:`, { move, playerId });
            throw new Error('Invalid move data');
        }
        const actionData = {
            action: move.action,
            amount: move.amount
        };
        console.log(`🔄 [POKER ENGINE] Converted to actionData:`, { actionData, playerId });
        const result = this.playerAction(playerId, actionData);
        if (!result) {
            console.error(`❌ [POKER ENGINE] playerAction returned false:`, {
                playerId,
                actionData,
                currentTurnSeat: this.gameFlow.getCurrentTurnSeat(),
                playerSeat: this.getPlayer(playerId)?.seat
            });
            throw new Error('Invalid move');
        }
        console.log(`✅ [POKER ENGINE] Action executed successfully, getting player state`);
        return this.getPlayerGameState(playerId);
    }
    /**
     * Совместимость с socket сервером - метод для получения состояния для игрока
     */
    getStateForPlayer(playerId) {
        return this.getPlayerGameState(playerId);
    }
    /**
     * Совместимость с socket сервером - проверка валидности хода
     */
    isValidMove(playerId, move) {
        const player = this.getPlayer(playerId);
        if (!player)
            return false;
        if (!move || typeof move !== 'object')
            return false;
        return this.isValidAction(player, {
            action: move.action,
            amount: move.amount
        });
    }
    /**
     * Геттер для типа игры (совместимость)
     */
    get gameType() {
        return 'poker';
    }
    /**
     * Геттер для игроков (совместимость с socket сервером)
     */
    get players() {
        return this._players.map(p => ({
            id: p.id,
            name: p.name,
            seat: p.seat,
            stack: p.stack,
            currentBet: p.currentBet,
            status: p.status,
            hasBoughtIn: p.hasBoughtIn
        }));
    }
    /**
     * Геттер статуса игры (совместимость)
     */
    get status() {
        if (!this.isHandActive) {
            return 'waiting';
        }
        return 'in_progress';
    }
    /**
     * Метод для buy-in игрока (совместимость с socket сервером)
     */
    playerBuyIn(playerId, amount) {
        console.log(`💰 [PokerEngine] Processing buy-in`, {
            timestamp: new Date().toISOString(),
            gameId: this.gameId,
            playerId,
            amount,
            currentPlayers: this._players.length
        });
        let player = this.getPlayer(playerId);
        if (!player) {
            // Игрок не в игре - нужны его данные для добавления
            console.log(`➕ [PokerEngine] Player not in game, need to add first`, {
                timestamp: new Date().toISOString(),
                gameId: this.gameId,
                playerId
            });
            return { success: false, error: 'Player must be added to game first' };
        }
        if (player.hasBoughtIn) {
            return { success: false, error: 'Player already bought in' };
        }
        if (amount <= 0) {
            return { success: false, error: 'Invalid buy-in amount' };
        }
        console.log(`✅ [PokerEngine] Buy-in successful`, {
            timestamp: new Date().toISOString(),
            gameId: this.gameId,
            playerId,
            amount,
            playerSeat: player.seat
        });
        player.stack = amount;
        player.hasBoughtIn = true;
        player.status = 'waiting';
        // Проверяем автостарт
        this.checkAutoStart();
        return { success: true };
    }
    /**
     * Метод для rebuy игрока (совместимость)
     */
    playerRebuy(playerId, amount) {
        const player = this.getPlayer(playerId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }
        if (amount <= 0) {
            return { success: false, error: 'Invalid rebuy amount' };
        }
        player.stack += amount;
        if (player.status === 'busted') {
            player.status = 'waiting';
        }
        return { success: true };
    }
    /**
     * Метод для cash-out игрока (совместимость)
     */
    playerCashOut(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }
        const cashOutAmount = player.stack;
        // Если игрок был в активной раздаче, устанавливаем статус 'folded'
        if (this.isHandActive && player.status === 'playing') {
            player.status = 'folded';
        }
        else {
            player.status = 'busted';
        }
        player.stack = 0;
        player.hasBoughtIn = false;
        return { success: true, cashOutAmount };
    }
    /**
     * Обработка выхода игрока (совместимость)
     */
    handlePlayerLeave(playerId) {
        const player = this.getPlayer(playerId);
        if (!player)
            return;
        // Если игрок в активной раздаче, считаем fold
        if (this.isHandActive && player.status === 'playing') {
            this.playerAction(playerId, { action: 'fold' });
        }
        // Убираем игрока из игры
        this.removePlayer(playerId);
    }
    /**
     * Очистка ресурсов
     */
    cleanup() {
        this.onStateChange = undefined;
        this.onPlayerEvent = undefined;
        this.onGameEvent = undefined;
    }
}
exports.PokerEngine = PokerEngine;
//# sourceMappingURL=PokerEngine.js.map
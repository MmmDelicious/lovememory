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
};

class PokerGame {
    constructor(playersInfo, blinds = { small: 5, big: 10 }, options = {}) {
        this.gameType = 'poker';
        this.onStateChange = typeof options.onStateChange === 'function' ? options.onStateChange : null;
        
        if (!playersInfo || playersInfo.length === 0 || !playersInfo[0].buyInCoins) {
            throw new Error("Player information with buyInCoins is required to start a poker game.");
        }
        this.initialBuyIn = playersInfo[0].buyInCoins;

        this.players = playersInfo.map(p => ({
            id: p.id,
            name: p.name,
            gender: p.gender,
            stack: p.buyInCoins, // 1 фишка = 1 монетка
            hand: [],
            currentBet: 0,
            inHand: true,
            hasActed: false,
            isWaitingToPlay: false,
            isAllIn: false,
        }));
        
        this.blinds = blinds;
        this.dealerPosition = -1;
        this.status = 'in_progress';
        this.lastRaiser = null;
        this.lastRaiseAmount = 0; // Добавляем отслеживание суммы последнего рейза
        this.turnTimeout = null; // Таймаут для хода
        this.turnTimeLimit = 30000; // 30 секунд на ход
        this.startNewHand();
    }

    addPlayer(playerInfo) {
        if (this.players.find(p => p.id === playerInfo.id)) {
            console.warn(`[PokerGame] Player ${playerInfo.name} is already in the game.`);
            return;
        }
        console.log(`[PokerGame] Adding new player ${playerInfo.name} as an observer.`);
        this.players.push({
            id: playerInfo.id,
            name: playerInfo.name,
            gender: playerInfo.gender,
            stack: playerInfo.buyInCoins, // 1 фишка = 1 монетка
            hand: [],
            currentBet: 0,
            inHand: false,
            hasActed: false,
            isWaitingToPlay: true,
            isAllIn: false,
        });
    }

    startNewHand() {
        this._clearTurnTimeout(); // Очищаем таймаут при начале новой раздачи
        
        this.players.forEach(p => {
            if (p.isWaitingToPlay) {
                p.isWaitingToPlay = false;
            }
            p.hand = [];
            p.currentBet = 0;
            p.inHand = p.stack > 0;
            p.hasActed = false;
            p.isAllIn = false;
        });

        const activePlayers = this.players.filter(p => p.inHand);
        if (activePlayers.length < 2) {
            console.log('[PokerGame] Not enough active players to start a new hand. Game over.');
            this.status = 'finished';
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
        if (playerIndex !== this.currentPlayerIndex) throw new Error("Not your turn.");
        
        const player = this.players[playerIndex];
        if (!player.inHand) throw new Error("Player is not in hand.");
        
        const { action, value } = move;
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
                    this.makeMove(currentPlayer.id, { action: 'check' });
                } catch (e) {
                    console.warn('[PokerGame] Auto-check failed, falling back to fold:', e.message);
                    currentPlayer.inHand = false;
                    currentPlayer.hasActed = true;
                    this._advanceTurn();
                }
            } else {
                try {
                    this.makeMove(currentPlayer.id, { action: 'fold' });
                } catch (e) {
                    console.warn('[PokerGame] Auto-fold failed:', e.message);
                    currentPlayer.inHand = false;
                    currentPlayer.hasActed = true;
                    this._advanceTurn();
                }
            }

            // Уведомляем слушателей об изменении состояния (для рассылки клиентам)
            if (this.onStateChange) {
                try { this.onStateChange(this); } catch (e) { console.warn('[PokerGame] onStateChange handler error:', e.message); }
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
            return this._endHand();
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

    _endHand() {
        this._clearTurnTimeout(); // Очищаем таймаут
        this._collectBets();
        const winnersInfo = this._determineWinners();
        this._awardPot(winnersInfo);
        this.status = 'finished';
        this.winnersInfo = winnersInfo;
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
        
        const hands = contenders.map(p => {
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
        if (this.sidePots.length > 0) return; // Уже созданы

        const activePlayers = this.players.filter(p => p.inHand);
        if (activePlayers.length <= 1) return;

        // Проверяем, есть ли алл-ин
        const allInPlayers = activePlayers.filter(p => p.isAllIn);
        if (allInPlayers.length === 0) return;

        // Сортируем игроков по размеру их ставок
        const sortedPlayers = [...activePlayers].sort((a, b) => a.currentBet - b.currentBet);
        
        let remainingPot = 0;
        let lastBet = 0;

        sortedPlayers.forEach(player => {
            const currentBet = player.currentBet;
            if (currentBet > lastBet) {
                // Создаем side pot для ставок от lastBet до currentBet
                const sidePotAmount = (currentBet - lastBet) * sortedPlayers.filter(p => p.currentBet >= currentBet).length;
                
                if (sidePotAmount > 0) {
                    this.sidePots.push({
                        amount: sidePotAmount,
                        eligiblePlayers: sortedPlayers.filter(p => p.currentBet >= currentBet).map(p => p.id)
                    });
                }
                
                lastBet = currentBet;
            }
        });

        // Основной пот для оставшихся ставок
        remainingPot = this.players.reduce((total, p) => total + p.currentBet, 0);
        if (remainingPot > 0) {
            this.pot = remainingPot;
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
        for(let i=0; i<count; i++) this.communityCards.push(this.deck.pop()); 
    }
    
    _createDeck() { 
        const s='HDCS',r='23456789TJQKA'; 
        return r.split('').flatMap(rank=>s.split('').map(suit=>({rank,suit}))); 
    }
    
    _shuffleDeck() { 
        for (let i=this.deck.length-1;i>0;i--) { 
            const j=Math.floor(Math.random()*(i+1));
            [this.deck[i],this.deck[j]]=[this.deck[j],this.deck[i]];
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
        if (!player || player.id !== this.players[this.currentPlayerIndex]?.id) return { actions: [] };
        
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
        
        let visibleHands = [];
        if (state.stage === STAGES.SHOWDOWN || state.status === 'finished') {
            visibleHands = this.players
                .filter(p => p.inHand || (this.winnersInfo && this.winnersInfo.some(w => w.player.id === p.id)))
                .map(p => ({ playerId: p.id, hand: p.hand }));
        }

        // Получаем разрешенные действия для текущего игрока
        const allowedActions = this.getCurrentPlayer()?.id === playerId && !player?.isWaitingToPlay ? 
            this._getAllowedActions(player) : { actions: [], minRaise: 0 };

        return {
            ...state,
            yourHand: player ? player.hand : [],
            yourStack: player ? player.stack : 0,
            yourCurrentBet: player ? player.currentBet : 0,
            isObserving: player ? player.isWaitingToPlay : false,
            canMakeAction: this.getCurrentPlayer()?.id === playerId && !player?.isWaitingToPlay,
            validActions: allowedActions.actions || [],
            minRaiseAmount: allowedActions.minRaise || 0,
            maxRaiseAmount: allowedActions.maxRaise || 0,
            callAmount: allowedActions.callAmount || 0,
            initialBuyIn: this.initialBuyIn,
            winningHandCards: this.winnersInfo ? this.winnersInfo.flatMap(w => w.handCards || []) : [],
            visibleHands: visibleHands
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
                cards: p.hand // Для совместимости с клиентом
            })),
            currentPlayerId: this.status === 'in_progress' && currentPlayer ? currentPlayer.id : null,
            winner: winner,
            isDraw: this.winnersInfo ? this.winnersInfo.length > 1 : false,
            stage: this.stage,
            pot: this.pot,
            communityCards: this.communityCards || [],
            winnersInfo: this.winnersInfo
        };
    }

    getCurrentPlayer() { return this.players[this.currentPlayerIndex] || null; }
    getValidActions() { const p = this.getCurrentPlayer(); return p ? (this._getAllowedActions(p).actions || []) : []; }
    cleanup() { 
        this._clearTurnTimeout(); // Очищаем таймаут при завершении игры
        console.log(`[POKER] Game cleanup completed`); 
    }
}

module.exports = PokerGame;
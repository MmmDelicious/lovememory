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
    constructor(players, initialStacks, blinds = { small: 5, big: 10 }) {
        console.log('[PokerGame] Creating new poker game with players:', players.map(p => p.name));
        this.gameType = 'poker';
        this.players = players.map(p => ({
            id: p.id,
            name: p.name,
            stack: initialStacks[p.id] || 1000,
            hand: [],
            currentBet: 0,
            inHand: true,
            hasActed: false, // Re-introducing this flag for robust turn management
        }));
        
        this.blinds = blinds;
        this.dealerPosition = -1;
        this.status = 'in_progress';
        console.log('[PokerGame] Starting new hand...');
        this.startNewHand();
        console.log('[PokerGame] Poker game initialized successfully');
    }

    startNewHand() {
        this.status = 'in_progress';
        this.winnersInfo = null;
        this.deck = this._createDeck();
        this._shuffleDeck();
        
        this.communityCards = [];
        this.pot = 0;
        this.sidePots = [];
        this.stage = STAGES.PRE_FLOP;
        
        this.dealerPosition = (this.dealerPosition + 1) % this.players.length;
        this.currentPlayerIndex = 0; // Инициализируем индекс текущего игрока

        this.players.forEach(p => {
            p.hand = [];
            p.currentBet = 0;
            p.inHand = true;
            p.hasActed = false;
        });

        this.lastAction = null;
        this.lastRaiser = null;
        this._dealCards();
        this._postBlindsAndStartBetting();
    }

    makeMove(playerId, move) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex !== this.currentPlayerIndex) throw new Error("Not your turn.");
        
        const player = this.players[playerIndex];
        const { action, value } = move;
        const allowed = this._getAllowedActions(player);

        if (!allowed.actions.includes(action)) throw new Error(`Action ${action} is not allowed.`);

        switch (action) {
            case ACTIONS.FOLD:
                player.inHand = false;
                break;
            case ACTIONS.CHECK:
                break;
            case ACTIONS.CALL:
                this._postBet(player, allowed.callAmount);
                break;
            case ACTIONS.RAISE:
                if (value < allowed.minRaise || value > allowed.maxRaise) {
                    throw new Error(`Raise amount ${value} is out of range [${allowed.minRaise}, ${allowed.maxRaise}].`);
                }
                this._postBet(player, value - player.currentBet);
                this.lastRaiser = player;
                // Since there's a new bet/raise, all other players must act again.
                this.players.forEach(p => {
                    if (p.id !== player.id && p.inHand && p.stack > 0) {
                        p.hasActed = false;
                    }
                });
                break;
            case ACTIONS.BET:
                 this._postBet(player, value);
                 this.lastRaiser = player;
                 // Since there's a new bet/raise, all other players must act again.
                this.players.forEach(p => {
                    if (p.id !== player.id && p.inHand && p.stack > 0) {
                        p.hasActed = false;
                    }
                });
                 break;
        }

        player.hasActed = true;
        this.lastAction = action;
        this._advanceTurn();
    }

    _advanceTurn() {
        if (this.players.filter(p => p.inHand).length <= 1) {
            return this._endHand();
        }

        const activePlayers = this.players.filter(p => p.inHand && p.stack > 0);
        const allHaveActed = activePlayers.every(p => p.hasActed);

        if (allHaveActed) {
            return this._endBettingRound();
        }
        
        this.currentPlayerIndex = this._getPlayerAfterIndex(this.currentPlayerIndex);
    }
    
    _endBettingRound() {
        this._collectBets();

        if (this.players.filter(p => p.inHand).length <= 1) return this._endHand();
        
        if (this.stage === STAGES.RIVER) {
            this.stage = STAGES.SHOWDOWN;
            return this._endHand();
        }

        // --- Advance stage ---
        this.stage = this.stage === STAGES.PRE_FLOP ? STAGES.FLOP :
                     this.stage === STAGES.FLOP ? STAGES.TURN : STAGES.RIVER;
        
        if (this.stage === STAGES.FLOP) this._dealCommunityCards(3);
        else this._dealCommunityCards(1);

        // --- Reset for next betting round ---
        this.lastRaiser = null;
        this.players.forEach(p => {
            if (p.inHand) p.hasActed = false;
        });

        this.currentPlayerIndex = this._getPlayerAfterIndex(this.dealerPosition);
        this.firstToAct = this.players[this.currentPlayerIndex];

        // If remaining players are all-in, auto-deal to the end
        if (this.players.filter(p => p.inHand && p.stack > 0).length < 2) {
             this._endBettingRound();
        }
    }

    _endHand() {
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
                handCards: [],
                pot: this.pot
            }];
        }
        
        const hands = contenders.map(p => {
            const cardStrings = p.hand.map(c => c.rank + c.suit.toLowerCase())
                .concat(this.communityCards.map(c => c.rank + c.suit.toLowerCase()));
            
            const solvedHand = Hand.solve(cardStrings);
            solvedHand.player = p;
            return solvedHand;
        });

        const winningHands = Hand.winners(hands);

        return winningHands.map(h => {
            const winner = this.players.find(p => p.id === h.player.id);
            const winningCardStrings = h.cards.map(c => ({ rank: c.value, suit: c.suit.toUpperCase() }));
            
            return {
                player: winner,
                handName: h.name,
                handCards: winningCardStrings,
                pot: this.pot / winningHands.length
            };
        });
    }

    _awardPot(winners) {
        winners.forEach(winnerInfo => {
            const player = this.players.find(p => p.id === winnerInfo.player.id);
            if (player) player.stack += winnerInfo.pot;
        });
    }

    _collectBets() {
        // Simplified: just add to main pot.
        this.players.forEach(p => {
            this.pot += p.currentBet;
            p.currentBet = 0;
        });
    }
    
    _postBlindsAndStartBetting() {
        // В хедз-ап покере (2 игрока): дилер ставит малый блайнд, второй игрок - большой блайнд
        const smallBlindIndex = this._getPlayerAfterIndex(this.dealerPosition, false);
        const bigBlindIndex = this._getPlayerAfterIndex(smallBlindIndex, false);
        
        const smallBlindPlayer = this.players[smallBlindIndex];
        const bigBlindPlayer = this.players[bigBlindIndex];
        
        console.log(`[PokerGame] Posting blinds. Small blind (${this.blinds.small}): ${smallBlindPlayer.name}, Big blind (${this.blinds.big}): ${bigBlindPlayer.name}`);
        
        this._postBet(smallBlindPlayer, this.blinds.small);
        this._postBet(bigBlindPlayer, this.blinds.big);
        
        this.lastRaiser = bigBlindPlayer;
        // Ход начинается с игрока после большого блайнда (в хедз-ап это снова малый блайнд)
        this.currentPlayerIndex = smallBlindIndex;
        this.firstToAct = this.players[this.currentPlayerIndex];
        
        console.log(`[PokerGame] Current player to act: ${this.players[this.currentPlayerIndex].name}`);
    }

    _postBet(player, amount) {
        const actualAmount = Math.min(amount, player.stack);
        player.stack -= actualAmount;
        player.currentBet += actualAmount;
    }

    _dealCards() { this.players.forEach(p => { p.hand = [this.deck.pop(), this.deck.pop()] }); }
    _dealCommunityCards(count) { for(let i=0; i<count; i++) this.communityCards.push(this.deck.pop()); }
    _createDeck() { const s='HDCS',r='23456789TJQKA'; return r.split('').flatMap(rank=>s.split('').map(suit=>({rank,suit}))); }
    _shuffleDeck() { for (let i=this.deck.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1));[this.deck[i],this.deck[j]]=[this.deck[j],this.deck[i]];} }
    _getPlayerAfterIndex(startIndex, inHandOnly = true) {
        if (this.players.length === 0) return 0;
        
        let index = startIndex;
        let attempts = 0;
        const maxAttempts = this.players.length;
        
        do {
            index = (index + 1) % this.players.length;
            attempts++;
            if (attempts >= maxAttempts) break; // Защита от бесконечного цикла
        } while (inHandOnly && this.players[index] && !this.players[index].inHand);
        
        return index;
    }

    _getAllowedActions(player) {
        if (!player || this.currentPlayerIndex === undefined || 
            !this.players[this.currentPlayerIndex] || 
            player.id !== this.players[this.currentPlayerIndex].id) {
            return { actions: [] };
        }

        const maxBet = Math.max(...this.players.map(p => p.currentBet));
        const canRaise = player.stack > 0;
        let actions = [];
        
        if (maxBet > player.currentBet) {
            actions.push('fold');
            // Can call if they have enough stack, otherwise it's an all-in call
            actions.push('call'); 
            // Can raise if they have more than the call amount
            if (player.stack > maxBet - player.currentBet) {
                actions.push('raise');
            }
        } else {
            actions.push('check');
            // Can bet if stack is available. We'll send 'raise' as the client expects it.
            if(canRaise) actions.push('raise');
        }

        const callAmount = Math.min(maxBet - player.currentBet, player.stack);
        // В No-Limit минимальный рейз равен размеру последнего рейза. Если рейза не было, то большой блайнд.
        const lastRaiseAmount = this.lastRaiser ? maxBet - (this.lastRaiser.currentBet - maxBet) : this.blinds.big;
        const minRaise = Math.min(maxBet + Math.max(lastRaiseAmount, this.blinds.big), player.stack + player.currentBet);

        return {
            actions,
            callAmount,
            minRaise,
            maxRaise: player.stack + player.currentBet
        };
    }

    getStateForPlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);
        const allowed = this._getAllowedActions(player);
        const winnersInfo = this.winnersInfo;
        
        let winningHandCards = [];
        if (winnersInfo) {
            winningHandCards = winnersInfo.flatMap(info => info.handCards);
        }

        // Защита от неопределенного currentPlayerIndex
        const currentPlayer = this.currentPlayerIndex !== undefined && this.players[this.currentPlayerIndex] ?
            this.players[this.currentPlayerIndex] : null;

        return {
            gameType: this.gameType,
            stage: this.stage,
            pot: this.pot,
            communityCards: this.communityCards,
            currentPlayerId: currentPlayer ? currentPlayer.id : null,
            allowedActions: allowed.actions,
            minRaiseAmount: allowed.minRaise,
            currentBet: Math.max(...this.players.map(p => p.currentBet)),
            status: this.status,
            winnersInfo: this.winnersInfo || null,
            winningHandCards: winningHandCards,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                stack: p.stack,
                currentBet: p.currentBet,
                inHand: p.inHand,
                isDealer: this.players.indexOf(p) === this.dealerPosition,
                hand: p.id === playerId || this.stage === 'showdown' ? p.hand : [{}, {}]
            }))
        };
    }

    // Добавляю метод getState() для совместимости с другими играми
    getState() {
        const winner = this.winnersInfo && this.winnersInfo.length > 0 ? 
            (this.winnersInfo.length === 1 ? this.winnersInfo[0].player : 'draw') : null;
        
        // Защита от неопределенного currentPlayerIndex
        const currentPlayer = this.currentPlayerIndex !== undefined && this.players[this.currentPlayerIndex] ?
            this.players[this.currentPlayerIndex] : null;
            
        return {
            gameType: this.gameType,
            status: this.status,
            players: this.players.map(p => p.id),
            currentPlayerId: this.status === 'in_progress' && currentPlayer ? currentPlayer.id : null,
            winner: winner,
            isDraw: this.winnersInfo ? this.winnersInfo.length > 1 : false,
            stage: this.stage,
            pot: this.pot,
            winnersInfo: this.winnersInfo
        };
    }
}

module.exports = PokerGame; 
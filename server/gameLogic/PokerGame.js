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
    constructor(playersInfo, blinds = { small: 5, big: 10 }) {
        this.gameType = 'poker';
        
        if (!playersInfo || playersInfo.length === 0 || !playersInfo[0].buyInCoins) {
            throw new Error("Player information with buyInCoins is required to start a poker game.");
        }
        this.initialBuyIn = playersInfo[0].buyInCoins;

        this.players = playersInfo.map(p => ({
            id: p.id,
            name: p.name,
            gender: p.gender,
            stack: p.buyInCoins * 10,
            hand: [],
            currentBet: 0,
            inHand: true,
            hasActed: false,
            isWaitingToPlay: false,
        }));
        
        this.blinds = blinds;
        this.dealerPosition = -1;
        this.status = 'in_progress';
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
            stack: playerInfo.buyInCoins * 10,
            hand: [],
            currentBet: 0,
            inHand: false,
            hasActed: false,
            isWaitingToPlay: true,
        });
    }

    startNewHand() {
        this.players.forEach(p => {
            if (p.isWaitingToPlay) {
                p.isWaitingToPlay = false;
            }
            p.hand = [];
            p.currentBet = 0;
            p.inHand = p.stack > 0;
            p.hasActed = false;
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
                this.players.forEach(p => {
                    if (p.id !== player.id && p.inHand && p.stack > 0) {
                        p.hasActed = false;
                    }
                });
                break;
            case ACTIONS.BET:
                 this._postBet(player, value);
                 this.lastRaiser = player;
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
        if (this.players.filter(p => p.inHand).length <= 1) return this._endHand();
        const activePlayers = this.players.filter(p => p.inHand && p.stack > 0);
        if (activePlayers.every(p => p.hasActed)) return this._endBettingRound();
        this.currentPlayerIndex = this._getPlayerAfterIndex(this.currentPlayerIndex);
    }
    
    _endBettingRound() {
        this._collectBets();
        if (this.players.filter(p => p.inHand).length <= 1) return this._endHand();
        if (this.stage === STAGES.RIVER) {
            this.stage = STAGES.SHOWDOWN;
            return this._endHand();
        }
        this.stage = this.stage === STAGES.PRE_FLOP ? STAGES.FLOP : this.stage === STAGES.FLOP ? STAGES.TURN : STAGES.RIVER;
        if (this.stage === STAGES.FLOP) this._dealCommunityCards(3);
        else this._dealCommunityCards(1);
        this.lastRaiser = null;
        this.players.forEach(p => { if (p.inHand) p.hasActed = false; });
        this.currentPlayerIndex = this._getPlayerAfterIndex(this.dealerPosition);
        if (this.players.filter(p => p.inHand && p.stack > 0).length < 2) this._endBettingRound();
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
        if (contenders.length === 1) return [{ player: contenders[0], handName: "the pot", handCards: [], pot: this.pot }];
        const hands = contenders.map(p => {
            const cardStrings = p.hand.map(c => c.rank + c.suit.toLowerCase()).concat(this.communityCards.map(c => c.rank + c.suit.toLowerCase()));
            const solvedHand = Hand.solve(cardStrings);
            solvedHand.player = p;
            return solvedHand;
        });
        const winningHands = Hand.winners(hands);
        return winningHands.map(h => ({ player: this.players.find(p => p.id === h.player.id), handName: h.name, handCards: h.cards.map(c => ({ rank: c.value, suit: c.suit.toUpperCase() })), pot: this.pot / winningHands.length }));
    }

    _awardPot(winners) { winners.forEach(info => { const p = this.players.find(p => p.id === info.player.id); if (p) p.stack += info.pot; }); }
    _collectBets() { this.players.forEach(p => { this.pot += p.currentBet; p.currentBet = 0; }); }
    
    _postBlindsAndStartBetting() {
        const smallBlindIndex = this._getPlayerAfterIndex(this.dealerPosition, false);
        const bigBlindIndex = this._getPlayerAfterIndex(smallBlindIndex, false);
        const smallBlindPlayer = this.players[smallBlindIndex];
        const bigBlindPlayer = this.players[bigBlindIndex];
        this._postBet(smallBlindPlayer, this.blinds.small);
        this._postBet(bigBlindPlayer, this.blinds.big);
        this.pot = this.players.reduce((total, p) => total + p.currentBet, 0);
        this.lastRaiser = bigBlindPlayer;
        this.currentPlayerIndex = this._getPlayerAfterIndex(bigBlindIndex);
    }

    _postBet(player, amount) {
        const actualAmount = Math.min(amount, player.stack);
        player.stack -= actualAmount;
        player.currentBet += actualAmount;
    }

    _dealCards() { this.players.forEach(p => { if (p.inHand) p.hand = [this.deck.pop(), this.deck.pop()]; }); }
    _dealCommunityCards(count) { for(let i=0; i<count; i++) this.communityCards.push(this.deck.pop()); }
    _createDeck() { const s='HDCS',r='23456789TJQKA'; return r.split('').flatMap(rank=>s.split('').map(suit=>({rank,suit}))); }
    _shuffleDeck() { for (let i=this.deck.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1));[this.deck[i],this.deck[j]]=[this.deck[j],this.deck[i]];} }
    
    _getPlayerAfterIndex(startIndex, inHandOnly = true) {
        if (this.players.length === 0) return 0;
        let index = startIndex;
        let attempts = 0;
        do {
            index = (index + 1) % this.players.length;
            const player = this.players[index];
            if (inHandOnly && player && !player.inHand) continue;
            if (player && player.stack === 0) continue; 
            return index;
        } while (++attempts < this.players.length * 2);
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
        let minRaise;
        if (this.lastRaiser) minRaise = maxBet + (maxBet - this.lastRaiser.currentBet);
        else minRaise = maxBet + this.blinds.big;
        minRaise = Math.max(minRaise, player.currentBet + 1);
        return { actions, callAmount, minRaise, maxRaise: player.stack + player.currentBet };
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

        return {
            ...state,
            yourHand: player ? player.hand : [],
            yourStack: player ? player.stack : 0,
            yourCurrentBet: player ? player.currentBet : 0,
            isObserving: player ? player.isWaitingToPlay : false,
            canMakeAction: this.getCurrentPlayer()?.id === playerId && !player?.isWaitingToPlay,
            validActions: this.getCurrentPlayer()?.id === playerId && !player?.isWaitingToPlay ? this.getValidActions() : [],
            winningHandCards: this.winnersInfo ? this.winnersInfo.flatMap(w => w.handCards || []) : [],
            visibleHands: visibleHands
        };
    }

    getState() {
        const winner = this.winnersInfo && this.winnersInfo.length > 0 ? (this.winnersInfo.length === 1 ? this.winnersInfo[0].player : 'draw') : null;
        const currentPlayer = this.players[this.currentPlayerIndex];
        return {
            gameType: this.gameType,
            status: this.status,
            players: this.players.map(p => ({ id: p.id, name: p.name, gender: p.gender, stack: p.stack, currentBet: p.currentBet, inHand: p.inHand, hasActed: p.hasActed, isWaitingToPlay: p.isWaitingToPlay })),
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
    cleanup() { console.log(`[POKER] Game cleanup completed`); }
}

module.exports = PokerGame;
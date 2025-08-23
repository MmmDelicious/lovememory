class TicTacToeGame {
  constructor(players) {
    this.players = players; // [player1_id, player2_id]
    this.symbols = {
      [players[0]]: 'X',
      [players[1]]: 'O',
    };
    this.board = Array(9).fill(null);
    this.currentPlayerId = players[0];
    this.status = 'in_progress';
    this.winner = null;
    this.isDraw = false;
    this.gameType = 'tic-tac-toe'; // Критически важное поле
  }
  getCurrentPlayerId() {
    return this.status === 'in_progress' ? this.currentPlayerId : null;
  }
  getState() {
    return {
      gameType: this.gameType,
      status: this.status,
      players: this.players,
      currentPlayerId: this.getCurrentPlayerId(),
      winner: this.winner,
      isDraw: this.isDraw,
      board: this.board,
      symbols: this.symbols,
    };
  }
  makeMove(playerId, moveIndex) {
    if (moveIndex < 0 || moveIndex >= 9) {
      throw new Error('Invalid move position');
    }
    if (this.status !== 'in_progress') {
      throw new Error('Game is already over');
    }
    if (this.currentPlayerId !== playerId) {
      throw new Error('Not your turn');
    }
    if (this.board[moveIndex] !== null) {
      throw new Error('Cell is already taken');
    }
    this.board[moveIndex] = this.symbols[playerId];
    const winnerSymbol = this._checkWinner();
    if (winnerSymbol) {
      this.status = 'finished';
      if (winnerSymbol === 'draw') {
        this.winner = 'draw';
        this.isDraw = true;
      } else {
        this.winner = Object.keys(this.symbols).find(id => this.symbols[id] === winnerSymbol);
      }
    } else {
      this.currentPlayerId = this.players.find(id => id !== playerId);
    }
    return this.getState();
  }
  _checkWinner() {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return this.board[a]; // Возвращает 'X' или 'O'
      }
    }
    const hasEmptyCells = this.board.includes(null);
    return hasEmptyCells ? null : 'draw';
  }
  cleanup() {
  }
}
module.exports = TicTacToeGame;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamGame = void 0;
const BaseGame_1 = require("./BaseGame");
/**
 * Абстрактный класс для командных игр
 * Добавляет логику управления командами и командными счетами
 */
class TeamGame extends BaseGame_1.BaseGame {
    constructor() {
        super(...arguments);
        this._teams = [];
        this._teamScores = {};
    }
    // Геттеры
    get teams() {
        return [...this._teams];
    }
    get currentTeam() {
        return this._currentTeam;
    }
    get teamScores() {
        return { ...this._teamScores };
    }
    // Переопределяем добавление игрока
    addPlayer(player) {
        const result = super.addPlayer(player);
        // Автоматически назначаем игрока в команду
        this._assignPlayerToTeam(player);
        return result;
    }
    // Переопределяем удаление игрока
    removePlayer(playerId) {
        // Удаляем игрока из команды
        this._removePlayerFromTeam(playerId);
        return super.removePlayer(playerId);
    }
    // Управление командами
    _assignPlayerToTeam(player) {
        // Инициализируем команды, если нужно
        if (this._teams.length === 0) {
            this._initializeTeams();
        }
        // Находим команду с наименьшим количеством игроков
        const targetTeam = this._teams.reduce((minTeam, team) => team.players.length < minTeam.players.length ? team : minTeam);
        // Проверяем, что команда не полная
        if (targetTeam.players.length >= this._playersPerTeam) {
            throw new Error('All teams are full');
        }
        targetTeam.players.push(player);
        this._emitEvent({
            type: 'player_assigned_to_team',
            playerId: player.id,
            data: { teamId: targetTeam.id, teamName: targetTeam.name },
            timestamp: new Date()
        });
    }
    _removePlayerFromTeam(playerId) {
        for (const team of this._teams) {
            const playerIndex = team.players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                team.players.splice(playerIndex, 1);
                this._emitEvent({
                    type: 'player_removed_from_team',
                    playerId: playerId,
                    data: { teamId: team.id, teamName: team.name },
                    timestamp: new Date()
                });
                break;
            }
        }
    }
    _initializeTeams() {
        this._teams = [];
        this._teamScores = {};
        for (let i = 0; i < this._teamsCount; i++) {
            const teamId = `team${i + 1}`;
            const team = {
                id: teamId,
                name: this._getTeamName(i),
                color: this._getTeamColor(i),
                players: [],
                score: 0
            };
            this._teams.push(team);
            this._teamScores[teamId] = 0;
        }
    }
    _getTeamName(index) {
        const names = ['Красная команда', 'Синяя команда', 'Зеленая команда', 'Желтая команда'];
        return names[index] || `Команда ${index + 1}`;
    }
    _getTeamColor(index) {
        const colors = ['red', 'blue', 'green', 'yellow'];
        return colors[index] || 'gray';
    }
    // Работа со счетом команд
    addTeamScore(teamId, points) {
        if (!this._teamScores.hasOwnProperty(teamId)) {
            throw new Error(`Team ${teamId} not found`);
        }
        this._teamScores[teamId] += points;
        // Обновляем счет в объекте команды
        const team = this._teams.find(t => t.id === teamId);
        if (team) {
            team.score = this._teamScores[teamId];
        }
        this._emitEvent({
            type: 'team_score_changed',
            data: {
                teamId,
                newScore: this._teamScores[teamId],
                pointsAdded: points
            },
            timestamp: new Date()
        });
    }
    setTeamScore(teamId, score) {
        if (!this._teamScores.hasOwnProperty(teamId)) {
            throw new Error(`Team ${teamId} not found`);
        }
        const oldScore = this._teamScores[teamId];
        this._teamScores[teamId] = score;
        // Обновляем счет в объекте команды
        const team = this._teams.find(t => t.id === teamId);
        if (team) {
            team.score = score;
        }
        this._emitEvent({
            type: 'team_score_changed',
            data: {
                teamId,
                newScore: score,
                oldScore
            },
            timestamp: new Date()
        });
    }
    // Утилитарные методы для команд
    getPlayerTeam(playerId) {
        return this._teams.find(team => team.players.some(player => player.id === playerId)) || null;
    }
    getTeammates(playerId) {
        const team = this.getPlayerTeam(playerId);
        return team ? team.players.filter(p => p.id !== playerId) : [];
    }
    isTeamFull(teamId) {
        const team = this._teams.find(t => t.id === teamId);
        return team ? team.players.length >= this._playersPerTeam : false;
    }
    areAllTeamsFull() {
        return this._teams.every(team => team.players.length >= this._playersPerTeam);
    }
    getWinningTeam() {
        if (this._teams.length === 0)
            return null;
        const maxScore = Math.max(...Object.values(this._teamScores));
        const winningTeams = this._teams.filter(team => this._teamScores[team.id] === maxScore);
        return winningTeams.length === 1 ? winningTeams[0] : null;
    }
    getTeamRanking() {
        return [...this._teams].sort((a, b) => this._teamScores[b.id] - this._teamScores[a.id]);
    }
    // Переопределяем проверку автостарта
    _checkAutoStart() {
        if (this._status === 'waiting' &&
            this.areAllTeamsFull() &&
            this._players.every(p => p.ready)) {
            this.startGame();
        }
    }
    // Переопределяем инициализацию
    _initializeGame() {
        super._initializeGame();
        // Выбираем начинающую команду
        this._currentTeam = this._chooseStartingTeam();
        this._emitEvent({
            type: 'team_turn_started',
            data: { teamId: this._currentTeam },
            timestamp: new Date()
        });
    }
    _chooseStartingTeam() {
        // По умолчанию - случайная команда
        return this._teams[Math.floor(Math.random() * this._teams.length)].id;
    }
    _nextTeamTurn() {
        if (!this._currentTeam || this._teams.length === 0)
            return;
        const currentIndex = this._teams.findIndex(t => t.id === this._currentTeam);
        const nextIndex = (currentIndex + 1) % this._teams.length;
        this._currentTeam = this._teams[nextIndex].id;
        this._emitEvent({
            type: 'team_turn_changed',
            data: {
                previousTeam: this._teams[currentIndex].id,
                currentTeam: this._currentTeam
            },
            timestamp: new Date()
        });
    }
    // Переопределяем getState для добавления командной информации
    _getTeamGameState() {
        return {
            ...this._getBaseState(),
            teams: this.teams,
            currentTeam: this._currentTeam,
            teamScores: this.teamScores
        };
    }
    // Валидация для командных игр
    _validateTeamMove(playerId, expectedTeam) {
        this._validatePlayerMove(playerId);
        const playerTeam = this.getPlayerTeam(playerId);
        if (!playerTeam) {
            throw new Error('Player is not in any team');
        }
        if (expectedTeam && playerTeam.id !== expectedTeam) {
            throw new Error(`Expected player from team ${expectedTeam}, but got ${playerTeam.id}`);
        }
    }
    _isPlayerInTeam(playerId, teamId) {
        const team = this._teams.find(t => t.id === teamId);
        return team ? team.players.some(p => p.id === playerId) : false;
    }
}
exports.TeamGame = TeamGame;
//# sourceMappingURL=TeamGame.js.map
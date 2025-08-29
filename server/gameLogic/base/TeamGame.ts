import { BaseGame } from './BaseGame';
import { GameTypes, IPlayer, ITeam } from '../../types/game.interfaces';

/**
 * Абстрактный класс для командных игр
 * Добавляет логику управления командами и командными счетами
 */
export abstract class TeamGame<TState extends GameTypes.ITeamGameState = GameTypes.ITeamGameState, TMove = any> 
  extends BaseGame<TState, TMove> {
  
  protected _teams: ITeam[] = [];
  protected _currentTeam?: string;
  protected _teamScores: Record<string, number> = {};
  
  // Абстрактные свойства для переопределения в наследниках
  protected abstract readonly _teamsCount: number;
  protected abstract readonly _playersPerTeam: number;
  
  // Геттеры
  public get teams(): ITeam[] {
    return [...this._teams];
  }
  
  public get currentTeam(): string | undefined {
    return this._currentTeam;
  }
  
  public get teamScores(): Record<string, number> {
    return { ...this._teamScores };
  }
  
  // Переопределяем добавление игрока
  public addPlayer(player: IPlayer): TState {
    const result = super.addPlayer(player);
    
    // Автоматически назначаем игрока в команду
    this._assignPlayerToTeam(player);
    
    return result;
  }
  
  // Переопределяем удаление игрока
  public removePlayer(playerId: string): TState {
    // Удаляем игрока из команды
    this._removePlayerFromTeam(playerId);
    
    return super.removePlayer(playerId);
  }
  
  // Управление командами
  protected _assignPlayerToTeam(player: IPlayer): void {
    // Инициализируем команды, если нужно
    if (this._teams.length === 0) {
      this._initializeTeams();
    }
    
    // Находим команду с наименьшим количеством игроков
    const targetTeam = this._teams.reduce((minTeam, team) => 
      team.players.length < minTeam.players.length ? team : minTeam
    );
    
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
  
  protected _removePlayerFromTeam(playerId: string): void {
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
  
  protected _initializeTeams(): void {
    this._teams = [];
    this._teamScores = {};
    
    for (let i = 0; i < this._teamsCount; i++) {
      const teamId = `team${i + 1}`;
      const team: ITeam = {
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
  
  protected _getTeamName(index: number): string {
    const names = ['Красная команда', 'Синяя команда', 'Зеленая команда', 'Желтая команда'];
    return names[index] || `Команда ${index + 1}`;
  }
  
  protected _getTeamColor(index: number): string {
    const colors = ['red', 'blue', 'green', 'yellow'];
    return colors[index] || 'gray';
  }
  
  // Работа со счетом команд
  public addTeamScore(teamId: string, points: number): void {
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
  
  public setTeamScore(teamId: string, score: number): void {
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
  public getPlayerTeam(playerId: string): ITeam | null {
    return this._teams.find(team => 
      team.players.some(player => player.id === playerId)
    ) || null;
  }
  
  public getTeammates(playerId: string): IPlayer[] {
    const team = this.getPlayerTeam(playerId);
    return team ? team.players.filter(p => p.id !== playerId) : [];
  }
  
  public isTeamFull(teamId: string): boolean {
    const team = this._teams.find(t => t.id === teamId);
    return team ? team.players.length >= this._playersPerTeam : false;
  }
  
  public areAllTeamsFull(): boolean {
    return this._teams.every(team => team.players.length >= this._playersPerTeam);
  }
  
  public getWinningTeam(): ITeam | null {
    if (this._teams.length === 0) return null;
    
    const maxScore = Math.max(...Object.values(this._teamScores));
    const winningTeams = this._teams.filter(team => this._teamScores[team.id] === maxScore);
    
    return winningTeams.length === 1 ? winningTeams[0] : null;
  }
  
  public getTeamRanking(): ITeam[] {
    return [...this._teams].sort((a, b) => this._teamScores[b.id] - this._teamScores[a.id]);
  }
  
  // Переопределяем проверку автостарта
  protected _checkAutoStart(): void {
    if (this._status === 'waiting' && 
        this.areAllTeamsFull() &&
        this._players.every(p => p.ready)) {
      this.startGame();
    }
  }
  
  // Переопределяем инициализацию
  protected _initializeGame(): void {
    super._initializeGame();
    
    // Выбираем начинающую команду
    this._currentTeam = this._chooseStartingTeam();
    
    this._emitEvent({
      type: 'team_turn_started',
      data: { teamId: this._currentTeam },
      timestamp: new Date()
    });
  }
  
  protected _chooseStartingTeam(): string {
    // По умолчанию - случайная команда
    return this._teams[Math.floor(Math.random() * this._teams.length)].id;
  }
  
  protected _nextTeamTurn(): void {
    if (!this._currentTeam || this._teams.length === 0) return;
    
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
  protected _getTeamGameState(): GameTypes.ITeamGameState {
    return {
      ...this._getBaseState(),
      teams: this.teams,
      currentTeam: this._currentTeam,
      teamScores: this.teamScores
    };
  }
  
  // Валидация для командных игр
  protected _validateTeamMove(playerId: string, expectedTeam?: string): void {
    this._validatePlayerMove(playerId);
    
    const playerTeam = this.getPlayerTeam(playerId);
    if (!playerTeam) {
      throw new Error('Player is not in any team');
    }
    
    if (expectedTeam && playerTeam.id !== expectedTeam) {
      throw new Error(`Expected player from team ${expectedTeam}, but got ${playerTeam.id}`);
    }
  }
  
  protected _isPlayerInTeam(playerId: string, teamId: string): boolean {
    const team = this._teams.find(t => t.id === teamId);
    return team ? team.players.some(p => p.id === playerId) : false;
  }
}

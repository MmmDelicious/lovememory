import { RealtimeGame } from '../base/RealtimeGame';
import { GameTypes, IGameSettings } from '../../types/game.interfaces';

// Импортируем модули Wordle (предполагаем, что они есть)
const { getRandomWord, getDictionary } = require('../wordle/dictionaries');
const { evaluateGuess } = require('../wordle/utils');

// Специфичные типы для Wordle игры
type GuessResult = 'correct' | 'present' | 'absent';

interface IWordleState extends GameTypes.IRealtimeGameState {
  gameType: string; // Добавляем gameType для совместимости
  language: string;
  currentRound: number;
  maxRounds: number;
  maxAttempts: number;
  targetWordLength: number;
  scores: Record<string, number>;
  gameFormat: '1v1' | '2v2';
  teams?: Record<string, string[]>; // teamId -> playerIds  
  teamScores?: Record<string, number>; // teamId -> score
  playersFinished: Record<string, boolean>; // playerId -> finished current round
}

interface IWordlePlayerState {
  playerGuesses: string[];
  playerResults: GuessResult[][];
  targetWord?: string; // Показывается только в конце игры
  playerTeam?: string;
}

interface IWordleMove {
  guess: string; // Слово из 5 букв
}

interface IWordleSettings extends IGameSettings {
  gameFormat?: '1v1' | '2v2';
  language?: string;
  maxRounds?: number;
  maxAttempts?: number;
}

/**
 * Новая реализация Wordle игры на основе RealtimeGame
 * Поддерживает форматы 1v1 и 2v2 с командной логикой и раундовой системой
 */
export class WordleGameNew extends RealtimeGame<IWordleState, IWordleMove> {
  public readonly gameType = 'wordle';
  
  // Игровые данные
  private _language: string;
  private _currentRound: number = 1;
  private _maxRounds: number;
  private _maxAttempts: number = 6;
  private _targetWord: string = '';
  private _scores: Record<string, number> = {};
  private _gameFormat: '1v1' | '2v2';
  
  // Данные игроков по раундам
  private _playerGuesses: Record<string, string[]> = {};
  private _playerResults: Record<string, GuessResult[][]> = {};
  private _playersFinished: Record<string, boolean> = {};
  
  // Командная логика для 2v2
  private _teams: Record<string, string[]> = {};
  private _teamScores: Record<string, number> = {};
  
  // Защита от конкурентных обновлений
  private _isProcessingMove: boolean = false;
  
  constructor(roomId?: string, settings?: Partial<IWordleSettings>) {
    // Настройки для Wordle
    const wordleSettings: IWordleSettings = {
      maxPlayers: settings?.gameFormat === '2v2' ? 4 : 2,
      minPlayers: settings?.gameFormat === '2v2' ? 4 : 2,
      timeLimit: undefined, // Нет общего таймаута
      difficulty: 'medium',
      gameFormat: '1v1',
      language: 'russian',
      maxRounds: 3,
      maxAttempts: 6,
      ...settings
    };
    
    super(roomId, wordleSettings);
    
    this._gameFormat = wordleSettings.gameFormat!;
    this._language = wordleSettings.language!;
    this._maxRounds = wordleSettings.maxRounds!;
    this._maxAttempts = wordleSettings.maxAttempts!;
    
    // Отключаем одновременные ходы для Wordle - каждый игрок играет в своем темпе
    this._setSimultaneousMoves(false);
    // Отключаем все таймеры - Wordle не использует таймеры
    this._setRoundDuration(0);
  }
  
  // Реализация абстрактных методов RealtimeGame
  protected _executeMove(playerId: string, move: IWordleMove): void {
    const { guess } = move;
    
    // Проверяем, что игрок еще не закончил текущий раунд
    if (this._playersFinished[playerId]) {
      throw new Error('Player has already finished this round');
    }
    
    // Нормализуем слово
    const normalizedGuess = guess.toUpperCase();
    
    // Проверяем длину слова (параметризованно)
    const targetLength = this._targetWord.length;
    if (normalizedGuess.length !== targetLength) {
      throw new Error(`Word must be exactly ${targetLength} letters`);
    }
    
    // Проверяем валидность слова через словарь
    if (!this._isValidWord(normalizedGuess)) {
      throw new Error(`Word "${normalizedGuess}" is not in dictionary`);
    }
    
    // Проверяем количество попыток
    const currentGuesses = this._playerGuesses[playerId] || [];
    if (currentGuesses.length >= this._maxAttempts) {
      throw new Error('Maximum attempts reached');
    }
    
    // Добавляем догадку
    if (!this._playerGuesses[playerId]) {
      this._playerGuesses[playerId] = [];
    }
    if (!this._playerResults[playerId]) {
      this._playerResults[playerId] = [];
    }
    
    this._playerGuesses[playerId].push(normalizedGuess);
    
    // Оцениваем догадку
    const result: GuessResult[] = evaluateGuess(normalizedGuess, this._targetWord);
    this._playerResults[playerId].push(result);
    
    // Проверяем правильность ответа
    const isCorrect = result.every(r => r === 'correct');
    
    if (isCorrect) {
      // Игрок угадал слово - начисляем очки
      const attempts = this._playerGuesses[playerId].length;
      const points = Math.max(0, 7 - attempts); // Больше очков за меньше попыток
      
      this._scores[playerId] = (this._scores[playerId] || 0) + points;
      
      // Обновляем командный счет для 2v2
      if (this._gameFormat === '2v2') {
        this._updateTeamScore(playerId, points);
      }
      
      // Отмечаем игрока как завершившего раунд
      this._playersFinished[playerId] = true;
      
      this._emitEvent({
        type: 'wordle_word_guessed',
        playerId,
        data: {
          word: this._targetWord,
          attempts,
          points,
          totalScore: this._scores[playerId]
        },
        timestamp: new Date()
      });
      
    } else if (this._playerGuesses[playerId].length >= this._maxAttempts) {
      // Игрок исчерпал попытки
      this._playersFinished[playerId] = true;
      
      this._emitEvent({
        type: 'wordle_attempts_exhausted',
        playerId,
        data: { word: this._targetWord },
        timestamp: new Date()
      });
    }
    
    this._emitEvent({
      type: 'wordle_guess_made',
      playerId,
      data: {
        guess: normalizedGuess,
        result,
        isCorrect,
        attempts: this._playerGuesses[playerId].length,
        maxAttempts: this._maxAttempts
      },
      timestamp: new Date()
    });
    
    // После каждого хода проверяем завершение раунда
    this._checkRoundCompletion();
  }
  
  protected _checkGameEnd(): boolean {
    return this._currentRound >= this._maxRounds;
  }
  
  protected _determineWinner(): string | 'draw' | null {
    if (this._gameFormat === '2v2') {
      // Командный режим
      const team1Score = this._teamScores['team1'] || 0;
      const team2Score = this._teamScores['team2'] || 0;
      
      if (team1Score > team2Score) {
        return 'team1';
      } else if (team2Score > team1Score) {
        return 'team2';
      } else {
        return 'draw';
      }
    } else {
      // Индивидуальный режим
      const playerScores = this._players.map(player => ({
        id: player.id,
        score: this._scores[player.id] || 0
      }));
      
      playerScores.sort((a, b) => b.score - a.score);
      
      if (playerScores.length >= 2 && playerScores[0].score === playerScores[1].score) {
        return 'draw';
      }
      
      return playerScores[0]?.id || null;
    }
  }
  
  // Переопределяем методы для раундовой логики Wordle
  protected override _getActivePlayers(): string[] {
    // Все игроки всегда активны в Wordle
    return this._players.map(p => p.id);
  }
  
  protected override _allPlayersMoved(): boolean {
    // В Wordle мы не ждем ходы всех игроков - каждый играет в своем темпе
    return false;
  }
  
  protected override _processAllMoves(): void {
    // В Wordle нет групповой обработки ходов - каждый ход обрабатывается индивидуально
    // Проверяем, завершили ли все игроки текущий раунд
    this._checkRoundCompletion();
  }
  
  private _checkRoundCompletion(): void {
    const allPlayersFinished = this._players.every(player => 
      this._playersFinished[player.id] === true
    );
    
    if (allPlayersFinished) {
      this._nextRound();
    }
  }
  
  protected override _nextRound(): void {
    if (this._currentRound >= this._maxRounds) {
      // Игра завершена - эмитим событие и вызываем финиш игры
      const winner = this._determineWinner();
      
      this._emitEvent({
        type: 'game_finished',
        data: {
          winner,
          finalScores: { ...this._scores },
          teamScores: this._gameFormat === '2v2' ? { ...this._teamScores } : undefined,
          totalRounds: this._maxRounds
        },
        timestamp: new Date()
      });
      
      this._finishGame(winner);
      return;
    }
    
    this._currentRound++;
    
    // Генерируем новое слово
    this._generateNewWord();
    
    // Сбрасываем состояние раунда
    for (const playerId of this._players.map(p => p.id)) {
      this._playersFinished[playerId] = false;
    }
    
    // Эмитим события перехода к следующему раунду
    this._emitEvent({
      type: 'next_round',
      data: {
        round: this._currentRound,
        maxRounds: this._maxRounds,
        newWordLength: this._targetWord.length
      },
      timestamp: new Date()
    });
    
    this._emitEvent({
      type: 'wordle_next_round',
      data: {
        round: this._currentRound,
        maxRounds: this._maxRounds,
        newWordLength: this._targetWord.length
      },
      timestamp: new Date()
    });
    
    super._nextRound();
    
    // Эмитим обновленное состояние после перехода
    this._emitStateChange();
  }
  
  // Переопределяем makeMove для Wordle специфичной логики с защитой от race conditions
  public override makeMove(playerId: string, move: IWordleMove): IWordleState {
    // Простая защита от конкурентных обновлений
    if (this._isProcessingMove) {
      throw new Error('Another move is being processed, please wait');
    }
    
    this._isProcessingMove = true;
    
    try {
      this._validatePlayerMove(playerId);
      
      if (!this.isValidMove(playerId, move)) {
        throw new Error('Invalid move');
      }
      
      // Выполняем ход атомарно
      this._executeMove(playerId, move);
      this._addMoveToHistory(playerId, move);
      
      // Проверяем окончание игры
      if (this._checkGameEnd()) {
        this._finishGame(this._determineWinner());
      }
      
      this._emitStateChange();
      return this.getState();
      
    } finally {
      this._isProcessingMove = false;
    }
  }
  
  // Реализация валидации ходов
  public isValidMove(playerId: string, move: IWordleMove): boolean {
    try {
      // Базовая проверка игрока
      if (this._status !== 'in_progress') {
        return false;
      }
      
      if (!this._players.find(p => p.id === playerId)) {
        return false;
      }
      
      const { guess } = move;
      
      // Проверяем, что игрок еще не закончил раунд
      if (this._playersFinished[playerId]) {
        return false;
      }
      
      // Проверяем длину слова (параметризованно)
      const normalizedGuess = guess.toUpperCase();
      const targetLength = this._targetWord.length;
      if (normalizedGuess.length !== targetLength) {
        return false;
      }
      
      // Проверяем валидность слова
      if (!this._isValidWord(normalizedGuess)) {
        return false;
      }
      
      // Проверяем количество попыток
      const currentGuesses = this._playerGuesses[playerId] || [];
      if (currentGuesses.length >= this._maxAttempts) {
        return false;
      }
      
      // Можно добавить проверку на валидность слова через словарь
      // if (!isValidWord(normalizedGuess)) return false;
      
      return true;
    } catch (error) {
      console.error(`[WordleGame] Error validating move for player ${playerId}:`, error);
      return false;
    }
  }
  
  // Переопределяем getState для специфичных данных Wordle
  public getState(): IWordleState {
    const baseState = this._getRealtimeState();
    
    const state: IWordleState = {
      ...baseState,
      gameType: this.gameType, // Единообразно включаем gameType
      language: this._language,
      currentRound: this._currentRound,
      maxRounds: this._maxRounds,
      maxAttempts: this._maxAttempts,
      targetWordLength: this._targetWord.length,
      scores: { ...this._scores },
      gameFormat: this._gameFormat,
      playersFinished: { ...this._playersFinished }
    };
    
    // Добавляем командную информацию для 2v2
    if (this._gameFormat === '2v2') {
      state.teams = { ...this._teams };
      state.teamScores = { ...this._teamScores };
    }
    
    return state;
  }
  
  // Метод получения состояния для конкретного игрока
  public getPlayerState(playerId: string): IWordlePlayerState {
    return {
      playerGuesses: [...(this._playerGuesses[playerId] || [])],
      playerResults: [...(this._playerResults[playerId] || [])],
      targetWord: this._status === 'finished' ? this._targetWord : undefined,
      playerTeam: this._gameFormat === '2v2' ? this._getPlayerTeam(playerId) || undefined : undefined
    };
  }
  
  // Переопределяем инициализацию игры
  protected override _initializeGame(): void {
    // Инициализируем счетчики игроков
    this._scores = {};
    this._playerGuesses = {};
    this._playerResults = {};
    this._playersFinished = {};
    
    for (const player of this._players) {
      this._scores[player.id] = 0;
      this._playerGuesses[player.id] = [];
      this._playerResults[player.id] = [];
      this._playersFinished[player.id] = false; // Явно устанавливаем false
    }
    
    // Настраиваем команды для 2v2
    if (this._gameFormat === '2v2') {
      this._setupTeams();
    }
    
    // Генерируем первое слово
    this._generateNewWord();
    
    // Сбрасываем состояние
    this._currentRound = 1;
    
    super._initializeGame();
    
    this._emitEvent({
      type: 'wordle_game_initialized',
      data: {
        gameFormat: this._gameFormat,
        language: this._language,
        maxRounds: this._maxRounds,
        maxAttempts: this._maxAttempts,
        targetWordLength: this._targetWord.length,
        teams: this._gameFormat === '2v2' ? this._teams : undefined
      },
      timestamp: new Date()
    });
  }
  
  // Приватные методы
  private _setupTeams(): void {
    this._teams = {
      team1: [],
      team2: []
    };
    
    this._teamScores = {
      team1: 0,
      team2: 0
    };
    
    // Детерминированное распределение команд: сортируем по ID для стабильности
    const sortedPlayers = [...this._players].sort((a, b) => a.id.localeCompare(b.id));
    
    sortedPlayers.forEach((player, index) => {
      if (index < 2) {
        this._teams.team1.push(player.id);
      } else {
        this._teams.team2.push(player.id);
      }
    });
    
    });
    
    // Teams initialized
  }
  
  private _updateTeamScore(playerId: string, points: number): void {
    if (this._gameFormat !== '2v2') return;
    
    // Проверяем наличие игрока в командах перед начислением
    if (!this._teams.team1 || !this._teams.team2) {
      console.error(`[WordleGame] Teams not initialized when updating score for player ${playerId}`);
      return;
    }
    
    let teamId: string | null = null;
    
    if (this._teams.team1.includes(playerId)) {
      teamId = 'team1';
    } else if (this._teams.team2.includes(playerId)) {
      teamId = 'team2';
    } else {
      console.error(`[WordleGame] Player ${playerId} not found in any team when updating score`);
      return;
    }
    
    if (teamId) {
      this._teamScores[teamId] = (this._teamScores[teamId] || 0) + points;
    }
  }
  
  private _generateNewWord(): void {
    try {
      this._targetWord = getRandomWord(this._language).toUpperCase();
    } catch (error) {
      console.error(`[WordleGame] Error generating word for language ${this._language}:`, error);
      // Fallback если модуль не работает
      this._targetWord = this._language === 'english' ? 'WORDS' : 'СЛОВО';
    }
    
    // Сбрасываем догадки и результаты для нового раунда
    for (const playerId of this._players.map(p => p.id)) {
      this._playerGuesses[playerId] = [];
      this._playerResults[playerId] = [];
    }
  }
  
  private _getPlayerTeam(playerId: string): string | null {
    if (this._gameFormat !== '2v2') return null;
    
    if (this._teams.team1?.includes(playerId)) {
      return 'team1';
    } else if (this._teams.team2?.includes(playerId)) {
      return 'team2';
    }
    
    return null;
  }
  
  private _isValidWord(word: string): boolean {
    try {
      // Получаем словарь для текущего языка
      const dictionary = getDictionary(this._language);
      if (!dictionary || !Array.isArray(dictionary)) {
        console.warn(`[WordleGame] Dictionary not found for language: ${this._language}`);
        return true; // По умолчанию принимаем любое слово
      }
      
      // Проверяем наличие слова в словаре (без учёта регистра)
      const normalizedWord = word.toLowerCase();
      return dictionary.some((dictWord: string) => 
        dictWord.toLowerCase() === normalizedWord && dictWord.length === word.length
      );
    } catch (error) {
      console.error(`[WordleGame] Error checking word validity for "${word}":`, error);
      return true; // При ошибке принимаем любое слово
    }
  }
  
  // Утилитарные методы
  public getCurrentRoundInfo(): {
    round: number;
    maxRounds: number;
    targetWordLength: number;
    playersFinished: number;
    totalPlayers: number;
  } {
    return {
      round: this._currentRound,
      maxRounds: this._maxRounds,
      targetWordLength: this._targetWord.length,
      playersFinished: Object.values(this._playersFinished).filter(Boolean).length,
      totalPlayers: this._players.length
    };
  }
  
  public getPlayerTeam(playerId: string): string | null {
    return this._getPlayerTeam(playerId);
  }
  
  public getTeammates(playerId: string): string[] {
    const team = this._getPlayerTeam(playerId);
    if (!team) return [];
    
    return this._teams[team].filter(id => id !== playerId);
  }
  
  public getGameProgress(): number {
    const progress = ((this._currentRound - 1) / this._maxRounds) * 100;
    return Math.max(0, Math.min(100, progress)); // Нормализуем до 0-100%
  }
  
  public getPlayerStats(playerId: string): {
    score: number;
    averageAttempts: number;
    wordsGuessed: number;
    totalRounds: number;
  } {
    const score = this._scores[playerId] || 0;
    // Правильно считаем попытки: количество гадок, а не длину слов
    const playerGuesses = this._playerGuesses[playerId] || [];
    const totalAttempts = playerGuesses.length;
    const wordsGuessed = (this._playerResults[playerId] || []).filter((result: GuessResult[]) => 
      result.every((r: GuessResult) => r === 'correct')
    ).length;
    // Делим на реально завершённые раунды (минимум wordsGuessed)
    const completedRounds = Math.max(wordsGuessed, (this._currentRound > 1) ? this._currentRound - 1 : 0);
    const averageAttempts = completedRounds > 0 ? totalAttempts / completedRounds : 0;
    
    return { score, averageAttempts, wordsGuessed, totalRounds: completedRounds };
  }
  
  public hasPlayerFinishedRound(playerId: string): boolean {
    return !!this._playersFinished[playerId];
  }
  
  public getTargetWord(): string {
    // Возвращаем слово только если игра завершена
    return this._status === 'finished' ? this._targetWord : '';
  }
  
  // Переопределяем очистку
  // Методы совместимости со старым socket кодом
  public getStateForPlayer(playerId: string): any {
    const baseState = this.getState();
    const playerState = this.getPlayerState(playerId);
    
    return {
      ...baseState,
      // Помещаем player-specific данные в отдельный ключ
      playerState: playerState,
      // Обеспечиваем совместимость структуры для фронтенда
      players: this._players.map(p => ({ id: p.id, name: p.name })), // Единообразная структура
      status: this._status,
      roomId: this._roomId,
      gameType: this.gameType
    };
  }
  
  // Добавляем геттер для совместимости с socket кодом  
  public get players(): any[] {
    return this._players.map(p => ({ id: p.id, name: p.name }));
  }
  
  // Добавляем метод для совместимости со старым API (используется в socket/index.js)
  public makeGuess(playerId: string, guess: string): any {
    return this.makeMove(playerId, { guess });
  }
  
  protected override _onCleanup(): void {
    super._onCleanup();
    
    this._playerGuesses = {};
    this._playerResults = {};
    this._playersFinished = {};
    this._scores = {};
    this._teams = {};
    this._teamScores = {};
  }
}

import { TeamGame } from '../base/TeamGame';
import { GameTypes, IGameSettings, ITeam } from '../../types/game.interfaces';

// Специфичные типы для Codenames
type CardType = 'red' | 'blue' | 'neutral' | 'assassin';
type GamePhase = 'giving_clue' | 'guessing';

interface ICodenamesCard {
  id: number;
  word: string;
  type: CardType;
  revealed: boolean;
}

interface ICodenamesState extends GameTypes.ITeamGameState {
  currentPhase: GamePhase;
  currentClue: string | null;
  currentClueNumber: number;
  guessesLeft: number;
  canPass: boolean;
  board: ICodenamesCard[];
  boardSize: number;
  cardCounts: Record<CardType, number>;
  startingTeam: string;
  turnTimeLimit: number;
  turnTimeRemaining: number;
  gameHistory: IGameHistoryEntry[];
  teamProgress: Record<string, { total: number; revealed: number }>;
  revealedCards: Set<number>;
}

interface IGameHistoryEntry {
  type: 'clue' | 'guess' | 'pass';
  team: string;
  player: string;
  clue?: string;
  number?: number;
  cardId?: number;
  word?: string;
  cardType?: CardType;
  timestamp: string;
}

interface ICodenamesMove {
  type: 'clue' | 'guess' | 'pass';
  clueWord?: string;
  clueNumber?: number;
  cardId?: number;
}

interface ICodenamesSettings extends IGameSettings {
  turnTimeLimit?: number;
}

/**
 * Новая реализация Codenames на основе TeamGame
 * Строго командная игра 2v2 с капитанами и игроками
 */
export class CodenamesGameNew extends TeamGame<ICodenamesState, ICodenamesMove> {
  public readonly gameType = 'codenames';
  
  // Командная конфигурация
  protected readonly _teamsCount = 2;
  protected readonly _playersPerTeam = 2;
  
  // Игровые данные
  private _currentPhase: GamePhase = 'giving_clue';
  private _currentClue: string | null = null;
  private _currentClueNumber: number = 0;
  private _guessesLeft: number = 0;
  private _canPass: boolean = false;
  private _board: ICodenamesCard[] = [];
  private _boardSize: number = 25; // 5x5
  private _cardCounts: Record<CardType, number> = {
    red: 0,
    blue: 0,
    neutral: 7,
    assassin: 1
  };
  private _startingTeam: string = '';
  private _turnTimeLimit: number;
  private _turnStartTime?: Date;
  private _gameHistory: IGameHistoryEntry[] = [];
  private _revealedCards: Set<number> = new Set();
  
  // Банк слов
  private readonly WORD_BANK = [
    'АГЕНТ', 'АНГЛИЯ', 'АНГЕЛ', 'АНТАРКТИДА', 'АРМИЯ', 'АТОМ', 'АФРИКА', 'БАБОЧКА', 'БАНК',
    'БАССЕЙН', 'БАТАРЕЯ', 'БАШНЯ', 'БЕЛКА', 'БИЛЕТ', 'БЛОК', 'БОМБА', 'БОТИНОК', 'БРАСЛЕТ',
    'БРАТ', 'БУКВА', 'ВАМПИР', 'ВАЗА', 'ВЕЛИКАН', 'ВЕРБЛЮД', 'ВЕСЫ', 'ВЕТЕР', 'ВИЛКА',
    'ВОДА', 'ВОЛК', 'ВОРОТА', 'ВРАЧ', 'ВРЕМЯ', 'ГАЗЕТА', 'ГАЛАКТИКА', 'ГЕРМАНИЯ', 'ГИГАНТ',
    'ГЛАЗ', 'ГОЛОВА', 'ГОРА', 'ГОРОД', 'ГРУДЬ', 'ГРУППА', 'ДВЕРЬ', 'ДВОРЕЦ', 'ДЕВОЧКА',
    'ДЕДУШКА', 'ДЕЛЬФИН', 'ДЕНЬ', 'ДЕРЕВО', 'ДЕТАЛЬ', 'ДЕТИ', 'ДИНОЗАВР', 'ДИСК', 'ДОЖДЬ',
    'ДОМ', 'ДОРОГА', 'ДРАКОН', 'ДРУГ', 'ДУГА', 'ЕГИПЕТ', 'ЕДИНОРОГ', 'ЖАБА', 'ЖЕЛЕЗО',
    'ЖЕМЧУГ', 'ЖЕНЩИНА', 'ЖИЗНЬ', 'ЖУРНАЛ', 'ЗАВОД', 'ЗАМОК', 'ЗВЕЗДА', 'ЗВОНОК', 'ЗЕБРА',
    'ЗЕМЛЯ', 'ЗЕРКАЛО', 'ЗИМА', 'ЗОЛОТО', 'ЗОНТ', 'ЗУБА', 'ИГЛА', 'ИГРА', 'ИДЕЯ', 'ИКРА',
    'ИНДИЯ', 'ИНТЕРНЕТ', 'ИСКУССТВО', 'ИТАЛИЯ', 'КАБИНА', 'КАКТУС', 'КАМЕНЬ', 'КАПИТАН',
    'КАРТА', 'КАША', 'КИНО', 'КИТАЙ', 'КЛАСС', 'КЛЮЧ', 'КНИГА', 'КОГОТЬ', 'КОЛЕСО',
    'КОМАНДА', 'КОНЬ', 'КОРАБЛЬ', 'КОРОВА', 'КОСМОС', 'КОСТЬ', 'КОТ', 'КОФЕ', 'КРАСОТА',
    'КРОВЬ', 'КРУГ', 'КРЫША', 'КУКЛА', 'ЛАБИРИНТ', 'ЛАМПА', 'ЛАПА', 'ЛЕТО', 'ЛИМОН',
    'ЛИНИЯ', 'ЛИСТ', 'ЛУНА', 'ЛЁД', 'ЛЮБОВЬ', 'МАГИЯ', 'МАШИНА', 'МЕДВЕДЬ', 'МОЛОКО',
    'МОРЕ', 'МОСТ', 'МУЗЫКА', 'МЫШЬ', 'НЕБО', 'НЕФТЬ', 'НОГА', 'НОЖ', 'НОЧЬ', 'ОБЛАКО',
    'ОГОНЬ', 'ОЗЕРО', 'ОКЕАН', 'ОКНО', 'ОПЕРА', 'ОРЁЛ', 'ОСТРОВ', 'ПАЛЕЦ', 'ПАПА', 'ПАРК',
    'ПАУК', 'ПЕЧАТЬ', 'ПИРАМИДА', 'ПЛАНЕТА', 'ПОЕЗД', 'ПОЛК', 'ПОЧТА', 'ПРИНЦ', 'ПТИЦА',
    'ПУЛЯ', 'ПУСТЫНЯ', 'РАБОТА', 'РАДУГА', 'РЕКА', 'РОБОТ', 'РОССИЯ', 'РУКА', 'РЫБА',
    'САДЫ', 'САМОЛЁТ', 'СВЕТ', 'СВИНЬЯ', 'СЕДЛО', 'СЕМЬЯ', 'СЕРДЦЕ', 'СИЛА', 'СКАЗКА',
    'СЛОН', 'СНЕГ', 'СОБАКА', 'СОЛНЦЕ', 'СПОРТ', 'СТАКАН', 'СТЕНА', 'СТОЛ', 'СТРАНА',
    'ТАНК', 'ТЕАТР', 'ТЕЛЕФОН', 'ТЕНЬ', 'ТИГР', 'ТКАНЬ', 'ТОЧКА', 'ТРАВА', 'ТРУБА',
    'ТУЧА', 'УЛИЦА', 'УТКА', 'УХО', 'УЧИТЕЛЬ', 'ФАБРИКА', 'ФЕРМА', 'ФИГУРА', 'ФЛАГ',
    'ФОРМА', 'ФОТО', 'ФРАНЦИЯ', 'ФРУКТ', 'ХИМИЯ', 'ХЛЕБ', 'ХОЛМ', 'ЦВЕТ', 'ЦЕНТР',
    'ЦЕПЬ', 'ЦЕРКОВЬ', 'ЦИРК', 'ЧИСЛО', 'ЧАШКА', 'ЧЕЛОВЕК', 'ЧЕСТЬ', 'ШАПКА', 'ШКОЛА',
    'ШТОРМ', 'ЭЛЬФ', 'ЭНЕРГИЯ', 'ЮПИТЕР', 'ЯЗЫК', 'АВТОБУС', 'АКТЁР', 'АЛЬБОМ'
  ];
  
  constructor(roomId?: string, settings?: Partial<ICodenamesSettings>) {
    // Настройки для Codenames
    const codenamesSettings: ICodenamesSettings = {
      maxPlayers: 4,
      minPlayers: 4,
      timeLimit: undefined, // Используем собственную систему времени
      difficulty: 'medium',
      turnTimeLimit: 120, // 2 минуты на ход
      ...settings
    };
    
    super(roomId, codenamesSettings);
    
    this._turnTimeLimit = codenamesSettings.turnTimeLimit!;
  }
  
  // Реализация абстрактных методов BaseGame (через TeamGame)
  public makeMove(playerId: string, move: ICodenamesMove): ICodenamesState {
    this._validateTeamMove(playerId, this._currentTeam);
    
    const { type } = move;
    
    switch (type) {
      case 'clue':
        return this._giveClue(playerId, move.clueWord!, move.clueNumber!);
      case 'guess':
        return this._makeGuess(playerId, move.cardId!);
      case 'pass':
        return this._passTurn(playerId);
      default:
        throw new Error('Invalid move type');
    }
  }
  
  public isValidMove(playerId: string, move: ICodenamesMove): boolean {
    try {
      this._validateTeamMove(playerId, this._currentTeam);
      
      const playerRole = this._getPlayerRole(playerId);
      if (!playerRole) return false;
      
      const { type } = move;
      
      switch (type) {
        case 'clue':
          return this._currentPhase === 'giving_clue' && 
                 playerRole.role === 'captain' &&
                 this._isValidClue(move.clueWord!, move.clueNumber!);
        case 'guess':
          return this._currentPhase === 'guessing' && 
                 playerRole.role === 'player' &&
                 this._guessesLeft > 0 &&
                 this._isValidGuess(move.cardId!);
        case 'pass':
          return this._currentPhase === 'guessing' && 
                 playerRole.role === 'player' &&
                 this._canPass;
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
  
  // Переопределяем getState для специфичных данных Codenames
  public getState(): ICodenamesState {
    return {
      ...this._getTeamGameState(),
      currentPhase: this._currentPhase,
      currentClue: this._currentClue,
      currentClueNumber: this._currentClueNumber,
      guessesLeft: this._guessesLeft,
      canPass: this._canPass,
      board: this._board.map(card => ({ ...card })),
      boardSize: this._boardSize,
      cardCounts: { ...this._cardCounts },
      startingTeam: this._startingTeam,
      turnTimeLimit: this._turnTimeLimit,
      turnTimeRemaining: this._getTurnTimeRemaining(),
      gameHistory: [...this._gameHistory],
      teamProgress: this._getTeamProgress(),
      revealedCards: new Set(this._revealedCards)
    };
  }
  
  // Переопределяем инициализацию команд
  protected _initializeTeams(): void {
    super._initializeTeams();
    
    // Назначаем роли в командах
    this._assignTeamRoles();
    
    // Выбираем стартующую команду
    this._startingTeam = Math.random() < 0.5 ? 'team1' : 'team2';
    this._currentTeam = this._startingTeam;
    
    // Настраиваем количество карт
    this._setupCardCounts();
    
    // Генерируем доску
    this._generateBoard();
    
    this._turnStartTime = new Date();
    
    this._emitEvent({
      type: 'codenames_game_initialized',
      data: {
        teams: this._teams,
        startingTeam: this._startingTeam,
        board: this._board,
        cardCounts: this._cardCounts
      },
      timestamp: new Date()
    });
  }
  
  // Приватные методы
  private _assignTeamRoles(): void {
    // Первые два игрока - команда 1 (капитан и игрок)
    if (this._teams[0].players.length >= 2) {
      this._teams[0].captain = this._teams[0].players[0].id;
    }
    
    // Следующие два игрока - команда 2 (капитан и игрок)
    if (this._teams[1].players.length >= 2) {
      this._teams[1].captain = this._teams[1].players[0].id;
    }
  }
  
  private _setupCardCounts(): void {
    // Стартующая команда получает 9 карт, другая 8
    if (this._startingTeam === 'team1') {
      this._cardCounts.red = 9;
      this._cardCounts.blue = 8;
    } else {
      this._cardCounts.red = 8;
      this._cardCounts.blue = 9;
    }
  }
  
  private _generateBoard(): void {
    // Выбираем случайные слова
    const shuffledWords = [...this.WORD_BANK].sort(() => Math.random() - 0.5);
    const words = shuffledWords.slice(0, this._boardSize);
    
    // Создаем массив типов карт
    const cardTypes: CardType[] = [
      ...Array(this._cardCounts.red).fill('red' as CardType),
      ...Array(this._cardCounts.blue).fill('blue' as CardType),
      ...Array(this._cardCounts.neutral).fill('neutral' as CardType),
      ...Array(this._cardCounts.assassin).fill('assassin' as CardType)
    ];
    
    // Перемешиваем типы
    const shuffledTypes = cardTypes.sort(() => Math.random() - 0.5);
    
    // Создаем доску
    this._board = words.map((word, index) => ({
      id: index,
      word: word,
      type: shuffledTypes[index],
      revealed: false
    }));
  }
  
  private _giveClue(playerId: string, clueWord: string, clueNumber: number): ICodenamesState {
    // Валидация роли
    const playerRole = this._getPlayerRole(playerId);
    if (!playerRole || playerRole.role !== 'captain') {
      throw new Error('Only captain can give clues');
    }
    
    if (this._currentPhase !== 'giving_clue') {
      throw new Error('Not time to give clues');
    }
    
    if (this._isTimeUp()) {
      this._endTurn();
      throw new Error('Time is up');
    }
    
    // Валидация подсказки
    if (!this._isValidClue(clueWord, clueNumber)) {
      throw new Error('Invalid clue');
    }
    
    // Сохраняем подсказку
    this._currentClue = clueWord.trim();
    this._currentClueNumber = clueNumber;
    this._guessesLeft = clueNumber + 1; // +1 дополнительная попытка
    this._currentPhase = 'guessing';
    this._canPass = false;
    
    // Добавляем в историю
    this._gameHistory.push({
      type: 'clue',
      team: this._currentTeam!,
      player: playerId,
      clue: this._currentClue,
      number: this._currentClueNumber,
      timestamp: new Date().toISOString()
    });
    
    this._emitEvent({
      type: 'codenames_clue_given',
      playerId,
      data: {
        clue: this._currentClue,
        number: this._currentClueNumber,
        team: this._currentTeam
      },
      timestamp: new Date()
    });
    
    return this.getState();
  }
  
  private _makeGuess(playerId: string, cardId: number): ICodenamesState {
    // Валидация роли
    const playerRole = this._getPlayerRole(playerId);
    if (!playerRole || playerRole.role !== 'player') {
      throw new Error('Only player can make guesses');
    }
    
    if (this._currentPhase !== 'guessing') {
      throw new Error('Not time to guess');
    }
    
    if (this._guessesLeft <= 0) {
      throw new Error('No guesses left');
    }
    
    if (!this._isValidGuess(cardId)) {
      throw new Error('Invalid guess');
    }
    
    // Открываем карту
    const card = this._board.find(c => c.id === cardId)!;
    card.revealed = true;
    this._revealedCards.add(cardId);
    this._guessesLeft--;
    
    // Добавляем в историю
    this._gameHistory.push({
      type: 'guess',
      team: this._currentTeam!,
      player: playerId,
      cardId: cardId,
      word: card.word,
      cardType: card.type,
      timestamp: new Date().toISOString()
    });
    
    this._emitEvent({
      type: 'codenames_card_revealed',
      playerId,
      data: {
        cardId,
        word: card.word,
        type: card.type,
        team: this._currentTeam
      },
      timestamp: new Date()
    });
    
    // Проверяем результат угадывания
    const currentTeamColor = this._getCurrentTeamColor();
    
    if (card.type === 'assassin') {
      // Попали на убийцу - проигрыш
      const winnerTeam = this._currentTeam === 'team1' ? 'team2' : 'team1';
      this._finishGame(winnerTeam);
    } else if (card.type === currentTeamColor) {
      // Угадали свою карту
      this._canPass = true;
      
      if (this._checkWinCondition()) {
        this._finishGame(this._currentTeam!);
      } else if (this._guessesLeft === 0) {
        this._endTurn();
      }
    } else {
      // Угадали чужую или нейтральную карту
      this._endTurn();
    }
    
    return this.getState();
  }
  
  private _passTurn(playerId: string): ICodenamesState {
    const playerRole = this._getPlayerRole(playerId);
    if (!playerRole || playerRole.role !== 'player') {
      throw new Error('Only player can pass turn');
    }
    
    if (this._currentPhase !== 'guessing' || !this._canPass) {
      throw new Error('Cannot pass turn now');
    }
    
    this._gameHistory.push({
      type: 'pass',
      team: this._currentTeam!,
      player: playerId,
      timestamp: new Date().toISOString()
    });
    
    this._emitEvent({
      type: 'codenames_turn_passed',
      playerId,
      data: { team: this._currentTeam },
      timestamp: new Date()
    });
    
    this._endTurn();
    return this.getState();
  }
  
  private _endTurn(): void {
    // Переходим к другой команде
    this._nextTeamTurn();
    
    // Сбрасываем состояние хода
    this._currentPhase = 'giving_clue';
    this._currentClue = null;
    this._currentClueNumber = 0;
    this._guessesLeft = 0;
    this._canPass = false;
    this._turnStartTime = new Date();
    
    this._emitEvent({
      type: 'codenames_turn_ended',
      data: { 
        newTeam: this._currentTeam,
        phase: this._currentPhase
      },
      timestamp: new Date()
    });
  }
  
  private _isValidClue(clueWord: string, clueNumber: number): boolean {
    if (!clueWord || typeof clueWord !== 'string' || clueWord.trim().length === 0) {
      return false;
    }
    
    if (!Number.isInteger(clueNumber) || clueNumber < 1 || clueNumber > 9) {
      return false;
    }
    
    const clueWordUpper = clueWord.toUpperCase().trim();
    const boardWords = this._board.map(card => card.word.toUpperCase());
    
    // Подсказка не может совпадать со словом на доске
    if (boardWords.includes(clueWordUpper)) {
      return false;
    }
    
    // Подсказка не может содержать части слов на доске
    const clueBase = clueWordUpper.replace(/[^\u0410-\u044F\u0401\u0451]/g, '');
    for (const word of boardWords) {
      const wordBase = word.replace(/[^\u0410-\u044F\u0401\u0451]/g, '');
      if (clueBase.includes(wordBase) || wordBase.includes(clueBase)) {
        return false;
      }
    }
    
    return true;
  }
  
  private _isValidGuess(cardId: number): boolean {
    const card = this._board.find(c => c.id === cardId);
    return card !== undefined && !card.revealed;
  }
  
  private _checkWinCondition(): boolean {
    const currentTeamColor = this._getCurrentTeamColor();
    const teamCards = this._board.filter(card => card.type === currentTeamColor);
    const revealedTeamCards = teamCards.filter(card => card.revealed);
    
    return revealedTeamCards.length === teamCards.length;
  }
  
  private _getCurrentTeamColor(): CardType {
    return this._currentTeam === 'team1' ? 'red' : 'blue';
  }
  
  private _getPlayerRole(playerId: string): { team: string; role: 'captain' | 'player' } | null {
    for (const team of this._teams) {
      if (team.captain === playerId) {
        return { team: team.id, role: 'captain' };
      }
      
      const playerIndex = team.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        const role = playerIndex === 0 ? 'captain' : 'player';
        return { team: team.id, role };
      }
    }
    
    return null;
  }
  
  private _getCurrentPlayerId(): string | null {
    if (!this._currentTeam) return null;
    
    const team = this._teams.find(t => t.id === this._currentTeam);
    if (!team) return null;
    
    if (this._currentPhase === 'giving_clue') {
      return team.captain || null;
    } else {
      // Возвращаем игрока (не капитана)
      const player = team.players.find(p => p.id !== team.captain);
      return player?.id || null;
    }
  }
  
  private _getTurnTimeRemaining(): number {
    if (!this._turnStartTime) return this._turnTimeLimit;
    
    const elapsed = (Date.now() - this._turnStartTime.getTime()) / 1000;
    return Math.max(0, this._turnTimeLimit - elapsed);
  }
  
  private _isTimeUp(): boolean {
    return this._getTurnTimeRemaining() <= 0;
  }
  
  private _getTeamProgress(): Record<string, { total: number; revealed: number }> {
    const progress: Record<string, { total: number; revealed: number }> = {};
    
    for (const team of this._teams) {
      const teamColor = team.id === 'team1' ? 'red' : 'blue';
      const teamCards = this._board.filter(card => card.type === teamColor);
      const revealedCards = teamCards.filter(card => card.revealed);
      
      progress[team.id] = {
        total: teamCards.length,
        revealed: revealedCards.length
      };
    }
    
    return progress;
  }
  
  protected _finishGame(winnerTeam: string): void {
    this._finishGame(winnerTeam);
    
    this._emitEvent({
      type: 'codenames_game_finished',
      data: { 
        winner: winnerTeam,
        reason: winnerTeam === this._currentTeam ? 'all_cards_revealed' : 'assassin_revealed'
      },
      timestamp: new Date()
    });
  }
  
  // Утилитарные методы
  public getCurrentPlayerId(): string | null {
    return this._getCurrentPlayerId();
  }
  
  public getPlayerRole(playerId: string): { team: string; role: 'captain' | 'player' } | null {
    return this._getPlayerRole(playerId);
  }
  
  public getBoardForPlayer(playerId: string): ICodenamesCard[] {
    const playerRole = this._getPlayerRole(playerId);
    const isCaptain = playerRole?.role === 'captain';
    
    // Капитаны видят все типы карт, игроки только открытые
    return this._board.map(card => ({
      ...card,
      type: (isCaptain || card.revealed) ? card.type : 'neutral' // Скрываем типы для игроков
    }));
  }
  
  public getGameProgress(): number {
    if (!this._currentTeam) return 0;
    
    const currentTeamProgress = this._getTeamProgress()[this._currentTeam];
    return (currentTeamProgress.revealed / currentTeamProgress.total) * 100;
  }
  
  // Методы совместимости со старым socket кодом  
  public getPlayerRoleOld(playerId: string): any {
    const team = this.getPlayerTeam(playerId);
    if (!team) return null;
    
    const teamData = Object.values(this._teams).find(t => t.id === team.id);
    const captainId = teamData?.captain;
    return {
      role: captainId === playerId ? 'captain' : 'player',
      team: team.id
    };
  }
  
  public getCaptainState(playerId: string): any {
    const baseState = this.getState();
    // Капитаны видят цвета карт
    return {
      ...baseState,
      board: this._board // Полная доска с цветами
    };
  }
  
  // Переопределяем очистку
  protected _onCleanup(): void {
    super._onCleanup();
    
    this._board = [];
    this._gameHistory = [];
    this._revealedCards.clear();
  }
}

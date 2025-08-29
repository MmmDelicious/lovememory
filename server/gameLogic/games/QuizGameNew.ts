import { RealtimeGame } from '../base/RealtimeGame';
import { GameTypes, IGameSettings, ITeam, IPlayer } from '../../types/game.interfaces';

// Специфичные типы для Quiz игры
interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface IQuizState extends GameTypes.IRealtimeGameState {
  gameType: string; // Добавляем gameType для совместимости
  currentQuestionIndex: number;
  currentQuestion: IQuizQuestion | null;
  scores: Record<string, number>;
  playerAnswers: Record<string, Record<number, number>>; // playerId -> questionIndex -> answerIndex
  totalQuestions: number;
  gameFormat: '1v1' | '2v2';
  questionTimeRemaining: number;
  teams?: Record<string, string[]>; // teamId -> playerIds
  teamScores?: Record<string, number>; // teamId -> score
}

interface IQuizMove {
  answerIndex: number; // Индекс выбранного ответа (0-3)
}

interface IQuizSettings extends IGameSettings {
  gameFormat?: '1v1' | '2v2';
  totalQuestions?: number;
  questionTimeLimit?: number; // в секундах
}

/**
 * Новая реализация Quiz игры на основе RealtimeGame
 * Поддерживает форматы 1v1 и 2v2 с командной логикой
 */
export class QuizGameNew extends RealtimeGame<IQuizState, IQuizMove> {
  public readonly gameType = 'quiz';
  
  // Игровые данные
  private _currentQuestionIndex: number = 0;
  private _questions: IQuizQuestion[] = [];
  private _scores: Record<string, number> = {};
  private _playerAnswers: Record<string, Record<number, number>> = {};
  private _totalQuestions: number;
  private _gameFormat: '1v1' | '2v2';
  private _questionTimeLimit: number;
  private _currentQuestionStartTime?: Date;
  private _questionTimer?: NodeJS.Timeout;
  private _isCleanedUp: boolean = false; // Флаг для предотвращения запуска таймеров после очистки
  
  // Командная логика для 2v2
  private _teams: Record<string, string[]> = {};
  private _teamScores: Record<string, number> = {};
  
  // Банк вопросов
  private readonly QUESTION_BANK: IQuizQuestion[] = [
    {
      question: "Какая планета известна как Красная планета?",
      options: ["Меркурий", "Венера", "Земля", "Марс"],
      correctAnswer: 3
    },
    {
      question: "Кто написал роман 'Война и мир'?",
      options: ["Достоевский", "Толстой", "Чехов", "Пушкин"],
      correctAnswer: 1
    },
    {
      question: "Какой химический элемент имеет символ O?",
      options: ["Олово", "Осмий", "Кислород", "Золото"],
      correctAnswer: 2
    },
    {
      question: "В каком году началась Вторая мировая война?",
      options: ["1938", "1939", "1940", "1941"],
      correctAnswer: 1
    },
    {
      question: "Какая самая высокая гора в мире?",
      options: ["К2", "Эверест", "Канченджанга", "Лхоцзе"],
      correctAnswer: 1
    },
    {
      question: "Кто изобрел телефон?",
      options: ["Томас Эдисон", "Никола Тесла", "Александр Белл", "Генри Форд"],
      correctAnswer: 2
    },
    {
      question: "Какой океан самый большой?",
      options: ["Атлантический", "Индийский", "Северный Ледовитый", "Тихий"],
      correctAnswer: 3
    },
    {
      question: "Сколько континентов на Земле?",
      options: ["5", "6", "7", "8"],
      correctAnswer: 2
    },
    {
      question: "Какая валюта используется в Японии?",
      options: ["Вон", "Юань", "Йена", "Рубль"],
      correctAnswer: 2
    },
    {
      question: "Кто нарисовал 'Мону Лизу'?",
      options: ["Микеланджело", "Леонардо да Винчи", "Рафаэль", "Пикассо"],
      correctAnswer: 1
    },
    {
      question: "Какая планета ближайшая к Солнцу?",
      options: ["Венера", "Меркурий", "Марс", "Земля"],
      correctAnswer: 1
    },
    {
      question: "Сколько дней в високосном году?",
      options: ["365", "366", "367", "364"],
      correctAnswer: 1
    },
    {
      question: "Какой газ составляет большую часть атмосферы Земли?",
      options: ["Кислород", "Углекислый газ", "Азот", "Аргон"],
      correctAnswer: 2
    },
    {
      question: "Кто автор произведения 'Гамлет'?",
      options: ["Шекспир", "Мольер", "Гете", "Байрон"],
      correctAnswer: 0
    },
    {
      question: "В каком городе находится статуя Свободы?",
      options: ["Лос-Анджелес", "Чикаго", "Нью-Йорк", "Бостон"],
      correctAnswer: 2
    }
  ];
  
  constructor(roomId?: string, settings?: Partial<IQuizSettings>) {
    // Настройки для Quiz
    const quizSettings: IQuizSettings = {
      maxPlayers: settings?.gameFormat === '2v2' ? 4 : 2,
      minPlayers: settings?.gameFormat === '2v2' ? 4 : 2,
      timeLimit: undefined, // Используем собственную систему времени
      difficulty: 'medium',
      gameFormat: '1v1',
      totalQuestions: 10,
      questionTimeLimit: 15, // 15 секунд на вопрос
      ...settings
    };
    
    super(roomId, quizSettings);
    
    this._gameFormat = quizSettings.gameFormat!;
    this._totalQuestions = quizSettings.totalQuestions!;
    this._questionTimeLimit = quizSettings.questionTimeLimit!;
    
    // Настраиваем одновременные ходы для Quiz
    this._setSimultaneousMoves(false); // Отключаем, обрабатываем в _executeMove
    this._setRoundDuration(this._questionTimeLimit);
  }
  
  // Реализация абстрактных методов RealtimeGame
  protected _executeMove(playerId: string, move: IQuizMove): void {
    const { answerIndex } = move;
    
    // Проверяем, что игрок еще не отвечал на этот вопрос
    if (this._playerAnswers[playerId]?.[this._currentQuestionIndex] !== undefined) {
      throw new Error('Player has already answered this question');
    }
    
    // Проверяем валидность ответа (допускаем -1 как "пропуск")
    if (answerIndex < -1 || answerIndex >= 4) {
      throw new Error('Invalid answer index');
    }
    
    // Сохраняем ответ
    if (!this._playerAnswers[playerId]) {
      this._playerAnswers[playerId] = {};
    }
    this._playerAnswers[playerId][this._currentQuestionIndex] = answerIndex;
    
    // Проверяем правильность ответа (только если не пропуск)
    const currentQuestion = this._questions[this._currentQuestionIndex];
    let isCorrect = false;
    
    if (answerIndex >= 0) {
      isCorrect = answerIndex === currentQuestion.correctAnswer;
      
      if (isCorrect) {
        this._scores[playerId] = (this._scores[playerId] || 0) + 1;
        
        // Обновляем командный счет для формата 2v2
        if (this._gameFormat === '2v2') {
          this._updateTeamScore(playerId, 1);
        }
      }
    }
    // answerIndex === -1 считается пропуском (автоответ по таймауту)
    
    this._emitEvent({
      type: 'quiz_answer_submitted',
      playerId,
      data: {
        questionIndex: this._currentQuestionIndex,
        answerIndex,
        isCorrect,
        correctAnswer: currentQuestion.correctAnswer,
        newScore: this._scores[playerId]
      },
      timestamp: new Date()
    });
    
    // Проверяем, все ли игроки ответили
    if (this._allPlayersMoved()) {
      // Все ответили - останавливаем таймер и переходим к следующему вопросу
      this._stopQuestionTimer();
      this._processAllMoves();
    }
  }
  
  protected _checkGameEnd(): boolean {
    // Унифицированное условие окончания с _nextRound
    return this._currentQuestionIndex >= this._totalQuestions;
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
  
  // Переопределяем методы для активных игроков
  protected _getActivePlayers(): string[] {
    return this._players.map(p => p.id);
  }
  
  protected _allPlayersMoved(): boolean {
    const answeredPlayers = Object.keys(this._playerAnswers).filter(
      playerId => this._playerAnswers[playerId]?.[this._currentQuestionIndex] !== undefined
    );
    
    return answeredPlayers.length >= this._players.length;
  }
  
  // Переопределяем обработку всех ходов
  protected _processAllMoves(): void {
    // Останавливаем таймер перед переходом
    this._stopQuestionTimer();
    
    // Очищаем pending moves перед переходом
    this._pendingMoves.clear();
    
    // Все игроки ответили на текущий вопрос - переходим к следующему
    this._nextRound();
  }

  // Переопределяем обработку раундов
  protected _nextRound(): void {
    this._currentQuestionIndex++;
    
    if (this._currentQuestionIndex >= this._totalQuestions) {
      // Игра закончена - явно вызываем финиш
      const winner = this._determineWinner();
      
      this._emitEvent({
        type: 'game_finished',
        data: {
          winner,
          finalScores: { ...this._scores },
          teamScores: this._gameFormat === '2v2' ? { ...this._teamScores } : undefined,
          totalQuestions: this._totalQuestions
        },
        timestamp: new Date()
      });
      
      this._finishGame(winner);
      return;
    }
    
    this._currentQuestionStartTime = new Date();
    
    // Пендинг мувы уже очищены в _processAllMoves
    
    // Гарантируем, что у всех игроков есть словарь ответов
    for (const player of this._players) {
      if (!this._playerAnswers[player.id]) {
        this._playerAnswers[player.id] = {};
      }
    }
    
    // Запускаем таймер на вопрос
    this._startQuestionTimer();
    
    this._emitEvent({
      type: 'quiz_next_question',
      data: {
        questionIndex: this._currentQuestionIndex,
        question: this._getCurrentQuestion(),
        timeRemaining: this._questionTimeLimit
      },
      timestamp: new Date()
    });
    
    super._nextRound();
  }
  
  protected _getDefaultMove(playerId: string): IQuizMove | null {
    // При таймауте считаем, что игрок не ответил (ответ -1)
    return { answerIndex: -1 };
  }
  
  // Переопределяем makeMove для обратной совместимости со старым API
  public override makeMove(playerId: string, move: IQuizMove | number): IQuizState {
    // Адаптируем старый формат (число) к новому формату (объект)
    let normalizedMove: IQuizMove;
    
    if (typeof move === 'number') {
      // Старый формат - просто индекс ответа
      normalizedMove = { answerIndex: move };
    } else {
      // Новый формат - объект с индексом ответа
      normalizedMove = move;
    }
    
    return super.makeMove(playerId, normalizedMove);
  }

  // Реализация валидации ходов
  public isValidMove(playerId: string, move: IQuizMove | number): boolean {
    try {
      this._validatePlayerMove(playerId);
      
      // Нормализуем move к новому формату
      const answerIndex = typeof move === 'number' ? move : move.answerIndex;
      
      // Проверяем, что игрок еще не отвечал
      if (this._playerAnswers[playerId]?.[this._currentQuestionIndex] !== undefined) {
        return false;
      }
      
      // Проверяем валидность индекса ответа (допускаем -1 как пропуск)
      if (answerIndex < -1 || answerIndex >= 4) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  // Переопределяем getState для специфичных данных Quiz
  public getState(): IQuizState {
    const baseState = this._getRealtimeState();
    
    const state: IQuizState = {
      ...baseState,
      gameType: this.gameType, // Добавляем gameType для совместимости
      players: this._players, // Используем полный формат IPlayer[]
      currentQuestionIndex: this._currentQuestionIndex,
      currentQuestion: this._getCurrentQuestion(),
      scores: { ...this._scores },
      playerAnswers: { ...this._playerAnswers },
      totalQuestions: this._totalQuestions,
      gameFormat: this._gameFormat,
      questionTimeRemaining: this._getQuestionTimeRemaining()
    };
    
    // Добавляем командную информацию для 2v2
    if (this._gameFormat === '2v2') {
      state.teams = { ...this._teams };
      state.teamScores = { ...this._teamScores };
    }
    
    return state;
  }
  
  // Переопределяем инициализацию игры
  protected _initializeGame(): void {
    // Инициализируем счетчики игроков
    this._scores = {};
    this._playerAnswers = {};
    
    for (const player of this._players) {
      this._scores[player.id] = 0;
      this._playerAnswers[player.id] = {}; // Гарантированная инициализация
    }
    
    // Настраиваем команды для 2v2
    if (this._gameFormat === '2v2') {
      this._setupTeams();
    }
    
    // Генерируем вопросы
    this._generateQuestions();
    
    // Сбрасываем состояние
    this._currentQuestionIndex = 0;
    this._currentQuestionStartTime = new Date();
    
    super._initializeGame();
    
    // Запускаем таймер для первого вопроса
    this._startQuestionTimer();
    
    this._emitEvent({
      type: 'quiz_game_initialized',
      data: {
        gameFormat: this._gameFormat,
        totalQuestions: this._totalQuestions,
        questionTimeLimit: this._questionTimeLimit,
        teams: this._gameFormat === '2v2' ? this._teams : undefined,
        firstQuestion: this._getCurrentQuestion()
      },
      timestamp: new Date()
    });
  }
  
  // Приватные методы
  private _safeAutoAnswer(playerId: string): void {
    // Безопасный метод авто-ответа, который не полагается на валидацию
    try {
      // Проверяем, что игрок ещё не ответил
      if (this._playerAnswers[playerId]?.[this._currentQuestionIndex] !== undefined) {
        return; // Уже ответил
      }
      
      // Инициализируем ответы для игрока если нет
      if (!this._playerAnswers[playerId]) {
        this._playerAnswers[playerId] = {};
      }
      
      // Принудительно сохраняем -1 (пропуск)
      this._playerAnswers[playerId][this._currentQuestionIndex] = -1;
      
      this._emitEvent({
        type: 'quiz_answer_submitted',
        playerId,
        data: {
          questionIndex: this._currentQuestionIndex,
          answerIndex: -1,
          isCorrect: false,
          correctAnswer: this._questions[this._currentQuestionIndex]?.correctAnswer,
          newScore: this._scores[playerId] || 0,
          autoAnswer: true
        },
        timestamp: new Date()
      });
      
      `);
    } catch (error) {
      console.error(`[QuizGameNew] Error in safe auto-answer for ${playerId}:`, error);
    }
  }
  
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
    
    console.log(`Teams initialized: Team1: ${this._teams.team1.join(', ')}, Team2: ${this._teams.team2.join(', ')}`);
  }

  private _generateQuestions(): void {
    // Перемешиваем вопросы и выбираем нужное количество
    const shuffled = [...this.QUESTION_BANK].sort(() => 0.5 - Math.random());
    this._questions = shuffled.slice(0, this._totalQuestions);
  }
  
  private _getCurrentQuestion(): IQuizQuestion | null {
    if (this._currentQuestionIndex >= this._questions.length) {
      return null;
    }
    
    return this._questions[this._currentQuestionIndex];
  }
  
  private _getQuestionTimeRemaining(): number {
    if (!this._currentQuestionStartTime) {
      return this._questionTimeLimit;
    }
    
    const elapsed = (Date.now() - this._currentQuestionStartTime.getTime()) / 1000;
    return Math.max(0, this._questionTimeLimit - elapsed);
  }
  
  private _updateTeamScore(playerId: string, points: number): void {
    if (this._gameFormat !== '2v2') return;
    
    // Проверяем наличие игрока в командах перед начислением
    const team = this.getPlayerTeam(playerId);
    if (!team) {
      console.error(`[QuizGameNew] Player ${playerId} not found in any team when updating score`);
      return;
    }
    
    this._teamScores[team] = (this._teamScores[team] || 0) + points;
    `);
  }
  
  // Утилитарные методы
  public getCurrentQuestionInfo(): {
    question: IQuizQuestion | null;
    questionNumber: number;
    totalQuestions: number;
    timeRemaining: number;
  } {
    return {
      question: this._getCurrentQuestion(),
      questionNumber: this._currentQuestionIndex + 1,
      totalQuestions: this._totalQuestions,
      timeRemaining: this._getQuestionTimeRemaining()
    };
  }
  
  public getPlayerTeam(playerId: string): string | null {
    if (this._gameFormat !== '2v2') return null;
    
    if (this._teams.team1?.includes(playerId)) {
      return 'team1';
    } else if (this._teams.team2?.includes(playerId)) {
      return 'team2';
    }
    
    return null;
  }
  
  public getTeammates(playerId: string): string[] {
    const team = this.getPlayerTeam(playerId);
    if (!team) return [];
    
    return this._teams[team].filter(id => id !== playerId);
  }
  
  public getGameProgress(): number {
    return (this._currentQuestionIndex / this._totalQuestions) * 100;
  }
  
  public getPlayerStats(playerId: string): {
    score: number;
    accuracy: number;
    answeredQuestions: number;
  } {
    const score = this._scores[playerId] || 0;
    const answeredQuestions = Object.keys(this._playerAnswers[playerId] || {}).length;
    const accuracy = answeredQuestions > 0 ? (score / answeredQuestions) * 100 : 0;
    
    return { score, accuracy, answeredQuestions };
  }
  
  public hasPlayerAnswered(playerId: string, questionIndex?: number): boolean {
    const index = questionIndex ?? this._currentQuestionIndex;
    return this._playerAnswers[playerId]?.[index] !== undefined;
  }
  
  // Переопределяем очистку
  // Методы управления таймером
  private _startQuestionTimer(): void {
    // Проверяем, что игра не очищена и активна
    if (this._isCleanedUp || this._status !== 'in_progress') {
      return;
    }
    
    // Останавливаем предыдущий таймер если есть
    this._stopQuestionTimer();
    
    this._questionTimer = setTimeout(() => {
      // Автоматически отвечаем за игроков, которые не ответили
      for (const player of this._players) {
        if (!this._playerAnswers[player.id]?.[this._currentQuestionIndex]) {
          this._safeAutoAnswer(player.id);
        }
      }
      
      // Переходим к следующему вопросу если все ответили или время вышло
      if (this._allPlayersMoved()) {
        this._processAllMoves();
      }
      
    }, this._questionTimeLimit * 1000);
  }
  
  private _stopQuestionTimer(): void {
    if (this._questionTimer) {
      clearTimeout(this._questionTimer);
      this._questionTimer = undefined;
    }
  }

  protected _onCleanup(): void {
    super._onCleanup();
    
    // Выставляем флаг очистки перед остановкой таймера
    this._isCleanedUp = true;
    this._stopQuestionTimer();
    
    this._questions = [];
    this._scores = {};
    this._playerAnswers = {};
    this._teams = {};
    this._teamScores = {};
  }
}

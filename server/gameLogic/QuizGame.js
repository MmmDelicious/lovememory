class QuizGame {
  constructor(players, settings = {}) {
    this.players = players; // Массив ID игроков
    this.gameType = 'quiz';
    this.status = 'in_progress';
    this.currentQuestionIndex = 0;
    this.gameFormat = settings.gameFormat || '1v1'; // '1v1' или '2v2'
    this.maxPlayers = this.gameFormat === '2v2' ? 4 : 2;
    this.scores = {};
    players.forEach(playerId => {
      this.scores[playerId] = 0;
    });
    this.playerAnswers = {}; // {playerId: {questionIndex: answer}}
    this.questions = this.generateQuestions();
    this.currentQuestionStartTime = Date.now();
    this.questionTimeLimit = 15000; // 15 seconds
    this.totalQuestions = settings.totalQuestions || 10;
    this.winner = null;
    this.isDraw = false;
    this.serverTimer = null; // Серверный таймер
    this.isCleanedUp = false; // Флаг для предотвращения повторной очистки
    this.teams = {}; // team1, team2
    this.teamScores = {}; // Счет команд
    if (this.gameFormat === '2v2') {
      this.setupTeams();
    }
    this.startQuestionTimer();
  }
  setupTeams() {
    this.teams.team1 = [];
    this.teams.team2 = [];
    this.teamScores.team1 = 0;
    this.teamScores.team2 = 0;
    this.players.forEach((playerId, index) => {
      if (index < 2) {
        this.teams.team1.push(playerId);
      } else {
        this.teams.team2.push(playerId);
      }
    });
  }
  getPlayerTeam(playerId) {
    if (this.gameFormat !== '2v2') return null;
    if (this.teams.team1 && this.teams.team1.includes(playerId)) {
      return 'team1';
    } else if (this.teams.team2 && this.teams.team2.includes(playerId)) {
      return 'team2';
    }
    return null;
  }
  updateTeamScore(playerId, points) {
    if (this.gameFormat !== '2v2') return;
    const team = this.getPlayerTeam(playerId);
    if (team) {
      this.teamScores[team] += points;
    }
  }
  generateQuestions() {
    const questionBank = [
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
    const shuffled = questionBank.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, this.totalQuestions);
  }
  getCurrentQuestion() {
    if (!this.questions || this.isCleanedUp) {
      return null;
    }
    if (this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    return {
      ...this.questions[this.currentQuestionIndex],
      questionNumber: this.currentQuestionIndex + 1,
      totalQuestions: this.totalQuestions,
      timeRemaining: this.getTimeRemaining()
    };
  }
  getTimeRemaining() {
    if (this.isShowingResults) return 0;
    const elapsed = Date.now() - this.currentQuestionStartTime;
    const remaining = Math.max(0, this.questionTimeLimit - elapsed);
    return Math.ceil(remaining / 1000); // В секундах
  }
  isTimeUp() {
    return this.getTimeRemaining() <= 0;
  }
  startQuestionTimer() {
    if (this.isCleanedUp) {
      console.log(`[QUIZ] Cannot start timer - game is cleaned up`);
      return;
    }
    console.log(`[QUIZ] Starting server timer for question ${this.currentQuestionIndex + 1}`);
    if (this.serverTimer) {
      clearTimeout(this.serverTimer);
      this.serverTimer = null;
    }
    this.serverTimer = setTimeout(() => {
      if (this.isCleanedUp) {
        console.log(`[QUIZ] Timer callback ignored - game is cleaned up`);
        return;
      }
      console.log(`[QUIZ] Server timer expired for question ${this.currentQuestionIndex + 1}`);
      this.forceNextQuestion();
    }, this.questionTimeLimit);
  }
  forceNextQuestion() {
    console.log(`[QUIZ] Force moving to next question due to timeout`);
    this.nextQuestion();
  }
  makeMove(playerId, answerIndex) {
    console.log(`[QUIZ] makeMove called: playerId=${playerId}, answerIndex=${answerIndex}`);
    if (this.status !== 'in_progress') {
      throw new Error('Game is already over');
    }
    if (this.currentQuestionIndex >= this.questions.length) {
      throw new Error('No more questions');
    }
    if (this.isTimeUp()) {
      throw new Error('Time is up for this question');
    }
    if (this.playerAnswers[playerId] && this.playerAnswers[playerId][this.currentQuestionIndex] !== undefined) {
      throw new Error('Player has already answered this question');
    }
    if (!this.playerAnswers[playerId]) {
      this.playerAnswers[playerId] = {};
    }
    this.playerAnswers[playerId][this.currentQuestionIndex] = answerIndex;
    const currentQuestion = this.questions[this.currentQuestionIndex];
    console.log(`[QUIZ] Current question index: ${this.currentQuestionIndex}`);
    console.log(`[QUIZ] Player ${playerId} answered ${answerIndex} (type: ${typeof answerIndex}), correct is ${currentQuestion.correctAnswer} (type: ${typeof currentQuestion.correctAnswer})`);
    console.log(`[QUIZ] Question: ${currentQuestion.question}`);
    console.log(`[QUIZ] Options: ${JSON.stringify(currentQuestion.options)}`);
    console.log(`[QUIZ] Correct option: ${currentQuestion.options[currentQuestion.correctAnswer]}`);
    console.log(`[QUIZ] Selected option: ${currentQuestion.options[answerIndex]}`);
    const playerAnswer = parseInt(answerIndex);
    const correctAnswer = parseInt(currentQuestion.correctAnswer);
    console.log(`[QUIZ] Comparing: ${playerAnswer} === ${correctAnswer}`);
    if (playerAnswer === correctAnswer) {
      this.scores[playerId]++;
      console.log(`[QUIZ] ✅ CORRECT ANSWER! Score now: ${this.scores[playerId]}`);
      if (this.gameFormat === '2v2') {
        this.updateTeamScore(playerId, 1);
      }
    } else {
      console.log(`[QUIZ] ❌ WRONG ANSWER! Player chose: ${currentQuestion.options[answerIndex]}, correct was: ${currentQuestion.options[correctAnswer]}`);
    }
    const answeredPlayers = Object.keys(this.playerAnswers).filter(
      id => this.playerAnswers[id][this.currentQuestionIndex] !== undefined
    );
    console.log(`[QUIZ] Players who answered: ${answeredPlayers.length}/${this.players.length}`);
    if (answeredPlayers.length === this.players.length) {
      console.log(`[QUIZ] All players answered, moving to next question`);
      if (this.serverTimer) {
        clearTimeout(this.serverTimer);
        this.serverTimer = null;
      }
      this.nextQuestion();
    }
    return this.getState();
  }
  nextQuestion() {
    console.log(`[QUIZ] ===== NEXT QUESTION LOGIC =====`);
    console.log(`[QUIZ] Moving from question ${this.currentQuestionIndex + 1} to ${this.currentQuestionIndex + 2}`);
    console.log(`[QUIZ] Current index before increment: ${this.currentQuestionIndex}`);
    this.currentQuestionIndex++;
    console.log(`[QUIZ] Current index after increment: ${this.currentQuestionIndex}`);
    console.log(`[QUIZ] Total questions: ${this.totalQuestions}`);
    console.log(`[QUIZ] Should end game? ${this.currentQuestionIndex >= this.totalQuestions}`);
    this.currentQuestionStartTime = Date.now();
    if (this.currentQuestionIndex >= this.totalQuestions) {
      console.log(`[QUIZ] Game finished! Question ${this.currentQuestionIndex} >= ${this.totalQuestions}`);
      console.log(`[QUIZ] Calling endGame()...`);
      this.endGame();
    } else {
      console.log(`[QUIZ] Next question ready: ${this.currentQuestionIndex + 1}/${this.totalQuestions}`);
      this.startQuestionTimer();
    }
    console.log(`[QUIZ] ===== NEXT QUESTION LOGIC COMPLETE =====`);
  }
  endGame() {
    console.log(`[QUIZ] ===== ENDING GAME =====`);
    console.log(`[QUIZ] Current question index: ${this.currentQuestionIndex}`);
    console.log(`[QUIZ] Total questions: ${this.totalQuestions}`);
    console.log(`[QUIZ] Game status before: ${this.status}`);
    this.status = 'finished';
    if (this.serverTimer) {
      clearTimeout(this.serverTimer);
      this.serverTimer = null;
      console.log(`[QUIZ] Server timer cleared`);
    }
    if (this.gameFormat === '2v2') {
      console.log(`[QUIZ] Team scores: team1 = ${this.teamScores.team1}, team2 = ${this.teamScores.team2}`);
      if (this.teamScores.team1 > this.teamScores.team2) {
        this.winner = 'team1';
      } else if (this.teamScores.team2 > this.teamScores.team1) {
        this.winner = 'team2';
      } else {
        this.winner = 'draw';
        this.isDraw = true;
      }
      console.log(`[QUIZ] Game ended. Team scores: ${this.teamScores.team1} vs ${this.teamScores.team2}. Winner: ${this.winner}`);
    } else {
      const player1Score = this.scores[this.players[0]];
      const player2Score = this.scores[this.players[1]];
      console.log(`[QUIZ] Player scores: ${this.players[0]} = ${player1Score}, ${this.players[1]} = ${player2Score}`);
      if (player1Score > player2Score) {
        this.winner = this.players[0];
      } else if (player2Score > player1Score) {
        this.winner = this.players[1];
      } else {
        this.winner = 'draw';
        this.isDraw = true;
      }
      console.log(`[QUIZ] Game ended. Scores: ${player1Score} vs ${player2Score}. Winner: ${this.winner}`);
    }
    console.log(`[QUIZ] Final game status: ${this.status}`);
    console.log(`[QUIZ] ===== GAME END COMPLETE =====`);
  }
  getState() {
    if (this.isCleanedUp) {
      return {
        gameType: this.gameType,
        status: 'finished',
        players: [],
        scores: {},
        currentQuestionIndex: 0,
        currentQuestion: null,
        winner: null,
        isDraw: false,
        playerAnswers: {}
      };
    }
    const baseState = {
      gameType: this.gameType,
      status: this.status,
      players: this.players,
      scores: this.scores,
      currentQuestionIndex: this.currentQuestionIndex,
      currentQuestion: this.getCurrentQuestion(),
      winner: this.winner,
      isDraw: this.isDraw,
      playerAnswers: this.playerAnswers,
      totalQuestions: this.totalQuestions,
      gameFormat: this.gameFormat
    };
    if (this.gameFormat === '2v2') {
      baseState.teams = this.teams;
      baseState.teamScores = this.teamScores;
    }
    return baseState;
  }
  cleanup() {
    if (this.isCleanedUp) {
      console.log(`[QUIZ] Game already cleaned up`);
      return;
    }
    this.isCleanedUp = true;
    if (this.serverTimer) {
      clearTimeout(this.serverTimer);
      this.serverTimer = null;
    }
    this.players = null;
    this.scores = null;
    this.playerAnswers = null;
    this.questions = null;
    console.log(`[QUIZ] Game cleanup completed`);
  }
}
module.exports = QuizGame;

class QuizGame {
  constructor(players) {
    this.players = players; // [player1_id, player2_id]
    this.gameType = 'quiz';
    this.status = 'in_progress';
    this.currentQuestionIndex = 0;
    this.scores = {
      [players[0]]: 0,
      [players[1]]: 0,
    };
    this.playerAnswers = {}; // {playerId: {questionIndex: answer}}
    this.questions = this.generateQuestions();
    this.currentQuestionStartTime = Date.now();
    this.questionTimeLimit = 15000; // 15 seconds
    this.totalQuestions = 10;
    this.winner = null;
    this.isDraw = false;
    this.serverTimer = null; // Серверный таймер
    this.isCleanedUp = false; // Флаг для предотвращения повторной очистки
    
    // Запускаем серверный таймер для первого вопроса
    this.startQuestionTimer();
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

    // Перемешиваем вопросы и берем 10
    const shuffled = questionBank.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, this.totalQuestions);
  }

  getCurrentQuestion() {
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

  // Запуск серверного таймера для вопроса
  startQuestionTimer() {
    if (this.isCleanedUp) {
      console.log(`[QUIZ] Cannot start timer - game is cleaned up`);
      return;
    }

    console.log(`[QUIZ] Starting server timer for question ${this.currentQuestionIndex + 1}`);

    // Очищаем предыдущий таймер
    if (this.serverTimer) {
      clearTimeout(this.serverTimer);
      this.serverTimer = null;
    }

    // Устанавливаем таймер на время вопроса
    this.serverTimer = setTimeout(() => {
      if (this.isCleanedUp) {
        console.log(`[QUIZ] Timer callback ignored - game is cleaned up`);
        return;
      }
      console.log(`[QUIZ] Server timer expired for question ${this.currentQuestionIndex + 1}`);
      this.forceNextQuestion();
    }, this.questionTimeLimit);
  }

  // Принудительный переход к следующему вопросу (по таймеру)
  forceNextQuestion() {
    console.log(`[QUIZ] Force moving to next question due to timeout`);
    
    // Убираем сохранение результатов между вопросами
    // Переходим к следующему вопросу
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

    // Проверяем, не истекло ли время
    if (this.isTimeUp()) {
      throw new Error('Time is up for this question');
    }

    // Проверяем, не ответил ли игрок уже
    if (this.playerAnswers[playerId] && this.playerAnswers[playerId][this.currentQuestionIndex] !== undefined) {
      throw new Error('Player has already answered this question');
    }

    // Сохраняем ответ игрока
    if (!this.playerAnswers[playerId]) {
      this.playerAnswers[playerId] = {};
    }
    
    this.playerAnswers[playerId][this.currentQuestionIndex] = answerIndex;

    // Проверяем правильность ответа
    const currentQuestion = this.questions[this.currentQuestionIndex];
    console.log(`[QUIZ] Current question index: ${this.currentQuestionIndex}`);
    console.log(`[QUIZ] Player ${playerId} answered ${answerIndex} (type: ${typeof answerIndex}), correct is ${currentQuestion.correctAnswer} (type: ${typeof currentQuestion.correctAnswer})`);
    console.log(`[QUIZ] Question: ${currentQuestion.question}`);
    console.log(`[QUIZ] Options: ${JSON.stringify(currentQuestion.options)}`);
    console.log(`[QUIZ] Correct option: ${currentQuestion.options[currentQuestion.correctAnswer]}`);
    console.log(`[QUIZ] Selected option: ${currentQuestion.options[answerIndex]}`);
    
    // Убеждаемся, что сравниваем числа
    const playerAnswer = parseInt(answerIndex);
    const correctAnswer = parseInt(currentQuestion.correctAnswer);
    
    console.log(`[QUIZ] Comparing: ${playerAnswer} === ${correctAnswer}`);
    
    if (playerAnswer === correctAnswer) {
      this.scores[playerId]++;
      console.log(`[QUIZ] ✅ CORRECT ANSWER! Score now: ${this.scores[playerId]}`);
    } else {
      console.log(`[QUIZ] ❌ WRONG ANSWER! Player chose: ${currentQuestion.options[answerIndex]}, correct was: ${currentQuestion.options[correctAnswer]}`);
    }

    // Если оба игрока ответили, переходим к следующему вопросу
    const answeredPlayers = Object.keys(this.playerAnswers).filter(
      id => this.playerAnswers[id][this.currentQuestionIndex] !== undefined
    );

    console.log(`[QUIZ] Players who answered: ${answeredPlayers.length}/${this.players.length}`);

    if (answeredPlayers.length === this.players.length) {
      console.log(`[QUIZ] All players answered, moving to next question`);
      // Очищаем таймер, так как все ответили
      if (this.serverTimer) {
        clearTimeout(this.serverTimer);
        this.serverTimer = null;
      }
      
      // Переходим к следующему вопросу без сохранения результатов
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

    // Проверяем, закончилась ли игра (currentQuestionIndex начинается с 0)
    if (this.currentQuestionIndex >= this.totalQuestions) {
      console.log(`[QUIZ] Game finished! Question ${this.currentQuestionIndex} >= ${this.totalQuestions}`);
      console.log(`[QUIZ] Calling endGame()...`);
      this.endGame();
    } else {
      console.log(`[QUIZ] Next question ready: ${this.currentQuestionIndex + 1}/${this.totalQuestions}`);
      // Запускаем таймер для следующего вопроса
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
    
    // Очищаем таймер
    if (this.serverTimer) {
      clearTimeout(this.serverTimer);
      this.serverTimer = null;
      console.log(`[QUIZ] Server timer cleared`);
    }
    
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
    console.log(`[QUIZ] Final game status: ${this.status}`);
    console.log(`[QUIZ] ===== GAME END COMPLETE =====`);
  }

  getState() {
    return {
      gameType: this.gameType,
      status: this.status,
      players: this.players,
      scores: this.scores,
      currentQuestionIndex: this.currentQuestionIndex,
      currentQuestion: this.getCurrentQuestion(),
      winner: this.winner,
      isDraw: this.isDraw,
      playerAnswers: this.playerAnswers,
      totalQuestions: this.totalQuestions
    };
  }

  // Очистка ресурсов при удалении игры
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

    // Очищаем все ссылки для предотвращения утечек памяти
    this.players = null;
    this.scores = null;
    this.playerAnswers = null;
    this.questions = null;

    console.log(`[QUIZ] Game cleanup completed`);
  }
}

module.exports = QuizGame;
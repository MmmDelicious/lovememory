"use strict";
/**
 * Базовые интерфейсы для игровой архитектуры
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAME_TYPES_INFO = void 0;
exports.GAME_TYPES_INFO = {
    'tic-tac-toe': {
        id: 'tic-tac-toe',
        name: 'Крестики-нолики',
        description: 'Классическая игра для двоих',
        category: 'logic',
        minPlayers: 2,
        maxPlayers: 2,
        averageDuration: 5,
        difficulty: 'easy',
        tags: ['быстрая', 'логика', 'классика']
    },
    'chess': {
        id: 'chess',
        name: 'Шахматы',
        description: 'Стратегическая битва умов',
        category: 'strategy',
        minPlayers: 2,
        maxPlayers: 2,
        averageDuration: 30,
        difficulty: 'hard',
        tags: ['стратегия', 'классика', 'мышление']
    },
    'memory': {
        id: 'memory',
        name: 'Мемори',
        description: 'Тренируйте память',
        category: 'memory',
        minPlayers: 2,
        maxPlayers: 4,
        averageDuration: 10,
        difficulty: 'easy',
        tags: ['память', 'концентрация', 'быстрая']
    },
    'poker': {
        id: 'poker',
        name: 'Покер',
        description: 'Карточная игра на мастерство',
        category: 'cards',
        minPlayers: 2,
        maxPlayers: 6,
        averageDuration: 45,
        difficulty: 'hard',
        tags: ['карты', 'блеф', 'стратегия']
    },
    'quiz': {
        id: 'quiz',
        name: 'Квиз',
        description: 'Проверьте свои знания',
        category: 'trivia',
        minPlayers: 2,
        maxPlayers: 4,
        averageDuration: 15,
        difficulty: 'medium',
        tags: ['знания', 'эрудиция', 'викторина']
    },
    'wordle': {
        id: 'wordle',
        name: 'Wordle',
        description: 'Угадайте слово за 6 попыток',
        category: 'word',
        minPlayers: 1,
        maxPlayers: 4,
        averageDuration: 10,
        difficulty: 'medium',
        tags: ['слова', 'логика', 'угадайка']
    },
    'codenames': {
        id: 'codenames',
        name: 'Codenames',
        description: 'Командная игра на ассоциации',
        category: 'team',
        minPlayers: 4,
        maxPlayers: 4,
        averageDuration: 20,
        difficulty: 'medium',
        tags: ['команда', 'ассоциации', 'творчество']
    }
};
//# sourceMappingURL=game.interfaces.js.map
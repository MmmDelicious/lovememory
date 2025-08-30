'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('interests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      category: {
        type: Sequelize.ENUM(
          'food',          // Еда
          'cinema',        // Кино
          'hobby',         // Хобби
          'sport',         // Спорт
          'travel',        // Путешествия
          'music',         // Музыка
          'art',           // Искусство
          'books',         // Книги
          'games',         // Игры
          'nature',        // Природа
          'technology',    // Технологии
          'fashion',       // Мода
          'cooking',       // Готовка
          'fitness',       // Фитнес
          'photography',   // Фотография
          'dancing',       // Танцы
          'shopping',      // Шоппинг
          'animals',       // Животные
          'cars',          // Автомобили
          'crafts',        // Рукоделие
          'education',     // Образование
          'volunteering',  // Волонтерство
          'other'          // Другое
        ),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      emoji: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      popularity_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      }
    });

    // Создаем индексы
    await queryInterface.addIndex('interests', ['category'], {
      name: 'idx_interests_category'
    });

    await queryInterface.addIndex('interests', ['name'], {
      name: 'idx_interests_name'
    });

    await queryInterface.addIndex('interests', ['is_active'], {
      name: 'idx_interests_active'
    });

    await queryInterface.addIndex('interests', ['popularity_score'], {
      name: 'idx_interests_popularity'
    });

    // Добавляем базовые интересы
    const baseInterests = [
      // Еда
      { name: 'Рестораны', category: 'food', emoji: '🍽️', description: 'Посещение ресторанов' },
      { name: 'Кафе', category: 'food', emoji: '☕', description: 'Кофейни и кафе' },
      { name: 'Стрит-фуд', category: 'food', emoji: '🌮', description: 'Уличная еда' },
      { name: 'Веганская еда', category: 'food', emoji: '🥗', description: 'Веганские блюда' },
      
      // Кино и развлечения
      { name: 'Кино', category: 'cinema', emoji: '🎬', description: 'Просмотр фильмов' },
      { name: 'Театр', category: 'cinema', emoji: '🎭', description: 'Театральные постановки' },
      { name: 'Концерты', category: 'music', emoji: '🎵', description: 'Живая музыка' },
      { name: 'Стендап', category: 'cinema', emoji: '😄', description: 'Комедийные шоу' },
      
      // Спорт и фитнес
      { name: 'Фитнес', category: 'fitness', emoji: '💪', description: 'Тренировки в зале' },
      { name: 'Йога', category: 'fitness', emoji: '🧘', description: 'Практика йоги' },
      { name: 'Бег', category: 'sport', emoji: '🏃', description: 'Пробежки' },
      { name: 'Велосипед', category: 'sport', emoji: '🚴', description: 'Велопрогулки' },
      { name: 'Плавание', category: 'sport', emoji: '🏊', description: 'Плавание в бассейне' },
      
      // Хобби
      { name: 'Чтение', category: 'books', emoji: '📚', description: 'Чтение книг' },
      { name: 'Рисование', category: 'art', emoji: '🎨', description: 'Изобразительное искусство' },
      { name: 'Фотография', category: 'photography', emoji: '📸', description: 'Фотосъемка' },
      { name: 'Готовка', category: 'cooking', emoji: '👨‍🍳', description: 'Приготовление еды' },
      
      // Игры
      { name: 'Настольные игры', category: 'games', emoji: '🎲', description: 'Настольные игры' },
      { name: 'Видеоигры', category: 'games', emoji: '🎮', description: 'Компьютерные игры' },
      { name: 'Квесты', category: 'games', emoji: '🔍', description: 'Квест-румы' },
      
      // Природа и путешествия
      { name: 'Походы', category: 'nature', emoji: '🥾', description: 'Пешие походы' },
      { name: 'Пикники', category: 'nature', emoji: '🧺', description: 'Отдых на природе' },
      { name: 'Путешествия', category: 'travel', emoji: '✈️', description: 'Поездки и путешествия' },
      { name: 'Пляж', category: 'nature', emoji: '🏖️', description: 'Отдых у воды' },
      
      // Культура
      { name: 'Музеи', category: 'art', emoji: '🏛️', description: 'Посещение музеев' },
      { name: 'Выставки', category: 'art', emoji: '🖼️', description: 'Художественные выставки' },
      { name: 'Мастер-классы', category: 'education', emoji: '👩‍🏫', description: 'Обучающие занятия' },
      
      // Музыка и танцы
      { name: 'Танцы', category: 'dancing', emoji: '💃', description: 'Танцевальные занятия' },
      { name: 'Караоке', category: 'music', emoji: '🎤', description: 'Пение караоке' },
      
      // Другое
      { name: 'Шоппинг', category: 'shopping', emoji: '🛍️', description: 'Покупки' },
      { name: 'Животные', category: 'animals', emoji: '🐕', description: 'Общение с животными' },
      { name: 'Автомобили', category: 'cars', emoji: '🚗', description: 'Автомобильная тематика' },
      { name: 'Мода', category: 'fashion', emoji: '👗', description: 'Мода и стиль' }
    ];

    const interestsToInsert = baseInterests.map(interest => ({
      id: require('crypto').randomUUID(),
      name: interest.name,
      category: interest.category,
      emoji: interest.emoji,
      description: interest.description,
      is_active: true,
      popularity_score: 0,
      created_at: new Date(),
      updated_at: new Date()
    }));
    
    await queryInterface.bulkInsert('interests', interestsToInsert);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('interests');
  }
};

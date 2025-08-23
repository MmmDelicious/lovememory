'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // ===== ACHIEVEMENT TABLE =====
    // Система достижений для пар - геймификация и мотивация
    await queryInterface.createTable('achievements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      pair_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Pairs',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'ID пары, получившей достижение'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'ID пользователя, который заработал достижение (может быть null для парных достижений)'
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Тип достижения: game_win, streak, first_gift, lesson_complete, etc.'
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'general',
        comment: 'Категория: games, lessons, gifts, social, milestones'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Название достижения'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Описание достижения'
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Путь к иконке достижения'
      },
      rarity: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'common',
        comment: 'Редкость: common, rare, epic, legendary'
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
        comment: 'Очки за достижение'
      },
      earned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Дата получения достижения'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Дополнительные данные: статистика, прогресс, связанные объекты'
      },
      is_hidden: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Скрытое достижение (показывается только после получения)'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // ===== ИНДЕКСЫ =====
    // Основные индексы для быстрого поиска
    await queryInterface.addIndex('achievements', ['pair_id'], {
      name: 'idx_achievements_pair'
    });

    await queryInterface.addIndex('achievements', ['user_id'], {
      name: 'idx_achievements_user'
    });

    await queryInterface.addIndex('achievements', ['type'], {
      name: 'idx_achievements_type'
    });

    await queryInterface.addIndex('achievements', ['category'], {
      name: 'idx_achievements_category'
    });

    await queryInterface.addIndex('achievements', ['rarity'], {
      name: 'idx_achievements_rarity'
    });

    await queryInterface.addIndex('achievements', ['earned_at'], {
      name: 'idx_achievements_earned'
    });

    // Композитные индексы
    await queryInterface.addIndex('achievements', ['pair_id', 'earned_at'], {
      name: 'idx_achievements_pair_earned'
    });

    await queryInterface.addIndex('achievements', ['pair_id', 'category'], {
      name: 'idx_achievements_pair_category'
    });

    await queryInterface.addIndex('achievements', ['user_id', 'earned_at'], {
      name: 'idx_achievements_user_earned'
    });

    // GIN индекс для JSONB поиска
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_achievements_metadata_gin ON achievements USING GIN (metadata)
    `);
  },

  async down (queryInterface, Sequelize) {
    // Откат в обратном порядке
    
    // Удаляем GIN индекс
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_achievements_metadata_gin
    `);
    
    // Удаляем композитные индексы
    await queryInterface.removeIndex('achievements', 'idx_achievements_user_earned');
    await queryInterface.removeIndex('achievements', 'idx_achievements_pair_category');
    await queryInterface.removeIndex('achievements', 'idx_achievements_pair_earned');
    
    // Удаляем основные индексы
    await queryInterface.removeIndex('achievements', 'idx_achievements_earned');
    await queryInterface.removeIndex('achievements', 'idx_achievements_rarity');
    await queryInterface.removeIndex('achievements', 'idx_achievements_category');
    await queryInterface.removeIndex('achievements', 'idx_achievements_type');
    await queryInterface.removeIndex('achievements', 'idx_achievements_user');
    await queryInterface.removeIndex('achievements', 'idx_achievements_pair');
    
    // Удаляем таблицу
    await queryInterface.dropTable('achievements');
  }
};

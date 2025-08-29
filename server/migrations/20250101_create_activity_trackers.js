'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('activity_trackers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      pair_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Pairs',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      daily_steps: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Количество шагов за день'
      },
      weekly_goal: {
        type: Sequelize.INTEGER,
        defaultValue: 10000,
        comment: 'Цель по шагам на неделю'
      },
      daily_goal: {
        type: Sequelize.INTEGER,
        defaultValue: 10000,
        comment: 'Цель по шагам на день'
      },
      calories_burned: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Сожженные калории'
      },
      active_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Активные минуты'
      },
      distance_km: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
        comment: 'Пройденное расстояние в км'
      },
      current_streak: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Текущая серия дней с достижением цели'
      },
      longest_streak: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Самая длинная серия дней'
      },
      total_days_active: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Общее количество активных дней'
      },
      achievements: {
        type: Sequelize.JSONB,
        defaultValue: [],
        comment: 'Массив полученных достижений'
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {
          notifications: true,
          autoSync: true,
          privacy: 'public',
          goalAdjustment: 'auto'
        },
        comment: 'Настройки трекера'
      },
      last_sync: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        comment: 'Последняя синхронизация'
      },
      data_source: {
        type: Sequelize.STRING,
        defaultValue: 'manual',
        comment: 'Источник данных: manual, health_kit, google_fit, etc.'
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
    await queryInterface.addIndex('activity_trackers', ['user_id', 'created_at'], {
      name: 'idx_activity_trackers_user_created'
    });

    await queryInterface.addIndex('activity_trackers', ['pair_id', 'created_at'], {
      name: 'idx_activity_trackers_pair_created'
    });

    await queryInterface.addIndex('activity_trackers', ['daily_steps'], {
      name: 'idx_activity_trackers_steps'
    });

    await queryInterface.addIndex('activity_trackers', ['user_id'], {
      name: 'idx_activity_trackers_user_unique',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('activity_trackers');
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // ===== CONSENT TABLE =====
    // Создаем таблицу CONSENT согласно целевой схеме
    await queryInterface.createTable('consents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'ID пользователя, давшего согласие'
      },
      analytics_opt_in: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Согласие на использование данных для аналитики'
      },
      ai_opt_in: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Согласие на использование данных для ИИ'
      },
      share_messages_for_analysis: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Согласие на анализ сообщений для ML'
      },
      consented_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Время предоставления согласия'
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

    // ===== INSIGHT TABLE =====
    // Создаем таблицу INSIGHT согласно целевой схеме
    await queryInterface.createTable('insights', {
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
        comment: 'ID пары для которой сгенерирован инсайт'
      },
      insight_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Тип инсайта: compatibility, activity_pattern, recommendation, etc.'
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Краткое описание инсайта'
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Детальные данные инсайта в JSON формате'
      },
      model_version: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Версия ML модели, создавшей инсайт'
      },
      generated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Время генерации инсайта'
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

    // ===== NOTIFICATION_TOKEN TABLE =====
    // Создаем таблицу NOTIFICATION_TOKEN согласно целевой схеме
    await queryInterface.createTable('notification_tokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'ID пользователя-владельца токена'
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Провайдер уведомлений: firebase, apns, web_push, etc.'
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Токен для отправки уведомлений'
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Активен ли токен'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Время создания токена'
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
    // CONSENT индексы
    await queryInterface.addIndex('consents', ['user_id'], {
      unique: true,
      name: 'unique_consent_user'
    });

    // INSIGHT индексы
    await queryInterface.addIndex('insights', ['pair_id'], {
      name: 'idx_insights_pair'
    });

    await queryInterface.addIndex('insights', ['insight_type'], {
      name: 'idx_insights_type'
    });

    await queryInterface.addIndex('insights', ['generated_at'], {
      name: 'idx_insights_generated'
    });

    await queryInterface.addIndex('insights', ['pair_id', 'generated_at'], {
      name: 'idx_insights_pair_generated'
    });

    // NOTIFICATION_TOKEN индексы
    await queryInterface.addIndex('notification_tokens', ['user_id'], {
      name: 'idx_notification_tokens_user'
    });

    await queryInterface.addIndex('notification_tokens', ['provider'], {
      name: 'idx_notification_tokens_provider'
    });

    await queryInterface.addIndex('notification_tokens', ['enabled'], {
      name: 'idx_notification_tokens_enabled'
    });

    await queryInterface.addIndex('notification_tokens', ['user_id', 'provider'], {
      name: 'idx_notification_tokens_user_provider'
    });
  },

  async down (queryInterface, Sequelize) {
    // Откат в обратном порядке
    
    // Удаляем индексы NOTIFICATION_TOKEN
    await queryInterface.removeIndex('notification_tokens', 'idx_notification_tokens_user');
    await queryInterface.removeIndex('notification_tokens', 'idx_notification_tokens_provider');
    await queryInterface.removeIndex('notification_tokens', 'idx_notification_tokens_enabled');
    await queryInterface.removeIndex('notification_tokens', 'idx_notification_tokens_user_provider');
    
    // Удаляем индексы INSIGHT
    await queryInterface.removeIndex('insights', 'idx_insights_pair');
    await queryInterface.removeIndex('insights', 'idx_insights_type');
    await queryInterface.removeIndex('insights', 'idx_insights_generated');
    await queryInterface.removeIndex('insights', 'idx_insights_pair_generated');
    
    // Удаляем индексы CONSENT
    await queryInterface.removeIndex('consents', 'unique_consent_user');
    
    // Удаляем таблицы
    await queryInterface.dropTable('notification_tokens');
    await queryInterface.dropTable('insights');
    await queryInterface.dropTable('consents');
  }
};

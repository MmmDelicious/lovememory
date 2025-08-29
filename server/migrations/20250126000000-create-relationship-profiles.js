'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('relationship_profiles', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        field: 'user_id',
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      loveLanguages: {
        type: Sequelize.JSON,
        allowNull: false,
        field: 'love_languages',
        defaultValue: {
          physical_touch: 0.2,
          quality_time: 0.2,
          words_of_affirmation: 0.2,
          acts_of_service: 0.2,
          receiving_gifts: 0.2
        }
      },
      relationshipGraph: {
        type: Sequelize.JSON,
        allowNull: false,
        field: 'relationship_graph',
        defaultValue: {
          nodes: [],
          connections: [],
          overallStrength: 75
        }
      },
      sentimentTrend: {
        type: Sequelize.FLOAT,
        allowNull: false,
        field: 'sentiment_trend',
        defaultValue: 0.0,
        validate: {
          min: -1.0,
          max: 1.0
        }
      },
      activityPatterns: {
        type: Sequelize.JSON,
        allowNull: false,
        field: 'activity_patterns',
        defaultValue: {
          timePreferences: { morning: 0.1, afternoon: 0.3, evening: 0.5, night: 0.1 },
          budgetLevel: 'medium',
          categoryPreferences: {},
          frequencyScore: 0.5
        }
      },
      communicationStyle: {
        type: Sequelize.JSON,
        allowNull: false,
        field: 'communication_style',
        defaultValue: {
          preferredTone: 'friendly',
          responseLength: 'medium',
          humorLevel: 0.7,
          formalityLevel: 0.3
        }
      },
      aiInteractionQuality: {
        type: Sequelize.JSON,
        allowNull: false,
        field: 'ai_interaction_quality',
        defaultValue: {
          averageRating: 0,
          totalInteractions: 0,
          positiveResponses: 0,
          negativeResponses: 0,
          lastInteractionAt: null
        }
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Version for migration compatibility'
      },
      lastAnalyzedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'last_analyzed_at',
        defaultValue: Sequelize.NOW
      },
      analysisStatus: {
        type: Sequelize.ENUM('pending', 'analyzing', 'completed', 'error'),
        allowNull: false,
        field: 'analysis_status',
        defaultValue: 'pending'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at',
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at',
        defaultValue: Sequelize.NOW
      }
    });

    // Добавляем индексы для оптимизации
    await queryInterface.addIndex('relationship_profiles', ['user_id'], {
      name: 'relationship_profiles_user_id_idx',
      unique: true
    });

    await queryInterface.addIndex('relationship_profiles', ['last_analyzed_at'], {
      name: 'relationship_profiles_last_analyzed_at_idx'
    });

    await queryInterface.addIndex('relationship_profiles', ['analysis_status'], {
      name: 'relationship_profiles_analysis_status_idx'
    });

    },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('relationship_profiles');
    }
};

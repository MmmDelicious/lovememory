'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // ===== USER TABLE =====
    // Добавляем email_verified для соответствия целевой схеме
    await queryInterface.addColumn('Users', 'email_verified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Подтвержден ли email пользователя'
    });

    // ===== PAIR TABLE =====
    // Добавляем name и harmony_index
    await queryInterface.addColumn('Pairs', 'name', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Название пары (например "Анна и Иван")'
    });

    await queryInterface.addColumn('Pairs', 'harmony_index', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 50,
      comment: 'Индекс гармонии пары (0-100)'
    });

    await queryInterface.addColumn('Pairs', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Метаданные пары в JSON формате'
    });

    // ===== EVENT TABLE =====
    // Добавляем creator_user_id и metadata
    await queryInterface.addColumn('Events', 'creator_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'Кто создал событие (дублирует userId для совместимости)'
    });

    await queryInterface.addColumn('Events', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Метаданные события в JSON формате'
    });

    // Заполняем creator_user_id из существующих userId
    await queryInterface.sequelize.query(`
      UPDATE "Events" SET creator_user_id = "userId" WHERE creator_user_id IS NULL
    `);

    // ===== MEDIA TABLE =====
    // Добавляем uploaded_by, size_bytes, blurhash, mime_type
    await queryInterface.addColumn('Media', 'uploaded_by', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'Кто загрузил медиа файл'
    });

    await queryInterface.addColumn('Media', 'size_bytes', {
      type: Sequelize.BIGINT,
      allowNull: true,
      comment: 'Размер файла в байтах'
    });

    await queryInterface.addColumn('Media', 'blurhash', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'BlurHash для быстрого превью изображений'
    });

    await queryInterface.addColumn('Media', 'mime_type', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'MIME тип файла (image/jpeg, video/mp4, etc.)'
    });

    // ===== GAME_ROOM TABLE =====
    // Добавляем state (строку состояния)
    await queryInterface.addColumn('GameRooms', 'state', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'waiting',
      comment: 'Состояние игровой комнаты'
    });

    // Переименовываем gameSettings в settings для соответствия схеме
    await queryInterface.renameColumn('GameRooms', 'gameSettings', 'settings');

    // Заполняем state из существующего status
    await queryInterface.sequelize.query(`
      UPDATE "GameRooms" SET state = status WHERE state = 'waiting'
    `);
  },

  async down (queryInterface, Sequelize) {
    // Откат изменений в обратном порядке
    
    // GAME_ROOM
    await queryInterface.renameColumn('GameRooms', 'settings', 'gameSettings');
    await queryInterface.removeColumn('GameRooms', 'state');
    
    // MEDIA
    await queryInterface.removeColumn('Media', 'uploaded_by');
    await queryInterface.removeColumn('Media', 'size_bytes');
    await queryInterface.removeColumn('Media', 'blurhash');
    await queryInterface.removeColumn('Media', 'mime_type');
    
    // EVENT
    await queryInterface.removeColumn('Events', 'creator_user_id');
    await queryInterface.removeColumn('Events', 'metadata');
    
    // PAIR
    await queryInterface.removeColumn('Pairs', 'name');
    await queryInterface.removeColumn('Pairs', 'harmony_index');
    await queryInterface.removeColumn('Pairs', 'metadata');
    
    // USER
    await queryInterface.removeColumn('Users', 'email_verified');
  }
};

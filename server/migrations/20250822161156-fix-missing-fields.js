'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Безопасно добавляем недостающие поля
    // Проверяем каждое поле перед добавлением
    
    try {
      // ===== USER TABLE - email_verified =====
      const usersTable = await queryInterface.describeTable('Users');
      
      if (!usersTable.email_verified) {
        console.log('Добавляем email_verified в Users...');
        await queryInterface.addColumn('Users', 'email_verified', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Подтвержден ли email пользователя'
        });
      } else {
        console.log('email_verified уже существует в Users');
      }
      
      // ===== PAIR TABLE =====
      const pairsTable = await queryInterface.describeTable('Pairs');
      
      if (!pairsTable.name) {
        console.log('Добавляем name в Pairs...');
        await queryInterface.addColumn('Pairs', 'name', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Название пары'
        });
      } else {
        console.log('name уже существует в Pairs');
      }
      
      if (!pairsTable.harmony_index) {
        console.log('Добавляем harmony_index в Pairs...');
        await queryInterface.addColumn('Pairs', 'harmony_index', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 50,
          comment: 'Индекс гармонии пары (0-100)'
        });
      } else {
        console.log('harmony_index уже существует в Pairs');
      }
      
      if (!pairsTable.metadata) {
        console.log('Добавляем metadata в Pairs...');
        await queryInterface.addColumn('Pairs', 'metadata', {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: {},
          comment: 'Метаданные пары в JSON формате'
        });
      } else {
        console.log('metadata уже существует в Pairs');
      }
      
      // ===== EVENT TABLE =====
      const eventsTable = await queryInterface.describeTable('Events');
      
      if (!eventsTable.creator_user_id) {
        console.log('Добавляем creator_user_id в Events...');
        await queryInterface.addColumn('Events', 'creator_user_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'Users',
            key: 'id'
          },
          comment: 'Кто создал событие'
        });
        
        // Заполняем creator_user_id из userId (правильное название поля)
        await queryInterface.sequelize.query(`
          UPDATE "Events" SET creator_user_id = "userId" WHERE creator_user_id IS NULL
        `);
      }
      
      if (!eventsTable.metadata) {
        console.log('Добавляем metadata в Events...');
        await queryInterface.addColumn('Events', 'metadata', {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: {},
          comment: 'Метаданные события'
        });
      }
      
      // ===== MEDIA TABLE =====
      const mediaTable = await queryInterface.describeTable('Media');
      
      if (!mediaTable.uploaded_by) {
        console.log('Добавляем uploaded_by в Media...');
        await queryInterface.addColumn('Media', 'uploaded_by', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'Users',
            key: 'id'
          },
          comment: 'Кто загрузил медиа'
        });
        
        // Не заполняем uploaded_by, так как user_id может не существовать в Media
        console.log('uploaded_by добавлен как nullable - заполнение данными будет отдельно');
      }
      
      if (!mediaTable.size_bytes) {
        console.log('Добавляем size_bytes в Media...');
        await queryInterface.addColumn('Media', 'size_bytes', {
          type: Sequelize.BIGINT,
          allowNull: true,
          comment: 'Размер файла в байтах'
        });
      }
      
      if (!mediaTable.blurhash) {
        console.log('Добавляем blurhash в Media...');
        await queryInterface.addColumn('Media', 'blurhash', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'BlurHash для изображений'
        });
      }
      
      if (!mediaTable.mime_type) {
        console.log('Добавляем mime_type в Media...');
        await queryInterface.addColumn('Media', 'mime_type', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'MIME тип файла'
        });
      }
      
      // ===== GAMEROOMS TABLE =====
      const gameRoomsTable = await queryInterface.describeTable('GameRooms');
      
      if (!gameRoomsTable.state) {
        console.log('Добавляем state в GameRooms...');
        await queryInterface.addColumn('GameRooms', 'state', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'waiting',
          comment: 'Состояние игровой комнаты'
        });
        
        // Заполняем state из status если есть
        if (gameRoomsTable.status) {
          await queryInterface.sequelize.query(`
            UPDATE "GameRooms" SET state = status WHERE state = 'waiting'
          `);
        }
      }
      
      // Переименовываем gameSettings в settings если нужно
      if (gameRoomsTable.gameSettings && !gameRoomsTable.settings) {
        console.log('Переименовываем gameSettings в settings...');
        await queryInterface.renameColumn('GameRooms', 'gameSettings', 'settings');
      }
      
      // ===== GIFTS TABLE =====
      const giftsTable = await queryInterface.describeTable('gifts');
      
      if (!giftsTable.recipient_pair_id) {
        console.log('Добавляем recipient_pair_id в gifts...');
        await queryInterface.addColumn('gifts', 'recipient_pair_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'Pairs',
            key: 'id'
          },
          comment: 'ID пары-получателя подарка'
        });
      }
      
      if (!giftsTable.shop_item_id) {
        console.log('Добавляем shop_item_id в gifts...');
        await queryInterface.addColumn('gifts', 'shop_item_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'shop_items',
            key: 'id'
          },
          comment: 'ID товара из магазина'
        });
      }
      
      console.log('✅ Фикс недостающих полей завершен');
      
    } catch (error) {
      console.error('❌ Ошибка в фикс-миграции:', error);
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    // Откат фикса - удаляем поля, которые были добавлены
    console.log('Откат фикс-миграции...');
    
    try {
      // Удаляем поля из gifts
      await queryInterface.removeColumn('gifts', 'shop_item_id');
      await queryInterface.removeColumn('gifts', 'recipient_pair_id');
      
      // Откат переименования в GameRooms (если было)
      try {
        await queryInterface.renameColumn('GameRooms', 'settings', 'gameSettings');
      } catch (e) {
        // Может не существовать
      }
      
      await queryInterface.removeColumn('GameRooms', 'state');
      
      // Удаляем поля из Media
      await queryInterface.removeColumn('Media', 'mime_type');
      await queryInterface.removeColumn('Media', 'blurhash');
      await queryInterface.removeColumn('Media', 'size_bytes');
      await queryInterface.removeColumn('Media', 'uploaded_by');
      
      // Удаляем поля из Events
      await queryInterface.removeColumn('Events', 'metadata');
      await queryInterface.removeColumn('Events', 'creator_user_id');
      
      // Удаляем поля из Pairs
      await queryInterface.removeColumn('Pairs', 'metadata');
      await queryInterface.removeColumn('Pairs', 'harmony_index');
      await queryInterface.removeColumn('Pairs', 'name');
      
      // Удаляем поля из Users
      await queryInterface.removeColumn('Users', 'email_verified');
      
      console.log('✅ Откат фикс-миграции завершен');
    } catch (error) {
      console.error('❌ Ошибка отката фикс-миграции:', error);
      throw error;
    }
  }
};

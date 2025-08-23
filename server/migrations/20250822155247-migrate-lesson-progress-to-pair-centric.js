'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // ===== ЭТАП 1: Добавляем pair_id как nullable =====
    await queryInterface.addColumn('user_lesson_progress', 'pair_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Pairs',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'ID пары для которой выполнен урок'
    });

    // ===== ЭТАП 2: Мигрируем существующие данные =====
    // Для каждого user_lesson_progress найдём активную пару пользователя
    await queryInterface.sequelize.query(`
      UPDATE user_lesson_progress 
      SET pair_id = (
        SELECT up.pair_id 
        FROM user_pairs up 
        WHERE up.user_id = user_lesson_progress.user_id 
          AND up.accepted = true 
        LIMIT 1
      )
      WHERE pair_id IS NULL
    `);

    // ===== ЭТАП 3: Добавляем индексы =====
    await queryInterface.addIndex('user_lesson_progress', ['pair_id'], {
      name: 'idx_lesson_progress_pair'
    });

    await queryInterface.addIndex('user_lesson_progress', ['pair_id', 'lesson_id'], {
      name: 'idx_lesson_progress_pair_lesson'
    });

    await queryInterface.addIndex('user_lesson_progress', ['pair_id', 'completed_at'], {
      name: 'idx_lesson_progress_pair_completed'
    });

    // ===== ЭТАП 4: Обновляем структуру для pair-centric модели =====
    // Добавляем поле completed_by_user_id для отслеживания кто из пары завершил урок
    await queryInterface.addColumn('user_lesson_progress', 'completed_by_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'ID пользователя который завершил урок'
    });

    // Заполняем completed_by_user_id из существующего user_id
    await queryInterface.sequelize.query(`
      UPDATE user_lesson_progress 
      SET completed_by_user_id = user_id
      WHERE completed_by_user_id IS NULL
    `);

    // ===== ЭТАП 5: Делаем pair_id обязательным =====
    // Сначала удаляем записи без pair_id (если остались)
    await queryInterface.sequelize.query(`
      DELETE FROM user_lesson_progress WHERE pair_id IS NULL
    `);

    // Теперь делаем pair_id NOT NULL
    await queryInterface.changeColumn('user_lesson_progress', 'pair_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Pairs',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });

    // Делаем completed_by_user_id обязательным
    await queryInterface.changeColumn('user_lesson_progress', 'completed_by_user_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });

    // ===== ЭТАП 6: Обновляем уникальные ограничения =====
    // Удаляем старый индекс на user_id + lesson_id (если есть)
    try {
      await queryInterface.removeIndex('user_lesson_progress', 'user_lesson_progress_user_id_lesson_id');
    } catch (e) {
      // Индекс может не существовать
    }

    // Добавляем новый уникальный индекс на pair_id + lesson_id + completed_by_user_id
    // Это позволит каждому пользователю в паре завершать урок отдельно
    await queryInterface.addIndex('user_lesson_progress', ['pair_id', 'lesson_id', 'completed_by_user_id'], {
      unique: true,
      name: 'unique_pair_lesson_user_progress'
    });
  },

  async down (queryInterface, Sequelize) {
    // Откат в обратном порядке
    
    // Удаляем уникальный индекс
    await queryInterface.removeIndex('user_lesson_progress', 'unique_pair_lesson_user_progress');

    // Восстанавливаем старый индекс (если нужно)
    try {
      await queryInterface.addIndex('user_lesson_progress', ['user_id', 'lesson_id'], {
        unique: true,
        name: 'user_lesson_progress_user_id_lesson_id'
      });
    } catch (e) {
      // Может не понадобиться
    }

    // Удаляем индексы для pair_id
    await queryInterface.removeIndex('user_lesson_progress', 'idx_lesson_progress_pair');
    await queryInterface.removeIndex('user_lesson_progress', 'idx_lesson_progress_pair_lesson');  
    await queryInterface.removeIndex('user_lesson_progress', 'idx_lesson_progress_pair_completed');

    // Удаляем новые поля
    await queryInterface.removeColumn('user_lesson_progress', 'completed_by_user_id');
    await queryInterface.removeColumn('user_lesson_progress', 'pair_id');
  }
};

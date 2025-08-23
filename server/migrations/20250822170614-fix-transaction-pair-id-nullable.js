'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Делаем pair_id nullable в транзакциях для турнирных операций
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE transactions 
        ALTER COLUMN pair_id DROP NOT NULL;
      `);
      console.log('✅ Successfully made pair_id nullable in transactions');
    } catch (error) {
      console.log('⚠️ Could not modify pair_id constraint:', error.message);
      // Fallback через changeColumn
      try {
        await queryInterface.changeColumn('transactions', 'pair_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'Pairs',
            key: 'id',
          },
        });
        console.log('✅ Successfully changed pair_id via changeColumn');
      } catch (changeError) {
        console.log('❌ Failed to change column:', changeError.message);
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Возвращаем NOT NULL ограничение
    await queryInterface.sequelize.query(`
      ALTER TABLE transactions 
      ALTER COLUMN pair_id SET NOT NULL;
    `);
  }
};

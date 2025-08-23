#!/usr/bin/env node

/**
 * Проверка структуры базы данных
 */

const { QueryInterface } = require('sequelize');
const sequelize = require('../config/database');

console.log('🔍 Проверка структуры базы данных...\n');

async function checkStructure() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Проверяем структуру таблицы Users
    console.log('📋 Структура таблицы Users:');
    const usersColumns = await queryInterface.describeTable('Users');
    
    const expectedFields = ['display_name', 'locale', 'email_verified'];
    
    console.log('Существующие поля:');
    Object.keys(usersColumns).forEach(column => {
      const field = usersColumns[column];
      console.log(`  - ${column}: ${field.type}${field.allowNull ? '' : ' NOT NULL'}${field.defaultValue ? ` DEFAULT ${field.defaultValue}` : ''}`);
    });
    
    console.log('\n🎯 Проверка новых полей:');
    expectedFields.forEach(field => {
      if (usersColumns[field]) {
        console.log(`✅ ${field}: найдено`);
      } else {
        console.log(`❌ ${field}: отсутствует`);
      }
    });
    
    // Проверяем структуру таблицы Pairs
    console.log('\n📋 Структура таблицы Pairs:');
    const pairsColumns = await queryInterface.describeTable('Pairs');
    
    const expectedPairFields = ['name', 'harmony_index', 'metadata'];
    
    console.log('Существующие поля:');
    Object.keys(pairsColumns).forEach(column => {
      const field = pairsColumns[column];
      console.log(`  - ${column}: ${field.type}${field.allowNull ? '' : ' NOT NULL'}${field.defaultValue ? ` DEFAULT ${field.defaultValue}` : ''}`);
    });
    
    console.log('\n🎯 Проверка новых полей в Pairs:');
    expectedPairFields.forEach(field => {
      if (pairsColumns[field]) {
        console.log(`✅ ${field}: найдено`);
      } else {
        console.log(`❌ ${field}: отсутствует`);
      }
    });
    
    // Проверяем новые таблицы
    console.log('\n📋 Проверка новых таблиц:');
    const newTables = ['user_pairs', 'activity_logs', 'game_participants', 'shop_items', 'transactions', 'consents', 'insights', 'notification_tokens'];
    
    for (const tableName of newTables) {
      try {
        await queryInterface.describeTable(tableName);
        console.log(`✅ ${tableName}: существует`);
      } catch (error) {
        console.log(`❌ ${tableName}: отсутствует`);
      }
    }
    
    // Проверяем статус миграций
    console.log('\n📋 Статус миграций:');
    try {
      const [results] = await sequelize.query('SELECT * FROM "SequelizeMeta" ORDER BY name');
      console.log('Выполненные миграции:');
      results.forEach(row => {
        console.log(`  ✅ ${row.name}`);
      });
    } catch (error) {
      console.log('❌ Не удалось получить статус миграций:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Ошибка проверки структуры:', error);
  } finally {
    await sequelize.close();
  }
}

checkStructure()
  .then(() => {
    console.log('\n✨ Проверка завершена');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });

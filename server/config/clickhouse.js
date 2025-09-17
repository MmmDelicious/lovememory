const { createClient } = require('@clickhouse/client');
const fs = require('fs');
const path = require('path');

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  database: process.env.CLICKHOUSE_DB || 'lovememory',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || 'lovememory_secure_password',
  clickhouse_settings: {
    date_time_input_format: 'best_effort',
    allow_experimental_object_type: 1
  }
});

// Тест подключения
const testConnection = async () => {
  try {
    const result = await clickhouse.query({
      query: 'SELECT version()',
      format: 'JSONEachRow',
    });
    console.log('✅ ClickHouse connected:', await result.json());
    return true;
  } catch (error) {
    console.error('❌ ClickHouse connection failed:', error);
    return false;
  }
};

// Инициализация базы данных (создание database если не существует)
const initDatabase = async () => {
  try {
    await clickhouse.query({
      query: `CREATE DATABASE IF NOT EXISTS ${process.env.CLICKHOUSE_DB || 'lovememory'}`
    });
    console.log('✅ ClickHouse database initialized');
  } catch (error) {
    console.error('❌ Failed to initialize ClickHouse database:', error);
    throw error;
  }
};

// Инициализация таблиц из SQL файла
const initTables = async () => {
  try {
    const sqlPath = path.join(__dirname, 'clickhouse-init.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Разбиваем на отдельные запросы (по пустым строкам и комментариям)
    const queries = sqlContent
      .split('\n\n')
      .filter(query => query.trim() && !query.trim().startsWith('--'))
      .map(query => query.trim());

    for (const query of queries) {
      if (query) {
        try {
          await clickhouse.query({ query });
          console.log('✅ Executed ClickHouse query successfully');
        } catch (error) {
          console.error('❌ Failed to execute query:', query.substring(0, 100));
          console.error('Error:', error);
        }
      }
    }
    
    console.log('✅ ClickHouse tables initialized');
  } catch (error) {
    console.error('❌ Failed to initialize ClickHouse tables:', error);
    throw error;
  }
};

// Полная инициализация ClickHouse
const initClickHouse = async () => {
  try {
    console.log('🚀 Initializing ClickHouse...');
    
    // Проверяем подключение
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Cannot connect to ClickHouse');
    }
    
    // Создаем базу данных
    await initDatabase();
    
    // Создаем таблицы
    await initTables();
    
    console.log('🎉 ClickHouse initialization completed!');
  } catch (error) {
    console.error('💥 ClickHouse initialization failed:', error);
    throw error;
  }
};

module.exports = { clickhouse, testConnection, initDatabase, initTables, initClickHouse };

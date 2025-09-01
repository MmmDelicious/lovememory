const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    define: {
      underscored: true,        // snake_case для всех полей и таблиц
      freezeTableName: false,   // разрешает pluralization (users, game_rooms)
      timestamps: true          // created_at, updated_at
    }
  }
);
module.exports = sequelize;

/**
 * Создание тестовых пользователей для тестирования покера
 */

const { User } = require('./models');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function createPokerTestUsers() {
  try {
    console.log('🔧 Создаем тестовых пользователей для покера...');
    
    const testUsers = [
      {
        email: 'poker.player1@test.com',
        password_hash: '123456',
        first_name: 'Алиса',
        last_name: 'Покерова',
        gender: 'female',
        city: 'Москва',
        age: 28,
        verified: true,
        role: 'user',
        coins: 10000
      },
      {
        email: 'poker.player2@test.com',
        password_hash: '123456',
        first_name: 'Боб',
        last_name: 'Рейзовский',
        gender: 'male',
        city: 'Санкт-Петербург',
        age: 32,
        verified: true,
        role: 'user',
        coins: 10000
      },
      {
        email: 'poker.player3@test.com',
        password_hash: '123456',
        first_name: 'Чарли',
        last_name: 'Блефовый',
        gender: 'male',
        city: 'Екатеринбург',
        age: 26,
        verified: true,
        role: 'user',
        coins: 10000
      },
      {
        email: 'poker.host@test.com',
        password_hash: '123456',
        first_name: 'Хост',
        last_name: 'Игровой',
        gender: 'male',
        city: 'Новосибирск',
        age: 30,
        verified: true,
        role: 'user',
        coins: 10000
      }
    ];

    const createdUsers = [];
    const tokens = [];

    for (const userData of testUsers) {
      // Удаляем существующего пользователя если есть
      await User.destroy({
        where: { email: userData.email }
      });
      
      // Создаем нового пользователя
      const user = await User.create(userData);
      createdUsers.push(user);
      
      // Создаем JWT токен для пользователя
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      tokens.push({ userId: user.id, email: user.email, token });
      
      console.log(`✅ Создан пользователь: ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`   ID: ${user.id}, Токен: ${token.substring(0, 20)}...`);
    }
    
    // Сохраняем токены в файл для использования в тестах
    const fs = require('fs');
    const tokensData = {
      timestamp: new Date().toISOString(),
      users: tokens
    };
    
    fs.writeFileSync('poker-test-tokens.json', JSON.stringify(tokensData, null, 2));
    console.log('\n💾 Токены сохранены в файл: poker-test-tokens.json');
    
    console.log('\n🎉 Все тестовые пользователи созданы!');
    console.log('Теперь можно запускать тесты покера.');
    
  } catch (error) {
    console.error('❌ Ошибка при создании пользователей:', error.message);
  } finally {
    process.exit(0);
  }
}

createPokerTestUsers();

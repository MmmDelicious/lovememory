const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function debugUser() {
  try {
    console.log('🔍 Проверяем пользователей в базе данных...');
    
    // Получаем всех пользователей
    const users = await User.findAll({
      attributes: ['id', 'email', 'first_name', 'password_hash'],
      limit: 5
    });
    
    console.log(`📊 Найдено пользователей: ${users.length}`);
    
    if (users.length === 0) {
      console.log('❌ В базе данных нет пользователей! Нужно зарегистрироваться.');
      return;
    }
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Имя: ${user.first_name}`);
      console.log(`   Хэш пароля: ${user.password_hash ? 'есть' : 'НЕТ'}`);
      console.log(`   Длина хэша: ${user.password_hash ? user.password_hash.length : 'N/A'}`);
      console.log('---');
    });
    
    // Тестируем первого пользователя
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`🧪 Тестируем валидацию пароля для ${testUser.email}`);
      
      // Пробуем разные варианты паролей
      const testPasswords = ['123456', 'password', '12345678', 'test', 'admin'];
      
      for (const pwd of testPasswords) {
        try {
          const isValid = await testUser.validPassword(pwd);
          console.log(`   Пароль "${pwd}": ${isValid ? '✅ ВЕРНЫЙ' : '❌ неверный'}`);
        } catch (error) {
          console.log(`   Пароль "${pwd}": ❌ ошибка - ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке:', error.message);
  } finally {
    process.exit(0);
  }
}

debugUser();

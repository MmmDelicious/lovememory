const { User } = require('./models');

async function createTestUser() {
  try {
    console.log('🔧 Создаем тестового пользователя...');
    
    // Удаляем существующего тестового пользователя если есть
    await User.destroy({
      where: { email: 'test@test.com' }
    });
    
    // Создаем нового пользователя
    const testUser = await User.create({
      email: 'test@test.com',
      password_hash: '123456', // Будет автоматически хэширован в beforeCreate
      first_name: 'Тест',
      last_name: 'Тестов',
      gender: 'male',
      city: 'Москва',
      age: 25,
      verified: true,
      role: 'user'
    });
    
    console.log('✅ Тестовый пользователь создан:');
    console.log(`   Email: test@test.com`);
    console.log(`   Пароль: 123456`);
    console.log(`   ID: ${testUser.id}`);
    
    // Проверяем, что пароль работает
    const isValid = await testUser.validPassword('123456');
    console.log(`   Проверка пароля: ${isValid ? '✅ работает' : '❌ не работает'}`);
    
  } catch (error) {
    console.error('❌ Ошибка при создании пользователя:', error.message);
  } finally {
    process.exit(0);
  }
}

createTestUser();

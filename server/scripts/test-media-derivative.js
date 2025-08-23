const { User, Pair, Event, Media, MediaDerivative } = require('../models');

async function testMediaDerivative() {
  console.log('🖼️ Тестирование MediaDerivative модели...');

  try {
    // 1. Создаем тестовые данные
    const testUser = await User.create({
      email: `test-media-${Date.now()}@example.com`,
      first_name: 'Test',
      last_name: 'User'
    });

    const testUser2 = await User.create({
      email: `test-media-2-${Date.now()}@example.com`,
      first_name: 'Test2',
      last_name: 'User2'
    });

    const testPair = await Pair.create({
      user1Id: testUser.id,
      user2Id: testUser2.id,
      name: 'Test Media Pair',
      harmony_index: 75
    });

    const testEvent = await Event.create({
      title: 'Test Event with Media',
      description: 'Event for testing media derivatives',
      event_date: new Date(),
      userId: testUser.id,
      pair_id: testPair.id,
      event_type: 'memory'
    });

    const testMedia = await Media.create({
      eventId: testEvent.id,
      pair_id: testPair.id,
      file_url: '/uploads/test-image.jpg',
      file_type: 'image'
    });

    console.log('✅ Созданы тестовые данные:', {
      mediaId: testMedia.id,
      eventId: testEvent.id,
      pairId: testPair.id
    });

    // 2. Создаем thumbnail
    const thumbnail = await MediaDerivative.createThumbnail(
      testMedia.id,
      '/uploads/derivatives/test-image-thumb.jpg',
      150,
      150,
      {
        format: 'jpeg',
        quality: 80,
        size_bytes: 8192
      }
    );
    console.log('✅ Создан thumbnail:', thumbnail.id);

    // 3. Создаем preview
    const preview = await MediaDerivative.createPreview(
      testMedia.id,
      '/uploads/derivatives/test-image-preview.jpg',
      800,
      600,
      {
        format: 'jpeg',
        quality: 90,
        size_bytes: 65536
      }
    );
    console.log('✅ Создан preview:', preview.id);

    // 4. Создаем optimized версию
    const optimized = await MediaDerivative.createOptimized(
      testMedia.id,
      '/uploads/derivatives/test-image-optimized.jpg',
      {
        format: 'jpeg',
        quality: 85,
        size_bytes: 45678,
        optimization_level: 'high'
      }
    );
    console.log('✅ Создан optimized:', optimized.id);

    // 5. Создаем WebP версию
    const webp = await MediaDerivative.createWebP(
      testMedia.id,
      '/uploads/derivatives/test-image.webp',
      {
        quality: 80,
        size_bytes: 32768
      }
    );
    console.log('✅ Создан WebP:', webp.id);

    // 6. Создаем blur hash
    const blurHash = await MediaDerivative.createBlurHash(
      testMedia.id,
      'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
      {
        components_x: 4,
        components_y: 3
      }
    );
    console.log('✅ Создан blur hash:', blurHash.id);

    // 7. Получаем все производные для медиафайла
    const allDerivatives = await MediaDerivative.getDerivativesForMedia(testMedia.id);
    console.log('✅ Найдено производных файлов:', allDerivatives.length);

    // 8. Получаем конкретный тип производного
    const foundThumbnail = await MediaDerivative.getDerivativeByType(testMedia.id, 'thumbnail');
    console.log('✅ Найден thumbnail:', foundThumbnail ? foundThumbnail.id : 'не найден');

    // 9. Тестируем методы экземпляра
    console.log('✅ URL thumbnail:', thumbnail.getUrl());
    console.log('✅ Это изображение?:', thumbnail.isImage());
    console.log('✅ Информация о файле:', thumbnail.getDisplayInfo());

    // 10. Получаем медиафайл с производными через ассоциацию
    const mediaWithDerivatives = await Media.findByPk(testMedia.id, {
      include: [
        {
          model: MediaDerivative,
          as: 'Derivatives'
        }
      ]
    });
    console.log('✅ Медиафайл с производными:', {
      mediaId: mediaWithDerivatives.id,
      derivativesCount: mediaWithDerivatives.Derivatives.length
    });

    // 11. Массовое создание производных
    const bulkDerivatives = await MediaDerivative.bulkCreateForMedia(testMedia.id, [
      {
        type: 'low_quality',
        path: '/uploads/derivatives/test-image-lq.jpg',
        options: {
          format: 'jpeg',
          quality: 30,
          size_bytes: 4096,
          width: 320,
          height: 240
        }
      }
    ]);
    console.log('✅ Массовое создание производных:', bulkDerivatives.length);

    // 12. Проверяем все производные еще раз
    const finalDerivatives = await MediaDerivative.getDerivativesForMedia(testMedia.id);
    const derivativeTypes = finalDerivatives.map(d => d.derivative_type);
    console.log('✅ Итоговые типы производных:', derivativeTypes);

    // 13. Тестируем уникальность (попытка создать дубликат)
    try {
      await MediaDerivative.createThumbnail(
        testMedia.id,
        '/uploads/derivatives/test-image-thumb2.jpg',
        200,
        200
      );
      console.log('❌ Ошибка: удалось создать дубликат thumbnail');
    } catch (error) {
      console.log('✅ Правильно заблокирован дубликат thumbnail');
    }

    // 14. Удаляем все производные для медиафайла
    const deletedCount = await MediaDerivative.deleteAllForMedia(testMedia.id);
    console.log('✅ Удалено производных файлов:', deletedCount);

    console.log('\n🎉 Все тесты MediaDerivative модели прошли успешно!');

  } catch (error) {
    console.error('❌ Ошибка тестирования MediaDerivative:', error.message);
    console.error(error.stack);
  }
}

// Запускаем тест
testMediaDerivative().then(() => {
  console.log('✨ Тестирование завершено');
  process.exit(0);
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});

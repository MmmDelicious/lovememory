const { Interest } = require('../models');

const interests = [
  // Еда и кулинария
  { name: 'Итальянская кухня', category: 'food', emoji: '🍝', description: 'Паста, пицца, лазанья', is_active: true, popularity_score: 85 },
  { name: 'Азиатская кухня', category: 'food', emoji: '🍜', description: 'Суши, рамен, тайская еда', is_active: true, popularity_score: 82 },
  { name: 'Кофе', category: 'food', emoji: '☕', description: 'Кофейни, капучино, латте', is_active: true, popularity_score: 90 },
  { name: 'Десерты', category: 'food', emoji: '🍰', description: 'Торты, мороженое, сладости', is_active: true, popularity_score: 78 },
  { name: 'Барбекю', category: 'food', emoji: '🔥', description: 'Гриль, шашлыки, мангал', is_active: true, popularity_score: 75 },
  { name: 'Вегетарианская еда', category: 'food', emoji: '🥗', description: 'Салаты, овощи, здоровое питание', is_active: true, popularity_score: 68 },
  { name: 'Уличная еда', category: 'food', emoji: '🌮', description: 'Фудтраки, быстрая еда', is_active: true, popularity_score: 72 },
  { name: 'Крафтовое пиво', category: 'food', emoji: '🍺', description: 'Пивоварни, дегустации', is_active: true, popularity_score: 65 },

  // Кино и развлечения
  { name: 'Блокбастеры', category: 'cinema', emoji: '🎬', description: 'Боевики, приключения, фантастика', is_active: true, popularity_score: 88 },
  { name: 'Драмы', category: 'cinema', emoji: '🎭', description: 'Эмоциональные фильмы', is_active: true, popularity_score: 71 },
  { name: 'Комедии', category: 'cinema', emoji: '😂', description: 'Веселые фильмы', is_active: true, popularity_score: 85 },
  { name: 'Ужасы', category: 'cinema', emoji: '😱', description: 'Страшные фильмы', is_active: true, popularity_score: 45 },
  { name: 'Мультфильмы', category: 'cinema', emoji: '🦸', description: 'Анимация, Disney, Marvel', is_active: true, popularity_score: 82 },
  { name: 'Документальные фильмы', category: 'cinema', emoji: '📽️', description: 'Познавательные фильмы', is_active: true, popularity_score: 55 },
  { name: 'Сериалы', category: 'cinema', emoji: '📺', description: 'Netflix, многосерийные', is_active: true, popularity_score: 92 },

  // Хобби и творчество
  { name: 'Рисование', category: 'hobby', emoji: '🎨', description: 'Живопись, скетчи, арт', is_active: true, popularity_score: 62 },
  { name: 'Фотография', category: 'hobby', emoji: '📸', description: 'Съемка, обработка фото', is_active: true, popularity_score: 78 },
  { name: 'Музыка', category: 'hobby', emoji: '🎵', description: 'Игра на инструментах, пение', is_active: true, popularity_score: 80 },
  { name: 'Танцы', category: 'hobby', emoji: '💃', description: 'Сальса, хип-хоп, бальные', is_active: true, popularity_score: 68 },
  { name: 'Рукоделие', category: 'hobby', emoji: '🧶', description: 'Вязание, шитье, поделки', is_active: true, popularity_score: 45 },
  { name: 'Садоводство', category: 'hobby', emoji: '🌱', description: 'Выращивание растений', is_active: true, popularity_score: 52 },
  { name: 'Коллекционирование', category: 'hobby', emoji: '🏆', description: 'Марки, монеты, антиквариат', is_active: true, popularity_score: 38 },

  // Спорт и активность
  { name: 'Фитнес', category: 'sport', emoji: '💪', description: 'Тренажерный зал, силовые', is_active: true, popularity_score: 88 },
  { name: 'Бег', category: 'sport', emoji: '🏃', description: 'Марафоны, джоггинг', is_active: true, popularity_score: 75 },
  { name: 'Плавание', category: 'sport', emoji: '🏊', description: 'Бассейн, открытая вода', is_active: true, popularity_score: 72 },
  { name: 'Велосипед', category: 'sport', emoji: '🚴', description: 'Велопрогулки, велоспорт', is_active: true, popularity_score: 78 },
  { name: 'Йога', category: 'sport', emoji: '🧘', description: 'Растяжка, медитация', is_active: true, popularity_score: 82 },
  { name: 'Теннис', category: 'sport', emoji: '🎾', description: 'Большой теннис, корты', is_active: true, popularity_score: 58 },
  { name: 'Футбол', category: 'sport', emoji: '⚽', description: 'Игра, просмотр матчей', is_active: true, popularity_score: 85 },
  { name: 'Волейбол', category: 'sport', emoji: '🏐', description: 'Пляжный, классический', is_active: true, popularity_score: 65 },
  { name: 'Скалолазание', category: 'sport', emoji: '🧗', description: 'Скалодромы, горы', is_active: true, popularity_score: 42 },

  // Путешествия
  { name: 'Городские поездки', category: 'travel', emoji: '🏙️', description: 'Мегаполисы, достопримечательности', is_active: true, popularity_score: 88 },
  { name: 'Пляжный отдых', category: 'travel', emoji: '🏖️', description: 'Море, солнце, релакс', is_active: true, popularity_score: 92 },
  { name: 'Горы', category: 'travel', emoji: '⛰️', description: 'Походы, треккинг, природа', is_active: true, popularity_score: 68 },
  { name: 'Экстрим-туризм', category: 'travel', emoji: '🪂', description: 'Парашюты, банджи, экстрим', is_active: true, popularity_score: 35 },
  { name: 'Культурный туризм', category: 'travel', emoji: '🏛️', description: 'Музеи, история, архитектура', is_active: true, popularity_score: 72 },
  { name: 'Кемпинг', category: 'travel', emoji: '🏕️', description: 'Палатки, костры, природа', is_active: true, popularity_score: 55 },
  { name: 'Круизы', category: 'travel', emoji: '🚢', description: 'Морские путешествия', is_active: true, popularity_score: 48 },

  // Музыка
  { name: 'Рок', category: 'music', emoji: '🎸', description: 'Классический рок, металл', is_active: true, popularity_score: 75 },
  { name: 'Поп-музыка', category: 'music', emoji: '🎤', description: 'Популярная музыка', is_active: true, popularity_score: 88 },
  { name: 'Электронная музыка', category: 'music', emoji: '🎧', description: 'EDM, хаус, техно', is_active: true, popularity_score: 65 },
  { name: 'Джаз', category: 'music', emoji: '🎷', description: 'Импровизация, блюз', is_active: true, popularity_score: 42 },
  { name: 'Классическая музыка', category: 'music', emoji: '🎻', description: 'Оркестр, опера, симфонии', is_active: true, popularity_score: 38 },
  { name: 'Хип-хоп', category: 'music', emoji: '🎵', description: 'Рэп, ритм', is_active: true, popularity_score: 72 },
  { name: 'Инди-музыка', category: 'music', emoji: '🎶', description: 'Независимые исполнители', is_active: true, popularity_score: 58 },

  // Искусство
  { name: 'Живопись', category: 'art', emoji: '🖼️', description: 'Галереи, выставки, картины', is_active: true, popularity_score: 52 },
  { name: 'Театр', category: 'art', emoji: '🎭', description: 'Спектакли, драма', is_active: true, popularity_score: 48 },
  { name: 'Скульптура', category: 'art', emoji: '🗿', description: 'Статуи, современное искусство', is_active: true, popularity_score: 35 },
  { name: 'Дизайн', category: 'art', emoji: '✨', description: 'Графический, интерьерный', is_active: true, popularity_score: 68 },
  { name: 'Архитектура', category: 'art', emoji: '🏗️', description: 'Здания, стили, история', is_active: true, popularity_score: 45 },
  { name: 'Стрит-арт', category: 'art', emoji: '🎨', description: 'Граффити, муралы', is_active: true, popularity_score: 58 },

  // Книги и литература
  { name: 'Художественная литература', category: 'books', emoji: '📚', description: 'Романы, новеллы', is_active: true, popularity_score: 78 },
  { name: 'Детективы', category: 'books', emoji: '🔍', description: 'Криминальные романы', is_active: true, popularity_score: 72 },
  { name: 'Фантастика', category: 'books', emoji: '🚀', description: 'Научная фантастика', is_active: true, popularity_score: 68 },
  { name: 'Психология', category: 'books', emoji: '🧠', description: 'Саморазвитие, психология', is_active: true, popularity_score: 75 },
  { name: 'История', category: 'books', emoji: '📜', description: 'Исторические книги', is_active: true, popularity_score: 55 },
  { name: 'Биографии', category: 'books', emoji: '👤', description: 'Жизнь известных людей', is_active: true, popularity_score: 52 },

  // Игры
  { name: 'Видеоигры', category: 'games', emoji: '🎮', description: 'Консоли, ПК игры', is_active: true, popularity_score: 82 },
  { name: 'Настольные игры', category: 'games', emoji: '🎲', description: 'Монополия, шахматы', is_active: true, popularity_score: 68 },
  { name: 'Карточные игры', category: 'games', emoji: '🃏', description: 'Покер, блэкджек', is_active: true, popularity_score: 58 },
  { name: 'Квесты', category: 'games', emoji: '🗝️', description: 'Эскейп-румы, квест-комнаты', is_active: true, popularity_score: 78 },
  { name: 'Боулинг', category: 'games', emoji: '🎳', description: 'Кегли, страйки', is_active: true, popularity_score: 72 },
];

async function seedInterests() {
  try {
    // Очищаем таблицу
    await Interest.destroy({ where: {} });
    
    // Вставляем интересы
    await Interest.bulkCreate(interests);
    
    console.log('✅ Интересы успешно добавлены в базу данных');
    console.log(`📊 Добавлено ${interests.length} интересов`);
    
    // Группируем по категориям для отчета
    const categories = {};
    interests.forEach(interest => {
      if (!categories[interest.category]) {
        categories[interest.category] = 0;
      }
      categories[interest.category]++;
    });
    
    console.log('📋 По категориям:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} интересов`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка при добавлении интересов:', error);
  }
}

// Если файл запущен напрямую
if (require.main === module) {
  seedInterests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = { seedInterests, interests };


const { Interest } = require('../models');

// Расширенный список из 83+ интересов согласно плану
const extendedInterests = [
  // Еда и кулинария (15)
  { name: 'Итальянская кухня', category: 'food', emoji: '🍝', description: 'Паста, пицца, лазанья', is_active: true, popularity_score: 85 },
  { name: 'Азиатская кухня', category: 'food', emoji: '🍜', description: 'Суши, рамен, тайская еда', is_active: true, popularity_score: 82 },
  { name: 'Кофе', category: 'food', emoji: '☕', description: 'Кофейни, капучино, латте', is_active: true, popularity_score: 90 },
  { name: 'Десерты', category: 'food', emoji: '🍰', description: 'Торты, мороженое, сладости', is_active: true, popularity_score: 78 },
  { name: 'Барбекю', category: 'food', emoji: '🔥', description: 'Гриль, шашлыки, мангал', is_active: true, popularity_score: 75 },
  { name: 'Вегетарианская еда', category: 'food', emoji: '🥗', description: 'Салаты, овощи, здоровое питание', is_active: true, popularity_score: 68 },
  { name: 'Уличная еда', category: 'food', emoji: '🌮', description: 'Фудтраки, быстрая еда', is_active: true, popularity_score: 72 },
  { name: 'Крафтовое пиво', category: 'food', emoji: '🍺', description: 'Пивоварни, дегустации', is_active: true, popularity_score: 65 },
  { name: 'Вино', category: 'food', emoji: '🍷', description: 'Дегустации, сомелье', is_active: true, popularity_score: 58 },
  { name: 'Мексиканская кухня', category: 'food', emoji: '🌶️', description: 'Тако, буррито, острая еда', is_active: true, popularity_score: 62 },
  { name: 'Французская кухня', category: 'food', emoji: '🥐', description: 'Круассаны, сыры, изысканная еда', is_active: true, popularity_score: 55 },
  { name: 'Японская кухня', category: 'food', emoji: '🍣', description: 'Суши, сашими, темпура', is_active: true, popularity_score: 78 },
  { name: 'Индийская кухня', category: 'food', emoji: '🍛', description: 'Карри, специи, вегетарианские блюда', is_active: true, popularity_score: 52 },
  { name: 'Морепродукты', category: 'food', emoji: '🦐', description: 'Рыба, креветки, устрицы', is_active: true, popularity_score: 68 },
  { name: 'Стрит-фуд', category: 'food', emoji: '🌭', description: 'Хот-доги, бургеры, закуски', is_active: true, popularity_score: 72 },

  // Кино и развлечения (12)
  { name: 'Блокбастеры', category: 'cinema', emoji: '🎬', description: 'Боевики, приключения, фантастика', is_active: true, popularity_score: 88 },
  { name: 'Драмы', category: 'cinema', emoji: '🎭', description: 'Эмоциональные фильмы', is_active: true, popularity_score: 71 },
  { name: 'Комедии', category: 'cinema', emoji: '😂', description: 'Веселые фильмы', is_active: true, popularity_score: 85 },
  { name: 'Ужасы', category: 'cinema', emoji: '😱', description: 'Страшные фильмы', is_active: true, popularity_score: 45 },
  { name: 'Мультфильмы', category: 'cinema', emoji: '🦸', description: 'Анимация, Disney, Marvel', is_active: true, popularity_score: 82 },
  { name: 'Документальные фильмы', category: 'cinema', emoji: '📽️', description: 'Познавательные фильмы', is_active: true, popularity_score: 55 },
  { name: 'Сериалы', category: 'cinema', emoji: '📺', description: 'Netflix, многосерийные', is_active: true, popularity_score: 92 },
  { name: 'Арт-хаус', category: 'cinema', emoji: '🎨', description: 'Авторское кино, фестивали', is_active: true, popularity_score: 35 },
  { name: 'Триллеры', category: 'cinema', emoji: '🔪', description: 'Напряженные фильмы', is_active: true, popularity_score: 58 },
  { name: 'Романтические фильмы', category: 'cinema', emoji: '💕', description: 'Мелодрамы, ромкомы', is_active: true, popularity_score: 68 },
  { name: 'Фантастика', category: 'cinema', emoji: '🚀', description: 'Sci-fi, космос, будущее', is_active: true, popularity_score: 72 },
  { name: 'Фэнтези', category: 'cinema', emoji: '🧙', description: 'Магия, драконы, мифология', is_active: true, popularity_score: 65 },

  // Спорт и активность (15)
  { name: 'Фитнес', category: 'sport', emoji: '💪', description: 'Тренажерный зал, силовые', is_active: true, popularity_score: 88 },
  { name: 'Бег', category: 'sport', emoji: '🏃', description: 'Марафоны, джоггинг', is_active: true, popularity_score: 75 },
  { name: 'Плавание', category: 'sport', emoji: '🏊', description: 'Бассейн, открытая вода', is_active: true, popularity_score: 72 },
  { name: 'Велосипед', category: 'sport', emoji: '🚴', description: 'Велопрогулки, велоспорт', is_active: true, popularity_score: 78 },
  { name: 'Йога', category: 'sport', emoji: '🧘', description: 'Растяжка, медитация', is_active: true, popularity_score: 82 },
  { name: 'Теннис', category: 'sport', emoji: '🎾', description: 'Большой теннис, корты', is_active: true, popularity_score: 58 },
  { name: 'Футбол', category: 'sport', emoji: '⚽', description: 'Игра, просмотр матчей', is_active: true, popularity_score: 85 },
  { name: 'Волейбол', category: 'sport', emoji: '🏐', description: 'Пляжный, классический', is_active: true, popularity_score: 65 },
  { name: 'Скалолазание', category: 'sport', emoji: '🧗', description: 'Скалодромы, горы', is_active: true, popularity_score: 42 },
  { name: 'Бокс', category: 'sport', emoji: '🥊', description: 'Боевые искусства', is_active: true, popularity_score: 48 },
  { name: 'Баскетбол', category: 'sport', emoji: '🏀', description: 'Игра, просмотр NBA', is_active: true, popularity_score: 72 },
  { name: 'Гольф', category: 'sport', emoji: '⛳', description: 'Поля, турниры', is_active: true, popularity_score: 35 },
  { name: 'Лыжи', category: 'sport', emoji: '🎿', description: 'Горные лыжи, сноуборд', is_active: true, popularity_score: 55 },
  { name: 'Серфинг', category: 'sport', emoji: '🏄', description: 'Волны, доски', is_active: true, popularity_score: 38 },
  { name: 'Пилатес', category: 'sport', emoji: '🤸', description: 'Гибкость, укрепление', is_active: true, popularity_score: 62 },

  // Путешествия (12)
  { name: 'Городские поездки', category: 'travel', emoji: '🏙️', description: 'Мегаполисы, достопримечательности', is_active: true, popularity_score: 88 },
  { name: 'Пляжный отдых', category: 'travel', emoji: '🏖️', description: 'Море, солнце, релакс', is_active: true, popularity_score: 92 },
  { name: 'Горы', category: 'travel', emoji: '⛰️', description: 'Походы, треккинг, природа', is_active: true, popularity_score: 68 },
  { name: 'Экстрим-туризм', category: 'travel', emoji: '🪂', description: 'Парашюты, банджи, экстрим', is_active: true, popularity_score: 35 },
  { name: 'Культурный туризм', category: 'travel', emoji: '🏛️', description: 'Музеи, история, архитектура', is_active: true, popularity_score: 72 },
  { name: 'Кемпинг', category: 'travel', emoji: '🏕️', description: 'Палатки, костры, природа', is_active: true, popularity_score: 55 },
  { name: 'Круизы', category: 'travel', emoji: '🚢', description: 'Морские путешествия', is_active: true, popularity_score: 48 },
  { name: 'Автопутешествия', category: 'travel', emoji: '🚗', description: 'Роад-трипы, машина', is_active: true, popularity_score: 75 },
  { name: 'Бэкпэкинг', category: 'travel', emoji: '🎒', description: 'Бюджетные путешествия', is_active: true, popularity_score: 58 },
  { name: 'Спа-отдых', category: 'travel', emoji: '🧖', description: 'Релакс, массажи, wellness', is_active: true, popularity_score: 65 },
  { name: 'Гастрономические туры', category: 'travel', emoji: '🍽️', description: 'Кулинарные путешествия', is_active: true, popularity_score: 52 },
  { name: 'Фототуры', category: 'travel', emoji: '📸', description: 'Путешествия для фотографии', is_active: true, popularity_score: 45 },

  // Музыка (10)
  { name: 'Рок', category: 'music', emoji: '🎸', description: 'Классический рок, металл', is_active: true, popularity_score: 75 },
  { name: 'Поп-музыка', category: 'music', emoji: '🎤', description: 'Популярная музыка', is_active: true, popularity_score: 88 },
  { name: 'Электронная музыка', category: 'music', emoji: '🎧', description: 'EDM, хаус, техно', is_active: true, popularity_score: 65 },
  { name: 'Джаз', category: 'music', emoji: '🎷', description: 'Импровизация, блюз', is_active: true, popularity_score: 42 },
  { name: 'Классическая музыка', category: 'music', emoji: '🎻', description: 'Оркестр, опера, симфонии', is_active: true, popularity_score: 38 },
  { name: 'Хип-хоп', category: 'music', emoji: '🎵', description: 'Рэп, ритм', is_active: true, popularity_score: 72 },
  { name: 'Инди-музыка', category: 'music', emoji: '🎶', description: 'Независимые исполнители', is_active: true, popularity_score: 58 },
  { name: 'Кантри', category: 'music', emoji: '🤠', description: 'Деревенская музыка', is_active: true, popularity_score: 35 },
  { name: 'Регги', category: 'music', emoji: '🌴', description: 'Ямайская музыка', is_active: true, popularity_score: 28 },
  { name: 'Фолк', category: 'music', emoji: '🪕', description: 'Народная музыка', is_active: true, popularity_score: 32 },

  // Искусство (8)
  { name: 'Живопись', category: 'art', emoji: '🖼️', description: 'Галереи, выставки, картины', is_active: true, popularity_score: 52 },
  { name: 'Театр', category: 'art', emoji: '🎭', description: 'Спектакли, драма', is_active: true, popularity_score: 48 },
  { name: 'Скульптура', category: 'art', emoji: '🗿', description: 'Статуи, современное искусство', is_active: true, popularity_score: 35 },
  { name: 'Дизайн', category: 'art', emoji: '✨', description: 'Графический, интерьерный', is_active: true, popularity_score: 68 },
  { name: 'Архитектура', category: 'art', emoji: '🏗️', description: 'Здания, стили, история', is_active: true, popularity_score: 45 },
  { name: 'Стрит-арт', category: 'art', emoji: '🎨', description: 'Граффити, муралы', is_active: true, popularity_score: 58 },
  { name: 'Фотография', category: 'art', emoji: '📸', description: 'Художественная фотография', is_active: true, popularity_score: 62 },
  { name: 'Мода', category: 'art', emoji: '👗', description: 'Дизайн одежды, показы', is_active: true, popularity_score: 55 },

  // Книги и литература (8)
  { name: 'Художественная литература', category: 'books', emoji: '📚', description: 'Романы, новеллы', is_active: true, popularity_score: 78 },
  { name: 'Детективы', category: 'books', emoji: '🔍', description: 'Криминальные романы', is_active: true, popularity_score: 72 },
  { name: 'Фантастика', category: 'books', emoji: '🚀', description: 'Научная фантастика', is_active: true, popularity_score: 68 },
  { name: 'Психология', category: 'books', emoji: '🧠', description: 'Саморазвитие, психология', is_active: true, popularity_score: 75 },
  { name: 'История', category: 'books', emoji: '📜', description: 'Исторические книги', is_active: true, popularity_score: 55 },
  { name: 'Биографии', category: 'books', emoji: '👤', description: 'Жизнь известных людей', is_active: true, popularity_score: 52 },
  { name: 'Поэзия', category: 'books', emoji: '📝', description: 'Стихи, поэмы', is_active: true, popularity_score: 38 },
  { name: 'Философия', category: 'books', emoji: '🤔', description: 'Мудрость, размышления', is_active: true, popularity_score: 42 },

  // Игры (8)
  { name: 'Видеоигры', category: 'games', emoji: '🎮', description: 'Консоли, ПК игры', is_active: true, popularity_score: 82 },
  { name: 'Настольные игры', category: 'games', emoji: '🎲', description: 'Монополия, шахматы', is_active: true, popularity_score: 68 },
  { name: 'Карточные игры', category: 'games', emoji: '🃏', description: 'Покер, блэкджек', is_active: true, popularity_score: 58 },
  { name: 'Квесты', category: 'games', emoji: '🗝️', description: 'Эскейп-румы, квест-комнаты', is_active: true, popularity_score: 78 },
  { name: 'Боулинг', category: 'games', emoji: '🎳', description: 'Кегли, страйки', is_active: true, popularity_score: 72 },
  { name: 'Бильярд', category: 'games', emoji: '🎱', description: 'Пулы, снукер', is_active: true, popularity_score: 65 },
  { name: 'Дартс', category: 'games', emoji: '🎯', description: 'Метание дротиков', is_active: true, popularity_score: 48 },
  { name: 'Пазлы', category: 'games', emoji: '🧩', description: 'Головоломки, мозаики', is_active: true, popularity_score: 55 },

  // Хобби и творчество (8)
  { name: 'Рисование', category: 'hobby', emoji: '🎨', description: 'Живопись, скетчи, арт', is_active: true, popularity_score: 62 },
  { name: 'Рукоделие', category: 'hobby', emoji: '🧶', description: 'Вязание, шитье, поделки', is_active: true, popularity_score: 45 },
  { name: 'Садоводство', category: 'hobby', emoji: '🌱', description: 'Выращивание растений', is_active: true, popularity_score: 52 },
  { name: 'Коллекционирование', category: 'hobby', emoji: '🏆', description: 'Марки, монеты, антиквариат', is_active: true, popularity_score: 38 },
  { name: 'Кулинария', category: 'hobby', emoji: '👨‍🍳', description: 'Готовка, рецепты', is_active: true, popularity_score: 72 },
  { name: 'Танцы', category: 'hobby', emoji: '💃', description: 'Сальса, хип-хоп, бальные', is_active: true, popularity_score: 68 },
  { name: 'Музыкальные инструменты', category: 'hobby', emoji: '🎵', description: 'Игра на инструментах', is_active: true, popularity_score: 58 },
  { name: 'Ремонт', category: 'hobby', emoji: '🔧', description: 'DIY, мастерская', is_active: true, popularity_score: 42 },

  // Технологии (5)
  { name: 'Программирование', category: 'technology', emoji: '💻', description: 'Кодинг, разработка', is_active: true, popularity_score: 65 },
  { name: 'Гаджеты', category: 'technology', emoji: '📱', description: 'Смартфоны, планшеты', is_active: true, popularity_score: 78 },
  { name: 'Криптовалюты', category: 'technology', emoji: '₿', description: 'Биткоин, блокчейн', is_active: true, popularity_score: 45 },
  { name: 'ИИ и машинное обучение', category: 'technology', emoji: '🤖', description: 'Искусственный интеллект', is_active: true, popularity_score: 52 },
  { name: 'VR/AR', category: 'technology', emoji: '🥽', description: 'Виртуальная реальность', is_active: true, popularity_score: 38 },

  // Природа и животные (5)
  { name: 'Животные', category: 'animals', emoji: '🐕', description: 'Питомцы, зоопарки', is_active: true, popularity_score: 85 },
  { name: 'Растения', category: 'nature', emoji: '🌿', description: 'Цветы, деревья, ботаника', is_active: true, popularity_score: 58 },
  { name: 'Астрономия', category: 'nature', emoji: '⭐', description: 'Звезды, космос, телескопы', is_active: true, popularity_score: 42 },
  { name: 'Геология', category: 'nature', emoji: '🪨', description: 'Камни, минералы', is_active: true, popularity_score: 28 },
  { name: 'Метеорология', category: 'nature', emoji: '🌤️', description: 'Погода, климат', is_active: true, popularity_score: 35 },

  // Социальные активности (5)
  { name: 'Волонтерство', category: 'volunteering', emoji: '🤝', description: 'Помощь другим, благотворительность', is_active: true, popularity_score: 48 },
  { name: 'Образование', category: 'education', emoji: '🎓', description: 'Курсы, лекции, обучение', is_active: true, popularity_score: 65 },
  { name: 'Политика', category: 'other', emoji: '🗳️', description: 'Общественная деятельность', is_active: true, popularity_score: 35 },
  { name: 'Религия', category: 'other', emoji: '⛪', description: 'Духовность, вера', is_active: true, popularity_score: 42 },
  { name: 'Социальные сети', category: 'technology', emoji: '📱', description: 'Instagram, TikTok, YouTube', is_active: true, popularity_score: 88 }
];

async function seedExtendedInterests() {
  try {
    console.log('🌱 Начинаем загрузку расширенного списка интересов...');
    
    // Не очищаем таблицу, а добавляем только новые интересы
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const interest of extendedInterests) {
      try {
        await Interest.create(interest);
        addedCount++;
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          skippedCount++;
          console.log(`⏭️ Пропущен дубликат: ${interest.name}`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Расширенные интересы успешно добавлены в базу данных');
    console.log(`📊 Добавлено новых: ${addedCount}, пропущено дубликатов: ${skippedCount}`);
    
    // Группируем по категориям для отчета
    const categories = {};
    extendedInterests.forEach(interest => {
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
    console.error('❌ Ошибка при добавлении расширенных интересов:', error);
  }
}

// Если файл запущен напрямую
if (require.main === module) {
  seedExtendedInterests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = { seedExtendedInterests, extendedInterests };

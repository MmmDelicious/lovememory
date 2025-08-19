'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const lessons = [
      // Words of Affirmation уроки
      {
        id: 'words_001',
        title: 'Комплимент дня',
        text: 'Сегодня сделайте искренний комплимент своему партнеру. Скажите ему что-то, что вы давно хотели сказать, но не находили подходящего момента. Это может быть что-то о его внешности, характере или поступках.',
        source: 'LoveMemory Team',
        tags: ['daily', 'words', 'compliment'],
        triggers: {
          love_language: ['words'],
          context: ['low_heat'],
          relationship_stage: ['new', 'developing']
        },
        effect: {
          words: 2,
          heat: 1
        },
        theme: 'words_of_affirmation',
        interactive_type: 'chat',
        difficulty_level: 1,
        required_streak: 0,
        animation_file: 'Love.json',
        base_coins_reward: 10
      },
      {
        id: 'words_002',
        title: 'Три причины моей любви',
        text: 'Напишите партнеру три конкретные причины, за что вы его любите. Избегайте общих фраз - будьте максимально конкретными и личными.',
        source: 'LoveMemory Team',
        tags: ['words', 'love', 'personal'],
        triggers: {
          love_language: ['words'],
          gap_days: [2, 'more']
        },
        effect: {
          words: 3,
          heat: 2
        },
        theme: 'words_of_affirmation',
        interactive_type: 'prompt',
        difficulty_level: 2,
        required_streak: 1,
        animation_file: 'Couple sharing and caring love.json',
        base_coins_reward: 15
      },
      {
        id: 'words_003',
        title: 'Поддерживающие слова',
        text: 'Если ваш партнер переживает трудный период, напишите ему слова поддержки. Скажите, что вы верите в него и всегда будете рядом.',
        source: 'LoveMemory Team',
        tags: ['words', 'support', 'stress'],
        triggers: {
          love_language: ['words'],
          context: ['low_heat']
        },
        effect: {
          words: 2,
          heat: 1
        },
        theme: 'words_of_affirmation',
        interactive_type: 'chat',
        difficulty_level: 2,
        required_streak: 0,
        animation_file: 'Relationship.json',
        base_coins_reward: 12
      },

      // Acts of Service уроки
      {
        id: 'acts_001',
        title: 'Маленькое дело',
        text: 'Сделайте сегодня одно небольшое дело для своего партнера без просьб с его стороны. Это может быть приготовление кофе, уборка или любая другая помощь.',
        source: 'LoveMemory Team',
        tags: ['acts', 'service', 'help'],
        triggers: {
          love_language: ['acts'],
          relationship_stage: ['developing', 'established', 'mature']
        },
        effect: {
          acts: 3,
          heat: 1
        },
        theme: 'acts_of_service',
        interactive_type: 'photo',
        difficulty_level: 1,
        required_streak: 0,
        animation_file: 'Business Animations - Flat Concept.json',
        base_coins_reward: 12
      },
      {
        id: 'acts_002',
        title: 'Облегчить день партнера',
        text: 'Подумайте, что больше всего напрягает вашего партнера в повседневной жизни, и возьмите эту задачу на себя сегодня.',
        source: 'LoveMemory Team',
        tags: ['acts', 'stress', 'care'],
        triggers: {
          love_language: ['acts'],
          gap_days: [1, 3]
        },
        effect: {
          acts: 4,
          heat: 2
        },
        theme: 'acts_of_service',
        interactive_type: 'prompt',
        difficulty_level: 2,
        required_streak: 2,
        animation_file: 'Website Construction.json',
        base_coins_reward: 15
      },

      // Receiving Gifts уроки
      {
        id: 'gifts_001',
        title: 'Символический подарок',
        text: 'Подарите партнеру что-то символическое - необязательно дорогое, но значимое. Это может быть цветок, камешек с прогулки или написанная от руки записка.',
        source: 'LoveMemory Team',
        tags: ['gifts', 'symbol', 'meaning'],
        triggers: {
          love_language: ['gifts'],
          context: ['low_heat']
        },
        effect: {
          gifts: 3,
          heat: 2
        },
        theme: 'receiving_gifts',
        interactive_type: 'photo',
        difficulty_level: 1,
        required_streak: 0,
        animation_file: 'Love.json',
        base_coins_reward: 10
      },
      {
        id: 'gifts_002',
        title: 'Подарок "просто так"',
        text: 'Купите или сделайте своими руками небольшой подарок для партнера без повода. Главное - показать, что вы о нем думаете.',
        source: 'LoveMemory Team',
        tags: ['gifts', 'surprise', 'thoughtful'],
        triggers: {
          love_language: ['gifts'],
          gap_days: [3, 'more']
        },
        effect: {
          gifts: 4,
          heat: 2
        },
        theme: 'receiving_gifts',
        interactive_type: 'photo',
        difficulty_level: 2,
        required_streak: 3,
        animation_file: 'Market Research.json',
        base_coins_reward: 18
      },

      // Quality Time уроки
      {
        id: 'time_001',
        title: '15 минут наедине',
        text: 'Проведите 15 минут наедине с партнером без телефонов и других отвлекающих факторов. Просто поговорите или помолчите вместе.',
        source: 'LoveMemory Team',
        tags: ['time', 'attention', 'present'],
        triggers: {
          love_language: ['time'],
          context: ['low_heat']
        },
        effect: {
          time: 3,
          heat: 2
        },
        theme: 'quality_time',
        interactive_type: 'prompt',
        difficulty_level: 1,
        required_streak: 0,
        animation_file: 'Lover People Sitting on Garden Banch.json',
        base_coins_reward: 12
      },
      {
        id: 'time_002',
        title: 'Совместная активность',
        text: 'Предложите партнеру заняться чем-то вместе - приготовить ужин, посмотреть фильм, прогуляться или поиграть в игру. Главное - быть полностью вовлеченным.',
        source: 'LoveMemory Team',
        tags: ['time', 'activity', 'together'],
        triggers: {
          love_language: ['time'],
          relationship_stage: ['developing', 'established', 'mature']
        },
        effect: {
          time: 4,
          heat: 3
        },
        theme: 'quality_time',
        interactive_type: 'choice',
        difficulty_level: 2,
        required_streak: 1,
        animation_file: 'Developer discussing different options.json',
        base_coins_reward: 15
      },

      // Physical Touch уроки
      {
        id: 'touch_001',
        title: 'Нежное прикосновение',
        text: 'Сделайте нежный жест - погладьте по волосам, обнимите, возьмите за руку. Проявите физическую близость естественно и с любовью.',
        source: 'LoveMemory Team',
        tags: ['touch', 'gentle', 'affection'],
        triggers: {
          love_language: ['touch'],
          relationship_stage: ['established', 'mature']
        },
        effect: {
          touch: 3,
          heat: 2
        },
        theme: 'physical_touch',
        interactive_type: 'prompt',
        difficulty_level: 1,
        required_streak: 0,
        animation_file: 'Relationship.json',
        base_coins_reward: 10
      },
      {
        id: 'touch_002',
        title: 'Массаж',
        text: 'Предложите партнеру сделать расслабляющий массаж плеч, шеи или стоп. Проявите заботу через физическое прикосновение.',
        source: 'LoveMemory Team',
        tags: ['touch', 'massage', 'relaxation'],
        triggers: {
          love_language: ['touch'],
          context: ['low_heat'],
          gap_days: [2, 'more']
        },
        effect: {
          touch: 4,
          heat: 3
        },
        theme: 'physical_touch',
        interactive_type: 'prompt',
        difficulty_level: 2,
        required_streak: 2,
        animation_file: 'Love.json',
        base_coins_reward: 18
      },

      // Heat Boosters уроки
      {
        id: 'heat_001',
        title: 'Флирт как в начале отношений',
        text: 'Флиртуйте с партнером так, как будто вы только начали встречаться. Пошлите игривое сообщение или сделайте комплимент с намеком.',
        source: 'LoveMemory Team',
        tags: ['heat', 'flirt', 'playful'],
        triggers: {
          context: ['low_heat'],
          relationship_stage: ['established', 'mature']
        },
        effect: {
          heat: 4,
          words: 1
        },
        theme: 'heat_boosters',
        interactive_type: 'chat',
        difficulty_level: 2,
        required_streak: 1,
        animation_file: 'Love.json',
        base_coins_reward: 15
      },
      {
        id: 'heat_002',
        title: 'Романтический сюрприз',
        text: 'Организуйте небольшой романтический сюрприз - свечи, музыка, особенная атмосфера. Покажите, что партнер по-прежнему желанен.',
        source: 'LoveMemory Team',
        tags: ['heat', 'romance', 'surprise'],
        triggers: {
          context: ['low_heat'],
          gap_days: [5, 'more']
        },
        effect: {
          heat: 5,
          gifts: 2,
          time: 2
        },
        theme: 'heat_boosters',
        interactive_type: 'photo',
        difficulty_level: 3,
        required_streak: 5,
        animation_file: 'Couple sharing and caring love.json',
        base_coins_reward: 25
      },

      // Attachment Healing уроки (для тревожного стиля привязанности)
      {
        id: 'attach_001',
        title: 'Подтверждение чувств',
        text: 'Если ваш партнер склонен к тревожности в отношениях, скажите ему прямо и ясно о своих чувствах. Дайте конкретные заверения в своей любви.',
        source: 'LoveMemory Team',
        tags: ['attachment', 'anxiety', 'reassurance'],
        triggers: {
          attachment_style: ['anxious'],
          gap_days: [1, 'more']
        },
        effect: {
          words: 3,
          heat: 2
        },
        theme: 'attachment_healing',
        interactive_type: 'chat',
        difficulty_level: 2,
        required_streak: 3,
        animation_file: 'Relationship.json',
        base_coins_reward: 20
      },
      {
        id: 'attach_002',
        title: 'Планы на будущее',
        text: 'Обсудите с партнером ваши планы на ближайшее будущее вместе. Это поможет укрепить чувство стабильности в отношениях.',
        source: 'LoveMemory Team',
        tags: ['attachment', 'future', 'stability'],
        triggers: {
          attachment_style: ['anxious', 'fearful'],
          relationship_stage: ['developing', 'established']
        },
        effect: {
          time: 3,
          words: 2,
          heat: 1
        },
        theme: 'attachment_healing',
        interactive_type: 'prompt',
        difficulty_level: 3,
        required_streak: 7,
        animation_file: 'Target Evaluation.json',
        base_coins_reward: 22
      }
    ];

    // Добавляем timestamps
    const now = new Date();
    const lessonsWithTimestamps = lessons.map(lesson => ({
      ...lesson,
      tags: JSON.stringify(lesson.tags),
      triggers: JSON.stringify(lesson.triggers),
      effect: JSON.stringify(lesson.effect),
      createdAt: now,
      updatedAt: now
    }));

    await queryInterface.bulkInsert('lessons', lessonsWithTimestamps);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('lessons', null, {});
  }
};

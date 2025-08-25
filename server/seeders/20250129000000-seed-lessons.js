'use strict';

const path = require('path');
const fs = require('fs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Загружаем уроки из JSON файлов
    const lessonsDir = path.join(__dirname, '../..', 'client/src/assets/lessons');
    
    const themes = [
      'words_of_affirmation',
      'physical_touch', 
      'quality_time',
      'acts_of_service',
      'receiving_gifts',
      'attachment_healing',
      'heat_boosters',
      'creative_time'
    ];
    
    let allLessons = [];
    
    for (const theme of themes) {
      try {
        const filePath = path.join(lessonsDir, `${theme}.json`);
        if (fs.existsSync(filePath)) {
          const lessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          allLessons = allLessons.concat(lessons);
        }
      } catch (error) {
        console.warn(`Could not load lessons for theme ${theme}:`, error.message);
      }
    }
    
    if (allLessons.length === 0) {
      console.warn('No lessons found, using fallback data');
      // Fallback к базовым урокам если файлы не найдены
      allLessons = [
        {
          id: 'words_001',
          title: 'Комплимент дня',
          text: 'Сегодня сделайте искренний комплимент своему партнеру.',
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
        }
      ];
    }

    // Добавляем timestamps
    const now = new Date();
    const lessonsWithTimestamps = allLessons.map(lesson => ({
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

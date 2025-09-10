import wordsOfAffirmation from './words_of_affirmation.json';
import physicalTouch from './physical_touch.json';
import qualityTime from './quality_time.json';
import actsOfService from './acts_of_service.json';
import receivingGifts from './receiving_gifts.json';
import attachmentHealing from './attachment_healing.json';
import heatBoosters from './heat_boosters.json';
import creativeTime from './creative_time.json';

export const lessonsByTheme = {
  words_of_affirmation: wordsOfAffirmation,
  physical_touch: physicalTouch,
  quality_time: qualityTime,
  acts_of_service: actsOfService,
  receiving_gifts: receivingGifts,
  attachment_healing: attachmentHealing,
  heat_boosters: heatBoosters,
  creative_time: creativeTime
};

export const allLessons = [
  ...wordsOfAffirmation,
  ...physicalTouch,
  ...qualityTime,
  ...actsOfService,
  ...receivingGifts,
  ...attachmentHealing,
  ...heatBoosters,
  ...creativeTime
];

export const themes = {
  words_of_affirmation: {
    name: 'Слова поддержки',
    description: 'Комплименты, благодарность, признания',
    icon: '💬',
    count: wordsOfAffirmation.length
  },
  physical_touch: {
    name: 'Физические прикосновения',
    description: 'Объятия, массаж, нежные касания',
    icon: '🤗',
    count: physicalTouch.length
  },
  quality_time: {
    name: 'Качественное время',
    description: 'Совместные активности и общение',
    icon: '⏰',
    count: qualityTime.length
  },
  acts_of_service: {
    name: 'Дела служения',
    description: 'Помощь, поддержка, забота',
    icon: '🛠️',
    count: actsOfService.length
  },
  receiving_gifts: {
    name: 'Получение подарков',
    description: 'Сюрпризы, символические дары',
    icon: '🎁',
    count: receivingGifts.length
  },
  attachment_healing: {
    name: 'Исцеление привязанности',
    description: 'Работа с доверием и уязвимостью',
    icon: '💚',
    count: attachmentHealing.length
  },
  heat_boosters: {
    name: 'Усилители страсти',
    description: 'Флирт, интимность, романтика',
    icon: '🔥',
    count: heatBoosters.length
  },
  creative_time: {
    name: 'Творческое время',
    description: 'Совместное творчество и развлечения',
    icon: '🎨',
    count: creativeTime.length
  }
};

export default allLessons;
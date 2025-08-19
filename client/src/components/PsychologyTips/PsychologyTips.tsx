import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Quote, Lightbulb, Heart, Users, Brain } from 'lucide-react';
import styles from './PsychologyTips.module.css';

interface PsychologyTip {
  id: string;
  title: string;
  content: string;
  author: string;
  book: string;
  category: 'communication' | 'attachment' | 'intimacy' | 'conflict' | 'growth' | 'mindfulness';
  tags: string[];
}

interface PsychologyTipsProps {
  userPreferences?: {
    focusAreas: string[];
    relationshipStage: string;
  };
}

const psychologyTips: PsychologyTip[] = [
  {
    id: 'gottman_01',
    title: 'Принцип 4:1',
    content: 'На каждое негативное взаимодействие должно приходиться минимум 4 позитивных. Это золотое правило здоровых отношений - критика должна быть сбалансирована похвалой, поддержкой и пониманием.',
    author: 'Джон Готтман',
    book: '7 принципов счастливого брака',
    category: 'communication',
    tags: ['позитив', 'баланс', 'общение']
  },
  {
    id: 'gottman_02',
    title: 'Эмоциональный банковский счет',
    content: 'Каждое позитивное взаимодействие - это вклад в отношения, каждое негативное - снятие средств. Важно регулярно делать "эмоциональные вклады": проявлять интерес, быть благодарным, делать комплименты.',
    author: 'Джон Готтман',
    book: '7 принципов счастливого брака',
    category: 'intimacy',
    tags: ['эмоции', 'инвестиции', 'доверие']
  },
  {
    id: 'chapman_01',
    title: 'Язык любви партнера',
    content: 'Люди выражают и воспринимают любовь по-разному. Узнайте основной язык любви вашего партнера: слова поддержки, время, подарки, помощь или прикосновения - и "говорите" на нем чаще.',
    author: 'Гэри Чепмен',
    book: '5 языков любви',
    category: 'intimacy',
    tags: ['языки любви', 'понимание', 'выражение']
  },
  {
    id: 'johnson_01',
    title: 'Цикл негативности',
    content: 'Большинство конфликтов - это не борьба против партнера, а борьба против негативного цикла взаимодействия. Научитесь видеть паттерн: "Когда я делаю X, ты реагируешь Y, и тогда я чувствую Z".',
    author: 'Сью Джонсон',
    book: 'Обними меня крепче',
    category: 'conflict',
    tags: ['паттерны', 'циклы', 'осознанность']
  },
  {
    id: 'perel_01',
    title: 'Парадокс близости',
    content: 'Страсть требует дистанции, близость требует безопасности. Важно найти баланс между слиянием и автономией - быть достаточно близкими для безопасности и достаточно отдельными для желания.',
    author: 'Эстер Перель',
    book: 'Размышления о любви и похоти',
    category: 'intimacy',
    tags: ['баланс', 'автономия', 'страсть']
  },
  {
    id: 'hendrix_01',
    title: 'Зеркало партнера',
    content: 'Партнер часто отражает наши непроработанные детские травмы. Вместо того чтобы менять партнера, используйте отношения как зеркало для личностного роста и исцеления.',
    author: 'Харвилл Хендрикс',
    book: 'Получите любовь, которую хотите',
    category: 'growth',
    tags: ['рост', 'исцеление', 'зеркалирование']
  },
  {
    id: 'brown_01',
    title: 'Уязвимость как сила',
    content: 'Настоящая близость возможна только через уязвимость. Делитесь своими страхами, мечтами и неуверенностью - это создает глубокую эмоциональную связь и доверие.',
    author: 'Брене Браун',
    book: 'Дары несовершенства',
    category: 'intimacy',
    tags: ['уязвимость', 'доверие', 'открытость']
  },
  {
    id: 'tatkin_01',
    title: 'Принцип безопасности',
    content: 'В отношениях важнее быть правым или быть в безопасности? Выбирайте безопасность: защищайте партнера от стыда, критики и угроз, даже в конфликте.',
    author: 'Стэн Таткин',
    book: 'Парная терапия',
    category: 'attachment',
    tags: ['безопасность', 'защита', 'приоритеты']
  }
];

const PsychologyTips: React.FC<PsychologyTipsProps> = ({ userPreferences }) => {
  const [currentTip, setCurrentTip] = useState<PsychologyTip | null>(null);
  const [tipHistory, setTipHistory] = useState<string[]>([]);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  useEffect(() => {
    selectRandomTip();
  }, []);

  const selectRandomTip = () => {
    // Фильтруем по предпочтениям пользователя
    let filteredTips = psychologyTips;
    
    if (userPreferences?.focusAreas?.length) {
      filteredTips = psychologyTips.filter(tip => 
        tip.tags.some(tag => userPreferences.focusAreas.includes(tag)) ||
        userPreferences.focusAreas.includes(tip.category)
      );
    }

    // Исключаем недавно показанные советы
    const availableTips = filteredTips.filter(tip => 
      !tipHistory.includes(tip.id)
    );

    const tipsToChooseFrom = availableTips.length > 0 ? availableTips : filteredTips;
    const randomTip = tipsToChooseFrom[Math.floor(Math.random() * tipsToChooseFrom.length)];
    
    setCurrentTip(randomTip);
    
    // Обновляем историю (оставляем только последние 5)
    setTipHistory(prev => [randomTip.id, ...prev.slice(0, 4)]);
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      communication: <Users size={20} />,
      attachment: <Heart size={20} />,
      intimacy: <Heart size={20} />,
      conflict: <Brain size={20} />,
      growth: <Lightbulb size={20} />,
      mindfulness: <BookOpen size={20} />
    };
    return icons[category as keyof typeof icons] || <BookOpen size={20} />;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      communication: 'Общение',
      attachment: 'Привязанность',
      intimacy: 'Близость',
      conflict: 'Конфликты',
      growth: 'Рост',
      mindfulness: 'Осознанность'
    };
    return labels[category as keyof typeof labels] || category;
  };

  if (!currentTip) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <BookOpen size={24} className={styles.headerIcon} />
          <h2 className={styles.sectionTitle}>Совет психолога</h2>
        </div>
        <p className={styles.subtitle}>
          Научно обоснованные принципы здоровых отношений
        </p>
      </div>

      <motion.div 
        className={styles.tipCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={currentTip.id}
      >
        <div className={styles.tipHeader}>
          <div className={styles.categoryBadge}>
            {getCategoryIcon(currentTip.category)}
            <span>{getCategoryLabel(currentTip.category)}</span>
          </div>
          
          <div className={styles.quoteIcon}>
            <Quote size={32} />
          </div>
        </div>

        <div className={styles.tipContent}>
          <h3 className={styles.tipTitle}>{currentTip.title}</h3>
          
          <div className={styles.tipText}>
            {currentTip.content}
          </div>

          <div className={styles.tipMeta}>
            <div className={styles.authorInfo}>
              <div className={styles.author}>{currentTip.author}</div>
              <div className={styles.book}>"{currentTip.book}"</div>
            </div>
          </div>

          <div className={styles.tags}>
            {currentTip.tags.map(tag => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <motion.button 
            className={styles.newTipButton}
            onClick={selectRandomTip}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Lightbulb size={18} />
            Новый совет
          </motion.button>
        </div>
      </motion.div>

      {/* Все советы */}
      <div className={styles.allTipsSection}>
        <h3 className={styles.allTipsTitle}>Библиотека советов</h3>
        <div className={styles.tipsGrid}>
          {psychologyTips.map(tip => (
            <motion.div 
              key={tip.id}
              className={`${styles.miniTipCard} ${expandedTip === tip.id ? styles.expanded : ''}`}
              whileHover={{ scale: 1.02 }}
              onClick={() => setExpandedTip(expandedTip === tip.id ? null : tip.id)}
            >
              <div className={styles.miniTipHeader}>
                <div className={styles.miniCategoryIcon}>
                  {getCategoryIcon(tip.category)}
                </div>
                <div className={styles.miniTipTitle}>{tip.title}</div>
              </div>
              
              <AnimatePresence>
                {expandedTip === tip.id && (
                  <motion.div
                    className={styles.miniTipContent}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <p className={styles.miniTipText}>{tip.content}</p>
                    <div className={styles.miniTipAuthor}>
                      — {tip.author}, "{tip.book}"
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PsychologyTips;

import React, { useState, useEffect } from 'react';
import { FaPlus, FaMinus, FaCheck } from 'react-icons/fa';
import styles from './InterestSelector.module.css';

export interface Interest {
  id: string;
  name: string;
  category: string;
  emoji?: string;
  description?: string;
}

export interface UserInterest {
  interest_id: string;
  preference: 'love' | 'like' | 'neutral' | 'dislike';
  intensity: number;
}

interface InterestSelectorProps {
  interests: Interest[];
  selectedInterests: UserInterest[];
  onInterestToggle: (interestId: string, preference: 'love' | 'like' | 'neutral' | 'dislike') => void;
  onIntensityChange: (interestId: string, intensity: number) => void;
  maxSelections?: number;
  minSelections?: number;
  groupByCategory?: boolean;
}

const categoryTranslations: Record<string, string> = {
  food: '🍽️ Еда',
  cinema: '🎬 Кино и развлечения',
  hobby: '🎨 Хобби',
  sport: '⚽ Спорт',
  travel: '✈️ Путешествия',
  music: '🎵 Музыка',
  art: '🎭 Искусство',
  books: '📚 Книги',
  games: '🎮 Игры',
  nature: '🌲 Природа',
  technology: '💻 Технологии',
  fashion: '👗 Мода',
  cooking: '👨‍🍳 Готовка',
  fitness: '💪 Фитнес',
  photography: '📸 Фотография',
  dancing: '💃 Танцы',
  shopping: '🛍️ Шоппинг',
  animals: '🐕 Животные',
  cars: '🚗 Автомобили',
  crafts: '🔨 Рукоделие',
  education: '🎓 Образование',
  volunteering: '🤝 Волонтерство',
  other: '📋 Другое'
};

const preferenceLabels = {
  love: { label: 'Обожаю', icon: '❤️', color: '#e91e63' },
  like: { label: 'Нравится', icon: '👍', color: '#4caf50' },
  neutral: { label: 'Нейтрально', icon: '😐', color: '#9e9e9e' },
  dislike: { label: 'Не нравится', icon: '👎', color: '#f44336' }
};

const InterestSelector: React.FC<InterestSelectorProps> = ({
  interests,
  selectedInterests,
  onInterestToggle,
  onIntensityChange,
  maxSelections = 20,
  minSelections = 5,
  groupByCategory = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredInterests = interests.filter(interest => {
    const matchesSearch = interest.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || interest.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedInterests = groupByCategory ? 
    filteredInterests.reduce((acc, interest) => {
      if (!acc[interest.category]) {
        acc[interest.category] = [];
      }
      acc[interest.category].push(interest);
      return acc;
    }, {} as Record<string, Interest[]>) : 
    { all: filteredInterests };

  const categories = [...new Set(interests.map(interest => interest.category))];

  const getSelectedInterest = (interestId: string) => {
    return selectedInterests.find(si => si.interest_id === interestId);
  };

  const isSelected = (interestId: string) => {
    return selectedInterests.some(si => si.interest_id === interestId);
  };

  const selectedCount = selectedInterests.length;
  const canSelectMore = selectedCount < maxSelections;
  const hasMinimum = selectedCount >= minSelections;

  const handleInterestClick = (interestId: string) => {
    if (isSelected(interestId)) {
      // Если уже выбран - убираем из выборки
      onInterestToggle(interestId, 'dislike');
    } else if (canSelectMore) {
      // Если не выбран - добавляем с интенсивностью по умолчанию
      onInterestToggle(interestId, 'like');
    }
  };

  // Функция для определения эмодзи по интенсивности
  const getPreferenceByIntensity = (intensity: number): 'love' | 'like' | 'neutral' | 'dislike' => {
    if (intensity >= 9) return 'love';      // ❤️ 9-10
    if (intensity >= 7) return 'like';      // 👍 7-8
    if (intensity >= 4) return 'neutral';   // 😐 4-6
    return 'dislike';                       // 👎 1-3
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Расскажите о ваших интересах</h3>
        <p className={styles.subtitle}>
          Нажмите на интерес для выбора, используйте ползунок для настройки отношения: ❤️ обожаю (9-10), 👍 нравится (7-8), 😐 нейтрально (4-6), 👎 не нравится (1-3)
        </p>
        <div className={styles.counter}>
          <span className={`${styles.count} ${hasMinimum ? styles.valid : styles.invalid}`}>
            {selectedCount}
          </span>
          <span className={styles.countText}>
            из {maxSelections} интересов выбрано
            {!hasMinimum && (
              <span className={styles.minText}> (минимум {minSelections})</span>
            )}
          </span>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Поиск интересов..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        
        <div className={styles.categoryFilter}>
          <button
            className={`${styles.categoryButton} ${selectedCategory === 'all' ? styles.active : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Все
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {categoryTranslations[category] || category}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.interestsGrid}>
        {Object.entries(groupedInterests).map(([category, categoryInterests]) => (
          <div key={category} className={styles.categoryGroup}>
            {groupByCategory && category !== 'all' && (
              <h4 className={styles.categoryTitle}>
                {categoryTranslations[category] || category}
              </h4>
            )}
            
            <div className={styles.interestsList}>
              {categoryInterests.map(interest => {
                const selected = getSelectedInterest(interest.id);
                const intensity = selected?.intensity || 7;
                const preference = selected ? getPreferenceByIntensity(intensity) : undefined;
                
                return (
                  <div
                    key={interest.id}
                    className={`${styles.interestCard} ${isSelected(interest.id) ? styles.selected : ''}`}
                    onClick={() => handleInterestClick(interest.id)}
                    style={{
                      borderColor: preference ? preferenceLabels[preference].color : undefined,
                      opacity: !canSelectMore && !isSelected(interest.id) ? 0.5 : 1
                    }}
                  >
                    <div className={styles.interestContent}>
                      <div className={styles.interestHeader}>
                        {interest.emoji && (
                          <span className={styles.interestEmoji}>{interest.emoji}</span>
                        )}
                        <span className={styles.interestName}>{interest.name}</span>
                        {isSelected(interest.id) && preference && (
                          <span 
                            className={styles.preferenceIcon}
                            style={{ color: preferenceLabels[preference].color }}
                          >
                            {preferenceLabels[preference].icon}
                          </span>
                        )}
                      </div>
                      
                      {interest.description && (
                        <p className={styles.interestDescription}>{interest.description}</p>
                      )}
                      
                      {isSelected(interest.id) && (
                        <div className={styles.intensityControl}>
                          <label className={styles.intensityLabel}>
                            Интенсивность: {intensity}/10
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={intensity}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newIntensity = parseInt(e.target.value);
                              onIntensityChange(interest.id, newIntensity);
                              // Обновляем предпочтение на основе интенсивности
                              const newPreference = getPreferenceByIntensity(newIntensity);
                              onInterestToggle(interest.id, newPreference);
                            }}
                            className={styles.intensitySlider}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedInterests.length > 0 && (
        <div className={styles.selectedSummary}>
          <h4 className={styles.summaryTitle}>Выбранные интересы:</h4>
          <div className={styles.selectedList}>
            {selectedInterests.map(selected => {
              const interest = interests.find(i => i.id === selected.interest_id);
              if (!interest) return null;
              
              return (
                <div key={selected.interest_id} className={styles.selectedItem}>
                  <span className={styles.selectedItemContent}>
                    {interest.emoji} {interest.name}
                    <span 
                      className={styles.selectedPreference}
                      style={{ color: preferenceLabels[selected.preference].color }}
                    >
                      {preferenceLabels[selected.preference].icon}
                    </span>
                  </span>
                  <span className={styles.selectedIntensity}>
                    {selected.intensity}/10
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestSelector;

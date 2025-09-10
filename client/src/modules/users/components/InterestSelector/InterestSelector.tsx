import React, { useState, useEffect } from 'react';
import { Heart, Utensils, Film, Palette, Dumbbell, Plane, Music, Book, Gamepad2, Trees, Laptop, Shirt, ChefHat, Camera, Car, Hammer, GraduationCap, HandHeart, List, Search, ChevronDown, Star, Lightbulb } from 'lucide-react';
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

const categoryConfig: Record<string, { name: string; icon: React.ReactNode }> = {
  food: { name: 'Еда', icon: <Utensils size={16} /> },
  cinema: { name: 'Кино и развлечения', icon: <Film size={16} /> },
  hobby: { name: 'Хобби', icon: <Palette size={16} /> },
  sport: { name: 'Спорт', icon: <Dumbbell size={16} /> },
  travel: { name: 'Путешествия', icon: <Plane size={16} /> },
  music: { name: 'Музыка', icon: <Music size={16} /> },
  art: { name: 'Искусство', icon: <Palette size={16} /> },
  books: { name: 'Книги', icon: <Book size={16} /> },
  games: { name: 'Игры', icon: <Gamepad2 size={16} /> },
  nature: { name: 'Природа', icon: <Trees size={16} /> },
  technology: { name: 'Технологии', icon: <Laptop size={16} /> },
  fashion: { name: 'Мода', icon: <Shirt size={16} /> },
  cooking: { name: 'Готовка', icon: <ChefHat size={16} /> },
  fitness: { name: 'Фитнес', icon: <Dumbbell size={16} /> },
  photography: { name: 'Фотография', icon: <Camera size={16} /> },
  dancing: { name: 'Танцы', icon: <Music size={16} /> },
  shopping: { name: 'Шоппинг', icon: <Shirt size={16} /> },
  animals: { name: 'Животные', icon: <Heart size={16} /> },
  cars: { name: 'Автомобили', icon: <Car size={16} /> },
  crafts: { name: 'Рукоделие', icon: <Hammer size={16} /> },
  education: { name: 'Образование', icon: <GraduationCap size={16} /> },
  volunteering: { name: 'Волонтерство', icon: <HandHeart size={16} /> },
  other: { name: 'Другое', icon: <List size={16} /> }
};

const preferenceConfig = {
  love: { label: 'Обожаю', icon: <Heart size={14} fill="currentColor" />, color: 'var(--color-primary)' },
  like: { label: 'Нравится', icon: <Star size={14} fill="currentColor" />, color: 'var(--color-success)' },
  neutral: { label: 'Нейтрально', icon: <Star size={14} />, color: 'var(--color-text-tertiary)' },
  dislike: { label: 'Не нравится', icon: <Star size={14} />, color: 'var(--color-error)' }
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
          Выберите интересы, которые вам близки. Используйте шкалу интенсивности для точной настройки предпочтений.
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
              <span className={styles.categoryButtonIcon}>
                {categoryConfig[category]?.icon || <List size={14} />}
              </span>
              {categoryConfig[category]?.name || category}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.interestsGrid}>
        {Object.entries(groupedInterests).map(([category, categoryInterests]) => (
          <div key={category} className={styles.categoryGroup}>
            {groupByCategory && category !== 'all' && (
              <h4 className={styles.categoryTitle}>
                <span className={styles.categoryIcon}>
                  {categoryConfig[category]?.icon || <List size={16} />}
                </span>
                {categoryConfig[category]?.name || category}
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
                      borderColor: preference ? preferenceConfig[preference].color : undefined,
                      opacity: !canSelectMore && !isSelected(interest.id) ? 0.5 : 1
                    }}
                  >
                    <div className={styles.interestContent}>
                      <div className={styles.interestHeader}>
                        <div className={styles.interestIcon}>
                          {categoryConfig[interest.category]?.icon || <Heart size={16} />}
                        </div>
                        <span className={styles.interestName}>{interest.name}</span>
                        {isSelected(interest.id) && preference && (
                          <div 
                            className={styles.preferenceIcon}
                            style={{ color: preferenceConfig[preference].color }}
                          >
                            {preferenceConfig[preference].icon}
                          </div>
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
                    <div className={styles.selectedItemIcon}>
                      {categoryConfig[interest.category]?.icon || <Heart size={14} />}
                    </div>
                    {interest.name}
                    <div 
                      className={styles.selectedPreference}
                      style={{ color: preferenceConfig[selected.preference].color }}
                    >
                      {preferenceConfig[selected.preference].icon}
                    </div>
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

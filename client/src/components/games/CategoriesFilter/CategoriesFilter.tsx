import React from 'react';
import { CategoryTab } from '../../../ui/games';
import styles from './CategoriesFilter.module.css';

interface CategoriesFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  gameCounts?: Record<string, number>;
  className?: string;
}

/**
 * Компонент фильтра по категориям игр
 * Использует UI компоненты, содержит логику отображения фильтров
 */
const CategoriesFilter: React.FC<CategoriesFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  gameCounts,
  className = ''
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <h3 className={styles.title}>Категории</h3>
      <div className={styles.tabs}>
        {categories.map((category) => (
          <CategoryTab
            key={category}
            category={category}
            isSelected={selectedCategory === category}
            onClick={onCategoryChange}
            count={gameCounts?.[category]}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoriesFilter;

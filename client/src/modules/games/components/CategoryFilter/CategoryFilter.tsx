import React from 'react';
import styles from './CategoryFilter.module.css';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}) => {
  return (
    <section className={styles.filterSection}>
      <div className={styles.categoryFilter}>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`${styles.categoryChip} ${
              selectedCategory === category ? styles.categoryChipActive : ''
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </section>
  );
};

export default CategoryFilter;

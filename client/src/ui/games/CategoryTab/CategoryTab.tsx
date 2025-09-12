import React from 'react';
import styles from './CategoryTab.module.css';

interface CategoryTabProps {
  category: string;
  isSelected: boolean;
  onClick: (category: string) => void;
  count?: number;
  className?: string;
}

/**
 * Переиспользуемая вкладка категории
 * Чистый UI компонент без бизнес-логики
 */
const CategoryTab: React.FC<CategoryTabProps> = ({
  category,
  isSelected,
  onClick,
  count,
  className = ''
}) => {
  return (
    <button
      onClick={() => onClick(category)}
      className={`${styles.tab} ${isSelected ? styles.selected : ''} ${className}`}
    >
      <span className={styles.label}>{category}</span>
      {count !== undefined && (
        <span className={styles.count}>{count}</span>
      )}
    </button>
  );
};

export default CategoryTab;

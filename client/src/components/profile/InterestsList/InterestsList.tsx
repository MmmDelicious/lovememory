import React from 'react';
import { InterestBadge } from '../../../ui/profile';
import { Plus } from 'lucide-react';
import styles from './InterestsList.module.css';

interface Interest {
  id: string;
  interest_id: string;
  preference: 'love' | 'like' | 'neutral' | 'dislike';
  intensity: number;
  Interest: {
    id: string;
    name: string;
    category: string;
    emoji?: string;
  };
}

interface InterestsListProps {
  interests: Interest[];
  onInterestClick?: (interest: Interest) => void;
  onInterestRemove?: (interestId: string) => void;
  onAddInterest?: () => void;
  showAddButton?: boolean;
  showIntensity?: boolean;
  editable?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * Компонент списка интересов пользователя
 * Использует UI компоненты, содержит логику отображения интересов
 */
const InterestsList: React.FC<InterestsListProps> = ({
  interests,
  onInterestClick,
  onInterestRemove,
  onAddInterest,
  showAddButton = false,
  showIntensity = false,
  editable = false,
  loading = false,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loadingGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.loadingSkeleton} />
          ))}
        </div>
      </div>
    );
  }

  const groupedInterests = React.useMemo(() => {
    const groups: Record<string, Interest[]> = {};
    interests.forEach((interest) => {
      const category = interest.Interest.category || 'Другое';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(interest);
    });
    return groups;
  }, [interests]);

  const categories = Object.keys(groupedInterests).sort();

  if (interests.length === 0 && !showAddButton) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Интересы не указаны</p>
          <p className={styles.emptySubtext}>Добавьте интересы, чтобы найти совместимость с партнером</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {categories.length > 0 && (
        <div className={styles.categoriesContainer}>
          {categories.map((category) => (
            <div key={category} className={styles.category}>
              <h3 className={styles.categoryTitle}>{category}</h3>
              <div className={styles.interestsGrid}>
                {groupedInterests[category].map((interest) => (
                  <InterestBadge
                    key={interest.id}
                    name={interest.Interest.name}
                    emoji={interest.Interest.emoji}
                    preference={interest.preference}
                    intensity={interest.intensity}
                    showIntensity={showIntensity}
                    onClick={() => onInterestClick?.(interest)}
                    onRemove={editable ? () => onInterestRemove?.(interest.id) : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddButton && onAddInterest && (
        <button className={styles.addButton} onClick={onAddInterest}>
          <Plus size={20} className={styles.addIcon} />
          <span>Добавить интерес</span>
        </button>
      )}
    </div>
  );
};

export default InterestsList;

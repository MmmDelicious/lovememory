import React, { useState } from 'react';
import './RecommendationCard.css';

interface RecommendationItem {
  item_id: string;
  title: string;
  category: string;
  score: number;
  reasons: string[];
  price: number;
  location?: [number, number];
}

interface RecommendationCardProps {
  item: RecommendationItem;
  onItemClick: (item: RecommendationItem) => void;
  index: number;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  item, 
  onItemClick, 
  index 
}) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    if (!isClicked) {
      setIsClicked(true);
      onItemClick(item);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'restaurant':
        return '🍽️';
      case 'gift':
        return '🎁';
      case 'activity':
        return '🏃‍♂️';
      case 'entertainment':
        return '🎬';
      case 'travel':
        return '✈️';
      default:
        return '💡';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return '#4CAF50'; // Зеленый
    if (score >= 0.4) return '#FF9800'; // Оранжевый
    return '#F44336'; // Красный
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div 
      className={`recommendation-card ${isClicked ? 'clicked' : ''}`}
      onClick={handleClick}
    >
      <div className="recommendation-header">
        <div className="recommendation-rank">
          #{index + 1}
        </div>
        <div className="recommendation-category">
          {getCategoryIcon(item.category)}
        </div>
        <div 
          className="recommendation-score"
          style={{ backgroundColor: getScoreColor(item.score) }}
        >
          {(item.score * 100).toFixed(0)}%
        </div>
      </div>

      <div className="recommendation-content">
        <h3 className="recommendation-title">{item.title}</h3>
        
        <div className="recommendation-price">
          {formatPrice(item.price)}
        </div>

        {item.reasons.length > 0 && (
          <div className="recommendation-reasons">
            <h4>Почему рекомендовано:</h4>
            <ul>
              {item.reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {item.location && (
          <div className="recommendation-location">
            📍 Координаты: {item.location[0].toFixed(4)}, {item.location[1].toFixed(4)}
          </div>
        )}
      </div>

      <div className="recommendation-footer">
        <button 
          className="recommendation-button"
          disabled={isClicked}
        >
          {isClicked ? 'Выбрано' : 'Выбрать'}
        </button>
      </div>
    </div>
  );
};

export default RecommendationCard;

import React, { useState, useEffect } from 'react';
import RecommendationCard from './RecommendationCard';
import { recommendationsAPI } from '@api/recommendations';
import './RecommendationList.css';

interface RecommendationItem {
  item_id: string;
  title: string;
  category: string;
  score: number;
  reasons: string[];
  price: number;
  location?: [number, number];
}

interface RecommendationListProps {
  pairId: string;
  topK?: number;
  userLocation?: { lat: number; lon: number };
}

const RecommendationList: React.FC<RecommendationListProps> = ({ 
  pairId, 
  topK = 10, 
  userLocation 
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RecommendationItem | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [pairId, topK, userLocation]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await recommendationsAPI.getRecommendations(
        pairId, 
        topK, 
        userLocation
      );
      
      setRecommendations(response || []);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Не удалось загрузить рекомендации');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (item: RecommendationItem) => {
    try {
      setSelectedItem(item);
      
      // Логируем клик
      await recommendationsAPI.logRecommendationClick(pairId, item);
      
      console.log('Selected recommendation:', item);
    } catch (err) {
      console.error('Error logging click:', err);
    }
  };

  const handleRefresh = () => {
    loadRecommendations();
  };

  if (loading) {
    return (
      <div className="recommendation-list">
        <div className="recommendation-list-header">
          <h2>🎯 AI Рекомендации</h2>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загружаем персональные рекомендации...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendation-list">
        <div className="recommendation-list-header">
          <h2>🎯 AI Рекомендации</h2>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-button">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="recommendation-list">
        <div className="recommendation-list-header">
          <h2>🎯 AI Рекомендации</h2>
        </div>
        <div className="empty-container">
          <div className="empty-icon">🤔</div>
          <p>Рекомендации не найдены</p>
          <button onClick={handleRefresh} className="retry-button">
            Обновить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendation-list">
      <div className="recommendation-list-header">
        <h2>🎯 AI Рекомендации</h2>
        <div className="recommendation-actions">
          <button onClick={handleRefresh} className="refresh-button">
            🔄 Обновить
          </button>
        </div>
      </div>

      <div className="recommendation-stats">
        <div className="stat-item">
          <span className="stat-label">Найдено:</span>
          <span className="stat-value">{recommendations.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Модель:</span>
          <span className="stat-value">Content-Based v1</span>
        </div>
      </div>

      {selectedItem && (
        <div className="selected-item-notification">
          <div className="notification-content">
            <span className="notification-icon">✅</span>
            <span>Выбрано: {selectedItem.title}</span>
          </div>
        </div>
      )}

      <div className="recommendations-grid">
        {recommendations.map((item, index) => (
          <RecommendationCard
            key={item.item_id}
            item={item}
            index={index}
            onItemClick={handleItemClick}
          />
        ))}
      </div>

      <div className="recommendation-footer">
        <p className="disclaimer">
          💡 Рекомендации основаны на ваших интересах, бюджете и предпочтениях
        </p>
      </div>
    </div>
  );
};

export default RecommendationList;

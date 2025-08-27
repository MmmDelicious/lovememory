import React, { useState } from 'react';
import DateRouteMap from '../DateRouteMap/DateRouteMap';
import { Place } from '../../api/yandexMaps';
import styles from './DateGenerationResult.module.css';

interface DateOption {
  id: string;
  title: string;
  description: string;
  schedule: Array<{
    time: string;
    endTime: string;
    activity: string;
    description: string;
    location?: string;
  }>;
  estimatedCost: number;
  duration: number;
  atmosphere: 'romantic' | 'fun' | 'adventure';
  reasoning: string;
  isRealData: boolean;
  activitiesCount: number;
  places?: Place[];
}

interface DateGenerationResultProps {
  options: DateOption[];
  reasoning: string[];
  onSelectDate: (option: DateOption) => void;
  onClose: () => void;
}

const DateGenerationResult: React.FC<DateGenerationResultProps> = ({
  options,
  reasoning,
  onSelectDate,
  onClose
}) => {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const selectedOption = options[selectedOptionIndex];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getAtmosphereEmoji = (atmosphere: string) => {
    switch (atmosphere) {
      case 'romantic': return '💕';
      case 'fun': return '🎉';
      case 'adventure': return '🌟';
      default: return '✨';
    }
  };

  const getAtmosphereLabel = (atmosphere: string) => {
    switch (atmosphere) {
      case 'romantic': return 'Романтическая';
      case 'fun': return 'Веселая';
      case 'adventure': return 'Приключенческая';
      default: return 'Особенная';
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>🎯 Варианты свиданий готовы!</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Процесс генерации */}
        <div className={styles.reasoningSection}>
          <h3>💭 Как я создавал варианты:</h3>
          <div className={styles.reasoningSteps}>
            {reasoning.map((step, index) => (
              <div key={index} className={styles.reasoningStep}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Переключатель между вариантами */}
        <div className={styles.optionTabs}>
          {options.map((option, index) => (
            <button
              key={option.id}
              className={`${styles.optionTab} ${selectedOptionIndex === index ? styles.active : ''}`}
              onClick={() => setSelectedOptionIndex(index)}
            >
              {getAtmosphereEmoji(option.atmosphere)} Вариант {index + 1}
            </button>
          ))}
        </div>

        {/* Выбранный вариант */}
        <div className={styles.optionDetails}>
          <div className={styles.optionHeader}>
            <h3>{selectedOption.title}</h3>
            <div className={styles.optionMeta}>
              <span className={styles.atmosphere}>
                {getAtmosphereEmoji(selectedOption.atmosphere)} {getAtmosphereLabel(selectedOption.atmosphere)}
              </span>
              <span className={styles.cost}>{formatCurrency(selectedOption.estimatedCost)}</span>
              <span className={styles.duration}>{selectedOption.duration}ч</span>
            </div>
          </div>

          <p className={styles.description}>{selectedOption.description}</p>

          {/* Карта маршрута (если есть места с координатами) */}
          {selectedOption.places && selectedOption.places.length > 0 && (
            <div className={styles.mapSection}>
              <h4>📍 Маршрут на карте:</h4>
              <DateRouteMap
                places={selectedOption.places}
                height="300px"
                showRoute={true}
              />
            </div>
          )}

          {/* Расписание */}
          <div className={styles.schedule}>
            <h4>⏰ Расписание:</h4>
            <div className={styles.scheduleItems}>
              {selectedOption.schedule.map((item, index) => (
                <div key={index} className={styles.scheduleItem}>
                  <div className={styles.timeSlot}>
                    <span className={styles.startTime}>{item.time}</span>
                    <span className={styles.endTime}>- {item.endTime}</span>
                  </div>
                  <div className={styles.activity}>
                    <strong>{item.activity}</strong>
                    <p>{item.description}</p>
                    {item.location && (
                      <span className={styles.location}>📍 {item.location}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Обоснование выбора */}
          <div className={styles.reasoning}>
            <h4>🤔 Почему этот вариант:</h4>
            <p>{selectedOption.reasoning}</p>
          </div>

          {/* Индикатор реальных данных */}
          <div className={styles.dataSource}>
            {selectedOption.isRealData ? (
              <span className={styles.realData}>✅ Использованы реальные места из Yandex Maps</span>
            ) : (
              <span className={styles.staticData}>ℹ️ Рекомендации на основе общих предпочтений</span>
            )}
          </div>
        </div>

        {/* Действия */}
        <div className={styles.actions}>
          <button 
            className={styles.selectButton}
            onClick={() => onSelectDate(selectedOption)}
          >
            📅 Добавить в календарь
          </button>
          <button 
            className={styles.regenerateButton}
            onClick={onClose}
          >
            🔄 Создать новые варианты
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateGenerationResult;


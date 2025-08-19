import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Clock, DollarSign, MapPin, Star, Check, Bug } from 'lucide-react';
import dateGeneratorService from '../../services/dateGenerator.service';
import styles from './DateGeneratorModal.module.css';
import DebugDataViewer from '../DebugDataViewer/DebugDataViewer';

import type { DateOption, DateScheduleItem } from '../../../types/common';

interface ReasoningStep {
  text: string;
  timestamp: Date;
}

interface DateGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (event: any) => void;
}

const DateGeneratorModal: React.FC<DateGeneratorModalProps> = ({
  isOpen,
  onClose,
  onEventCreated
}) => {
  const [step, setStep] = useState<'reasoning' | 'options' | 'calendar'>('reasoning');
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([]);
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<DateOption | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebugData, setShowDebugData] = useState(false);
  const [userLocation, setUserLocation] = useState<{ city: string; coordinates?: { latitude: number; longitude: number } } | null>(null);

  // Генерация свиданий при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      generateDateOptions();
    } else {
      // Сброс состояния при закрытии
      setStep('reasoning');
      setReasoningSteps([]);
      setDateOptions([]);
      setSelectedOption(null);
      setSelectedDate('');
      setError(null);
    }
  }, [isOpen]);

  const generateDateOptions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Анализ данных пользователя
      await dateGeneratorService.analyzeUserData();
      
      // Показываем рассуждения по шагам
      const steps = dateGeneratorService.getReasoningSteps();
      
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Задержка между шагами
        setReasoningSteps(prev => [...prev, steps[i]]);
      }
      
      // Генерируем варианты свиданий
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = await dateGeneratorService.generateDateOptions();
      
      // Сохраняем информацию о местоположении для отладки
      if (result.userLocation) {
        setUserLocation(result.userLocation);
      }
      
      // Показываем финальные шаги рассуждений
      const finalSteps = dateGeneratorService.getReasoningSteps().slice(steps.length);
      for (const step of finalSteps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setReasoningSteps(prev => [...prev, step]);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Проверяем что result.options существует и это массив
      if (result && result.options && Array.isArray(result.options)) {
        setDateOptions(result.options);
        console.log('Date options set:', result.options);
      } else {
        console.error('Invalid date options received:', result);
        setDateOptions([]); // устанавливаем пустой массив как fallback
        setError('Получены некорректные данные. Попробуйте еще раз.');
      }
      
      setStep('options');
      
    } catch (err) {
      console.error('Error generating date options:', err);
      setError('Не удалось сгенерировать варианты свиданий. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (option: DateOption) => {
    setSelectedOption(option);
    setStep('calendar');
    
    // Устанавливаем дату по умолчанию на завтра
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  };

  const handleCreateEvent = async () => {
    if (!selectedOption || !selectedDate) return;
    
    setIsLoading(true);
    try {
      const event = await dateGeneratorService.createDateEvent(selectedOption, selectedDate);
      
      if (onEventCreated) {
        onEventCreated(event);
      }
      
      onClose();
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Не удалось создать событие. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

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
      default: return '✨';
    }
  };

  const getAtmosphereLabel = (atmosphere: string) => {
    switch (atmosphere) {
      case 'romantic': return 'Романтическая';
      case 'fun': return 'Веселая';
      default: return 'Сбалансированная';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'entertainment': return '🎪 Развлечение';
      case 'cultural': return '🎭 Культура';
      case 'outdoor': return '🌳 Прогулка';
      case 'active': return '🏃‍♂️ Активность';
      case 'food': return '🍽️ Еда';
      case 'restaurant': return '🍽️ Ресторан';
      case 'cafe': return '☕ Кафе';
      default: return '📍 Место';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {step === 'reasoning' && '🤔 Анализирую ваши данные...'}
            {step === 'options' && '💕 Варианты свиданий'}
            {step === 'calendar' && '📅 Выберите дату'}
          </h2>
          <div className={styles.headerButtons}>
            {userLocation && (
              <button 
                onClick={() => setShowDebugData(true)} 
                className={styles.debugButton}
                title="Посмотреть данные для отладки"
              >
                <Bug size={20} />
              </button>
            )}
            <button className={styles.closeButton} onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div className={styles.modalContent}>
          {/* Этап рассуждений */}
          {step === 'reasoning' && (
            <div className={styles.reasoningContainer}>
              <div className={styles.reasoningSteps}>
                {reasoningSteps.map((step, index) => (
                  <div
                    key={index}
                    className={styles.reasoningStep}
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className={styles.stepBubble}>{step.text}</div>
                  </div>
                ))}
              </div>
              
              {isLoading && (
                <div className={styles.loadingIndicator}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Думаю над идеальным свиданием...</p>
                </div>
              )}
            </div>
          )}

          {/* Этап выбора вариантов */}
          {step === 'options' && (
            <div className={styles.optionsContainer}>
              <p className={styles.optionsDescription}>
                Вот что я подобрал специально для вас! Выберите понравившийся вариант:
              </p>
              
              <div className={styles.optionsList}>
                {Array.isArray(dateOptions) && dateOptions.length > 0 ? (
                  dateOptions.map((option, index) => (
                  <div
                    key={option.id}
                    className={styles.optionCard}
                    onClick={() => handleOptionSelect(option)}
                  >
                    <div className={styles.optionHeader}>
                      <h3 className={styles.optionTitle}>
                        {getAtmosphereEmoji(option.atmosphere)} Вариант {index + 1}
                      </h3>
                      <div className={styles.optionMeta}>
                        <span className={styles.atmosphere}>
                          {getAtmosphereLabel(option.atmosphere)}
                        </span>
                      </div>
                    </div>
                    
                    <div className={styles.optionContent}>
                      <div className={styles.optionInfo}>
                        <div className={styles.infoItem}>
                          <MapPin size={16} />
                          <span>{option.activity.name}</span>
                          {option.isRealData && (
                            <span className={styles.realDataBadge}>LIVE</span>
                          )}
                          {option.activity.isEvent && (
                            <span className={styles.eventBadge}>СОБЫТИЕ</span>
                          )}
                        </div>
                        {option.activity.description && (
                          <div className={styles.placeDescription}>
                            {option.activity.description}
                          </div>
                        )}
                        <div className={styles.infoItem}>
                          <Clock size={16} />
                          <span>{Math.round(option.duration * 10) / 10}ч</span>
                        </div>
                        <div className={styles.infoItem}>
                          <DollarSign size={16} />
                          <span>{formatCurrency(option.estimatedCost)}</span>
                        </div>
                        {option.isRealData && option.activity.rating && (
                          <div className={styles.infoItem}>
                            <Star size={16} />
                            <span>{option.activity.rating}★</span>
                          </div>
                        )}
                        {option.activitiesCount && (
                          <div className={styles.infoItem}>
                            <Calendar size={16} />
                            <span>{option.activitiesCount} мест</span>
                          </div>
                        )}
                      </div>
                      
                      <div className={styles.optionSchedule}>
                        {option.schedule.map((item, idx) => (
                          <div key={idx} className={styles.scheduleItem}>
                            <div className={styles.scheduleHeader}>
                              <span className={styles.scheduleTime}>
                                {item.time} - {item.endTime}
                              </span>
                              <span className={styles.scheduleType}>
                                {getTypeLabel(item.type)}
                              </span>
                            </div>
                            <span className={styles.scheduleActivity}>
                              {item.activity}
                            </span>
                            <span className={styles.scheduleDescription}>
                              {item.description}
                            </span>
                            {/* Показываем описание места если оно есть */}
                            {item.placeDescription && (
                              <div className={styles.schedulePlaceDescription}>
                                💡 {item.placeDescription}
                              </div>
                            )}
                            {item.location && item.location !== 'Локация уточняется' && (
                              <span className={styles.scheduleLocation}>
                                📍 {item.location}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <p className={styles.optionReasoning}>
                        {option.reasoning}
                        {option.isRealData && (
                          <span className={styles.realDataNote}>
                            💫 Актуальные данные из вашего города
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  ))
                ) : (
                  <div className={styles.noOptionsMessage}>
                    <p>🤔 Не удалось найти подходящие варианты. Попробуйте еще раз!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Этап выбора даты */}
          {step === 'calendar' && selectedOption && (
            <div className={styles.calendarContainer}>
              <div className={styles.selectedOptionSummary}>
                <h3>Выбранный вариант:</h3>
                <div className={styles.summaryCard}>
                  <h4>{getAtmosphereEmoji(selectedOption.atmosphere)} {selectedOption.title}</h4>
                  <div className={styles.summaryDetails}>
                    <div className={styles.summaryItem}>
                      <Clock size={16} />
                      <span>{Math.round(selectedOption.duration * 10) / 10}ч</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <DollarSign size={16} />
                      <span>{formatCurrency(selectedOption.estimatedCost)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.dateSelector}>
                <label htmlFor="eventDate" className={styles.dateLabel}>
                  <Calendar size={20} />
                  Выберите дату свидания:
                </label>
                <input
                  id="eventDate"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={styles.dateInput}
                />
              </div>
              
              <div className={styles.actionButtons}>
                <button
                  className={styles.backButton}
                  onClick={() => setStep('options')}
                >
                  Назад к вариантам
                </button>
                <button
                  className={styles.createButton}
                  onClick={handleCreateEvent}
                  disabled={!selectedDate || isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className={styles.buttonSpinner}></div>
                      Создаю...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Создать свидание
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className={styles.errorContainer}>
              <p className={styles.errorMessage}>{error}</p>
              <button
                className={styles.retryButton}
                onClick={() => {
                  setError(null);
                  if (step === 'reasoning') {
                    generateDateOptions();
                  }
                }}
              >
                Попробовать еще раз
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Отладочный просмотрщик данных */}
      {showDebugData && userLocation && (
        <DebugDataViewer
          isOpen={showDebugData}
          onClose={() => setShowDebugData(false)}
          city={userLocation.city}
          coordinates={userLocation.coordinates}
        />
      )}
    </div>
  );
};

export default DateGeneratorModal;

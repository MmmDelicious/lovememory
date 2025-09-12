import React, { useState, useEffect } from 'react';
import { FormInput, InterestBadge } from '../../../../ui/profile';
import { getAllInterests } from '../../../../services/interest.service.js';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import styles from './OnboardingModule.module.css';

interface Interest {
  id: string;
  name: string;
  category: string;
  emoji?: string;
}

interface SelectedInterest {
  interestId: string;
  preference: 'love' | 'like' | 'neutral' | 'dislike';
  intensity: number;
}

interface OnboardingModuleProps {
  userId: string;
  onComplete: (data: any) => void;
  onSkip?: () => void;
  className?: string;
}

/**
 * Модуль онбординга интересов - самостоятельный модуль со своей бизнес-логикой
 * Содержит состояние, API вызовы, обработку ошибок
 * Используется для первичной настройки профиля
 */
const OnboardingModule: React.FC<OnboardingModuleProps> = ({
  userId,
  onComplete,
  onSkip,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  
  const [selectedInterests, setSelectedInterests] = useState<SelectedInterest[]>([]);
  const [currentPreference, setCurrentPreference] = useState<'love' | 'like' | 'neutral' | 'dislike'>('like');
  const [interestsLoading, setInterestsLoading] = useState(true);

  // Загружаем интересы с сервера
  useEffect(() => {
    const loadInterests = async () => {
      try {
        setInterestsLoading(true);
        const interests = await getAllInterests();
        setAvailableInterests(interests || []);
      } catch (error) {
        console.error('Error loading interests:', error);
        // Fallback к пустому списку если API недоступен
        setAvailableInterests([]);
      } finally {
        setInterestsLoading(false);
      }
    };

    loadInterests();
  }, []);

  const steps = [
    {
      title: 'Добро пожаловать!',
      subtitle: 'Давайте настроим ваш профиль',
      component: 'welcome'
    },
    {
      title: 'Ваши интересы',
      subtitle: 'Выберите то, что вам нравится',
      component: 'interests'
    },
    {
      title: 'Готово!',
      subtitle: 'Ваш профиль настроен',
      component: 'complete'
    }
  ];

  const currentStepData = steps[currentStep];

  const handleInterestToggle = (interest: Interest) => {
    const existingIndex = selectedInterests.findIndex(
      selected => selected.interestId === interest.id
    );

    if (existingIndex >= 0) {
      // Если интерес уже выбран, удаляем его
      setSelectedInterests(prev => 
        prev.filter(selected => selected.interestId !== interest.id)
      );
    } else {
      // Если интерес не выбран, добавляем его
      setSelectedInterests(prev => [...prev, {
        interestId: interest.id,
        preference: currentPreference,
        intensity: currentPreference === 'love' ? 5 : currentPreference === 'like' ? 4 : 3
      }]);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // В реальном приложении здесь был бы API вызов
      // await interestService.saveUserInterests(userId, selectedInterests);
      
      // Имитация задержки API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onComplete({
        interests: selectedInterests,
        userId
      });
    } catch (error) {
      console.error('Error saving interests:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <div className={styles.welcomeStep}>
      <div className={styles.welcomeIcon}>🎉</div>
      <h2 className={styles.welcomeTitle}>Добро пожаловать в LoveMemory!</h2>
      <p className={styles.welcomeText}>
        Давайте настроим ваш профиль, чтобы найти идеальную совместимость с партнером.
        Это займет всего несколько минут.
      </p>
      <div className={styles.features}>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>❤️</span>
          <span>Находите общие интересы</span>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🎯</span>
          <span>Получайте персональные рекомендации</span>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🤝</span>
          <span>Укрепляйте отношения</span>
        </div>
      </div>
    </div>
  );

  const renderInterestsStep = () => {
    const groupedInterests = availableInterests.reduce((groups, interest) => {
      const category = interest.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(interest);
      return groups;
    }, {} as Record<string, Interest[]>);

    return (
      <div className={styles.interestsStep}>
        <div className={styles.preferenceSelector}>
          <p className={styles.preferenceLabel}>Как сильно вам это нравится?</p>
          <div className={styles.preferenceButtons}>
            {[
              { key: 'love', label: 'Обожаю', emoji: '❤️' },
              { key: 'like', label: 'Нравится', emoji: '👍' },
              { key: 'neutral', label: 'Нейтрально', emoji: '😐' }
            ].map(pref => (
              <button
                key={pref.key}
                onClick={() => setCurrentPreference(pref.key as any)}
                className={`${styles.preferenceButton} ${
                  currentPreference === pref.key ? styles.active : ''
                }`}
              >
                <span className={styles.preferenceEmoji}>{pref.emoji}</span>
                {pref.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.interestsGrid}>
          {Object.entries(groupedInterests).map(([category, interests]) => (
            <div key={category} className={styles.interestCategory}>
              <h4 className={styles.categoryTitle}>{category}</h4>
              <div className={styles.categoryInterests}>
                {interests.map(interest => {
                  const isSelected = selectedInterests.some(
                    selected => selected.interestId === interest.id
                  );
                  const selectedInterest = selectedInterests.find(
                    selected => selected.interestId === interest.id
                  );

                  return (
                    <div
                      key={interest.id}
                      onClick={() => handleInterestToggle(interest)}
                      className={`${styles.interestItem} ${isSelected ? styles.selected : ''}`}
                    >
                      <InterestBadge
                        name={interest.name}
                        emoji={interest.emoji}
                        preference={selectedInterest?.preference || 'neutral'}
                        intensity={selectedInterest?.intensity || 3}
                        size="medium"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.selectedCount}>
          Выбрано: {selectedInterests.length} интересов
        </div>
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className={styles.completeStep}>
      <div className={styles.completeIcon}>
        <Check size={48} />
      </div>
      <h2 className={styles.completeTitle}>Отлично!</h2>
      <p className={styles.completeText}>
        Вы выбрали {selectedInterests.length} интересов. 
        Теперь мы сможем найти идеальную совместимость с вашим партнером.
      </p>
      <div className={styles.selectedInterestsPreview}>
        {selectedInterests.slice(0, 6).map(selected => {
          const interest = availableInterests.find(i => i.id === selected.interestId);
          if (!interest) return null;
          
          return (
            <InterestBadge
              key={interest.id}
              name={interest.name}
              emoji={interest.emoji}
              preference={selected.preference}
              size="small"
            />
          );
        })}
        {selectedInterests.length > 6 && (
          <div className={styles.moreInterests}>
            +{selectedInterests.length - 6} еще
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className={styles.progressText}>
          Шаг {currentStep + 1} из {steps.length}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>{currentStepData.title}</h1>
          <p className={styles.subtitle}>{currentStepData.subtitle}</p>
        </div>

        <div className={styles.stepContent}>
          {currentStepData.component === 'welcome' && renderWelcomeStep()}
          {currentStepData.component === 'interests' && renderInterestsStep()}
          {currentStepData.component === 'complete' && renderCompleteStep()}
        </div>
      </div>

      <div className={styles.navigation}>
        {currentStep > 0 && (
          <button onClick={handlePrev} className={styles.prevButton}>
            <ChevronLeft size={20} />
            Назад
          </button>
        )}

        <div className={styles.navigationRight}>
          {onSkip && currentStep < steps.length - 1 && (
            <button onClick={onSkip} className={styles.skipButton}>
              Пропустить
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button 
              onClick={handleNext} 
              className={styles.nextButton}
              disabled={currentStep === 1 && selectedInterests.length === 0}
            >
              Далее
              <ChevronRight size={20} />
            </button>
          ) : (
            <button 
              onClick={handleComplete} 
              className={styles.completeButton}
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Завершить'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModule;

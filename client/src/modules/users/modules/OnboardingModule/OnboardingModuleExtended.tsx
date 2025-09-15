import React, { useState, useEffect } from 'react';
import { getAllInterests } from '../../services/interest.service';
import { Interest, SelectedInterest } from '../../types';
import { Check, ChevronRight } from 'lucide-react';
import styles from './OnboardingModuleExtended.module.css';

interface OnboardingModuleExtendedProps {
  userId: string;
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
  className?: string;
}

interface OnboardingData {
  interests: SelectedInterest[];
  budget: BudgetPreferences;
  timePreferences: TimePreferences;
  loveLanguages: LoveLanguages;
  userId: string;
}

interface BudgetPreferences {
  dateBudget: 'low' | 'medium' | 'high';
  giftBudget: 'low' | 'medium' | 'high';
  customValue?: number;
}

interface TimePreferences {
  morning: number; // 0-1
  afternoon: number; // 0-1
  evening: number; // 0-1
  night: number; // 0-1
}

interface LoveLanguages {
  quality_time: number; // 0-1
  physical_touch: number; // 0-1
  words_of_affirmation: number; // 0-1
  acts_of_service: number; // 0-1
  receiving_gifts: number; // 0-1
}

/**
 * Расширенный модуль онбординга согласно Фазе 2 плана
 * Включает: 83+ интереса, бюджет, временные предпочтения, языки любви
 */
const OnboardingModuleExtended: React.FC<OnboardingModuleExtendedProps> = ({
  userId,
  onComplete,
  onSkip,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  
  // Состояние интересов
  const [selectedInterests, setSelectedInterests] = useState<SelectedInterest[]>([]);
  const [currentPreference, setCurrentPreference] = useState<'love' | 'like' | 'neutral' | 'dislike'>('like');
  const [interestsLoading, setInterestsLoading] = useState(true);

  // Состояние бюджета
  const [budget, setBudget] = useState<BudgetPreferences>({
    dateBudget: 'medium',
    giftBudget: 'medium'
  });

  // Состояние временных предпочтений
  const [timePreferences, setTimePreferences] = useState<TimePreferences>({
    morning: 0.3,
    afternoon: 0.4,
    evening: 0.8,
    night: 0.2
  });

  // Состояние языков любви
  const [loveLanguages, setLoveLanguages] = useState<LoveLanguages>({
    quality_time: 0.2,
    physical_touch: 0.2,
    words_of_affirmation: 0.2,
    acts_of_service: 0.2,
    receiving_gifts: 0.2
  });

  // Загружаем интересы с сервера
  useEffect(() => {
    const loadInterests = async () => {
      try {
        setInterestsLoading(true);
        const interests = await getAllInterests();
        setAvailableInterests(interests || []);
      } catch (error) {
        console.error('Error loading interests:', error);
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
      subtitle: 'Выберите то, что вам нравится (83+ вариантов)',
      component: 'interests'
    },
    {
      title: 'Бюджет и предпочтения',
      subtitle: 'Настройте ваши финансовые предпочтения',
      component: 'budget'
    },
    {
      title: 'Время активности',
      subtitle: 'Когда вы предпочитаете проводить время?',
      component: 'time'
    },
    {
      title: 'Языки любви',
      subtitle: 'Как вы выражаете и получаете любовь?',
      component: 'love_languages'
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
      setSelectedInterests(prev => 
        prev.filter(selected => selected.interestId !== interest.id)
      );
    } else {
      setSelectedInterests(prev => [...prev, {
        interestId: interest.id,
        preference: currentPreference,
        intensity: currentPreference === 'love' ? 9 : currentPreference === 'like' ? 7 : currentPreference === 'neutral' ? 5 : 3
      }]);
    }
  };

  const handleIntensityChange = (interestId: string, intensity: number) => {
    setSelectedInterests(prev => 
      prev.map(selected => 
        selected.interestId === interestId 
          ? { ...selected, intensity }
          : selected
      )
    );
  };

  const handleBudgetChange = (type: 'dateBudget' | 'giftBudget', value: 'low' | 'medium' | 'high') => {
    setBudget(prev => ({ ...prev, [type]: value }));
  };

  const handleTimePreferenceChange = (period: keyof TimePreferences, value: number) => {
    setTimePreferences(prev => ({ ...prev, [period]: value }));
  };

  const handleLoveLanguageChange = (language: keyof LoveLanguages, value: number) => {
    setLoveLanguages(prev => ({ ...prev, [language]: value }));
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
      // Здесь будет API вызов для сохранения всех данных
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onComplete({
        interests: selectedInterests,
        budget,
        timePreferences,
        loveLanguages,
        userId
      });
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <div className={styles.welcomeStep}>
      <div className={styles.welcomeIcon}>
        <Check size={48} />
      </div>
      <h2>Добро пожаловать в LoveMemory!</h2>
      <p>Мы поможем вам найти идеальные подарки, спланировать романтические свидания и открыть общие интересы с партнером.</p>
      <div className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <ChevronRight size={24} />
          </div>
          <span>Персонализированные подарки</span>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <ChevronRight size={24} />
          </div>
          <span>Идеальные свидания</span>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <ChevronRight size={24} />
          </div>
          <span>Поиск общих интересов</span>
        </div>
      </div>
    </div>
  );

  const renderInterestsStep = () => (
    <div className={styles.interestsStep}>
      <div className={styles.preferenceSelector}>
        <label>Выберите отношение к интересам:</label>
        <div className={styles.preferenceButtons}>
          {(['love', 'like', 'neutral', 'dislike'] as const).map(pref => (
            <button
              key={pref}
              className={`${styles.preferenceButton} ${currentPreference === pref ? styles.active : ''}`}
              onClick={() => setCurrentPreference(pref)}
            >
              {pref === 'love' && 'Люблю'}
              {pref === 'like' && 'Нравится'}
              {pref === 'neutral' && 'Нейтрально'}
              {pref === 'dislike' && 'Не нравится'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.interestsGrid}>
        {availableInterests.map(interest => {
          const isSelected = selectedInterests.some(selected => selected.interestId === interest.id);
          const selectedData = selectedInterests.find(selected => selected.interestId === interest.id);
          
          return (
            <div
              key={interest.id}
              className={`${styles.interestCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => handleInterestToggle(interest)}
            >
              <div className={styles.interestEmoji}>{interest.emoji}</div>
              <div className={styles.interestName}>{interest.name}</div>
              <div className={styles.interestCategory}>{interest.category}</div>
              
              {isSelected && selectedData && (
                <div className={styles.intensitySlider}>
                  <label>Интенсивность: {selectedData.intensity}/10</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={selectedData.intensity}
                    onChange={(e) => handleIntensityChange(interest.id, parseInt(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className={styles.selectedCount}>
        Выбрано интересов: {selectedInterests.length}
      </div>
    </div>
  );

  const renderBudgetStep = () => (
    <div className={styles.budgetStep}>
      <div className={styles.budgetSection}>
        <h3>Бюджет на свидания</h3>
        <div className={styles.budgetOptions}>
          {(['low', 'medium', 'high'] as const).map(option => (
            <button
              key={option}
              className={`${styles.budgetButton} ${budget.dateBudget === option ? styles.active : ''}`}
              onClick={() => handleBudgetChange('dateBudget', option)}
            >
              {option === 'low' && 'Бюджетный (до 2000₽)'}
              {option === 'medium' && 'Средний (2000-5000₽)'}
              {option === 'high' && 'Премиум (5000₽+)'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.budgetSection}>
        <h3>Бюджет на подарки</h3>
        <div className={styles.budgetOptions}>
          {(['low', 'medium', 'high'] as const).map(option => (
            <button
              key={option}
              className={`${styles.budgetButton} ${budget.giftBudget === option ? styles.active : ''}`}
              onClick={() => handleBudgetChange('giftBudget', option)}
            >
              {option === 'low' && 'Символичные (до 1000₽)'}
              {option === 'medium' && 'Значимые (1000-5000₽)'}
              {option === 'high' && 'Роскошные (5000₽+)'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTimeStep = () => (
    <div className={styles.timeStep}>
      <h3>Когда вы предпочитаете проводить время?</h3>
      <p>Распределите 100% между временными периодами</p>
      
      {(['morning', 'afternoon', 'evening', 'night'] as const).map(period => (
        <div key={period} className={styles.timePreference}>
          <label>
            {period === 'morning' && 'Утро (6:00-12:00)'}
            {period === 'afternoon' && 'День (12:00-18:00)'}
            {period === 'evening' && 'Вечер (18:00-24:00)'}
            {period === 'night' && 'Ночь (0:00-6:00)'}
          </label>
          <div className={styles.timeSlider}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={timePreferences[period]}
              onChange={(e) => handleTimePreferenceChange(period, parseFloat(e.target.value))}
            />
            <span>{Math.round(timePreferences[period] * 100)}%</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderLoveLanguagesStep = () => (
    <div className={styles.loveLanguagesStep}>
      <h3>Языки любви</h3>
      <p>Как вы предпочитаете выражать и получать любовь?</p>
      
      {([
        { key: 'quality_time', name: 'Качественное время', desc: 'Время вместе, разговоры' },
        { key: 'physical_touch', name: 'Физическое прикосновение', desc: 'Объятия, поцелуи, прикосновения' },
        { key: 'words_of_affirmation', name: 'Слова поддержки', desc: 'Комплименты, слова любви' },
        { key: 'acts_of_service', name: 'Акты служения', desc: 'Помощь, забота, услуги' },
        { key: 'receiving_gifts', name: 'Получение подарков', desc: 'Сюрпризы, подарки, знаки внимания' }
      ] as const).map(({ key, name, desc }) => (
        <div key={key} className={styles.loveLanguageItem}>
          <div className={styles.loveLanguageHeader}>
            <div className={styles.loveLanguageEmoji}>
              <ChevronRight size={24} />
            </div>
            <div>
              <div className={styles.loveLanguageName}>{name}</div>
              <div className={styles.loveLanguageDesc}>{desc}</div>
            </div>
          </div>
          <div className={styles.loveLanguageSlider}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={loveLanguages[key]}
              onChange={(e) => handleLoveLanguageChange(key, parseFloat(e.target.value))}
            />
            <span>{Math.round(loveLanguages[key] * 100)}%</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCompleteStep = () => (
    <div className={styles.completeStep}>
      <div className={styles.completeIcon}>
        <Check size={48} />
      </div>
      <h2>Отлично! Ваш профиль готов</h2>
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Интересы:</span>
          <span className={styles.summaryValue}>{selectedInterests.length}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Бюджет свиданий:</span>
          <span className={styles.summaryValue}>{budget.dateBudget}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Бюджет подарков:</span>
          <span className={styles.summaryValue}>{budget.giftBudget}</span>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStepData.component) {
      case 'welcome': return renderWelcomeStep();
      case 'interests': return renderInterestsStep();
      case 'budget': return renderBudgetStep();
      case 'time': return renderTimeStep();
      case 'love_languages': return renderLoveLanguagesStep();
      case 'complete': return renderCompleteStep();
      default: return null;
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <div className={styles.progress}>
          <div 
            className={styles.progressBar}
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className={styles.stepInfo}>
          <h1>{currentStepData.title}</h1>
          <p>{currentStepData.subtitle}</p>
        </div>
      </div>

      <div className={styles.content}>
        {interestsLoading && currentStepData.component === 'interests' ? (
          <div className={styles.loading}>Загружаем интересы...</div>
        ) : (
          renderCurrentStep()
        )}
      </div>

      <div className={styles.footer}>
        <button 
          className={styles.skipButton}
          onClick={onSkip}
        >
          Пропустить
        </button>
        
        <div className={styles.navigation}>
          {currentStep > 0 && (
            <button 
              className={styles.prevButton}
              onClick={handlePrev}
            >
              Назад
            </button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <button 
              className={styles.nextButton}
              onClick={handleNext}
            >
              Далее
            </button>
          ) : (
            <button 
              className={styles.completeButton}
              onClick={handleComplete}
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

export default OnboardingModuleExtended;

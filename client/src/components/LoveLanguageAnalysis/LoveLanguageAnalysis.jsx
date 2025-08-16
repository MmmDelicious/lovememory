import React, { useState, useEffect } from 'react';
import styles from './LoveLanguageAnalysis.module.css';
import smartMascotService from '../../services/smartMascot.service';
import { FaHeart, FaClock, FaComments, FaHandsHelping, FaGift, FaChartPie, FaLightbulb } from 'react-icons/fa';

const LOVE_LANGUAGES = {
  physical_touch: {
    name: 'Прикосновения',
    icon: FaHeart,
    color: '#E91E63',
    description: 'Выражение любви через объятия, поцелуи и нежные прикосновения'
  },
  quality_time: {
    name: 'Время вместе',
    icon: FaClock,
    color: '#2196F3',
    description: 'Проведение качественного времени друг с другом без отвлечений'
  },
  words_of_affirmation: {
    name: 'Слова поддержки',
    icon: FaComments,
    color: '#4CAF50',
    description: 'Выражение чувств через комплименты, слова любви и поддержки'
  },
  acts_of_service: {
    name: 'Помощь и забота',
    icon: FaHandsHelping,
    color: '#FF9800',
    description: 'Проявление заботы через действия и помощь в повседневных делах'
  },
  receiving_gifts: {
    name: 'Подарки',
    icon: FaGift,
    color: '#9C27B0',
    description: 'Выражение любви через внимательные подарки и сюрпризы'
  }
};

const LoveLanguageAnalysis = ({ events = [], interactions = [], user = null }) => {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  useEffect(() => {
    const performAnalysis = async () => {
      setIsLoading(true);
      try {
        // Используем умный сервис для анализа языков любви
        const loveLanguageData = smartMascotService.analyzeLoveLanguages(events, interactions);
        setAnalysis(loveLanguageData);
      } catch (error) {
        console.error('Error analyzing love languages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (events.length > 0) {
      performAnalysis();
    } else {
      setIsLoading(false);
    }
  }, [events, interactions]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <FaChartPie className={styles.headerIcon} />
          <h3>Анализ языков любви</h3>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Анализируем ваши способы выражения любви...</p>
        </div>
      </div>
    );
  }

  if (!analysis || Object.values(analysis.analysis).every(value => value === 0)) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <FaChartPie className={styles.headerIcon} />
          <h3>Анализ языков любви</h3>
        </div>
        <div className={styles.emptyState}>
          <FaHeart className={styles.emptyIcon} />
          <p>Создайте больше воспоминаний вместе, чтобы мы смогли определить ваши языки любви</p>
        </div>
      </div>
    );
  }

  const totalScore = Object.values(analysis.analysis).reduce((sum, value) => sum + value, 0);
  const maxScore = Math.max(...Object.values(analysis.analysis));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FaChartPie className={styles.headerIcon} />
        <h3>Ваши языки любви</h3>
        <p>Как вы выражаете и принимаете любовь</p>
      </div>

      <div className={styles.languagesGrid}>
        {Object.entries(LOVE_LANGUAGES).map(([key, language]) => {
          const score = analysis.analysis[key] || 0;
          const percentage = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
          const isTopLanguage = score === maxScore && score > 0;
          const IconComponent = language.icon;

          return (
            <div 
              key={key}
              className={`${styles.languageCard} ${isTopLanguage ? styles.topLanguage : ''} ${selectedLanguage === key ? styles.selected : ''}`}
              onClick={() => setSelectedLanguage(selectedLanguage === key ? null : key)}
              style={{ '--language-color': language.color }}
            >
              <div className={styles.languageIcon}>
                <IconComponent />
                {isTopLanguage && <div className={styles.topBadge}>Топ</div>}
              </div>
              
              <div className={styles.languageInfo}>
                <h4>{language.name}</h4>
                <div className={styles.scoreBar}>
                  <div 
                    className={styles.scoreFill}
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: language.color
                    }}
                  />
                </div>
                <span className={styles.percentage}>{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedLanguage && (
        <div className={styles.languageDetails}>
          <div className={styles.detailsHeader}>
            <div 
              className={styles.detailsIcon}
              style={{ backgroundColor: LOVE_LANGUAGES[selectedLanguage].color }}
            >
              {React.createElement(LOVE_LANGUAGES[selectedLanguage].icon)}
            </div>
            <h4>{LOVE_LANGUAGES[selectedLanguage].name}</h4>
          </div>
          <p>{LOVE_LANGUAGES[selectedLanguage].description}</p>
          
          <div className={styles.score}>
            <span>Ваш показатель: </span>
            <strong>{analysis.analysis[selectedLanguage]} баллов</strong>
          </div>
        </div>
      )}

      {analysis.dominant.length > 0 && (
        <div className={styles.insights}>
          <div className={styles.insightsHeader}>
            <FaLightbulb className={styles.insightsIcon} />
            <h4>Персональные рекомендации</h4>
          </div>
          
          <div className={styles.dominantLanguages}>
            <h5>Ваши основные языки любви:</h5>
            <div className={styles.dominantList}>
              {analysis.dominant.slice(0, 2).map(([languageKey, score], index) => (
                <div key={languageKey} className={styles.dominantItem}>
                  <span className={styles.dominantRank}>#{index + 1}</span>
                  <span className={styles.dominantName}>
                    {LOVE_LANGUAGES[languageKey].name}
                  </span>
                  <span className={styles.dominantScore}>{score} баллов</span>
                </div>
              ))}
            </div>
          </div>

          {analysis.suggestions.length > 0 && (
            <div className={styles.suggestions}>
              <h5>Рекомендации для укрепления отношений:</h5>
              <ul className={styles.suggestionsList}>
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className={styles.suggestionItem}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className={styles.footer}>
        <p className={styles.footerText}>
          💡 Понимание языков любви поможет вам лучше выражать чувства и понимать потребности партнера
        </p>
      </div>
    </div>
  );
};

export default LoveLanguageAnalysis;


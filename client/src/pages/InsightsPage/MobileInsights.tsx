import React, { useState } from 'react';
import { 
  TrendingUp, 
  Heart, 
  BarChart3, 
  Users, 
  Trophy,
  Target,
  Crown,
  Lightbulb,
  Star,
  Award
} from 'lucide-react';
import styles from './MobileInsights.module.css';

const mockData = {
  harmonyScore: 87,
  previousScore: 82,
  comparisons: {
    harmonyRank: 15,
    eventsRank: 25,
    gamesRank: 8,
    messagesRank: 45
  },
  activities: {
    events: 52,
    games: 38,
    messages: 247,
    photos: 15
  },
  weeklyProgress: {
    communication: 12,
    sharedTime: 8,
    gaming: 15
  }
};

const PSYCHOLOGY_QUOTES = [
  {
    author: 'Джон Готтман',
    text: 'Большинство супружеских споров невозможно полностью разрешить. Ключ — баланс позитива 5:1.',
    advice: 'Чаще делитесь комплиментами и благодарностью — это добавляет тепла в повседневность.',
    category: 'communication'
  },
  {
    author: 'Сью Джонсон',
    text: 'Самый эффективный способ регулировать эмоции в отношениях — делиться ими.',
    advice: 'В моменты напряжения скажите: "Я чувствую [эмоцию], потому что [причина]".',
    category: 'intimacy'
  },
  {
    author: 'Гэри Чепмен',
    text: 'Люди критикуют партнера громче всего там, где сами испытывают глубокую нужду.',
    advice: 'Определите языки любви друг друга — это поможет понять истинные потребности.',
    category: 'goals'
  }
];

const MobileInsights: React.FC = () => {
  const [currentQuote, setCurrentQuote] = useState(PSYCHOLOGY_QUOTES[0]);

  const getRandomQuote = () => {
    const randomQuote = PSYCHOLOGY_QUOTES[Math.floor(Math.random() * PSYCHOLOGY_QUOTES.length)];
    setCurrentQuote(randomQuote);
  };

  return (
    <div className={styles.mobileInsights}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Аналитика отношений 📊</h1>
        <p>Отслеживайте прогресс вашей пары</p>
      </div>

      {/* Harmony Score */}
      <div className={styles.harmonyCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <Heart size={24} />
          </div>
          <div>
            <h3>Harmony Score</h3>
            <p>Общая оценка отношений</p>
          </div>
        </div>
        
        <div className={styles.scoreDisplay}>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreNumber}>{mockData.harmonyScore}</span>
            <span className={styles.scoreMax}>/100</span>
          </div>
          
          <div className={styles.scoreTrend}>
            <TrendingUp size={16} />
            <span>+{mockData.harmonyScore - mockData.previousScore} за месяц</span>
          </div>
        </div>

        <div className={styles.comparisonSection}>
          <div className={styles.rankDisplay}>
            <Target size={20} />
            <span>Топ {mockData.comparisons.harmonyRank}% пар</span>
          </div>
          <p>Ваша гармония выше, чем у {100 - mockData.comparisons.harmonyRank}% других пар</p>
        </div>
      </div>

      {/* Activities */}
      <div className={styles.activitiesCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <BarChart3 size={24} />
          </div>
          <div>
            <h3>Активности за месяц</h3>
          </div>
        </div>
        
        <div className={styles.activitiesGrid}>
          <div className={styles.activityItem}>
            <div className={styles.activityIcon}>📅</div>
            <div className={styles.activityContent}>
              <span className={styles.activityNumber}>{mockData.activities.events}</span>
              <span className={styles.activityLabel}>События</span>
              <span className={styles.activityRank}>Топ {mockData.comparisons.eventsRank}%</span>
            </div>
          </div>
          
          <div className={styles.activityItem}>
            <div className={styles.activityIcon}>🎮</div>
            <div className={styles.activityContent}>
              <span className={styles.activityNumber}>{mockData.activities.games}</span>
              <span className={styles.activityLabel}>Игры</span>
              <span className={styles.activityRank}>Топ {mockData.comparisons.gamesRank}%</span>
            </div>
          </div>
          
          <div className={styles.activityItem}>
            <div className={styles.activityIcon}>💬</div>
            <div className={styles.activityContent}>
              <span className={styles.activityNumber}>{mockData.activities.messages}</span>
              <span className={styles.activityLabel}>Сообщения</span>
              <span className={styles.activityRank}>Топ {mockData.comparisons.messagesRank}%</span>
            </div>
          </div>
          
          <div className={styles.activityItem}>
            <div className={styles.activityIcon}>📸</div>
            <div className={styles.activityContent}>
              <span className={styles.activityNumber}>{mockData.activities.photos}</span>
              <span className={styles.activityLabel}>Фото</span>
              <span className={styles.activityRank}>Среднее</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className={styles.progressCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <Award size={24} />
          </div>
          <div>
            <h3>Прогресс за неделю</h3>
            <p>Ваши достижения</p>
          </div>
        </div>
        
        <div className={styles.progressGrid}>
          <div className={styles.progressItem}>
            <span className={styles.progressNumber}>+{mockData.weeklyProgress.communication}%</span>
            <span className={styles.progressLabel}>Коммуникация</span>
          </div>
          <div className={styles.progressItem}>
            <span className={styles.progressNumber}>+{mockData.weeklyProgress.sharedTime}%</span>
            <span className={styles.progressLabel}>Совместное время</span>
          </div>
          <div className={styles.progressItem}>
            <span className={styles.progressNumber}>+{mockData.weeklyProgress.gaming}%</span>
            <span className={styles.progressLabel}>Игровая активность</span>
          </div>
        </div>
      </div>

      {/* Psychology Quote */}
      <div className={styles.quoteCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <Lightbulb size={24} />
          </div>
          <div>
            <h3>Совет от психолога</h3>
          </div>
        </div>
        
        <div className={styles.quoteContent}>
          <blockquote className={styles.quote}>
            "{currentQuote.text}"
          </blockquote>
          <cite className={styles.quoteAuthor}>— {currentQuote.author}</cite>
          
          <div className={styles.quoteAdvice}>
            <h4>💡 Практический совет:</h4>
            <p>{currentQuote.advice}</p>
          </div>
          
          <button 
            className={styles.newQuoteButton}
            onClick={getRandomQuote}
          >
            Другой совет
          </button>
        </div>
      </div>

      {/* Recommendations */}
      <div className={styles.recommendationsCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <Star size={24} />
          </div>
          <div>
            <h3>Персональные рекомендации</h3>
            <p>На основе ваших данных</p>
          </div>
        </div>
        
        <div className={styles.recommendationsList}>
          <div className={styles.recommendationItem}>
            <div className={styles.recommendationIcon}>🎮</div>
            <div className={styles.recommendationContent}>
              <h4>Игровые чемпионы!</h4>
              <p>Вы в топ-{mockData.comparisons.gamesRank}% пар по играм. Попробуйте новые игры для разнообразия.</p>
            </div>
          </div>
          
          <div className={styles.recommendationItem}>
            <div className={styles.recommendationIcon}>💬</div>
            <div className={styles.recommendationContent}>
              <h4>Больше общения</h4>
              <p>Ваше общение в топ-{mockData.comparisons.messagesRank}%. Попробуйте делиться эмоциями чаще.</p>
            </div>
          </div>
          
          <div className={styles.recommendationItem}>
            <div className={styles.recommendationIcon}>📅</div>
            <div className={styles.recommendationContent}>
              <h4>Планируйте вместе</h4>
              <p>Добавьте еще 2-3 события в календарь для укрепления связи.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Upgrade */}
      <div className={styles.premiumCard}>
        <div className={styles.premiumIcon}>
          <Crown size={32} />
        </div>
        <h3>Премиум аналитика</h3>
        <p>Получите доступ к расширенной статистике, персональным советам и сравнениям с другими парами</p>
        <button className={styles.upgradeButton}>
          Попробовать Premium
        </button>
      </div>
    </div>
  );
};

export default MobileInsights;
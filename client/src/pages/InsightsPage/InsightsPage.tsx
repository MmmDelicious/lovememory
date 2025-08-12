import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Calendar, 
  Gamepad2, 
  Trophy, 
  Star,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Gift,
  Camera,
  Award,
  ChevronRight,
  Filter,
  Crown,
  Target,
  Lightbulb
} from 'lucide-react';
import styles from './InsightsPage.module.css';
import userService from '../../services/user.service';

// Mock данные для демонстрации (используются как фолбэк)
const mockData = {
  harmonyScore: 87,
  previousScore: 82,
  isPremium: false,
  factors: {
    communication: 92,
    intimacy: 85,
    entertainment: 89,
    goals: 81,
    balance: 88
  },
  activities: {
    events: 52,
    games: 38,
    messages: 247,
    photos: 15
  },
  comparisons: {
    harmonyRank: 15, // топ 15%
    eventsRank: 25,  // топ 25%
    gamesRank: 8,    // топ 8%
    messagesRank: 45 // топ 45%
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
  },
  {
    author: 'Амир Левин',
    text: 'Пары с безопасным стилем привязанности чаще находят общий язык.',
    advice: 'Обсудите стили привязанности — это помогает строить доверие и близость.',
    category: 'balance'
  }
];

type ProfileStats = {
  events: number;
  memories: number;
  gamesPlayed: number;
  coins: number;
  daysSinceRegistration: number;
};

const InsightsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'insights'>('overview');
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  const [animatedScore, setAnimatedScore] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(PSYCHOLOGY_QUOTES[0]);
  const [stats, setStats] = useState<ProfileStats | null>(null);

  // Анимация счетчика гармонии
  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const increment = mockData.harmonyScore / 50;
      const animate = () => {
        current += increment;
        if (current < mockData.harmonyScore) {
          setAnimatedScore(Math.floor(current));
          requestAnimationFrame(animate);
        } else {
          setAnimatedScore(mockData.harmonyScore);
        }
      };
      animate();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Случайная цитата при загрузке
  useEffect(() => {
    const randomQuote = PSYCHOLOGY_QUOTES[Math.floor(Math.random() * PSYCHOLOGY_QUOTES.length)];
    setCurrentQuote(randomQuote);
  }, []);

  // Загрузка статистики профиля
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data } = await userService.getProfileStats();
        if (isMounted) {
          setStats(data);
        }
      } catch (e) {
        // Оставляем макеты при ошибке
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const renderOverview = () => (
    <div className={styles.overviewGrid}>
      {/* Harmony Score */}
      <div className={styles.harmonyCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <Heart size={24} />
          </div>
          <div>
            <h3>Harmony Score</h3>
            <p>Общая оценка ваших отношений</p>
          </div>
          {mockData.isPremium && (
            <div className={styles.premiumBadge}>
              <Crown size={16} />
            </div>
          )}
        </div>
        
        <div className={styles.scoreDisplay}>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreNumber}>{animatedScore}</span>
            <span className={styles.scoreMax}>/100</span>
          </div>
          
          <div className={styles.scoreTrend}>
            <TrendingUp size={16} />
            <span>+{mockData.harmonyScore - mockData.previousScore} за месяц</span>
          </div>
        </div>

        {/* Сравнение с другими парами */}
        <div className={styles.comparisonSection}>
          <h4>Сравнение с другими парами</h4>
          <div className={styles.rankDisplay}>
            <Target size={20} />
            <span>Топ {mockData.comparisons.harmonyRank}% пар</span>
          </div>
          <p className={styles.rankDescription}>
            Ваша гармония выше, чем у {100 - mockData.comparisons.harmonyRank}% других пар
          </p>
        </div>
      </div>

      {/* Активности */}
      <div className={styles.activitiesCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <Activity size={24} />
          </div>
          <div>
            <h3>Активности за месяц</h3>
          </div>
        </div>
        
        <div className={styles.activitiesGrid}>
          <div className={styles.activityItem}>
            <Calendar size={20} />
            <div>
              <span className={styles.activityNumber}>{stats?.events ?? mockData.activities.events}</span>
              <span className={styles.activityLabel}>События</span>
              <span className={styles.activityRank}>Топ {mockData.comparisons.eventsRank}%</span>
            </div>
          </div>
          
          <div className={styles.activityItem}>
            <Gamepad2 size={20} />
            <div>
              <span className={styles.activityNumber}>{stats?.gamesPlayed ?? mockData.activities.games}</span>
              <span className={styles.activityLabel}>Игры</span>
              <span className={styles.activityRank}>Топ {mockData.comparisons.gamesRank}%</span>
            </div>
          </div>
          
          <div className={styles.activityItem}>
            <MessageCircle size={20} />
            <div>
              <span className={styles.activityNumber}>{mockData.activities.messages}</span>
              <span className={styles.activityLabel}>Сообщения</span>
              <span className={styles.activityRank}>Топ {mockData.comparisons.messagesRank}%</span>
            </div>
          </div>
          
          <div className={styles.activityItem}>
            <Camera size={20} />
            <div>
              <span className={styles.activityNumber}>{stats?.memories ?? mockData.activities.photos}</span>
              <span className={styles.activityLabel}>Фото</span>
              <span className={styles.activityRank}>Среднее</span>
            </div>
          </div>
        </div>
      </div>

      {/* Факторы гармонии */}
      <div className={styles.factorsCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <BarChart3 size={24} />
          </div>
          <div>
            <h3>Факторы гармонии</h3>
            {!mockData.isPremium && <p className={styles.premiumNote}>Премиум функция</p>}
          </div>
        </div>
        
        <div className={`${styles.factorsList} ${!mockData.isPremium ? styles.blurred : ''}`}>
          {Object.entries(mockData.factors).map(([key, value]) => {
            const factorInfo = {
              communication: { label: 'Коммуникация', color: 'var(--color-primary)' },
              intimacy: { label: 'Близость', color: '#FF6B6B' },
              entertainment: { label: 'Развлечения', color: '#4ECDC4' },
              goals: { label: 'Общие цели', color: '#FFD93D' },
              balance: { label: 'Баланс', color: '#A8E6CF' }
            }[key];

            return (
              <div key={key} className={styles.factorItem}>
                <div className={styles.factorInfo}>
                  <span className={styles.factorLabel}>{factorInfo?.label}</span>
                  <span className={styles.factorValue}>{value}%</span>
                </div>
                <div className={styles.factorProgress}>
                  <div 
                    className={styles.factorBar}
                    style={{ 
                      width: `${value}%`,
                      backgroundColor: factorInfo?.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {!mockData.isPremium && (
          <div className={styles.upgradePrompt}>
            <Crown size={20} />
            <span>Разблокируйте детальный анализ</span>
          </div>
        )}
      </div>

      {/* Цитата дня */}
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
        </div>
      </div>
    </div>
  );

  const renderCharts = () => (
    <div className={styles.chartsGrid}>
      <div className={styles.chartCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <TrendingUp size={24} />
          </div>
          <div>
            <h3>Динамика гармонии</h3>
            <p>Изменения за последние 6 месяцев</p>
          </div>
        </div>
        
        <div className={styles.chartContainer}>
          <div className={styles.chartLabels}>
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>
          <svg viewBox="0 0 400 200" className={styles.chartSvg}>
            <defs>
              <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0"/>
              </linearGradient>
            </defs>
            
            {/* Сетка */}
            <g stroke="var(--color-border)" strokeWidth="1">
              {[40, 80, 120, 160].map(y => (
                <line key={y} x1="50" y1={y} x2="350" y2={y} />
              ))}
            </g>
            
            {/* Линия тренда */}
            <polyline
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="3"
              points="50,150 100,140 150,120 200,100 250,80 300,70 350,60"
              className={styles.trendLine}
            />
            
            {/* Область под линией */}
            <polygon
              fill="url(#trendGradient)"
              points="50,150 100,140 150,120 200,100 250,80 300,70 350,60 350,180 50,180"
            />
            
            {/* Точки */}
            {[
              { x: 50, y: 150, label: 'Авг' },
              { x: 100, y: 140, label: 'Сен' },
              { x: 150, y: 120, label: 'Окт' },
              { x: 200, y: 100, label: 'Ноя' },
              { x: 250, y: 80, label: 'Дек' },
              { x: 300, y: 70, label: 'Янв' },
              { x: 350, y: 60, label: 'Фев' }
            ].map((point, i) => (
              <g key={i}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="var(--color-primary)"
                  className={styles.chartPoint}
                />
                <text
                  x={point.x}
                  y="195"
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--color-text-secondary)"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <Users size={24} />
          </div>
          <div>
            <h3>Сравнение с другими парами</h3>
            <p>Ваша позиция среди всех пар</p>
          </div>
        </div>
        
        <div className={styles.comparisonChart}>
          {[
            { label: 'Общая гармония', rank: mockData.comparisons.harmonyRank, color: 'var(--color-primary)' },
            { label: 'События', rank: mockData.comparisons.eventsRank, color: '#4ECDC4' },
            { label: 'Игры', rank: mockData.comparisons.gamesRank, color: '#FFD93D' },
            { label: 'Общение', rank: mockData.comparisons.messagesRank, color: '#FF6B6B' }
          ].map((item, i) => (
            <div key={i} className={styles.comparisonItem}>
              <div className={styles.comparisonLabel}>
                <span>{item.label}</span>
                <span className={styles.comparisonRank}>Топ {item.rank}%</span>
              </div>
              <div className={styles.comparisonBar}>
                <div 
                  className={styles.comparisonProgress}
                  style={{ 
                    width: `${100 - item.rank}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
              <span className={styles.comparisonText}>
                Лучше {100 - item.rank}% пар
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className={styles.insightsGrid}>
      {/* Цитата и совет */}
      <div className={styles.psychologySection}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <Lightbulb size={24} />
          </div>
          <div>
            <h3>Мудрость психологов</h3>
            <p>Научные советы для ваших отношений</p>
          </div>
        </div>
        
        <div className={styles.psychologyContent}>
          <blockquote className={styles.psychologyQuote}>
            "{currentQuote.text}"
          </blockquote>
          <cite className={styles.psychologyAuthor}>— {currentQuote.author}</cite>
          
          <div className={styles.practicalAdvice}>
            <h4>💡 Как применить:</h4>
            <p>{currentQuote.advice}</p>
          </div>
          
          <button 
            className={styles.newQuoteButton}
            onClick={() => {
              const randomQuote = PSYCHOLOGY_QUOTES[Math.floor(Math.random() * PSYCHOLOGY_QUOTES.length)];
              setCurrentQuote(randomQuote);
            }}
          >
            Другой совет
          </button>
        </div>
      </div>

      {/* Персональные рекомендации */}
      <div className={styles.recommendationsSection}>
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

      {/* Еженедельный прогресс */}
      <div className={styles.weeklyReport}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <Award size={24} />
          </div>
          <div>
            <h3>Прогресс за неделю</h3>
            <p>Ваши достижения</p>
          </div>
        </div>
        
        <div className={styles.reportStats}>
          <div className={styles.reportStat}>
            <span className={styles.reportNumber}>+{mockData.weeklyProgress.communication}%</span>
            <span className={styles.reportLabel}>Коммуникация</span>
          </div>
          <div className={styles.reportStat}>
            <span className={styles.reportNumber}>+{mockData.weeklyProgress.sharedTime}%</span>
            <span className={styles.reportLabel}>Совместное время</span>
          </div>
          <div className={styles.reportStat}>
            <span className={styles.reportNumber}>+{mockData.weeklyProgress.gaming}%</span>
            <span className={styles.reportLabel}>Игровая активность</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.insightsPage}>
      {/* Хедер */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>
              <BarChart3 size={32} />
              Аналитика отношений
            </h1>
            <p className={styles.pageSubtitle}>
              Отслеживайте прогресс ваших отношений
            </p>
          </div>

          {!mockData.isPremium && (
            <div className={styles.upgradeSection}>
              <Crown size={20} />
              <span>Премиум аналитика</span>
            </div>
          )}
        </div>
      </header>

      {/* Навигация */}
      <nav className={styles.navigation}>
        <div className={styles.tabs}>
          {[
            { id: 'overview', label: 'Обзор', icon: BarChart3 },
            { id: 'charts', label: 'Графики', icon: PieChart },
            { id: 'insights', label: 'Советы', icon: Star }
          ].map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.filters}>
          <div className={styles.timeFilter}>
            <Filter size={16} />
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className={styles.filterSelect}
            >
              <option value="week">Неделя</option>
              <option value="month">Месяц</option>
              <option value="year">Год</option>
            </select>
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <main className={styles.mainContent}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'charts' && renderCharts()}
        {activeTab === 'insights' && renderInsights()}
      </main>
    </div>
  );
};

export default InsightsPage;
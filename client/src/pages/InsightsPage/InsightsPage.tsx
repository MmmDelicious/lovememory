import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Heart,
  Filter,
  Crown,
  Network,
  Shield
} from 'lucide-react';
import styles from './InsightsPage.module.css';
import userService from '../../services/user.service';
import analyticsService from '../../services/analytics.service';
import { useUser } from '../../store/hooks';
import LoveLanguageAnalysis from '../../components/LoveLanguageAnalysis/LoveLanguageAnalysis';
import PremiumModal from '../../components/PremiumModal/PremiumModal';
import HexagonChart from '../../components/HexagonChart/HexagonChart';
import PrivacyControls from '../../components/PrivacyControls/PrivacyControls';
import OverviewTab from '../../components/OverviewTab/OverviewTab';
import AnalyticsMascot from '../../components/AnalyticsMascot/AnalyticsMascot';
const mockData = {
  harmonyScore: 87,
  previousScore: 82,
  weeklyProgress: {
    communication: 15,
    sharedTime: 12,
    gaming: 8
  }
};
const PSYCHOLOGY_QUOTES = [
  {
    text: "Любовь - это не только смотреть друг на друга, но и смотреть в одном направлении.",
    author: "Антуан де Сент-Экзюпери"
  },
  {
    text: "Счастливые пары не имеют одинаковых интересов, они имеют одинаковые ценности.",
    author: "Джон Готман"
  }
];
interface ProfileStats {
  events: number;
  memories: number;
  coins: number;
  daysSinceRegistration: number;
  streakDays?: number;
  totalLoginDays?: number;
}

interface AnalyticsData {
  harmonyIndex: number;
  interactionFrequency: number;
  sharedMomentsCount: number;
  engagementDepth: number;
  consistency: number;
  loveLanguageDistribution: any;
  growthSignals: any[];
  breakdown: any;
  insights: any[];
}
const InsightsPage: React.FC = () => {
  const { user } = useUser();

  const [analyticsView, setAnalyticsView] = useState<'overview'>('overview');
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  const [animatedScore, setAnimatedScore] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(PSYCHOLOGY_QUOTES[0]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<number | null>(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isPrivacyControlsOpen, setIsPrivacyControlsOpen] = useState(false);
  const [graphData, setGraphData] = useState<any>(null);
  const [showMascotWelcome, setShowMascotWelcome] = useState(true);
  const [hasMascotShownWelcome, setHasMascotShownWelcome] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    messages: true,
    photos: true,
    events: true,
    activities: true,
    location: true,
    gameHistory: true
  });
  useEffect(() => {
    if (!stats) return;
    const harmonyScore = Math.min(100, Math.max(30, 
      (stats.events * 3) + (stats.memories * 2.5) + (stats.streakDays * 2) + 40
    ));
    const timer = setTimeout(() => {
      let current = 0;
      const animate = () => {
        if (current < harmonyScore) {
          current += 2;
          setAnimatedScore(current);
          requestAnimationFrame(animate);
        } else {
          setAnimatedScore(Math.floor(harmonyScore));
        }
      };
      animate();
    }, 500);
    return () => clearTimeout(timer);
  }, [stats]);
  useEffect(() => {
    const interval = setInterval(() => {
      const randomQuote = PSYCHOLOGY_QUOTES[Math.floor(Math.random() * PSYCHOLOGY_QUOTES.length)];
      setCurrentQuote(randomQuote);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      let isMounted = true;
      try {
        const [statsResponse, profileResponse, eventsResponse] = await Promise.all([
          userService.getProfileStats(),
          userService.getProfile(),
          fetch('/api/events').then(res => res.ok ? res.json() : []).catch(() => [])
        ]);
        
        if (isMounted) {
          setStats(statsResponse.data);
          setUserData(profileResponse.data);
          setEvents(eventsResponse || []);
          
          // Рассчитываем аналитику
          if (statsResponse.data) {
            const analytics = await analyticsService.calculateMetrics(
              statsResponse.data,
              eventsResponse || [],
              profileResponse.data
            );
            setAnalyticsData(analytics);
          }

          // Показываем маскота всегда
          if (analyticsView === 'overview') {
            setTimeout(() => {
              setShowMascotWelcome(true);
            }, 1000);
          }
        }
      } catch (e) {
        console.error('Error loading user data:', e);
      }
    })();
    return () => { 
    };
  }, [user, analyticsView]);
  const handlePremiumUpgrade = () => {
    setIsPremiumModalOpen(false);
    
    // Показываем приветственного маскота
    setShowMascotWelcome(true);
    setHasMascotShownWelcome(false);
  };
  const handlePremiumClick = () => {
    if (user?.role !== 'premium' as any) {
      setIsPremiumModalOpen(true);
    }
  };

  const handleMascotDismiss = () => {
    setShowMascotWelcome(false);
    setHasMascotShownWelcome(true);
  };

  const renderAnalytics = () => {
    return renderOverviewContent();
  };

  const renderOverviewContent = () => {
    if (!stats || !userData || !analyticsData) {
      return (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <h3>Загружаем аналитику...</h3>
        </div>
      );
    }


    const harmonyScore = analyticsData.harmonyIndex;
    const previousScore = Math.max(20, harmonyScore - Math.floor(Math.random() * 20 + 5));

    const strongestAspect = analyticsService.getStrongestAspect(stats, analyticsData);
    const biggestGrowth = analyticsService.getBiggestGrowth(stats, userData);
    const needsAttention = analyticsService.getNeedsAttention(stats, analyticsData.insights);

    // Преобразуем данные языков любви
    const loveLanguageData = Object.entries(analyticsData.loveLanguageDistribution).map(([label, value]) => ({
      label,
      value: Math.round(value as number)
    }));


    const relationshipGraphData = {
      nodes: [
        { id: 'couple', label: 'Вы как пара', x: 400, y: 200, strength: harmonyScore, type: 'center' },
        { id: 'communication', label: 'Общение', x: 200, y: 120, strength: Math.min(100, stats.events * 8 + 50), type: 'skill' },
        { id: 'trust', label: 'Доверие', x: 600, y: 120, strength: Math.min(100, stats.daysSinceRegistration * 0.5 + 55), type: 'emotion' },
        { id: 'shared_time', label: 'Совместное время', x: 120, y: 280, strength: Math.min(100, stats.events * 6 + stats.memories * 3 + 40), type: 'activity' },
        { id: 'intimacy', label: 'Близость', x: 680, y: 280, strength: Math.min(100, stats.memories * 12 + stats.events * 2 + 45), type: 'emotion' }
      ],
      connections: [
        { from: 'couple', to: 'communication', type: 'strong', strength: 0.9 },
        { from: 'couple', to: 'trust', type: 'strong', strength: 0.85 },
        { from: 'couple', to: 'shared_time', type: 'medium', strength: 0.75 },
        { from: 'couple', to: 'intimacy', type: 'strong', strength: 0.88 }
      ],
      overallHealth: harmonyScore
    };

    return (
      <OverviewTab
        harmonyScore={harmonyScore}
        previousScore={previousScore}
        strongestAspect={{
          label: strongestAspect.name,
          value: strongestAspect.value,
          description: strongestAspect.description
        }}
        biggestGrowth={{
          label: biggestGrowth.name,
          value: biggestGrowth.value,
          description: biggestGrowth.description
        }}
        needsAttention={{
          label: needsAttention.name,
          value: needsAttention.value,
          description: needsAttention.description
        }}
        loveLanguageData={loveLanguageData}
        graphData={relationshipGraphData}
        events={events}
        user={user}
        isPremium={user?.role === 'premium'}
        onUpgrade={() => setIsPremiumModalOpen(true)}
      />
    );
  };

  return (
    <div className={styles.insightsPage}>

      <nav className={styles.navigation}>
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>
            <BarChart3 size={28} className={styles.pageIcon} />
            <div>
              <h1>Аналитика отношений</h1>
              <p>Полный обзор ваших отношений с персональными инсайтами</p>
            </div>
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
        </div>
      </nav>
      <main className={styles.mainContent}>
        {renderAnalytics()}
      </main>
      <PremiumModal 
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onUpgrade={handlePremiumUpgrade}
      />
      
      <PrivacyControls
        isOpen={isPrivacyControlsOpen}
        onClose={() => setIsPrivacyControlsOpen(false)}
        onSave={(settings) => {
          setPrivacySettings(settings);
          setIsPrivacyControlsOpen(false);
          }}
        currentSettings={privacySettings}
      />
      
      {/* Analytics Mascot - Always show on Overview tab */}
      {analyticsView === 'overview' && (
        <AnalyticsMascot
          isPremium={true}
          onFirstLogin={showMascotWelcome}
          onDismiss={handleMascotDismiss}
          userName={userData?.name || user?.name || 'Пользователь'}
        />
      )}
    </div>
  );
};
export default InsightsPage;

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Calendar,
  Trophy,
  Award,
  Heart,
  Star,
  Filter,
  Crown,
  Target,
  Lightbulb,
  Network,
  Zap,
  Activity
} from 'lucide-react';
import styles from './InsightsPage.module.css';
import userService from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';
import LoveLanguageAnalysis from '../../components/LoveLanguageAnalysis/LoveLanguageAnalysis';
import PremiumModal from '../../components/PremiumModal/PremiumModal';
import relationshipGraphService from '../../services/relationshipGraph.service';
import HexagonChart from '../../components/HexagonChart/HexagonChart';
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
  gamesPlayed: number;
  coins: number;
  daysSinceRegistration: number;
}
const InsightsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'graph' | 'insights'>('overview');
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  const [animatedScore, setAnimatedScore] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(PSYCHOLOGY_QUOTES[0]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<number | null>(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [graphData, setGraphData] = useState<any>(null);
  useEffect(() => {
    if (!stats) return;
    const harmonyScore = Math.min(100, Math.max(30, 
      (stats.events * 2) + (stats.gamesPlayed * 3) + (stats.memories * 1.5) + 40
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
    if (stats && userData) {
      const dynamicGraph = relationshipGraphService.generateDynamicGraph(
        stats, 
        userData.events || []
      );
      setGraphData(dynamicGraph);
    }
  }, [stats, userData]);
  useEffect(() => {
    (async () => {
      let isMounted = true;
      try {
        const [statsResponse, profileResponse] = await Promise.all([
          userService.getProfileStats(),
          userService.getProfile()
        ]);
        if (isMounted) {
          setStats(statsResponse.data);
          setUserData(profileResponse.data);
        }
      } catch (e) {
        console.error('Error loading user data:', e);
      }
    })();
    return () => { 
    };
  }, []);
  const handlePremiumUpgrade = () => {
    console.log('Upgrading to premium...');
    setIsPremiumModalOpen(false);
  };
  const handlePremiumClick = () => {
    if (user?.role !== 'premium' as any) {
      setIsPremiumModalOpen(true);
    }
  };
  const renderOverview = () => {
    if (!stats || !userData) {
      return (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <h3>Загружаем данные...</h3>
        </div>
      );
    }
    const harmonyScore = Math.min(100, Math.max(30, 
      (stats.events * 2) + (stats.gamesPlayed * 3) + (stats.memories * 1.5) + 40
    ));
    const previousScore = Math.max(30, harmonyScore - Math.floor(Math.random() * 10 + 2));
    return (
      <div className={styles.overviewGrid}>
        {}
        <div className={styles.harmonyCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <Heart size={32} />
            </div>
            <div>
              <h2>Индекс гармонии</h2>
              <p>Общая оценка ваших отношений</p>
            </div>
          </div>
          <div className={styles.scoreDisplay}>
            <div 
              className={styles.scoreCircle}
              style={{ '--progress': animatedScore } as React.CSSProperties}
            >
              <div className={styles.scoreContent}>
                <span className={styles.scoreNumber}>{animatedScore}</span>
                <span className={styles.scoreMax}>из 100</span>
              </div>
            </div>
            <div className={styles.scoreTrend}>
              <TrendingUp size={20} />
              <span>+{harmonyScore - previousScore} за месяц</span>
            </div>
          </div>
          {}
          <div className={styles.comparisonSection}>
            <h4>Ваш рейтинг</h4>
            <div className={styles.rankDisplay}>
              <Trophy size={20} />
              <span>Топ {Math.ceil((100 - harmonyScore) / 10)}%</span>
            </div>
            <p className={styles.rankDescription}>
              {harmonyScore >= 80 ? 'Отличный результат!' : 
               harmonyScore >= 60 ? 'Хорошие отношения' : 
               'Есть куда расти'}
            </p>
          </div>
        </div>
        {}
        <div className={styles.activitiesCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <Calendar size={24} />
            </div>
            <div>
              <h3>Активности за месяц</h3>
              <p>Ваша совместная деятельность</p>
            </div>
          </div>
          <div className={styles.activitiesGrid}>
            <div className={styles.activityItem}>
              <Calendar size={24} />
              <div className={styles.activityInfo}>
                <span className={styles.activityNumber}>{stats.events}</span>
                <span className={styles.activityLabel}>События</span>
                <span className={styles.activityRank}>
                  {stats.events >= 10 ? 'Отлично' : stats.events >= 5 ? 'Хорошо' : 'Можно больше'}
                </span>
              </div>
            </div>
            <div className={styles.activityItem}>
              <Activity size={24} />
              <div className={styles.activityInfo}>
                <span className={styles.activityNumber}>{stats.gamesPlayed}</span>
                <span className={styles.activityLabel}>Игры сыграно</span>
                <span className={styles.activityRank}>
                  {stats.gamesPlayed >= 20 ? 'Игроман' : stats.gamesPlayed >= 10 ? 'Активный' : 'Новичок'}
                </span>
              </div>
            </div>
            <div className={styles.activityItem}>
              <Zap size={24} />
              <div className={styles.activityInfo}>
                <span className={styles.activityNumber}>{stats.coins}</span>
                <span className={styles.activityLabel}>Монеты</span>
                <span className={styles.activityRank}>
                  {stats.coins >= 1000 ? 'Богач' : 'Копит'}
                </span>
              </div>
            </div>
            <div className={styles.activityItem}>
              <Heart size={24} />
              <div className={styles.activityInfo}>
                <span className={styles.activityNumber}>{stats.memories}</span>
                <span className={styles.activityLabel}>Воспоминания</span>
                <span className={styles.activityRank}>
                  {stats.memories >= 5 ? 'Романтик' : 'Начинающий'}
                </span>
              </div>
            </div>
          </div>
        </div>
        {}
        <div className={styles.factorsCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <Target size={24} />
            </div>
            <div>
              <h3>Показатели активности</h3>
              <p>Анализ различных аспектов</p>
            </div>
          </div>
          <div className={styles.factorsList}>
            {[
              { label: 'Планирование', value: Math.min(100, stats.events * 10), color: '#4CAF50' },
              { label: 'Игровая активность', value: Math.min(100, stats.gamesPlayed * 5), color: '#2196F3' },
              { label: 'Воспоминания', value: Math.min(100, stats.memories * 20), color: '#FF9800' },
              { label: 'Общая вовлеченность', value: harmonyScore, color: '#9C27B0' },
              { label: 'Постоянство', value: Math.min(100, stats.daysSinceRegistration * 2), color: '#607D8B' }
            ].map((factor, index) => (
              <div key={index} className={styles.factorItem}>
                <div className={styles.factorInfo}>
                  <span className={styles.factorLabel}>{factor.label}</span>
                  <span className={styles.factorValue}>{factor.value}%</span>
                </div>
                <div className={styles.factorProgress}>
                  <div 
                    className={styles.factorBar}
                    style={{ 
                      width: `${factor.value}%`,
                      backgroundColor: factor.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        {}
        <div className={styles.quoteCard}>
          <div className={styles.quoteContent}>
            <div className={styles.quote}>"{currentQuote.text}"</div>
            <div className={styles.quoteAuthor}>— {currentQuote.author}</div>
          </div>
        </div>
      </div>
    );
  };
  const renderCharts = () => {
    if (!stats) {
      return (
        <div className={styles.chartsGrid}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <h3>Загружаем графики...</h3>
          </div>
        </div>
      );
    }
    const baseScore = Math.min(100, Math.max(30, 
      (stats.events * 2) + (stats.gamesPlayed * 3) + (stats.memories * 1.5) + 40
    ));
    const trendPoints = Array.from({ length: 7 }, (_, i) => {
      const variation = (Math.random() - 0.5) * 20;
      const timeProgress = i * 5;
      return Math.max(20, Math.min(100, baseScore - 20 + timeProgress + variation));
    });
    return (
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
              <g stroke="var(--color-border)" strokeWidth="1">
                {[40, 80, 120, 160].map(y => (
                  <line key={y} x1="50" y1={y} x2="350" y2={y} />
                ))}
              </g>
              <polyline
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3"
                points={trendPoints.map((point, i) => `${50 + i * 50},${200 - (point * 1.4)}`).join(' ')}
                className={styles.trendLine}
              />
              <polygon
                fill="url(#trendGradient)"
                points={`${trendPoints.map((point, i) => `${50 + i * 50},${200 - (point * 1.4)}`).join(' ')} 350,180 50,180`}
              />
              {trendPoints.map((point, index) => {
                const months = ['Авг', 'Сен', 'Окт', 'Ноя', 'Дек', 'Янв', 'Фев'];
                const x = 50 + index * 50;
                const y = 200 - (point * 1.4);
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill="var(--color-primary)"
                      className={styles.chartPoint}
                    />
                    <text
                      x={x}
                      y="195"
                      textAnchor="middle"
                      fontSize="12"
                      fill="var(--color-text-secondary)"
                    >
                      {months[index]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    );
  };
  const renderGraph = () => {
    const currentGraphData = graphData || {
      nodes: [
        { id: 'couple', label: 'Вы как пара', x: 250, y: 150, strength: 85, type: 'center' },
        { id: 'communication', label: 'Общение', x: 150, y: 100, strength: 78, type: 'skill' },
        { id: 'trust', label: 'Доверие', x: 350, y: 100, strength: 82, type: 'emotion' },
        { id: 'shared_time', label: 'Совместное время', x: 150, y: 200, strength: 75, type: 'activity' },
        { id: 'intimacy', label: 'Близость', x: 350, y: 200, strength: 88, type: 'emotion' },
        { id: 'support', label: 'Поддержка', x: 100, y: 150, strength: 80, type: 'behavior' },
        { id: 'future_plans', label: 'Планы на будущее', x: 400, y: 150, strength: 72, type: 'goal' }
      ],
      connections: [
        { from: 'couple', to: 'communication', type: 'strong', strength: 0.9 },
        { from: 'couple', to: 'trust', type: 'strong', strength: 0.85 },
        { from: 'couple', to: 'shared_time', type: 'medium', strength: 0.75 },
        { from: 'couple', to: 'intimacy', type: 'strong', strength: 0.88 },
        { from: 'communication', to: 'trust', type: 'medium', strength: 0.7 },
        { from: 'trust', to: 'intimacy', type: 'strong', strength: 0.82 },
        { from: 'shared_time', to: 'support', type: 'medium', strength: 0.68 },
        { from: 'intimacy', to: 'future_plans', type: 'medium', strength: 0.65 }
      ],
      overallHealth: 82,
      recommendations: []
    };
    const getNodeSize = (strength: number) => {
      return Math.max(40, (strength / 100) * 80);
    };
    const getNodeColor = (strength: number) => {
      if (strength >= 80) return '#4CAF50'; // Зеленый - сильный
      if (strength >= 70) return '#FF9800'; // Оранжевый - средний
      return '#F44336'; // Красный - слабый
    };
    const getConnectionStyle = (connection: any) => {
      const styles: any = {
        strong: { strokeWidth: 4, opacity: 0.8, stroke: '#4CAF50' },
        medium: { strokeWidth: 3, opacity: 0.6, stroke: '#FF9800' },
        weak: { strokeWidth: 2, opacity: 0.4, stroke: '#F44336' },
        potential: { strokeWidth: 2, opacity: 0.3, stroke: '#9E9E9E', strokeDasharray: '5,5' }
      };
      return styles[connection.type] || styles.medium;
    };
    const handleNodeClick = (nodeId: string) => {
      setSelectedNode(selectedNode === nodeId ? null : nodeId);
    };
    const handleConnectionHover = (index: number | null) => {
      setHoveredConnection(index);
    };
    const getConnectionOpacity = (index: number, connection: any) => {
      if (hoveredConnection === null) return getConnectionStyle(connection).opacity;
      return hoveredConnection === index ? 1 : 0.2;
    };
    const getConnectedNodes = (nodeId: string) => {
      const connected = currentGraphData.connections
        .filter(conn => conn.from === nodeId || conn.to === nodeId)
        .map(conn => conn.from === nodeId ? conn.to : conn.from);
      return connected;
    };
    const isNodeConnected = (nodeId: string) => {
      if (!selectedNode) return false;
      return selectedNode === nodeId || getConnectedNodes(selectedNode).includes(nodeId);
    };
    const selectedNodeData = selectedNode ? 
      currentGraphData.nodes.find(node => node.id === selectedNode) : null;
    return (
      <div className={styles.graphContainer}>
        <div className={styles.graphContent}>
          <div className={styles.graphHeader}>
            <h3>Граф ваших отношений</h3>
            <p>Интерактивная карта связей и аспектов отношений</p>
          </div>
          <div className={styles.graphVisualization}>
            <svg viewBox="0 0 500 300" className={styles.graphSvg}>
              {}
              {currentGraphData.connections.map((connection, index) => {
                const fromNode = currentGraphData.nodes.find(n => n.id === connection.from);
                const toNode = currentGraphData.nodes.find(n => n.id === connection.to);
                if (!fromNode || !toNode) return null;
                const style = getConnectionStyle(connection);
                return (
                  <line
                    key={index}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    strokeDasharray={style.strokeDasharray}
                    opacity={getConnectionOpacity(index, connection)}
                    className={styles.graphConnection}
                    onMouseEnter={() => handleConnectionHover(index)}
                    onMouseLeave={() => handleConnectionHover(null)}
                  />
                );
              })}
              {}
              {currentGraphData.nodes.map((node) => {
                const size = getNodeSize(node.strength);
                const color = getNodeColor(node.strength);
                const isConnected = isNodeConnected(node.id);
                const isSelected = selectedNode === node.id;
                return (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={size / 2}
                      fill={color}
                      stroke={isSelected ? '#2196F3' : isConnected ? '#FF9800' : '#fff'}
                      strokeWidth={isSelected ? 4 : isConnected ? 3 : 2}
                      opacity={selectedNode && !isConnected && !isSelected ? 0.3 : 1}
                      className={styles.graphNode}
                      onClick={() => handleNodeClick(node.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <text
                      x={node.x}
                      y={node.y + size / 2 + 20}
                      textAnchor="middle"
                      fontSize="12"
                      fill="var(--color-text-primary)"
                      className={styles.nodeLabel}
                    >
                      {node.label}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + size / 2 + 35}
                      textAnchor="middle"
                      fontSize="10"
                      fill="var(--color-text-secondary)"
                      className={styles.nodeStrength}
                    >
                      {node.strength}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          {selectedNodeData && (
            <div className={styles.nodeDetails}>
              <h4>{selectedNodeData.label}</h4>
              <div className={styles.nodeStrengthBar}>
                <div 
                  className={styles.strengthFill}
                  style={{ 
                    width: `${selectedNodeData.strength}%`,
                    backgroundColor: getNodeColor(selectedNodeData.strength)
                  }}
                />
              </div>
              <p>Сила связи: {selectedNodeData.strength}%</p>
              {selectedNodeData.insights && (
                <p className={styles.nodeInsights}>{selectedNodeData.insights}</p>
              )}
              <div className={styles.connectedNodes}>
                <strong>Связанные аспекты:</strong>
                <div className={styles.connectionsList}>
                  {getConnectedNodes(selectedNodeData.id).map((connectedId) => {
                    const connectedNode = currentGraphData.nodes.find(n => n.id === connectedId);
                    return connectedNode ? (
                      <span key={connectedId} className={styles.connectedNode}>
                        {connectedNode.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}
          {graphData && (
            <div className={styles.graphAnalysis}>
              <div className={styles.overallHealth}>
                <h4>Общее здоровье отношений</h4>
                <div className={styles.healthScore}>
                  <span className={styles.scoreNumber}>{graphData.overallHealth}</span>
                  <span className={styles.scoreLabel}>/ 100</span>
                </div>
              </div>
              {graphData.recommendations.length > 0 && (
                <div className={styles.recommendations}>
                  <h4>Рекомендации</h4>
                  <div className={styles.recommendationsList}>
                    {graphData.recommendations.map((rec, index) => (
                      <div 
                        key={index} 
                        className={`${styles.recommendationItem} ${styles[rec.priority]}`}
                      >
                        <h5>{rec.title}</h5>
                        <p>{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className={styles.graphLegend}>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: '#4CAF50' }}></div>
              <span>Сильная связь (80%+)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: '#FF9800' }}></div>
              <span>Средняя связь (70-79%)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: '#F44336' }}></div>
              <span>Слабая связь (менее 70%)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderInsights = () => {
    return (
      <div className={styles.insightsGrid}>
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
          <div className={styles.quoteContent}>
            <div className={styles.quote}>"{currentQuote.text}"</div>
            <div className={styles.quoteAuthor}>— {currentQuote.author}</div>
          </div>
        </div>
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
        <div className={styles.loveLanguageSection}>
          <div className={styles.modernCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Heart size={24} />
              </div>
              <div>
                <h3>Языки любви</h3>
                <p>Анализ предпочтений в отношениях</p>
              </div>
            </div>
            <HexagonChart
              data={[
                { label: "Слова поддержки", value: 85 },
                { label: "Время вместе", value: 75 },
                { label: "Подарки", value: 60 },
                { label: "Помощь делом", value: 90 },
                { label: "Прикосновения", value: 70 },
                { label: "Внимание", value: 80 }
              ]}
            />
          </div>
          <LoveLanguageAnalysis 
            events={userData?.events || []}
            interactions={[]}
            user={user}
          />
        </div>
      </div>
    );
  };
  return (
    <div className={styles.insightsPage}>
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
          {user?.role !== 'premium' as any && (
            <button 
              className={styles.upgradeSection}
              onClick={handlePremiumClick}
            >
              <Crown size={20} />
              <span>Премиум аналитика</span>
            </button>
          )}
        </div>
      </header>
      <nav className={styles.navigation}>
        <div className={styles.tabs}>
          {[
            { id: 'overview', label: 'Обзор', icon: BarChart3 },
            { id: 'charts', label: 'Графики', icon: PieChart },
            { id: 'graph', label: 'Граф', icon: Network },
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
      <main className={styles.mainContent}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'charts' && renderCharts()}
        {activeTab === 'graph' && renderGraph()}
        {activeTab === 'insights' && renderInsights()}
      </main>
      <PremiumModal 
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onUpgrade={handlePremiumUpgrade}
      />
    </div>
  );
};
export default InsightsPage;

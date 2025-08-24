import React, { useState, useEffect } from 'react';
import { TrendingUp, Heart, AlertTriangle, Users, Crown, Sparkles, Network, Brain } from 'lucide-react';
import styles from './OverviewTab.module.css';
import Lottie from 'lottie-react';
import { getLessonAnimation } from '../../assets/lessons';
import HexagonChart from '../HexagonChart/HexagonChart';
import LoveLanguageAnalysis from '../LoveLanguageAnalysis/LoveLanguageAnalysis';

interface OverviewTabProps {
  harmonyScore?: number;
  previousScore?: number;
  strongestAspect?: {
    label: string;
    value: string;
    description: string;
  };
  biggestGrowth?: {
    label: string;
    value: string;
    description: string;
  };
  needsAttention?: {
    label: string;
    value: string;
    description: string;
  };
  loveLanguageData?: {
    label: string;
    value: number;
  }[];
  graphData?: {
    nodes: any[];
    connections: any[];
    overallHealth: number;
  };
  events?: any[];
  user?: any;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

const PSYCHOLOGY_QUOTES = [
  {
    text: "Здоровые отношения растут благодаря совместному вниманию и заботе друг о друге.",
    author: "Доктор Джон Готман",
    advice: "Попробуйте каждый день уделять партнёру 5 минут полного внимания без отвлечений."
  },
  {
    text: "Любовь - это не только чувство, но и ежедневный выбор заботиться о другом человеке.",
    author: "Доктор Сью Джонсон",
    advice: "Создайте ритуал: каждое утро говорите партнёру одну вещь, за которую вы благодарны."
  },
  {
    text: "Крепкие отношения строятся на умении слышать друг друга, а не только слушать.",
    author: "Доктор Гари Чепмен",
    advice: "Практикуйте активное слушание: повторяйте услышанное своими словами для подтверждения понимания."
  }
];

const OverviewTab: React.FC<OverviewTabProps> = ({
  harmonyScore = 82,
  previousScore = 75,
  strongestAspect = {
    label: "Эмоциональная связь",
    value: "94%",
    description: "Вы отлично понимаете друг друга"
  },
  biggestGrowth = {
    label: "Доверие",
    value: "+12%",
    description: "Значительный рост за месяц"
  },
  needsAttention = {
    label: "Общение",
    value: "-5%",
    description: "Требует больше внимания"
  },
  loveLanguageData = [
    { label: "Слова поддержки", value: 85 },
    { label: "Время вместе", value: 78 },
    { label: "Подарки", value: 65 },
    { label: "Помощь делом", value: 72 },
    { label: "Прикосновения", value: 88 }
  ],
  graphData = {
    nodes: [
      { id: 'couple', label: 'Вы как пара', x: 400, y: 200, strength: 85, type: 'center' },
      { id: 'communication', label: 'Общение', x: 200, y: 120, strength: 78, type: 'skill' },
      { id: 'trust', label: 'Доверие', x: 600, y: 120, strength: 82, type: 'emotion' },
      { id: 'shared_time', label: 'Совместное время', x: 120, y: 280, strength: 75, type: 'activity' },
      { id: 'intimacy', label: 'Близость', x: 680, y: 280, strength: 88, type: 'emotion' }
    ],
    connections: [
      { from: 'couple', to: 'communication', type: 'strong', strength: 0.9 },
      { from: 'couple', to: 'trust', type: 'strong', strength: 0.85 },
      { from: 'couple', to: 'shared_time', type: 'medium', strength: 0.75 },
      { from: 'couple', to: 'intimacy', type: 'strong', strength: 0.88 }
    ],
    overallHealth: 82
  },
  events = [],
  user = null,
  isPremium = false,
  onUpgrade
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(PSYCHOLOGY_QUOTES[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  const scoreChange = harmonyScore - previousScore;
  const scoreChangePercent = Math.round((scoreChange / previousScore) * 100);

  // Анимация счетчика
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      let current = 0;
      const animate = () => {
        if (current < harmonyScore) {
          current += 2;
          setAnimatedScore(Math.min(current, harmonyScore));
          requestAnimationFrame(animate);
        } else {
          setAnimatedScore(harmonyScore);
          setIsAnimating(false);
        }
      };
      animate();
    }, 500);

    return () => clearTimeout(timer);
  }, [harmonyScore]);

  // Ротация цитат
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(prev => {
        const currentIndex = PSYCHOLOGY_QUOTES.findIndex(q => q.text === prev.text);
        const nextIndex = (currentIndex + 1) % PSYCHOLOGY_QUOTES.length;
        return PSYCHOLOGY_QUOTES[nextIndex];
      });
    }, 15000); // Меняем каждые 15 секунд

    return () => clearInterval(interval);
  }, []);

  const getRelationshipLevel = (score: number) => {
    if (score >= 85) return { emoji: '🌳', label: 'Зрелые отношения', color: '#10b981' };
    if (score >= 70) return { emoji: '🌸', label: 'Активный рост', color: '#f59e0b' };
    return { emoji: '🌱', label: 'Зарождение', color: '#8b5cf6' };
  };

  const relationshipLevel = getRelationshipLevel(harmonyScore);

  const loveAnimation = getLessonAnimation('Love.json');
  const coupleAnimation = getLessonAnimation('Couple sharing and caring love.json');
  const relationshipAnimation = getLessonAnimation('Relationship.json');

  return (
    <div className={styles.overviewContainer}>
      {/* Main Harmony Index Card */}
      <div className={styles.harmonyIndexCard}>
        <div className={styles.harmonyHeader}>
          <div className={styles.harmonyTitle}>
            <Crown className={styles.crownIcon} size={24} />
            <div>
              <h2>Relationship Health Gauge</h2>
              <p>Индекс гармонии ваших отношений</p>
            </div>
          </div>
          {isPremium && (
            <div className={styles.premiumBadge}>
              <Sparkles size={16} />
              Premium
            </div>
          )}
        </div>

        <div className={styles.harmonyContent}>
          <div className={styles.scoreSection}>
            <div className={styles.harmonyGauge}>
              <div 
                className={styles.gaugeCircle}
                style={{
                  '--progress': `${animatedScore}`,
                  '--score-color': relationshipLevel.color
                } as React.CSSProperties}
              >
                <div className={styles.gaugeInner}>
                  {loveAnimation && (
                    <div className={styles.lottieWrapper}>
                      <Lottie 
                        animationData={loveAnimation}
                        style={{ width: 60, height: 60 }}
                        loop={true}
                      />
                    </div>
                  )}
                  <div className={styles.scoreDisplay}>
                    <span className={styles.scoreNumber}>{animatedScore}</span>
                    <span className={styles.scoreMax}>/100</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.scoreInfo}>
              <div className={styles.levelIndicator}>
                <span className={styles.levelEmoji}>{relationshipLevel.emoji}</span>
                <span className={styles.levelLabel}>{relationshipLevel.label}</span>
              </div>
              
              <div className={styles.trendInfo}>
                <div className={`${styles.trendBadge} ${scoreChange >= 0 ? styles.positive : styles.negative}`}>
                  <TrendingUp size={16} />
                  {scoreChange >= 0 ? '+' : ''}{scoreChangePercent}% за месяц
                </div>
              </div>

              <p className={styles.scoreCaption}>
                Баланс ваших отношений этот месяц
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Insight Cards Row */}
      <div className={styles.insightCardsRow}>
        {/* Strongest Aspect */}
        <div className={styles.insightCard} data-type="strongest">
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} style={{ backgroundColor: '#C7B8EA' }}>
              <Heart size={20} color="white" />
            </div>
            <div className={styles.cardContent}>
              <h3>Strongest Aspect</h3>
              <p className={styles.cardLabel}>{strongestAspect.label}</p>
              <p className={styles.cardValue}>{strongestAspect.value}</p>
              <p className={styles.cardDescription}>{strongestAspect.description}</p>
            </div>
          </div>
          {relationshipAnimation && (
            <div className={styles.cardLottie}>
              <Lottie 
                animationData={relationshipAnimation}
                style={{ width: 40, height: 40 }}
                loop={true}
              />
            </div>
          )}
        </div>

        {/* Biggest Growth */}
        <div className={styles.insightCard} data-type="growth">
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} style={{ backgroundColor: '#B2E8D7' }}>
              <TrendingUp size={20} color="white" />
            </div>
            <div className={styles.cardContent}>
              <h3>Biggest Growth</h3>
              <p className={styles.cardLabel}>{biggestGrowth.label}</p>
              <p className={styles.cardValue}>{biggestGrowth.value}</p>
              <p className={styles.cardDescription}>{biggestGrowth.description}</p>
            </div>
          </div>
          {coupleAnimation && (
            <div className={styles.cardLottie}>
              <Lottie 
                animationData={coupleAnimation}
                style={{ width: 40, height: 40 }}
                loop={true}
              />
            </div>
          )}
        </div>

        {/* Needs Attention */}
        <div className={styles.insightCard} data-type="attention">
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} style={{ backgroundColor: '#F8BBD0' }}>
              <AlertTriangle size={20} color="white" />
            </div>
            <div className={styles.cardContent}>
              <h3>Needs Attention</h3>
              <p className={styles.cardLabel}>{needsAttention.label}</p>
              <p className={styles.cardValue}>{needsAttention.value}</p>
              <p className={styles.cardDescription}>{needsAttention.description}</p>
            </div>
          </div>
          {!isPremium && (
            <div className={styles.premiumOverlay} onClick={onUpgrade}>
              <Crown size={16} />
              Premium
            </div>
          )}
        </div>
      </div>

      {/* Psychology Quote Card */}
      <div className={styles.quoteCard}>
        <div className={styles.quoteHeader}>
          <div className={styles.psychologistAvatar}>
            {coupleAnimation && (
              <Lottie 
                animationData={coupleAnimation}
                style={{ width: 50, height: 50 }}
                loop={true}
              />
            )}
          </div>
          <div className={styles.quoteInfo}>
            <h3>💡 Инсайт от психолога</h3>
            <p>Персональная рекомендация для вас</p>
          </div>
        </div>

        <div className={styles.quoteContent}>
          <blockquote className={styles.quote}>
            "{currentQuote.text}"
          </blockquote>
          <cite className={styles.author}>— {currentQuote.author}</cite>
          
          <div className={styles.practicalAdvice}>
            <h4>💪 Практический совет</h4>
            <p>{currentQuote.advice}</p>
          </div>
        </div>

        {!isPremium && (
          <div className={styles.premiumPrompt} onClick={onUpgrade}>
            <Crown size={20} />
            <span>Разблокируйте персональные инсайты в Premium</span>
            <TrendingUp size={16} />
          </div>
        )}
      </div>

      {/* Love Languages Section */}
      <div className={styles.loveLanguagesSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <Heart size={24} />
          </div>
          <div>
            <h3>Языки любви</h3>
            <p>Анализ предпочтений в отношениях на основе активности</p>
          </div>
        </div>

        <div className={styles.loveLanguagesContent}>
          <div className={styles.hexagonWrapper}>
            <HexagonChart 
              data={loveLanguageData.map(item => ({
                ...item,
                color: '#8b5cf6'
              }))}
              size={280}
            />
          </div>

          <div className={styles.languageInsights}>
            <h4>💜 Ваши предпочтения:</h4>
            <div className={styles.insightsList}>
              {loveLanguageData
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map((lang, index) => (
                  <div key={lang.label} className={styles.languageInsight}>
                    <span className={styles.rank}>#{index + 1}</span>
                    <span className={styles.langName}>{lang.label}</span>
                    <span className={styles.langValue}>{lang.value}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Relationship Graph Section */}
      <div className={styles.relationshipGraphSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <Network size={24} />
          </div>
          <div>
            <h3>Граф отношений</h3>
            <p>Интерактивная карта связей и аспектов</p>
          </div>
        </div>

        <div className={styles.graphContent}>
          <div className={styles.graphVisualization}>
            <svg viewBox="0 0 800 400" className={styles.graphSvg}>
              {/* Connections */}
              {graphData.connections.map((connection, index) => {
                const fromNode = graphData.nodes.find(n => n.id === connection.from);
                const toNode = graphData.nodes.find(n => n.id === connection.to);
                if (!fromNode || !toNode) return null;

                return (
                  <line
                    key={index}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="#10b981"
                    strokeWidth={connection.type === 'strong' ? 3 : 2}
                    opacity={0.6}
                    className={styles.graphConnection}
                  />
                );
              })}

              {/* Nodes */}
              {graphData.nodes.map((node) => {
                const size = Math.max(20, (node.strength / 100) * 35);
                const color = node.type === 'center' ? '#8b5cf6' : '#10b981';

                return (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={size / 2}
                      fill={color}
                      stroke="white"
                      strokeWidth={2}
                      opacity={0.8}
                      className={styles.graphNode}
                    />
                    <text
                      x={node.x}
                      y={node.y + size / 2 + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#4a5568"
                      className={styles.nodeLabel}
                    >
                      {node.label}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + size / 2 + 35}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#718096"
                      className={styles.nodeStrength}
                    >
                      {node.strength}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className={styles.overallHealth}>
            <div className={styles.healthIcon}>
              <Brain size={20} />
            </div>
            <div>
              <h4>Общее здоровье отношений</h4>
              <div className={styles.healthScore}>
                <span className={styles.scoreNumber}>{graphData.overallHealth}</span>
                <span className={styles.scoreLabel}>/ 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;

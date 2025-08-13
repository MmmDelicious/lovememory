import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Trophy, Target, Clock, Users, Zap, Calendar, Heart, Star, Crown, Lock, ArrowRight, ChartBar as BarChart3, ChartPie as PieChart, Activity } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  delay: number;
  isPremium?: boolean;
  isBlurred?: boolean;
}

function StatCard({ icon, title, value, change, isPositive = true, delay, isPremium = false, isBlurred = false }: StatCardProps) {
  return (
    <Animated.View entering={BounceIn.delay(delay)} style={styles.statCard}>
      <LinearGradient
        colors={['#FFFFFF', '#FFF8F6']}
        style={styles.statCardGradient}
      >
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Crown size={10} color="#D97A6C" strokeWidth={2} />
          </View>
        )}
        
        <View style={styles.statHeader}>
          <View style={styles.statIcon}>
            {icon}
          </View>
          {change && !isBlurred && (
            <View style={[styles.changeIndicator, !isPositive && styles.negativeChange]}>
              <TrendingUp size={12} color={isPositive ? '#4CAF50' : '#D35D5D'} strokeWidth={2} />
              <Text style={[styles.changeText, !isPositive && styles.negativeChangeText]}>
                {change}
              </Text>
            </View>
          )}
        </View>
        
        <View style={isBlurred ? styles.blurredContent : null}>
          <Text style={[styles.statValue, isBlurred && styles.blurredText]}>
            {isBlurred ? '***' : value}
          </Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        
        {isBlurred && (
          <View style={styles.lockOverlay}>
            <Lock size={16} color="#8C7F7D" strokeWidth={2} />
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  isPremium?: boolean;
  isBlurred?: boolean;
}

function ChartCard({ title, children, isPremium = false, isBlurred = false }: ChartCardProps) {
  return (
    <View style={styles.chartCard}>
      <LinearGradient
        colors={['#FFFFFF', '#FFF8F6']}
        style={styles.chartGradient}
      >
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{title}</Text>
          {isPremium && (
            <View style={styles.premiumChartBadge}>
              <Crown size={12} color="#D97A6C" strokeWidth={2} />
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          )}
        </View>
        
        <View style={isBlurred ? styles.blurredChart : null}>
          {children}
        </View>
        
        {isBlurred && (
          <View style={styles.chartLockOverlay}>
            <Lock size={24} color="#8C7F7D" strokeWidth={2} />
            <Text style={styles.lockText}>Доступно в PRO</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

function UpgradeCard() {
  return (
    <Animated.View entering={BounceIn.delay(800)} style={styles.upgradeCard}>
      <LinearGradient
        colors={['#D97A6C', '#E89F93']}
        style={styles.upgradeGradient}
      >
        <View style={styles.upgradeHeader}>
          <Crown size={24} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.upgradeTitle}>Апгрейд до PRO</Text>
        </View>
        
        <Text style={styles.upgradeSubtitle}>
          Получи доступ к расширенной аналитике
        </Text>
        
        <View style={styles.upgradeFeatures}>
          <View style={styles.upgradeFeature}>
            <BarChart3 size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.upgradeFeatureText}>Детальные графики</Text>
          </View>
          <View style={styles.upgradeFeature}>
            <PieChart size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.upgradeFeatureText}>Анализ по играм</Text>
          </View>
          <View style={styles.upgradeFeature}>
            <Activity size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.upgradeFeatureText}>Поведенческие метрики</Text>
          </View>
          <View style={styles.upgradeFeature}>
            <Users size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.upgradeFeatureText}>Сравнение с игроками</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.upgradeButton}>
          <View style={styles.upgradeButtonContent}>
            <Text style={styles.upgradeButtonText}>Получить PRO</Text>
            <ArrowRight size={16} color="#D97A6C" strokeWidth={2} />
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

export default function InsightsScreen() {
  const [timeFrame] = useState('week');
  const [userTier] = useState('free'); // 'free' | 'pro'
  
  const isPro = userTier === 'pro';

  const freeStats = [
    {
      icon: <Trophy size={20} color="#D97A6C" strokeWidth={2} />,
      title: 'Общие победы',
      value: '24',
      change: '+12%',
      isPositive: true,
    },
    {
      icon: <Target size={20} color="#D97A6C" strokeWidth={2} />,
      title: 'Винрейт',
      value: '68%',
      change: '+5%',
      isPositive: true,
    },
    {
      icon: <Clock size={20} color="#D97A6C" strokeWidth={2} />,
      title: 'Время в игре',
      value: '12ч',
      change: '-2ч',
      isPositive: false,
    },
    {
      icon: <Zap size={20} color="#D97A6C" strokeWidth={2} />,
      title: 'Заработано',
      value: '2.1k',
      change: '+18%',
      isPositive: true,
    },
  ];

  const premiumStats = [
    {
      icon: <BarChart3 size={20} color="#D97A6C" strokeWidth={2} />,
      title: 'Средняя ставка',
      value: '125',
      change: '+8%',
      isPositive: true,
      isPremium: true,
      isBlurred: !isPro,
    },
    {
      icon: <PieChart size={20} color="#D97A6C" strokeWidth={2} />,
      title: 'ROI',
      value: '15.2%',
      change: '+3%',
      isPositive: true,
      isPremium: true,
      isBlurred: !isPro,
    },
    {
      icon: <Activity size={20} color="#D97A6C" strokeWidth={2} />,
      title: 'VPIP',
      value: '22%',
      isPremium: true,
      isBlurred: !isPro,
    },
    {
      icon: <Users size={20} color="#D97A6C" strokeWidth={2} />,
      title: 'Рейтинг',
      value: 'Топ 15%',
      change: '+2%',
      isPositive: true,
      isPremium: true,
      isBlurred: !isPro,
    },
  ];

  const gameStats = [
    { label: 'Покер', value: 15, maxValue: 20, color: '#D97A6C' },
    { label: 'Викторина', value: 8, maxValue: 20, color: '#E89F93' },
    { label: 'Шахматы', value: 12, maxValue: 20, color: '#C96A5C' },
    { label: 'Крестики-нолики', value: 6, maxValue: 20, color: '#F0B8AF' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F6" />
      
      {/* Header with Tier Badge */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Статистика</Text>
          <View style={[styles.tierBadge, isPro && styles.proBadge]}>
            {isPro ? (
              <Crown size={12} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <Star size={12} color="#8C7F7D" strokeWidth={2} />
            )}
            <Text style={[styles.tierText, isPro && styles.proTierText]}>
              {isPro ? 'PRO' : 'FREE'}
            </Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          {isPro ? 'Полная аналитика твоих игр' : 'Базовая статистика'}
        </Text>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Free Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Основные метрики</Text>
          <View style={styles.statsGrid}>
            {freeStats.map((stat, index) => (
              <StatCard
                key={stat.title}
                {...stat}
                delay={200 + index * 50}
              />
            ))}
          </View>
        </View>

        {/* Premium Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.premiumSectionHeader}>
            <Text style={styles.sectionTitle}>Продвинутые метрики</Text>
            {!isPro && (
              <View style={styles.premiumLabel}>
                <Crown size={12} color="#D97A6C" strokeWidth={2} />
                <Text style={styles.premiumLabelText}>PRO</Text>
              </View>
            )}
          </View>
          <View style={styles.statsGrid}>
            {premiumStats.map((stat, index) => (
              <StatCard
                key={stat.title}
                {...stat}
                delay={400 + index * 50}
              />
            ))}
          </View>
        </View>

        {/* Game Performance Chart */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.chartContainer}>
          <ChartCard title="Игры за неделю">
            <View style={styles.chartContent}>
              {gameStats.map((game, index) => (
                <View key={game.label} style={styles.chartBar}>
                  <Text style={styles.chartLabel}>{game.label}</Text>
                  <View style={styles.barContainer}>
                    <View style={styles.barBackground}>
                      <Animated.View 
                        style={[
                          styles.barFill, 
                          { backgroundColor: game.color, width: `${(game.value / game.maxValue) * 100}%` }
                        ]}
                        entering={FadeInUp.delay(700 + index * 100)}
                      />
                    </View>
                    <Text style={styles.barValue}>{game.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ChartCard>
        </Animated.View>

        {/* Premium Charts */}
        <Animated.View entering={FadeInUp.delay(700)} style={styles.chartContainer}>
          <ChartCard title="Динамика баланса" isPremium={true} isBlurred={!isPro}>
            <View style={styles.chartPlaceholder}>
              <BarChart3 size={32} color="#B8A8A4" strokeWidth={1.5} />
              <Text style={styles.chartPlaceholderText}>График баланса по дням</Text>
            </View>
          </ChartCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(750)} style={styles.chartContainer}>
          <ChartCard title="Heatmap активности" isPremium={true} isBlurred={!isPro}>
            <View style={styles.heatmapContainer}>
              <View style={styles.heatmapGrid}>
                {Array.from({ length: 35 }, (_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.heatmapCell,
                      { backgroundColor: Math.random() > 0.7 ? '#D97A6C' : '#F2E9E8' }
                    ]} 
                  />
                ))}
              </View>
              <Text style={styles.heatmapLabel}>Последние 5 недель</Text>
            </View>
          </ChartCard>
        </Animated.View>

        {/* Game-specific Analysis */}
        <Animated.View entering={FadeInUp.delay(800)} style={styles.gameAnalysisContainer}>
          <View style={styles.premiumSectionHeader}>
            <Text style={styles.sectionTitle}>Анализ по играм</Text>
            {!isPro && (
              <View style={styles.premiumLabel}>
                <Crown size={12} color="#D97A6C" strokeWidth={2} />
                <Text style={styles.premiumLabelText}>PRO</Text>
              </View>
            )}
          </View>
          
          {/* Poker Analysis */}
          <View style={styles.gameAnalysisCard}>
            <LinearGradient
              colors={['#FFFFFF', '#FFF8F6']}
              style={styles.gameAnalysisGradient}
            >
              <View style={styles.gameAnalysisHeader}>
                <Target size={20} color="#D97A6C" strokeWidth={2} />
                <Text style={styles.gameAnalysisTitle}>Покер</Text>
              </View>
              
              <View style={[styles.gameAnalysisContent, !isPro && styles.blurredContent]}>
                <View style={styles.gameMetricsRow}>
                  <View style={styles.gameMetric}>
                    <Text style={styles.gameMetricValue}>{isPro ? '156' : '***'}</Text>
                    <Text style={styles.gameMetricLabel}>Рук сыграно</Text>
                  </View>
                  <View style={styles.gameMetric}>
                    <Text style={styles.gameMetricValue}>{isPro ? '1,250' : '***'}</Text>
                    <Text style={styles.gameMetricLabel}>Средний стек</Text>
                  </View>
                </View>
                
                <View style={styles.gameMetricsRow}>
                  <View style={styles.gameMetric}>
                    <Text style={styles.gameMetricValue}>{isPro ? '22%' : '***'}</Text>
                    <Text style={styles.gameMetricLabel}>VPIP</Text>
                  </View>
                  <View style={styles.gameMetric}>
                    <Text style={styles.gameMetricValue}>{isPro ? '18%' : '***'}</Text>
                    <Text style={styles.gameMetricLabel}>PFR</Text>
                  </View>
                </View>
              </View>
              
              {!isPro && (
                <View style={styles.gameAnalysisLock}>
                  <Lock size={16} color="#8C7F7D" strokeWidth={2} />
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Chess Analysis */}
          <View style={styles.gameAnalysisCard}>
            <LinearGradient
              colors={['#FFFFFF', '#FFF8F6']}
              style={styles.gameAnalysisGradient}
            >
              <View style={styles.gameAnalysisHeader}>
                <Crown size={20} color="#D97A6C" strokeWidth={2} />
                <Text style={styles.gameAnalysisTitle}>Шахматы</Text>
              </View>
              
              <View style={[styles.gameAnalysisContent, !isPro && styles.blurredContent]}>
                <View style={styles.gameMetricsRow}>
                  <View style={styles.gameMetric}>
                    <Text style={styles.gameMetricValue}>{isPro ? '1,420' : '***'}</Text>
                    <Text style={styles.gameMetricLabel}>Рейтинг</Text>
                  </View>
                  <View style={styles.gameMetric}>
                    <Text style={styles.gameMetricValue}>{isPro ? '25 мин' : '***'}</Text>
                    <Text style={styles.gameMetricLabel}>Средняя партия</Text>
                  </View>
                </View>
              </View>
              
              {!isPro && (
                <View style={styles.gameAnalysisLock}>
                  <Lock size={16} color="#8C7F7D" strokeWidth={2} />
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Quiz Analysis */}
          <View style={styles.gameAnalysisCard}>
            <LinearGradient
              colors={['#FFFFFF', '#FFF8F6']}
              style={styles.gameAnalysisGradient}
            >
              <View style={styles.gameAnalysisHeader}>
                <Star size={20} color="#D97A6C" strokeWidth={2} />
                <Text style={styles.gameAnalysisTitle}>Викторина</Text>
              </View>
              
              <View style={[styles.gameAnalysisContent, !isPro && styles.blurredContent]}>
                <View style={styles.gameMetricsRow}>
                  <View style={styles.gameMetric}>
                    <Text style={styles.gameMetricValue}>{isPro ? '87%' : '***'}</Text>
                    <Text style={styles.gameMetricLabel}>Точность</Text>
                  </View>
                  <View style={styles.gameMetric}>
                    <Text style={styles.gameMetricValue}>{isPro ? '8.2с' : '***'}</Text>
                    <Text style={styles.gameMetricLabel}>Среднее время</Text>
                  </View>
                </View>
              </View>
              
              {!isPro && (
                <View style={styles.gameAnalysisLock}>
                  <Lock size={16} color="#8C7F7D" strokeWidth={2} />
                </View>
              )}
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Upgrade Card for Free Users */}
        {!isPro && <UpgradeCard />}

        {/* Weekly Summary */}
        <Animated.View entering={FadeInUp.delay(900)} style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Итоги недели</Text>
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={['#D97A6C', '#E89F93']}
              style={styles.summaryGradient}
            >
              <Calendar size={32} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.summaryTitle}>
                {isPro ? 'Отличная неделя!' : 'Хорошая неделя!'}
              </Text>
              <Text style={styles.summaryText}>
                {isPro 
                  ? 'Ты провел в играх 12 часов, выиграл 24 партии и заработал 2,100 монет. ROI составил 15.2%. Продолжай в том же духе!'
                  : 'Ты провел в играх 12 часов, выиграл 24 партии и заработал 2,100 монет. Получи PRO для детального анализа!'
                }
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'System',
    fontWeight: '800',
    color: '#4A3F3D',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'System',
    color: '#8C7F7D',
    fontWeight: '400',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2E9E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proBadge: {
    backgroundColor: '#D97A6C',
  },
  tierText: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#8C7F7D',
    marginLeft: 4,
  },
  proTierText: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#4A3F3D',
    marginBottom: 16,
  },
  premiumSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EADFD8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumLabelText: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#D97A6C',
    marginLeft: 4,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (screenWidth - 60) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  statCardGradient: {
    padding: 16,
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EADFD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EADFD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  negativeChange: {
    backgroundColor: '#FFEBEE',
  },
  changeText: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 2,
  },
  negativeChangeText: {
    color: '#D35D5D',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'System',
    fontWeight: '800',
    color: '#4A3F3D',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#8C7F7D',
  },
  blurredContent: {
    opacity: 0.3,
  },
  blurredText: {
    color: '#B8A8A4',
  },
  lockOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -8 }, { translateY: -8 }],
  },
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chartCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  chartGradient: {
    padding: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#4A3F3D',
  },
  premiumChartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EADFD8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumText: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#D97A6C',
    marginLeft: 4,
  },
  chartContent: {},
  chartBar: {
    marginBottom: 16,
  },
  chartLabel: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#4A3F3D',
    marginBottom: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#F2E9E8',
    borderRadius: 4,
    marginRight: 12,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#8C7F7D',
    width: 24,
    textAlign: 'right',
  },
  blurredChart: {
    opacity: 0.3,
  },
  chartLockOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -20 }],
    alignItems: 'center',
  },
  lockText: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#8C7F7D',
    marginTop: 4,
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  chartPlaceholderText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#B8A8A4',
    marginTop: 8,
  },
  heatmapContainer: {
    alignItems: 'center',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 245,
    marginBottom: 8,
  },
  heatmapCell: {
    width: 6,
    height: 6,
    borderRadius: 1,
    margin: 1,
  },
  heatmapLabel: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#8C7F7D',
  },
  gameAnalysisContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  gameAnalysisCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  gameAnalysisGradient: {
    padding: 16,
  },
  gameAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameAnalysisTitle: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#4A3F3D',
    marginLeft: 8,
  },
  gameAnalysisContent: {},
  gameMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gameMetric: {
    flex: 1,
    alignItems: 'center',
  },
  gameMetricValue: {
    fontSize: 18,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#4A3F3D',
    marginBottom: 2,
  },
  gameMetricLabel: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#8C7F7D',
  },
  gameAnalysisLock: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -8 }, { translateY: -8 }],
  },
  upgradeCard: {
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  upgradeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  upgradeTitle: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  upgradeSubtitle: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  upgradeFeatures: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  upgradeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  upgradeFeatureText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  upgradeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  upgradeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#D97A6C',
    marginRight: 8,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  summaryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryGradient: {
    padding: 24,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
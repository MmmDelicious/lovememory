import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Coins, Calendar, Users, TrendingUp, Heart, Sparkles } from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  BounceIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import { router } from 'expo-router';
import { getProfileStats } from '../services/user.service';

const { width: screenWidth } = Dimensions.get('window');

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  delay: number;
}

function StatCard({ icon, title, value, subtitle, delay }: StatCardProps) {
  return (
    <Animated.View entering={FadeInUp.delay(delay)} style={styles.statCard}>
      <LinearGradient
        colors={['#FFFFFF', '#FFF8F6']}
        style={styles.statCardGradient}
      >
        <View style={styles.statIconContainer}>
          {icon}
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </LinearGradient>
    </Animated.View>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  delay: number;
}

function QuickAction({ icon, title, onPress, delay }: QuickActionProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    scale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    
    runOnJS(onPress)();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={BounceIn.delay(delay)} style={animatedStyle}>
      <TouchableOpacity style={styles.quickAction} onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={['#D97A6C', '#E89F93']}
          style={styles.quickActionGradient}
        >
          <View style={styles.quickActionIcon}>
            {icon}
          </View>
          <Text style={styles.quickActionTitle}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const { user, setUser } = useAuth();
  const [coins, setCoins] = useState<number>(user?.coins ?? 0);
  const userName = user?.first_name || (user?.email ? user.email.split('@')[0] : 'Гость');
  const [stats, setStats] = useState<{ gamesPlayed: number; wins: number; winRate: number }>(
    { gamesPlayed: 0, wins: 0, winRate: 0 }
  );

  useEffect(() => {
    setCoins(user?.coins ?? 0);
  }, [user?.coins]);

  useEffect(() => {
    (async () => {
      try {
        const socket = await getSocket();
        const handler = (newCoins: number) => {
          setCoins(newCoins);
          if (user) setUser({ ...user, coins: newCoins });
        };
        socket.on('update_coins', handler);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfileStats();
        setStats({
          gamesPlayed: res.data?.gamesPlayed ?? 0,
          wins: res.data?.wins ?? 0,
          winRate: Math.round((res.data?.winRate ?? 0) * 100),
        });
      } catch {}
    })();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F6" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with greeting */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Привет, {userName}! 👋</Text>
            <Text style={styles.subGreeting}>Готов к новым играм?</Text>
          </View>
          
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={['#D97A6C', '#C96A5C']}
              style={styles.balanceGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            >
              <View style={styles.balanceContent}>
                <Coins size={24} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.balanceText}>Баланс</Text>
              </View>
              <Text style={styles.balanceAmount}>{coins.toLocaleString()}</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Твоя статистика</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={<Trophy size={20} color="#D97A6C" strokeWidth={2} />}
              title="Побед"
              value={String(stats.wins)}
              subtitle="за все время"
              delay={200}
            />
            <StatCard
              icon={<Users size={20} color="#D97A6C" strokeWidth={2} />}
              title="Игр"
              value={String(stats.gamesPlayed)}
              subtitle="всего"
              delay={250}
            />
            <StatCard
              icon={<TrendingUp size={20} color="#D97A6C" strokeWidth={2} />}
              title="Рейтинг"
              value={`${stats.winRate}%`}
              subtitle="винрейт"
              delay={300}
            />
            <StatCard
              icon={<Heart size={20} color="#D97A6C" strokeWidth={2} />}
              title="Любовь"
              value="💖"
              subtitle="уровень"
              delay={350}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Быстрые действия</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              icon={<GameController2 size={24} color="#FFFFFF" strokeWidth={2} />}
              title="Играть"
              onPress={() => router.push('/(tabs)/games')}
              delay={400}
            />
            <QuickAction
              icon={<Calendar size={24} color="#FFFFFF" strokeWidth={2} />}
              title="События"
              onPress={() => router.push('/(tabs)/planner')}
              delay={450}
            />
            <QuickAction
              icon={<Sparkles size={24} color="#FFFFFF" strokeWidth={2} />}
              title="AI Чат"
              onPress={() => console.log('Open AI chat')}
              delay={500}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Недавняя активность</Text>
          <View style={styles.activityCard}>
            <LinearGradient
              colors={['#FFFFFF', '#FFF8F6']}
              style={styles.activityGradient}
            >
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Trophy size={16} color="#D97A6C" strokeWidth={2} />
                </View>
                <View style={styles.activityText}>
                  <Text style={styles.activityTitle}>Победа в покере</Text>
                  <Text style={styles.activityTime}>2 часа назад</Text>
                </View>
                <Text style={styles.activityReward}>+150 🪙</Text>
              </View>
              
              <View style={styles.activityDivider} />
              
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Heart size={16} color="#D97A6C" strokeWidth={2} />
                </View>
                <View style={styles.activityText}>
                  <Text style={styles.activityTitle}>Новое воспоминание</Text>
                  <Text style={styles.activityTime}>Вчера</Text>
                </View>
                <Text style={styles.activityReward}>💖</Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const Trophy = ({ size, color, strokeWidth }: { size: number; color: string; strokeWidth: number }) => (
  <TrendingUp size={size} color={color} strokeWidth={strokeWidth} />
);

const GameController2 = ({ size, color, strokeWidth }: { size: number; color: string; strokeWidth: number }) => (
  <Users size={size} color={color} strokeWidth={strokeWidth} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F6',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#4A3F3D',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    fontFamily: 'System',
    color: '#8C7F7D',
    fontWeight: '400',
  },
  balanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceGradient: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontFamily: 'System',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#4A3F3D',
    marginBottom: 16,
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
  },
  statCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EADFD8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'System',
    fontWeight: '800',
    color: '#4A3F3D',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#8C7F7D',
  },
  statSubtitle: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#B8A8A4',
    marginTop: 2,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: (screenWidth - 80) / 3,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  quickActionGradient: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  activityContainer: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  activityCard: {
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
  },
  activityGradient: {
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EADFD8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#4A3F3D',
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#8C7F7D',
    marginTop: 2,
  },
  activityReward: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#D97A6C',
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#F2E9E8',
    marginVertical: 16,
  },
});
import React, { useState } from 'react';
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
import { 
  Zap, 
  Target, 
  Users, 
  Crown, 
  Play, 
  Clock,
  TrendingUp,
  Gamepad2,
  Sparkles
} from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  BounceIn, 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  players: number;
  minBet: number;
  maxBet: number;
  onPress: () => void;
  delay: number;
  isPopular?: boolean;
  isAvailable?: boolean;
}

function GameCard({ 
  title, 
  description, 
  icon, 
  players, 
  minBet, 
  maxBet, 
  onPress, 
  delay, 
  isPopular,
  isAvailable = true
}: GameCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePress = () => {
    if (!isAvailable) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return;
    }
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    scale.value = withSequence(
      withTiming(0.95, { duration: 150 }),
      withSpring(1, { damping: 15 })
    );
    
    runOnJS(onPress)();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View entering={BounceIn.delay(delay)} style={[styles.gameCard, animatedStyle]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <LinearGradient
          colors={isPopular ? ['#D97A6C', '#E89F93'] : isAvailable ? ['#FFFFFF', '#FFF8F6'] : ['#F2E9E8', '#EADFD8']}
          style={styles.gameCardGradient}
        >
          {isPopular && (
            <View style={styles.popularBadge}>
              <Crown size={12} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.popularText}>Популярное</Text>
            </View>
          )}
          
          {!isAvailable && (
            <View style={styles.comingSoonBadge}>
              <Sparkles size={12} color="#8C7F7D" strokeWidth={2} />
              <Text style={styles.comingSoonText}>Скоро</Text>
            </View>
          )}
          
          <View style={styles.gameCardHeader}>
            <View style={[
              styles.gameIcon, 
              { backgroundColor: isPopular ? 'rgba(255,255,255,0.2)' : isAvailable ? '#EADFD8' : '#C9BFBD' }
            ]}>
              {icon}
            </View>
            <View style={styles.gameInfo}>
              <Text style={[
                styles.gameTitle,
                { color: isPopular ? '#FFFFFF' : isAvailable ? '#4A3F3D' : '#8C7F7D' }
              ]}>
                {title}
              </Text>
              <Text style={[
                styles.gameDescription,
                { color: isPopular ? 'rgba(255,255,255,0.8)' : isAvailable ? '#8C7F7D' : '#B8A8A4' }
              ]}>
                {description}
              </Text>
            </View>
          </View>
          
          <View style={styles.gameStats}>
            <View style={styles.gameStat}>
              <Users 
                size={14} 
                color={isPopular ? '#FFFFFF' : isAvailable ? '#8C7F7D' : '#B8A8A4'} 
                strokeWidth={2} 
              />
              <Text style={[
                styles.gameStatText,
                { color: isPopular ? 'rgba(255,255,255,0.9)' : isAvailable ? '#8C7F7D' : '#B8A8A4' }
              ]}>
                {players} игроков
              </Text>
            </View>
            <View style={styles.gameStat}>
              <Zap 
                size={14} 
                color={isPopular ? '#FFFFFF' : isAvailable ? '#8C7F7D' : '#B8A8A4'} 
                strokeWidth={2} 
              />
              <Text style={[
                styles.gameStatText,
                { color: isPopular ? 'rgba(255,255,255,0.9)' : isAvailable ? '#8C7F7D' : '#B8A8A4' }
              ]}>
                {minBet}-{maxBet} 🪙
              </Text>
            </View>
          </View>
          
          <View style={[
            styles.playButton,
            { backgroundColor: isPopular ? 'rgba(255,255,255,0.2)' : isAvailable ? '#D97A6C' : '#B8A8A4' }
          ]}>
            <Play 
              size={16}
              strokeWidth={2} 
            />
            <Text style={styles.playButtonText}>
              {isAvailable ? 'Играть' : 'Скоро'}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface RoomCardProps {
  id: string;
  gameType: string;
  bet: number;
  players: number;
  maxPlayers: number;
  onJoin: () => void;
}

function RoomCard({ id, gameType, bet, players, maxPlayers, onJoin }: RoomCardProps) {
  const isFull = players >= maxPlayers;
  
  return (
    <View style={styles.roomCard}>
      <LinearGradient
        colors={['#FFFFFF', '#FFF8F6']}
        style={styles.roomCardGradient}
      >
        <View style={styles.roomHeader}>
          <Text style={styles.roomTitle}>{gameType}</Text>
          <Text style={styles.roomId}>#{id}</Text>
        </View>
        
        <View style={styles.roomStats}>
          <View style={styles.roomStat}>
            <Users size={14} color="#8C7F7D" strokeWidth={2} />
            <Text style={styles.roomStatText}>{players}/{maxPlayers}</Text>
          </View>
          <View style={styles.roomStat}>
            <Zap size={14} color="#8C7F7D" strokeWidth={2} />
            <Text style={styles.roomStatText}>{bet} 🪙</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.joinButton, isFull && styles.joinButtonDisabled]}
          onPress={onJoin}
          disabled={isFull}
        >
          <Text style={[styles.joinButtonText, isFull && styles.joinButtonTextDisabled]}>
            {isFull ? 'Полная' : 'Войти'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

export default function GamesScreen() {
  const [activeTab, setActiveTab] = useState('games');

  const games = [
    {
      title: 'Покер',
      description: 'Классический Texas Hold\'em',
      icon: <Target size={24} color="#FFFFFF" strokeWidth={2} />,
      players: 8,
      minBet: 50,
      maxBet: 500,
      isPopular: true,
      route: null,
      isAvailable: false,
    },
    {
      title: 'Викторина',
      description: 'Проверь свои знания',
      icon: <TrendingUp size={24} color="#D97A6C" strokeWidth={2} />,
      players: 12,
      minBet: 20,
      maxBet: 200,
      route: '/(games)/quiz',
      isAvailable: true,
    },
    {
      title: 'Шахматы',
      description: 'Интеллектуальная битва',
      icon: <Crown size={24} color="#D97A6C" strokeWidth={2} />,
      players: 4,
      minBet: 30,
      maxBet: 300,
      route: '/(games)/chess',
      isAvailable: true,
    },
    {
      title: 'Крестики-нолики',
      description: 'Быстрая игра',
      icon: <Gamepad2 size={24} color="#D97A6C" strokeWidth={2} />,
      players: 6,
      minBet: 10,
      maxBet: 100,
      route: null, // Пока не реализовано
      isAvailable: false,
    },
  ];

  const rooms = [
    { id: 'A1B2', gameType: 'Покер', bet: 100, players: 1, maxPlayers: 2 },
    { id: 'C3D4', gameType: 'Викторина', bet: 50, players: 2, maxPlayers: 4 },
    { id: 'E5F6', gameType: 'Шахматы', bet: 75, players: 2, maxPlayers: 2 },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F6" />
      
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <Text style={styles.headerTitle}>Игры</Text>
        <Text style={styles.headerSubtitle}>Выбери свое приключение</Text>
      </Animated.View>

      {/* Tab Navigation */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'games' && styles.activeTab]}
          onPress={() => setActiveTab('games')}
        >
          <Text style={[styles.tabText, activeTab === 'games' && styles.activeTabText]}>
            Все игры
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rooms' && styles.activeTab]}
          onPress={() => setActiveTab('rooms')}
        >
          <Text style={[styles.tabText, activeTab === 'rooms' && styles.activeTabText]}>
            Активные комнаты
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'games' ? (
          <View style={styles.gamesGrid}>
            {games.map((game, index) => (
              <GameCard
                key={game.title}
                {...game}
                onPress={() => {
                  if (game.route && game.isAvailable) {
                    router.push(game.route as any);
                  }
                }}
                delay={300 + index * 100}
                isAvailable={game.isAvailable}
              />
            ))}
          </View>
        ) : (
          <Animated.View entering={FadeInUp.delay(300)} style={styles.roomsList}>
            <Text style={styles.roomsTitle}>Доступные комнаты</Text>
            {rooms.map((room, index) => (
              <RoomCard
                key={room.id}
                {...room}
                onJoin={() => console.log(`Join room ${room.id}`)}
              />
            ))}
            
            <View style={styles.createRoomContainer}>
              <TouchableOpacity style={styles.createRoomButton}>
                <LinearGradient
                  colors={['#D97A6C', '#E89F93']}
                  style={styles.createRoomGradient}
                >
                  <Text style={styles.createRoomText}>+ Создать комнату</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
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
  headerTitle: {
    fontSize: 32,
    fontFamily: 'System',
    fontWeight: '800',
    color: '#4A3F3D',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'System',
    color: '#8C7F7D',
    fontWeight: '400',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#D97A6C',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#8C7F7D',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  gamesGrid: {
    paddingHorizontal: 20,
  },
  gameCard: {
    marginBottom: 16,
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
  gameCardGradient: {
    padding: 20,
    position: 'relative',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(140, 127, 125, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#8C7F7D',
    marginLeft: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '700',
    marginBottom: 2,
  },
  gameDescription: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '400',
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gameStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameStatText: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
    marginLeft: 6,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  playButtonText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  roomsList: {
    paddingHorizontal: 20,
  },
  roomsTitle: {
    fontSize: 18,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#4A3F3D',
    marginBottom: 16,
  },
  roomCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  roomCardGradient: {
    padding: 16,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomTitle: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#4A3F3D',
  },
  roomId: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#8C7F7D',
  },
  roomStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  roomStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  roomStatText: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#8C7F7D',
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: '#D97A6C',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  joinButtonDisabled: {
    backgroundColor: '#F2E9E8',
  },
  joinButtonText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  joinButtonTextDisabled: {
    color: '#B8A8A4',
  },
  createRoomContainer: {
    marginTop: 20,
  },
  createRoomButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  createRoomGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  createRoomText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
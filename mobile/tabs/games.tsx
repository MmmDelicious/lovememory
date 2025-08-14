import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Modal,
  TextInput,
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
import { getRooms, createRoom, type Room } from '../services/game.service';
import { getSocket } from '../services/socket';
import type { Socket } from 'socket.io-client';
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

type GameType = 'poker' | 'quiz' | 'chess' | 'wordle';

export default function GamesScreen() {
  const [activeTab, setActiveTab] = useState('games');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [gameType, setGameType] = useState<GameType>('poker');
  const [showCreate, setShowCreate] = useState(false);
  const [bet, setBet] = useState('50');
  const [tableType, setTableType] = useState<'standard' | 'premium' | 'elite'>('standard');
  const socketRef = useRef<Socket | null>(null);

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const data = await getRooms({ gameType });
      setRooms(data);
    } catch (e) {
      console.log('Failed to load rooms', e);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadRooms();
    (async () => {
      try {
        const socket = await getSocket();
        if (!isMounted) return;
        socketRef.current = socket;
        const handler = () => loadRooms();
        socket.on('room_list_updated', handler);
        // store handler for cleanup on dependency change/unmount
        (socketRef as any).currentHandler = handler;
      } catch {}
    })();
    return () => {
      isMounted = false;
      const socket = socketRef.current;
      const handler = (socketRef as any).currentHandler;
      if (socket && handler) {
        try { socket.off('room_list_updated', handler); } catch {}
      }
      (socketRef as any).currentHandler = null;
    };
  }, [gameType]);

  const games = [
    {
      title: 'Покер',
      description: 'Классический Texas Hold\'em',
      icon: <Target size={24} color="#FFFFFF" strokeWidth={2} />,
      players: 8,
      minBet: 50,
      maxBet: 500,
      isPopular: true,
      route: '/(tabs)/games',
      isAvailable: true,
    },
    {
      title: 'Викторина',
      description: 'Проверь свои знания',
      icon: <TrendingUp size={24} color="#D97A6C" strokeWidth={2} />,
      players: 12,
      minBet: 20,
      maxBet: 200,
      route: null,
      isAvailable: true,
    },
    {
      title: 'Шахматы',
      description: 'Интеллектуальная битва',
      icon: <Crown size={24} color="#D97A6C" strokeWidth={2} />,
      players: 4,
      minBet: 30,
      maxBet: 300,
      route: null,
      isAvailable: true,
    },
    {
      title: 'Wordle',
      description: 'Словарная дуэль на время',
      icon: <Crown size={24} color="#D97A6C" strokeWidth={2} />,
      players: 8,
      minBet: 10,
      maxBet: 100,
      route: null,
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

  const handleCreateRoom = async () => {
    try {
      const payload: any = { gameType, bet: Number(bet) || 50, maxPlayers: gameType === 'poker' ? 8 : 2 };
      if (gameType === 'poker') payload.tableType = tableType;
      const room = await createRoom(payload);
      await loadRooms();
      setShowCreate(false);
      // сразу в созданную комнату
      if (room?.id) {
        router.push({ pathname: '/(games)/room/[id]', params: { id: String(room.id) } } as any);
      }
    } catch (e) {
      console.log('Failed to create room', e);
    }
  };

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

      {/* Game type filter */}
      <Animated.View entering={FadeInDown.delay(220)} style={[styles.tabContainer, { marginTop: -8 }] }>
        {(['poker','quiz','chess','wordle'] as GameType[]).map((gt) => (
          <TouchableOpacity key={gt} style={[styles.tab, gameType === gt && styles.activeTab]} onPress={() => setGameType(gt)}>
            <Text style={[styles.tabText, gameType === gt && styles.activeTabText]}>
              {gt === 'poker' ? 'Покер' : gt === 'quiz' ? 'Викторина' : gt === 'chess' ? 'Шахматы' : 'Wordle'}
            </Text>
          </TouchableOpacity>
        ))}
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
                  if (!game.isAvailable) return;
                  // Для всех доступных игр используем список комнат
                  if (game.title === 'Покер') setGameType('poker');
                  if (game.title === 'Викторина') setGameType('quiz');
                  if (game.title === 'Шахматы') setGameType('chess');
                  setActiveTab('rooms');
                }}
                delay={300 + index * 100}
                isAvailable={game.isAvailable}
              />
            ))}
          </View>
        ) : (
           <Animated.View entering={FadeInUp.delay(300)} style={styles.roomsList}>
            <Text style={styles.roomsTitle}>Доступные комнаты</Text>
            {loadingRooms ? (
              <Text style={{ color: '#8C7F7D' }}>Загрузка...</Text>
            ) : rooms.length === 0 ? (
              <Text style={{ color: '#8C7F7D' }}>Комнаты отсутствуют</Text>
            ) : (
              rooms.map((room) => (
                <RoomCard
                  key={String(room.id)}
                  id={String(room.id)}
                  gameType={room.gameType}
                  bet={room.bet}
                  players={(room as any).playerCount ?? (Array.isArray((room as any).players) ? (room as any).players.length : (room as any).players || 0)}
                  maxPlayers={room.maxPlayers}
                  onJoin={() => router.push({ pathname: '/(games)/room/[id]', params: { id: String(room.id) } } as any)}
                />
              ))
            )}
            {/* Quick create buttons for faster testing */}
            <View style={[styles.row, { marginTop: 12 }]}> 
              <TouchableOpacity style={[styles.segmentBtn, styles.segmentBtnActive]} onPress={() => { setGameType('poker'); setBet('50'); setTableType('standard'); setShowCreate(true); }}>
                <Text style={[styles.segmentText, styles.segmentTextActive]}>Быстро: Покер 50</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.segmentBtn, styles.segmentBtnActive, { marginLeft: 8 }]} onPress={() => { setGameType('quiz'); setShowCreate(true); }}>
                <Text style={[styles.segmentText, styles.segmentTextActive]}>Быстро: Викторина</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.createRoomContainer}>
              <TouchableOpacity style={styles.createRoomButton} onPress={() => setShowCreate(true)}>
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

      {/* Create Room Modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient colors={['#FFFFFF', '#FFF8F6']} style={{ padding: 16, borderRadius: 16 }}>
              <Text style={styles.roomsTitle}>Новая комната</Text>
              <Text style={styles.modalLabel}>Игра</Text>
              <View style={styles.row}>
                {(['poker','quiz','chess','wordle'] as GameType[]).map((gt) => (
                  <TouchableOpacity key={gt} style={[styles.segmentBtn, gameType === gt && styles.segmentBtnActive]} onPress={() => setGameType(gt)}>
                    <Text style={[styles.segmentText, gameType === gt && styles.segmentTextActive]}>
                          {gt === 'poker' ? 'Покер' : gt === 'quiz' ? 'Викторина' : gt === 'chess' ? 'Шахматы' : 'Wordle'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {gameType === 'poker' && (
                <>
                  <Text style={styles.modalLabel}>Ставка</Text>
                  <TextInput style={styles.input} keyboardType="number-pad" value={bet} onChangeText={setBet} placeholder="50" placeholderTextColor="#B8A8A4" />
                  <Text style={styles.modalLabel}>Стол</Text>
                  <View style={styles.row}>
                    {(['standard','premium','elite'] as const).map(tt => (
                      <TouchableOpacity key={tt} style={[styles.segmentBtn, tableType === tt && styles.segmentBtnActive]} onPress={() => setTableType(tt)}>
                        <Text style={[styles.segmentText, tableType === tt && styles.segmentTextActive]}>
                          {tt === 'standard' ? '5/10' : tt === 'premium' ? '25/50' : '100/200'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              <View style={[styles.row, { justifyContent: 'flex-end', marginTop: 12 }]}>
                <TouchableOpacity style={[styles.segmentBtn]} onPress={() => setShowCreate(false)}>
                  <Text style={styles.segmentText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.segmentBtn, styles.segmentBtnActive, { marginLeft: 8 }]} onPress={handleCreateRoom}>
                  <Text style={[styles.segmentText, styles.segmentTextActive]}>Создать</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 16, overflow: 'hidden' },
  input: { backgroundColor: '#FFF8F6', borderWidth: 1, borderColor: '#F2E9E8', borderRadius: 12, paddingHorizontal: 12, height: 44, color: '#4A3F3D' },
  modalLabel: { fontSize: 12, color: '#4A3F3D', fontWeight: '600', marginTop: 8, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  segmentBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#F2E9E8', backgroundColor: '#FFFFFF' },
  segmentBtnActive: { borderColor: '#D97A6C', backgroundColor: '#EADFD8' },
  segmentText: { color: '#8C7F7D', fontWeight: '600' },
  segmentTextActive: { color: '#D97A6C' },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Trophy, Coins, Calendar, Heart, LogOut, CreditCard as Edit, Camera, Star, TowerControl as GameController2, Award } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

interface ProfileStatProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  delay: number;
}

function ProfileStat({ icon, title, value, subtitle, delay }: ProfileStatProps) {
  return (
    <Animated.View entering={BounceIn.delay(delay)} style={styles.statCard}>
      <LinearGradient
        colors={['#FFFFFF', '#FFF8F6']}
        style={styles.statGradient}
      >
        <View style={styles.statIcon}>
          {icon}
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </LinearGradient>
    </Animated.View>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
}

function MenuItem({ icon, title, subtitle, onPress, showArrow = true }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        {icon}
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && (
        <Text style={styles.menuArrow}>›</Text>
      )}
    </TouchableOpacity>
  );
}

interface BadgeProps {
  icon: React.ReactNode;
  title: string;
  isEarned: boolean;
}

function Badge({ icon, title, isEarned }: BadgeProps) {
  return (
    <View style={styles.badge}>
      <LinearGradient
        colors={isEarned ? ['#D97A6C', '#E89F93'] : ['#F2E9E8', '#EADFD8']}
        style={styles.badgeGradient}
      >
        <View style={[
          styles.badgeIcon,
          { opacity: isEarned ? 1 : 0.5 }
        ]}>
          {icon}
        </View>
      </LinearGradient>
      <Text style={[
        styles.badgeTitle,
        { color: isEarned ? '#4A3F3D' : '#B8A8A4' }
      ]}>
        {title}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const [user] = useState({
    name: 'Алексей Петров',
    email: 'alexey@example.com',
    joinDate: '15 января 2024',
    avatar: null,
    level: 12,
    coins: 2450,
    gamesPlayed: 156,
    winRate: 68,
  });

  const stats = [
    {
      icon: <GameController2 size={20} color="#D97A6C" strokeWidth={2} />,
      title: 'Игр сыграно',
      value: '156',
      subtitle: 'за все время',
    },
    {
      icon: <Trophy size={20} color="#D97A6C" strokeWidth={2} />,
      title: 'Побед',
      value: '106',
      subtitle: '68% винрейт',
    },
    {
      icon: <Star size={20} color="#D97A6C" strokeWidth={2} />,
      title: 'Уровень',
      value: '12',
      subtitle: '1,250 опыта',
    },
    {
      icon: <Coins size={20} color="#D97A6C" strokeWidth={2} />,
      title: 'Монет',
      value: '2,450',
      subtitle: 'текущий баланс',
    },
  ];

  const badges = [
    {
      icon: <Trophy size={16} color="#FFFFFF" strokeWidth={2} />,
      title: 'Чемпион',
      isEarned: true,
    },
    {
      icon: <Heart size={16} color="#FFFFFF" strokeWidth={2} />,
      title: 'Романтик',
      isEarned: true,
    },
    {
      icon: <Star size={16} color="#FFFFFF" strokeWidth={2} />,
      title: 'Звезда',
      isEarned: false,
    },
    {
      icon: <Award size={16} color="#FFFFFF" strokeWidth={2} />,
      title: 'Легенда',
      isEarned: false,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F6" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.profileHeader}>
          <LinearGradient
            colors={['#D97A6C', '#E89F93']}
            style={styles.profileGradient}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <User size={40} color="#FFFFFF" strokeWidth={2} />
                )}
              </View>
              <TouchableOpacity style={styles.cameraButton}>
                <Camera size={16} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.joinDate}>Участник с {user.joinDate}</Text>
            
            <TouchableOpacity style={styles.editButton}>
              <Edit size={16} color="#D97A6C" strokeWidth={2} />
              <Text style={styles.editButtonText}>Редактировать профиль</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Статистика</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <ProfileStat
                key={stat.title}
                {...stat}
                delay={200 + index * 50}
              />
            ))}
          </View>
        </View>

        {/* Badges */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.badgesContainer}>
          <Text style={styles.sectionTitle}>Достижения</Text>
          <View style={styles.badgesGrid}>
            {badges.map((badge, index) => (
              <Badge
                key={badge.title}
                {...badge}
              />
            ))}
          </View>
        </Animated.View>

        {/* Menu */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Настройки</Text>
          <View style={styles.menuCard}>
            <LinearGradient
              colors={['#FFFFFF', '#FFF8F6']}
              style={styles.menuGradient}
            >
              <MenuItem
                icon={<User size={20} color="#D97A6C" strokeWidth={2} />}
                title="Личные данные"
                subtitle="Изменить информацию о себе"
                onPress={() => console.log('Personal info')}
              />
              
              <View style={styles.menuDivider} />
              
              <MenuItem
                icon={<Settings size={20} color="#D97A6C" strokeWidth={2} />}
                title="Настройки игры"
                subtitle="Звуки, уведомления, язык"
                onPress={() => console.log('Game settings')}
              />
              
              <View style={styles.menuDivider} />
              
              <MenuItem
                icon={<Heart size={20} color="#D97A6C" strokeWidth={2} />}
                title="Отношения"
                subtitle="Настройки пары и воспоминаний"
                onPress={() => console.log('Relationships')}
              />
              
              <View style={styles.menuDivider} />
              
              <MenuItem
                icon={<Calendar size={20} color="#D97A6C" strokeWidth={2} />}
                title="События и календарь"
                subtitle="Управление важными датами"
                onPress={() => console.log('Calendar')}
              />
              
              <View style={styles.menuDivider} />
              
              <MenuItem
                icon={<LogOut size={20} color="#D35D5D" strokeWidth={2} />}
                title="Выход"
                onPress={() => console.log('Logout')}
                showArrow={false}
              />
            </LinearGradient>
          </View>
        </Animated.View>

        {/* App Version */}
        <Animated.View entering={FadeInUp.delay(800)} style={styles.versionContainer}>
          <Text style={styles.versionText}>LoveMemory v1.0.0</Text>
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
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 60,
    marginBottom: 32,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  profileGradient: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 37,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C96A5C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#D97A6C',
    marginLeft: 6,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
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
  statGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EADFD8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '800',
    color: '#4A3F3D',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#8C7F7D',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#B8A8A4',
    marginTop: 2,
    textAlign: 'center',
  },
  badgesContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  badgesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    alignItems: 'center',
  },
  badgeGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeIcon: {},
  badgeTitle: {
    fontSize: 11,
    fontFamily: 'System',
    fontWeight: '500',
    textAlign: 'center',
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  menuCard: {
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
  menuGradient: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EADFD8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#4A3F3D',
  },
  menuSubtitle: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#8C7F7D',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '300',
    color: '#B8A8A4',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F2E9E8',
    marginLeft: 72,
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#B8A8A4',
  },
});
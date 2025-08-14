import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Trophy, Coins, Calendar, Heart, LogOut, CreditCard as Edit, Camera, Star, TowerControl as GameController2, Award } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatarFile } from '../services/user.service';
import { useAuth } from '../context/AuthContext';
import { getProfile as apiGetProfile, getProfileStats as apiGetProfileStats } from '../services/user.service';

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
  const { user: authUser, setUser: setAuthUser, logout } = useAuth();
  const [profile, setProfile] = useState<any>(authUser);
  const [stats, setStats] = useState<any[]>([]);
  const [edit, setEdit] = useState<{ first_name?: string; gender?: string; city?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, s] = await Promise.all([apiGetProfile(), apiGetProfileStats()]);
        setProfile(p.data);
        setEdit({ first_name: p.data?.first_name || '', gender: p.data?.gender || 'other', city: p.data?.city || '' });
        setAuthUser(p.data);
        const statItems = [
          {
            icon: <GameController2 size={20} color="#D97A6C" strokeWidth={2} />,
            title: 'Игр сыграно',
            value: String(s.data?.gamesPlayed ?? 0),
            subtitle: 'за все время',
          },
          {
            icon: <Trophy size={20} color="#D97A6C" strokeWidth={2} />,
            title: 'Побед',
            value: String(s.data?.wins ?? 0),
            subtitle: `${Math.round((s.data?.winRate ?? 0) * 100)}% винрейт`,
          },
          {
            icon: <Star size={20} color="#D97A6C" strokeWidth={2} />,
            title: 'Уровень',
            value: String(s.data?.level ?? 1),
            subtitle: `${s.data?.xp ?? 0} опыта`,
          },
          {
            icon: <Coins size={20} color="#D97A6C" strokeWidth={2} />,
            title: 'Монет',
            value: String(p.data?.coins ?? 0),
            subtitle: 'текущий баланс',
          },
        ];
        setStats(statItems);
      } catch (e) {
        // fallback
        setStats([]);
      }
    })();
  }, []);

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
                {profile?.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <User size={40} color="#FFFFFF" strokeWidth={2} />
                )}
              </View>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={async () => {
                  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
                  if (!res.canceled && res.assets?.[0]?.uri) {
                    try {
                      await uploadAvatarFile(res.assets[0].uri);
                      const p = await apiGetProfile();
                      setProfile(p.data);
                      setAuthUser(p.data);
                    } catch (e) {
                      console.log('Failed to upload avatar', e);
                    }
                  }
                }}
              >
                <Camera size={16} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.userName}>{profile?.first_name || (profile?.email ? profile.email.split('@')[0] : '')}</Text>
            <Text style={styles.userEmail}>{profile?.email}</Text>
            <Text style={styles.joinDate}>Монет: {profile?.coins ?? 0}</Text>
            
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

        {/* Edit Profile */}
        <Animated.View entering={FadeInUp.delay(450)} style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Личные данные</Text>
          <View style={styles.menuCard}>
            <LinearGradient colors={['#FFFFFF', '#FFF8F6']} style={styles.menuGradient}>
              <View style={{ padding: 16 }}>
                <Text style={styles.inputLabel}>Имя</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ваше имя"
                  placeholderTextColor="#B8A8A4"
                  value={edit.first_name}
                  onChangeText={(t) => setEdit((e) => ({ ...e, first_name: t }))}
                />
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Город</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Город"
                  placeholderTextColor="#B8A8A4"
                  value={edit.city}
                  onChangeText={(t) => setEdit((e) => ({ ...e, city: t }))}
                />
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Пол</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['male', 'female', 'other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderBtn, edit.gender === g && styles.genderBtnActive]}
                      onPress={() => setEdit((e) => ({ ...e, gender: g }))}
                    >
                      <Text style={[styles.genderText, edit.gender === g && styles.genderTextActive]}>
                        {g === 'male' ? 'М' : g === 'female' ? 'Ж' : 'Др.'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 16 }]}
                  disabled={saving}
                  onPress={async () => {
                    setSaving(true);
                    try {
                      const res = await require('../services/user.service').updateProfile(edit);
                      const p = await apiGetProfile();
                      setProfile(p.data);
                      setAuthUser(p.data);
                    } catch (e) {
                      console.log('Failed to update profile', e);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  <Text style={styles.btnText}>{saving ? 'Сохранение...' : 'Сохранить'}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
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
                onPress={logout}
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
  inputLabel: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#4A3F3D',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFF8F6',
    borderWidth: 1,
    borderColor: '#F2E9E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: '#4A3F3D',
  },
  genderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2E9E8',
    backgroundColor: '#FFFFFF',
  },
  genderBtnActive: {
    borderColor: '#D97A6C',
    backgroundColor: '#EADFD8',
  },
  genderText: { color: '#8C7F7D', fontWeight: '600' },
  genderTextActive: { color: '#D97A6C' },
  primaryBtn: {
    backgroundColor: '#D97A6C',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  btnText: { color: '#fff', fontWeight: '700' },
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
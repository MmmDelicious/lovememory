import { Tabs } from 'expo-router';
import { Heart, Chrome as Home, User, Trophy, TowerControl as GameController2, Calendar } from 'lucide-react-native';
import { Platform, StyleSheet } from 'react-native';

const TAB_ICON_SIZE = 24;
const TAB_COLORS = {
  primary: '#D97A6C',
  inactive: '#8C7F7D',
  background: '#FFFFFF',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: TAB_COLORS.primary,
        tabBarInactiveTintColor: TAB_COLORS.inactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ size, color }) => (
            <Home size={TAB_ICON_SIZE} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Игры',
          tabBarIcon: ({ size, color }) => (
            <GameController2 size={TAB_ICON_SIZE} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Планер',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={TAB_ICON_SIZE} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Статистика',
          tabBarIcon: ({ size, color }) => (
            <Trophy size={TAB_ICON_SIZE} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ size, color }) => (
            <User size={TAB_ICON_SIZE} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: TAB_COLORS.background,
    borderTopWidth: 1,
    borderTopColor: '#F2E9E8',
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    marginTop: 4,
  },
  tabItem: {
    paddingVertical: 4,
  },
});
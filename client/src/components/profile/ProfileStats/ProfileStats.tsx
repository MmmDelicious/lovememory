import React from 'react';
import { StatCard } from '../../../ui/profile';
import { 
  Calendar, 
  Heart, 
  Gamepad2, 
  MessageCircle, 
  Coins,
  TrendingUp 
} from 'lucide-react';
import styles from './ProfileStats.module.css';

interface Stats {
  events: number;
  memories: number;
  gamesPlayed: number;
  daysSinceRegistration: number;
  coins: number;
  messagesCount?: number;
}

interface ProfileStatsProps {
  stats: Stats;
  loading?: boolean;
  onStatClick?: (statKey: string) => void;
  variant?: 'default' | 'grid';
  className?: string;
}

/**
 * Компонент статистики профиля
 * Использует UI компоненты, содержит логику отображения статистики
 */
const ProfileStats: React.FC<ProfileStatsProps> = ({
  stats,
  loading = false,
  onStatClick,
  variant = 'default',
  className = ''
}) => {
  const statsConfig = [
    {
      key: 'events',
      icon: Calendar,
      label: 'События',
      value: stats.events,
      color: 'blue' as const,
      trend: stats.events > 10 ? 'up' as const : undefined,
      trendValue: stats.events > 10 ? '+5 за неделю' : undefined
    },
    {
      key: 'memories',
      icon: Heart,
      label: 'Воспоминания',
      value: stats.memories,
      color: 'red' as const,
      trend: stats.memories > 5 ? 'up' as const : undefined,
      trendValue: stats.memories > 5 ? '+2 за неделю' : undefined
    },
    {
      key: 'gamesPlayed',
      icon: Gamepad2,
      label: 'Игр сыграно',
      value: stats.gamesPlayed,
      color: 'purple' as const,
      trend: stats.gamesPlayed > 3 ? 'up' as const : undefined,
      trendValue: stats.gamesPlayed > 3 ? '+1 за неделю' : undefined
    },
    {
      key: 'daysSinceRegistration',
      icon: TrendingUp,
      label: 'Дней в приложении',
      value: stats.daysSinceRegistration,
      color: 'green' as const
    },
    {
      key: 'coins',
      icon: Coins,
      label: 'Монеты',
      value: stats.coins,
      color: 'orange' as const,
      trend: stats.coins > 100 ? 'up' as const : undefined,
      trendValue: stats.coins > 100 ? '+50 за неделю' : undefined
    }
  ];

  // Добавляем сообщения если есть данные
  if (stats.messagesCount !== undefined) {
    statsConfig.push({
      key: 'messages',
      icon: MessageCircle,
      label: 'Сообщений',
      value: stats.messagesCount,
      color: 'blue' as const,
      trend: stats.messagesCount > 50 ? 'up' as const : undefined,
      trendValue: stats.messagesCount > 50 ? '+12 за неделю' : undefined
    });
  }

  if (variant === 'grid') {
    return (
      <div className={`${styles.gridContainer} ${className}`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.titleIcon}>📊</span>
            Статистика
          </h3>
        </div>
        
        <div className={styles.statsGrid}>
          {statsConfig.map((stat) => (
            <div
              key={stat.key}
              className={styles.statCard}
              onClick={() => onStatClick?.(stat.key)}
            >
              <div className={styles.statIcon}>
                <stat.icon size={20} />
              </div>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
              {stat.trend && (
                <div className={styles.statTrend}>{stat.trendValue}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Статистика</h3>
        <p className={styles.subtitle}>Ваша активность в приложении</p>
      </div>
      
      <div className={styles.grid}>
        {statsConfig.map((stat) => (
          <StatCard
            key={stat.key}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            trend={stat.trend}
            trendValue={stat.trendValue}
            loading={loading}
            onClick={() => onStatClick?.(stat.key)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProfileStats;

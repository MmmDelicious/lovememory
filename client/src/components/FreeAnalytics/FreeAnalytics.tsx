import React from 'react';
import SubscriptionPlans from '../SubscriptionPlans/SubscriptionPlans';
import styles from './FreeAnalytics.module.css';

interface FreeAnalyticsProps {
  harmonyScore?: number;
  events?: any[];
  onUpgrade?: () => void;
}

const FreeAnalytics: React.FC<FreeAnalyticsProps> = ({
  harmonyScore = 0,
  events = [],
  onUpgrade
}) => {
  const handleSelectPlan = (planId: string) => {
    // Вызываем callback для обновления подписки
    if (onUpgrade) {
      onUpgrade();
    }
  };

  return (
    <div className={styles.subscriptionContainer}>
      <SubscriptionPlans onSelectPlan={handleSelectPlan} showHeader={false} />
    </div>
  );
};

export default FreeAnalytics;

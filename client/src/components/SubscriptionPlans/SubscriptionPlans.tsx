import React from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Crown, 
  Star, 
  Heart, 
  Brain, 
  Sparkles,
  Users,
  BarChart3,
  Gift,
  Infinity
} from 'lucide-react';
import styles from './SubscriptionPlans.module.css';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  highlighted?: boolean;
  badgeText?: string;
}

interface SubscriptionPlansProps {
  onSelectPlan?: (planId: string) => void;
  showHeader?: boolean;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSelectPlan, showHeader = true }) => {
  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: '0',
      period: 'навсегда',
      description: 'Базовая функциональность для знакомства с LoveMemory',
      icon: <Heart size={24} />,
      features: [
        'Базовая аналитика отношений',
        'Простые игры и активности',
        'Индекс гармонии',
        'Бесплатные советы'
      ]
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '1.99',
      period: 'в месяц',
      description: 'Расширенные возможности для углубления отношений',
      icon: <Star size={24} />,
      highlighted: true,
      badgeText: 'Популярный',
      features: [
        'AI маскот с персональными советами',
        'Анализ языков любви',
        'Трекер активности',
        'Детальная аналитика',
        '1 генерация свидания в месяц',
        'Психологические инсайты'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '7.99',
      period: 'в месяц',
      description: 'Максимальные возможности для идеальных отношений',
      icon: <Crown size={24} />,
      badgeText: 'Лучший выбор',
      features: [
        'Всё из Basic плана',
        'Глубокая психологическая аналитика',
        'AI советы по подаркам',
        'Карта общих интересов',
        'Безлимитные генерации свиданий',
        'Прогнозы развития отношений',
        'Приоритетная поддержка'
      ]
    }
  ];

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      // Free план уже активен
      return;
    }
    
    onSelectPlan?.(planId);
  };

  return (
    <div className={styles.container}>
      {showHeader && (
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.headerIcon}>
            <Sparkles size={28} />
          </div>
          <h1 className={styles.title}>Выберите ваш план</h1>
          <p className={styles.subtitle}>
            Разблокируйте весь потенциал ваших отношений с персональной аналитикой и AI помощником
          </p>
        </motion.div>
      )}

      <div className={styles.plansGrid}>
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            className={`${styles.planCard} ${plan.highlighted ? styles.highlighted : ''}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
          >
            {plan.badgeText && (
              <div className={styles.planBadge}>
                {plan.badgeText}
              </div>
            )}

            <div className={styles.planHeader}>
              <div className={styles.planIcon}>
                {plan.icon}
              </div>
              
              <h3 className={styles.planName}>{plan.name}</h3>
              
              <div className={styles.planPricing}>
                <span className={styles.planPrice}>
                  {plan.price === '0' ? 'Бесплатно' : `$${plan.price}`}
                </span>
                {plan.price !== '0' && (
                  <span className={styles.planPeriod}>/{plan.period}</span>
                )}
              </div>
              
              <p className={styles.planDescription}>{plan.description}</p>
            </div>

            <div className={styles.planFeatures}>
              {plan.features.map((feature, featureIndex) => (
                <div key={featureIndex} className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <Check size={16} />
                  </div>
                  <span className={styles.featureText}>{feature}</span>
                </div>
              ))}
            </div>

            <motion.button
              className={`${styles.planButton} ${plan.highlighted ? styles.planButtonHighlighted : ''}`}
              onClick={() => handleSelectPlan(plan.id)}
              disabled={plan.id === 'free'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {plan.id === 'free' ? 'Текущий план' : `Выбрать ${plan.name}`}
            </motion.button>
          </motion.div>
        ))}
      </div>


    </div>
  );
};

export default SubscriptionPlans;
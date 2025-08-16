import React from 'react';
import { Crown, X, Star, Check } from 'lucide-react';
import styles from './PremiumModal.module.css';
import Button from '../Button/Button';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  const premiumFeatures = [
    {
      icon: '📊',
      title: 'Детальная аналитика',
      description: 'Полные отчеты по активности и прогрессу отношений'
    },
    {
      icon: '📈',
      title: 'Графики прогресса',
      description: 'Визуализация динамики развития ваших отношений'
    },
    {
      icon: '🎯',
      title: 'Персональные рекомендации',
      description: 'ИИ-советы для улучшения отношений'
    },
    {
      icon: '🔮',
      title: 'Предсказания совместимости',
      description: 'Анализ совместимости на основе ваших данных'
    },
    {
      icon: '📝',
      title: 'Подробные отчеты',
      description: 'Ежемесячные отчеты о состоянии отношений'
    },
    {
      icon: '⭐',
      title: 'Приоритетная поддержка',
      description: 'Быстрая помощь и новые функции в первую очередь'
    }
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <Crown size={32} />
          </div>
          <h2>Премиум аналитика</h2>
          <p>Получите доступ к расширенным возможностям анализа ваших отношений</p>
        </div>

        <div className={styles.features}>
          {premiumFeatures.map((feature, index) => (
            <div key={index} className={styles.feature}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <div className={styles.featureContent}>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
              <Check className={styles.checkIcon} size={16} />
            </div>
          ))}
        </div>

        <div className={styles.pricing}>
          <div className={styles.priceCard}>
            <div className={styles.priceHeader}>
              <Star className={styles.starIcon} size={20} />
              <span>Премиум подписка</span>
            </div>
            <div className={styles.price}>
              <span className={styles.priceAmount}>499</span>
              <span className={styles.priceCurrency}>₽/месяц</span>
            </div>
            <div className={styles.priceNote}>
              Первая неделя бесплатно
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Button 
            type="primary" 
            fullWidth 
            onClick={onUpgrade}
          >
            <Crown size={16} />
            Получить Премиум
          </Button>
          <button className={styles.laterButton} onClick={onClose}>
            Может быть позже
          </button>
        </div>

        <div className={styles.guarantee}>
          <p>✨ Гарантия возврата средств в течение 14 дней</p>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;

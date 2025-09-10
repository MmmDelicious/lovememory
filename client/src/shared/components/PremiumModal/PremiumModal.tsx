import React from 'react';
import { Crown, X, Star, Check, Sparkles, Brain, TrendingUp, Shield, Zap } from 'lucide-react';
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
      icon: <Brain size={20} />,
      title: 'Персональный AI Аналитик',
      description: 'Умная модель анализирует ваши отношения 24/7 и дает персональные рекомендации',
      highlight: true
    },
    {
      icon: <TrendingUp size={20} />,
      title: 'Продвинутая аналитика',
      description: 'Глубокие инсайты, графики совместимости и детальная статистика отношений'
    },
    {
      icon: <Sparkles size={20} />,
      title: 'Интерактивные графы',
      description: 'Визуализация связей в отношениях с возможностью детального анализа'
    },
    {
      icon: <Zap size={20} />,
      title: 'Прогнозы и рекомендации',
      description: 'Предсказания развития отношений и персональные советы для укрепления связи'
    },
    {
      icon: <Shield size={20} />,
      title: 'Приватность и безопасность',
      description: 'Полный контроль над данными с расширенными настройками приватности'
    },
    {
      icon: <Star size={20} />,
      title: 'Эксклюзивный контент',
      description: 'Доступ к премиум урокам, играм и материалам для развития отношений'
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
            <Brain size={32} />
            <div className={styles.aiGlow}></div>
          </div>
          <h2>LoveMemory Premium</h2>
          <p>Персональный AI-аналитик для ваших отношений с продвинутой аналитикой и эксклюзивными функциями</p>
        </div>
        <div className={styles.features}>
          {premiumFeatures.map((feature, index) => (
            <div key={index} className={`${styles.feature} ${feature.highlight ? styles.highlightFeature : ''}`}>
              <div className={styles.featureIcon}>
                {feature.icon}
                {feature.highlight && <div className={styles.featureGlow}></div>}
              </div>
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


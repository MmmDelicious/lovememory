import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, MessageCircle, Camera, Calendar, Users, Settings, Save, AlertCircle } from 'lucide-react';
import styles from './PrivacyControls.module.css';

interface PrivacySettings {
  messages: boolean;
  photos: boolean;
  events: boolean;
  activities: boolean;
  location: boolean;
  gameHistory: boolean;
}

interface DataCategory {
  key: keyof PrivacySettings;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  impactLevel: 'low' | 'medium' | 'high';
}

interface PrivacyControlsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: PrivacySettings) => void;
  currentSettings?: PrivacySettings;
}

const defaultSettings: PrivacySettings = {
  messages: true,
  photos: true,
  events: true,
  activities: true,
  location: true,
  gameHistory: true
};

const dataCategories: DataCategory[] = [
  {
    key: 'messages',
    title: 'Сообщения и переписки',
    description: 'Анализ ваших текстовых сообщений для понимания коммуникационных паттернов',
    icon: MessageCircle,
    impactLevel: 'high'
  },
  {
    key: 'photos',
    title: 'Фотографии и медиа',
    description: 'Обработка изображений для анализа совместных моментов и активностей',
    icon: Camera,
    impactLevel: 'medium'
  },
  {
    key: 'events',
    title: 'События календаря',
    description: 'Анализ планируемых и прошедших событий для рекомендаций',
    icon: Calendar,
    impactLevel: 'high'
  },
  {
    key: 'activities',
    title: 'Активности и игры',
    description: 'Данные о совместных играх и активностях для персонализации',
    icon: Users,
    impactLevel: 'medium'
  },
  {
    key: 'location',
    title: 'Геолокация',
    description: 'Местоположение для рекомендаций мест и событий поблизости',
    icon: Settings,
    impactLevel: 'low'
  },
  {
    key: 'gameHistory',
    title: 'История игр',
    description: 'Статистика игр для анализа предпочтений и совместимости',
    icon: Users,
    impactLevel: 'low'
  }
];

const PrivacyControls: React.FC<PrivacyControlsProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSettings = defaultSettings
}) => {
  const [settings, setSettings] = useState<PrivacySettings>(currentSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  useEffect(() => {
    const changed = Object.keys(settings).some(
      key => settings[key as keyof PrivacySettings] !== currentSettings[key as keyof PrivacySettings]
    );
    setHasChanges(changed);
  }, [settings, currentSettings]);

  const handleToggle = (key: keyof PrivacySettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    onSave(settings);
    setHasChanges(false);
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getImpactLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Сильно влияет на качество рекомендаций';
      case 'medium': return 'Умеренно влияет на рекомендации';
      case 'low': return 'Слабо влияет на рекомендации';
      default: return '';
    }
  };

  const enabledCount = Object.values(settings).filter(Boolean).length;
  const totalCount = Object.keys(settings).length;

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <div className={styles.iconWrapper}>
              <Shield size={24} />
            </div>
            <div>
              <h2 className={styles.title}>Настройки приватности</h2>
              <p className={styles.subtitle}>
                Управляйте тем, какие данные используются для аналитики
              </p>
            </div>
          </div>
          
          <div className={styles.summary}>
            <div className={styles.enabledCount}>
              <span className={styles.count}>{enabledCount}/{totalCount}</span>
              <span className={styles.label}>включено</span>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.warning}>
            <AlertCircle size={20} />
            <div>
              <strong>Важно:</strong> Отключение категорий данных может снизить точность и персонализацию рекомендаций.
            </div>
          </div>

          <div className={styles.categories}>
            {dataCategories.map((category) => {
              const IconComponent = category.icon;
              const isEnabled = settings[category.key];
              
              return (
                <div 
                  key={category.key}
                  className={`${styles.categoryItem} ${isEnabled ? styles.enabled : styles.disabled}`}
                >
                  <div className={styles.categoryIcon}>
                    <IconComponent size={20} />
                  </div>
                  
                  <div className={styles.categoryInfo}>
                    <div className={styles.categoryHeader}>
                      <h3 className={styles.categoryTitle}>{category.title}</h3>
                      <div 
                        className={styles.impactBadge}
                        style={{ backgroundColor: getImpactColor(category.impactLevel) }}
                      >
                        {category.impactLevel === 'high' ? 'Высокое' : 
                         category.impactLevel === 'medium' ? 'Среднее' : 'Низкое'} влияние
                      </div>
                    </div>
                    
                    <p className={styles.categoryDescription}>
                      {category.description}
                    </p>
                    
                    <div className={styles.impactNote}>
                      {getImpactLabel(category.impactLevel)}
                    </div>
                  </div>

                  <div className={styles.toggle}>
                    <button
                      className={`${styles.toggleButton} ${isEnabled ? styles.toggleOn : styles.toggleOff}`}
                      onClick={() => handleToggle(category.key)}
                    >
                      <div className={styles.toggleSlider}>
                        {isEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.explanation}>
            <h4>Как это работает?</h4>
            <ul>
              <li>Отключенные категории полностью исключаются из анализа</li>
              <li>Изменения применяются немедленно и влияют на новые рекомендации</li>
              <li>Вы можете изменить настройки в любое время</li>
              <li>Все данные обрабатываются локально и защищены шифрованием</li>
            </ul>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Отмена
          </button>
          <button 
            className={`${styles.saveButton} ${hasChanges ? styles.hasChanges : ''}`}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save size={16} />
            Сохранить настройки
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyControls;

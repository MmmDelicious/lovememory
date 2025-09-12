import React from 'react';
import { Avatar, FormInput } from '../../../ui/profile';
import { Heart, Users, Mail, X, Plus, Loader2 } from 'lucide-react';
import styles from './PairConnectionCard.module.css';

interface Partner {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatarUrl?: string;
  gender?: 'male' | 'female' | 'other';
}

interface PairConnectionCardProps {
  partner?: Partner;
  isConnected: boolean;
  connectionStatus?: 'pending' | 'accepted' | 'rejected';
  onSendRequest?: (email: string) => void;
  onDisconnect?: () => void;
  onAcceptRequest?: () => void;
  onRejectRequest?: () => void;
  loading?: boolean;
  error?: string;
  variant?: 'default' | 'sidebar';
  className?: string;
}

/**
 * Компонент карточки подключения к партнеру
 * Использует UI компоненты, содержит логику отображения связи с партнером
 */
const PairConnectionCard: React.FC<PairConnectionCardProps> = ({
  partner,
  isConnected,
  connectionStatus,
  onSendRequest,
  onDisconnect,
  onAcceptRequest,
  onRejectRequest,
  loading = false,
  error,
  variant = 'default',
  className = ''
}) => {
  const [email, setEmail] = React.useState('');
  const [showEmailInput, setShowEmailInput] = React.useState(false);

  const partnerName = partner 
    ? [partner.first_name, partner.last_name].filter(Boolean).join(' ') || 'Партнер'
    : null;

  const handleSendRequest = () => {
    if (email.trim() && onSendRequest) {
      onSendRequest(email.trim());
      setEmail('');
      setShowEmailInput(false);
    }
  };

  // Вариант для сайдбара
  if (variant === 'sidebar') {
    return (
      <div className={`${styles.sidebarPartnerCard} ${className}`}>
        <h4 className={styles.sidebarTitle}>👥 Партнер</h4>
        {isConnected && partner ? (
          <div className={styles.partnerInfo}>
            <Avatar
              src={partner.avatarUrl}
              alt={partnerName}
              size="small"
              gender={partner.gender}
              className={styles.partnerAvatar}
            />
            <div className={styles.partnerDetails}>
              <h4>{partnerName}</h4>
              <p>{partner.email}</p>
            </div>
            {onDisconnect && (
              <button 
                onClick={onDisconnect} 
                className={styles.sidebarDisconnectButton}
                disabled={loading}
                title="Отключить партнера"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ) : (
          <div className={styles.connectPartnerSection}>
            <p className={styles.noPartnerText}>Партнер не подключен</p>
            {showEmailInput ? (
              <div className={styles.emailInputSection}>
                <FormInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={styles.emailInput}
                />
                <div className={styles.inputActions}>
                  <button
                    onClick={handleSendRequest}
                    disabled={!email.trim() || loading}
                    className={styles.sendButton}
                  >
                    {loading ? <Loader2 size={14} className={styles.spinner} /> : <Mail size={14} />}
                  </button>
                  <button
                    onClick={() => setShowEmailInput(false)}
                    className={styles.cancelButton}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowEmailInput(true)}
                className={styles.connectButton}
                disabled={loading}
              >
                <Plus size={14} />
                Пригласить партнера
              </button>
            )}
          </div>
        )}
        {error && (
          <p className={styles.errorText}>{error}</p>
        )}
      </div>
    );
  }

  // Подключенное состояние
  if (isConnected && partner) {
    return (
      <div className={`${styles.card} ${styles.connected} ${className}`}>
        <div className={styles.header}>
          <div className={styles.statusIcon}>
            <Heart size={20} className={styles.heartIcon} />
          </div>
          <h3 className={styles.title}>Ваша пара</h3>
        </div>

        <div className={styles.partnerInfo}>
          <Avatar
            src={partner.avatarUrl}
            alt={partnerName}
            size="large"
            gender={partner.gender}
          />
          
          <div className={styles.partnerDetails}>
            <h4 className={styles.partnerName}>{partnerName}</h4>
            <p className={styles.partnerEmail}>{partner.email}</p>
          </div>
        </div>

        <div className={styles.connectionStats}>
          <div className={styles.stat}>
            <Users size={16} />
            <span>Подключены</span>
          </div>
        </div>

        {onDisconnect && (
          <button 
            onClick={onDisconnect} 
            className={styles.disconnectButton}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className={styles.spinner} /> : <X size={16} />}
            Отключить
          </button>
        )}
      </div>
    );
  }

  // Ожидающий запрос
  if (connectionStatus === 'pending') {
    return (
      <div className={`${styles.card} ${styles.pending} ${className}`}>
        <div className={styles.header}>
          <div className={styles.statusIcon}>
            <Loader2 size={20} className={styles.spinner} />
          </div>
          <h3 className={styles.title}>Ожидание ответа</h3>
        </div>

        <p className={styles.description}>
          Запрос на подключение отправлен. Ожидайте подтверждения от партнера.
        </p>

        {partner && (
          <div className={styles.partnerInfo}>
            <Avatar
              src={partner.avatarUrl}
              alt={partnerName}
              size="medium"
              gender={partner.gender}
            />
            <div className={styles.partnerDetails}>
              <h4 className={styles.partnerName}>{partnerName}</h4>
              <p className={styles.partnerEmail}>{partner.email}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Входящий запрос
  if (connectionStatus === 'accepted' && partner && onAcceptRequest && onRejectRequest) {
    return (
      <div className={`${styles.card} ${styles.incoming} ${className}`}>
        <div className={styles.header}>
          <div className={styles.statusIcon}>
            <Mail size={20} />
          </div>
          <h3 className={styles.title}>Запрос на подключение</h3>
        </div>

        <div className={styles.partnerInfo}>
          <Avatar
            src={partner.avatarUrl}
            alt={partnerName}
            size="medium"
            gender={partner.gender}
          />
          <div className={styles.partnerDetails}>
            <h4 className={styles.partnerName}>{partnerName}</h4>
            <p className={styles.partnerEmail}>{partner.email}</p>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            onClick={onAcceptRequest} 
            className={styles.acceptButton}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className={styles.spinner} /> : <Heart size={16} />}
            Принять
          </button>
          <button 
            onClick={onRejectRequest} 
            className={styles.rejectButton}
            disabled={loading}
          >
            <X size={16} />
            Отклонить
          </button>
        </div>
      </div>
    );
  }

  // Не подключен - показываем форму подключения
  return (
    <div className={`${styles.card} ${styles.notConnected} ${className}`}>
      <div className={styles.header}>
        <div className={styles.statusIcon}>
          <Plus size={20} />
        </div>
        <h3 className={styles.title}>Подключить партнера</h3>
      </div>

      <p className={styles.description}>
        Отправьте приглашение партнеру по email, чтобы начать делиться воспоминаниями вместе.
      </p>

      {error && (
        <div className={styles.error}>
          <X size={16} />
          {error}
        </div>
      )}

      {showEmailInput ? (
        <div className={styles.emailForm}>
          <FormInput
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="email@example.com"
            icon={Mail}
          />
          <div className={styles.formActions}>
            <button 
              onClick={handleSendRequest} 
              className={styles.sendButton}
              disabled={loading || !email.trim()}
            >
              {loading ? <Loader2 size={16} className={styles.spinner} /> : <Mail size={16} />}
              Отправить
            </button>
            <button 
              onClick={() => {
                setShowEmailInput(false);
                setEmail('');
              }} 
              className={styles.cancelButton}
            >
              <X size={16} />
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowEmailInput(true)} 
          className={styles.connectButton}
        >
          <Plus size={16} />
          Пригласить партнера
        </button>
      )}
    </div>
  );
};

export default PairConnectionCard;

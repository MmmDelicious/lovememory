import React from 'react';
import { Avatar, FormInput } from '../../../ui/profile';
// Импорты иконок убраны для минималистичного дизайна
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
  connectionStatus?: 'pending' | 'active' | 'unpaired';
  onSendRequest?: (email: string) => void;
  onDisconnect?: () => void;
  onAcceptRequest?: () => void;
  onRejectRequest?: () => void;
  onFixMutualRequests?: () => void;
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
  onFixMutualRequests,
  loading = false,
  error,
  variant = 'default',
  className = ''
}) => {
  const [email, setEmail] = React.useState('');
  const [showEmailInput, setShowEmailInput] = React.useState(false);

  const partnerName = partner 
    ? [partner.first_name, partner.last_name].filter(Boolean).join(' ') || 'Партнер'
    : undefined;

  const handleSendRequest = () => {
    if (email.trim() && onSendRequest) {
      onSendRequest(email.trim());
      setEmail('');
      setShowEmailInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && email.trim()) {
      e.preventDefault();
      handleSendRequest();
    }
  };

  // Вариант для сайдбара
  if (variant === 'sidebar') {
    return (
      <div className={`${styles.sidebarPartnerCard} ${isConnected ? styles.connected : ''} ${className}`}>
        {isConnected && partner ? (
          <>
            <h4 className={styles.sidebarTitle}>{partnerName}</h4>
            <div className={styles.partnerInfo}>
              <div className={styles.partnerAvatarWrapper}>
                <Avatar
                  src={partner.avatarUrl}
                  alt={partnerName}
                  size="small"
                  gender={partner.gender}
                  className={styles.partnerAvatar}
                />
                <div className={styles.onlineIndicator}></div>
              </div>
              <div className={styles.partnerDetails}>
                <p className={styles.partnerEmail}>{partner.email}</p>
                <div className={styles.connectionBadge}>
                  <span>Подключен</span>
                </div>
              </div>
              {onDisconnect && (
                <button 
                  onClick={onDisconnect} 
                  className={styles.sidebarDisconnectButton}
                  disabled={loading}
                  title="Отключить партнера"
                >
                  ×
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <h4 className={styles.sidebarTitle}>Партнер</h4>
            <div className={styles.connectPartnerSection}>
              <p className={styles.noPartnerText}>Партнер не подключен</p>
              {showEmailInput ? (
                <div className={styles.emailInputSection}>
                  <div onKeyPress={handleKeyPress}>
                    <FormInput
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="email@example.com"
                      className={styles.emailInput}
                    />
                  </div>
                  <div className={styles.inputActions}>
                    <button
                      onClick={handleSendRequest}
                      disabled={!email.trim() || loading}
                      className={styles.sendButton}
                    >
                      {loading ? 'Отправка...' : 'Отправить'}
                    </button>
                    <button
                      onClick={() => setShowEmailInput(false)}
                      className={styles.cancelButton}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowEmailInput(true)}
                  className={styles.connectButton}
                  disabled={loading}
                >
                  Пригласить партнера
                </button>
              )}
            </div>
          </>
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
          <h3 className={styles.title}>{partnerName}</h3>
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

        <div className={styles.connectionStatus}>
          <div className={styles.statusBadge}>Подключен</div>
        </div>

        {onDisconnect && (
          <button 
            onClick={onDisconnect} 
            className={styles.disconnectButton}
            disabled={loading}
          >
            {loading ? 'Отключение...' : 'Отключить'}
          </button>
        )}
      </div>
    );
  }

  // Входящий запрос (сначала проверяем его, чтобы показать кнопки "Принять"/"Отклонить")
  if (connectionStatus === 'pending' && partner && onAcceptRequest && onRejectRequest) {
    return (
      <div className={`${styles.card} ${styles.incoming} ${className}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>Входящий запрос</h3>
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
            {loading ? 'Принятие...' : 'Принять'}
          </button>
          <button 
            onClick={onRejectRequest} 
            className={styles.rejectButton}
            disabled={loading}
          >
            Отклонить
          </button>
        </div>
      </div>
    );
  }

  // Ожидающий ответ на исходящий запрос
  if (connectionStatus === 'pending') {
    return (
      <div className={`${styles.card} ${styles.pending} ${className}`}>
        <div className={styles.header}>
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


  // Не подключен - показываем форму подключения
  return (
    <div className={`${styles.card} ${styles.notConnected} ${className}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>Подключить партнера</h3>
        </div>

      <p className={styles.description}>
        Отправьте приглашение партнеру по email, чтобы начать делиться воспоминаниями вместе.
      </p>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

      {showEmailInput ? (
        <div className={styles.emailForm}>
          <div onKeyPress={handleKeyPress}>
            <FormInput
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="email@example.com"
            />
          </div>
          <div className={styles.formActions}>
            <button 
              onClick={handleSendRequest} 
              className={styles.sendButton}
              disabled={loading || !email.trim()}
            >
              {loading ? 'Отправка...' : 'Отправить'}
            </button>
            <button 
              onClick={() => {
                setShowEmailInput(false);
                setEmail('');
              }} 
              className={styles.cancelButton}
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowEmailInput(true)} 
          className={styles.connectButton}
        >
          Пригласить партнера
        </button>
      )}
    </div>
  );
};

export default PairConnectionCard;

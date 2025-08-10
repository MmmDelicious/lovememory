import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePairing } from '../../hooks/usePairing';
import { useEvents } from '../../hooks/useEvents';
import { eventService } from '../../services';
import styles from './ProfilePage.module.css';

import Button from '../../components/Button/Button';
import { FaStar, FaStarHalfAlt, FaHeart, FaEnvelope, FaMapMarkerAlt, FaGift, FaUser, FaPlus, FaPencilAlt, FaTrash, FaTelegramPlane, FaThLarge, FaUsers } from 'react-icons/fa';
import manAvatar from '../../assets/man.png';
import womanAvatar from '../../assets/woman.png';
import defaultAvatar from '../../assets/react.svg';

const ProfilePage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { pairing, isLoading: isPairingLoading, sendRequest, deletePairing, saveTelegramId } = usePairing(user);
  const { events, isLoading: areEventsLoading, deleteEvent } = useEvents(user?.id);

  const [activeTab, setActiveTab] = useState('events');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [galleryItems, setGalleryItems] = useState([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setTelegramId(user.telegram_chat_id || '');
    }
  }, [user]);

  const getAvatar = (targetUser = user) => {
    if (targetUser?.avatarUrl) return targetUser.avatarUrl;
    if (targetUser?.gender === 'male') return manAvatar;
    if (targetUser?.gender === 'female') return womanAvatar;
    return defaultAvatar;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  };
  
  const renderEvents = () => {
    if (areEventsLoading) return <div className={styles.placeholder}>Загрузка событий...</div>;
    const upcomingEvents = events?.filter(event => new Date(event.start) >= new Date()).sort((a, b) => new Date(a.start) - new Date(b.start));

    if (!upcomingEvents || upcomingEvents.length === 0) return <div className={styles.placeholder}>Нет предстоящих дел.</div>;

    return (
      <div className={styles.dealsList}>
        {upcomingEvents.map(event => (
          <div key={event.id} className={styles.dealItem}>
            <div className={styles.dealIndicator}></div>
            <div className={styles.dealAvatar}>
              <span>{new Date(event.start).getDate()}</span>
            </div>
            <div className={styles.dealContent}>
              <div className={styles.dealTitle}>{event.title}</div>
              <div className={styles.dealDescription}>{event.extendedProps?.description || 'Описание отсутствует'}</div>
              <div className={styles.dealMeta}>
                <span className={styles.dealDate}>{formatDate(event.start)}</span>
              </div>
            </div>
            <div className={styles.dealActions}>
              <Link to="/calendar" className={styles.iconBtn} aria-label="Edit in calendar"><FaPencilAlt /></Link>
              <button className={styles.iconBtn} onClick={() => deleteEvent(event.id)} aria-label="Delete event"><FaTrash /></button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGallery = () => {
    if (isGalleryLoading) return <div className={styles.placeholder}>Загрузка галереи...</div>;
    if (!galleryItems.length) return <div className={styles.placeholder}>Медиа не найдено.</div>;
    return (
      <div className={styles.galleryGrid}>
        {galleryItems.map((item) => (
          <div key={item.id} className={styles.galleryItem}>
            <img
              className={styles.galleryImage}
              src={`${eventService.FILES_BASE_URL}${item.file_url}`}
              alt={item.file_type}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    try {
      await sendRequest(partnerEmail);
      setPartnerEmail('');
    } catch (err) {
      console.error('Failed to send pairing request:', err);
    }
  };

  const handleTelegramIdSave = async (e) => {
    e.preventDefault();
    try {
      await saveTelegramId(telegramId);
    } catch (err) {
      console.error('Failed to save Telegram ID:', err);
    }
  };

  const fetchGallery = async () => {
    if (!events || !events.length) {
      setGalleryItems([]);
      return;
    }
    setIsGalleryLoading(true);
    try {
      // Берем до 20 последних событий для экономии запросов
      const eventsToLoad = [...events]
        .sort((a, b) => new Date(b.start) - new Date(a.start))
        .slice(0, 20);
      const mediaArrays = await Promise.all(
        eventsToLoad.map((ev) => eventService.getMediaForEvent(ev.id).then(r => r.data).catch(() => []))
      );
      const flat = mediaArrays.flat();
      setGalleryItems(flat);
    } catch (err) {
      console.error('Failed to load gallery:', err);
      setGalleryItems([]);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'gallery') {
      fetchGallery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, events]);

  if (isAuthLoading) return <div className={styles.loadingContainer}>Загрузка...</div>;
  if (!user) return <div className={styles.errorContainer}>Пользователь не найден.</div>;

  const partner = pairing?.status === 'active' 
    ? (pairing.Requester.id === user.id ? pairing.Receiver : pairing.Requester)
    : null;

  return (
    <div className={styles.pageWrapper}>
        <div className={styles.profileContainer}>
          <div className={styles.profileDetails}>
            <div className={styles.profileHeader}>
              <img src={getAvatar()} alt="User Avatar" className={styles.profileAvatarLarge} />
              <h1 className={styles.profileNameLarge}>{user.first_name || 'Пользователь'} {user.last_name}</h1>
              <p className={styles.profileTitle}>{user.bio || 'Участник LoveMemory'}</p>
              <div className={styles.profileRating}>
                <div className={styles.stars}>
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStarHalfAlt />
                </div>
                <div className={styles.engagement}><FaHeart /><span>{user.love_coins || 0}</span></div>
              </div>
            </div>

            <div className={styles.contactSection}>
              <h3>Контактная информация</h3>
              <div className={styles.contactItem}><FaEnvelope /><span>{user.email}</span></div>
               <div className={styles.contactItem}><FaGift /><span>{user.age ?? 'Возраст не указан'}</span></div>
              <div className={styles.contactItem}><FaMapMarkerAlt /><span>{user.city || 'Город не указан'}</span></div>
            </div>
            
            <div className={styles.tagsSection}>
              <h3>Теги (в разработке)</h3>
              <div className={styles.tagsContainer}>
                <div className={styles.tag}><span>семья</span></div>
                <div className={styles.tag}><span>путешествия</span></div>
                <div className={styles.tag}><span>хобби</span></div>
              </div>
            </div>

            {partner && (
              <div className={styles.ownerSection}>
                <img src={getAvatar(partner)} alt="Partner" className={styles.ownerAvatar} />
                <span className={styles.ownerText}>В паре с: {partner.first_name || partner.email}</span>
              </div>
            )}
          </div>

          <div className={styles.activitySection}>
            <div className={styles.tabs}>
              <div className={`${styles.tab} ${activeTab === 'events' ? styles.active : ''}`} onClick={() => setActiveTab('events')}>Предстоящие дела</div>
              <div className={`${styles.tab} ${activeTab === 'gallery' ? styles.active : ''}`} onClick={() => setActiveTab('gallery')}>Галерея</div>
            </div>
            <div className={styles.dealsContainer}>
              <div className={styles.dealsHeader}>
                <h3>{activeTab === 'events' ? `Задачи (${events?.length || 0})` : 'Галерея'}</h3>
                <Link to="/calendar" className={styles.addButton}>
                  <Button variant="outline" size="sm"><FaPlus /> Добавить</Button>
                </Link>
              </div>
              {activeTab === 'events' ? renderEvents() : renderGallery()}
            </div>
          </div>
        </div>

        <div className={styles.widgetsSection}>
          <div className={`${styles.widget} ${styles.pairWidget}`}>
            <div className={styles.widgetHeader}>
              <FaUsers className={styles.widgetIcon} />
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.widgetTitle}>Управление парой</div>
              <div className={styles.widgetBody}>
                {isPairingLoading ? <p>Загрузка...</p> : partner ? (
                  <>
                    <p>Вы в паре с <strong>{partner.first_name || partner.email}</strong>.</p>
                    <Button onClick={() => deletePairing(pairing.id)} variant="danger" style={{ width: '100%' }}>Разорвать связь</Button>
                  </>
                ) : (
                  <form onSubmit={handleSendRequest}>
                    <p>Начните отношения, отправив приглашение.</p>
                    <input type="email" value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} placeholder="Email партнёра" required className={styles.input} />
                    <Button type="submit" variant="primary" style={{ width: '100%' }}>Отправить</Button>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className={`${styles.widget} ${styles.telegramWidget}`}>
            <div className={styles.widgetHeader}>
              <FaTelegramPlane className={styles.widgetIcon} />
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.widgetTitle}>Telegram</div>
               <form className={styles.widgetBody} onSubmit={handleTelegramIdSave}>
                <p>Подключите уведомления о событиях.</p>
                <input type="text" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} placeholder="Ваш Chat ID" className={styles.input} />
                <Button type="submit" variant="primary" style={{ width: '100%' }}>Сохранить</Button>
              </form>
            </div>
          </div>

          <div className={`${styles.widget} ${styles.addWidget}`}>
            <div className={styles.widgetContent}>
              <FaThLarge />
              <div className={styles.widgetTitle}>Добавить виджет</div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ProfilePage;
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePairing } from '../../hooks/usePairing';
import userService from '../../services/user.service';
import styles from './ProfilePage.module.css';

import Avatar from '../../components/Avatar/Avatar';
import Button from '../../components/Button/Button';
import ProfileStats from '../../components/ProfileStats/ProfileStats';
import GenderSelector from '../../components/GenderSelector/GenderSelector';

import { FaUser, FaBirthdayCake, FaCity, FaBuilding, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { MdErrorOutline, MdPersonSearch } from 'react-icons/md';

const ProfilePage = () => {
  const { user, isLoading: isAuthLoading, updateUser } = useAuth();
  const { pairing, isLoading: isPairingLoading, error, sendRequest, acceptRequest, deletePairing, saveTelegramId, setError } = usePairing(user);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [email, setEmail] = useState('');
  const [localTelegramId, setLocalTelegramId] = useState('');

  const initializeProfileData = useCallback(() => {
    if (user) {
      setProfileData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        bio: user.bio || '',
        gender: user.gender || '',
        age: user.age || '',
        city: user.city || '',
        avatar: user.avatarUrl || null,
      });
      setLocalTelegramId(user.telegram_chat_id || '');
    }
  }, [user]);

  useEffect(() => {
    initializeProfileData();
  }, [initializeProfileData]);

  const handleEditToggle = () => {
    if (isEditing) {
      initializeProfileData();
    }
    setIsEditing(!isEditing);
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      const { firstName, lastName, bio, gender, age, city } = profileData;
      const updateData = { first_name: firstName, last_name: lastName, bio, gender, age: age ? parseInt(age, 10) : null, city };
      const response = await userService.updateProfile(updateData);
      if (updateUser) updateUser(response.data);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const response = await userService.uploadAvatar(formData);
      const newAvatarUrl = response.data.avatarUrl;
      setProfileData(p => ({ ...p, avatar: newAvatarUrl }));
      if (updateUser) updateUser({ ...user, avatarUrl: newAvatarUrl });
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка загрузки аватара');
    }
  };
  
  const handleSendRequest = (e) => { e.preventDefault(); sendRequest(email); };
  const handleTelegramIdSave = (e) => { e.preventDefault(); saveTelegramId(localTelegramId); };

  const renderPairingContent = () => {
    if (isPairingLoading) return <div className={styles.card}><div className={styles.loadingSpinner}></div></div>;

    if (pairing?.status === 'active') {
      const partner = pairing.Requester.id === user?.id ? pairing.Receiver : pairing.Requester;
      return (
        <div className={styles.card}>
          <h3>Вы в паре</h3>
          <div className={styles.partnerInfo}>
            <Avatar src={partner.avatarUrl} alt={partner.first_name} size="small" />
            <span>Вы в паре с <strong>{partner.first_name || partner.email}</strong></span>
          </div>
          <p>Статистика и общие обсуждения будут доступны скоро.</p>
          <Button onClick={() => deletePairing(pairing.id)} variant="danger">Разорвать связь</Button>
        </div>
      );
    }
    
    // Condensed other states for brevity
    return (
        <div className={styles.card}>
          <h3>Создать пару</h3>
          <p>Отправьте приглашение партнёру, чтобы вести общий календарь.</p>
          <form onSubmit={handleSendRequest} className={styles.form}>
            <div className={styles.inputGroup}>
              <MdPersonSearch className={styles.inputIcon} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email партнёра" required className={styles.input} />
            </div>
            <Button type="submit" variant="primary">Отправить</Button>
          </form>
        </div>
      );
  };
  
  if (isAuthLoading) return <div className={styles.loadingContainer}><div className={styles.loadingSpinner}></div></div>;

  return (
    <div className={styles.profileLayout}>
      <aside className={`${styles.card} ${styles.userCard}`}>
        <div className={styles.avatarWrapper}>
          <Avatar src={profileData.avatar} alt={`${profileData.firstName} ${profileData.lastName}`} size="large" />
          {isEditing && (
            <>
              <input type="file" accept="image/*" onChange={handleAvatarChange} id="avatar-upload" style={{ display: 'none' }} />
              <label htmlFor="avatar-upload" className={styles.avatarEditButton}><FaUser /></label>
            </>
          )}
        </div>
        {isEditing ? (
          <div className={styles.editFields}>
            <input type="text" value={profileData.firstName} onChange={(e) => setProfileData(p => ({ ...p, firstName: e.target.value }))} className={styles.input} placeholder="Имя" />
            <input type="text" value={profileData.lastName} onChange={(e) => setProfileData(p => ({ ...p, lastName: e.target.value }))} className={styles.input} placeholder="Фамилия" />
            <GenderSelector selectedGender={profileData.gender} onGenderChange={(g) => setProfileData(p => ({...p, gender: g}))} />
            <input type="number" value={profileData.age} onChange={(e) => setProfileData(p => ({ ...p, age: e.target.value }))} className={styles.input} placeholder="Возраст" />
            <input type="text" value={profileData.city} onChange={(e) => setProfileData(p => ({ ...p, city: e.target.value }))} className={styles.input} placeholder="Город" />
          </div>
        ) : (
          <div className={styles.infoFields}>
            <div className={styles.infoItem}><FaUser /><span>{profileData.gender || 'Не указан'}</span></div>
            <div className={styles.infoItem}><FaBirthdayCake /><span>{profileData.age || 'Не указан'}</span></div>
            <div className={styles.infoItem}><FaBuilding /><span>{profileData.city || 'Не указан'}</span></div>
          </div>
        )}
        <div className={styles.profileActions}>
          {isEditing ? (
            <>
              <Button onClick={handleProfileSave} variant="primary" disabled={isSaving}>{isSaving ? '...' : 'Сохранить'}</Button>
              <Button onClick={handleEditToggle} variant="secondary">Отмена</Button>
            </>
          ) : (
            <Button onClick={handleEditToggle} variant="primary">Редактировать</Button>
          )}
        </div>
      </aside>

      <main className={styles.contentGrid}>
        <div className={`${styles.card} ${styles.statsCard}`}>
          <ProfileStats user={user} />
        </div>
        {renderPairingContent()}
        <div className={styles.card}>
          <h3>Настройки</h3>
          <p>Получайте уведомления в Telegram о событиях.</p>
          <form onSubmit={handleTelegramIdSave} className={styles.form}>
            <div className={styles.inputGroup}>
              <FaPaperPlane className={styles.inputIcon} />
              <input type="text" value={localTelegramId} onChange={(e) => setLocalTelegramId(e.target.value)} placeholder="Telegram Chat ID" className={styles.input} />
            </div>
            <Button type="submit" variant="primary">Сохранить ID</Button>
          </form>
        </div>
        {error && 
          <div className={`${styles.card} ${styles.error}`}>
            <MdErrorOutline /><p>{error}</p>
            <button onClick={() => setError('')} className={styles.errorClose}><FaTimes /></button>
          </div>
        }
      </main>
    </div>
  );
};

export default ProfilePage;
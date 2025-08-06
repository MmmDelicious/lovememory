import React, { useState, useEffect, useRef } from 'react';
import styles from './PairingPage.module.css';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { useEventMascot } from '../../context/EventMascotContext';
import { usePairing } from '../../hooks/usePairing';

const PairingPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    pairing,
    telegramId,
    isLoading,
    error,
    sendRequest,
    acceptRequest,
    deletePairing,
    saveTelegramId,
    setError
  } = usePairing(user);
  
  const [email, setEmail] = useState('');
  const [localTelegramId, setLocalTelegramId] = useState('');
  const { showMascot } = useEventMascot();
  const mascotTriggerRef = useRef(null);

  useEffect(() => {
    setLocalTelegramId(telegramId);
  }, [telegramId]);

  useEffect(() => {
    if (pairing?.status === 'pending' && pairing.user1Id !== user.id && mascotTriggerRef.current) {
      showMascot({
        page: 'pairing',
        element: mascotTriggerRef.current,
        data: { requesterName: pairing.Requester.first_name },
        buttonText: "Да, принять!",
        onActionClick: () => handleAccept(pairing.id),
        type: 'greeter',
        side: 'right',
      });
    }
  }, [pairing, user, showMascot]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Введите email партнёра.');
      return;
    }
    try {
      await sendRequest(email);
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка при отправке запроса.');
    }
  };

  const handleAccept = async (requestId) => {
    try {
      const idToAccept = requestId || pairing.id;
      await acceptRequest(idToAccept);
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось принять запрос.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите отменить это действие?')) {
      try {
        await deletePairing(pairing.id);
      } catch (err) {
        setError(err.response?.data?.message || 'Не удалось выполнить действие.');
      }
    }
  };

  const handleTelegramIdSave = async (e) => {
    e.preventDefault();
    try {
      await saveTelegramId(localTelegramId);
      alert('Telegram ID успешно сохранен!');
    } catch(err) {
      setError(err.response?.data?.message || 'Не удалось сохранить Telegram ID.');
    }
  };

  if (isAuthLoading) {
    return <p>Инициализация...</p>;
  }

  const renderPairingContent = () => {
    if (isLoading) return <p>Загрузка...</p>;

    if (pairing?.status === 'active') {
      const partner = pairing.Requester.id === user.id ? pairing.Receiver : pairing.Requester;
      return (
        <div className={styles.statusContainer}>
          <h2>Вы в паре!</h2>
          <p>Ваш партнёр: <strong>{partner.email}</strong></p>
          <Button onClick={handleDelete} type="secondary">Разорвать связь</Button>
        </div>
      );
    }

    if (pairing?.status === 'pending') {
      if (pairing.user1Id === user.id) {
        return (
          <div className={styles.statusContainer}>
            <h2>Запрос отправлен</h2>
            <p>Ожидание ответа от <strong>{pairing.Receiver.email}</strong>.</p>
            <Button onClick={handleDelete} type="secondary">Отменить запрос</Button>
          </div>
        );
      } else {
        return (
          <div className={styles.statusContainer} ref={mascotTriggerRef}>
            <h2>Новый запрос!</h2>
            <p>Пользователь <strong>{pairing.Requester.email}</strong> хочет создать с вами пару.</p>
            <div className={styles.actions}>
              <Button onClick={() => handleAccept()} type="primary">Принять</Button>
              <Button onClick={handleDelete} type="secondary">Отклонить</Button>
            </div>
          </div>
        );
      }
    }

    return (
      <>
        <h2>Создать пару</h2>
        <p>Отправьте приглашение своему партнёру, чтобы вести общий календарь.</p>
        <form onSubmit={handleSendRequest} className={styles.form}>
          <label htmlFor="email">Email партнёра</label>
          <input
            id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="partner@example.com" required className={styles.input}
          />
          <Button type="primary" submit>Отправить приглашение</Button>
        </form>
      </>
    );
  };

  return (
    <main className={styles.pageContainer}>
      <div className={`${styles.card} fade-in`}>
        {renderPairingContent()}
        {error && <p className={styles.error}>{error}</p>}
      </div>
      <div className={`${styles.card} fade-in`}>
          <h2>Уведомления в Telegram</h2>
          <p>Получайте ежедневные напоминания о событиях. Вставьте ваш Chat ID, полученный от бота, в поле ниже.</p>
          <form onSubmit={handleTelegramIdSave} className={styles.form}>
              <label htmlFor="telegramId">Ваш Telegram Chat ID</label>
              <input
                  id="telegramId" type="text" value={localTelegramId || ''} onChange={(e) => setLocalTelegramId(e.target.value)}
                  placeholder="123456789" className={styles.input}
              />
              <Button type="primary" submit>Сохранить ID</Button>
          </form>
      </div>
    </main>
  );
};

export default PairingPage;
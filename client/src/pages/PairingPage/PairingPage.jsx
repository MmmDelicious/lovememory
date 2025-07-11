import React, { useState, useEffect, useCallback } from 'react';
import pairService from '../../services/pair.service';
import userService from '../../services/user.service';
import styles from './PairingPage.module.css';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { useMascot } from '../../context/MascotContext';

const PairingPage = () => {
  const [pairing, setPairing] = useState(null);
  const [telegramId, setTelegramId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { showMascot } = useMascot();

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError('');
      const [pairResponse, profileResponse] = await Promise.all([
        pairService.getStatus(),
        userService.getProfile(),
      ]);
      const newPairing = pairResponse.data;
      setPairing(newPairing);
      setTelegramId(profileResponse.data.telegram_chat_id || '');

      if (newPairing?.status === 'pending' && newPairing.user1Id !== user.user.id) {
        showMascot({
          page: 'pairing',
          data: { requesterName: newPairing.Requester.first_name },
          buttonText: "Да, принять!",
          onActionClick: () => handleAccept(newPairing.id),
          position: { x: window.innerWidth * 0.75, y: window.innerHeight / 2 },
          type: 'flyer',
          side: 'top',
        });
      }

    } catch (err) {
      setError('Не удалось загрузить данные. Попробуйте позже.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, showMascot]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  const handleAccept = async (requestId) => {
    try {
      const idToAccept = requestId || pairing.id;
      await pairService.acceptRequest(idToAccept);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось принять запрос.');
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Введите email партнёра.');
      return;
    }
    try {
      await pairService.sendRequest(email);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка при отправке запроса.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите отменить это действие?')) {
      try {
        await pairService.deletePairing(pairing.id);
        fetchData();
      } catch (err) {
        setError(err.response?.data?.message || 'Не удалось выполнить действие.');
      }
    }
  };

  const handleTelegramIdSave = async (e) => {
    e.preventDefault();
    try {
        await userService.updateProfile({ telegram_chat_id: telegramId });
        alert('Telegram ID успешно сохранен!');
        fetchData();
    } catch(err) {
        setError(err.response?.data?.message || 'Не удалось сохранить Telegram ID.');
    }
  }

  if (isAuthLoading) {
    return <p>Инициализация...</p>;
  }

  const renderPairingContent = () => {
    if (isLoading) return <p>Загрузка...</p>;

    if (pairing?.status === 'active') {
      const partner = pairing.Requester.id === user.user.id ? pairing.Receiver : pairing.Requester;
      return (
        <div className={styles.statusContainer}>
          <h2>Вы в паре!</h2>
          <p>Ваш партнёр: <strong>{partner.email}</strong></p>
          <Button onClick={handleDelete} type="secondary">Разорвать связь</Button>
        </div>
      );
    }

    if (pairing?.status === 'pending') {
      if (pairing.user1Id === user.user.id) {
        return (
          <div className={styles.statusContainer}>
            <h2>Запрос отправлен</h2>
            <p>Ожидание ответа от <strong>{pairing.Receiver.email}</strong>.</p>
            <Button onClick={handleDelete} type="secondary">Отменить запрос</Button>
          </div>
        );
      } else {
        return (
          <div className={styles.statusContainer}>
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
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="partner@example.com"
            required
            className={styles.input}
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
                  id="telegramId"
                  type="text"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="123456789"
                  className={styles.input}
              />
              <Button type="primary" submit>Сохранить ID</Button>
          </form>
      </div>
    </main>
  );
};

export default PairingPage;
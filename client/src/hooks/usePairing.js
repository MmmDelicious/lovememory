import { useState, useEffect, useCallback } from 'react';
import { pairService, userService } from '../services'

export const usePairing = (user) => {
  const [pairing, setPairing] = useState(null);
  const [telegramId, setTelegramId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setError('');
      const [pairResponse, profileResponse] = await Promise.all([
        pairService.getStatus(),
        userService.getProfile(),
      ]);
      setPairing(pairResponse.data);
      setTelegramId(profileResponse.data.telegram_chat_id || '');
    } catch (err) {
      // Не показываем ошибку если статус unpaired - это нормально
      if (err.response?.data?.status !== 'unpaired') {
        setError('Не удалось загрузить данные. Попробуйте позже.');
        console.error(err);
      } else {
        setPairing({ status: 'unpaired' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sendRequest = async (email) => {
    await pairService.sendRequest(email);
    fetchData();
  };

  const acceptRequest = async (requestId) => {
    await pairService.acceptRequest(requestId);
    fetchData();
  };

  const deletePairing = async (pairingId) => {
    await pairService.deletePairing(pairingId);
    fetchData();
  };

  const saveTelegramId = async (newTelegramId) => {
    await userService.updateProfile({ telegram_chat_id: newTelegramId });
    fetchData();
  };

  return {
    pairing,
    telegramId,
    isLoading,
    error,
    sendRequest,
    acceptRequest,
    deletePairing,
    saveTelegramId,
    setError // Экспортируем для управления ошибками из компонента
  };
};
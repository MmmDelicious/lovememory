import { useState, useEffect, useCallback } from 'react';
import { pairService, userService } from '../services'
export const usePairing = (user) => {
  const [pairing, setPairing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      setError('');
      const pairResponse = await pairService.getStatus();
      setPairing(pairResponse.data);
    } catch (err) {
      if (err.response?.data?.status !== 'unpaired') {
        setError('Не удалось загрузить данные. Попробуйте позже.');
      } else {
        setPairing({ status: 'unpaired' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);
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
  return {
    pairing,
    isLoading,
    error,
    sendRequest,
    acceptRequest,
    deletePairing,
    setError // Экспортируем для управления ошибками из компонента
  };
};

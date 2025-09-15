import { useState, useEffect, useCallback } from 'react';
import { pairService, userService } from '../services';
import { toast } from '../../../shared/hooks/useToast';
export const usePairing = (user) => {
  const [pairing, setPairing] = useState({ status: 'unpaired' }); // Начальное состояние
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      setError('');
      const pairResponse = await pairService.getStatus();
      const pairingData = pairResponse.data || pairResponse;
      console.log('🔗 fetchData SUCCESS:', pairingData);
      setPairing(pairingData);
    } catch (err) {
      console.log('🔗 fetchData ERROR:', err.response?.status, err.response?.data);
      if (err.response?.data?.status === 'unpaired') {
        setPairing({ status: 'unpaired' });
      } else if (err.response?.status === 404) {
        setPairing({ status: 'unpaired' });
      } else {
        setError('Не удалось загрузить данные. Попробуйте позже.');
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
    try {
      await pairService.sendRequest({ partnerEmail: email });
      toast.success('Запрос на подключение отправлен!', 'Уведомление отправлено на почту партнера');
      await fetchData();
    } catch (err) {
      console.log('🔗 sendRequest error:', err.response?.status, err.response?.data?.message);
      if (err.response?.status === 409) {
        const errorMsg = err.response?.data?.message || 'Запрос уже существует';
        toast.warning(errorMsg, 'Проверьте статус подключения');
        await fetchData(); // Обновляем данные чтобы показать актуальный статус
      } else if (err.response?.status === 404) {
        toast.error('Пользователь с таким email не найден', 'Проверьте корректность адреса');
      } else if (err.response?.status === 400) {
        const errorMsg = err.response?.data?.message || 'Некорректный email';
        toast.error(errorMsg, 'Проверьте введенные данные');
      } else {
        toast.error('Ошибка отправки запроса', 'Попробуйте позже');
        throw err;
      }
    }
  };
  const acceptRequest = async (requestId) => {
    try {
      await pairService.acceptRequest(requestId);
      toast.success('Запрос принят!', 'Теперь вы связаны с партнером');
      await fetchData();
    } catch (err) {
      toast.error('Ошибка принятия запроса', 'Попробуйте позже');
      throw err;
    }
  };
  const rejectRequest = async (requestId) => {
    try {
      await pairService.rejectRequest(requestId);
      toast.info('Запрос отклонен', 'Партнер получит уведомление');
      await fetchData();
    } catch (err) {
      toast.error('Ошибка отклонения запроса', 'Попробуйте позже');
      throw err;
    }
  };
  const deletePairing = async (pairingId) => {
    try {
      await pairService.deletePairing(pairingId);
      toast.info('Связь с партнером разорвана', 'Вы можете подключиться к новому партнеру');
      await fetchData();
    } catch (err) {
      toast.error('Ошибка отключения', 'Попробуйте позже');
      throw err;
    }
  };

  const fixMutualRequests = async () => {
    try {
      const result = await pairService.fixMutualRequests();
      toast.success('Взаимные запросы исправлены!', 'Теперь вы подключены к партнёру');
      await fetchData();
      return result;
    } catch (err) {
      toast.error('Ошибка исправления запросов', 'Попробуйте позже');
      throw err;
    }
  };
  return {
    pairing,
    isLoading,
    error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    deletePairing,
    fixMutualRequests,
    setError
  };
};

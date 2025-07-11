import api from './api';

const getRooms = async (gameType) => {
  const response = await api.get('/games/rooms', {
    params: { gameType }
  });
  return response.data;
};

const createRoom = async (bet, gameType) => {
  const response = await api.post('/games/rooms', { bet, gameType });
  return response.data;
};

export default {
  getRooms,
  createRoom,
};
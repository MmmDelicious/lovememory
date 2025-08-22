import api from './api';
const getRooms = async (gameType) => {
  const response = await api.get('/games', { params: { gameType } });
  return response.data;
};
const createRoom = async (roomData) => {
  const response = await api.post('/games/room', roomData);
  return response.data;
};
const gameService = {
  getRooms,
  createRoom,
};
export default gameService;

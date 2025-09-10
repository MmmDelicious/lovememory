import api from './api';

/**
 * Сервис для работы с турнирами
 */

// Получить список активных турниров
const getActiveTournaments = async () => {
  const response = await api.get('/tournaments/active');
  return response.data;
};

// Получить турнир по ID с участниками
const getTournamentById = async (tournamentId) => {
  const response = await api.get(`/tournaments/${tournamentId}`);
  return response.data;
};

// Создать новый турнир
const createTournament = async (tournamentData) => {
  const response = await api.post('/tournaments', tournamentData);
  return response.data;
};

// Зарегистрироваться в турнире
const registerForTournament = async (tournamentId) => {
  const response = await api.post(`/tournaments/${tournamentId}/register`);
  return response.data;
};

// Отменить регистрацию в турнире
const unregisterFromTournament = async (tournamentId) => {
  const response = await api.delete(`/tournaments/${tournamentId}/register`);
  return response.data;
};

// Запустить турнир (для создателя)
const startTournament = async (tournamentId) => {
  const response = await api.post(`/tournaments/${tournamentId}/start`);
  return response.data;
};

// Завершить турнир с победителем (для создателя)
const completeTournament = async (tournamentId, winnerId = null) => {
  const response = await api.post(`/tournaments/${tournamentId}/complete`, { winnerId });
  return response.data;
};

// Отменить турнир (для создателя)
const cancelTournament = async (tournamentId, reason = null) => {
  const response = await api.post(`/tournaments/${tournamentId}/cancel`, { reason });
  return response.data;
};

// Получить участников турнира
const getTournamentParticipants = async (tournamentId) => {
  const response = await api.get(`/tournaments/${tournamentId}/participants`);
  return response.data;
};

// Получить турниры по фильтрам
const getTournaments = async (filters = {}) => {
  const response = await api.get('/tournaments', { params: filters });
  return response.data;
};

// Получить турниры, созданные пользователем
const getMyTournaments = async () => {
  const response = await api.get('/tournaments/my');
  return response.data;
};

// Получить турниры, в которых пользователь участвует
const getMyParticipations = async () => {
  const response = await api.get('/tournaments/participations');
  return response.data;
};

// Обновить настройки турнира (для создателя)
const updateTournament = async (tournamentId, updateData) => {
  const response = await api.put(`/tournaments/${tournamentId}`, updateData);
  return response.data;
};

// Получить статистику турнира
const getTournamentStats = async (tournamentId) => {
  const response = await api.get(`/tournaments/${tournamentId}/stats`);
  return response.data;
};

// Получить историю турниров пользователя
const getTournamentHistory = async (limit = 20, offset = 0) => {
  const response = await api.get('/tournaments/history', { 
    params: { limit, offset } 
  });
  return response.data;
};

// Получить состояние турнира (лобби)
const getTournamentLobby = async (tournamentId) => {
  const response = await api.get(`/tournaments/${tournamentId}/lobby`);
  return response.data;
};

// Получить матчи турнира
const getTournamentMatches = async (tournamentId, options = {}) => {
  const response = await api.get(`/tournaments/${tournamentId}/matches`, { params: options });
  return response.data;
};

// Получить матч по ID
const getMatchById = async (tournamentId, matchId) => {
  const response = await api.get(`/tournaments/${tournamentId}/matches/${matchId}`);
  return response.data;
};

// Участник готов к матчу
const setMatchReady = async (tournamentId, matchId) => {
  const response = await api.post(`/tournaments/${tournamentId}/matches/${matchId}/ready`);
  return response.data;
};

// Начать матч
const startMatch = async (tournamentId, matchId) => {
  const response = await api.post(`/tournaments/${tournamentId}/matches/${matchId}/start`);
  return response.data;
};

// Завершить матч
const completeMatch = async (tournamentId, matchId, winnerId) => {
  const response = await api.post(`/tournaments/${tournamentId}/matches/${matchId}/complete`, { winnerId });
  return response.data;
};

const tournamentService = {
  getActiveTournaments,
  getTournamentById,
  createTournament,
  registerForTournament,
  unregisterFromTournament,
  startTournament,
  completeTournament,
  cancelTournament,
  getTournamentParticipants,
  getTournaments,
  getMyTournaments,
  getMyParticipations,
  updateTournament,
  getTournamentStats,
  getTournamentHistory,
  getTournamentLobby,
  getTournamentMatches,
  getMatchById,
  setMatchReady,
  startMatch,
  completeMatch,
};

export default tournamentService;

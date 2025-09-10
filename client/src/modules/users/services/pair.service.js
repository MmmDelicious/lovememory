import api from './api';
const getStatus = () => {
  return api.get('/pair/status');
};
const sendRequest = (partnerEmail) => {
  return api.post('/pair/request', { partnerEmail });
};
const acceptRequest = (requestId) => {
  return api.post(`/pair/accept/${requestId}`, {});
};
const deletePairing = (pairingId) => {
  return api.delete(`/pair/${pairingId}`);
};
const pairService = {
  getStatus,
  sendRequest,
  acceptRequest,
  deletePairing,
};
export default pairService;

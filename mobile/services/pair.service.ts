import { api } from './api';

export function getStatus() {
  return api.get('/pair/status');
}

export function sendRequest(partnerEmail: string) {
  return api.post('/pair/request', { partnerEmail });
}

export function acceptRequest(requestId: string | number) {
  return api.post(`/pair/accept/${requestId}`, {});
}

export function deletePairing(pairingId: string | number) {
  return api.delete(`/pair/${pairingId}`);
}


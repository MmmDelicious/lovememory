import { api } from './api';
import { API_BASE_URL } from './config';

export const FILES_BASE_URL = API_BASE_URL.replace(/\/?api$/, '');

export function getEvents() {
  return api.get('/events');
}

export function createEvent(eventData: any) {
  return api.post('/events', eventData);
}

export function updateEvent(id: string | number, eventData: any) {
  return api.put(`/events/${id}`, eventData);
}

export function deleteEvent(id: string | number) {
  return api.delete(`/events/${id}`);
}

export function getMediaForEvent(eventId: string | number) {
  return api.get(`/events/${eventId}/media`);
}

export function uploadFile(eventId: string | number, file: any) {
  const formData = new FormData();
  formData.append('file', file as any);
  return api.post(`/events/${eventId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function moveMediaToEvent(mediaId: string | number, targetEventId: string | number) {
  return api.put(`/media/${mediaId}/move`, { targetEventId });
}



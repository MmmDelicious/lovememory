import api from './api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
// Strip trailing /api from API base to form static files base (uploads served at root)
const FILES_BASE_URL = API_BASE_URL.replace(/\/?api$/, '');

const getEvents = () => {
  return api.get('/events');
};

const createEvent = (eventData) => {
  return api.post('/events', eventData);
};

const updateEvent = (id, eventData) => {
  return api.put(`/events/${id}`, eventData);
};

const deleteEvent = (id) => {
  return api.delete(`/events/${id}`);
};

const getMediaForEvent = (eventId) => {
  return api.get(`/events/${eventId}/media`);
};

const uploadFile = (eventId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/events/${eventId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
};

const moveMediaToEvent = (mediaId, targetEventId) => {
  return api.put(`/media/${mediaId}/move`, { targetEventId });
};

const eventService = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getMediaForEvent,
  uploadFile,
  moveMediaToEvent,
  API_BASE_URL,
  FILES_BASE_URL,
};

export default eventService;
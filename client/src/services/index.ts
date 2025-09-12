// Services exports - общие API сервисы
// Вместо import api from '../../../services/api'
// Можно import { api } from '@/services'

// Main API
export { default as api } from './api';

// Shared services (те что используются в нескольких модулях)
export { default as authService } from './auth.service';
export { default as userService } from './user.service';
export { default as pairService } from './pair.service';
export { default as sessionService } from './session.service';
export { default as feedbackService } from './feedback.service';
export { eventTemplateService } from './eventTemplate.service';

// Остальные сервисы будут использоваться только внутри своих модулей

// Re-export общих сервисов + специфичные для модуля
import { pairService, userService } from '@/services';
import interestService from './interest.service.js';

export {
  pairService,
  userService,
  interestService
};

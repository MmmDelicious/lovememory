export { apiClient } from './client'
export { authAPI } from './auth'
export { eventsAPI } from './events'
export { gamesAPI } from './games'
export { aiAPI } from './ai'
export { usersAPI } from './users'
export { lessonsAPI } from './lessons'
export { recommendationsAPI } from './recommendations'
export { pairsAPI } from './pairs'
export { dateGeneratorAPI, DateGeneratorAPI } from './dateGenerator'

export type * from './auth/types'
export type * from './events/types'
export type * from './games/types'
export type * from './ai/types'
export type * from './users/types'
export type * from './lessons/types'
export type * from './recommendations/types'
export type * from './pairs/types'
export type * from './dateGenerator/types'

import { apiClient } from './client'

export default apiClient

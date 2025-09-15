/**
 * Pairs API queries and mutations
 */
import { apiClient } from '../client'
import type {
  PairStatus,
  SendPairRequestData
} from './types'

const PAIRS_ENDPOINTS = {
  STATUS: '/pair/status',
  REQUEST: '/pair/request',
  ACCEPT: (requestId: string) => `/pair/accept/${requestId}`,
  REJECT: (requestId: string) => `/pair/reject/${requestId}`,
  DELETE: (pairingId: string) => `/pair/${pairingId}`,
  FIX_MUTUAL: '/pair/fix-mutual',
} as const

export class PairsAPI {
  /**
   * Get current pairing status
   */
  async getStatus(): Promise<PairStatus> {
    return apiClient.get<PairStatus>(PAIRS_ENDPOINTS.STATUS)
  }

  /**
   * Send pairing request
   */
  async sendRequest(data: SendPairRequestData): Promise<any> {
    return apiClient.post<any>(PAIRS_ENDPOINTS.REQUEST, data)
  }

  /**
   * Accept pairing request
   */
  async acceptRequest(requestId: string): Promise<any> {
    return apiClient.post<any>(PAIRS_ENDPOINTS.ACCEPT(requestId))
  }

  /**
   * Reject pairing request
   */
  async rejectRequest(requestId: string): Promise<any> {
    return apiClient.post<any>(PAIRS_ENDPOINTS.REJECT(requestId))
  }

  /**
   * Delete existing pairing
   */
  async deletePairing(pairingId: string): Promise<void> {
    return apiClient.delete<void>(PAIRS_ENDPOINTS.DELETE(pairingId))
  }

  /**
   * Fix mutual requests (когда оба пользователя отправили запросы друг другу)
   */
  async fixMutualRequests(): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(PAIRS_ENDPOINTS.FIX_MUTUAL)
  }
}

export const pairsAPI = new PairsAPI()
export default pairsAPI

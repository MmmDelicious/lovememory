/**
 * Pairs domain types
 */

export interface Pair {
  id: string
  user1Id: string
  user2Id: string
  status: 'pending' | 'active' | 'suspended'
  createdAt: string
  updatedAt: string
}

export interface PairRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface PairStatus {
  isPaired: boolean
  pair?: Pair
  pendingRequests?: PairRequest[]
  sentRequests?: PairRequest[]
}

export interface SendPairRequestData {
  partnerEmail: string
}

/**
 * Users domain types
 */

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  gender?: 'male' | 'female'
  dateOfBirth?: string
  location?: string
  interests?: Interest[]
  bio?: string
}

export interface Interest {
  id: string
  name: string
  category?: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  gender?: 'male' | 'female'
  dateOfBirth?: string
  location?: string
  bio?: string
  interests?: string[]
}

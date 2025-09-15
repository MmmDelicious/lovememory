/**
 * Events domain types
 */

export interface Event {
  id: string
  userId: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  location?: string
  category?: string
  coverPhoto?: string
  photos?: MediaFile[]
  createdAt: string
  updatedAt: string
}

export interface MediaFile {
  id: string
  eventId: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
  thumbnailUrl?: string
  createdAt: string
}

export interface CreateEventRequest {
  title: string
  description?: string
  startDate: string
  endDate?: string
  location?: string
  category?: string
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  id: string
}

export interface UploadFileRequest {
  eventId: string
  file: File
}

export interface MoveMediaRequest {
  mediaId: string
  targetEventId: string
}

export interface SetDayCoverRequest {
  eventId: string
  mediaId: string
}

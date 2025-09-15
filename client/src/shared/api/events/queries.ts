/**
 * Events API queries and mutations
 */
import { apiClient } from '../client'
import type {
  Event,
  MediaFile,
  CreateEventRequest,
  UpdateEventRequest,
  MoveMediaRequest,
  SetDayCoverRequest
} from './types'

const EVENTS_ENDPOINTS = {
  EVENTS: '/events',
  EVENT: (id: string) => `/events/${id}`,
  EVENT_MEDIA: (id: string) => `/events/${id}/media`,
  EVENT_UPLOAD: (id: string) => `/events/${id}/upload`,
  EVENT_SET_COVER: (id: string) => `/events/${id}/set-day-cover`,
  MEDIA: (id: string) => `/media/${id}`,
  MEDIA_MOVE: (id: string) => `/media/${id}/move`,
} as const

export class EventsAPI {
  /**
   * Get all events for current user
   */
  async getEvents(): Promise<Event[]> {
    return apiClient.get<Event[]>(EVENTS_ENDPOINTS.EVENTS)
  }

  /**
   * Create new event
   */
  async createEvent(eventData: CreateEventRequest): Promise<Event> {
    return apiClient.post<Event>(EVENTS_ENDPOINTS.EVENTS, eventData)
  }

  /**
   * Update existing event
   */
  async updateEvent(id: string, eventData: Partial<CreateEventRequest>): Promise<Event> {
    return apiClient.put<Event>(EVENTS_ENDPOINTS.EVENT(id), eventData)
  }

  /**
   * Delete event
   */
  async deleteEvent(id: string): Promise<void> {
    return apiClient.delete<void>(EVENTS_ENDPOINTS.EVENT(id))
  }

  /**
   * Get media files for event
   */
  async getMediaForEvent(eventId: string): Promise<MediaFile[]> {
    return apiClient.get<MediaFile[]>(EVENTS_ENDPOINTS.EVENT_MEDIA(eventId))
  }

  /**
   * Upload file to event
   */
  async uploadFile(eventId: string, file: File): Promise<MediaFile> {
    return apiClient.uploadFile<MediaFile>(EVENTS_ENDPOINTS.EVENT_UPLOAD(eventId), file)
  }

  /**
   * Move media file to another event
   */
  async moveMediaToEvent(data: MoveMediaRequest): Promise<void> {
    return apiClient.put<void>(EVENTS_ENDPOINTS.MEDIA_MOVE(data.mediaId), {
      targetEventId: data.targetEventId
    })
  }

  /**
   * Set day cover photo
   */
  async setDayCover(data: SetDayCoverRequest): Promise<void> {
    return apiClient.put<void>(EVENTS_ENDPOINTS.EVENT_SET_COVER(data.eventId), {
      mediaId: data.mediaId
    })
  }

  /**
   * Delete media file
   */
  async deleteMedia(mediaId: string): Promise<void> {
    return apiClient.delete<void>(EVENTS_ENDPOINTS.MEDIA(mediaId))
  }

  /**
   * Get file URLs for display
   */
  getFileUrl(filename: string): string {
    return `${apiClient.filesBaseURL}/uploads/${filename}`
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(filename: string): string {
    return `${apiClient.filesBaseURL}/uploads/thumbnails/${filename}`
  }
}

// Singleton instance
export const eventsAPI = new EventsAPI()
export default eventsAPI

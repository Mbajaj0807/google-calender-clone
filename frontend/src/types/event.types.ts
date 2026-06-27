// NOTE: must match the backend Mongoose enum exactly (Event.model.js).
// 'professional' was previously listed here but the backend never accepted it —
// keeping the two in sync so created/filtered events don't fail server validation.
export type EventType = 'meeting' | 'personal' | 'goal' | 'holiday';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type EventStatus = 'scheduled' | 'cancelled' | 'completed';
export type Visibility = 'private' | 'organization';
export type DashboardMode = 'professional' | 'personal';
export type CalendarView = 'month' | 'week' | 'day';

export interface Organizer {
  _id: string;
  name: string;
  email: string;
}

export interface Participant {
  _id: string;
  name: string;
  email: string;
  profilePicture: string;
}

export interface CalendarEvent {
  _id: string;
  title: string;
  description: string;
  agenda: string;
  notes: string;
  location: string;
  eventType: EventType;
  priority: Priority;
  visibility: Visibility;
  startTime: string;
  endTime: string;
  recurrenceRule: string | null;
  color: string;
  protectedPersonal: boolean;
  organizerId: Organizer | string;
  participantIds: Participant[];
  attachmentUrls: string[];
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
}

// ---- Create Event flow ----

export interface CreateEventPayload {
  title: string;
  description?: string;
  agenda?: string;
  notes?: string;
  location?: string;
  eventType: EventType;
  priority: Priority;
  visibility: Visibility;
  startTime: string; // ISO UTC
  endTime: string;   // ISO UTC
  recurrenceRule?: string | null;
  color?: string;
  protectedPersonal?: boolean;
  organizationId?: string;
  participantIds?: string[];
  attachmentUrls?: string[];
}

export interface CreateEventResponse {
  event: CalendarEvent;
}

// POST /events/check-conflict -> { conflicts: string[] } (participant user IDs)
export interface CheckConflictResponse {
  conflicts: string[];
}

// POST /events/find-availability -> { slots: { start, end }[] }
export interface AvailabilitySlot {
  start: string; // ISO UTC
  end: string;   // ISO UTC
}

export interface FindAvailabilityResponse {
  slots: AvailabilitySlot[];
}
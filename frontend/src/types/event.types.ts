export type EventType = 'personal' | 'meeting' | 'professional' | 'goal' | 'holiday';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type EventStatus = 'scheduled' | 'cancelled' | 'completed';
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
  visibility: 'private' | 'organization';
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
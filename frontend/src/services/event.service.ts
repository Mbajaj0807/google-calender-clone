import api from './api';
import type {
  CalendarEventsResponse,
  CreateEventPayload,
  CreateEventResponse,
  CheckConflictResponse,
  FindAvailabilityResponse,
} from '../types/event.types';

export const eventService = {
  async getCalendarEvents(start: string, end: string): Promise<CalendarEventsResponse> {
    const { data } = await api.get<CalendarEventsResponse>('/events/calendar', {
      params: { start, end },
    });
    return data;
  },

  async searchEvents(q: string) {
    const { data } = await api.get<CalendarEventsResponse>('/events/search', {
      params: { q },
    });
    return data;
  },

  async createEvent(payload: CreateEventPayload): Promise<CreateEventResponse> {
    const { data } = await api.post<CreateEventResponse>('/events', payload);
    return data;
  },

  /**
   * Returns the user IDs (out of `participants`) who have a conflicting
   * event in [startTime, endTime]. Does NOT return names — see
   * userService.getUsers() to resolve IDs to display info.
   */
  async checkConflict(
    participants: string[],
    startTime: string,
    endTime: string
  ): Promise<CheckConflictResponse> {
    const { data } = await api.post<CheckConflictResponse>('/events/check-conflict', {
      participants,
      startTime,
      endTime,
    });
    return data;
  },

  async findAvailability(
    participants: string[],
    windowStart: string,
    windowEnd: string,
    duration: number
  ): Promise<FindAvailabilityResponse> {
    const { data } = await api.post<FindAvailabilityResponse>('/events/find-availability', {
      participants,
      windowStart,
      windowEnd,
      duration,
    });
    return data;
  },
};
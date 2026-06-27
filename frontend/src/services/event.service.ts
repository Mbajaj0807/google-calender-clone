import api from './api';
import type { CalendarEventsResponse } from '../types/event.types';

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
};
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, isToday,
  parseISO, format,
} from 'date-fns';
import type { CalendarEvent, EventType } from '../../../types/event.types';

export interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

// Build the 6-row × 7-col grid Google Calendar uses
export function buildMonthGrid(
  currentDate: Date,
  events: CalendarEvent[],
  activeFilters: Set<EventType>
): DayCell[] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sun
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return days.map((date) => {
    const dayEvents = events
      .filter((e) => {
        if (!activeFilters.has(e.eventType)) return false;
        const start = parseISO(e.startTime);
        return isSameDay(start, date);
      })
      .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime());

    return {
      date,
      isCurrentMonth: isSameMonth(date, currentDate),
      isToday: isToday(date),
      events: dayEvents,
    };
  });
}

// Colour mapping per event type (fallback to event.color if set)
export function getEventColor(event: CalendarEvent): string {
  if (event.color) return event.color;
  const defaults: Record<EventType, string> = {
    personal: '#34A853',
    meeting: '#4285F4',
    goal: '#A142F4',
    holiday: '#EA4335',
  };
  return defaults[event.eventType] ?? '#4285F4';
}

export function getPriorityBorderColor(priority: string): string {
  const map: Record<string, string> = {
    critical: '#EA4335',
    high: '#FF6D00',
    medium: '#FBBC04',
    low: '#9AA0A6',
  };
  return map[priority] ?? 'transparent';
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'h:mm a');
}
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  subDays, addDays, formatISO,
} from 'date-fns';
import { eventService } from '../services/event.service';
import type { CalendarView } from '../types/event.types';

// Fetch a slightly wider window than what's visible so events on the edge
// (e.g. the trailing days of a month grid, or a multi-day all-day event
// peeking into the week) always appear — no extra network calls.
export function useCalendarEvents(currentDate: Date, view: CalendarView) {
  const { start, end } = useMemo(() => {
    if (view === 'day') {
      return {
        start: formatISO(subDays(currentDate, 1)),
        end: formatISO(addDays(currentDate, 1)),
      };
    }
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return {
        start: formatISO(subDays(weekStart, 1)),
        end: formatISO(addDays(weekEnd, 1)),
      };
    }
    return {
      start: formatISO(subDays(startOfMonth(currentDate), 7)),
      end: formatISO(addDays(endOfMonth(currentDate), 7)),
    };
  }, [currentDate, view]);

  return useQuery({
    queryKey: ['calendar-events', view, start, end],
    queryFn: () => eventService.getCalendarEvents(start, end),
    staleTime: 1000 * 60 * 2,       // 2 min — fast enough for real-time feel
    gcTime: 1000 * 60 * 10,         // keep in cache 10 min
    select: (data) => data.events,
    placeholderData: (prev) => prev, // no loading flash on navigation
  });
}
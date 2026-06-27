import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, subDays, addDays, formatISO } from 'date-fns';
import { eventService } from '../services/event.service';

// Fetch a slightly wider window than the visible month so
// events on the edge rows always appear — no extra network calls.
export function useCalendarEvents(currentDate: Date) {
  const start = formatISO(subDays(startOfMonth(currentDate), 7));
  const end = formatISO(addDays(endOfMonth(currentDate), 7));

  return useQuery({
    queryKey: ['calendar-events', start, end],
    queryFn: () => eventService.getCalendarEvents(start, end),
    staleTime: 1000 * 60 * 2,       // 2 min — fast enough for real-time feel
    gcTime: 1000 * 60 * 10,         // keep in cache 10 min
    select: (data) => data.events,
    placeholderData: (prev) => prev, // no loading flash on month navigation
  });
}
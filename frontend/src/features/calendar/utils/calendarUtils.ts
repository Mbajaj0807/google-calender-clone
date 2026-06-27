import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, isToday,
  parseISO, format, addDays, startOfDay, endOfDay,
} from 'date-fns';
import type { CalendarEvent, EventType, CalendarView } from '../../../types/event.types';

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

// ---- Week / Day view helpers ----

/** The 7 days (Sun–Sat) of the week containing `currentDate`. */
export function getWeekDays(currentDate: Date): Date[] {
  const start = startOfWeek(currentDate, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Header label for the week view, e.g. "Jun 22 – 28, 2026" or, when the
 *  week spans two months/years, "May 31 – Jun 6, 2026". */
export function formatWeekRangeLabel(currentDate: Date): string {
  const start = startOfWeek(currentDate, { weekStartsOn: 0 });
  const end = endOfWeek(currentDate, { weekStartsOn: 0 });

  if (isSameMonth(start, end)) {
    return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
}

/** Header label for the day view, e.g. "Sunday, June 28, 2026". */
export function formatDayLabel(date: Date): string {
  return format(date, 'EEEE, MMMM d, yyyy');
}

/** Picks the right header label for whichever view is active. */
export function formatHeaderLabel(date: Date, view: CalendarView): string {
  if (view === 'month') return formatMonthYear(date);
  if (view === 'week') return formatWeekRangeLabel(date);
  return formatDayLabel(date);
}

/**
 * An event counts as "all-day" if it runs ~a full day or longer (holidays,
 * multi-day blocks, etc). These render as a banner above the hour grid
 * instead of being squeezed into a timed slot.
 */
export function isAllDayEvent(event: CalendarEvent): boolean {
  const start = parseISO(event.startTime);
  const end = parseISO(event.endTime);
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return durationHours >= 20;
}

export interface AllDayBannerItem {
  event: CalendarEvent;
  /** 1-based CSS grid-column start, inclusive */
  startCol: number;
  /** 1-based CSS grid-column end, exclusive (i.e. for grid-column shorthand) */
  endCol: number;
}

/** All-day events that overlap the visible `days` range, clipped to it and
 *  positioned as CSS grid-column spans for the banner row. */
export function getAllDayBannerItems(
  events: CalendarEvent[],
  days: Date[],
  activeFilters: Set<EventType>
): AllDayBannerItem[] {
  if (days.length === 0) return [];
  const rangeStart = startOfDay(days[0]);
  const rangeEnd = endOfDay(days[days.length - 1]);

  return events
    .filter((e) => activeFilters.has(e.eventType) && isAllDayEvent(e))
    .filter((e) => {
      const s = parseISO(e.startTime);
      const en = parseISO(e.endTime);
      return s <= rangeEnd && en >= rangeStart;
    })
    .map((e) => {
      const s = parseISO(e.startTime);
      const en = parseISO(e.endTime);
      // Each visible day represents the half-open interval [day, day+1).
      // Find every day the event overlaps under that interpretation —
      // this avoids an off-by-one where an exact 24h event ending at
      // midnight would otherwise appear to spill into the next column.
      let startIdx = -1;
      let endIdx = -1;
      for (let i = 0; i < days.length; i++) {
        const dayStart = days[i];
        const dayEnd = addDays(dayStart, 1);
        if (s < dayEnd && en > dayStart) {
          if (startIdx === -1) startIdx = i;
          endIdx = i;
        }
      }
      if (startIdx === -1) { startIdx = 0; endIdx = 0; } // shouldn't happen, just a safe fallback
      return { event: e, startCol: startIdx + 1, endCol: endIdx + 2 };
    });
}

/** Timed (non all-day) events that start on `day`, sorted by start time. */
export function getTimedEventsForDay(
  events: CalendarEvent[],
  day: Date,
  activeFilters: Set<EventType>
): CalendarEvent[] {
  return events
    .filter((e) => activeFilters.has(e.eventType) && !isAllDayEvent(e))
    .filter((e) => isSameDay(parseISO(e.startTime), day))
    .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime());
}

export interface PositionedEvent {
  event: CalendarEvent;
  /** % from the top of the day column */
  top: number;
  /** % height of the day column */
  height: number;
  /** % from the left of the day column */
  left: number;
  /** % width of the day column */
  width: number;
}

const MIN_EVENT_MINUTES = 30; // visual floor so short events stay tappable/readable

/**
 * Lays out a single day's timed events into top/height/left/width
 * percentages, packing overlapping events into side-by-side columns
 * (the same general approach Google Calendar's week/day view uses).
 */
export function layoutDayEvents(dayEvents: CalendarEvent[]): PositionedEvent[] {
  interface Item { event: CalendarEvent; startMin: number; endMin: number; }

  const items: Item[] = dayEvents.map((event) => {
    const start = parseISO(event.startTime);
    const end = parseISO(event.endTime);
    const startMin = start.getHours() * 60 + start.getMinutes();
    let endMin = isSameDay(start, end)
      ? end.getHours() * 60 + end.getMinutes()
      : 24 * 60; // multi-day event — clip to end of this day's column
    endMin = Math.max(endMin, startMin + MIN_EVENT_MINUTES);
    endMin = Math.min(endMin, 24 * 60);
    return { event, startMin, endMin };
  }).sort((a, b) => (a.startMin - b.startMin) || (a.endMin - b.endMin));

  const positioned: PositionedEvent[] = [];
  let cluster: Item[] = [];
  let clusterEnd = -1;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const colLastEnd: number[] = [];
    const colOf: number[] = [];

    cluster.forEach((item, idx) => {
      let placed = false;
      for (let c = 0; c < colLastEnd.length; c++) {
        if (item.startMin >= colLastEnd[c]) {
          colOf[idx] = c;
          colLastEnd[c] = item.endMin;
          placed = true;
          break;
        }
      }
      if (!placed) {
        colOf[idx] = colLastEnd.length;
        colLastEnd.push(item.endMin);
      }
    });

    const totalCols = colLastEnd.length;
    cluster.forEach((item, idx) => {
      const col = colOf[idx];
      positioned.push({
        event: item.event,
        top: (item.startMin / 1440) * 100,
        height: ((item.endMin - item.startMin) / 1440) * 100,
        left: (col / totalCols) * 100,
        width: (1 / totalCols) * 100,
      });
    });
  };

  for (const item of items) {
    if (cluster.length === 0 || item.startMin < clusterEnd) {
      cluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMin);
    } else {
      flushCluster();
      cluster = [item];
      clusterEnd = item.endMin;
    }
  }
  flushCluster();

  return positioned;
}
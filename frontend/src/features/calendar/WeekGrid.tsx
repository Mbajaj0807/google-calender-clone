import React, { useMemo } from 'react';
import TimeGrid from './TimeGrid';
import { getWeekDays } from './utils/calendarUtils';
import type { CalendarEvent } from '../../types/event.types';
import { useCalendarStore } from '../../store/calendarStore';

interface Props {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  /** Called with the precise clicked date+time, for creating an event there. */
  onSlotClick: (date: Date) => void;
}

const WeekGrid: React.FC<Props> = ({ events, onEventClick, onSlotClick }) => {
  const { currentDate, activeFilters, setCurrentDate, setView } = useCalendarStore();
  const days = useMemo(() => getWeekDays(currentDate), [currentDate]);

  return (
    <TimeGrid
      days={days}
      events={events}
      activeFilters={activeFilters}
      onEventClick={onEventClick}
      onSlotClick={onSlotClick}
      dense={false}
      onHeaderDateClick={(date) => {
        // Matches Google Calendar: clicking a day's number in week view
        // drills into the day view for that date.
        setCurrentDate(date);
        setView('day');
      }}
    />
  );
};

export default WeekGrid;
import React, { useMemo } from 'react';
import TimeGrid from './TimeGrid';
import type { CalendarEvent } from '../../types/event.types';
import { useCalendarStore } from '../../store/calendarStore';

interface Props {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  /** Called with the precise clicked date+time, for creating an event there. */
  onSlotClick: (date: Date) => void;
}

const DayGrid: React.FC<Props> = ({ events, onEventClick, onSlotClick }) => {
  const { currentDate, activeFilters } = useCalendarStore();
  const days = useMemo(() => [currentDate], [currentDate]);

  return (
    <TimeGrid
      days={days}
      events={events}
      activeFilters={activeFilters}
      onEventClick={onEventClick}
      onSlotClick={onSlotClick}
      dense
    />
  );
};

export default DayGrid;
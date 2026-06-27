import React, { useMemo, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { buildMonthGrid } from './utils/calendarUtils';
import EventPill from './EventPill';
import type { CalendarEvent, EventType } from '../../types/event.types';
import { useCalendarStore } from '../../store/calendarStore';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_VISIBLE = 3; // pills per day before "+N more"

interface Props {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

const MonthGrid: React.FC<Props> = ({ events, onEventClick, onDateClick }) => {
  const { currentDate, activeFilters } = useCalendarStore();
  const [expandedDay, setExpandedDay] = useState<Date | null>(null);

  const grid = useMemo(
    () => buildMonthGrid(currentDate, events, activeFilters),
    [currentDate, events, activeFilters]
  );

  const today = new Date();

  return (
    <div className="flex flex-col flex-1 min-h-0 select-none">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid — 6 rows */}
      <div className="grid grid-cols-7 flex-1 min-h-0" style={{ gridTemplateRows: 'repeat(6, 1fr)' }}>
        {grid.map((cell, idx) => {
          const isExpanded = expandedDay !== null && isSameDay(cell.date, expandedDay);
          const visibleEvents = isExpanded ? cell.events : cell.events.slice(0, MAX_VISIBLE);
          const overflow = cell.events.length - MAX_VISIBLE;

          return (
            <div
              key={idx}
              className={`
                relative border-b border-r border-gray-200 p-1 overflow-hidden
                transition-colors duration-100 cursor-pointer
                ${!cell.isCurrentMonth ? 'bg-gray-50/60' : 'bg-white hover:bg-gray-50/40'}
              `}
              onClick={() => onDateClick(cell.date)}
            >
              {/* Date number */}
              <div className="flex justify-center mb-0.5">
                <span
                  className={`
                    inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-normal
                    transition-colors duration-100
                    ${cell.isToday
                      ? 'bg-blue-600 text-white font-medium'
                      : cell.isCurrentMonth
                        ? 'text-gray-900 hover:bg-gray-100'
                        : 'text-gray-400'
                    }
                  `}
                >
                  {format(cell.date, 'd')}
                </span>
              </div>

              {/* Event pills */}
              <div className="space-y-0.5">
                {visibleEvents.map((event) => (
                  <EventPill
                    key={event._id}
                    event={event}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  />
                ))}

                {/* "+N more" overflow */}
                {!isExpanded && overflow > 0 && (
                  <button
                    className="w-full text-left text-xs text-blue-600 font-medium px-1.5 py-0.5
                               hover:bg-blue-50 rounded-sm transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDay(isExpanded ? null : cell.date);
                    }}
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthGrid;
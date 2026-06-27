import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format, isSameDay, isToday as isTodayFn } from 'date-fns';
import EventBlock from './EventBlock';
import {
  getAllDayBannerItems,
  getTimedEventsForDay,
  layoutDayEvents,
  getEventColor,
} from './utils/calendarUtils';
import type { CalendarEvent, EventType } from '../../types/event.types';

const HOUR_HEIGHT = 56; // px per hour — tune this to zoom the grid in/out
const TOTAL_HEIGHT = HOUR_HEIGHT * 24;
const GUTTER_WIDTH = 56; // px — width of the time-label column

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HALF_HOURS = Array.from({ length: 48 }, (_, i) => i);

function hourLabel(h: number): string {
  if (h === 0) return '';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

interface Props {
  days: Date[];
  events: CalendarEvent[];
  activeFilters: Set<EventType>;
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (date: Date) => void;
  /** day view = true (wide single column, show more detail per event) */
  dense?: boolean;
  /** clicking a day's header number jumps into day view for that date */
  onHeaderDateClick?: (date: Date) => void;
}

const TimeGrid: React.FC<Props> = ({
  days, events, activeFilters, onEventClick, onSlotClick, dense = false, onHeaderDateClick,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, forceTick] = useState(0);

  // Re-render once a minute so the "current time" line keeps moving.
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // On mount, scroll to a sensible starting point: a little above "now" if
  // today is visible, otherwise default to ~7am like Google Calendar does.
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const todayVisible = days.some((d) => isSameDay(d, now));
    const anchorHour = todayVisible ? Math.max(0, now.getHours() - 2) : 7;
    scrollRef.current.scrollTop = anchorHour * HOUR_HEIGHT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allDayItems = useMemo(
    () => getAllDayBannerItems(events, days, activeFilters),
    [events, days, activeFilters]
  );

  const handleSlotClick = (day: Date, halfHourIndex: number) => {
    const d = new Date(day);
    d.setHours(0, halfHourIndex * 30, 0, 0);
    onSlotClick(d);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 select-none">
      {/* Day-of-week header row */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        <div style={{ width: GUTTER_WIDTH }} className="flex-shrink-0" />
        {days.map((day, i) => {
          const today = isTodayFn(day);
          return (
            <div key={i} className="flex-1 flex flex-col items-center py-1.5 min-w-0">
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                {format(day, 'EEE')}
              </span>
              <button
                onClick={() => onHeaderDateClick?.(day)}
                className={`
                  mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full text-base
                  transition-colors duration-100 focus:outline-none
                  ${today ? 'bg-blue-600 text-white font-medium' : 'text-gray-900 hover:bg-gray-100'}
                `}
                title={format(day, 'EEEE, MMMM d, yyyy')}
              >
                {format(day, 'd')}
              </button>
            </div>
          );
        })}
      </div>

      {/* All-day banner row — only rendered when there's something to show */}
      {allDayItems.length > 0 && (
        <div className="flex border-b border-gray-200 flex-shrink-0 py-1">
          <div style={{ width: GUTTER_WIDTH }} className="flex-shrink-0" />
          <div
            className="flex-1 grid gap-0.5 px-0.5"
            style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}
          >
            {allDayItems.map(({ event, startCol, endCol }) => (
              <button
                key={event._id}
                onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                style={{ gridColumn: `${startCol} / ${endCol}`, backgroundColor: getEventColor(event) }}
                className="text-white text-xs font-medium rounded-sm px-2 py-0.5 truncate text-left
                           hover:brightness-95 transition-[filter] focus:outline-none"
                title={event.title}
              >
                {event.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable hour grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="flex" style={{ height: TOTAL_HEIGHT }}>
          {/* Time gutter */}
          <div style={{ width: GUTTER_WIDTH }} className="relative flex-shrink-0">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-gray-500 whitespace-nowrap"
                style={{ top: h * HOUR_HEIGHT }}
              >
                {hourLabel(h)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
            {days.map((day, di) => {
              const dayEvents = getTimedEventsForDay(events, day, activeFilters);
              const positioned = layoutDayEvents(dayEvents);
              const today = isTodayFn(day);
              const now = new Date();
              const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;

              return (
                <div
                  key={di}
                  className={`relative ${di > 0 ? 'border-l border-gray-100' : ''}`}
                >
                  {/* Hover/click half-hour slots */}
                  {HALF_HOURS.map((i) => (
                    <div
                      key={i}
                      onClick={() => handleSlotClick(day, i)}
                      className="absolute left-0 right-0 hover:bg-blue-50/60 cursor-pointer transition-colors"
                      style={{ top: `${(i / 48) * 100}%`, height: `${(1 / 48) * 100}%` }}
                    />
                  ))}

                  {/* Hour gridlines (visual only) */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-gray-100 pointer-events-none"
                      style={{ top: `${(h / 24) * 100}%` }}
                    />
                  ))}

                  {/* Events */}
                  {positioned.map((pe) => (
                    <EventBlock
                      key={pe.event._id}
                      positioned={pe}
                      dense={dense}
                      onClick={(e) => { e.stopPropagation(); onEventClick(pe.event); }}
                    />
                  ))}

                  {/* Current-time indicator */}
                  {today && (
                    <div
                      className="absolute left-0 right-0 pointer-events-none z-20 flex items-center"
                      style={{ top: `${nowTop}%` }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
                      <span className="flex-1 h-px bg-red-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeGrid;
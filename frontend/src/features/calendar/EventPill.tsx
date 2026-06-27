import React from 'react';
import type { CalendarEvent } from '../../types/event.types';
import { getEventColor, getPriorityBorderColor, formatTime } from './utils/calendarUtils';

interface Props {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
}

const EventPill: React.FC<Props> = ({ event, onClick }) => {
  const bg = getEventColor(event);
  const borderColor = getPriorityBorderColor(event.priority);

  return (
    <button
      onClick={onClick}
      className="w-full text-left truncate rounded-sm px-1.5 py-0.5 text-xs font-medium
                 text-white leading-5 hover:opacity-90 active:opacity-75 transition-opacity
                 focus:outline-none focus:ring-1 focus:ring-white/50 group"
      style={{
        backgroundColor: bg,
        borderLeft: event.priority === 'critical' || event.priority === 'high'
          ? `3px solid ${borderColor}`
          : undefined,
      }}
      title={event.title}
    >
      <span className="flex items-center gap-1 truncate">
        {event.protectedPersonal && (
          <svg className="w-2.5 h-2.5 flex-shrink-0 opacity-90" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        )}
        <span className="truncate">
          <span className="opacity-80 mr-0.5">{formatTime(event.startTime)}</span>
          {event.title}
        </span>
      </span>
    </button>
  );
};

export default EventPill;
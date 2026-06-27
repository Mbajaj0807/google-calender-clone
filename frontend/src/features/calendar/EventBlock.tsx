import React from 'react';
import { getEventColor, getPriorityBorderColor, formatTime } from './utils/calendarUtils';
import type { PositionedEvent } from './utils/calendarUtils';

interface Props {
  positioned: PositionedEvent;
  dense: boolean; // true = day view (wide column, show more detail)
  onClick: (e: React.MouseEvent) => void;
}

const EventBlock: React.FC<Props> = ({ positioned, dense, onClick }) => {
  const { event, top, height, left, width } = positioned;
  const bg = getEventColor(event);
  const borderColor = getPriorityBorderColor(event.priority);
  const isTentative = event.myInvitationStatus === 'tentative';
  // Below ~1.5% of a 24h column (~22px at typical heights) there's only
  // room for a single truncated line — match Google's own behaviour of
  // dropping the time label on very short events.
  const isShort = height < 3;

  return (
    <button
      onClick={onClick}
      className="absolute rounded-md px-1.5 text-left overflow-hidden text-white
                 hover:brightness-95 active:brightness-90 transition-[filter]
                 focus:outline-none focus:ring-2 focus:ring-white/70 shadow-sm"
      style={{
        top: `${top}%`,
        height: `${height}%`,
        left: `calc(${left}% + 1px)`,
        width: `calc(${width}% - 2px)`,
        backgroundColor: isTentative ? 'white' : bg,
        backgroundImage: isTentative
          ? `repeating-linear-gradient(135deg, ${bg}22 0, ${bg}22 4px, transparent 4px, transparent 8px)`
          : undefined,
        border: isTentative ? `1px solid ${bg}` : undefined,
        color: isTentative ? bg : undefined,
        borderLeft: event.priority === 'critical' || event.priority === 'high'
          ? `3px solid ${borderColor}`
          : undefined,
        paddingTop: dense ? 4 : 2,
        zIndex: 10,
      }}
      title={event.title}
    >
      <span className={`flex items-start gap-1 ${dense ? 'flex-col' : 'flex-row items-center'}`}>
        <span className="flex items-center gap-1 min-w-0">
          {event.protectedPersonal && (
            <svg className="w-2.5 h-2.5 flex-shrink-0 opacity-90" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
          {isTentative && (
            <span
              className="flex-shrink-0 w-2.5 h-2.5 rounded-full text-[8px] font-bold flex items-center justify-center"
              style={{ backgroundColor: bg, color: 'white' }}
              aria-label="Tentative"
            >
              ?
            </span>
          )}
          <span className={`truncate font-medium ${dense ? 'text-sm' : 'text-xs leading-4'}`}>
            {event.title}
          </span>
        </span>
        {!isShort && (
          <span className={`truncate ${dense ? 'text-xs opacity-90' : 'text-[11px] opacity-80'}`}>
            {formatTime(event.startTime)}{dense ? ` – ${formatTime(event.endTime)}` : ''}
          </span>
        )}
      </span>
      {dense && event.location && height > 8 && (
        <span className="block truncate text-xs opacity-90 mt-0.5">{event.location}</span>
      )}
    </button>
  );
};

export default EventBlock;
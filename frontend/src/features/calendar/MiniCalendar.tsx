import React, { useState } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths,
} from 'date-fns';
import { useCalendarStore } from '../../store/calendarStore';

const MiniCalendar: React.FC = () => {
  const { currentDate, setCurrentDate } = useCalendarStore();
  const [miniDate, setMiniDate] = useState(new Date(currentDate));

  const monthStart = startOfMonth(miniDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(miniDate), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="px-3 pt-2 pb-3 select-none">
      {/* Mini header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{format(miniDate, 'MMMM yyyy')}</span>
        <div className="flex gap-0.5">
          <button
            onClick={() => setMiniDate(subMonths(miniDate, 1))}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setMiniDate(addMonths(miniDate, 1))}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day letters */}
      <div className="grid grid-cols-7 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-400 py-0.5">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day, i) => {
          const isSelected = isSameDay(day, currentDate);
          const today = isToday(day);
          const inMonth = isSameMonth(day, miniDate);

          return (
            <button
              key={i}
              onClick={() => {
                setCurrentDate(day);
                setMiniDate(day);
              }}
              className={`
                w-7 h-7 mx-auto flex items-center justify-center rounded-full text-xs
                transition-colors duration-100 focus:outline-none
                ${isSelected && today ? 'bg-blue-600 text-white font-medium' : ''}
                ${isSelected && !today ? 'bg-blue-100 text-blue-700 font-medium' : ''}
                ${!isSelected && today ? 'text-blue-600 font-medium hover:bg-blue-50' : ''}
                ${!isSelected && !today && inMonth ? 'text-gray-800 hover:bg-gray-100' : ''}
                ${!inMonth ? 'text-gray-300' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
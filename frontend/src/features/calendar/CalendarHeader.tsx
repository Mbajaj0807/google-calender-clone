import React, { useState, useRef, useEffect } from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { formatMonthYear } from './utils/calendarUtils';
import type { DashboardMode } from '../../types/event.types';

interface Props {
  onSearch: (q: string) => void;
}

const CalendarHeader: React.FC<Props> = ({ onSearch }) => {
  const {
    currentDate, dashboardMode, setDashboardMode,
    goToPrevMonth, goToNextMonth, goToToday,
    setDrawerOpen,
  } = useCalendarStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  };

  const clearSearch = () => {
    setSearchValue('');
    onSearch('');
    setSearchOpen(false);
  };

  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white z-20 flex-shrink-0">
      {/* Hamburger */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 focus:outline-none"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Google Calendar logo + wordmark */}
      <div className="flex items-center gap-2 mr-2">
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="6" fill="white" />
          <rect x="1" y="1" width="38" height="38" rx="5" stroke="#DADCE0" strokeWidth="1" />
          <rect x="1" y="1" width="38" height="11" rx="5" fill="#1A73E8" />
          <rect x="1" y="7" width="38" height="5" fill="#1A73E8" />
          <rect x="10" y="4" width="3.5" height="7" rx="1.75" fill="white" />
          <rect x="26.5" y="4" width="3.5" height="7" rx="1.75" fill="white" />
          <text x="20" y="30" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1A73E8" fontFamily="sans-serif">
            {new Date().getDate()}
          </text>
        </svg>
        <span className="text-xl font-normal text-gray-700 tracking-tight hidden sm:block">Calendar</span>
      </div>

      {/* Today button */}
      <button
        onClick={goToToday}
        className="px-4 py-1.5 text-sm font-medium text-gray-700 border border-gray-300
                   rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none"
      >
        Today
      </button>

      {/* Prev / Next */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={goToPrevMonth}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-600 focus:outline-none"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={goToNextMonth}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-600 focus:outline-none"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Month / Year label */}
      <h2 className="text-xl font-normal text-gray-700 min-w-[160px]">
        {formatMonthYear(currentDate)}
      </h2>

      <div className="flex-1" />

      {/* Search */}
      <div className={`flex items-center transition-all duration-200 ${searchOpen ? 'w-56' : 'w-auto'}`}>
        {searchOpen ? (
          <div className="flex items-center w-full bg-gray-100 rounded-full px-3 py-1.5 gap-2">
            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Search events"
              className="bg-transparent text-sm text-gray-800 placeholder-gray-500 flex-1 outline-none"
              onKeyDown={(e) => e.key === 'Escape' && clearSearch()}
            />
            {searchValue && (
              <button onClick={clearSearch} className="text-gray-500 hover:text-gray-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 focus:outline-none"
            aria-label="Search"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Dashboard mode toggle */}
      <div className="flex items-center bg-gray-100 rounded-full p-0.5 gap-0.5">
        {(['professional', 'personal'] as DashboardMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setDashboardMode(mode)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 capitalize
              ${dashboardMode === mode
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Settings / Account */}
      <button
        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-600 focus:outline-none"
        aria-label="Settings"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </header>
  );
};

export default CalendarHeader;
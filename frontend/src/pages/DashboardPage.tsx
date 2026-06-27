import React, { useState, useMemo } from 'react';
import { useCalendarStore } from '../store/calendarStore';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import CalendarHeader from '../features/calendar/CalendarHeader';
import MonthGrid from '../features/calendar/MonthGrid';
import WeekGrid from '../features/calendar/WeekGrid';
import DayGrid from '../features/calendar/DayGrid';
import SideDrawer from '../features/calendar/SideDrawer';
import EventDetailModal from '../features/calendar/EventDetailModal';
import CreateEventDialog from '../features/calendar/create-event/CreateEventDialog';
import type { CalendarEvent, CalendarView } from '../types/event.types';
import { eventService } from '../services/event.service';
import { useQuery } from '@tanstack/react-query';

// Skeleton for loading state — shape adapts to the active view so the
// layout doesn't jump once real data lands.
const GridSkeleton: React.FC<{ view: CalendarView }> = ({ view }) => {
  if (view === 'month') {
    return (
      <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200 animate-pulse">
        {Array.from({ length: 42 }).map((_, i) => (
          <div key={i} className="bg-white min-h-[100px]" />
        ))}
      </div>
    );
  }
  const cols = view === 'week' ? 7 : 1;
  return (
    <div className="flex-1 flex animate-pulse">
      <div className="w-14 flex-shrink-0 bg-gray-50" />
      <div className="flex-1 grid gap-px bg-gray-200" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="bg-white" />
        ))}
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { currentDate, view, setView, setCurrentDate, dashboardMode } = useCalendarStore();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogDate, setCreateDialogDate] = useState<Date | null>(null);

  // Primary calendar fetch — range depends on which view is active
  const { data: events = [], isLoading, isError } = useCalendarEvents(currentDate, view);

  // Search — only fires when query is non-empty, debounced by React Query's staleTime
  const { data: searchResults } = useQuery({
    queryKey: ['event-search', searchQuery],
    queryFn: () => eventService.searchEvents(searchQuery),
    enabled: searchQuery.trim().length >= 2,
    staleTime: 1000 * 30,
    select: (d) => d.events,
  });

  // If searching, show search results instead of calendar events
  const displayEvents = useMemo(() => {
    if (searchQuery.trim().length >= 2 && searchResults) return searchResults;
    return events;
  }, [searchQuery, searchResults, events]);

  // Used by all three grids: a bare date (month cell) or a precise
  // date+time (week/day slot) to pre-fill the create-event dialog with.
  const handleSlotClick = (date: Date) => {
    setCreateDialogDate(date);
    setCreateDialogOpen(true);
  };

  const handleCreateClick = () => {
    setCreateDialogDate(null); // no specific date pre-fill — defaults to "next hour, today"
    setCreateDialogOpen(true);
  };

  const handleNavigateToDay = (date: Date) => {
    setCurrentDate(date);
    setView('day');
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top toolbar */}
      <CalendarHeader onSearch={setSearchQuery} />

      {/* Dashboard mode banner — subtle indicator */}
      <div className={`
        flex-shrink-0 px-4 py-1.5 text-xs font-medium flex items-center gap-2 border-b
        ${dashboardMode === 'professional'
          ? 'bg-blue-50 text-blue-700 border-blue-100'
          : 'bg-green-50 text-green-700 border-green-100'
        }
      `}>
        <span className={`w-1.5 h-1.5 rounded-full ${dashboardMode === 'professional' ? 'bg-blue-500' : 'bg-green-500'}`} />
        {dashboardMode === 'professional' ? 'Professional workspace' : 'Personal dashboard'}
        <span className="text-gray-400 font-normal ml-1">· All events shown on one calendar</span>
      </div>

      {/* Search result notice */}
      {searchQuery.trim().length >= 2 && (
        <div className="flex-shrink-0 px-4 py-2 bg-yellow-50 border-b border-yellow-100 text-xs text-yellow-800">
          Showing {displayEvents.length} result{displayEvents.length !== 1 ? 's' : ''} for "{searchQuery}"
        </div>
      )}

      {/* Calendar body */}
      <main className="flex-1 flex flex-col min-h-0">
        {isError ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-2">
            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Couldn't load events. Check your connection.</p>
          </div>
        ) : isLoading ? (
          <GridSkeleton view={view} />
        ) : view === 'month' ? (
          <MonthGrid
            events={displayEvents}
            onEventClick={setSelectedEvent}
            onDateClick={handleSlotClick}
            onNavigateToDay={handleNavigateToDay}
          />
        ) : view === 'week' ? (
          <WeekGrid
            events={displayEvents}
            onEventClick={setSelectedEvent}
            onSlotClick={handleSlotClick}
          />
        ) : (
          <DayGrid
            events={displayEvents}
            onEventClick={setSelectedEvent}
            onSlotClick={handleSlotClick}
          />
        )}
      </main>

      {/* Side drawer */}
      <SideDrawer onCreateClick={handleCreateClick} />

      {/* Event detail modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Create event dialog */}
      <CreateEventDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        initialDate={createDialogDate}
      />
    </div>
  );
};

export default DashboardPage;
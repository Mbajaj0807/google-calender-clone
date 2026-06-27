import React, { useEffect, useRef } from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import MiniCalendar from './MiniCalendar';
import OrganizationSection from './OrganizationSection';
import type { EventType } from '../../types/event.types';

const FILTERS: { type: EventType; label: string; color: string }[] = [
  { type: 'personal', label: 'Personal', color: '#34A853' },
  { type: 'meeting',  label: 'Meetings', color: '#4285F4' },
  { type: 'goal',     label: 'Goals',    color: '#A142F4' },
  { type: 'holiday',  label: 'Holidays', color: '#EA4335' },
];

interface Props {
  onCreateClick: () => void;
}

const SideDrawer: React.FC<Props> = ({ onCreateClick }) => {
  const { drawerOpen, setDrawerOpen, activeFilters, toggleFilter } = useCalendarStore();
  const { user } = useAuthStore();
  const logout = useLogout();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setDrawerOpen]);

  // Trap scroll on body
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={() => setDrawerOpen(false)}
        className={`
          fixed inset-0 bg-black/20 z-40 transition-opacity duration-200
          ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* Drawer panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-xl flex flex-col
          transition-transform duration-250 ease-in-out
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Drawer top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg font-normal text-gray-700">Calendar</span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Mini calendar */}
          <div className="border-b border-gray-100">
            <MiniCalendar />
          </div>

          {/* Create event button */}
          <div className="px-4 py-3">
            <button
              onClick={() => {
                setDrawerOpen(false);
                onCreateClick();
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl border border-gray-200
                         shadow-sm hover:shadow-md text-gray-700 font-medium text-sm bg-white
                         transition-shadow duration-150 focus:outline-none"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create
            </button>
          </div>

          {/* Filter section */}
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
              Show events
            </p>
            <div className="space-y-0.5">
              {FILTERS.map(({ type, label, color }) => (
                <label
                  key={type}
                  className="flex items-center gap-3 px-1 py-1.5 rounded-lg hover:bg-gray-50
                             cursor-pointer transition-colors"
                >
                  <span
                    className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors"
                    style={{
                      backgroundColor: activeFilters.has(type) ? color : 'transparent',
                      borderColor: color,
                    }}
                  >
                    {activeFilters.has(type) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={activeFilters.has(type)}
                    onChange={() => toggleFilter(type)}
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Organization membership */}
          <OrganizationSection />

          {/* Nav items — placeholders for future pages */}
          <div className="px-3 py-2 mt-1 border-t border-gray-100">
            {[
              { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Schedule' },
              { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Tasks' },
              { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Goals' },
            ].map(({ icon, label }) => (
              <button
                key={label}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700
                           hover:bg-gray-100 transition-colors text-left focus:outline-none"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* User info — pinned to bottom */}
        <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center
                            text-white text-sm font-medium flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600
                         transition-colors flex-shrink-0 focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SideDrawer;
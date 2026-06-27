import { create } from 'zustand';
import type { DashboardMode, CalendarView, EventType } from '../types/event.types';

interface CalendarState {
  currentDate: Date;
  view: CalendarView;
  dashboardMode: DashboardMode;
  // which event types are visible (all on by default)
  activeFilters: Set<EventType>;
  drawerOpen: boolean;

  setCurrentDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
  setDashboardMode: (mode: DashboardMode) => void;
  toggleFilter: (type: EventType) => void;
  setDrawerOpen: (open: boolean) => void;
  // View-aware navigation — steps by a month/week/day depending on the
  // currently active view, mirroring how Google Calendar's prev/next
  // arrows behave.
  goToPrevious: () => void;
  goToNext: () => void;
  goToToday: () => void;
}

const ALL_TYPES: EventType[] = ['personal', 'meeting', 'goal', 'holiday'];

export const useCalendarStore = create<CalendarState>((set) => ({
  currentDate: new Date(),
  view: 'month',
  dashboardMode: 'professional',
  activeFilters: new Set(ALL_TYPES),
  drawerOpen: false,

  setCurrentDate: (date) => set({ currentDate: date }),
  setView: (view) => set({ view }),
  setDashboardMode: (dashboardMode) => set({ dashboardMode }),

  toggleFilter: (type) =>
    set((state) => {
      const next = new Set(state.activeFilters);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type); // always keep at least one
      } else {
        next.add(type);
      }
      return { activeFilters: next };
    }),

  setDrawerOpen: (open) => set({ drawerOpen: open }),

  goToPrevious: () =>
    set((state) => {
      const d = new Date(state.currentDate);
      if (state.view === 'month') d.setMonth(d.getMonth() - 1);
      else if (state.view === 'week') d.setDate(d.getDate() - 7);
      else d.setDate(d.getDate() - 1);
      return { currentDate: d };
    }),

  goToNext: () =>
    set((state) => {
      const d = new Date(state.currentDate);
      if (state.view === 'month') d.setMonth(d.getMonth() + 1);
      else if (state.view === 'week') d.setDate(d.getDate() + 7);
      else d.setDate(d.getDate() + 1);
      return { currentDate: d };
    }),

  goToToday: () => set({ currentDate: new Date() }),
}));
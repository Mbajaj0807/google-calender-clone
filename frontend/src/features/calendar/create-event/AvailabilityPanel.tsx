import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { eventService } from '../../../services/event.service';
import { formatIst } from '../../../utils/timezone';
import type { AvailabilitySlot } from '../../../types/event.types';

interface Props {
  participantIds: string[];
  /** The originally requested window, as UTC ISO strings, and its duration in minutes. */
  initialWindowStartUtc: string;
  initialWindowEndUtc: string;
  durationMinutes: number;
  onSelectSlot: (slot: AvailabilitySlot) => void;
  onBack: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const AvailabilityPanel: React.FC<Props> = ({
  participantIds,
  initialWindowStartUtc,
  initialWindowEndUtc,
  durationMinutes,
  onSelectSlot,
  onBack,
}) => {
  const [windowStart, setWindowStart] = useState(initialWindowStartUtc);
  const [windowEnd, setWindowEnd] = useState(initialWindowEndUtc);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const runSearch = async (start: string, end: string) => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const { slots: found } = await eventService.findAvailability(
        participantIds,
        start,
        end,
        durationMinutes
      );
      setSlots(found);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      if (axios.isAxiosError(err)) {
        setErrorMsg(err.response?.data?.message || 'Could not search availability');
      } else {
        setErrorMsg('Something went wrong');
      }
    }
  };

  // Search the exact originally-requested window first, per product spec —
  // no expansion to working hours unless the user explicitly widens it below.
  useEffect(() => {
    runSearch(initialWindowStartUtc, initialWindowEndUtc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const expandWindow = (hours: number) => {
    const newStart = new Date(new Date(windowStart).getTime() - hours * 60 * 60 * 1000).toISOString();
    const newEnd = new Date(new Date(windowEnd).getTime() + hours * 60 * 60 * 1000).toISOString();
    setWindowStart(newStart);
    setWindowEnd(newEnd);
    runSearch(newStart, newEnd);
  };

  return (
    <div className="px-6 py-5">
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-800">Smart Availability Finder</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Searching {formatIst(windowStart, 'MMM d, h:mm a')} – {formatIst(windowEnd, 'h:mm a')} IST
          {' · '}{durationMinutes} min meeting
        </p>
      </div>

      {status === 'loading' && (
        <div className="flex items-center justify-center py-10 text-sm text-gray-400 gap-2">
          <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Searching availability…
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-8">
          <p className="text-sm text-red-500 mb-3">{errorMsg}</p>
          <button
            type="button"
            onClick={() => runSearch(windowStart, windowEnd)}
            className="text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {status === 'success' && slots.length > 0 && (
        <div className="space-y-2 mb-4">
          {slots.map((slot, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectSlot(slot)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200
                         hover:border-blue-400 hover:bg-blue-50/40 transition-colors text-left"
            >
              <span className="text-sm font-medium text-gray-800">
                {formatIst(slot.start, 'EEE, MMM d')} · {formatIst(slot.start, 'h:mm a')} – {formatIst(slot.end, 'h:mm a')}
              </span>
              <span className="text-xs text-blue-600 font-medium">Use this slot →</span>
            </button>
          ))}
        </div>
      )}

      {status === 'success' && slots.length === 0 && (
        <div className="text-center py-6 px-2">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-600 font-medium">No common {durationMinutes}-minute availability found</p>
          <p className="text-xs text-gray-400 mt-1">Try expanding the search window.</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => expandWindow(1)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50"
            >
              +1 hour each side
            </button>
            <button
              type="button"
              onClick={() => expandWindow(3)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50"
            >
              +3 hours each side
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="w-full text-center mt-3 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back to conflict options
      </button>
    </div>
  );
};

export default AvailabilityPanel;
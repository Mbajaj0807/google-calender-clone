import React, { useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import type { CalendarEvent } from '../../types/event.types';
import { getEventColor } from './utils/calendarUtils';
import { useRespondToInvitation } from '../../hooks/useRespondToInvitation';

interface Props {
  event: CalendarEvent | null;
  onClose: () => void;
}

const PRIORITY_LABEL: Record<string, string> = {
  critical: '🔴 Critical', high: '🟠 High', medium: '🟡 Medium', low: '⚪ Low',
};

const EventDetailModal: React.FC<Props> = ({ event, onClose }) => {
  const respond = useRespondToInvitation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!event) return null;

  const color = getEventColor(event);
  const start = parseISO(event.startTime);
  const end = parseISO(event.endTime);
  const organizer = typeof event.organizerId === 'object' ? event.organizerId : null;
  const isTentative = event.myInvitationStatus === 'tentative';

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colour bar */}
        <div className="h-2" style={{ backgroundColor: color }} />

        {/* Tentative status banner — only shown to participants who marked
            themselves "maybe", giving a quick way to confirm or back out */}
        {isTentative && event.myInvitationId && (
          <div className="flex items-center justify-between gap-3 px-6 py-2.5 bg-amber-50 border-b border-amber-100">
            <span className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              You marked this tentative
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => respond.mutate({ invitationId: event.myInvitationId!, status: 'accepted' })}
                disabled={respond.isPending}
                className="text-xs font-medium text-blue-700 hover:underline disabled:opacity-50"
              >
                Confirm attendance
              </button>
              <button
                onClick={() =>
                  respond.mutate(
                    { invitationId: event.myInvitationId!, status: 'declined' },
                    { onSuccess: onClose }
                  )
                }
                disabled={respond.isPending}
                className="text-xs font-medium text-gray-500 hover:underline disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-medium text-gray-500 capitalize">
                {event.eventType}
                {event.protectedPersonal && (
                  <span className="ml-2 inline-flex items-center gap-0.5 text-gray-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Protected
                  </span>
                )}
              </span>
            </div>
            <h2 className="text-xl font-medium text-gray-900 leading-tight">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex-shrink-0 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-3">
          {/* Time */}
          <div className="flex items-start gap-3 text-sm text-gray-700">
            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">{format(start, 'EEEE, MMMM d, yyyy')}</p>
              <p className="text-gray-500">{format(start, 'h:mm a')} – {format(end, 'h:mm a')}</p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3 text-sm text-gray-700">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.location}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-3 text-sm text-gray-700">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
              </svg>
              <p className="leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Priority */}
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            <span>{PRIORITY_LABEL[event.priority]}</span>
          </div>

          {/* Organizer */}
          {organizer && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{organizer.name} <span className="text-gray-400">({organizer.email})</span></span>
            </div>
          )}

          {/* Participants */}
          {event.participantIds.length > 0 && (
            <div className="flex items-start gap-3 text-sm text-gray-700">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="space-y-0.5">
                {event.participantIds.map((p) => (
                  <p key={p._id}>{p.name} <span className="text-gray-400 text-xs">{p.email}</span></p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
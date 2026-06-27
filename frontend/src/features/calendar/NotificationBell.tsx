import React, { useEffect, useRef, useState } from 'react';
import { usePendingInvitations } from '../../hooks/usePendingInvitations';
import { useRespondToInvitation } from '../../hooks/useRespondToInvitation';
import { formatIst } from '../../utils/timezone';
import type { InvitationStatus } from '../../types/event.types';

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: invitations = [], isLoading } = usePendingInvitations();
  const respond = useRespondToInvitation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const count = invitations.length;

  const handleRespond = (invitationId: string, status: Exclude<InvitationStatus, 'invited'>) => {
    respond.mutate({ invitationId, status });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 focus:outline-none"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500
                           text-white text-[10px] font-semibold flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-y-auto bg-white border border-gray-200
                         rounded-xl shadow-xl z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-800">Invitations</p>
          </div>

          {isLoading ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">Loading…</p>
          ) : count === 0 ? (
            <div className="px-4 py-8 text-center">
              <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-500">You're all caught up</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {invitations.map((inv) => {
                const event = inv.eventId;
                const isResponding = respond.isPending && respond.variables?.invitationId === inv._id;
                return (
                  <li key={inv._id} className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800 truncate">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {event.organizerId?.name ? `${event.organizerId.name} · ` : ''}
                      {formatIst(event.startTime, 'EEE, MMM d · h:mm a')} IST
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      <button
                        onClick={() => handleRespond(inv._id, 'accepted')}
                        disabled={isResponding}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium
                                   hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespond(inv._id, 'tentative')}
                        disabled={isResponding}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium
                                   hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Maybe
                      </button>
                      <button
                        onClick={() => handleRespond(inv._id, 'declined')}
                        disabled={isResponding}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium
                                   hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
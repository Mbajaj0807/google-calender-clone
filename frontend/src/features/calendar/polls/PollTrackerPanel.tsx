import React, { useEffect } from 'react';
import { useMyPolls } from '../../../hooks/useMyPolls';
import PollCard from './PollCard';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PollTrackerPanel: React.FC<Props> = ({ open, onClose }) => {
  const { data: polls = [], isLoading } = useMyPolls();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const active = polls.filter((p) => p.status === 'active');
  const resolved = polls.filter((p) => p.status !== 'active');

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-medium text-gray-900">Meeting polls</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading polls…</p>
          ) : polls.length === 0 ? (
            <div className="text-center py-10">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 17v-2a4 4 0 014-4h4m0 0l-3-3m3 3l-3 3M3 12a9 9 0 1018 0 9 9 0 00-18 0z" />
              </svg>
              <p className="text-sm text-gray-500">No polls yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Start one from the event creation flow when a conflict comes up.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {active.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active ({active.length})
                  </p>
                  {active.map((poll) => (
                    <PollCard key={poll._id} poll={poll} />
                  ))}
                </div>
              )}

              {resolved.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Past ({resolved.length})
                  </p>
                  {resolved.map((poll) => (
                    <PollCard key={poll._id} poll={poll} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollTrackerPanel;
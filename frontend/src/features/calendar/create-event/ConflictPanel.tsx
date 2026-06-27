import React from 'react';
import type { OrgMember } from '../../../types/auth.types';

const MAX_NAMES_SHOWN = 4;

interface Props {
  conflictedUsers: OrgMember[];
  conflictedCount: number; // may be > conflictedUsers.length if some lookups failed
  isResolvingNames: boolean;
  onSendAnyway: () => void;
  onFindAvailability: () => void;
  onStartPoll: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

function namesSummary(users: OrgMember[], totalCount: number): string {
  if (users.length === 0) return '';
  const shown = users.slice(0, MAX_NAMES_SHOWN).map((u) => u.name);
  const remaining = totalCount - shown.length;
  return remaining > 0 ? `${shown.join(', ')} +${remaining} other${remaining > 1 ? 's' : ''}` : shown.join(', ');
}

const ConflictPanel: React.FC<Props> = ({
  conflictedUsers,
  conflictedCount,
  isResolvingNames,
  onSendAnyway,
  onFindAvailability,
  onStartPoll,
  onBack,
  isSubmitting,
}) => {
  return (
    <div className="px-6 py-5">
      <div className="flex items-start gap-3 mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
        </svg>
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-900">
            {conflictedCount} participant{conflictedCount !== 1 ? 's' : ''} {conflictedCount !== 1 ? 'have' : 'has'} prior commitments during this time
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            {isResolvingNames ? (
              'Looking up names…'
            ) : conflictedUsers.length > 0 ? (
              namesSummary(conflictedUsers, conflictedCount)
            ) : (
              "Couldn't load participant names, but the time conflicts."
            )}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">How would you like to proceed?</p>

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={onSendAnyway}
          disabled={isSubmitting}
          className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700">Send invitations anyway</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Create the event now. Conflicted participants can accept, decline, or mark themselves tentative.
          </p>
        </button>

        <button
          type="button"
          onClick={onFindAvailability}
          disabled={isSubmitting}
          className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700">Find availability</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Search for a common free slot across all participants near this time.
          </p>
        </button>

        <button
          type="button"
          onClick={onStartPoll}
          disabled={isSubmitting}
          className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700">Start a meeting poll instead</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Propose a few time options and let participants vote on what works.
          </p>
        </button>
      </div>

      <button
        type="button"
        onClick={onBack}
        disabled={isSubmitting}
        className="w-full text-center mt-4 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
      >
        ← Back to edit details
      </button>
    </div>
  );
};

export default ConflictPanel;
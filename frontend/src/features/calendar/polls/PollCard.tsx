import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useVoteOnPoll, useFinalizePoll, useCancelPoll } from '../../../hooks/usePollMutations';
import { PollTieError } from '../../../services/poll.service';
import { formatIst } from '../../../utils/timezone';
import type { MeetingPoll } from '../../../types/poll.types';

interface Props {
  poll: MeetingPoll;
}

type TieOption = { _id: string; startTime: string; endTime: string; voteCount: number };

const STATUS_BADGE: Record<MeetingPoll['status'], string> = {
  active: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const PollCard: React.FC<Props> = ({ poll }) => {
  const { user } = useAuthStore();
  const [tieOptions, setTieOptions] = useState<TieOption[] | null>(null);

  const vote = useVoteOnPoll();
  const finalize = useFinalizePoll();
  const cancel = useCancelPoll();

  const isOrganizer = user?._id === poll.organizerId._id;
  const totalParticipants = poll.participantIds.length;
  const maxVotes = Math.max(...poll.options.map((o) => o.votes.length), 0);

  const handleVote = (optionId: string) => {
    vote.mutate({ pollId: poll._id, optionId });
  };

  const handleFinalize = (optionId?: string) => {
    finalize.mutate(
      { pollId: poll._id, optionId },
      {
        onSuccess: () => setTieOptions(null),
        onError: (err) => {
          if (err instanceof PollTieError) setTieOptions(err.options);
        },
      }
    );
  };

  const isActing = vote.isPending || finalize.isPending || cancel.isPending;

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{poll.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isOrganizer ? 'You organize this' : `Organized by ${poll.organizerId.name}`}
            {' · '}{poll.duration} min
            {totalParticipants > 0 && ` · ${totalParticipants} invited`}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase flex-shrink-0 ${STATUS_BADGE[poll.status]}`}>
          {poll.status}
        </span>
      </div>

      {poll.agenda && <p className="text-xs text-gray-500 mb-3">{poll.agenda}</p>}

      {poll.status === 'active' && (
        <div className="space-y-1.5 mt-2">
          {poll.options.map((opt) => {
            const isMine = poll.myVoteOptionId === opt._id;
            const isLeading = opt.votes.length === maxVotes && maxVotes > 0;
            return (
              <button
                key={opt._id}
                type="button"
                onClick={() => handleVote(opt._id)}
                disabled={isActing}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors
                  disabled:opacity-50
                  ${isMine ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                <span className="text-xs text-gray-700">
                  {formatIst(opt.startTime, 'EEE, MMM d · h:mm a')} – {formatIst(opt.endTime, 'h:mm a')}
                </span>
                <span className="flex items-center gap-1.5 flex-shrink-0">
                  {isMine && (
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className={`text-xs font-medium ${isLeading ? 'text-blue-700' : 'text-gray-500'}`}>
                    {opt.votes.length} vote{opt.votes.length !== 1 ? 's' : ''}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tie-break picker — shown after a finalize attempt comes back tied */}
      {tieOptions && (
        <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
          <p className="text-xs font-medium text-amber-800 mb-2">
            Votes are tied — choose which time to finalize:
          </p>
          <div className="space-y-1.5">
            {tieOptions.map((opt) => (
              <button
                key={opt._id}
                type="button"
                onClick={() => handleFinalize(opt._id)}
                disabled={isActing}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-white border border-amber-200
                           hover:border-amber-400 text-left disabled:opacity-50"
              >
                <span className="text-xs text-gray-700">
                  {formatIst(opt.startTime, 'EEE, MMM d · h:mm a')} – {formatIst(opt.endTime, 'h:mm a')}
                </span>
                <span className="text-xs font-medium text-amber-700">{opt.voteCount} votes</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {poll.status === 'completed' && (
        <p className="text-xs text-green-700 flex items-center gap-1.5 mt-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Finalized — event created
        </p>
      )}

      {isOrganizer && poll.status === 'active' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => handleFinalize()}
            disabled={isActing}
            className="flex-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium
                       hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {finalize.isPending ? 'Finalizing…' : 'Finalize'}
          </button>
          <button
            type="button"
            onClick={() => cancel.mutate(poll._id)}
            disabled={isActing}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium
                       hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel poll
          </button>
        </div>
      )}
    </div>
  );
};

export default PollCard;
import type { Organizer, Participant } from './event.types';

export type PollStatus = 'active' | 'completed' | 'cancelled';

export interface PollOption {
  _id: string;
  startTime: string; // ISO UTC
  endTime: string;   // ISO UTC
  votes: string[];   // user IDs
}

export interface MeetingPoll {
  _id: string;
  organizerId: Organizer;
  organizationId: string | null;
  participantIds: Participant[];
  title: string;
  agenda: string;
  duration: number; // minutes
  options: PollOption[];
  status: PollStatus;
  winningOption: string | null;
  resultingEventId: string | null;
  createdAt: string;
  updatedAt: string;
  /**
   * Only present on GET /polls (list) responses — the option ID the
   * current user has voted for, or null if they haven't voted yet.
   * Absent (undefined) on GET /polls/:id, since that endpoint returns
   * the raw poll without this per-user convenience field.
   */
  myVoteOptionId?: string | null;
}

export interface GetMyPollsResponse {
  polls: MeetingPoll[];
}

export interface GetPollResponse {
  poll: MeetingPoll;
}

export interface CreatePollPayload {
  title: string;
  agenda?: string;
  duration: number; // minutes
  participantIds: string[];
  organizationId?: string;
  options: { startTime: string; endTime: string }[]; // 2-4 entries, ISO UTC
}

export interface CreatePollResponse {
  poll: MeetingPoll;
}

export interface VoteResponse {
  poll: MeetingPoll;
}

export interface FinalizePollResponse {
  poll: MeetingPoll;
  event: { _id: string; title: string };
  conflicts: string[]; // user IDs with a conflict at the winning time — informational only
}

/**
 * Shape returned by POST /polls/:id/finalize when votes are tied (HTTP 409).
 * The caller must re-finalize with an explicit optionId once the organizer
 * picks one of these.
 */
export interface FinalizeTieResponse {
  message: string;
  tie: true;
  options: { _id: string; startTime: string; endTime: string; voteCount: number }[];
}
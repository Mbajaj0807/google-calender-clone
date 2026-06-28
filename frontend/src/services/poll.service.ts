import axios from 'axios';
import api from './api';
import type {
  GetMyPollsResponse,
  GetPollResponse,
  CreatePollPayload,
  CreatePollResponse,
  VoteResponse,
  FinalizePollResponse,
  FinalizeTieResponse,
} from '../types/poll.types';

/**
 * Thrown by finalizePoll() when the backend responds 409 (votes tied).
 * Callers can catch this specifically (instanceof) to show a "pick one"
 * UI instead of a generic error toast.
 */
export class PollTieError extends Error {
  options: FinalizeTieResponse['options'];
  constructor(data: FinalizeTieResponse) {
    super(data.message);
    this.options = data.options;
  }
}

export const pollService = {
  async getMyPolls(): Promise<GetMyPollsResponse> {
    const { data } = await api.get<GetMyPollsResponse>('/polls');
    return data;
  },

  async getPoll(id: string): Promise<GetPollResponse> {
    const { data } = await api.get<GetPollResponse>(`/polls/${id}`);
    return data;
  },

  async createPoll(payload: CreatePollPayload): Promise<CreatePollResponse> {
    const { data } = await api.post<CreatePollResponse>('/polls', payload);
    return data;
  },

  async vote(pollId: string, optionId: string): Promise<VoteResponse> {
    const { data } = await api.post<VoteResponse>(`/polls/${pollId}/vote`, { optionId });
    return data;
  },

  /**
   * @param optionId Pass when the organizer is manually choosing — required
   * if a previous call threw PollTieError, optional otherwise (omitting it
   * auto-picks a clear single leader).
   * @throws PollTieError if votes are tied and no optionId was given.
   */
  async finalizePoll(pollId: string, optionId?: string): Promise<FinalizePollResponse> {
    try {
      const { data } = await api.post<FinalizePollResponse>(`/polls/${pollId}/finalize`, {
        optionId,
      });
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409 && err.response.data?.tie) {
        throw new PollTieError(err.response.data as FinalizeTieResponse);
      }
      throw err;
    }
  },

  async cancelPoll(pollId: string): Promise<GetPollResponse> {
    const { data } = await api.post<GetPollResponse>(`/polls/${pollId}/cancel`);
    return data;
  },
};
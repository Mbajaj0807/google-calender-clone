import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import { pollService, PollTieError } from '../services/poll.service';
import type { CreatePollPayload } from '../types/poll.types';

function genericErrorToast(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    toast.error(error.response?.data?.message || fallback);
  } else {
    toast.error(fallback);
  }
}

export function useCreatePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePollPayload) => pollService.createPoll(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-polls'] });
      toast.success('Poll created');
    },
    onError: (error: unknown) => genericErrorToast(error, 'Could not create poll'),
  });
}

export function useVoteOnPoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
      pollService.vote(pollId, optionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-polls'] });
      toast.success('Vote saved');
    },
    onError: (error: unknown) => genericErrorToast(error, 'Could not save your vote'),
  });
}

export function useFinalizePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId?: string }) =>
      pollService.finalizePoll(pollId, optionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-polls'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      if (data.conflicts.length > 0) {
        toast(
          `Event created — heads up, ${data.conflicts.length} participant${data.conflicts.length > 1 ? 's' : ''} may have a conflict`,
          { icon: '⚠️' }
        );
      } else {
        toast.success('Poll finalized — event created');
      }
    },
    onError: (error: unknown) => {
      // PollTieError is handled by the caller (it needs to show a picker,
      // not a toast), so don't show a generic error toast for it here.
      if (error instanceof PollTieError) return;
      genericErrorToast(error, 'Could not finalize poll');
    },
  });
}

export function useCancelPoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pollId: string) => pollService.cancelPoll(pollId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-polls'] });
      toast.success('Poll cancelled');
    },
    onError: (error: unknown) => genericErrorToast(error, 'Could not cancel poll'),
  });
}
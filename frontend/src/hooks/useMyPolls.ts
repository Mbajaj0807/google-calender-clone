import { useQuery } from '@tanstack/react-query';
import { pollService } from '../services/poll.service';

export function useMyPolls() {
  return useQuery({
    queryKey: ['my-polls'],
    queryFn: () => pollService.getMyPolls(),
    select: (data) => data.polls,
    // Same rationale as usePendingInvitations — no push layer, so poll
    // through to pick up votes from other participants while open.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
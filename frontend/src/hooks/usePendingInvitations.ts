import { useQuery } from '@tanstack/react-query';
import { invitationService } from '../services/invitation.service';

export function usePendingInvitations() {
  return useQuery({
    queryKey: ['pending-invitations'],
    queryFn: () => invitationService.getPendingInvitations(),
    select: (data) => data.invitations,
    // Poll for new invitations — there's no push/websocket layer in this
    // app, so this is the only way the bell badge updates without a
    // manual refresh when someone invites you while you're already in the app.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
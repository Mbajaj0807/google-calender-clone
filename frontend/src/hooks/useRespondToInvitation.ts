import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import { invitationService } from '../services/invitation.service';
import type { InvitationStatus } from '../types/event.types';

const STATUS_LABEL: Record<string, string> = {
  accepted: 'Accepted',
  declined: 'Declined',
  tentative: 'Marked tentative',
};

export function useRespondToInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invitationId,
      status,
    }: {
      invitationId: string;
      status: Exclude<InvitationStatus, 'invited'>;
    }) => invitationService.respond(invitationId, status),
    onSuccess: (_data, variables) => {
      // The invitation leaves the "pending" bell list, and — per the
      // accepted/tentative visibility rule — the event may now need to
      // appear on (or be removed from) the calendar, so refresh both.
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success(STATUS_LABEL[variables.status] ?? 'Response saved');
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Could not respond to invitation');
      } else {
        toast.error('Something went wrong');
      }
    },
  });
}
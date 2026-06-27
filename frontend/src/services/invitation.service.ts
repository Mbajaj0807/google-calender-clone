import api from './api';
import type {
  GetInvitationsResponse,
  RespondToInvitationResponse,
} from '../types/invitation.types';
import type { InvitationStatus } from '../types/event.types';

export const invitationService = {
  async getPendingInvitations(): Promise<GetInvitationsResponse> {
    const { data } = await api.get<GetInvitationsResponse>('/invitations');
    return data;
  },

  async respond(
    invitationId: string,
    status: Exclude<InvitationStatus, 'invited'>
  ): Promise<RespondToInvitationResponse> {
    const { data } = await api.patch<RespondToInvitationResponse>(`/invitations/${invitationId}`, {
      status,
    });
    return data;
  },
};
import type { CalendarEvent, InvitationStatus, Organizer } from './event.types';

/**
 * Shape returned by GET /invitations. eventId is populated into the full
 * event doc (itself with organizerId populated to {name, email}), per
 * invitation.controller.js's getPendingInvitations.
 *
 * NOTE: the populated event here will NOT have myInvitationStatus attached
 * (that's only added by the calendar-view endpoints), so don't rely on it
 * from this shape — the invitation's own `status` field is authoritative here.
 */
export interface PopulatedInvitationEvent extends Omit<CalendarEvent, 'organizerId' | 'myInvitationStatus'> {
  organizerId: Organizer;
}

export interface Invitation {
  _id: string;
  eventId: PopulatedInvitationEvent;
  userId: string;
  status: InvitationStatus;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetInvitationsResponse {
  invitations: Invitation[];
}

export interface RespondToInvitationResponse {
  invitation: Invitation;
}
import api from './api';
import type { OrgMember, User } from '../types/auth.types';

export interface UpdateProfilePayload {
  name?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  designation?: string;
  timezone?: string;
  /** null or '' clears the user's organization; a valid org ID joins it. */
  organizationId?: string | null;
}

export const userService = {
  async getOrganizationMembers(): Promise<OrgMember[]> {
    const { data } = await api.get<{ members: OrgMember[] }>('/users/organization');
    return data.members;
  },

  async getUser(id: string): Promise<OrgMember> {
    const { data } = await api.get<{ user: OrgMember }>(`/users/${id}`);
    return data.user;
  },

  /**
   * Resolve multiple user IDs to their profile info, in parallel.
   * Used to turn the conflict-check API's bare ID list into display names.
   * A failed lookup for one ID won't fail the whole batch — it's
   * filtered out so the panel can still render the IDs that resolved.
   */
  async getUsers(ids: string[]): Promise<OrgMember[]> {
    const unique = Array.from(new Set(ids));
    const results = await Promise.allSettled(unique.map((id) => this.getUser(id)));
    return results
      .filter((r): r is PromiseFulfilledResult<OrgMember> => r.status === 'fulfilled')
      .map((r) => r.value);
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await api.put<{ user: User }>('/users/profile', payload);
    return data.user;
  },
};
import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/user.service';

export function useOrganizationMembers() {
  return useQuery({
    queryKey: ['organization-members'],
    queryFn: () => userService.getOrganizationMembers(),
    staleTime: 1000 * 60 * 10, // org roster changes rarely
  });
}
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import { userService } from '../services/user.service';
import { useAuthStore } from '../store/authStore';

export function useJoinOrganization() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId: string) => userService.updateProfile({ organizationId }),
    onSuccess: (user) => {
      updateUser(user);
      // The participant picker and any other consumer of the org roster
      // should refetch now that membership has changed.
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast.success('Joined organization');
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) {
          toast.error('No organization found with that ID');
        } else if (status === 400) {
          toast.error('That doesn\'t look like a valid organization ID');
        } else {
          toast.error(error.response?.data?.message || 'Could not join organization');
        }
      } else {
        toast.error('Something went wrong');
      }
    },
  });
}

export function useLeaveOrganization() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userService.updateProfile({ organizationId: null }),
    onSuccess: (user) => {
      updateUser(user);
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast.success('Left organization');
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Could not leave organization');
      } else {
        toast.error('Something went wrong');
      }
    },
  });
}
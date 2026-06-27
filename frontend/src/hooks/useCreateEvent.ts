import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import { eventService } from '../services/event.service';
import type { CreateEventPayload } from '../types/event.types';

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEventPayload) => eventService.createEvent(payload),
    onSuccess: () => {
      // Calendar range queries are keyed ['calendar-events', start, end] —
      // invalidate all of them so the new event appears without a manual refetch.
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Event created');
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Could not create event');
      } else {
        toast.error('Something went wrong');
      }
    },
  });
}
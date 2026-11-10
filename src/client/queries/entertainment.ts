import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateBookInput,
  CreateGameInput,
  EntertainmentData,
} from '@/contracts/entertainment';

export function useEntertainmentData() {
  return useQuery<EntertainmentData>({
    queryKey: ['entertainment'],
    queryFn: async () => {
      const res = await fetch('/api/entertainment');
      if (!res.ok) throw new Error('Failed to load entertainment data');
      const json = await res.json();
      return json.data;
    },
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBookInput) => {
      const res = await fetch('/api/entertainment?action=book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to add book');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entertainment'] });
    },
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGameInput) => {
      const res = await fetch('/api/entertainment?action=game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to add game');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entertainment'] });
    },
  });
}

export function useUpdateBookProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookId, progressPercentage, status }: { bookId: string; progressPercentage: number; status?: string }) => {
      const res = await fetch('/api/entertainment?action=update-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, progressPercentage, status }),
      });
      if (!res.ok) throw new Error('Failed to update progress');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entertainment'] });
    },
  });
}


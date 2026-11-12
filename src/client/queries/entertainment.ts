'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BookItem,
  CreateBookInput,
  CreateGameInput,
  EntertainmentData,
  GameItem,
} from '@/contracts/entertainment';
import { apiRequest } from '../api-client';

export const entertainmentKeys = {
  all: ['entertainment'] as const,
};

export function useEntertainmentData() {
  return useQuery<EntertainmentData>({
    queryKey: entertainmentKeys.all,
    queryFn: async () => {
      const res = await apiRequest<{ success: boolean; data: EntertainmentData }>('/api/entertainment');
      return res.data;
    },
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBookInput) => {
      const res = await apiRequest<{ success: boolean; data: BookItem }>('/api/entertainment?action=book', {
        method: 'POST',
        body: input,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entertainmentKeys.all });
    },
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGameInput) => {
      const res = await apiRequest<{ success: boolean; data: GameItem }>('/api/entertainment?action=game', {
        method: 'POST',
        body: input,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entertainmentKeys.all });
    },
  });
}

export function useUpdateBookProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      progressPercentage,
      status,
    }: {
      bookId: string;
      progressPercentage: number;
      status?: string;
    }) => {
      const res = await apiRequest<{ success: boolean; data: BookItem }>('/api/entertainment?action=update-book', {
        method: 'POST',
        body: { bookId, progressPercentage, status },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entertainmentKeys.all });
    },
  });
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateCardInput,
  CreateDeckInput,
  FlashcardDeck,
  FlashcardItem,
  FlashcardsData,
  ReviewCardInput,
} from '@/contracts/flashcard';
import { apiRequest } from '../api-client';

export const flashcardKeys = {
  all: ['flashcards'] as const,
};

export function useFlashcardsData() {
  return useQuery<FlashcardsData>({
    queryKey: flashcardKeys.all,
    queryFn: async () => {
      const res = await apiRequest<{ success: boolean; data: FlashcardsData }>('/api/flashcards');
      return res.data;
    },
  });
}

export function useCreateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDeckInput) => {
      const res = await apiRequest<{ success: boolean; data: FlashcardDeck }>('/api/flashcards?action=deck', {
        method: 'POST',
        body: input,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
    },
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCardInput) => {
      const res = await apiRequest<{ success: boolean; data: FlashcardItem }>('/api/flashcards?action=card', {
        method: 'POST',
        body: input,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
    },
  });
}

export function useReviewCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReviewCardInput) => {
      const res = await apiRequest<{ success: boolean; data: FlashcardItem }>('/api/flashcards?action=review', {
        method: 'POST',
        body: input,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
    },
  });
}

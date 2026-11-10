import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateCardInput,
  CreateDeckInput,
  FlashcardsData,
  ReviewCardInput,
} from '@/contracts/flashcard';

export function useFlashcardsData() {
  return useQuery<FlashcardsData>({
    queryKey: ['flashcards'],
    queryFn: async () => {
      const res = await fetch('/api/flashcards');
      if (!res.ok) throw new Error('Failed to load flashcards');
      const json = await res.json();
      return json.data;
    },
  });
}

export function useCreateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDeckInput) => {
      const res = await fetch('/api/flashcards?action=deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create deck');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCardInput) => {
      const res = await fetch('/api/flashcards?action=card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create card');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
  });
}

export function useReviewCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReviewCardInput) => {
      const res = await fetch('/api/flashcards?action=review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to review card');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
  });
}


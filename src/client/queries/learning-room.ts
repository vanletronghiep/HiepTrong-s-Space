'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateLearningSessionInput,
  LearningRoomStats,
  LearningSession,
} from '@/contracts/learning-room';
import { apiRequest } from '../api-client';

export interface LearningRoomResponse {
  sessions: LearningSession[];
  stats: LearningRoomStats;
}

export const learningRoomKeys = {
  all: ['learning-room'] as const,
};

export function useLearningRoomData() {
  return useQuery<LearningRoomResponse>({
    queryKey: learningRoomKeys.all,
    queryFn: async () => {
      const res = await apiRequest<{ success: boolean; data: LearningRoomResponse }>(
        '/api/learning-room',
      );
      return res.data;
    },
  });
}

export function useCreateLearningSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLearningSessionInput) => {
      const res = await apiRequest<{ success: boolean; data: LearningSession }>(
        '/api/learning-room',
        {
          method: 'POST',
          body: input,
        },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningRoomKeys.all });
    },
  });
}

export function useClearLearningRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest<{ success: boolean; data: { removed: number } }>(
        '/api/learning-room',
        { method: 'DELETE' },
      );
      return res.data.removed;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningRoomKeys.all });
    },
  });
}

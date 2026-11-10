import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateLearningSessionInput,
  LearningRoomStats,
  LearningSession,
} from '@/contracts/learning-room';

export interface LearningRoomResponse {
  sessions: LearningSession[];
  stats: LearningRoomStats;
}

export function useLearningRoomData() {
  return useQuery<LearningRoomResponse>({
    queryKey: ['learning-room'],
    queryFn: async () => {
      const res = await fetch('/api/learning-room');
      if (!res.ok) throw new Error('Failed to load learning room data');
      const json = await res.json();
      return json.data;
    },
  });
}

export function useCreateLearningSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLearningSessionInput) => {
      const res = await fetch('/api/learning-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save session');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-room'] });
    },
  });
}


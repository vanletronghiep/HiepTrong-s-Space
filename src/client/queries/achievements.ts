import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AchievementItem,
  CreateAchievementInput,
  PatchAchievementInput,
} from '@/contracts/achievement';

export function useAchievements(era?: string) {
  return useQuery<AchievementItem[]>({
    queryKey: ['achievements', era],
    queryFn: async () => {
      const url = era && era !== 'all' ? `/api/achievements?era=${era}` : '/api/achievements';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load achievements');
      const json = await res.json();
      return json.data;
    },
  });
}

export function useCreateAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAchievementInput) => {
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create achievement');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}

export function useUpdateAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: PatchAchievementInput }) => {
      const res = await fetch(`/api/achievements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Failed to update achievement');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}

export function useDeleteAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/achievements/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete achievement');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}


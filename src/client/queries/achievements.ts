'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AchievementItem,
  CreateAchievementInput,
  PatchAchievementInput,
} from '@/contracts/achievement';
import { apiRequest } from '../api-client';

export const achievementKeys = {
  all: ['achievements'] as const,
  list: (era?: string) => ['achievements', era ?? 'all'] as const,
};

export function useAchievements(era?: string) {
  return useQuery<AchievementItem[]>({
    queryKey: achievementKeys.list(era),
    queryFn: async () => {
      const url = era && era !== 'all' ? `/api/achievements?era=${era}` : '/api/achievements';
      const res = await apiRequest<{ success: boolean; data: AchievementItem[] }>(url);
      return res.data;
    },
  });
}

export function useCreateAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAchievementInput) => {
      const res = await apiRequest<{ success: boolean; data: AchievementItem }>('/api/achievements', {
        method: 'POST',
        body: input,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: achievementKeys.all });
    },
  });
}

export function useUpdateAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: PatchAchievementInput }) => {
      const res = await apiRequest<{ success: boolean; data: AchievementItem }>(`/api/achievements/${id}`, {
        method: 'PATCH',
        body: patch,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: achievementKeys.all });
    },
  });
}

export function useDeleteAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest<void>(`/api/achievements/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: achievementKeys.all });
    },
  });
}

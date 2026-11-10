'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateMilestoneInput, MilestoneItem } from '@/contracts/milestone';
import { apiRequest } from '../api-client';

export const milestoneKeys = {
  all: ['milestones'] as const,
  list: () => ['milestones', 'list'] as const,
  detail: (id: string) => ['milestones', 'detail', id] as const,
};

export function useMilestones() {
  return useQuery({
    queryKey: milestoneKeys.list(),
    queryFn: async () => {
      const res = await apiRequest<{ items: MilestoneItem[] }>('/api/milestones');
      return res.items;
    },
    refetchInterval: 60_000,
  });
}

export function useCreateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMilestoneInput) => {
      const res = await apiRequest<{ item: MilestoneItem }>('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return res.item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
    },
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CreateMilestoneInput> }) => {
      const res = await apiRequest<{ item: MilestoneItem }>(`/api/milestones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      return res.item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
    },
  });
}

export function useToggleLandmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      milestoneId,
      landmarkId,
    }: {
      milestoneId: string;
      landmarkId: string;
    }) => {
      const res = await apiRequest<{ item: MilestoneItem }>(
        `/api/milestones/${milestoneId}/toggle-landmark`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ landmarkId }),
        },
      );
      return res.item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
    },
  });
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest<{ ok: boolean }>(`/api/milestones/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
    },
  });
}


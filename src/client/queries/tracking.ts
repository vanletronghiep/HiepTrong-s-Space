'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateHabitInput,
  HabitItem,
  LogScreenTimeInput,
  LogSleepInput,
  ScreenTimeLog,
  SleepLog,
  TrackingData,
} from '@/contracts/tracking';
import { apiRequest } from '../api-client';

export const trackingKeys = {
  all: ['tracking'] as const,
};

export function useTrackingData() {
  return useQuery<TrackingData>({
    queryKey: trackingKeys.all,
    queryFn: async () => {
      const res = await apiRequest<{ success: boolean; data: TrackingData }>('/api/tracking');
      return res.data;
    },
  });
}

export function useToggleHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const res = await apiRequest<{ success: boolean; data: HabitItem }>('/api/tracking?action=toggle-habit', {
        method: 'POST',
        body: { habitId, date },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackingKeys.all });
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateHabitInput) => {
      const res = await apiRequest<{ success: boolean; data: HabitItem }>('/api/tracking?action=habit', {
        method: 'POST',
        body: input,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackingKeys.all });
    },
  });
}

export function useLogSleep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogSleepInput) => {
      const res = await apiRequest<{ success: boolean; data: SleepLog }>('/api/tracking?action=sleep', {
        method: 'POST',
        body: input,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackingKeys.all });
    },
  });
}

export function useLogScreenTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogScreenTimeInput) => {
      const res = await apiRequest<{ success: boolean; data: ScreenTimeLog }>('/api/tracking?action=screen-time', {
        method: 'POST',
        body: input,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackingKeys.all });
    },
  });
}

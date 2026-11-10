import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateHabitInput,
  LogScreenTimeInput,
  LogSleepInput,
  TrackingData,
} from '@/contracts/tracking';

export function useTrackingData() {
  return useQuery<TrackingData>({
    queryKey: ['tracking'],
    queryFn: async () => {
      const res = await fetch('/api/tracking');
      if (!res.ok) throw new Error('Failed to load tracking data');
      const json = await res.json();
      return json.data;
    },
  });
}

export function useToggleHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const res = await fetch('/api/tracking?action=toggle-habit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, date }),
      });
      if (!res.ok) throw new Error('Failed to toggle habit');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking'] });
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateHabitInput) => {
      const res = await fetch('/api/tracking?action=habit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create habit');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking'] });
    },
  });
}

export function useLogSleep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogSleepInput) => {
      const res = await fetch('/api/tracking?action=sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to log sleep');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking'] });
    },
  });
}

export function useLogScreenTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogScreenTimeInput) => {
      const res = await fetch('/api/tracking?action=screen-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to log screen time');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking'] });
    },
  });
}


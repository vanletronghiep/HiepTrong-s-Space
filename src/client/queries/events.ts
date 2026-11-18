'use client';

import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  CreateEventInput,
  EventItem,
  EventOccurrence,
  OccurrenceMutation,
  PatchEventInput,
} from '@/contracts/event';
import { apiRequest } from '../api-client';

export const eventKeys = {
  all: ['events'] as const,
  list: () => ['events', 'list'] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
  occurrences: (from: string, to: string) => ['events', 'occurrences', from, to] as const,
};

const EVENT_DRAFT_KEY = ['event-drafts'] as const;

/** Stored records (compatibility access, draft source lookup, and editing). */
export function useEvents() {
  return useQuery({
    queryKey: eventKeys.list(),
    queryFn: async () => {
      const res = await apiRequest<{ items: EventItem[] }>('/api/events');
      return res.items;
    },
    refetchInterval: 60_000,
  });
}

/** Resolved occurrences for the half-open Asia/Saigon local-date range [from, to). */
export function useEventOccurrences(from: string, to: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: eventKeys.occurrences(from, to),
    queryFn: async () => {
      const params = new URLSearchParams({ from, to });
      const res = await apiRequest<{ items: EventOccurrence[] }>(
        `/api/events/occurrences?${params.toString()}`,
      );
      return res.items;
    },
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

/** Every Events mutation refreshes records, occurrence windows, counts, and drafts. */
function useInvalidateEvents() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: eventKeys.all }),
      queryClient.invalidateQueries({ queryKey: EVENT_DRAFT_KEY }),
    ]);
}

export function useCreateEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const res = await apiRequest<{ item: EventItem }>('/api/events', {
        method: 'POST',
        body: input,
      });
      return res.item;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: PatchEventInput }) => {
      const res = await apiRequest<{ item: EventItem }>(`/api/events/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: patch,
      });
      return res.item;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest<{ ok: boolean }>(`/api/events/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    onSuccess: invalidate,
  });
}

export interface OccurrenceMutationResponse {
  item: EventItem | null;
  occurrence: EventOccurrence | null;
  removed: boolean;
}

export function useMutateOccurrence() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async ({ id, mutation }: { id: string; mutation: OccurrenceMutation }) =>
      apiRequest<OccurrenceMutationResponse>(`/api/events/${encodeURIComponent(id)}/occurrences`, {
        method: 'POST',
        body: mutation,
      }),
    onSuccess: invalidate,
  });
}

/** Requests stay well inside the 366-day server bound; 12-week chunks also cache per batch. */
export const OCCURRENCE_CHUNK_DAYS = 84;

function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + days)).toISOString().slice(0, 10);
}

export function chunkOccurrenceRange(from: string, to: string): Array<[string, string]> {
  const chunks: Array<[string, string]> = [];
  for (let start = from; start < to; start = shiftDate(start, OCCURRENCE_CHUNK_DAYS)) {
    const end = shiftDate(start, OCCURRENCE_CHUNK_DAYS);
    chunks.push([start, end < to ? end : to]);
  }
  return chunks;
}

export interface OccurrenceWindow {
  occurrences: EventOccurrence[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/** Occurrences for [from, to), fetched in bounded chunks and de-duplicated by key. */
export function useEventOccurrenceWindow(
  from: string,
  to: string,
  options: { enabled?: boolean } = {},
): OccurrenceWindow {
  const chunks = chunkOccurrenceRange(from, to);
  return useQueries({
    queries: chunks.map(([chunkFrom, chunkTo]) => ({
      queryKey: eventKeys.occurrences(chunkFrom, chunkTo),
      queryFn: async () => {
        const params = new URLSearchParams({ from: chunkFrom, to: chunkTo });
        const res = await apiRequest<{ items: EventOccurrence[] }>(
          `/api/events/occurrences?${params.toString()}`,
        );
        return res.items;
      },
      enabled: options.enabled ?? true,
      placeholderData: keepPreviousData,
      refetchInterval: 60_000,
    })),
    // combine keeps a stable result object until the underlying query data changes.
    combine: (results) => {
      const byKey = new Map<string, EventOccurrence>();
      for (const result of results) {
        for (const occurrence of result.data ?? []) byKey.set(occurrence.key, occurrence);
      }
      return {
        occurrences: [...byKey.values()].sort(
          (a, b) => Date.parse(a.startAt) - Date.parse(b.startAt) || (a.key < b.key ? -1 : 1),
        ),
        isLoading: results.some((result) => result.isLoading),
        isError: results.some((result) => result.isError),
        refetch: () => {
          for (const result of results) void result.refetch();
        },
      };
    },
  });
}

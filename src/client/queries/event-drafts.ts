'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EventItem } from '@/contracts/event';
import type {
  EventDraftRecord,
  PatchEventDraftInput,
  PublishEventDraftResult,
  SaveEventDraftInput,
} from '@/contracts/event-draft';
import { apiRequest } from '../api-client';
import { eventKeys } from './events';

export const eventDraftKeys = {
  all: ['event-drafts'] as const,
  list: () => ['event-drafts', 'list'] as const,
  detail: (id: string) => ['event-drafts', 'detail', id] as const,
};

export function useEventDrafts() {
  return useQuery({
    queryKey: eventDraftKeys.list(),
    queryFn: async () => {
      const res = await apiRequest<{ items: EventDraftRecord[] }>('/api/event-drafts');
      return res.items;
    },
  });
}

export function useSaveEventDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveEventDraftInput) => {
      return apiRequest<{ item: EventDraftRecord; created: boolean }>('/api/event-drafts', {
        method: 'POST',
        body: input,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: eventDraftKeys.all });
    },
  });
}

export function useUpdateEventDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: PatchEventDraftInput }) => {
      const res = await apiRequest<{ item: EventDraftRecord }>(
        `/api/event-drafts/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          body: patch,
        },
      );
      return res.item;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: eventDraftKeys.all });
    },
  });
}

export function useDeleteEventDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest<{ ok: boolean }>(`/api/event-drafts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: eventDraftKeys.all });
    },
  });
}

export function usePublishEventDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, forceOverwrite }: { id: string; forceOverwrite?: boolean }) => {
      const res = await apiRequest<{
        item: EventItem;
        alreadyPublished: boolean;
        mode: 'create' | 'update';
      }>(`/api/event-drafts/${encodeURIComponent(id)}/publish`, {
        method: 'POST',
        body: forceOverwrite ? { forceOverwrite: true } : {},
      });
      return {
        event: res.item,
        alreadyPublished: res.alreadyPublished,
        mode: res.mode,
      } satisfies PublishEventDraftResult;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventDraftKeys.all }),
        queryClient.invalidateQueries({ queryKey: eventKeys.all }),
      ]);
    },
  });
}

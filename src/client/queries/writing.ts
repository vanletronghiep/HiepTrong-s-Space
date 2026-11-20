'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreatePrivateEntryInput,
  CreateWritingPageInput,
  PatchPrivateEntryInput,
  PatchWritingPageInput,
  PrivateEntry,
  PrivateStatus,
  WritingPage,
  WritingRoom,
} from '@/contracts/writing';
import { apiRequest } from '../api-client';

export const writingKeys = {
  all: ['writing'] as const,
  pages: (room: WritingRoom) => ['writing', 'pages', room] as const,
  privateStatus: ['writing', 'private', 'status'] as const,
  privateEntries: ['writing', 'private', 'entries'] as const,
};

/* ── Pages (Draft Room, My Perspective) ──────────────────────────────── */

export function useWritingPages(room: WritingRoom) {
  return useQuery({
    queryKey: writingKeys.pages(room),
    queryFn: async () => {
      const res = await apiRequest<{ items: WritingPage[] }>(`/api/writing/pages?room=${room}`);
      return res.items;
    },
  });
}

/** Every room's pages, for the shelf counts and search. */
export function useAllWritingPages() {
  return useQuery({
    queryKey: ['writing', 'pages', 'all'] as const,
    queryFn: async () => {
      const res = await apiRequest<{ items: WritingPage[] }>('/api/writing/pages');
      return res.items;
    },
  });
}

function replaceInList(
  list: WritingPage[] | undefined,
  page: WritingPage,
): WritingPage[] | undefined {
  if (!list) return list;
  const exists = list.some((item) => item.id === page.id);
  return exists ? list.map((item) => (item.id === page.id ? page : item)) : [page, ...list];
}

export function useCreateWritingPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateWritingPageInput) => {
      const res = await apiRequest<{ item: WritingPage }>('/api/writing/pages', {
        method: 'POST',
        body: input,
      });
      return res.item;
    },
    onSuccess: (page) => {
      queryClient.setQueryData<WritingPage[]>(writingKeys.pages(page.room as WritingRoom), (list) =>
        replaceInList(list, page),
      );
      void queryClient.invalidateQueries({ queryKey: ['writing', 'pages', 'all'] });
    },
  });
}

/**
 * Updates one page. The server's copy replaces the cached one, so frequent autosaves do not
 * refetch the whole list.
 */
export function useUpdateWritingPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: PatchWritingPageInput }) => {
      const res = await apiRequest<{ item: WritingPage }>(`/api/writing/pages/${id}`, {
        method: 'PATCH',
        body: patch,
      });
      return res.item;
    },
    onSuccess: (page, variables) => {
      queryClient.setQueryData<WritingPage[]>(writingKeys.pages(page.room as WritingRoom), (list) =>
        replaceInList(list, page),
      );
      // Moving a page to another room, trashing or restoring changes descendants too.
      if (
        variables.patch.room !== undefined ||
        variables.patch.trashed !== undefined ||
        variables.patch.parentId !== undefined
      ) {
        void queryClient.invalidateQueries({ queryKey: ['writing', 'pages'] });
      } else {
        void queryClient.invalidateQueries({ queryKey: ['writing', 'pages', 'all'] });
      }
    },
  });
}

export function useDeleteWritingPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest<{ ok: boolean }>(`/api/writing/pages/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['writing', 'pages'] });
    },
  });
}

/* ── Private Room ────────────────────────────────────────────────────── */

export function usePrivateStatus() {
  return useQuery({
    queryKey: writingKeys.privateStatus,
    queryFn: async () => {
      const res = await apiRequest<{ status: PrivateStatus }>('/api/writing/private/status');
      return res.status;
    },
    refetchOnWindowFocus: true,
  });
}

function useAfterVaultChange() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: writingKeys.privateStatus });
    void queryClient.invalidateQueries({ queryKey: writingKeys.privateEntries });
  };
}

export function useSetupPrivate() {
  const done = useAfterVaultChange();
  return useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest<{ recoveryCode: string }>('/api/writing/private/setup', {
        method: 'POST',
        body: { password },
      });
      return res.recoveryCode;
    },
    onSuccess: done,
  });
}

export function useUnlockPrivate() {
  const done = useAfterVaultChange();
  return useMutation({
    mutationFn: async (secret: { password?: string; recoveryCode?: string }) => {
      await apiRequest<{ ok: boolean }>('/api/writing/private/unlock', {
        method: 'POST',
        body: secret,
      });
    },
    onSuccess: done,
  });
}

export function useResetPrivatePassword() {
  const done = useAfterVaultChange();
  return useMutation({
    mutationFn: async (input: { recoveryCode: string; newPassword: string }) => {
      await apiRequest<{ ok: boolean }>('/api/writing/private/reset', {
        method: 'POST',
        body: input,
      });
    },
    onSuccess: done,
  });
}

export function useLockPrivate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiRequest<{ ok: boolean }>('/api/writing/private/lock', { method: 'POST' });
    },
    onSuccess: () => {
      // Drop decrypted entries from memory as soon as the room locks.
      queryClient.removeQueries({ queryKey: writingKeys.privateEntries });
      void queryClient.invalidateQueries({ queryKey: writingKeys.privateStatus });
    },
  });
}

export function usePrivateEntries(enabled: boolean) {
  return useQuery({
    queryKey: writingKeys.privateEntries,
    enabled,
    // Decrypted text should not linger in the cache once nobody is looking at it.
    gcTime: 0,
    queryFn: async () => {
      const res = await apiRequest<{ items: PrivateEntry[] }>('/api/writing/private/entries');
      return res.items;
    },
  });
}

export function useCreatePrivateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePrivateEntryInput) => {
      const res = await apiRequest<{ item: PrivateEntry }>('/api/writing/private/entries', {
        method: 'POST',
        body: input,
      });
      return res.item;
    },
    onSuccess: (entry) => {
      queryClient.setQueryData<PrivateEntry[]>(writingKeys.privateEntries, (list) =>
        list ? [entry, ...list] : [entry],
      );
    },
  });
}

export function useUpdatePrivateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: PatchPrivateEntryInput }) => {
      const res = await apiRequest<{ item: PrivateEntry }>(`/api/writing/private/entries/${id}`, {
        method: 'PATCH',
        body: patch,
      });
      return res.item;
    },
    onSuccess: (entry) => {
      queryClient.setQueryData<PrivateEntry[]>(writingKeys.privateEntries, (list) =>
        list?.map((item) => (item.id === entry.id ? entry : item)),
      );
    },
  });
}

export function useDeletePrivateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest<{ ok: boolean }>(`/api/writing/private/entries/${id}`, { method: 'DELETE' });
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData<PrivateEntry[]>(writingKeys.privateEntries, (list) =>
        list?.filter((item) => item.id !== id),
      );
    },
  });
}

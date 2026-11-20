'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProjectInput, PatchProjectInput, ProjectItem } from '@/contracts/project';
import { apiRequest } from '../api-client';

export const projectKeys = {
  all: ['projects'] as const,
  list: () => ['projects', 'list'] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      const res = await apiRequest<{ items: ProjectItem[] }>('/api/projects');
      return res.items;
    },
    refetchInterval: 60_000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const res = await apiRequest<{ item: ProjectItem }>('/api/projects', {
        method: 'POST',
        body: input,
      });
      return res.item;
    },
    onSuccess: (item) => {
      queryClient.setQueryData<ProjectItem[]>(projectKeys.list(), (items) =>
        items ? [...items, item] : [item],
      );
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: PatchProjectInput }) => {
      const res = await apiRequest<{ item: ProjectItem }>(`/api/projects/${id}`, {
        method: 'PATCH',
        body: patch,
      });
      return res.item;
    },
    // Show edits at once; the server's reply (stamps, history lines) replaces them on settle.
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.list() });
      const { finished, logNote, editNote, deleteNote, ...fields } = patch;
      void logNote; // the server stamps new notes, so they appear on settle
      queryClient.setQueryData<ProjectItem[]>(projectKeys.list(), (items) =>
        items?.map((item) => {
          if (item.id !== id) return item;
          let history = item.history;
          if (editNote) {
            history = history.map((entry) =>
              entry.id === editNote.id ? { ...entry, text: editNote.text } : entry,
            );
          }
          if (deleteNote) history = history.filter((entry) => entry.id !== deleteNote);
          return {
            ...item,
            ...fields,
            history,
            ...(finished === undefined
              ? {}
              : { finishedAt: finished ? new Date().toISOString() : null }),
          };
        }),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest<{ ok: boolean }>(`/api/projects/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

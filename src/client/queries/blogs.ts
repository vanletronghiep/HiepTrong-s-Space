'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BlogArticle,
  CreateBlogArticleInput,
  PatchBlogArticleInput,
} from '@/contracts/blog';
import { apiRequest } from '../api-client';

export const blogKeys = {
  all: ['blogs'] as const,
  list: (category?: string, authorship?: string, tag?: string) =>
    ['blogs', category, authorship, tag] as const,
  detail: (id?: string) => ['blogs', 'article', id] as const,
};

export function useBlogArticles(category?: string, authorship?: string, tag?: string) {
  return useQuery<BlogArticle[]>({
    queryKey: blogKeys.list(category, authorship, tag),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.set('category', category);
      if (authorship && authorship !== 'all') params.set('authorship', authorship);
      if (tag && tag !== 'all') params.set('tag', tag);

      const query = params.toString();
      const url = query ? `/api/blogs?${query}` : '/api/blogs';
      const res = await apiRequest<{ success: boolean; data: BlogArticle[] }>(url);
      return res.data;
    },
  });
}

export function useBlogArticle(id?: string) {
  return useQuery<BlogArticle>({
    queryKey: blogKeys.detail(id),
    queryFn: async () => {
      const res = await apiRequest<{ success: boolean; data: BlogArticle }>(`/api/blogs/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateBlogArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBlogArticleInput) => {
      const res = await apiRequest<{ success: boolean; data: BlogArticle }>('/api/blogs', {
        method: 'POST',
        body: input,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
  });
}

export function useUpdateBlogArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: PatchBlogArticleInput }) => {
      const res = await apiRequest<{ success: boolean; data: BlogArticle }>(`/api/blogs/${id}`, {
        method: 'PATCH',
        body: patch,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
  });
}

export function useDeleteBlogArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest<void>(`/api/blogs/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
  });
}

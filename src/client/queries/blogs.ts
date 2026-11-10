import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BlogArticle,
  CreateBlogArticleInput,
  PatchBlogArticleInput,
} from '@/contracts/blog';

export function useBlogArticles(category?: string, authorship?: string, tag?: string) {
  return useQuery<BlogArticle[]>({
    queryKey: ['blogs', category, authorship, tag],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.set('category', category);
      if (authorship && authorship !== 'all') params.set('authorship', authorship);
      if (tag && tag !== 'all') params.set('tag', tag);

      const res = await fetch(`/api/blogs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load articles');
      const json = await res.json();
      return json.data;
    },
  });
}

export function useBlogArticle(id?: string) {
  return useQuery<BlogArticle>({
    queryKey: ['blogs', 'article', id],
    queryFn: async () => {
      const res = await fetch(`/api/blogs/${id}`);
      if (!res.ok) throw new Error('Failed to load article');
      const json = await res.json();
      return json.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateBlogArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBlogArticleInput) => {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to publish article');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });
}

export function useUpdateBlogArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: PatchBlogArticleInput }) => {
      const res = await fetch(`/api/blogs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update article');
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });
}

export function useDeleteBlogArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/blogs/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete article');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });
}


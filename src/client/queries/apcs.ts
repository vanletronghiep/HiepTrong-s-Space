'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApcsDirectoryListing, ApcsFileItem, ApcsOverview } from '@/contracts/apcs';
import { apiRequest } from '../api-client';

export const apcsKeys = {
  all: ['apcs'] as const,
  overview: () => ['apcs', 'overview'] as const,
  directory: (subpath: string) => ['apcs', 'dir', subpath] as const,
  search: (query: string, course?: string, category?: string) =>
    ['apcs', 'search', query, course, category] as const,
};

export function useApcsOverview() {
  return useQuery<ApcsOverview>({
    queryKey: apcsKeys.overview(),
    queryFn: async () => {
      const res = await apiRequest<{ success: boolean; data: ApcsOverview }>('/api/apcs');
      return res.data;
    },
  });
}

export function useApcsDirectory(subpath: string) {
  return useQuery<ApcsDirectoryListing>({
    queryKey: apcsKeys.directory(subpath),
    queryFn: async () => {
      const res = await apiRequest<{ success: boolean; data: ApcsDirectoryListing }>(
        `/api/apcs?path=${encodeURIComponent(subpath)}`,
      );
      return res.data;
    },
    enabled: subpath !== undefined,
  });
}

export function useApcsSearch(query: string, course?: string, category?: string) {
  return useQuery<ApcsFileItem[]>({
    queryKey: apcsKeys.search(query, course, category),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (course) params.set('course', course);
      if (category && category !== 'all') params.set('category', category);

      const res = await apiRequest<{ success: boolean; data: ApcsFileItem[] }>(
        `/api/apcs/search?${params.toString()}`,
      );
      return res.data;
    },
    enabled: Boolean(query.trim() || course || (category && category !== 'all')),
  });
}

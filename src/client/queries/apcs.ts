import { useQuery } from '@tanstack/react-query';
import type { ApcsDirectoryListing, ApcsFileItem, ApcsOverview } from '@/contracts/apcs';

export function useApcsOverview() {
  return useQuery<ApcsOverview>({
    queryKey: ['apcs', 'overview'],
    queryFn: async () => {
      const res = await fetch('/api/apcs');
      if (!res.ok) throw new Error('Failed to load APCS overview');
      const json = await res.json();
      return json.data;
    },
  });
}

export function useApcsDirectory(subpath: string) {
  return useQuery<ApcsDirectoryListing>({
    queryKey: ['apcs', 'dir', subpath],
    queryFn: async () => {
      const res = await fetch(`/api/apcs?path=${encodeURIComponent(subpath)}`);
      if (!res.ok) throw new Error('Failed to load directory');
      const json = await res.json();
      return json.data;
    },
    enabled: subpath !== undefined,
  });
}

export function useApcsSearch(query: string, course?: string, category?: string) {
  return useQuery<ApcsFileItem[]>({
    queryKey: ['apcs', 'search', query, course, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (course) params.set('course', course);
      if (category && category !== 'all') params.set('category', category);

      const res = await fetch(`/api/apcs/search?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      const json = await res.json();
      return json.data;
    },
    enabled: Boolean(query.trim() || course || (category && category !== 'all')),
  });
}


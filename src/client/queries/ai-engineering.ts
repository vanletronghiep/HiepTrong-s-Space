import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AiEngineeringData,
  CreateAiNoteInput,
} from '@/contracts/ai-engineering';

export function useAiEngineeringData() {
  return useQuery<AiEngineeringData>({
    queryKey: ['ai-engineering'],
    queryFn: async () => {
      const res = await fetch('/api/ai-engineering');
      if (!res.ok) throw new Error('Failed to load AI Engineering data');
      const json = await res.json();
      return json.data;
    },
  });
}

export function useToggleAiTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stageId, topicId }: { stageId: string; topicId: string }) => {
      const res = await fetch('/api/ai-engineering?action=toggle-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId, topicId }),
      });
      if (!res.ok) throw new Error('Failed to toggle topic');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-engineering'] });
    },
  });
}

export function useCreateAiNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAiNoteInput) => {
      const res = await fetch('/api/ai-engineering?action=note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create note');
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-engineering'] });
    },
  });
}


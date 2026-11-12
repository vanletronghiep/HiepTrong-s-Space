'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AiEngineeringData,
  AiNotionNote,
  CreateAiNoteInput,
} from '@/contracts/ai-engineering';
import { apiRequest } from '../api-client';

export const aiEngineeringKeys = {
  all: ['ai-engineering'] as const,
};

export function useAiEngineeringData() {
  return useQuery<AiEngineeringData>({
    queryKey: aiEngineeringKeys.all,
    queryFn: async () => {
      const res = await apiRequest<{ success: boolean; data: AiEngineeringData }>('/api/ai-engineering');
      return res.data;
    },
  });
}

export function useToggleAiTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stageId, topicId }: { stageId: string; topicId: string }) => {
      const res = await apiRequest<{ success: boolean }>('/api/ai-engineering?action=toggle-topic', {
        method: 'POST',
        body: { stageId, topicId },
      });
      return res.success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiEngineeringKeys.all });
    },
  });
}

export function useCreateAiNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAiNoteInput) => {
      const res = await apiRequest<{ success: boolean; data: AiNotionNote }>('/api/ai-engineering?action=note', {
        method: 'POST',
        body: input,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiEngineeringKeys.all });
    },
  });
}

import { z } from 'zod';

export type StageStatus = 'completed' | 'in_progress' | 'upcoming';

export const aiTopicItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  completed: z.boolean(),
  nextStep: z.string().optional(),
});

export type AiTopicItem = z.infer<typeof aiTopicItemSchema>;

export const aiRoadmapStageSchema = z.object({
  id: z.string(),
  order: z.number(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['completed', 'in_progress', 'upcoming']),
  topics: z.array(aiTopicItemSchema),
});

export type AiRoadmapStage = z.infer<typeof aiRoadmapStageSchema>;

export const aiNotionNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  stageId: z.string(),
  topic: z.string(),
  notionSourceUrl: z.string(),
  lastSyncedAt: z.string(),
  summary: z.string(),
  keyTakeaways: z.array(z.string()),
  readingContent: z.string(),
  relatedProject: z.string().nullable().default(null),
});

export type AiNotionNote = z.infer<typeof aiNotionNoteSchema>;

export const aiEngineeringDataSchema = z.object({
  roadmap: z.array(aiRoadmapStageSchema),
  notes: z.array(aiNotionNoteSchema),
  stats: z.object({
    totalTopics: z.number(),
    completedTopics: z.number(),
    currentFocusTopic: z.string(),
    nextRecommendedStep: z.string(),
  }),
});

export type AiEngineeringData = z.infer<typeof aiEngineeringDataSchema>;

export const createAiNoteInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  stageId: z.string(),
  topic: z.string().min(1, 'Topic is required'),
  notionSourceUrl: z.string().default('https://notion.so'),
  summary: z.string().default(''),
  keyTakeaways: z.array(z.string()).default([]),
  readingContent: z.string().min(1, 'Content is required'),
  relatedProject: z.string().nullable().optional(),
});

export type CreateAiNoteInput = z.input<typeof createAiNoteInputSchema>;


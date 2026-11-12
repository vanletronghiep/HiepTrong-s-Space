import { randomUUID } from 'node:crypto';
import type {
  AiEngineeringData,
  AiNotionNote,
  AiRoadmapStage,
  CreateAiNoteInput,
} from '@/contracts/ai-engineering';
import { JsonFileStore } from '@/services/storage/json-store';

interface StoredAiState {
  id: string;
  roadmap: AiRoadmapStage[];
  notes: AiNotionNote[];
}

const aiStore = new JsonFileStore<StoredAiState>('ai-engineering-data.json');

export class AiEngineeringService {
  private async getState(): Promise<StoredAiState> {
    const list = await aiStore.getAll();
    if (list[0]) return list[0];
    const defaultState: StoredAiState = {
      id: 'singleton-ai-state',
      roadmap: [],
      notes: [],
    };
    return defaultState;
  }

  async getData(): Promise<AiEngineeringData> {
    const state = await this.getState();
    const allTopics = state.roadmap.flatMap((s) => s.topics);
    const completedTopics = allTopics.filter((t) => t.completed).length;

    // Current focus topic: first incomplete topic in an in_progress stage
    const currentStage = state.roadmap.find((s) => s.status === 'in_progress') ?? state.roadmap[1];
    const focusTopic = currentStage?.topics.find((t) => !t.completed) ?? currentStage?.topics[0];

    return {
      roadmap: state.roadmap,
      notes: state.notes,
      stats: {
        totalTopics: allTopics.length,
        completedTopics,
        currentFocusTopic: focusTopic ? focusTopic.name : 'No topic selected',
        nextRecommendedStep:
          focusTopic?.nextStep ?? 'Choose a learning topic to plan the next step.',
      },
    };
  }

  async toggleTopic(stageId: string, topicId: string): Promise<boolean> {
    return aiStore.update(await this.getState(), (state) => {
      const stage = state.roadmap.find((s) => s.id === stageId);
      if (!stage) return false;

      const topic = stage.topics.find((t) => t.id === topicId);
      if (!topic) return false;

      topic.completed = !topic.completed;
      return true;
    });
  }

  async addNote(input: CreateAiNoteInput): Promise<AiNotionNote> {
    return aiStore.update(await this.getState(), (state) => {
      const newNote: AiNotionNote = {
        id: `note-${randomUUID().slice(0, 8)}`,
        title: input.title,
        stageId: input.stageId,
        topic: input.topic,
        notionSourceUrl: input.notionSourceUrl ?? 'https://notion.so',
        lastSyncedAt: new Date().toISOString(),
        summary: input.summary ?? '',
        keyTakeaways: input.keyTakeaways ?? [],
        readingContent: input.readingContent,
        relatedProject: input.relatedProject ?? null,
      };

      state.notes.unshift(newNote);
      return newNote;
    });
  }
}

export const aiEngineeringService = new AiEngineeringService();


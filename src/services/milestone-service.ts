import { NotFoundError } from './errors';
import { createMilestoneInputSchema, type CreateMilestoneInput, type MilestoneItem } from '@/contracts/milestone';
import { JsonFileStore } from './storage/json-store';

export class MilestoneService {
  private readonly store = new JsonFileStore<MilestoneItem>('milestones.json');

  async listMilestones(): Promise<MilestoneItem[]> {
    return this.store.getAll();
  }

  async getMilestone(id: string): Promise<MilestoneItem | null> {
    return this.store.getById(id);
  }

  async createMilestone(input: CreateMilestoneInput): Promise<MilestoneItem> {
    const validated = createMilestoneInputSchema.parse(input);
    const nowIso = new Date().toISOString();
    const item: MilestoneItem = {
      ...validated,
      id: crypto.randomUUID(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    return this.store.save(item);
  }

  async updateMilestone(
    id: string,
    patch: Partial<CreateMilestoneInput>,
  ): Promise<MilestoneItem | null> {
    return this.store.modify(id, (existing) => {
      const landmarks = patch.landmarks
        ? patch.landmarks.map((lm) => ({
            id: lm.id,
            title: lm.title,
            completed: Boolean(lm.completed),
            completedAt: lm.completedAt ?? null,
          }))
        : existing.landmarks;
      const updated: MilestoneItem = {
        ...existing,
        ...patch,
        landmarks,
        updatedAt: new Date().toISOString(),
      };
      return updated;
    });
  }

  async toggleLandmark(milestoneId: string, landmarkId: string): Promise<MilestoneItem | null> {
    return this.store.modify(milestoneId, (existing) => {
      if (!existing.landmarks.some(landmark => landmark.id === landmarkId)) throw new NotFoundError('Landmark not found');
      const updatedLandmarks = existing.landmarks.map((lm) => {
        if (lm.id === landmarkId) {
          const nextCompleted = !lm.completed;
          return {
            ...lm,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : null,
          };
        }
        return lm;
    });
    const allDone = updatedLandmarks.every((lm) => lm.completed);
    const updated: MilestoneItem = {
      ...existing,
      landmarks: updatedLandmarks,
      status: allDone ? 'achieved' : existing.status === 'achieved' ? 'in_progress' : existing.status,
      updatedAt: new Date().toISOString(),
    };
    return updated;
    });
  }

  async deleteMilestone(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}

export const milestoneService = new MilestoneService();

import { randomUUID } from 'node:crypto';
import type {
  AchievementItem,
  CreateAchievementInput,
  PatchAchievementInput,
} from '@/contracts/achievement';
import { JsonFileStore } from '@/services/storage/json-store';

const achievementStore = new JsonFileStore<AchievementItem>('achievements-data.json');

export class AchievementService {
  async getAchievements(era?: string): Promise<AchievementItem[]> {
    const list = await achievementStore.getAll();
    return list.filter((a) => !era || era === 'all' || a.era === era);
  }

  async getAchievementById(id: string): Promise<AchievementItem | null> {
    return achievementStore.getById(id);
  }

  async createAchievement(input: CreateAchievementInput): Promise<AchievementItem> {
    const newAchievement: AchievementItem = {
      id: `ach-${randomUUID().slice(0, 8)}`,
      title: input.title,
      era: input.era,
      year: input.year,
      awardOrRole: input.awardOrRole ?? '',
      organization: input.organization ?? '',
      description: input.description ?? '',
      lessonsLearned: input.lessonsLearned ?? '',
      futureDate: input.futureDate ?? null,
      reminderEnabled: input.reminderEnabled ?? false,
      featured: input.featured ?? false,
    };

    await achievementStore.save(newAchievement);
    return newAchievement;
  }

  async updateAchievement(id: string, patch: PatchAchievementInput): Promise<AchievementItem | null> {
    return achievementStore.modify(id, (existing) => {

      const updated: AchievementItem = {
        ...existing,
        ...patch,
        title: patch.title ?? existing.title,
        era: patch.era ?? existing.era,
        year: patch.year ?? existing.year,
      };

      return updated;
    });
  }

  async deleteAchievement(id: string): Promise<boolean> {
    return achievementStore.delete(id);
  }
}

export const achievementService = new AchievementService();


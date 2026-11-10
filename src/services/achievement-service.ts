import { randomUUID } from 'node:crypto';
import type {
  AchievementItem,
  CreateAchievementInput,
  PatchAchievementInput,
} from '@/contracts/achievement';
import { JsonFileStore } from '@/services/storage/json-store';

const initialAchievements: AchievementItem[] = [
  {
    id: 'ach-1',
    title: 'Youth Informatics Contest - District Level',
    era: 'secondary',
    year: '2020',
    awardOrRole: 'Second Prize',
    organization: 'Department of Education and Training',
    description: 'Algorithmic problem-solving in C++ and basic combinatorics.',
    lessonsLearned: 'First experience writing competitive code under strict time limits. Realized that methodical problem analysis prevents edge-case bugs.',
    futureDate: null,
    reminderEnabled: false,
    featured: false,
  },
  {
    id: 'ach-2',
    title: 'Provincial Informatics Excellence Olympiad',
    era: 'high_school',
    year: '2023',
    awardOrRole: 'First Prize',
    organization: 'Provincial Department of Education',
    description: 'Advanced dynamic programming, tree decomposition, shortest path algorithms, and computational geometry.',
    lessonsLearned: 'Writing automated test harnesses and generator scripts is far more reliable than manual debugging on complex test cases.',
    futureDate: null,
    reminderEnabled: false,
    featured: true,
  },
  {
    id: 'ach-3',
    title: 'National High School Science & Engineering Fair',
    era: 'high_school',
    year: '2024',
    awardOrRole: 'Distinction Award',
    organization: 'Ministry of Education & Science Council',
    description: 'Applied machine learning prototype for localized agricultural environmental monitoring.',
    lessonsLearned: 'Clear scientific storytelling matters just as much as model accuracy. Judges respond to practical reliability over theoretical complexity.',
    futureDate: null,
    reminderEnabled: false,
    featured: true,
  },
  {
    id: 'ach-4',
    title: 'Admitted to Advanced Program in Computer Science (APCS)',
    era: 'university',
    year: '2025',
    awardOrRole: 'Honors Admission',
    organization: 'University of Science, VNU-HCM',
    description: 'Enrolled in the flagship international English-taught Computer Science program.',
    lessonsLearned: 'Transitioned from high school algorithmic sprints to sustained mathematical maturity and rigorous software systems architecture.',
    futureDate: null,
    reminderEnabled: false,
    featured: true,
  },
  {
    id: 'ach-5',
    title: 'CM102 Scientific Presentation Distinction',
    era: 'university',
    year: '2025',
    awardOrRole: 'Exemplary Presentation Team',
    organization: 'APCS Faculty of Information Technology',
    description: 'Peer-reviewed research observation report and technical defense.',
    lessonsLearned: 'Structuring presentations around a single compelling narrative hook keeps audiences engaged even through dry technical data.',
    futureDate: null,
    reminderEnabled: false,
    featured: false,
  },
  {
    id: 'ach-6',
    title: 'ICPC Vietnam National Programming Contest 2026',
    era: 'future_contest',
    year: '2026',
    awardOrRole: 'Registered Candidate Team',
    organization: 'ICPC Foundation & VAIP',
    description: 'Team-based collegiate algorithmic contest solving 12 problems in 5 hours.',
    lessonsLearned: 'Focus on communication protocols within the 3-person team and pre-allocating whiteboard time before touching the single keyboard.',
    futureDate: '2026-10-15T08:00:00.000Z',
    reminderEnabled: true,
    featured: true,
  },
];

const achievementStore = new JsonFileStore<AchievementItem>(
  'achievements-data.json',
  initialAchievements,
);

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
    const existing = await achievementStore.getById(id);
    if (!existing) return null;

    const updated: AchievementItem = {
      ...existing,
      ...patch,
      title: patch.title ?? existing.title,
      era: patch.era ?? existing.era,
      year: patch.year ?? existing.year,
    };

    await achievementStore.save(updated);
    return updated;
  }

  async deleteAchievement(id: string): Promise<boolean> {
    return achievementStore.delete(id);
  }
}

export const achievementService = new AchievementService();


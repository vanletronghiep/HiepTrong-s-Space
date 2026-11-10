import { createMilestoneInputSchema, type CreateMilestoneInput, type MilestoneItem } from '@/contracts/milestone';
import { JsonFileStore } from './storage/json-store';

const initialMilestones: MilestoneItem[] = [
  {
    id: 'ms-hts-v1',
    title: 'Complete and Launch Hiep Trong Space',
    meaning:
      'Have an everyday personal operating home that connects daily tasks, university study, writing, and future ambitions without fragmented tools.',
    category: 'project',
    timeframe: 'Semester 1 — 2026',
    targetDate: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    status: 'in_progress',
    reflection:
      'Great progress on the cosmic landing journey, observatory workspace, and inner spaces. Keeping code modular and craft standards high makes every session enjoyable.',
    landmarks: [
      { id: 'lm-1', title: 'Cosmic 3D Earth Scroll Journey & Starfield', completed: true, completedAt: new Date().toISOString() },
      { id: 'lm-2', title: 'Daily Task Management & Tasks Hub V2', completed: true, completedAt: new Date().toISOString() },
      { id: 'lm-3', title: 'Shared Notifications across deadlines and events', completed: true, completedAt: new Date().toISOString() },
      { id: 'lm-4', title: 'Inner spaces: Events, Projects, Milestones, Writing Room, APCS', completed: true, completedAt: new Date().toISOString() },
      { id: 'lm-5', title: 'Full end-to-end verification and production release', completed: false, completedAt: null },
    ],
    linkedProjectIds: ['proj-hiep-trong-space'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ms-apcs-year1',
    title: 'Master APCS Year I Computer Science Foundations',
    meaning:
      'Build an ironclad foundation in discrete mathematics, calculus, programming, and algorithms during my first year in the Advanced Program.',
    category: 'academic',
    timeframe: 'Year I (2026–2027)',
    targetDate: new Date(Date.now() + 180 * 86_400_000).toISOString(),
    status: 'in_progress',
    reflection: 'Calculus I and CS160 are challenging but rewarding. Daily deliberate practice is key.',
    landmarks: [
      { id: 'lm-apcs-1', title: 'Ace Calculus I Midterm & Final Examination', completed: false, completedAt: null },
      { id: 'lm-apcs-2', title: 'Complete CS160 Advanced Programming Assignments with clean memory', completed: false, completedAt: null },
      { id: 'lm-apcs-3', title: 'Master Linear Algebra and Discrete Mathematics proofs', completed: false, completedAt: null },
      { id: 'lm-apcs-4', title: 'Maintain overall academic GPA >= 8.5/10.0', completed: false, completedAt: null },
    ],
    linkedProjectIds: ['proj-apcs-algorithms'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ms-ai-deep-learning',
    title: 'AI & Deep Learning Engineering Competency',
    meaning:
      'Deepen theoretical understanding of optimization and neural networks while building practical AI applications and games.',
    category: 'career',
    timeframe: 'Year I – Year II',
    targetDate: new Date(Date.now() + 240 * 86_400_000).toISOString(),
    status: 'in_progress',
    reflection: 'Moving from classical ML concepts to modern PyTorch and MCTS architectures.',
    landmarks: [
      { id: 'lm-ai-1', title: 'Understand multivariable calculus and matrix calculus derivations', completed: true, completedAt: new Date().toISOString() },
      { id: 'lm-ai-2', title: 'Implement forward/backward propagation from scratch in Python', completed: true, completedAt: new Date().toISOString() },
      { id: 'lm-ai-3', title: 'Build Go Game with MCTS rollouts and neural position evaluation', completed: false, completedAt: null },
      { id: 'lm-ai-4', title: 'Curate structured study notes in AI Engineering space', completed: false, completedAt: null },
    ],
    linkedProjectIds: ['proj-go-game'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class MilestoneService {
  private readonly store = new JsonFileStore<MilestoneItem>('milestones.json', initialMilestones);

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
    const existing = await this.store.getById(id);
    if (!existing) return null;
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
    return this.store.save(updated);
  }

  async toggleLandmark(milestoneId: string, landmarkId: string): Promise<MilestoneItem | null> {
    const existing = await this.store.getById(milestoneId);
    if (!existing) return null;
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
    return this.store.save(updated);
  }

  async deleteMilestone(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}

export const milestoneService = new MilestoneService();

import { createProjectInputSchema, type CreateProjectInput, type ProjectItem } from '@/contracts/project';
import { JsonFileStore } from './storage/json-store';

const initialProjects: ProjectItem[] = [
  {
    id: 'proj-hiep-trong-space',
    title: 'Hiep Trong Space',
    overview:
      'A local-first, highly aesthetic personal operating space connecting daily responsibilities, university study, projects, writing, and ambitions into one coherent home.',
    status: 'active',
    progressPercent: 88,
    deadlineAt: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    blockers: null,
    nextStep: 'Complete all inner feature spaces and verify responsive behavior.',
    techStack: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'Drizzle ORM', 'SQLite', 'Three.js'],
    repoUrl: 'https://github.com/hieptrong/hiep-trong-space',
    liveUrl: 'http://localhost:3000',
    linkedTaskIds: [],
    linkedMilestoneIds: ['ms-hts-v1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj-go-game',
    title: 'Go Game (Weiqi AI)',
    overview:
      'An interactive Go (Weiqi) game engine and AI bot implementing alpha-beta pruning and Monte Carlo Tree Search for position evaluation.',
    status: 'in_progress',
    progressPercent: 45,
    deadlineAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    blockers: 'Optimizing liberty calculation and ko rule verification speed.',
    nextStep: 'Implement MCTS tree search rollouts with neural evaluation.',
    techStack: ['Python', 'Pygame', 'NumPy', 'PyTorch'],
    repoUrl: null,
    liveUrl: null,
    linkedTaskIds: [],
    linkedMilestoneIds: ['ms-ai-deep-learning'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj-apcs-algorithms',
    title: 'APCS Algorithms & Data Structures Lab',
    overview:
      'Collection of verified core computer science algorithms and memory-efficient data structures developed for HCMUS APCS coursework.',
    status: 'in_progress',
    progressPercent: 65,
    deadlineAt: new Date(Date.now() + 21 * 86_400_000).toISOString(),
    blockers: null,
    nextStep: 'Complete AVL and Red-Black tree rebalancing implementations with unit tests.',
    techStack: ['C++20', 'CMake', 'GoogleTest', 'Valgrind'],
    repoUrl: null,
    liveUrl: null,
    linkedTaskIds: [],
    linkedMilestoneIds: ['ms-apcs-year1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class ProjectService {
  private readonly store = new JsonFileStore<ProjectItem>('projects.json', initialProjects);

  async listProjects(): Promise<ProjectItem[]> {
    const items = await this.store.getAll();
    return items.sort((a, b) => b.progressPercent - a.progressPercent);
  }

  async getProject(id: string): Promise<ProjectItem | null> {
    return this.store.getById(id);
  }

  async createProject(input: CreateProjectInput): Promise<ProjectItem> {
    const validated = createProjectInputSchema.parse(input);
    const nowIso = new Date().toISOString();
    const item: ProjectItem = {
      ...validated,
      id: crypto.randomUUID(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    return this.store.save(item);
  }

  async updateProject(id: string, patch: Partial<CreateProjectInput>): Promise<ProjectItem | null> {
    const existing = await this.store.getById(id);
    if (!existing) return null;
    const updated: ProjectItem = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return this.store.save(updated);
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}

export const projectService = new ProjectService();

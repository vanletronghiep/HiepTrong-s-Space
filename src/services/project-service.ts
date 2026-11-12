import { createProjectInputSchema, type CreateProjectInput, type ProjectItem } from '@/contracts/project';
import { JsonFileStore } from './storage/json-store';

export class ProjectService {
  private readonly store = new JsonFileStore<ProjectItem>('projects.json');

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
    return this.store.modify(id, (existing) => {
      const updated: ProjectItem = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      return updated;
    });
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}

export const projectService = new ProjectService();

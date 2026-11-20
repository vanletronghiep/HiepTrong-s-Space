import {
  createProjectInputSchema,
  projectItemSchema,
  type CreateProjectInput,
  type PatchProjectInput,
  type ProjectItem,
  type RoadmapBlock,
} from '@/contracts/project';
import { sortFocuses } from '@/domain/project-domain';
import { JsonFileStore } from './storage/json-store';

/** Read any stored shape, including pre-revision records. The stored file is not rewritten. */
function normalize(raw: unknown): ProjectItem {
  return projectItemSchema.parse(raw);
}

/** Keep `doneAt` stamps true to the `done` flags. */
function stampRoadmap(
  previous: readonly RoadmapBlock[],
  next: readonly RoadmapBlock[],
  nowIso: string,
): RoadmapBlock[] {
  return next.map((block) => {
    if (!block.done) return { ...block, doneAt: null };
    const before = previous.find((b) => b.id === block.id);
    return { ...block, doneAt: before?.done ? (before.doneAt ?? nowIso) : nowIso };
  });
}

export class ProjectService {
  private readonly store = new JsonFileStore<ProjectItem>('projects.json');

  async listProjects(): Promise<ProjectItem[]> {
    const items = (await this.store.getAll()).map(normalize);
    return sortFocuses(items);
  }

  async getProject(id: string): Promise<ProjectItem | null> {
    const item = await this.store.getById(id);
    return item ? normalize(item) : null;
  }

  async createProject(input: CreateProjectInput): Promise<ProjectItem> {
    const validated = createProjectInputSchema.parse(input);
    const nowIso = new Date().toISOString();
    const base = normalize({
      ...validated,
      id: crypto.randomUUID(),
      history: [],
      linkedTaskIds: [],
      linkedMilestoneIds: [],
      finishedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    const roadmap = stampRoadmap([], base.roadmap, nowIso);
    return this.store.save({ ...base, roadmap });
  }

  async updateProject(id: string, patch: PatchProjectInput): Promise<ProjectItem | null> {
    const nowIso = new Date().toISOString();
    return this.store.modify(id, (stored) => {
      const existing = normalize(stored);
      const { logNote, editNote, deleteNote, finished, ...fields } = patch;
      const merged: ProjectItem = {
        ...existing,
        ...fields,
        roadmap: fields.roadmap
          ? stampRoadmap(existing.roadmap, fields.roadmap, nowIso)
          : existing.roadmap,
        finishedAt: finished === undefined ? existing.finishedAt : finished ? nowIso : null,
        updatedAt: nowIso,
      };
      if (merged.deadlineAt === null) merged.deadlinePhrase = null;

      let history = existing.history;
      if (editNote) {
        history = history.map((entry) =>
          entry.id === editNote.id && entry.text !== editNote.text
            ? { ...entry, text: editNote.text, editedAt: nowIso }
            : entry,
        );
      }
      if (deleteNote) history = history.filter((entry) => entry.id !== deleteNote);
      if (logNote) {
        history = [
          ...history,
          { id: crypto.randomUUID(), at: nowIso, text: logNote, editedAt: null },
        ];
      }
      return normalize({ ...merged, history });
    });
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}

export const projectService = new ProjectService();

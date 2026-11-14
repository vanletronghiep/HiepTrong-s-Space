import type {
  CreateProjectInput,
  PatchProjectInput,
  ProjectItem,
  ProjectStatus,
} from '@/contracts/project';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';

export interface ProjectEditorValues {
  title: string;
  overview: string;
  status: ProjectStatus;
  progressPercent: number;
  deadlineDate: string;
  nextStep: string;
  blockers: string;
  techStackText: string;
  repoUrl: string;
  liveUrl: string;
}

const VALID_PROJECT_STATUSES = new Set<ProjectStatus>([
  'active',
  'in_progress',
  'completed',
  'on_hold',
]);

export function defaultProjectEditorValues(): ProjectEditorValues {
  return {
    title: '',
    overview: '',
    status: 'active',
    progressPercent: 0,
    deadlineDate: '',
    nextStep: '',
    blockers: '',
    techStackText: '',
    repoUrl: '',
    liveUrl: '',
  };
}

function formatDeadlineInput(deadlineAt: string | null | undefined): string {
  if (!deadlineAt) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadlineAt)) {
    return deadlineAt;
  }
  const parsed = Date.parse(deadlineAt);
  if (Number.isNaN(parsed)) {
    return '';
  }
  return formatScheduledDate(new Date(parsed), DEFAULT_APP_TIMEZONE);
}

export function parseTechStackText(raw: string): string[] {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function clampProgressPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function projectEditorValues(project: ProjectItem): ProjectEditorValues {
  return {
    title: project.title,
    overview: project.overview,
    status: project.status,
    progressPercent: project.progressPercent,
    deadlineDate: formatDeadlineInput(project.deadlineAt),
    nextStep: project.nextStep ?? '',
    blockers: project.blockers ?? '',
    techStackText: project.techStack.join(', '),
    repoUrl: project.repoUrl ?? '',
    liveUrl: project.liveUrl ?? '',
  };
}

export function projectEditorCreateInput(values: ProjectEditorValues): CreateProjectInput {
  return {
    title: values.title.trim(),
    overview: values.overview.trim(),
    status: values.status,
    progressPercent: clampProgressPercent(values.progressPercent),
    deadlineAt: values.deadlineDate.trim() || null,
    nextStep: values.nextStep.trim() || null,
    blockers: values.blockers.trim() || null,
    techStack: parseTechStackText(values.techStackText),
    repoUrl: values.repoUrl.trim() || null,
    liveUrl: values.liveUrl.trim() || null,
    linkedTaskIds: [],
    linkedMilestoneIds: [],
  };
}

export function projectEditorPatch(
  project: ProjectItem,
  values: ProjectEditorValues,
): PatchProjectInput {
  const previous = projectEditorValues(project);
  const patch: PatchProjectInput = {};

  if (values.title !== previous.title) {
    patch.title = values.title.trim();
  }
  if (values.overview !== previous.overview) {
    patch.overview = values.overview.trim();
  }
  if (values.status !== previous.status) {
    patch.status = values.status;
  }
  if (values.progressPercent !== previous.progressPercent) {
    patch.progressPercent = clampProgressPercent(values.progressPercent);
  }
  if (values.deadlineDate !== previous.deadlineDate) {
    patch.deadlineAt = values.deadlineDate.trim() || null;
  }
  if (values.nextStep !== previous.nextStep) {
    patch.nextStep = values.nextStep.trim() || null;
  }
  if (values.blockers !== previous.blockers) {
    patch.blockers = values.blockers.trim() || null;
  }
  if (values.techStackText !== previous.techStackText) {
    patch.techStack = parseTechStackText(values.techStackText);
  }
  if (values.repoUrl !== previous.repoUrl) {
    patch.repoUrl = values.repoUrl.trim() || null;
  }
  if (values.liveUrl !== previous.liveUrl) {
    patch.liveUrl = values.liveUrl.trim() || null;
  }

  return patch;
}

export function sameProjectEditorValues(a: ProjectEditorValues, b: ProjectEditorValues): boolean {
  return (
    a.title === b.title &&
    a.overview === b.overview &&
    a.status === b.status &&
    a.progressPercent === b.progressPercent &&
    a.deadlineDate === b.deadlineDate &&
    a.nextStep === b.nextStep &&
    a.blockers === b.blockers &&
    a.techStackText === b.techStackText &&
    a.repoUrl === b.repoUrl &&
    a.liveUrl === b.liveUrl
  );
}

export function isProjectDraftValues(raw: unknown): raw is ProjectEditorValues {
  if (typeof raw !== 'object' || raw === null) {
    return false;
  }
  const value = raw as Record<string, unknown>;
  return (
    typeof value.title === 'string' &&
    typeof value.overview === 'string' &&
    typeof value.status === 'string' &&
    VALID_PROJECT_STATUSES.has(value.status as ProjectStatus) &&
    typeof value.progressPercent === 'number' &&
    Number.isFinite(value.progressPercent) &&
    value.progressPercent >= 0 &&
    value.progressPercent <= 100 &&
    typeof value.deadlineDate === 'string' &&
    typeof value.nextStep === 'string' &&
    typeof value.blockers === 'string' &&
    typeof value.techStackText === 'string' &&
    typeof value.repoUrl === 'string' &&
    typeof value.liveUrl === 'string'
  );
}

import type {
  CreateMilestoneInput,
  MilestoneCategory,
  MilestoneItem,
  MilestoneStatus,
  PatchMilestoneInput,
} from '@/contracts/milestone';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';

export interface MilestoneEditorLandmark {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
}

export interface MilestoneEditorValues {
  title: string;
  meaning: string;
  reflection: string;
  timeframe: string;
  targetDate: string;
  category: MilestoneCategory;
  status: MilestoneStatus;
  landmarks: MilestoneEditorLandmark[];
}

const VALID_MILESTONE_CATEGORIES = new Set<MilestoneCategory>([
  'personal',
  'academic',
  'career',
  'project',
]);

const VALID_MILESTONE_STATUSES = new Set<MilestoneStatus>(['planned', 'in_progress', 'achieved']);

export function defaultMilestoneEditorValues(): MilestoneEditorValues {
  return {
    title: '',
    meaning: '',
    reflection: '',
    timeframe: 'Year I (2026–2027)',
    targetDate: '',
    category: 'personal',
    status: 'in_progress',
    landmarks: [],
  };
}

function formatTargetDateInput(targetDate: string | null | undefined): string {
  if (!targetDate) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return targetDate;
  }
  const parsed = Date.parse(targetDate);
  if (Number.isNaN(parsed)) {
    return '';
  }
  return formatScheduledDate(new Date(parsed), DEFAULT_APP_TIMEZONE);
}

function cloneEditorLandmarks(landmarks: MilestoneItem['landmarks']): MilestoneEditorLandmark[] {
  return (landmarks ?? []).map((landmark) => ({
    id: landmark.id,
    title: landmark.title,
    completed: Boolean(landmark.completed),
    completedAt: landmark.completedAt ?? null,
  }));
}

function normalizeEditorLandmarks(
  landmarks: readonly MilestoneEditorLandmark[],
): MilestoneEditorLandmark[] {
  return landmarks
    .map((landmark) => ({
      id: landmark.id,
      title: landmark.title.trim(),
      completed: Boolean(landmark.completed),
      completedAt: landmark.completed ? (landmark.completedAt ?? null) : null,
    }))
    .filter((landmark) => landmark.title.length > 0);
}

function sameLandmarks(
  a: readonly MilestoneEditorLandmark[],
  b: readonly MilestoneEditorLandmark[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (!left || !right) {
      return false;
    }
    if (
      left.id !== right.id ||
      left.title !== right.title ||
      left.completed !== right.completed ||
      left.completedAt !== right.completedAt
    ) {
      return false;
    }
  }
  return true;
}

export function milestoneEditorValues(milestone: MilestoneItem): MilestoneEditorValues {
  return {
    title: milestone.title,
    meaning: milestone.meaning,
    reflection: milestone.reflection ?? '',
    timeframe: milestone.timeframe,
    targetDate: formatTargetDateInput(milestone.targetDate),
    category: milestone.category,
    status: milestone.status,
    landmarks: cloneEditorLandmarks(milestone.landmarks),
  };
}

export function milestoneEditorCreateInput(values: MilestoneEditorValues): CreateMilestoneInput {
  return {
    title: values.title.trim(),
    meaning: values.meaning.trim(),
    reflection: values.reflection.trim() || null,
    timeframe: values.timeframe.trim(),
    targetDate: values.targetDate.trim() || null,
    category: values.category,
    status: values.status,
    landmarks: normalizeEditorLandmarks(values.landmarks),
    linkedProjectIds: [],
  };
}

export function milestoneEditorPatch(
  milestone: MilestoneItem,
  values: MilestoneEditorValues,
): PatchMilestoneInput {
  const previous = milestoneEditorValues(milestone);
  const patch: PatchMilestoneInput = {};

  if (values.title !== previous.title) {
    patch.title = values.title.trim();
  }
  if (values.meaning !== previous.meaning) {
    patch.meaning = values.meaning.trim();
  }
  if (values.reflection !== previous.reflection) {
    patch.reflection = values.reflection.trim() || null;
  }
  if (values.timeframe !== previous.timeframe) {
    patch.timeframe = values.timeframe.trim();
  }
  if (values.targetDate !== previous.targetDate) {
    patch.targetDate = values.targetDate.trim() || null;
  }
  if (values.category !== previous.category) {
    patch.category = values.category;
  }
  if (values.status !== previous.status) {
    patch.status = values.status;
  }

  const normalizedLandmarks = normalizeEditorLandmarks(values.landmarks);
  if (!sameLandmarks(normalizedLandmarks, previous.landmarks)) {
    patch.landmarks = normalizedLandmarks;
  }

  return patch;
}

export function sameMilestoneEditorValues(
  a: MilestoneEditorValues,
  b: MilestoneEditorValues,
): boolean {
  return (
    a.title === b.title &&
    a.meaning === b.meaning &&
    a.reflection === b.reflection &&
    a.timeframe === b.timeframe &&
    a.targetDate === b.targetDate &&
    a.category === b.category &&
    a.status === b.status &&
    sameLandmarks(a.landmarks, b.landmarks)
  );
}

function isLandmarkDraftRow(raw: unknown): raw is MilestoneEditorLandmark {
  if (typeof raw !== 'object' || raw === null) {
    return false;
  }
  const item = raw as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    typeof item.title === 'string' &&
    typeof item.completed === 'boolean' &&
    (item.completedAt === null || typeof item.completedAt === 'string')
  );
}

export function isMilestoneDraftValues(raw: unknown): raw is MilestoneEditorValues {
  if (typeof raw !== 'object' || raw === null) {
    return false;
  }
  const value = raw as Record<string, unknown>;
  return (
    typeof value.title === 'string' &&
    typeof value.meaning === 'string' &&
    typeof value.reflection === 'string' &&
    typeof value.timeframe === 'string' &&
    typeof value.targetDate === 'string' &&
    typeof value.category === 'string' &&
    VALID_MILESTONE_CATEGORIES.has(value.category as MilestoneCategory) &&
    typeof value.status === 'string' &&
    VALID_MILESTONE_STATUSES.has(value.status as MilestoneStatus) &&
    Array.isArray(value.landmarks) &&
    value.landmarks.every(isLandmarkDraftRow)
  );
}

import type {
  AchievementEra,
  AchievementItem,
  CreateAchievementInput,
  PatchAchievementInput,
} from '@/contracts/achievement';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';

export interface AchievementEditorValues {
  title: string;
  era: AchievementEra;
  year: string;
  awardOrRole: string;
  organization: string;
  description: string;
  lessonsLearned: string;
  futureDate: string;
  reminderEnabled: boolean;
  featured: boolean;
}

const VALID_ACHIEVEMENT_ERAS = new Set<AchievementEra>([
  'elementary',
  'secondary',
  'high_school',
  'university',
  'future_contest',
]);

function currentAppYear(): string {
  return formatScheduledDate(new Date(), DEFAULT_APP_TIMEZONE).slice(0, 4);
}

export function defaultAchievementEditorValues(): AchievementEditorValues {
  return {
    title: '',
    era: 'university',
    year: currentAppYear(),
    awardOrRole: '',
    organization: '',
    description: '',
    lessonsLearned: '',
    futureDate: '',
    reminderEnabled: false,
    featured: false,
  };
}

function formatFutureDateInput(futureDate: string | null | undefined): string {
  if (!futureDate) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(futureDate)) {
    return futureDate;
  }
  const parsed = Date.parse(futureDate);
  if (Number.isNaN(parsed)) {
    return '';
  }
  return formatScheduledDate(new Date(parsed), DEFAULT_APP_TIMEZONE);
}

export function achievementEditorValues(item: AchievementItem): AchievementEditorValues {
  return {
    title: item.title,
    era: item.era,
    year: item.year,
    awardOrRole: item.awardOrRole,
    organization: item.organization,
    description: item.description,
    lessonsLearned: item.lessonsLearned ?? '',
    futureDate: formatFutureDateInput(item.futureDate),
    reminderEnabled: Boolean(item.reminderEnabled),
    featured: Boolean(item.featured),
  };
}

export function achievementEditorCreateInput(
  values: AchievementEditorValues,
): CreateAchievementInput {
  const isFutureContest = values.era === 'future_contest';
  return {
    title: values.title.trim(),
    era: values.era,
    year: values.year.trim(),
    awardOrRole: values.awardOrRole.trim(),
    organization: values.organization.trim(),
    description: values.description.trim(),
    lessonsLearned: values.lessonsLearned.trim(),
    futureDate: isFutureContest && values.futureDate.trim() ? values.futureDate.trim() : null,
    reminderEnabled: isFutureContest ? Boolean(values.reminderEnabled) : false,
    featured: Boolean(values.featured),
  };
}

export function achievementEditorPatch(
  item: AchievementItem,
  values: AchievementEditorValues,
): PatchAchievementInput {
  const previous = achievementEditorValues(item);
  const patch: PatchAchievementInput = {};
  const isFutureContest = values.era === 'future_contest';

  if (values.title !== previous.title) {
    patch.title = values.title.trim();
  }
  if (values.era !== previous.era) {
    patch.era = values.era;
  }
  if (values.year !== previous.year) {
    patch.year = values.year.trim();
  }
  if (values.awardOrRole !== previous.awardOrRole) {
    patch.awardOrRole = values.awardOrRole.trim();
  }
  if (values.organization !== previous.organization) {
    patch.organization = values.organization.trim();
  }
  if (values.description !== previous.description) {
    patch.description = values.description.trim();
  }
  if (values.lessonsLearned !== previous.lessonsLearned) {
    patch.lessonsLearned = values.lessonsLearned.trim();
  }

  const nextFutureDate =
    isFutureContest && values.futureDate.trim() ? values.futureDate.trim() : null;
  const prevFutureDate =
    previous.era === 'future_contest' && previous.futureDate.trim()
      ? previous.futureDate.trim()
      : null;
  if (nextFutureDate !== prevFutureDate) {
    patch.futureDate = nextFutureDate;
  }

  const nextReminder = isFutureContest ? Boolean(values.reminderEnabled) : false;
  const prevReminder =
    previous.era === 'future_contest' ? Boolean(previous.reminderEnabled) : false;
  if (nextReminder !== prevReminder) {
    patch.reminderEnabled = nextReminder;
  }

  if (Boolean(values.featured) !== Boolean(previous.featured)) {
    patch.featured = Boolean(values.featured);
  }

  return patch;
}

export function sameAchievementValues(
  a: AchievementEditorValues,
  b: AchievementEditorValues,
): boolean {
  return (
    a.title === b.title &&
    a.era === b.era &&
    a.year === b.year &&
    a.awardOrRole === b.awardOrRole &&
    a.organization === b.organization &&
    a.description === b.description &&
    a.lessonsLearned === b.lessonsLearned &&
    a.futureDate === b.futureDate &&
    a.reminderEnabled === b.reminderEnabled &&
    a.featured === b.featured
  );
}

export function isAchievementDraftValues(raw: unknown): raw is AchievementEditorValues {
  if (typeof raw !== 'object' || raw === null) {
    return false;
  }
  const value = raw as Record<string, unknown>;
  return (
    typeof value.title === 'string' &&
    typeof value.era === 'string' &&
    VALID_ACHIEVEMENT_ERAS.has(value.era as AchievementEra) &&
    typeof value.year === 'string' &&
    typeof value.awardOrRole === 'string' &&
    typeof value.organization === 'string' &&
    typeof value.description === 'string' &&
    typeof value.lessonsLearned === 'string' &&
    typeof value.futureDate === 'string' &&
    typeof value.reminderEnabled === 'boolean' &&
    typeof value.featured === 'boolean'
  );
}

import type { EventDraftEditorValues } from '@/contracts/event-draft';
import { isValidTimeHm, validateEditorValues } from '@/domain/event-editor-values';
import { DEFAULT_APP_TIMEZONE } from '@/domain/time';

export {
  blankEditorValues,
  editorTimes,
  editorValuesFromEvent as eventEditorValues,
  editorValuesFromOccurrence,
  eventEditorPatch,
  occurrenceEditFields,
  sameEditorValues,
  validateEditorValues,
} from '@/domain/event-editor-values';

export function isValidEventTimeHm(value: string): boolean {
  return isValidTimeHm(value);
}

/** Saved drafts publish only when their required fields are complete. */
export function isEventDraftPublishable(
  values: EventDraftEditorValues,
  options: { hasSource?: boolean } = {},
): boolean {
  return (
    Object.keys(validateEditorValues(values, { requireCategory: !options.hasSource })).length === 0
  );
}

export function formatZonedTime24(date: Date, timeZone: string = DEFAULT_APP_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).format(date);
}

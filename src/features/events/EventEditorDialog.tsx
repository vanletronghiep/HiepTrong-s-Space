'use client';

import { useRef, useState, type FormEvent } from 'react';
import { ClientApiError } from '@/client/api-client';
import {
  useDeleteEventDraft,
  usePublishEventDraft,
  useSaveEventDraft,
} from '@/client/queries/event-drafts';
import { useCreateEvent, useMutateOccurrence, useUpdateEvent } from '@/client/queries/events';
import {
  ORDINARY_EVENT_CATEGORIES,
  TIMETABLE_PERIODS,
  type EventCategory,
  type EventItem,
  type EventOccurrence,
  type OccurrenceScope,
} from '@/contracts/event';
import {
  eventDraftSourceKey,
  type EventDraftEditorValues,
  type EventDraftOccurrence,
  type EventDraftRecord,
} from '@/contracts/event-draft';
import { isWebUrl } from '@/domain/event-domain';
import { localDateOf, matchTimetablePeriod } from '@/domain/event-occurrence';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { DatePickerField } from '@/ui/DatePickerField';
import { Dialog } from '@/ui/Dialog';
import {
  LargeEditorDialog,
  LargeEditorTwoColumn,
  type DraftSaveOutcome,
} from '@/ui/LargeEditorDialog';
import { RichNoteEditor } from '@/ui/RichNoteEditor';
import { SelectField, type SelectOption } from '@/ui/SelectField';
import { TimeFieldControl } from '@/ui/TimeFieldControl';
import { CATEGORY_LABEL } from './EventBadges';
import {
  blankEditorValues,
  editorTimes,
  editorValuesFromOccurrence,
  eventEditorPatch,
  eventEditorValues,
  occurrenceEditFields,
  sameEditorValues,
  validateEditorValues,
} from './event-editor';
import { formatShortDay, formatTimestamp } from './events-format';

export type EditorRequest =
  | { mode: 'create-event'; date: string }
  | { mode: 'create-class'; date: string; periodIndex: number | null }
  | { mode: 'edit-event'; record: EventItem }
  | { mode: 'edit-occurrence'; record: EventItem; occurrence: EventOccurrence }
  | {
      mode: 'draft';
      draft: EventDraftRecord;
      record: EventItem | null;
      initialError?: string;
      staleConflict?: boolean;
    };

export interface EditorSaveResult {
  eventId: string;
  occurrenceKey: string | null;
  startAt: string;
}

export interface EventEditorDialogProps {
  request: EditorRequest;
  drafts: readonly EventDraftRecord[];
  sourceLoaded: boolean;
  onClose: () => void;
  onSaved: (result: EditorSaveResult) => void;
}

const ORDINARY_OPTIONS: readonly SelectOption<string>[] = ORDINARY_EVENT_CATEGORIES.map(
  (value) => ({
    value,
    label: CATEGORY_LABEL[value],
  }),
);

function initialValues(request: EditorRequest): EventDraftEditorValues {
  switch (request.mode) {
    case 'create-event':
      return blankEditorValues(request.date);
    case 'create-class': {
      const period = request.periodIndex === null ? null : TIMETABLE_PERIODS[request.periodIndex];
      return blankEditorValues(request.date, {
        kind: 'class',
        time: period?.start ?? '07:30',
        endTime: period?.end ?? '09:30',
        classWeekly: true,
      });
    }
    case 'edit-event':
      return eventEditorValues(request.record);
    case 'edit-occurrence':
      return editorValuesFromOccurrence(request.occurrence, request.record);
    case 'draft':
      return request.draft.values;
  }
}

function errorText(error: unknown, fallback: string): string {
  if (error instanceof ClientApiError && error.fields) {
    const first = Object.values(error.fields)[0];
    if (first) return `${error.message} (${first})`;
  }
  return error instanceof Error ? error.message : fallback;
}

/** Shared Events editor (v3.1 §6.2): ordinary events, classes, scoped class edits, drafts. */
export function EventEditorDialog({
  request,
  drafts,
  sourceLoaded,
  onClose,
  onSaved,
}: EventEditorDialogProps) {
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const occurrenceMutation = useMutateOccurrence();
  const saveDraftMutation = useSaveEventDraft();
  const deleteDraftMutation = useDeleteEventDraft();
  const publishDraftMutation = usePublishEventDraft();

  const titleRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);
  // The parent mounts one editor per request (keyed), so state initialises from it directly.
  const [values, setValues] = useState<EventDraftEditorValues>(() => initialValues(request));
  const [baseline, setBaseline] = useState<EventDraftEditorValues>(() => initialValues(request));
  const [setDefault, setSetDefault] = useState(
    () => request.mode === 'draft' && request.draft.occurrence?.scope === 'this-week-onward',
  );
  const [activeDraft, setActiveDraft] = useState<EventDraftRecord | null>(() =>
    request.mode === 'draft' ? request.draft : null,
  );
  const [loadedDraft, setLoadedDraft] = useState<EventDraftRecord | null>(() => {
    if (request.mode !== 'edit-event' && request.mode !== 'edit-occurrence') return null;
    const key = eventDraftSourceKey({
      sourceEventId: request.record.id,
      occurrence:
        request.mode === 'edit-occurrence' && request.occurrence.originalWeek
          ? { originalWeek: request.occurrence.originalWeek, scope: 'this-week' }
          : null,
    });
    return drafts.find((draft) => eventDraftSourceKey(draft) === key) ?? null;
  });
  const [error, setError] = useState(() =>
    request.mode === 'draft' ? (request.initialError ?? '') : '',
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [staleConflict, setStaleConflict] = useState(
    () => request.mode === 'draft' && Boolean(request.staleConflict),
  );
  const [submitting, setSubmitting] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertWeekly, setConvertWeekly] = useState<boolean | null>(null);
  const [convertEndTime, setConvertEndTime] = useState('');

  const record =
    request.mode === 'edit-event' || request.mode === 'edit-occurrence' || request.mode === 'draft'
      ? request.record
      : null;
  const occurrence = request.mode === 'edit-occurrence' ? request.occurrence : null;
  const draftOccurrence: EventDraftOccurrence | null =
    request.mode === 'draft'
      ? request.draft.occurrence
      : occurrence?.originalWeek
        ? {
            originalWeek: occurrence.originalWeek,
            scope: setDefault ? 'this-week-onward' : 'this-week',
          }
        : null;

  const isClass = values.kind === 'class';
  const isEditing = Boolean(record || (request.mode === 'draft' && request.draft.sourceEventId));
  const isLegacySchool = request.mode === 'edit-event' && request.record.category === 'school';
  const isDirty = !sameEditorValues(baseline, values);
  const missingSource =
    request.mode === 'draft' && Boolean(request.draft.sourceEventId) && !record && sourceLoaded;
  const periodMatch = isClass
    ? matchTimetablePeriod(values.time.trim(), values.endTime.trim())
    : null;

  const categoryOptions: readonly SelectOption<string>[] =
    values.category === 'school' || baseline.category === 'school'
      ? [...ORDINARY_OPTIONS, { value: 'school', label: CATEGORY_LABEL.school }]
      : ORDINARY_OPTIONS;

  const update = (patch: Partial<EventDraftEditorValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
    if (error) setError('');
    if (Object.keys(fieldErrors).length > 0) setFieldErrors({});
  };

  const scope: OccurrenceScope = setDefault ? 'this-week-onward' : 'this-week';

  const draftPayload = () => ({
    id: activeDraft?.id,
    sourceEventId: activeDraft ? activeDraft.sourceEventId : (record?.id ?? null),
    sourceUpdatedAt: activeDraft ? activeDraft.sourceUpdatedAt : (record?.updatedAt ?? null),
    sourceRevision: activeDraft ? activeDraft.sourceRevision : (record?.revision ?? null),
    occurrence: draftOccurrence,
    values,
    importKey: activeDraft?.importKey ?? null,
  });

  const handleSaveDraft = async (): Promise<DraftSaveOutcome> => {
    try {
      const result = await saveDraftMutation.mutateAsync(draftPayload());
      setActiveDraft(result.item);
      setLoadedDraft(null);
      setStaleConflict(false);
      setBaseline(values);
      return { ok: true, message: `Draft saved (${formatTimestamp(result.item.updatedAt)}).` };
    } catch (saveError) {
      return {
        ok: false,
        error: errorText(saveError, 'Could not save this draft right now. Your input is retained.'),
      };
    }
  };

  const submit = async (forceOverwrite = false) => {
    if (savingRef.current) return;
    const errors = validateEditorValues(values, {
      requireCategory: !(request.mode === 'draft' && request.draft.sourceEventId),
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(Object.values(errors)[0] ?? 'Check the highlighted fields.');
      if (errors.title) titleRef.current?.focus();
      return;
    }
    savingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const { startAt, endAt } = editorTimes(values);
      const location = values.location.trim() || null;
      const notes = values.notes.trim() || null;
      let result: EditorSaveResult;

      if (activeDraft) {
        if (!sameEditorValues(activeDraft.values, values)) {
          const saved = await saveDraftMutation.mutateAsync(draftPayload());
          setActiveDraft(saved.item);
        }
        const published = await publishDraftMutation.mutateAsync({
          id: activeDraft.id,
          forceOverwrite,
        });
        result = {
          eventId: published.event.id,
          occurrenceKey: activeDraft.occurrence
            ? `${published.event.id}@${activeDraft.occurrence.originalWeek}`
            : null,
          startAt: published.event.startAt,
        };
      } else if (request.mode === 'edit-occurrence' && occurrence?.originalWeek) {
        const response = await occurrenceMutation.mutateAsync({
          id: request.record.id,
          mutation: {
            action: 'edit',
            originalWeek: occurrence.originalWeek,
            scope,
            expectedRevision: request.record.revision,
            fields: occurrenceEditFields(values, scope, baseline),
          },
        });
        result = {
          eventId: request.record.id,
          occurrenceKey: response.occurrence?.key ?? occurrence.key,
          startAt: response.occurrence?.startAt ?? startAt,
        };
      } else if (request.mode === 'edit-event') {
        const saved = await updateMutation.mutateAsync({
          id: request.record.id,
          patch: {
            ...eventEditorPatch(request.record, values),
            expectedRevision: request.record.revision,
          },
        });
        result = { eventId: saved.id, occurrenceKey: saved.id, startAt: saved.startAt };
      } else if (isClass) {
        const created = await createMutation.mutateAsync({
          kind: 'class',
          title: values.title.trim(),
          startAt,
          endAt,
          location,
          highlighted: values.highlighted,
          notes,
          classRepeat: {
            weekly: values.classWeekly,
            endDate: values.classWeekly ? values.classEndDate.trim() || null : null,
          },
        });
        const week = created.classSchedule?.startWeek ?? null;
        result = {
          eventId: created.id,
          occurrenceKey: week ? `${created.id}@${week}` : created.id,
          startAt: created.startAt,
        };
      } else {
        const created = await createMutation.mutateAsync({
          kind: 'event',
          title: values.title.trim(),
          category: values.category,
          startAt,
          endAt,
          location,
          highlighted: values.highlighted,
          notes,
        });
        result = { eventId: created.id, occurrenceKey: created.id, startAt: created.startAt };
      }

      if (loadedDraft) await deleteDraftMutation.mutateAsync(loadedDraft.id).catch(() => undefined);
      onSaved(result);
    } catch (submitError) {
      if (submitError instanceof ClientApiError && submitError.code === 'CONFLICT' && activeDraft) {
        setStaleConflict(true);
      }
      setError(errorText(submitError, 'Could not save. Your input is retained.'));
    } finally {
      savingRef.current = false;
      setSubmitting(false);
    }
  };

  const runConversion = async () => {
    if (request.mode !== 'edit-event' || convertWeekly === null) return;
    const endTime = values.endTime.trim() || convertEndTime.trim();
    if (!endTime) {
      setError('Choose when the class ends before converting.');
      return;
    }
    setSubmitting(true);
    try {
      const { startAt, endAt } = editorTimes({ ...values, endDate: '', endTime });
      const converted = await updateMutation.mutateAsync({
        id: request.record.id,
        patch: {
          expectedRevision: request.record.revision,
          title: values.title.trim(),
          startAt,
          endAt,
          location: values.location.trim() || null,
          notes: values.notes.trim() || null,
          highlighted: values.highlighted,
          convertToClass: { weekly: convertWeekly, endDate: null },
        },
      });
      setConvertOpen(false);
      onSaved({
        eventId: converted.id,
        occurrenceKey: converted.classSchedule
          ? `${converted.id}@${converted.classSchedule.startWeek}`
          : converted.id,
        startAt: converted.startAt,
      });
    } catch (conversionError) {
      setError(errorText(conversionError, 'Could not convert this event.'));
      setConvertOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(false);
  };

  const scopeLabel =
    occurrence?.originalWeek && request.mode === 'edit-occurrence'
      ? localDateOf(occurrence.startAt) !== values.date && setDefault
        ? `Applies from the week of ${formatShortDay(occurrence.originalWeek)} onward, on the weekday you choose.`
        : setDefault
          ? `Applies from the week of ${formatShortDay(occurrence.originalWeek)} onward. Earlier weeks and later scheduled defaults stay as they are.`
          : `Changes only the class in the week of ${formatShortDay(occurrence.originalWeek)}.`
      : null;

  const title =
    request.mode === 'create-class'
      ? 'New class'
      : request.mode === 'edit-occurrence'
        ? 'Edit class'
        : request.mode === 'draft'
          ? request.draft.sourceEventId
            ? 'Resume edit draft'
            : 'Resume event draft'
          : isEditing
            ? 'Edit event'
            : 'New event';

  return (
    <>
      <LargeEditorDialog
        open
        onClose={onClose}
        title={title}
        description="Dates and times use the 24-hour Asia/Saigon schedule."
        formId="event-large-editor-form"
        isDirty={isDirty}
        isSubmitting={submitting}
        submitLabel={isEditing ? 'Apply changes' : 'Add to schedule'}
        submittingLabel={isEditing ? 'Applying…' : 'Adding…'}
        closeAriaLabel="Close event editor"
        initialFocusRef={titleRef}
        errorMessage={error}
        footerActions={
          <>
            {isLegacySchool ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={submitting}
                onClick={() => setConvertOpen(true)}
              >
                Convert to class
              </Button>
            ) : null}
            {staleConflict && activeDraft ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={submitting}
                onClick={() => void submit(true)}
              >
                Overwrite and apply
              </Button>
            ) : null}
          </>
        }
        draftRecovery={
          loadedDraft
            ? {
                savedAtLabel: formatTimestamp(loadedDraft.updatedAt),
                stale: Boolean(
                  record &&
                  ((loadedDraft.sourceRevision !== null &&
                    loadedDraft.sourceRevision !== record.revision) ||
                    (loadedDraft.sourceUpdatedAt !== null &&
                      loadedDraft.sourceUpdatedAt !== record.updatedAt)),
                ),
                staleMessage:
                  'This event changed after your draft was saved. Review changes carefully before applying.',
                onResume: () => {
                  setActiveDraft(loadedDraft);
                  setValues(loadedDraft.values);
                  setBaseline(loadedDraft.values);
                  setLoadedDraft(null);
                },
                onDiscard: () => {
                  const id = loadedDraft.id;
                  setLoadedDraft(null);
                  void deleteDraftMutation.mutateAsync(id).catch(() => undefined);
                },
              }
            : null
        }
        onSaveDraft={handleSaveDraft}
      >
        <form id="event-large-editor-form" onSubmit={handleSubmit} className="space-y-4">
          {missingSource ? (
            <div
              role="status"
              className="rounded-item border border-tint-overdue-border bg-tint-overdue-bg px-3.5 py-2.5 text-[length:var(--fs-small)] text-text-overdue"
            >
              The original event for this edit draft was deleted. Delete the draft or copy its
              content into a new event.
            </div>
          ) : null}

          {scopeLabel ? (
            <p
              role="status"
              className="rounded-item border border-ws-border bg-ws-accent-soft px-3.5 py-2.5 text-[length:var(--fs-small)] text-ws-text"
            >
              {scopeLabel}
            </p>
          ) : null}

          <LargeEditorTwoColumn
            primary={
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="event-editor-title"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text"
                  >
                    Title
                  </label>
                  <input
                    ref={titleRef}
                    id="event-editor-title"
                    type="text"
                    value={values.title}
                    aria-invalid={fieldErrors.title ? true : undefined}
                    onChange={(e) => update({ title: e.target.value })}
                    placeholder={isClass ? 'e.g. Calculus I' : 'e.g. Calculus I midterm'}
                    className="w-full h-11 rounded-item border border-ws-border bg-ws-surface px-3.5 text-[length:var(--fs-ui)] text-ws-text aria-[invalid=true]:border-tint-overdue-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    id="event-editor-notes-label"
                    htmlFor="event-editor-notes"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text"
                  >
                    Notes &amp; instructions
                  </label>
                  <RichNoteEditor
                    id="event-editor-notes"
                    ariaLabelledBy="event-editor-notes-label"
                    value={values.notes}
                    onChange={(notes) => update({ notes })}
                    placeholder="Preparation steps, room details, materials, or talking points…"
                  />
                </div>
              </>
            }
            metadata={
              <>
                {isClass ? (
                  <div className="space-y-1">
                    <span className="text-[length:var(--fs-small)] font-medium text-ws-text">
                      Type
                    </span>
                    <p className="text-[length:var(--fs-small)] text-ws-text-muted">
                      Class · shown in the School timetable when it matches a full period
                    </p>
                  </div>
                ) : (
                  <SelectField<string>
                    id="event-editor-category"
                    label="Category"
                    placeholder="Choose a category"
                    value={values.category ?? ''}
                    error={Boolean(fieldErrors.category)}
                    onChange={(category) => update({ category: category as EventCategory })}
                    options={categoryOptions}
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <DatePickerField
                    id="event-editor-date"
                    label={isClass ? 'Date' : 'Start date'}
                    mode="iso"
                    value={values.date}
                    onChange={(date) => update({ date })}
                    error={Boolean(fieldErrors.date)}
                  />
                  <TimeFieldControl
                    id="event-editor-time"
                    label="Start time"
                    value={values.time}
                    onChange={(time) => update({ time })}
                    placeholder="HH:mm"
                    error={Boolean(fieldErrors.time)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {isClass ? (
                    <div className="flex flex-col justify-end pb-2 text-[length:var(--fs-micro)] text-ws-text-muted">
                      {periodMatch !== null
                        ? `Matches ${TIMETABLE_PERIODS[periodMatch]?.start}–${TIMETABLE_PERIODS[periodMatch]?.end}`
                        : 'Outside the timetable periods'}
                    </div>
                  ) : (
                    <DatePickerField
                      id="event-editor-end-date"
                      label="End date (optional)"
                      mode="iso"
                      clearable
                      value={values.endDate}
                      onChange={(endDate) => update({ endDate })}
                      error={Boolean(fieldErrors.endDate)}
                    />
                  )}
                  <TimeFieldControl
                    id="event-editor-end-time"
                    label={isClass ? 'End time' : 'End time (optional)'}
                    value={values.endTime}
                    onChange={(endTime) => update({ endTime })}
                    placeholder="HH:mm"
                    error={Boolean(fieldErrors.endTime)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="event-editor-location"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text"
                  >
                    Location or link
                  </label>
                  <input
                    id="event-editor-location"
                    type="text"
                    value={values.location}
                    onChange={(e) => update({ location: e.target.value })}
                    placeholder="Room, hall, or meeting URL"
                    className="w-full h-11 rounded-item border border-ws-border bg-ws-surface px-3 text-[length:var(--fs-ui)] text-ws-text"
                  />
                  {isWebUrl(values.location) ? (
                    <p className="text-[length:var(--fs-micro)] text-ws-text-muted">
                      Detected a web link; it will open in a new tab.
                    </p>
                  ) : null}
                  {record?.location && record.url && record.url !== record.location ? (
                    <p className="text-[length:var(--fs-micro)] text-ws-text-muted [overflow-wrap:anywhere]">
                      Saved link kept: {record.url}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1 pt-1">
                  <Checkbox
                    id="event-editor-highlight"
                    checked={values.highlighted}
                    onCheckedChange={(highlighted) => update({ highlighted })}
                    label="Highlight this event"
                  />

                  {request.mode === 'create-class' ||
                  (request.mode === 'draft' && isClass && !request.draft.sourceEventId) ? (
                    <Checkbox
                      id="event-editor-set-default"
                      checked={values.classWeekly}
                      onCheckedChange={(classWeekly) => update({ classWeekly })}
                      label="Set Default · repeat weekly"
                    />
                  ) : null}

                  {request.mode === 'edit-occurrence' && occurrence?.isRepeating ? (
                    <Checkbox
                      id="event-editor-set-default"
                      checked={setDefault}
                      onCheckedChange={setSetDefault}
                      label="Set Default · apply from this week onward"
                    />
                  ) : null}
                </div>

                {(isClass && values.classWeekly && request.mode !== 'edit-occurrence') ||
                (request.mode === 'edit-occurrence' && setDefault) ? (
                  <DatePickerField
                    id="event-editor-class-end"
                    label="Repeat until (optional, inclusive)"
                    mode="iso"
                    clearable
                    value={values.classEndDate}
                    onChange={(classEndDate) => update({ classEndDate })}
                    error={Boolean(fieldErrors.classEndDate)}
                  />
                ) : null}
              </>
            }
          />
        </form>
      </LargeEditorDialog>

      <Dialog
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        title="Convert to class"
        description="This legacy School event becomes a class with the same ID. Confirm how it should be scheduled; nothing repeats unless you choose it."
        portal
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConvertOpen(false)}>
              Keep as event
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={convertWeekly === null || submitting}
              onClick={() => void runConversion()}
            >
              Convert
            </Button>
          </>
        }
      >
        <fieldset className="space-y-2">
          <legend className="text-[length:var(--fs-small)] font-medium text-ws-text">
            Schedule
          </legend>
          <label className="flex items-center gap-2 text-[length:var(--fs-small)] text-ws-text">
            <input
              type="radio"
              name="convert-schedule"
              checked={convertWeekly === true}
              onChange={() => setConvertWeekly(true)}
            />
            Repeat weekly from {values.date ? formatShortDay(values.date) : 'its date'}
          </label>
          <label className="flex items-center gap-2 text-[length:var(--fs-small)] text-ws-text">
            <input
              type="radio"
              name="convert-schedule"
              checked={convertWeekly === false}
              onChange={() => setConvertWeekly(false)}
            />
            Single class on that date only
          </label>
          {!values.endTime.trim() ? (
            <TimeFieldControl
              id="convert-end-time"
              label="Class end time"
              value={convertEndTime}
              onChange={setConvertEndTime}
              placeholder="HH:mm"
            />
          ) : null}
          <p className="text-[length:var(--fs-micro)] text-ws-text-muted">
            {matchTimetablePeriod(values.time.trim(), (values.endTime || convertEndTime).trim()) !==
            null
              ? 'This time matches a timetable period and will occupy that cell.'
              : 'This time does not match a timetable period; the class stays visible in lists and the Week calendar only.'}
          </p>
        </fieldset>
      </Dialog>
    </>
  );
}

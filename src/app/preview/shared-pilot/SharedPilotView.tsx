'use client';

import { useState } from 'react';
import { extractNotePlainText } from '@/domain/note-format';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { DatePickerField } from '@/ui/DatePickerField';
import { Dialog } from '@/ui/Dialog';
import { Drawer } from '@/ui/Drawer';
import { FeatureThemeProvider } from '@/ui/FeatureTheme';
import { FormattedNoteContent } from '@/ui/FormattedNoteContent';
import { LargeEditorDialog, LargeEditorTwoColumn } from '@/ui/LargeEditorDialog';
import { RichNoteEditor } from '@/ui/RichNoteEditor';
import { SelectField, type SelectOption } from '@/ui/SelectField';
import { TimeFieldControl } from '@/ui/TimeFieldControl';

const PRIORITY_OPTIONS: readonly SelectOption<'normal' | 'urgent' | 'optional'>[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'normal', label: 'Normal' },
  { value: 'optional', label: 'Optional' },
];

const EVENT_CATEGORIES: readonly SelectOption<'academic' | 'personal' | 'deadline'>[] = [
  { value: 'academic', label: 'Academic' },
  { value: 'personal', label: 'Personal' },
  { value: 'deadline', label: 'Deadline' },
];

export function SharedPilotView() {
  const [taskNotes, setTaskNotes] = useState(
    'Focus on **core architecture** before polish:\n\n- Verify round-trip Markdown serialization\n- Check nested **Dialog** Escape ordering',
  );
  const [taskDate, setTaskDate] = useState('15/11');
  const [taskTime, setTaskTime] = useState('19:30');
  const [taskPriority, setTaskPriority] = useState<'normal' | 'urgent' | 'optional'>('normal');
  const [taskPinned, setTaskPinned] = useState(true);

  const [eventNotes, setEventNotes] = useState(
    'Bring **seminar notes** and lab sheet.\n\n- Room B204 check-in at 13:45\n- Review Vietnamese diacritics (Tiếng Việt)',
  );
  const [eventDate, setEventDate] = useState('2026-11-20');
  const [eventTime, setEventTime] = useState('14:00');
  const [eventCategory, setEventCategory] = useState<'academic' | 'personal' | 'deadline'>('academic');
  const [isExam, setIsExam] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [largeEditorOpen, setLargeEditorOpen] = useState(false);
  const [largeTitle, setLargeTitle] = useState('Pilot event draft');
  const [largeDirty, setLargeDirty] = useState(true);

  return (
    <main
      id="main-content"
      data-theme="workspace"
      className="min-h-[100svh] bg-ws-bg px-4 py-8 text-ws-text md:px-8"
    >
      <div className="mx-auto max-w-[1160px] space-y-6">
        <header className="space-y-2 border-b border-ws-border pb-4">
          <p className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted">
            Milestone 1 · Shared editor & themed control pilot
          </p>
          <h1 className="font-display text-[length:var(--fs-h1)] font-semibold text-ws-text">
            Formatted Notes & Accessible Controls
          </h1>
          <p className="max-w-2xl text-[length:var(--fs-small)] text-ws-text-muted">
            Fixture-backed preview testing Bold & Bullets Tiptap editing, 24-hour time, themed
            calendar/select popups, and focus/Escape ownership across nested overlays.
          </p>
        </header>

        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" size="sm" onClick={() => setDialogOpen(true)}>
            Open nested Dialog
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
            Open nested Drawer
          </Button>
          <Button variant="primary" size="sm" onClick={() => setLargeEditorOpen(true)}>
            Open LargeEditorDialog
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FeatureThemeProvider name="tasks-hub">
            <section
              data-feature-theme="tasks-hub"
              className="rounded-card border border-ws-border bg-ws-bg p-5 space-y-4 shadow-task"
            >
              <div className="space-y-1">
                <span className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted">
                  Tasks Hub theme
                </span>
                <h2 className="font-display text-[length:var(--fs-h2)] font-semibold text-ws-text">
                  Daily & Tasks Controls
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <DatePickerField
                  id="pilot-task-date"
                  mode="task"
                  label="Due date (DD/MM)"
                  value={taskDate}
                  onChange={setTaskDate}
                />
                <TimeFieldControl
                  id="pilot-task-time"
                  label="Due time (24h)"
                  value={taskTime}
                  onChange={setTaskTime}
                />
                <SelectField
                  id="pilot-task-priority"
                  label="Priority"
                  value={taskPriority}
                  onChange={setTaskPriority}
                  options={PRIORITY_OPTIONS}
                />
              </div>

              <Checkbox
                id="pilot-task-pinned"
                checked={taskPinned}
                onCheckedChange={setTaskPinned}
                label="Pin task to Daily top shelf"
              />

              <div className="space-y-1.5">
                <label
                  htmlFor="pilot-task-notes"
                  className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                >
                  Task description
                </label>
                <RichNoteEditor
                  id="pilot-task-notes"
                  value={taskNotes}
                  onChange={setTaskNotes}
                  maxLength={500}
                />
              </div>

              <div className="rounded-item border border-ws-border bg-ws-surface p-3.5 space-y-2">
                <span className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted block">
                  Rendered description & compact plain-text preview
                </span>
                <FormattedNoteContent value={taskNotes} />
                <p className="border-t border-ws-border pt-2 text-[length:var(--fs-micro)] text-ws-text-muted line-clamp-2">
                  Card preview: {extractNotePlainText(taskNotes)}
                </p>
              </div>
            </section>
          </FeatureThemeProvider>

          <FeatureThemeProvider name="events">
            <section
              data-feature-theme="events"
              className="rounded-card border border-ws-border bg-ws-bg p-5 space-y-4 shadow-task"
            >
              <div className="space-y-1">
                <span className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted">
                  Events theme
                </span>
                <h2 className="font-display text-[length:var(--fs-h2)] font-semibold text-ws-text">
                  Events Controls
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <DatePickerField
                  id="pilot-event-date"
                  mode="iso"
                  label="Date (ISO)"
                  value={eventDate}
                  onChange={setEventDate}
                  clearable
                />
                <TimeFieldControl
                  id="pilot-event-time"
                  label="Time (24h)"
                  value={eventTime}
                  onChange={setEventTime}
                />
                <SelectField
                  id="pilot-event-category"
                  label="Category"
                  value={eventCategory}
                  onChange={setEventCategory}
                  options={EVENT_CATEGORIES}
                />
              </div>

              <Checkbox
                id="pilot-event-exam"
                checked={isExam}
                onCheckedChange={setIsExam}
                label="Mark as exam session"
              />

              <div className="space-y-1.5">
                <label
                  htmlFor="pilot-event-notes"
                  className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                >
                  Event notes
                </label>
                <RichNoteEditor
                  id="pilot-event-notes"
                  value={eventNotes}
                  onChange={setEventNotes}
                />
              </div>

              <div className="rounded-item border border-ws-border bg-ws-surface p-3.5 space-y-2">
                <span className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted block">
                  Rendered details
                </span>
                <FormattedNoteContent value={eventNotes} />
              </div>
            </section>
          </FeatureThemeProvider>
        </div>
      </div>

      <FeatureThemeProvider name="events">
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Nested Events Dialog"
          description="Opening Select or Calendar inside this Dialog preserves Events tokens and closes the popup on Escape before closing the Dialog."
          portal
          footer={
            <Button variant="primary" size="sm" onClick={() => setDialogOpen(false)}>
              Done
            </Button>
          }
        >
          <div className="space-y-3">
            <SelectField
              id="pilot-dialog-category"
              label="Category inside Dialog"
              value={eventCategory}
              onChange={setEventCategory}
              options={EVENT_CATEGORIES}
            />
            <DatePickerField
              id="pilot-dialog-date"
              mode="iso"
              label="Date inside Dialog"
              value={eventDate}
              onChange={setEventDate}
            />
          </div>
        </Dialog>

        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Nested Events Drawer"
          portal
        >
          <div className="space-y-4">
            <SelectField
              id="pilot-drawer-category"
              label="Category inside Drawer"
              value={eventCategory}
              onChange={setEventCategory}
              options={EVENT_CATEGORIES}
            />
            <TimeFieldControl
              id="pilot-drawer-time"
              label="Time inside Drawer"
              value={eventTime}
              onChange={setEventTime}
            />
            <RichNoteEditor
              id="pilot-drawer-notes"
              ariaLabel="Notes inside Drawer"
              value={eventNotes}
              onChange={setEventNotes}
            />
          </div>
        </Drawer>

        <LargeEditorDialog
          open={largeEditorOpen}
          onClose={() => setLargeEditorOpen(false)}
          title="Pilot Event Editor"
          description="Tests equal-height 3-choice prompt and async draft callback."
          formId="pilot-large-form"
          isDirty={largeDirty}
          submitLabel="Add to schedule"
          onSaveDraft={async () => {
            await new Promise((resolve) => window.setTimeout(resolve, 120));
            setLargeDirty(false);
            return { ok: true, message: 'Async draft saved.' };
          }}
          portal
        >
          <form
            id="pilot-large-form"
            onSubmit={(event) => {
              event.preventDefault();
              setLargeEditorOpen(false);
            }}
          >
            <LargeEditorTwoColumn
              primary={
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="pilot-large-title"
                      className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                    >
                      Event title
                    </label>
                    <input
                      id="pilot-large-title"
                      type="text"
                      value={largeTitle}
                      onChange={(event) => {
                        setLargeTitle(event.target.value);
                        setLargeDirty(true);
                      }}
                      className="w-full rounded-item border border-ws-border bg-ws-surface px-3 py-2 text-[length:var(--fs-small)] text-ws-text"
                    />
                  </div>
                  <RichNoteEditor
                    id="pilot-large-notes"
                    ariaLabel="Large editor notes"
                    value={eventNotes}
                    onChange={(next) => {
                      setEventNotes(next);
                      setLargeDirty(true);
                    }}
                  />
                </div>
              }
              metadata={
                <div className="space-y-3">
                  <SelectField
                    id="pilot-large-category"
                    label="Category"
                    value={eventCategory}
                    onChange={(next) => {
                      setEventCategory(next);
                      setLargeDirty(true);
                    }}
                    options={EVENT_CATEGORIES}
                  />
                  <DatePickerField
                    id="pilot-large-date"
                    mode="iso"
                    label="Date"
                    value={eventDate}
                    onChange={(next) => {
                      setEventDate(next);
                      setLargeDirty(true);
                    }}
                  />
                  <TimeFieldControl
                    id="pilot-large-time"
                    label="Time (24h)"
                    value={eventTime}
                    onChange={(next) => {
                      setEventTime(next);
                      setLargeDirty(true);
                    }}
                  />
                </div>
              }
            />
          </form>
        </LargeEditorDialog>
      </FeatureThemeProvider>
    </main>
  );
}

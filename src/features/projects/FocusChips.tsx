'use client';

import { useRef, useState, type ReactNode } from 'react';
import type { ProjectPriority, ProjectStatus } from '@/contracts/project';
import { PRIORITY_LABEL, STATUS_LABEL } from '@/domain/project-domain';
import { cn } from '@/ui/cn';
import { Popover } from '@/ui/Popover';
import { PriorityEmblem, StatusMeter } from './FocusBits';
import styles from './projects.module.css';

const STATUSES: ProjectStatus[] = ['intensive', 'steady', 'moderate', 'minimal', 'paused'];
const PRIORITIES: ProjectPriority[] = ['critical', 'active', 'background'];

/** A chip that opens a small menu in Edit mode and is plain text in View mode. */
function ChipMenu({
  label,
  trigger,
  editable,
  width = 220,
  children,
}: {
  label: string;
  trigger: ReactNode;
  editable: boolean;
  width?: number;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);

  if (!editable) return <span className={cn(styles.chip, styles.chipStatic)}>{trigger}</span>;

  const close = () => {
    setOpen(false);
    anchor.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <button
        ref={anchor}
        type="button"
        className={styles.chip}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger}
        <span className={styles.chipCaret} aria-hidden="true">
          ▾
        </span>
      </button>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchor}
        aria-label={label}
        align="left"
        width={width}
        portal
        autoFocusPanel
        className={styles.popoverSurface}
      >
        {children(close)}
      </Popover>
    </>
  );
}

export function StatusChipMenu({
  status,
  editable,
  onChange,
}: {
  status: ProjectStatus;
  editable: boolean;
  onChange: (status: ProjectStatus) => void;
}) {
  return (
    <ChipMenu
      label="Status"
      editable={editable}
      trigger={
        <>
          <StatusMeter status={status} />
          {STATUS_LABEL[status]}
        </>
      }
    >
      {(close) => (
        <div className={styles.menuList} role="group" aria-label="Status">
          {STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={status === value}
              onClick={() => {
                onChange(value);
                close();
              }}
            >
              <StatusMeter status={value} />
              {STATUS_LABEL[value]}
            </button>
          ))}
        </div>
      )}
    </ChipMenu>
  );
}

export function PriorityChipMenu({
  priority,
  editable,
  onChange,
}: {
  priority: ProjectPriority;
  editable: boolean;
  onChange: (priority: ProjectPriority) => void;
}) {
  return (
    <ChipMenu
      label="Priority"
      editable={editable}
      trigger={
        <>
          <PriorityEmblem priority={priority} />
          {PRIORITY_LABEL[priority]}
        </>
      }
    >
      {(close) => (
        <div className={styles.menuList} role="group" aria-label="Priority">
          {PRIORITIES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={priority === value}
              onClick={() => {
                onChange(value);
                close();
              }}
            >
              <PriorityEmblem priority={value} />
              {PRIORITY_LABEL[value]}
            </button>
          ))}
        </div>
      )}
    </ChipMenu>
  );
}

export function DeadlineChipMenu({
  summary,
  phrase,
  note,
  bad,
  editable,
  onPhraseChange,
}: {
  /** What the chip shows, such as "Due in 3 months". */
  summary: string;
  phrase: string;
  note: string;
  bad: boolean;
  editable: boolean;
  onPhraseChange: (value: string) => void;
}) {
  return (
    <ChipMenu label="Deadline" editable={editable} trigger={summary} width={280}>
      {(close) => (
        <div className={styles.menuDeadline}>
          <label className={styles.fieldLabel} htmlFor="focus-deadline">
            Deadline
          </label>
          <input
            id="focus-deadline"
            className={styles.textInput}
            value={phrase}
            maxLength={80}
            placeholder="e.g. in 3 weeks"
            autoComplete="off"
            aria-describedby="focus-deadline-note"
            onChange={(event) => onPhraseChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                close();
              }
            }}
          />
          <span
            id="focus-deadline-note"
            className={cn(styles.deadlineNote, bad && styles.deadlineBad)}
          >
            {note}
          </span>
        </div>
      )}
    </ChipMenu>
  );
}

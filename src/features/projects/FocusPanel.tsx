'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';
import { MAX_WHY_LENGTH, type PatchProjectInput, type ProjectItem } from '@/contracts/project';
import { MOTION_DURATION, MOTION_EASE } from '@/design/motion';
import {
  daysUntil,
  parseDeadlinePhrase,
  relativeDeadlineText,
  type DeadlineParse,
} from '@/domain/deadline-phrase';
import { draftHasContent, roadmapProgress } from '@/domain/project-domain';
import { useNavigationGuard } from '@/features/transitions/TransitionProvider';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { ConfirmDialog, Dialog } from '@/ui/Dialog';
import { useFeatureTheme } from '@/ui/FeatureTheme';
import { useFocusTrap } from '@/ui/use-focus-trap';
import { FocusHistory } from './FocusHistory';
import { PANEL_ART, artSrc, panelArtIndexFor } from './focus-art';
import { DeadlineChipMenu, PriorityChipMenu, StatusChipMenu } from './FocusChips';
import { Roadmap } from './Roadmap';
import styles from './projects.module.css';

const SAVE_DELAY_MS = 600;
const UNDO_MS = 6000;

/** Saves `value` shortly after typing stops, and once more when the panel closes. */
function useAutosave(
  value: string,
  saved: string,
  save: (value: string) => void,
  delay = SAVE_DELAY_MS,
) {
  const latest = useRef({ value, saved, save });
  useEffect(() => {
    latest.current = { value, saved, save };
  });
  useEffect(() => {
    if (value === saved) return;
    if (delay === 0) {
      latest.current.save(value);
      return;
    }
    const timer = window.setTimeout(() => latest.current.save(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, saved, delay]);
  useEffect(
    () => () => {
      const { value: v, saved: s, save: fn } = latest.current;
      if (v !== s) fn(v);
    },
    [],
  );
}

function describeParse(parse: DeadlineParse, todayIso: string): { text: string; bad: boolean } {
  if (parse.kind === 'empty')
    return { text: 'Type a date in words, or leave empty for none.', bad: false };
  if (parse.kind === 'none') return { text: 'No deadline', bad: false };
  if (parse.kind === 'invalid') {
    return {
      text: 'Not sure what date that is. Try “in 3 weeks”, “end of March” or “15/12”.',
      bad: true,
    };
  }
  const days = daysUntil(parse.date, todayIso);
  return { text: `${parse.date} · ${relativeDeadlineText(days)}`, bad: days < 0 };
}

export interface FocusPanelProps {
  project: ProjectItem;
  now: Date;
  todayIso: string;
  onPatch: (patch: PatchProjectInput) => void;
  onDelete: () => void;
  onClose: () => void;
  /** An unsaved new focus: nothing exists on the server until it is saved. */
  isDraft?: boolean;
  /** Saves the draft. Resolves to an error message, or null when it worked. */
  onSaveDraft?: (closeAfter: boolean) => Promise<string | null>;
}

export function FocusPanel({
  project,
  now,
  todayIso,
  onPatch,
  onDelete,
  onClose,
  isDraft = false,
  onSaveDraft,
}: FocusPanelProps) {
  const featureTheme = useFeatureTheme();
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(project.title);
  const [why, setWhy] = useState(project.why);
  const [phrase, setPhrase] = useState(project.deadlinePhrase ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addSignal, setAddSignal] = useState(0);
  const [undo, setUndo] = useState<{ label: string; restore: () => void } | null>(null);
  const [mounted, setMounted] = useState(false);
  // A saved focus keeps its art; a draft gets a random piece until it is saved.
  const [draftArt] = useState(() => Math.floor(Math.random() * PANEL_ART.length));
  const art = PANEL_ART[isDraft ? draftArt : panelArtIndexFor(project.id)] ?? PANEL_ART[0];
  // A focus opens in View; a brand-new, unnamed one opens ready to type.
  const [mode, setMode] = useState<'view' | 'edit'>(project.title && !isDraft ? 'view' : 'edit');
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const pendingNavigation = useRef<(() => void) | null>(null);
  const [view, setView] = useState<'split' | 'roadmap' | 'history'>('split');

  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => setMounted(true), []);
  const draftHasText =
    isDraft && draftHasContent({ ...project, title, why, deadlinePhrase: phrase });

  // Leaving a draft that has content asks first; an empty draft just closes.
  const requestClose = useCallback(() => {
    if (draftHasText) {
      setSaveError('');
      setLeaveOpen(true);
      return;
    }
    onClose();
  }, [draftHasText, onClose]);

  useNavigationGuard(draftHasText, (proceed) => {
    pendingNavigation.current = proceed;
    setSaveError('');
    setLeaveOpen(true);
  });

  useEffect(() => {
    if (!draftHasText) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [draftHasText]);

  const canSaveDraft = title.trim().length > 0 && !saving;
  const saveDraft = async (closeAfter: boolean) => {
    if (!onSaveDraft || !canSaveDraft) return;
    setSaving(true);
    setSaveError('');
    const error = await onSaveDraft(closeAfter);
    setSaving(false);
    if (error) {
      setSaveError(error);
      return;
    }
    setLeaveOpen(false);
    if (closeAfter) {
      const proceed = pendingNavigation.current;
      pendingNavigation.current = null;
      proceed?.();
    }
  };
  const discardDraft = () => {
    setLeaveOpen(false);
    const proceed = pendingNavigation.current;
    pendingNavigation.current = null;
    onClose();
    proceed?.();
  };
  const keepEditing = () => {
    pendingNavigation.current = null;
    setLeaveOpen(false);
  };

  useFocusTrap({
    open: !confirmDelete && !leaveOpen,
    containerRef: panelRef,
    onClose: requestClose,
  });

  useAutosave(
    title,
    project.title,
    (value) => onPatch({ title: value }),
    isDraft ? 0 : SAVE_DELAY_MS,
  );
  useAutosave(why, project.why, (value) => onPatch({ why: value }), isDraft ? 0 : SAVE_DELAY_MS);
  useAutosave(
    phrase,
    project.deadlinePhrase ?? '',
    (value) => {
      const parse = parseDeadlinePhrase(value, todayIso);
      if (parse.kind === 'date') onPatch({ deadlineAt: parse.date, deadlinePhrase: value.trim() });
      else if (parse.kind === 'empty' || parse.kind === 'none') {
        onPatch({ deadlineAt: null, deadlinePhrase: null });
      }
    },
    isDraft ? 0 : SAVE_DELAY_MS,
  );

  useEffect(() => {
    if (!project.title) titleRef.current?.focus();
  }, [project.title]);

  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [undo]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if ((event.key === 'n' || event.key === 'N') && modeRef.current === 'edit') {
        event.preventDefault();
        setAddSignal((n) => n + 1);
      } else if (event.key === 'l' || event.key === 'L') {
        event.preventDefault();
        historyRef.current?.querySelector<HTMLInputElement>('#history-new')?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const percent = roadmapProgress(project.roadmap);
  const done = project.roadmap.filter((block) => block.done).length;
  const complete = project.roadmap.length > 0 && done === project.roadmap.length;
  const parse = parseDeadlinePhrase(phrase, todayIso);
  const deadlineNote = describeParse(parse, todayIso);
  const finished = project.finishedAt !== null;
  const editable = mode === 'edit';
  const deadlineSummary = project.deadlineAt
    ? `Due ${relativeDeadlineText(daysUntil(project.deadlineAt, todayIso))}`
    : 'No deadline';

  const saveRoadmap = useCallback(
    (roadmap: ProjectItem['roadmap']) => onPatch({ roadmap }),
    [onPatch],
  );

  if (!mounted) return null;

  const expandButton = (column: 'roadmap' | 'history') => (
    <button
      type="button"
      className={styles.expandButton}
      onClick={() => setView(view === column ? 'split' : column)}
    >
      {view === column ? 'Back to split' : 'Expand'}
    </button>
  );

  return createPortal(
    <div
      className={styles.scrim}
      data-theme="workspace"
      data-feature-theme={featureTheme ?? 'project'}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <motion.section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={project.title.trim() || 'Focus details'}
        tabIndex={-1}
        className={cn(styles.panel, !editable && styles.panelView)}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduced ? 0 : MOTION_DURATION.slow, ease: MOTION_EASE }}
      >
        <header className={styles.panelHead}>
          <div className={styles.panelTitleRow}>
            {editable ? (
              <>
                <label className={styles.srOnly} htmlFor="focus-title">
                  Focus title
                </label>
                <input
                  id="focus-title"
                  ref={titleRef}
                  className={styles.panelTitle}
                  value={title}
                  maxLength={200}
                  placeholder="Name this focus"
                  autoComplete="off"
                  onChange={(event) => setTitle(event.target.value)}
                />
              </>
            ) : (
              <div className={cn(styles.panelTitle, styles.staticTitle)}>
                {title.trim() || 'Untitled focus'}
              </div>
            )}
            <div className={styles.miniProgress}>
              <div
                className={styles.progressBar}
                role="progressbar"
                aria-label="Progress"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span
                  className={styles.progressFill}
                  style={{ transform: `scaleX(${percent / 100})` }}
                />
              </div>
              <span>
                {project.roadmap.length ? `${done} of ${project.roadmap.length}` : 'No checkpoints'}
                {' · '}
                <strong>{percent}%</strong>
              </span>
            </div>
            {isDraft ? (
              <Button
                variant="primary"
                size="sm"
                disabled={!canSaveDraft}
                onClick={() => void saveDraft(false)}
              >
                {saving ? 'Saving…' : 'Save focus'}
              </Button>
            ) : (
              <div className={styles.pillSwitch} role="group" aria-label="Mode">
                {(['view', 'edit'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mode === value}
                    onClick={() => setMode(value)}
                  >
                    {value === 'view' ? 'View' : 'Edit'}
                  </button>
                ))}
              </div>
            )}
            <div className={styles.panelActions}>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
              <button
                type="button"
                className={styles.closeButton}
                aria-label="Close focus"
                onClick={requestClose}
              >
                ×
              </button>
            </div>
          </div>

          <div className={styles.panelSubRow}>
            <div className={styles.whyRow}>
              {editable ? (
                <>
                  <label htmlFor="focus-why">Why</label>
                  <input
                    id="focus-why"
                    className={styles.whyInput}
                    value={why}
                    maxLength={MAX_WHY_LENGTH}
                    placeholder="One line: why does this matter?"
                    autoComplete="off"
                    onChange={(event) => setWhy(event.target.value)}
                  />
                  <span className={styles.whyCount}>
                    {why.length}/{MAX_WHY_LENGTH}
                  </span>
                </>
              ) : (
                <>
                  <span className={styles.whyLabel}>Why</span>
                  <span className={cn(styles.whyInput, styles.staticWhy)}>
                    {why.trim() || 'No reason written yet'}
                  </span>
                </>
              )}
            </div>
            <div className={styles.chipRow}>
              <StatusChipMenu
                status={project.status}
                editable={editable}
                onChange={(status) => onPatch({ status })}
              />
              <PriorityChipMenu
                priority={project.priority}
                editable={editable}
                onChange={(priority) => onPatch({ priority })}
              />
              <DeadlineChipMenu
                summary={deadlineSummary}
                phrase={phrase}
                note={deadlineNote.text}
                bad={deadlineNote.bad}
                editable={editable}
                onPhraseChange={setPhrase}
              />
            </div>
            <div className={styles.pillSwitch} role="group" aria-label="Panel view">
              {(
                [
                  ['split', 'Split'],
                  ['roadmap', 'Roadmap'],
                  ['history', 'History'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={view === value}
                  onClick={() => setView(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {complete && !finished ? (
            <div className={styles.finishBar}>
              <span>Every checkpoint is done.</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={!editable}
                onClick={() => onPatch({ finished: true })}
              >
                Mark as finished
              </Button>
            </div>
          ) : null}
          {finished ? (
            <div className={styles.finishBar}>
              <span className={styles.finishedNote}>
                <Image
                  src={artSrc('jade-stamp-check')}
                  alt=""
                  aria-hidden="true"
                  width={36}
                  height={36}
                  unoptimized
                />
                Finished. It sits in the Finished list.
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={!editable}
                onClick={() => onPatch({ finished: false })}
              >
                Reopen
              </Button>
            </div>
          ) : null}
        </header>

        <div
          className={cn(
            styles.panelBody,
            view === 'roadmap' && styles.bodyRoadmap,
            view === 'history' && styles.bodyHistory,
          )}
        >
          <section
            aria-labelledby="focus-roadmap-heading"
            className={cn(styles.panelColumn, styles.columnRoadmap)}
          >
            <div className={styles.columnInner}>
              <div className={styles.sectionHead}>
                <h3 id="focus-roadmap-heading">Roadmap</h3>
                <small>
                  {editable ? (
                    <>
                      Drag ⋮⋮ or press ↑ ↓ on it · <kbd>N</kbd> new
                    </>
                  ) : null}{' '}
                  {expandButton('roadmap')}
                </small>
              </div>
              <Roadmap
                key={project.id}
                initial={project.roadmap}
                onChange={saveRoadmap}
                onRemoved={(label, restore) => setUndo({ label, restore })}
                addFocusSignal={addSignal}
                saveDelay={isDraft ? 0 : undefined}
                readOnly={!editable}
              />
            </div>
          </section>
          <section
            aria-labelledby="focus-history-heading"
            className={cn(styles.panelColumn, styles.panelHistory)}
            ref={historyRef}
          >
            <div className={styles.columnInner}>
              <div className={styles.sectionHead}>
                <h3 id="focus-history-heading">History</h3>
                <small>
                  <kbd>L</kbd> write a log {expandButton('history')}
                </small>
              </div>
              <FocusHistory
                entries={project.history}
                now={now}
                editable={editable}
                logLocked={isDraft}
                onLog={(text) => onPatch({ logNote: text })}
                onEdit={(id, text) => onPatch({ editNote: { id, text } })}
                onDelete={(id) => onPatch({ deleteNote: id })}
                onRemoved={(label, restore) => setUndo({ label, restore })}
              />
            </div>
            {art ? (
              <div className={styles.panelWatermark} aria-hidden="true">
                <Image
                  src={artSrc(art.name)}
                  alt=""
                  aria-hidden="true"
                  width={art.width}
                  height={art.height}
                  unoptimized
                  className={styles.watermarkArt}
                />
              </div>
            ) : null}
          </section>
        </div>

        {undo ? (
          <div className={styles.undoBar} role="status">
            <span>{undo.label}</span>
            <button
              type="button"
              onClick={() => {
                undo.restore();
                setUndo(null);
              }}
            >
              Undo
            </button>
          </div>
        ) : null}
      </motion.section>

      <ConfirmDialog
        portal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete();
        }}
        title={isDraft ? 'Discard this draft?' : 'Delete focus?'}
        confirmLabel={isDraft ? 'Discard' : 'Delete'}
        description={
          isDraft
            ? 'This new focus has not been saved yet. Discarding it removes what you wrote.'
            : `“${project.title.trim() || 'Untitled focus'}” and its roadmap and history will be permanently removed.`
        }
      />
      <Dialog
        portal
        open={leaveOpen}
        onClose={keepEditing}
        title="Save this focus before leaving?"
        description="It only exists in this panel until you save it."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={keepEditing}>
              Keep editing
            </Button>
            <Button variant="destructive" size="sm" onClick={discardDraft}>
              Discard
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!canSaveDraft}
              onClick={() => void saveDraft(true)}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        {title.trim() ? null : (
          <p className={styles.leaveNote}>Give it a title to save it, or discard it.</p>
        )}
        {saveError ? (
          <p role="alert" className={styles.leaveNote}>
            {saveError}
          </p>
        ) : null}
      </Dialog>
    </div>,
    document.body,
  );
}

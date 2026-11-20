'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MAX_DESCRIPTION_LENGTH, MAX_ROADMAP_BLOCKS, type RoadmapBlock } from '@/contracts/project';
import { toggleMarkdownWrap } from '@/domain/checkpoint-markdown';
import { MOTION_DURATION, MOTION_EASE } from '@/design/motion';
import { daysUntil } from '@/domain/deadline-phrase';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';
import { cn } from '@/ui/cn';
import { CheckpointMarkdown } from './CheckpointMarkdown';
import { artSrc } from './focus-art';
import styles from './projects.module.css';

const SAVE_DELAY_MS = 600;

/** A textarea that grows to fit all of its text, so nothing is clipped or scrolls inside. */
function AutoTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  useLayoutEffect(fit, [fit, props.value]);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let width = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth !== width) {
        width = el.clientWidth;
        fit();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit]);
  return <textarea ref={ref} rows={1} {...props} />;
}

function doneLabel(doneAt: string | null): string {
  if (!doneAt) return 'Done';
  const days = -daysUntil(
    formatScheduledDate(doneAt, DEFAULT_APP_TIMEZONE),
    formatScheduledDate(new Date(), DEFAULT_APP_TIMEZONE),
  );
  if (days <= 0) return 'Done today';
  return days === 1 ? 'Done yesterday' : `Done ${days} days ago`;
}

function newBlock(title = ''): RoadmapBlock {
  return { id: crypto.randomUUID(), title, description: '', done: false, doneAt: null };
}

export interface RoadmapProps {
  initial: readonly RoadmapBlock[];
  /** Called with the full roadmap after every change (text edits are debounced). */
  onChange: (blocks: RoadmapBlock[]) => void;
  /** Lets the panel offer Undo after a removal. */
  onRemoved: (label: string, restore: () => void) => void;
  /** Bumped by the panel's N shortcut to focus the add field. */
  addFocusSignal: number;
  /** View mode: text is not editable and the structure tools are hidden. Ticking still works. */
  readOnly: boolean;
  /** Milliseconds to wait after typing before reporting a change. 0 reports at once. */
  saveDelay?: number;
}

export function Roadmap({
  initial,
  onChange,
  onRemoved,
  addFocusSignal,
  readOnly,
  saveDelay = SAVE_DELAY_MS,
}: RoadmapProps) {
  const reduced = useReducedMotion();
  const [blocks, setBlocks] = useState<RoadmapBlock[]>(() => [...initial]);
  const blocksRef = useRef(blocks);
  const [draft, setDraft] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; after: boolean } | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const pendingSelection = useRef<{ id: string; start: number; end: number } | null>(null);
  const addRef = useRef<HTMLInputElement>(null);
  const pending = useRef<RoadmapBlock[] | null>(null);
  const timer = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const flush = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    if (pending.current) onChangeRef.current(pending.current);
    pending.current = null;
  };
  // Send anything still waiting when the panel closes.
  useEffect(() => flush, []);

  const apply = (next: RoadmapBlock[], immediate: boolean) => {
    blocksRef.current = next;
    setBlocks(next);
    pending.current = next;
    if (immediate || saveDelay === 0) {
      flush();
    } else {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, saveDelay);
    }
  };

  useEffect(() => {
    if (addFocusSignal > 0) addRef.current?.focus();
  }, [addFocusSignal]);

  // After a shortcut rewrites the text, put the caret or selection back where it belongs.
  useLayoutEffect(() => {
    const selection = pendingSelection.current;
    if (!selection) return;
    pendingSelection.current = null;
    const el = document.getElementById(`block-desc-${selection.id}`);
    if (el instanceof HTMLTextAreaElement) el.setSelectionRange(selection.start, selection.end);
  }, [blocks]);

  useEffect(() => {
    if (!focusId) return;
    document.getElementById(`block-title-${focusId}`)?.focus();
    setFocusId(null);
  }, [focusId, blocks]);

  const edit = (id: string, patch: Partial<RoadmapBlock>, immediate = false) =>
    apply(
      blocksRef.current.map((block) => (block.id === id ? { ...block, ...patch } : block)),
      immediate,
    );

  const toggle = (block: RoadmapBlock) =>
    edit(
      block.id,
      { done: !block.done, doneAt: block.done ? null : new Date().toISOString() },
      true,
    );

  const remove = (block: RoadmapBlock) => {
    const index = blocksRef.current.findIndex((b) => b.id === block.id);
    apply(
      blocksRef.current.filter((b) => b.id !== block.id),
      true,
    );
    onRemoved(`Removed “${block.title.trim() || 'checkpoint'}”`, () => {
      const next = [...blocksRef.current];
      next.splice(Math.min(index, next.length), 0, block);
      apply(next, true);
    });
  };

  const insertAfter = (id: string) => {
    if (blocksRef.current.length >= MAX_ROADMAP_BLOCKS) return;
    const block = newBlock();
    const next = [...blocksRef.current];
    next.splice(next.findIndex((b) => b.id === id) + 1, 0, block);
    apply(next, true);
    setFocusId(block.id);
  };

  const move = (id: string, to: number) => {
    const next = [...blocksRef.current];
    const from = next.findIndex((b) => b.id === id);
    if (from < 0 || to < 0 || to >= next.length || from === to) return;
    const [item] = next.splice(from, 1);
    if (item) next.splice(to, 0, item);
    apply(next, true);
  };

  // Ctrl+B / Ctrl+I (Cmd on macOS) format the description; no visible controls.
  const onDescriptionKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>, block: RoadmapBlock) => {
    const mac = /Mac|iPhone|iPad/.test(navigator.platform);
    const modifier = mac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
    if (!modifier || event.altKey || event.shiftKey) return;
    const key = event.key.toLowerCase();
    if (key !== 'b' && key !== 'i') return;
    event.preventDefault();
    const el = event.currentTarget;
    const next = toggleMarkdownWrap(
      el.value,
      el.selectionStart,
      el.selectionEnd,
      key === 'b' ? '**' : '*',
    );
    if (next.value.length > MAX_DESCRIPTION_LENGTH) return;
    pendingSelection.current = { id: block.id, start: next.start, end: next.end };
    edit(block.id, { description: next.value });
  };

  const onHandleKey = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const from = blocksRef.current.findIndex((b) => b.id === id);
    move(id, event.key === 'ArrowUp' ? from - 1 : from + 1);
    requestAnimationFrame(() => document.getElementById(`block-handle-${id}`)?.focus());
  };

  const onDrop = (event: DragEvent<HTMLLIElement>) => {
    event.preventDefault();
    if (dragId && dropTarget && dragId !== dropTarget.id) {
      const without = blocksRef.current.filter((b) => b.id !== dragId);
      const dragged = blocksRef.current.find((b) => b.id === dragId);
      const at = without.findIndex((b) => b.id === dropTarget.id);
      if (dragged && at >= 0) {
        without.splice(dropTarget.after ? at + 1 : at, 0, dragged);
        apply(without, true);
      }
    }
    setDragId(null);
    setDropTarget(null);
  };

  const submitNew = (event: FormEvent) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title || blocksRef.current.length >= MAX_ROADMAP_BLOCKS) return;
    apply([...blocksRef.current, newBlock(title)], true);
    setDraft('');
  };

  const current = blocks.find((b) => !b.done)?.id ?? null;

  return (
    <div className={styles.roadmap}>
      <ol className={styles.roadmapList}>
        <AnimatePresence initial={false}>
          {blocks.map((block, index) => (
            <motion.li
              key={block.id}
              layout={reduced ? false : 'position'}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: reduced ? 0 : MOTION_DURATION.layout, ease: MOTION_EASE }}
              className={cn(
                styles.block,
                block.done && styles.blockDone,
                block.id === current && styles.blockCurrent,
                dragId === block.id && styles.blockDragging,
                dropTarget?.id === block.id &&
                  (dropTarget.after ? styles.dropAfter : styles.dropBefore),
              )}
              onDragOver={(event) => {
                if (!dragId) return;
                event.preventDefault();
                const rect = event.currentTarget.getBoundingClientRect();
                setDropTarget({ id: block.id, after: event.clientY > rect.top + rect.height / 2 });
              }}
              onDrop={onDrop}
            >
              <button
                type="button"
                className={styles.blockNode}
                aria-pressed={block.done}
                disabled={readOnly}
                aria-label={`${block.done ? 'Reopen' : 'Mark done'}: ${block.title.trim() || 'untitled checkpoint'}`}
                onClick={() => toggle(block)}
              >
                {(['done', 'current', 'pending'] as const).map((state) => (
                  <Image
                    key={state}
                    src={artSrc(`lotus-${state}`)}
                    alt=""
                    aria-hidden="true"
                    width={36}
                    height={36}
                    unoptimized
                    className={cn(
                      styles.marker,
                      (block.done ? 'done' : block.id === current ? 'current' : 'pending') ===
                        state && styles.markerOn,
                    )}
                  />
                ))}
              </button>
              <div className={styles.blockBody}>
                {block.id === current ? (
                  <span className={styles.blockNow}>You are here</span>
                ) : null}
                {readOnly ? (
                  <div className={cn(styles.blockTitle, styles.staticText)}>
                    {block.title.trim() || 'Untitled checkpoint'}
                  </div>
                ) : (
                  <input
                    id={`block-title-${block.id}`}
                    className={styles.blockTitle}
                    value={block.title}
                    placeholder="Name this checkpoint"
                    aria-label={`Checkpoint ${index + 1} title`}
                    maxLength={200}
                    autoComplete="off"
                    onChange={(event) => edit(block.id, { title: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        document.getElementById(`block-desc-${block.id}`)?.focus();
                      }
                    }}
                  />
                )}
                {readOnly ? (
                  block.description.trim() ? (
                    <CheckpointMarkdown
                      value={block.description}
                      className={cn(styles.blockDesc, styles.staticText)}
                    />
                  ) : null
                ) : (
                  <AutoTextarea
                    id={`block-desc-${block.id}`}
                    className={styles.blockDesc}
                    value={block.description}
                    placeholder="Add a description (Markdown works)"
                    aria-label={`Checkpoint ${index + 1} description`}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    onChange={(event) => edit(block.id, { description: event.target.value })}
                    onKeyDown={(event) => onDescriptionKeyDown(event, block)}
                  />
                )}
                {block.done ? (
                  <span className={styles.blockWhen}>{doneLabel(block.doneAt)}</span>
                ) : null}
              </div>
              {readOnly ? null : (
                <div className={styles.blockTools}>
                  <button
                    type="button"
                    id={`block-handle-${block.id}`}
                    className={cn(styles.blockTool, styles.blockHandle)}
                    aria-label={`Move checkpoint ${index + 1}. Drag, or press arrow up or down.`}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', block.id);
                      const row = event.currentTarget.closest('li');
                      if (row) event.dataTransfer.setDragImage(row, 16, 16);
                      setDragId(block.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropTarget(null);
                    }}
                    onKeyDown={(event) => onHandleKey(event, block.id)}
                  >
                    ⋮⋮
                  </button>
                  <button
                    type="button"
                    className={styles.blockTool}
                    aria-label={`Remove checkpoint ${index + 1}`}
                    onClick={() => remove(block)}
                  >
                    ×
                  </button>
                </div>
              )}
              {!readOnly && index < blocks.length - 1 ? (
                <button
                  type="button"
                  className={styles.blockInsert}
                  aria-label={`Insert a checkpoint after ${index + 1}`}
                  onClick={() => insertAfter(block.id)}
                >
                  +
                </button>
              ) : null}
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
      {blocks.length > 0 ? (
        <div
          className={cn(styles.summit, blocks.every((b) => b.done) && styles.summitReached)}
          aria-hidden="true"
        >
          <Image src={artSrc('summit-pennant')} alt="" width={44} height={59} unoptimized />
        </div>
      ) : null}
      {blocks.length === 0 ? (
        <p className={styles.roadmapEmpty}>
          <i>
            {readOnly
              ? 'No checkpoints yet. Switch to Edit to add some.'
              : 'No checkpoints yet. Add the first one below.'}
          </i>
        </p>
      ) : null}
      {readOnly ? null : (
        <form className={styles.addRow} onSubmit={submitNew}>
          <label className={styles.srOnly} htmlFor="roadmap-new">
            New checkpoint
          </label>
          <input
            id="roadmap-new"
            ref={addRef}
            className={styles.textInput}
            value={draft}
            maxLength={200}
            placeholder="Add a checkpoint"
            autoComplete="off"
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" className={styles.smallButton} disabled={!draft.trim()}>
            Add
          </button>
        </form>
      )}
    </div>
  );
}

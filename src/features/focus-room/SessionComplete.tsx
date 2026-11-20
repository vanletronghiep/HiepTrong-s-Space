'use client';

import { useId, useRef } from 'react';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Dialog } from '@/ui/Dialog';
import { RichNoteEditor } from '@/ui/RichNoteEditor';
import { compactMinutes } from './PlanLine';
import styles from './focus-room.module.css';

const LEAVES = [
  { left: '10%', delay: '0s', size: 22, dx: '30px' },
  { left: '30%', delay: '0.5s', size: 18, dx: '-24px' },
  { left: '52%', delay: '0.25s', size: 24, dx: '36px' },
  { left: '72%', delay: '0.8s', size: 18, dx: '-30px' },
  { left: '88%', delay: '1.1s', size: 16, dx: '12px' },
];

interface SessionCompleteProps {
  endedEarly: boolean;
  focusMinutes: number;
  blocksDone: number;
  blocksTotal: number;
  streakDays: number;
  rating: number;
  onRating: (rating: number) => void;
  notes: string;
  onNotes: (notes: string) => void;
  thoughts: string[];
  taskTitle: string | null;
  markDone: boolean;
  onMarkDone: (done: boolean) => void;
  saving: boolean;
  failed: boolean;
  onSave: () => void;
}

/** The congratulations banner and the reflection form, in one panel. */
export function SessionComplete({
  endedEarly,
  focusMinutes,
  blocksDone,
  blocksTotal,
  streakDays,
  rating,
  onRating,
  notes,
  onNotes,
  thoughts,
  taskTitle,
  markDone,
  onMarkDone,
  saving,
  failed,
  onSave,
}: SessionCompleteProps) {
  const ratingLabelId = useId();
  const notesId = useId();
  const markId = useId();
  const firstStarRef = useRef<HTMLButtonElement>(null);

  const stats = [
    { label: 'Focused', value: compactMinutes(focusMinutes) },
    { label: 'Blocks', value: `${blocksDone}/${blocksTotal}` },
    { label: 'Streak', value: `${streakDays} ${streakDays === 1 ? 'day' : 'days'}` },
  ];

  return (
    <Dialog
      open
      portal
      onClose={onSave}
      initialFocusRef={firstStarRef}
      title={endedEarly ? 'Ended early' : 'Session complete'}
      className="max-w-[600px] max-h-[90svh] overflow-y-auto"
      footer={
        <>
          <Button variant="ghost" pill onClick={onSave} disabled={saving}>
            Skip notes
          </Button>
          <Button variant="primary" pill onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save to logbook'}
          </Button>
        </>
      }
    >
      <div className={styles.doneBody}>
        <div className={cn(styles.banner, endedEarly && styles.bannerQuiet)}>
          {endedEarly
            ? null
            : LEAVES.map((leaf) => (
                <svg
                  key={leaf.left}
                  className={styles.leaf}
                  style={{
                    left: leaf.left,
                    animationDelay: leaf.delay,
                    ['--dx' as string]: leaf.dx,
                  }}
                  width={leaf.size}
                  height={Math.round(leaf.size * 0.64)}
                  viewBox="0 0 22 14"
                  aria-hidden="true"
                >
                  <path d="M1 10C6 2 15 1 21 4C15 10 7 13 1 10Z" fill="currentColor" />
                </svg>
              ))}
          <p className={styles.bannerLine}>
            {endedEarly
              ? 'Still counts. Every block you finished is saved.'
              : 'You kept every block. Nicely done.'}
          </p>
          <dl className={styles.bannerStats}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.bannerStat}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <p id={ratingLabelId} className={styles.fieldLabel}>
            How focused were you?
          </p>
          <div className={styles.ratingPicker} role="radiogroup" aria-labelledby={ratingLabelId}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                ref={star === 1 ? firstStarRef : undefined}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                className={cn(styles.starBtn, rating >= star && styles.starBtnActive)}
                onClick={() => onRating(star)}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor={notesId} className={styles.fieldLabel}>
            Key insights or notes from this session:
          </label>
          <RichNoteEditor
            id={notesId}
            ariaLabel="Key insights or notes from this session:"
            placeholder="What did you learn? What is still open?"
            value={notes}
            onChange={onNotes}
            minHeightClassName="min-h-[96px]"
          />
        </div>

        {thoughts.length > 0 ? (
          <div>
            <p className={styles.fieldLabel}>Thoughts you parked:</p>
            <ul className={styles.thoughtList} aria-label="Parked thoughts from this session">
              {thoughts.map((thought, index) => (
                <li key={`${index}-${thought}`}>{thought}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {taskTitle ? (
          <div className={styles.markDoneRow}>
            <input
              id={markId}
              type="checkbox"
              checked={markDone}
              onChange={(event) => onMarkDone(event.target.checked)}
            />
            <label htmlFor={markId}>Mark “{taskTitle}” as done</label>
          </div>
        ) : null}

        {failed ? (
          <p role="alert" className={styles.inlineAlert}>
            Could not save this session. Your notes are retained; retry saving.
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

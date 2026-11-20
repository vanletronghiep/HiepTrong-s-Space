'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { PlanPhase } from '@/domain/study-plan';
import { Button } from '@/ui/Button';
import { PlanLine, compactMinutes } from './PlanLine';
import { TimerRing } from './TimerRing';
import styles from './focus-room.module.css';

interface QuietViewProps {
  name: string;
  blockLine: string;
  clockText: string;
  phaseLabel: string;
  progress: number;
  plan: PlanPhase[];
  elapsedMinutes: number;
  totalMinutes: number;
  paused: boolean;
  muted: boolean;
  onPauseToggle: () => void;
  onToggleMute: () => void;
  onExit: () => void;
  onParkThought: (text: string) => void;
}

/** The full-screen focus view. Pressing P opens a small box to park a stray thought. */
export function QuietView({
  name,
  blockLine,
  clockText,
  phaseLabel,
  progress,
  plan,
  elapsedMinutes,
  totalMinutes,
  paused,
  muted,
  onPauseToggle,
  onToggleMute,
  onExit,
  onParkThought,
}: QuietViewProps) {
  const [parking, setParking] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'p' || event.key === 'P') {
        event.preventDefault();
        setParking(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (parking) inputRef.current?.focus();
  }, [parking]);

  const park = () => {
    onParkThought(draft);
    setDraft('');
    setParking(false);
  };

  const view = (
    <div
      className={styles.quiet}
      role="region"
      aria-label="Quiet focus view"
      data-theme="workspace"
      data-feature-theme="learning-room"
    >
      <header className={styles.quietHeader}>
        <div className={styles.quietName}>
          <h2 className={styles.quietTitle}>{name}</h2>
          <p className={styles.quietBlock}>{blockLine}</p>
        </div>
        <div className={styles.quietTools}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={muted ? 'Turn sounds on' : 'Mute sounds'}
            aria-pressed={muted}
            onClick={onToggleMute}
          >
            {muted ? (
              <VolumeX size={18} strokeWidth={1.7} aria-hidden="true" />
            ) : (
              <Volume2 size={18} strokeWidth={1.7} aria-hidden="true" />
            )}
          </button>
          <Button variant="secondary" pill onClick={onExit}>
            Exit quiet mode
          </Button>
        </div>
      </header>

      <div className={styles.quietCenter}>
        <TimerRing progress={progress} tone="focus" size="large">
          <span className={styles.quietClock} role="timer" aria-label="Time remaining">
            {clockText}
          </span>
          <span className={styles.quietPhase}>{paused ? 'Paused' : phaseLabel}</span>
        </TimerRing>
        <Button
          variant="primary"
          pill
          leftIcon={
            paused ? (
              <Play size={16} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Pause size={16} strokeWidth={2} aria-hidden="true" />
            )
          }
          onClick={onPauseToggle}
        >
          {paused ? 'Resume' : 'Pause'}
        </Button>
        {parking ? (
          <form
            className={styles.parkForm}
            onSubmit={(event) => {
              event.preventDefault();
              park();
            }}
          >
            <label htmlFor={inputId} className="sr-only">
              Park a thought
            </label>
            <input
              id={inputId}
              ref={inputRef}
              className={styles.textInput}
              placeholder="Something that can wait until the break"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.stopPropagation();
                  setParking(false);
                }
              }}
            />
            <Button type="submit" variant="secondary" size="sm" disabled={!draft.trim()}>
              Park
            </Button>
          </form>
        ) : null}
      </div>

      <footer className={styles.quietFooter}>
        <PlanLine plan={plan} elapsedMinutes={elapsedMinutes} />
        <p className={styles.quietTimes}>
          <span>{compactMinutes(elapsedMinutes)} done</span>
          <span>{compactMinutes(Math.max(0, totalMinutes - elapsedMinutes))} left</span>
        </p>
      </footer>
    </div>
  );

  // Portal out of <main>, whose stacking context would keep the page header above this view.
  return typeof document === 'undefined' ? view : createPortal(view, document.body);
}

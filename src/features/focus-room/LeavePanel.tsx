'use client';

import { useId, useRef, useState } from 'react';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Dialog } from '@/ui/Dialog';
import { compactMinutes } from './PlanLine';
import styles from './focus-room.module.css';

const REASONS = ['Urgent message', 'Need a rest', 'Task finished', 'Lost focus'];

interface LeavePanelProps {
  /** Time left in the current block, as `mm:ss`. */
  blockLeft: string;
  elapsedMinutes: number;
  totalMinutes: number;
  onContinue: () => void;
  onExit: () => void;
}

/**
 * Asks why you want to leave quiet mode. The reason is only for you: it is never saved or sent.
 */
export function LeavePanel({
  blockLeft,
  elapsedMinutes,
  totalMinutes,
  onContinue,
  onExit,
}: LeavePanelProps) {
  const [reason, setReason] = useState<string | null>(null);
  const reasonLabelId = useId();
  const textId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);
  const percent = totalMinutes > 0 ? Math.min(100, (elapsedMinutes / totalMinutes) * 100) : 0;

  return (
    <Dialog
      open
      portal
      onClose={onContinue}
      initialFocusRef={continueRef}
      title="Leaving already?"
      className="w-[max(60vw,min(92vw,34rem))] max-w-none"
      footer={
        <>
          <Button variant="secondary" pill onClick={onExit}>
            Exit
          </Button>
          <Button ref={continueRef} variant="primary" pill onClick={onContinue}>
            Continue
          </Button>
        </>
      }
    >
      <div className={styles.leaveGrid}>
        <div className={styles.leaveSummary}>
          <p className={styles.leaveClock}>
            <span>{blockLeft}</span>
            <small>left in this block</small>
          </p>
          <div className={styles.leaveProgress}>
            <p className={styles.leaveProgressText}>
              <span>Session</span>
              <span>
                <b>{compactMinutes(elapsedMinutes)}</b> of {compactMinutes(totalMinutes)}
              </span>
            </p>
            <span className={styles.leaveTrack} aria-hidden="true">
              <span className={styles.leaveFill} style={{ width: `${percent}%` }} />
            </span>
          </div>
        </div>

        <div className={styles.leaveReason}>
          <p id={reasonLabelId} className={styles.leaveQuestion}>
            What&apos;s pulling you away?
          </p>
          <div className={styles.chips} role="radiogroup" aria-labelledby={reasonLabelId}>
            {REASONS.map((label) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={reason === label}
                className={cn(styles.chip, reason === label && styles.chipOn)}
                onClick={() => setReason(reason === label ? null : label)}
              >
                {label}
              </button>
            ))}
          </div>
          <label htmlFor={textId} className="sr-only">
            Your reason, just for you
          </label>
          <textarea
            id={textId}
            className={styles.reasonText}
            placeholder="Say it in your own words…"
          />
        </div>
      </div>
    </Dialog>
  );
}

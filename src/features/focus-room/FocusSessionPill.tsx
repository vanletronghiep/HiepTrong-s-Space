'use client';

import { Coffee, Play, Sprout } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { TransitionLink } from '@/features/transitions/TransitionLink';
import { cn } from '@/ui/cn';
import { FOCUS_ROOM_HREF, clock, useOptionalFocusSession } from './FocusSessionProvider';
import styles from './focus-session-pill.module.css';

/** Shows the running session on every page except the Focus Room itself. */
export function FocusSessionPill() {
  const session = useOptionalFocusSession();
  const pathname = usePathname();
  const run = session?.run;
  if (!session || !run || pathname === FOCUS_ROOM_HREF) return null;

  const phase = session.phase;
  const inBreak = phase ? phase.kind !== 'focus' : false;
  const phaseSeconds = (phase?.minutes ?? 0) * 60;
  const progress = session.isEnded
    ? 1
    : phaseSeconds > 0
      ? 1 - session.secondsRemaining / phaseSeconds
      : 0;
  const time = clock(session.secondsRemaining);
  const text = session.isEnded
    ? 'Session complete'
    : session.isPaused
      ? `Paused ${time}`
      : `${inBreak ? 'Break' : 'Focus'} ${time}`;
  const Icon = session.isEnded ? Sprout : inBreak ? Coffee : Play;

  return (
    <TransitionLink
      href={FOCUS_ROOM_HREF}
      aria-label={`Open Focus Room. ${text}`}
      className={styles.pill}
      data-feature-theme="learning-room"
    >
      <span className={cn(styles.dot, inBreak && styles.dotBreak)} aria-hidden="true">
        <Icon size={12} strokeWidth={2} />
      </span>
      <span className={styles.text}>
        <span className={styles.label}>{text}</span>
        <span className={styles.track} aria-hidden="true">
          <span
            className={cn(styles.fill, inBreak && styles.fillBreak)}
            style={{ transform: `scaleX(${Math.min(1, Math.max(0, progress))})` }}
          />
        </span>
      </span>
    </TransitionLink>
  );
}

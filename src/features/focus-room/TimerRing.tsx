import type { ReactNode } from 'react';
import { cn } from '@/ui/cn';
import styles from './focus-room.module.css';

const RADIUS = 138;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface TimerRingProps {
  /** 0 to 1 of the current phase that has passed. */
  progress: number;
  /** Phase kind that colours the arc. */
  tone: 'focus' | 'break';
  size?: 'normal' | 'large';
  children: ReactNode;
}

export function TimerRing({ progress, tone, size = 'normal', children }: TimerRingProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <div className={cn(styles.ring, size === 'large' && styles.ringLarge)}>
      <svg className={styles.ringSvg} viewBox="0 0 300 300" aria-hidden="true">
        <circle className={styles.ringTrack} cx="150" cy="150" r={RADIUS} fill="none" />
        <circle
          className={cn(styles.ringArc, tone === 'break' && styles.ringArcBreak)}
          cx="150"
          cy="150"
          r={RADIUS}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
        />
      </svg>
      <div className={styles.ringCenter}>{children}</div>
    </div>
  );
}

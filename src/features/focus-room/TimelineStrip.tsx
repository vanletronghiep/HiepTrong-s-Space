import { busiestHour } from '@/domain/focus-stats';
import styles from './focus-room.module.css';

interface TimelineStripProps {
  /** Focus minutes in each 15-minute slot of the day, from 00:00 to 24:00. */
  slots: number[];
  label: string;
}

/**
 * One continuous 00:00 to 24:00 strip. Colour deepens where more focus time has piled up, and
 * the gradient blends neighbouring slots so no individual cells show.
 */
export function TimelineStrip({ slots, label }: TimelineStripProps) {
  const max = Math.max(0, ...slots);
  const stops = slots.map((value, index) => {
    const strength = max > 0 ? Math.round((value / max) * 100) : 0;
    const at = (((index + 0.5) / slots.length) * 100).toFixed(2);
    return `color-mix(in srgb, var(--focus-heat-4) ${strength}%, var(--focus-heat-0)) ${at}%`;
  });
  const peak = busiestHour(slots);
  const description = peak
    ? `${label}: busiest between ${peak.start} and ${peak.end}`
    : `${label}: no focus time yet`;

  return (
    <div
      className={styles.strip}
      role="img"
      aria-label={description}
      style={{ background: max > 0 ? `linear-gradient(90deg, ${stops.join(', ')})` : undefined }}
    />
  );
}

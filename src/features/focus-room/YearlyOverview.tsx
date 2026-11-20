'use client';

import { MONTH_LONG, MONTH_SHORT } from '@/domain/focus-stats';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { TimelineStrip } from './TimelineStrip';
import styles from './focus-room.module.css';

const AXIS = ['00:00', '06:00', '12:00', '18:00', '24:00'];

interface YearlyOverviewProps {
  year: number;
  timeline: number[][];
  currentMonth: number;
  onClose: () => void;
}

/** Every month's time-of-day strip for the year, one above the other. */
export function YearlyOverview({ year, timeline, currentMonth, onClose }: YearlyOverviewProps) {
  return (
    <Dialog
      open
      portal
      onClose={onClose}
      title={`When you focus · ${year}`}
      className="w-[75vw] max-w-none h-[min(75vh,46rem)] min-w-[min(92vw,20rem)] flex flex-col [&>div.mt-4]:flex-1 [&>div.mt-4]:min-h-0"
      footer={
        <Button variant="secondary" pill onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className={styles.yearly}>
        <div className={styles.yearlyAxis} aria-hidden="true">
          <span className={styles.yearlyMonth} />
          <span className={styles.axis}>
            {AXIS.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </span>
        </div>
        <ul className={styles.yearlyList}>
          {timeline.map((slots, month) => (
            <li key={MONTH_SHORT[month]} className={styles.yearlyRow}>
              <span
                className={styles.yearlyMonth}
                data-current={month === currentMonth ? 'true' : undefined}
              >
                {MONTH_SHORT[month]}
              </span>
              <TimelineStrip slots={slots} label={MONTH_LONG[month] ?? ''} />
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}

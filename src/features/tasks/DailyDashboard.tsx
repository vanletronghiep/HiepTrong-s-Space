'use client';

import { CalendarDays } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useMinuteTicker } from '@/client/use-minute-ticker';
import { DEFAULT_APP_TIMEZONE } from '@/domain/time';
import { StarIcon } from '@/ui/StarIcon';
import { getDailyClock } from './daily-dashboard-time';
import { DailyRingedPlanet } from './DailySky';
import styles from './daily-foundation.module.css';

const FORECAST =
  'Focus tends to peak between 8 and 10 PM. One urgent task is still due before midnight.';
const ARC = 'M0 78 Q500 -18 1000 78';

export function DailyHeaderDate() {
  const now = useMinuteTicker();
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        timeZone: DEFAULT_APP_TIMEZONE,
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    [],
  );
  const parts = formatter.formatToParts(now);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  const suffix = day >= 11 && day <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] ?? 'th');
  return (
    <time className={styles.datePill} suppressHydrationWarning>
      <CalendarDays size={15} strokeWidth={1.5} aria-hidden="true" />
      {parts.map((part) => (part.type === 'day' ? part.value + suffix : part.value)).join('')}
    </time>
  );
}

function DayArc({ timeZone }: { timeZone: string }) {
  const [instant, setInstant] = useState<Date | null>(null);
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }),
    [timeZone],
  );

  useEffect(() => {
    let timer: number | undefined;
    const tick = () => {
      window.clearTimeout(timer);
      if (document.hidden) return;
      const now = new Date();
      setInstant(now);
      timer = window.setTimeout(tick, 1000 - (now.getTime() % 1000));
    };
    tick();
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  const clock = instant ? getDailyClock(instant, formatter) : null;
  const progress = clock?.progress ?? 0;
  const positionY = 78 - 192 * progress * (1 - progress);
  return (
    <section className={styles.arc} aria-label="Day arc">
      <div className={styles.arcHeader}>
        <h2 className={styles.eyebrow}>Day arc</h2>
        <div className={styles.clock}>
          <time>{clock?.time ?? '––:––'}</time>
        </div>
      </div>
      <div className={styles.timeline} aria-hidden="true">
        <svg
          className={styles.arcPath}
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d={ARC}
            stroke="var(--daily-arc-line)"
            strokeWidth="1.6"
            strokeDasharray="5 5"
            vectorEffect="non-scaling-stroke"
          />
          {clock && (
            <path
              className={styles.arcElapsed}
              d={ARC}
              stroke="var(--daily-violet)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              data-midnight={progress === 0}
              style={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }}
            />
          )}
        </svg>
        {clock && (
          <span
            className={styles.moon}
            style={{ left: `${progress * 100}%`, top: `${positionY}%` }}
            data-midnight={progress === 0}
          >
            <svg width="16" height="16" viewBox="0 0 20 20">
              <path
                d="M15.7 13.7A7.1 7.1 0 0 1 6.3 4.3a7.15 7.15 0 1 0 9.4 9.4Z"
                fill="currentColor"
              />
            </svg>
          </span>
        )}
        <StarIcon size={19} className={styles.deadlineStar} />
        <div className={styles.times}>
          {['00:00', '06:00', '12:00', '18:00', '24:00'].map((time) => (
            <span key={time}>{time}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DailyDashboard({
  done,
  total,
  timeZone,
}: {
  done: number;
  total: number;
  timeZone: string;
}) {
  const reduced = useReducedMotion();
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className={styles.dashboard}>
      <div className={styles.topCards}>
        <section className={styles.forecast} aria-label="Cosmic forecast">
          <span className={styles.forecastStar} aria-hidden="true">
            <StarIcon size={27} />
          </span>
          <div>
            <h2 className={styles.eyebrow}>Cosmic forecast</h2>
            <p>{FORECAST}</p>
          </div>
          <DailyRingedPlanet className={styles.forecastPlanet} />
        </section>
        <section className={styles.progress} aria-label="Today's progress">
          <div className={styles.progressHeader}>
            <h2 className={styles.eyebrow}>Progress</h2>
            <span className={styles.progressValue}>
              <AnimatePresence initial={false} mode="wait">
                <motion.strong
                  key={percent}
                  initial={reduced ? false : { opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduced ? 0 : -3 }}
                  transition={{ duration: reduced ? 0 : 0.2 }}
                >
                  {percent}%
                </motion.strong>
              </AnimatePresence>
            </span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Today's completed tasks"
            aria-valuenow={percent}
          >
            <div
              className={styles.progressFill}
              style={{ transform: `scaleX(${percent / 100})` }}
            />
          </div>
          <div className={styles.progressNote} aria-live="polite">
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={`${done}/${total}`}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.2 }}
              >
                {done} of {total} tasks done today
              </motion.span>
            </AnimatePresence>
          </div>
        </section>
      </div>
      <DayArc timeZone={timeZone} />
    </div>
  );
}

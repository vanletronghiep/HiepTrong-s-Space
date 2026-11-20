'use client';

import { useMemo, useState } from 'react';
import type { LearningRoomStats } from '@/contracts/learning-room';
import { MONTH_LONG, MONTH_SHORT, buildYearHeatmap } from '@/domain/focus-stats';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Skeleton } from '@/ui/Skeleton';
import { compactMinutes } from './PlanLine';
import { TimelineStrip } from './TimelineStrip';
import { YearlyOverview } from './YearlyOverview';
import styles from './focus-room.module.css';

type Comparison = 'day' | 'week' | 'month';

const MODES: { id: Comparison; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

const HEAT_CLASS = [styles.heat0, styles.heat1, styles.heat2, styles.heat3, styles.heat4] as const;

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AXIS = ['00:00', '06:00', '12:00', '18:00', '24:00'];

interface Bar {
  key: string;
  label: string;
  minutes: number;
  current: boolean;
}

function dayOfMonth(date: string): number {
  return Number(date.slice(8, 10));
}

function barsFor(mode: Comparison, stats: LearningRoomStats, today: string): Bar[] {
  if (mode === 'day') {
    return stats.weekDays.map((day, index) => ({
      key: day.date,
      label: `${WEEKDAYS[index]} ${dayOfMonth(day.date)}`,
      minutes: day.focusMinutes,
      current: day.date === today,
    }));
  }
  if (mode === 'week') {
    return stats.recentWeeks.map((week, index) => ({
      key: week.weekStart,
      label: `${MONTH_SHORT[Number(week.weekStart.slice(5, 7)) - 1]} ${dayOfMonth(week.weekStart)}`,
      minutes: week.focusMinutes,
      current: index === stats.recentWeeks.length - 1,
    }));
  }
  const currentMonth = Number(today.slice(5, 7)) - 1;
  return stats.months.map((minutes, index) => ({
    key: MONTH_SHORT[index] ?? String(index),
    label: MONTH_SHORT[index] ?? '',
    minutes,
    current: index === currentMonth,
  }));
}

interface FocusStatsProps {
  stats: LearningRoomStats | undefined;
  isLoading: boolean;
  /** Today as 'YYYY-MM-DD' in the app timezone. */
  today: string;
}

export function FocusStats({ stats, isLoading, today }: FocusStatsProps) {
  const [mode, setMode] = useState<Comparison>('day');
  const [yearlyOpen, setYearlyOpen] = useState(false);

  const heatmap = useMemo(
    () => (stats ? buildYearHeatmap(stats.year, stats.activity, today) : null),
    [stats, today],
  );

  if (isLoading || !stats || !heatmap) {
    return (
      <section aria-label="Loading focus statistics" className={styles.stats}>
        <div className={styles.metrics}>
          <Skeleton className="h-[84px] w-full rounded-item" />
          <Skeleton className="h-[84px] w-full rounded-item" />
          <Skeleton className="h-[84px] w-full rounded-item" />
          <Skeleton className="h-[84px] w-full rounded-item" />
        </div>
        <Skeleton className="h-[160px] w-full rounded-card" />
      </section>
    );
  }

  const monthIndex = Number(today.slice(5, 7)) - 1;
  const bars = barsFor(mode, stats, today);
  const peak = Math.max(1, ...bars.map((bar) => bar.minutes));
  const metrics = [
    { label: "Today's focus time", value: compactMinutes(stats.todayFocusMinutes) },
    { label: "This week's focus time", value: compactMinutes(stats.weekFocusMinutes) },
    { label: 'Average session', value: compactMinutes(stats.averageSessionMinutes) },
    {
      label: 'Focus streak',
      value: `${stats.streakDays} ${stats.streakDays === 1 ? 'day' : 'days'}`,
    },
  ];

  return (
    <section className={styles.stats} aria-labelledby="focus-stats-heading">
      <h2 id="focus-stats-heading" className="sr-only">
        Focus statistics for {stats.year}
      </h2>

      <dl className={styles.metrics}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.metric}>
            <dt className={styles.metricLabel}>{metric.label}</dt>
            <dd className={styles.metricValue}>{metric.value}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>Focus activity</h3>
        <div className={styles.heatScroll}>
          <div className={styles.heatmap} role="img" aria-label={`Focus activity in ${stats.year}`}>
            {heatmap.weeks.map((week, index) => (
              <div key={week.cells[0]?.date ?? index} className={styles.heatWeek}>
                <span className={styles.heatMonth}>{week.monthLabel}</span>
                {week.cells.map((cell) => (
                  <span
                    key={cell.date}
                    className={cn(
                      styles.heatCell,
                      cell.inYear ? HEAT_CLASS[cell.level] : styles.heatPad,
                      cell.future && cell.inYear && styles.heatFuture,
                    )}
                    title={
                      cell.inYear
                        ? `${cell.date}: ${cell.minutes > 0 ? compactMinutes(cell.minutes) : 'no focus'}`
                        : undefined
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <ul className={styles.heatLegend} aria-hidden="true">
          <li>Less</li>
          {HEAT_CLASS.map((heat, level) => (
            <li key={level}>
              <span className={cn(styles.heatCell, heat)} />
            </li>
          ))}
          <li>More</li>
        </ul>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h3 className={styles.panelTitle}>Focus time</h3>
          <div className={styles.segmented} role="tablist" aria-label="Compare by">
            {MODES.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={mode === option.id}
                className={cn(styles.segmentedItem, mode === option.id && styles.segmentedOn)}
                onClick={() => setMode(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <ul className={styles.bars} aria-label={`Focus time by ${mode}`}>
          {bars.map((bar) => (
            <li key={bar.key} className={styles.barCol}>
              <span className={styles.barValue}>
                {bar.minutes > 0 ? compactMinutes(bar.minutes) : ''}
              </span>
              <span className={styles.barTrack} aria-hidden="true">
                <span
                  className={cn(styles.barFill, bar.current && styles.barFillCurrent)}
                  style={{
                    height: bar.minutes > 0 ? `${Math.max(3, (bar.minutes / peak) * 100)}%` : 0,
                  }}
                />
              </span>
              <span className={cn(styles.barLabel, bar.current && styles.barLabelCurrent)}>
                {bar.label}
                <span className="sr-only">
                  , {bar.minutes > 0 ? compactMinutes(bar.minutes) : 'no focus'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h3 className={styles.panelTitle}>When you focus · {MONTH_LONG[monthIndex]}</h3>
          <Button variant="secondary" size="sm" pill onClick={() => setYearlyOpen(true)}>
            Yearly overview
          </Button>
        </div>
        <TimelineStrip
          slots={stats.timeline[monthIndex] ?? []}
          label={MONTH_LONG[monthIndex] ?? ''}
        />
        <p className={styles.axis} aria-hidden="true">
          {AXIS.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </p>
      </div>

      {yearlyOpen ? (
        <YearlyOverview
          year={stats.year}
          timeline={stats.timeline}
          currentMonth={monthIndex}
          onClose={() => setYearlyOpen(false)}
        />
      ) : null}
    </section>
  );
}

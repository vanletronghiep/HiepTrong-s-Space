'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { TaskDto } from '@/contracts';
import { activityLevel, computeCompletionCalendar } from '@/domain/task-calendar';
import { computeTaskStats, type StatsRange, type TaskStats } from '@/domain/task-stats';
import { cn } from '@/ui/cn';
import styles from './observatory.module.css';

const RANGES: readonly StatsRange[] = [7, 14, 30];
const HEAT_WEEKS = 26;
const CAL_ROW_LABELS = [
  { row: 0, label: 'Mon' },
  { row: 2, label: 'Wed' },
  { row: 4, label: 'Fri' },
] as const;

export interface ObservatoryProps {
  tasks: readonly TaskDto[];
  todayKey: string;
  nowMs: number;
  timeZone: string;
}

/** Statistics section under the Overdue lane. Charts mount only once it scrolls into view. */
export function Observatory({ tasks, todayKey, nowMs, timeZone }: ObservatoryProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  const [range, setRange] = useState<StatsRange>(14);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || seen) return;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);

  return (
    <section
      ref={rootRef}
      id="observatory"
      aria-labelledby="observatory-heading"
      className={styles.observatory}
    >
      <header className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Observatory</span>
          <h2 id="observatory-heading" className={styles.title}>
            How your days are going
          </h2>
        </div>
        <div role="group" aria-label="Statistics range" className={styles.range}>
          {RANGES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={range === value}
              onClick={() => setRange(value)}
            >
              {value} days
            </button>
          ))}
        </div>
      </header>

      {seen ? (
        <ObservatoryBody
          tasks={tasks}
          todayKey={todayKey}
          range={range}
          nowMs={nowMs}
          timeZone={timeZone}
        />
      ) : (
        <div className={styles.placeholder} aria-hidden="true" />
      )}
    </section>
  );
}

function ObservatoryBody({
  tasks,
  todayKey,
  range,
  nowMs,
  timeZone,
}: {
  tasks: readonly TaskDto[];
  todayKey: string;
  range: StatsRange;
  nowMs: number;
  timeZone: string;
}) {
  const stats = useMemo(
    () => computeTaskStats(tasks, todayKey, range, nowMs, timeZone),
    [tasks, todayKey, range, nowMs, timeZone],
  );

  if (stats.planned === 0 && stats.finished === 0) {
    return (
      <p className={styles.empty}>
        Nothing planned in the last {range} days. Schedule a few tasks and your patterns will show
        up here.
      </p>
    );
  }

  const delta =
    stats.completionRate !== null && stats.previousRate !== null
      ? stats.completionRate - stats.previousRate
      : null;

  return (
    <>
      <div className={styles.kpis}>
        <Kpi label="Finished" value={String(stats.finished)} note={`of ${stats.planned} planned`} />
        <Kpi
          label="Completion rate"
          value={stats.completionRate === null ? '–' : `${stats.completionRate}%`}
          note={
            delta === null || delta === 0
              ? 'no change vs previous period'
              : `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)} pts vs previous period`
          }
          tone={delta === null || delta === 0 ? undefined : delta > 0 ? 'up' : 'down'}
        />
        <Kpi
          label="On time"
          value={stats.onTimeRate === null ? '–' : `${stats.onTimeRate}%`}
          note="finished before the deadline"
        />
        <Kpi
          label="Streak"
          value={`${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`}
          note="in a row with a task done"
        />
      </div>

      <div className={styles.charts}>
        <Chart title="Planned vs finished" wide>
          <TrendChart stats={stats} range={range} />
        </Chart>
        <Chart title="How tasks end">
          <EndingDonut stats={stats} />
        </Chart>
        <CompletionHeatmap tasks={tasks} todayKey={todayKey} timeZone={timeZone} />
      </div>
    </>
  );
}

function Kpi({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: 'up' | 'down';
}) {
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      <span
        className={cn(styles.kpiNote, tone === 'up' && styles.up, tone === 'down' && styles.down)}
      >
        {note}
      </span>
    </div>
  );
}

function Chart({
  title,
  meta,
  children,
  wide = false,
  className,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <figure className={cn(styles.chart, wide && styles.chartWide, className)}>
      <figcaption className={styles.chartHead}>
        <span className={styles.chartTitle}>{title}</span>
        {meta ? <span className={styles.chartMeta}>{meta}</span> : null}
      </figcaption>
      {children}
    </figure>
  );
}

/* ---------- charts (hand-drawn SVG, themed with Daily tokens) ---------- */

function TrendChart({ stats, range }: { stats: TaskStats; range: StatsRange }) {
  const W = 560;
  const H = 200;
  const pad = { left: 28, right: 6, top: 10, bottom: 24 };
  const top = Math.max(2, ...stats.days.map((day) => day.planned));
  const max = top % 2 === 0 ? top : top + 1;
  const innerH = H - pad.top - pad.bottom;
  const band = (W - pad.left - pad.right) / stats.days.length;
  const barW = Math.max(3, Math.min(18, band * 0.62));
  const y = (value: number) => pad.top + innerH * (1 - value / max);
  const ticks = [0, max / 2, max];
  const labelEvery = range <= 7 ? 1 : range <= 14 ? 2 : 5;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={styles.svg}
      role="img"
      aria-label={`Planned and finished tasks per day over the last ${range} days`}
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={pad.left}
            x2={W - pad.right}
            y1={y(tick)}
            y2={y(tick)}
            className={styles.grid}
          />
          <text x={pad.left - 6} y={y(tick) + 3.5} textAnchor="end" className={styles.axis}>
            {tick}
          </text>
        </g>
      ))}
      {stats.days.map((day, index) => {
        const x = pad.left + index * band + (band - barW) / 2;
        const label = `${day.date.slice(8)}/${day.date.slice(5, 7)}`;
        return (
          <g key={day.date}>
            <title>{`${label}: ${day.finished} of ${day.planned} finished`}</title>
            <rect
              x={x}
              y={y(day.planned)}
              width={barW}
              height={y(0) - y(day.planned)}
              rx={3}
              className={styles.planned}
            />
            <rect
              x={x}
              y={y(day.finished)}
              width={barW}
              height={y(0) - y(day.finished)}
              rx={3}
              className={styles.finished}
            />
            {index % labelEvery === 0 || index === stats.days.length - 1 ? (
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" className={styles.axis}>
                {Number(day.date.slice(8))}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

const ENDING_META = [
  { key: 'onTime', label: 'On time', className: 'segOnTime' },
  { key: 'late', label: 'Late', className: 'segLate' },
  { key: 'transferred', label: 'Moved', className: 'segMoved' },
  { key: 'missed', label: 'Missed', className: 'segMissed' },
] as const;

function EndingDonut({ stats }: { stats: TaskStats }) {
  const total = ENDING_META.reduce((sum, meta) => sum + stats.endings[meta.key], 0);
  const R = 46;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className={styles.chartBody}>
      <div className={styles.donutWrap}>
        <svg
          viewBox="0 0 120 120"
          className={styles.donut}
          role="img"
          aria-label="How tasks ended: on time, late, moved or missed"
        >
          <circle cx="60" cy="60" r={R} className={styles.donutTrack} />
          {total > 0
            ? ENDING_META.map((meta) => {
                const value = stats.endings[meta.key];
                if (value === 0) return null;
                const length = (value / total) * C;
                const segment = (
                  <circle
                    key={meta.key}
                    cx="60"
                    cy="60"
                    r={R}
                    className={cn(styles.seg, styles[meta.className])}
                    strokeDasharray={`${Math.max(0, length - 2)} ${C}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 60 60)"
                  >
                    <title>{`${meta.label}: ${value}`}</title>
                  </circle>
                );
                offset += length;
                return segment;
              })
            : null}
          <text x="60" y="58" textAnchor="middle" className={styles.donutValue}>
            {total > 0 ? `${Math.round((stats.endings.onTime / total) * 100)}%` : '–'}
          </text>
          <text x="60" y="73" textAnchor="middle" className={styles.axis}>
            on time
          </text>
        </svg>
        <ul className={styles.legend}>
          {ENDING_META.map((meta) => (
            <li key={meta.key}>
              <i className={cn(styles.swatch, styles[meta.className])} />
              {meta.label} <b className="tabular-nums">{stats.endings[meta.key]}</b>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CompletionHeatmap({
  tasks,
  todayKey,
  timeZone,
}: {
  tasks: readonly TaskDto[];
  todayKey: string;
  timeZone: string;
}) {
  const calendar = useMemo(
    () => computeCompletionCalendar(tasks, todayKey, HEAT_WEEKS, timeZone),
    [tasks, todayKey, timeZone],
  );

  return (
    <Chart
      title="Completion activity"
      className={styles.heatChart}
      meta={`${calendar.total} finished · ${calendar.activeDays} active ${
        calendar.activeDays === 1 ? 'day' : 'days'
      }`}
    >
      <div
        className={styles.cal}
        style={{ '--weeks': HEAT_WEEKS } as CSSProperties}
        role="img"
        aria-label={`Tasks finished per day over the last ${HEAT_WEEKS} weeks`}
      >
        {calendar.months.map((month) => (
          <span
            key={month.column}
            className={styles.calMonth}
            style={{ gridColumn: `${month.column + 2} / span 3` }}
          >
            {month.label}
          </span>
        ))}
        {CAL_ROW_LABELS.map((item) => (
          <span key={item.label} className={styles.calDay} style={{ gridRow: item.row + 2 }}>
            {item.label}
          </span>
        ))}
        {calendar.weeks.map((week, column) =>
          week.map((day, row) =>
            day ? (
              <span
                key={day.date}
                className={styles.calCell}
                data-level={activityLevel(day.count, calendar.max)}
                style={{ gridColumn: column + 2, gridRow: row + 2 }}
                title={`${day.count} ${day.count === 1 ? 'task' : 'tasks'} finished on ${day.date.slice(8)}/${day.date.slice(5, 7)}`}
              />
            ) : null,
          ),
        )}
      </div>
      <div className={styles.calLegend} aria-hidden="true">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <i key={level} className={styles.calCell} data-level={level} />
        ))}
        <span>More</span>
      </div>
    </Chart>
  );
}

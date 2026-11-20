'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { EventOccurrence } from '@/contracts/event';
import { formatRelativeEventTime } from '@/domain/event-domain';
import { localDateOf } from '@/domain/event-occurrence';
import { cn } from '@/ui/cn';
import { KindBadge, StatusBadges } from './EventBadges';
import { formatShortDay, formatTime, pluralize } from './events-format';
import overlays from './events-overlays.module.css';
import styles from './events.module.css';

const COMPACT_COUNT = 3;

export interface HighlightsSectionProps {
  highlights: EventOccurrence[];
  now: Date;
  selectedKey: string | null;
  isLoading: boolean;
  onSelect: (occurrence: EventOccurrence) => void;
}

/**
 * Explicitly highlighted events (v3.1 §6.3): nearest three, Show all expands in place with a
 * bounded scroll area, Show less restores. Nothing is silently capped.
 */
export function HighlightsSection({
  highlights,
  now,
  selectedKey,
  isLoading,
  onSelect,
}: HighlightsSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? highlights : highlights.slice(0, COMPACT_COUNT);
  const hiddenCount = highlights.length - COMPACT_COUNT;

  return (
    <section className={styles.supportSurface} aria-labelledby="events-highlights-heading">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2
            id="events-highlights-heading"
            className="inline-flex items-center gap-1.5 font-display text-[1.35rem] font-semibold leading-tight text-ws-text"
          >
            <Sparkles size={16} className="text-ws-accent" aria-hidden="true" />
            Highlights
          </h2>
          <p className="text-[length:var(--fs-micro)] text-ws-text-muted tabular-nums">
            {pluralize(highlights.length, 'highlight')} · next 14 days
          </p>
        </div>
        {hiddenCount > 0 ? (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="events-highlights-list"
            onClick={() => setExpanded((value) => !value)}
            className="min-h-9 rounded-pill border border-ws-border bg-ws-surface px-3 text-[length:var(--fs-small)] font-medium text-ws-text hover:bg-ws-accent-soft cursor-pointer transition-colors duration-[var(--dur-fast)]"
          >
            {expanded ? 'Show less' : `Show all (${highlights.length})`}
          </button>
        ) : null}
      </div>

      {isLoading && highlights.length === 0 ? (
        <p className="text-[length:var(--fs-small)] text-ws-text-muted">Loading highlights…</p>
      ) : highlights.length === 0 ? (
        <p className="text-[length:var(--fs-small)] text-ws-text-muted">
          Nothing highlighted in the next 14 days. Turn on “Highlight this event” in any event to
          pin it here.
        </p>
      ) : (
        <ul
          id="events-highlights-list"
          aria-label="Highlighted events"
          className={expanded ? overlays.highlightsExpanded : overlays.highlightsGrid}
        >
          {visible.map((occurrence) => (
            <li key={occurrence.key} className="min-w-0">
              <button
                type="button"
                aria-pressed={selectedKey === occurrence.key}
                onClick={() => onSelect(occurrence)}
                className={cn(
                  overlays.highlightCard,
                  selectedKey === occurrence.key && styles.eventRowSelected,
                )}
              >
                <span className="flex flex-wrap items-center gap-1.5">
                  <KindBadge occurrence={occurrence} />
                  <StatusBadges occurrence={{ ...occurrence, highlighted: false }} now={now} />
                </span>
                <span className={cn(styles.eventTitleCompact, overlays.highlightTitle)}>
                  {occurrence.title}
                </span>
                <span
                  className={cn(
                    overlays.highlightMeta,
                    'text-[length:var(--fs-micro)] text-ws-text-muted tabular-nums',
                  )}
                >
                  {formatShortDay(localDateOf(occurrence.startAt))} ·{' '}
                  {formatTime(occurrence.startAt)}
                  {' · '}
                  {formatRelativeEventTime(occurrence.startAt, now)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

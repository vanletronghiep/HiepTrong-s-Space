'use client';

import { useRef, type ReactNode } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  FileText,
  MapPin,
  Repeat,
} from 'lucide-react';
import type { EventOccurrence } from '@/contracts/event';
import { isWebUrl, toWebHref } from '@/domain/event-domain';
import { localDateOf } from '@/domain/event-occurrence';
import { Button } from '@/ui/Button';
import { FormattedNoteContent } from '@/ui/FormattedNoteContent';
import { KindBadge, StatusBadges } from './EventBadges';
import { EventsModal } from './EventsModal';
import { formatDetailDate, formatShortDay, formatTimeRange } from './events-format';
import styles from './events.module.css';

/** Location or link: supported web URLs become links; venues stay plain text. */
export function LocationValue({ value }: { value: string }) {
  if (isWebUrl(value)) {
    return (
      <a
        href={toWebHref(value)}
        target="_blank"
        rel="noreferrer noopener"
        className="text-ws-accent underline decoration-ws-border underline-offset-2 [overflow-wrap:anywhere]"
      >
        {value}
      </a>
    );
  }
  return <span className="[overflow-wrap:anywhere]">{value}</span>;
}

/** Date, time, place, link, recurrence, and links — available independently of notes. */
export function OccurrenceMetadata({ occurrence }: { occurrence: EventOccurrence }) {
  const movedFrom =
    occurrence.originalWeek && occurrence.isOverride
      ? localDateOf(occurrence.startAt) < occurrence.originalWeek ||
        localDateOf(occurrence.startAt) >= addSevenDays(occurrence.originalWeek)
      : false;
  const rows: Array<{ icon: ReactNode; label: string; value: ReactNode }> = [
    {
      icon: <CalendarIcon size={15} className="shrink-0 text-ws-accent" aria-hidden="true" />,
      label: 'Date',
      value: formatDetailDate(occurrence.startAt),
    },
    {
      icon: <Clock size={15} className="shrink-0 text-ws-accent" aria-hidden="true" />,
      label: 'Time',
      value: `${formatTimeRange(occurrence)} · Saigon`,
    },
  ];
  if (occurrence.location) {
    rows.push({
      icon: <MapPin size={15} className="shrink-0 text-ws-accent" aria-hidden="true" />,
      label: 'Location',
      value: <LocationValue value={occurrence.location} />,
    });
  }
  if (occurrence.url && occurrence.url !== occurrence.location) {
    rows.push({
      icon: <ExternalLink size={15} className="shrink-0 text-ws-accent" aria-hidden="true" />,
      label: 'Link',
      value: <LocationValue value={occurrence.url} />,
    });
  }
  if (occurrence.kind === 'class') {
    rows.push({
      icon: <Repeat size={15} className="shrink-0 text-ws-accent" aria-hidden="true" />,
      label: 'Schedule',
      value: occurrence.isRepeating
        ? movedFrom && occurrence.originalWeek
          ? `Weekly class · moved from the week of ${formatShortDay(occurrence.originalWeek)}`
          : occurrence.isOverride
            ? 'Weekly class · changed for this week'
            : 'Weekly class'
        : 'Single class',
    });
  } else if (occurrence.recurrence) {
    rows.push({
      icon: <Repeat size={15} className="shrink-0 text-ws-accent" aria-hidden="true" />,
      label: 'Repeats',
      value: `${occurrence.recurrence.frequency}${occurrence.recurrence.until ? ` until ${occurrence.recurrence.until}` : ''}`,
    });
  }
  if (occurrence.preparationTaskId) {
    rows.push({
      icon: <FileText size={15} className="shrink-0 text-ws-accent" aria-hidden="true" />,
      label: 'Preparation task',
      value: occurrence.preparationTaskId,
    });
  }
  return (
    <dl className={styles.detailScheduleList}>
      {rows.map((row) => (
        <div key={row.label} className={styles.detailScheduleRow}>
          <dt className="inline-flex shrink-0 items-center gap-1.5 text-ws-text-muted">
            {row.icon}
            <span>{row.label}</span>
          </dt>
          <dd className="min-w-0 text-right font-medium text-ws-text tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function addSevenDays(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + 7)).toISOString().slice(0, 10);
}

export interface EventReaderProps {
  occurrence: EventOccurrence | null;
  now: Date;
  onClose: () => void;
  onEdit: (occurrence: EventOccurrence) => void;
}

/** Read-only full reader: complete formatted notes and metadata, with Edit and Close. */
export function EventReader({ occurrence, now, onClose, onEdit }: EventReaderProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  return (
    <EventsModal
      open={Boolean(occurrence)}
      onClose={onClose}
      size="reader"
      testId="event-reader"
      initialFocusRef={closeRef}
      closeLabel="Close event reader"
      title={
        occurrence ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <KindBadge occurrence={occurrence} />
              <StatusBadges occurrence={occurrence} now={now} />
            </div>
            <h2 className={styles.eventTitle}>{occurrence.title}</h2>
          </div>
        ) : null
      }
      ariaLabel={occurrence ? `${occurrence.title} — event details` : 'Event details'}
      footer={
        occurrence ? (
          <>
            <Button ref={closeRef} variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={() => onEdit(occurrence)}>
              Edit
            </Button>
          </>
        ) : null
      }
    >
      {occurrence ? (
        <div className="space-y-5">
          <OccurrenceMetadata occurrence={occurrence} />
          {occurrence.description && occurrence.description !== occurrence.notes ? (
            <p className="text-[length:var(--fs-ui)] text-ws-text-muted [overflow-wrap:anywhere]">
              {occurrence.description}
            </p>
          ) : null}
          <section className="space-y-2" aria-label="Notes and instructions">
            <h3 className="text-[length:var(--fs-small)] font-medium text-ws-text">
              Notes &amp; instructions
            </h3>
            {occurrence.notes ? (
              <FormattedNoteContent
                value={occurrence.notes}
                className="text-[length:var(--fs-ui)] leading-relaxed text-ws-text [overflow-wrap:anywhere]"
              />
            ) : (
              <p className="text-[length:var(--fs-small)] text-ws-text-muted">No notes yet.</p>
            )}
          </section>
        </div>
      ) : null}
    </EventsModal>
  );
}

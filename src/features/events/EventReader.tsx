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
import { formatDetailDate, formatShortDay, formatTime, formatTimeRange } from './events-format';
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

/**
 * Date and time sit in a tinted card (the v2.1 look); an event that ends on a later date gets
 * its own "Ends" line. Place, link, repeat, and task rows follow as plain icon rows.
 */
export function OccurrenceMetadata({ occurrence }: { occurrence: EventOccurrence }) {
  const movedFrom =
    occurrence.originalWeek && occurrence.isOverride
      ? localDateOf(occurrence.startAt) < occurrence.originalWeek ||
        localDateOf(occurrence.startAt) >= addSevenDays(occurrence.originalWeek)
      : false;
  const endsLater =
    occurrence.endAt !== null && localDateOf(occurrence.endAt) !== localDateOf(occurrence.startAt);
  const scheduleRows: Array<{ icon: ReactNode; label: string; value: ReactNode }> = [
    {
      icon: <CalendarIcon size={15} className="shrink-0 text-ws-accent" aria-hidden="true" />,
      label: 'Date',
      value: formatDetailDate(occurrence.startAt),
    },
    {
      icon: <Clock size={15} className="shrink-0 text-ws-accent" aria-hidden="true" />,
      label: 'Time',
      value: endsLater ? formatTime(occurrence.startAt) : formatTimeRange(occurrence),
    },
  ];
  if (endsLater && occurrence.endAt) {
    scheduleRows.push({
      icon: <Clock size={15} className="shrink-0 text-ws-accent" aria-hidden="true" />,
      label: 'Ends',
      value: `${formatTime(occurrence.endAt)} · ${formatDetailDate(occurrence.endAt)}`,
    });
  }

  const plainRows: Array<{ key: string; icon: ReactNode; value: ReactNode }> = [];
  if (occurrence.location) {
    plainRows.push({
      key: 'location',
      icon: <MapPin size={15} className="mt-0.5 shrink-0 text-ws-accent" aria-hidden="true" />,
      value: <LocationValue value={occurrence.location} />,
    });
  }
  if (occurrence.url && occurrence.url !== occurrence.location) {
    plainRows.push({
      key: 'link',
      icon: (
        <ExternalLink size={15} className="mt-0.5 shrink-0 text-ws-accent" aria-hidden="true" />
      ),
      value: <LocationValue value={occurrence.url} />,
    });
  }
  if (occurrence.kind === 'class') {
    plainRows.push({
      key: 'schedule',
      icon: <Repeat size={15} className="mt-0.5 shrink-0 text-ws-accent" aria-hidden="true" />,
      value: occurrence.isRepeating
        ? movedFrom && occurrence.originalWeek
          ? `Weekly class · moved from the week of ${formatShortDay(occurrence.originalWeek)}`
          : occurrence.isOverride
            ? 'Weekly class · changed for this week'
            : 'Weekly class'
        : 'Single class',
    });
  } else if (occurrence.recurrence) {
    plainRows.push({
      key: 'repeats',
      icon: <Repeat size={15} className="mt-0.5 shrink-0 text-ws-accent" aria-hidden="true" />,
      value: `Repeats ${occurrence.recurrence.frequency}${occurrence.recurrence.until ? ` until ${occurrence.recurrence.until}` : ''}`,
    });
  }
  if (occurrence.preparationTaskId) {
    plainRows.push({
      key: 'preparation',
      icon: <FileText size={15} className="mt-0.5 shrink-0 text-ws-accent" aria-hidden="true" />,
      value: `Linked preparation task (${occurrence.preparationTaskId})`,
    });
  }
  return (
    <div className="space-y-2.5 text-[length:var(--fs-small)]">
      <dl className={styles.detailScheduleList}>
        {scheduleRows.map((row) => (
          <div key={row.label} className={styles.detailScheduleRow}>
            <dt className="inline-flex shrink-0 items-center gap-1.5 text-ws-text-muted">
              {row.icon}
              <span>{row.label}</span>
            </dt>
            <dd className="min-w-0 text-right font-medium text-ws-text tabular-nums">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      {plainRows.map((row) => (
        <div key={row.key} className="flex items-start gap-2 text-ws-text-muted">
          {row.icon}
          <span className="min-w-0 flex-1">{row.value}</span>
        </div>
      ))}
    </div>
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
  /** Lessons are managed from here, since they never appear in the Events dashboard. */
  onCancelClass?: (occurrence: EventOccurrence) => void;
  onDeleteClass?: (occurrence: EventOccurrence) => void;
}

/** Full reader: complete formatted notes and metadata, with Edit and Close (plus class actions). */
export function EventReader({
  occurrence,
  now,
  onClose,
  onEdit,
  onCancelClass,
  onDeleteClass,
}: EventReaderProps) {
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
            {occurrence.kind === 'class' ? (
              <div className="mr-auto flex flex-wrap items-center gap-1.5">
                {occurrence.status === 'active' && onCancelClass ? (
                  <Button variant="ghost" size="sm" onClick={() => onCancelClass(occurrence)}>
                    Cancel class
                  </Button>
                ) : null}
                {onDeleteClass ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-text-overdue hover:bg-tint-overdue-bg"
                    onClick={() => onDeleteClass(occurrence)}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
            ) : null}
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

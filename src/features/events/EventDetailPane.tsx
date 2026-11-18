'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import type { EventOccurrence } from '@/contracts/event';
import { extractNotePlainText } from '@/domain/note-format';
import { formatRelativeEventTime } from '@/domain/event-domain';
import { Button } from '@/ui/Button';
import { KindBadge, StatusBadges } from './EventBadges';
import { OccurrenceMetadata } from './EventReader';
import overlays from './events-overlays.module.css';
import styles from './events.module.css';

export interface EventDetailPaneProps {
  occurrence: EventOccurrence;
  now: Date;
  busy: boolean;
  onClose: () => void;
  onOpenReader: (occurrence: EventOccurrence) => void;
  onEdit: (occurrence: EventOccurrence) => void;
  onDelete: (occurrence: EventOccurrence) => void;
  onCancelClass: (occurrence: EventOccurrence) => void;
}

/**
 * Right-side detail (v3.1 §6.3): schedule, place, and actions stay visible; notes are a
 * six-line plain-text preview with See more only when the preview actually overflows.
 */
export function EventDetailPane({
  occurrence,
  now,
  busy,
  onClose,
  onOpenReader,
  onEdit,
  onDelete,
  onCancelClass,
}: EventDetailPaneProps) {
  const previewRef = useRef<HTMLParagraphElement>(null);
  const [overflows, setOverflows] = useState(false);
  const preview = occurrence.notes ? extractNotePlainText(occurrence.notes) : '';

  useLayoutEffect(() => {
    const element = previewRef.current;
    if (!element) {
      setOverflows(false);
      return undefined;
    }
    const measure = () => setOverflows(element.scrollHeight - element.clientHeight > 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [preview]);

  return (
    <div className="space-y-4" data-testid="event-detail-pane">
      <div className="flex items-center justify-between gap-2 border-b border-ws-border pb-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-pill px-2.5 text-[length:var(--fs-small)] font-medium text-ws-text hover:bg-ws-accent-soft cursor-pointer transition-colors duration-[var(--dur-fast)]"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          <span>Back to calendar</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close event details"
          className="inline-flex h-9 w-9 items-center justify-center rounded-pill text-ws-text-muted hover:bg-ws-accent-soft hover:text-ws-text cursor-pointer transition-colors duration-[var(--dur-fast)]"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge occurrence={occurrence} />
          <StatusBadges occurrence={occurrence} now={now} />
          <span className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted tabular-nums">
            {formatRelativeEventTime(occurrence.startAt, now)}
          </span>
        </div>
        <h2 className={styles.eventTitleLarge}>{occurrence.title}</h2>
      </div>

      <OccurrenceMetadata occurrence={occurrence} />

      {preview ? (
        <div className="space-y-1.5">
          <h3 className="text-[length:var(--fs-small)] font-medium text-ws-text">
            Notes &amp; instructions
          </h3>
          <p
            ref={previewRef}
            data-testid="event-notes-preview"
            className={`${overlays.previewClamp} text-[length:var(--fs-small)] leading-relaxed text-ws-text-muted`}
          >
            {preview}
          </p>
          {overflows ? (
            <button
              type="button"
              onClick={() => onOpenReader(occurrence)}
              className="min-h-9 rounded-pill px-2 text-[length:var(--fs-small)] font-medium text-ws-accent underline-offset-2 hover:underline cursor-pointer"
            >
              See more
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ws-border pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {occurrence.kind === 'class' ? (
            <>
              {occurrence.status === 'active' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => onCancelClass(occurrence)}
                >
                  Cancel class…
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                className="text-text-overdue hover:bg-tint-overdue-bg"
                onClick={() => onDelete(occurrence)}
              >
                Delete…
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              className="text-text-overdue hover:bg-tint-overdue-bg"
              onClick={() => onDelete(occurrence)}
            >
              Delete event
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => onEdit(occurrence)}>
            {occurrence.kind === 'class' ? 'Edit class' : 'Edit event'}
          </Button>
        </div>
      </div>
    </div>
  );
}

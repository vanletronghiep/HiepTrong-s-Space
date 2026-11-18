'use client';

import {
  Ban,
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  GraduationCap,
  Radio,
  Sparkles,
  Trophy,
  Video,
} from 'lucide-react';
import type { EventCategory, EventOccurrence } from '@/contracts/event';
import { isOccurrenceOngoing } from '@/domain/event-occurrence';
import { cn } from '@/ui/cn';

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  exam: 'Exam',
  meeting: 'Meeting',
  deadline: 'Deadline',
  contest: 'Contest',
  school: 'School (legacy)',
};

const pillBase =
  'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-[length:var(--fs-micro)] font-medium whitespace-nowrap';

/** Category or Class identity. Exam meaning (including legacy flags) uses the due-soon tone. */
export function KindBadge({
  occurrence,
}: {
  occurrence: Pick<EventOccurrence, 'kind' | 'category' | 'isExam'>;
}) {
  if (occurrence.kind === 'class') {
    return (
      <span className={cn(pillBase, 'bg-ws-accent-soft text-ws-text border-ws-border')}>
        <BookOpen size={12} strokeWidth={1.6} aria-hidden="true" />
        <span>Class</span>
      </span>
    );
  }
  const category = occurrence.category;
  const exam = category === 'exam' || occurrence.isExam;
  const icon =
    category === 'exam' ? (
      <GraduationCap size={12} strokeWidth={1.6} aria-hidden="true" />
    ) : category === 'meeting' ? (
      <Video size={12} strokeWidth={1.6} aria-hidden="true" />
    ) : category === 'deadline' ? (
      <Clock size={12} strokeWidth={1.6} aria-hidden="true" />
    ) : category === 'contest' ? (
      <Trophy size={12} strokeWidth={1.6} aria-hidden="true" />
    ) : (
      <CalendarIcon size={12} strokeWidth={1.6} aria-hidden="true" />
    );
  return (
    <span
      className={cn(
        pillBase,
        exam
          ? 'bg-tint-due-soon-bg text-text-due-soon border-tint-due-soon-border'
          : 'bg-ws-accent-soft text-ws-text border-ws-border',
      )}
    >
      {icon}
      <span>{category ? CATEGORY_LABEL[category] : 'Event'}</span>
      {exam && category !== 'exam' ? <span className="sr-only">, marked as exam</span> : null}
    </span>
  );
}

/** Canceled, ongoing, and highlighted markers shared by lists, calendars, and the reader. */
export function StatusBadges({ occurrence, now }: { occurrence: EventOccurrence; now: Date }) {
  return (
    <>
      {occurrence.status === 'canceled' ? (
        <span
          className={cn(
            pillBase,
            'bg-tint-overdue-bg text-text-overdue border-tint-overdue-border',
          )}
        >
          <Ban size={12} strokeWidth={1.6} aria-hidden="true" />
          <span>Canceled</span>
        </span>
      ) : isOccurrenceOngoing(occurrence, now) ? (
        <span className={cn(pillBase, 'bg-ws-surface text-ws-text border-ws-accent')}>
          <Radio size={12} strokeWidth={1.6} aria-hidden="true" />
          <span>Ongoing</span>
        </span>
      ) : null}
      {occurrence.highlighted ? (
        <span className={cn(pillBase, 'bg-ws-surface text-text-accent border-ws-border')}>
          <Sparkles size={12} strokeWidth={1.6} aria-hidden="true" />
          <span>Highlighted</span>
        </span>
      ) : null}
    </>
  );
}

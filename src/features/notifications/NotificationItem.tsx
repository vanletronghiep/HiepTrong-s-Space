'use client';

import type { NotificationDto, NotificationKind } from '@/contracts';
import { formatRelativeAgeLabel } from '@/domain/notification-rules';
import { formatTimeLeftLabel } from '@/domain/task-status';
import { TransitionLink } from '@/features/transitions/TransitionLink';
import { Badge, type BadgeTone } from '@/ui/Badge';
import { cn } from '@/ui/cn';

const KIND_TO_BADGE_TONE: Record<NotificationKind, BadgeTone> = {
  due_soon: 'due-soon',
  overdue: 'overdue',
  completed: 'completed',
  general: 'general',
  system: 'system',
};

export interface NotificationItemProps {
  item: NotificationDto;
  now: Date;
  onToggleRead: (id: string, nextIsRead: boolean) => void;
  onNavigate: (item: NotificationDto) => void;
  density?: 'compact' | 'comfortable';
}

export function NotificationItem({
  item,
  now,
  onToggleRead,
  onNavigate,
  density = 'compact',
}: NotificationItemProps) {
  const ageLabel = formatRelativeAgeLabel(item.createdAt, now);
  const badgeTone = KIND_TO_BADGE_TONE[item.kind];
  const isOverdueTime = item.timeLeftMs !== null && item.timeLeftMs <= 0;
  const timeLeftText =
    item.timeLeftMs !== null ? formatTimeLeftLabel(item.timeLeftMs, isOverdueTime) : null;
  const comfortable = density === 'comfortable';
  const titleTone = item.isRead ? 'font-normal text-ws-text-muted' : 'font-semibold text-ws-text';

  return (
    <div
      className={cn(
        'group relative rounded-item border border-ws-border transition-[border-color,background-color] duration-[var(--dur-fast)] ease-[var(--ease)]',
        comfortable ? 'px-4 py-3.5 sm:px-5 sm:py-4' : 'px-3.5 py-3',
        item.isRead
          ? 'bg-[color-mix(in_srgb,var(--ws-text)_4%,var(--ws-surface))]'
          : 'bg-ws-surface',
        item.targetUrl && 'hover:border-[color-mix(in_srgb,var(--ws-accent)_55%,var(--ws-border))]',
      )}
    >
      {/* v4.2: unread = accent bar + bold title + filled dot; read = dimmed + hollow dot */}
      {!item.isRead ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1 rounded-l-item bg-ws-accent"
        />
      ) : null}
      {/* Row 1: Tag pill (left) + Read checkbox (right) */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <Badge tone={badgeTone} withDot={comfortable} className="h-5">
          {item.tagLabel}
        </Badge>
        <div className="relative z-10 flex items-center gap-2">
          {comfortable ? (
            <span className="text-[length:var(--fs-micro)] text-ws-text-muted select-none">
              {item.isRead ? 'Read' : 'Unread'}
            </span>
          ) : null}
          <button
            type="button"
            role="checkbox"
            aria-checked={item.isRead}
            aria-label={
              item.isRead
                ? `Mark "${item.title}" notification as unread`
                : `Mark "${item.title}" notification as read`
            }
            onClick={(event) => {
              event.stopPropagation();
              onToggleRead(item.id, !item.isRead);
            }}
            className="group/dot -m-1.5 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-pill"
          >
            {item.isRead ? (
              <span className="h-3 w-3 rounded-pill border-[1.5px] border-ws-text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease)] group-hover/dot:border-ws-accent motion-reduce:transition-none" />
            ) : (
              <span
                data-testid="notification-unread-dot"
                className="h-3 w-3 rounded-pill bg-ws-accent transition-shadow duration-[var(--dur-fast)] ease-[var(--ease)] group-hover/dot:shadow-[0_0_0_3px_var(--ws-accent-soft)] motion-reduce:transition-none"
              />
            )}
          </button>
        </div>
      </div>

      {/* Row 2: Title (stretched TransitionLink when linked) */}
      <div className="flex items-start gap-2 min-w-0">
        {item.targetUrl ? (
          <TransitionLink
            href={item.targetUrl}
            onClick={() => onNavigate(item)}
            className={cn(
              titleTone,
              'min-w-0 break-words leading-snug after:absolute after:inset-0 after:rounded-item focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ws-focus focus-visible:after:outline-offset-2',
              comfortable ? 'text-[1rem]' : 'text-[length:var(--fs-ui)]',
            )}
          >
            {item.title}
          </TransitionLink>
        ) : (
          <span
            className={cn(
              titleTone,
              'min-w-0 break-words leading-snug',
              comfortable ? 'text-[1rem]' : 'text-[length:var(--fs-ui)]',
            )}
          >
            {item.title}
          </span>
        )}
      </div>

      {/* Row 3: Message */}
      {item.message ? (
        <p
          className={cn(
            'mt-1.5 break-words leading-relaxed',
            item.isRead ? 'text-ws-text-muted' : 'text-ws-text',
            comfortable
              ? 'text-[length:var(--fs-ui)]'
              : 'text-[length:var(--fs-small)] line-clamp-2',
          )}
        >
          {item.message}
        </p>
      ) : null}

      {/* Row 4: Time-left (left, when relevant) + N days ago (bottom-right corner) */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        {timeLeftText ? (
          <span
            className={cn(
              'text-[length:var(--fs-micro)] font-medium tabular-nums',
              isOverdueTime ? 'text-text-overdue' : 'text-text-due-soon',
            )}
          >
            {timeLeftText}
          </span>
        ) : (
          <span />
        )}
        <div className="ml-auto flex items-center gap-3">
          {comfortable && item.targetUrl ? (
            <span
              aria-hidden="true"
              className="text-[length:var(--fs-micro)] font-medium text-ws-accent"
            >
              Open linked item
            </span>
          ) : null}
          <span className="text-[length:var(--fs-micro)] text-ws-text-muted tabular-nums">
            {ageLabel}
          </span>
        </div>
      </div>
    </div>
  );
}


'use client';

import type { NotificationDto, NotificationKind } from '@/contracts';
import { formatRelativeAgeLabel } from '@/domain/notification-rules';
import { formatTimeLeftLabel } from '@/domain/task-status';
import { TransitionLink } from '@/features/transitions/TransitionLink';
import { Badge, type BadgeTone } from '@/ui/Badge';
import { Checkbox } from '@/ui/Checkbox';
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

  return (
    <div
      className={cn(
        'group relative rounded-item border border-ws-border transition-[border-color,background-color] duration-[var(--dur-fast)] ease-[var(--ease)]',
        comfortable ? 'px-4 py-3.5 sm:px-5 sm:py-4' : 'px-3.5 py-3',
        item.isRead
          ? 'bg-ws-surface'
          : 'bg-[color-mix(in_srgb,var(--ws-accent)_6%,var(--ws-surface))]',
        item.targetUrl && 'hover:border-[color-mix(in_srgb,var(--ws-accent)_55%,var(--ws-border))]',
      )}
    >
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
          <Checkbox
            size={comfortable ? 'md' : 'sm'}
            checked={item.isRead}
            onCheckedChange={(checked) => onToggleRead(item.id, checked)}
            aria-label={
              item.isRead
                ? `Mark "${item.title}" notification as unread`
                : `Mark "${item.title}" notification as read`
            }
          />
        </div>
      </div>

      {/* Row 2: Unread dot + Title (stretched TransitionLink when task-linked) */}
      <div className="flex items-start gap-2 min-w-0">
        {!item.isRead ? (
          <span
            aria-hidden="true"
            data-testid="notification-unread-dot"
            className="mt-1.5 h-2 w-2 rounded-pill bg-status-overdue shrink-0"
          />
        ) : null}
        {item.targetUrl ? (
          <TransitionLink
            href={item.targetUrl}
            onClick={() => onNavigate(item)}
            className={cn(
              'min-w-0 break-words font-semibold text-ws-text leading-snug after:absolute after:inset-0 after:rounded-item focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ws-focus focus-visible:after:outline-offset-2',
              comfortable ? 'text-[1rem]' : 'text-[length:var(--fs-ui)]',
            )}
          >
            {item.title}
          </TransitionLink>
        ) : (
          <span
            className={cn(
              'min-w-0 break-words font-semibold text-ws-text leading-snug',
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
            'mt-1.5 break-words text-ws-text-muted leading-relaxed',
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

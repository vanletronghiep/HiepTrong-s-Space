import Image from 'next/image';
import type { ProjectItem, ProjectPriority, ProjectStatus } from '@/contracts/project';
import { daysUntil, relativeDeadlineText } from '@/domain/deadline-phrase';
import { PRIORITY_LABEL, STATUS_LABEL } from '@/domain/project-domain';
import { cn } from '@/ui/cn';
import { artSrc } from './focus-art';
import styles from './projects.module.css';

const PRIORITY_CLASS: Record<ProjectPriority, string> = {
  critical: styles.prioCritical ?? '',
  active: styles.prioActive ?? '',
  background: styles.prioBackground ?? '',
};

const EMBLEM: Record<ProjectPriority, string> = {
  critical: 'emblem-seal',
  active: 'emblem-bamboo',
  background: 'emblem-mountain',
};

/** Seal for Critical, bamboo for Active, ink mountain for Background. Decorative. */
export function PriorityEmblem({
  priority,
  size = 15,
}: {
  priority: ProjectPriority;
  size?: number;
}) {
  return (
    <Image
      src={artSrc(EMBLEM[priority])}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      unoptimized
      className={styles.emblem}
    />
  );
}

export function PriorityTag({ priority }: { priority: ProjectPriority }) {
  return (
    <span className={cn(styles.tag, PRIORITY_CLASS[priority])}>
      <PriorityEmblem priority={priority} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

const METER_STEPS: Record<ProjectStatus, number> = {
  intensive: 4,
  steady: 3,
  moderate: 2,
  minimal: 1,
  paused: 0,
};

/** A small signal meter: four bars filled by energy, two parallel bars for Paused. */
export function StatusMeter({ status }: { status: ProjectStatus }) {
  const steps = METER_STEPS[status];
  return (
    <span
      aria-hidden="true"
      className={cn(styles.meter, status === 'paused' && styles.meterPaused)}
    >
      {status === 'paused' ? (
        <>
          <i />
          <i />
        </>
      ) : (
        [1, 2, 3, 4].map((step) => <i key={step} data-on={step <= steps ? 'true' : undefined} />)
      )}
    </span>
  );
}

export function StatusChip({ status }: { status: ProjectStatus }) {
  return (
    <span className={styles.statusChip}>
      <StatusMeter status={status} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function DeadlineChip({
  project,
  todayIso,
}: {
  project: Pick<ProjectItem, 'deadlineAt' | 'deadlinePhrase'>;
  todayIso: string;
}) {
  if (!project.deadlineAt) return null;
  const days = daysUntil(project.deadlineAt, todayIso);
  return (
    <span
      className={cn(styles.statusChip, days < 0 && styles.chipOverdue)}
      title={
        project.deadlinePhrase
          ? `${project.deadlineAt.slice(0, 10)} (typed “${project.deadlinePhrase}”)`
          : project.deadlineAt.slice(0, 10)
      }
    >
      Due {relativeDeadlineText(days)}
    </span>
  );
}

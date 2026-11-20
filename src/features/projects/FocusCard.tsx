import type { ProjectItem } from '@/contracts/project';
import { isQuiet, lastNoteLabel, nextBlock, roadmapProgress } from '@/domain/project-domain';
import { cn } from '@/ui/cn';
import { DeadlineChip, PriorityTag, StatusChip } from './FocusBits';
import styles from './projects.module.css';

export function FocusCard({
  project,
  now,
  todayIso,
  onOpen,
}: {
  project: ProjectItem;
  now: Date;
  todayIso: string;
  onOpen: (id: string) => void;
}) {
  const percent = roadmapProgress(project.roadmap);
  const next = nextBlock(project.roadmap);
  const quiet = isQuiet(project, now);
  const title = project.title.trim() || 'Untitled focus';

  return (
    <button
      type="button"
      id={`item-${project.id}`}
      className={cn(styles.card, quiet && styles.cardQuiet)}
      aria-haspopup="dialog"
      aria-label={`Open ${title}`}
      onClick={() => onOpen(project.id)}
    >
      <span className={styles.cardTop}>
        <span className={styles.cardTitle}>{title}</span>
        <span className={styles.cardPercent}>{percent}%</span>
      </span>
      <span
        className={styles.progressBar}
        role="progressbar"
        aria-label={`${title} progress`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className={styles.progressFill} style={{ transform: `scaleX(${percent / 100})` }} />
      </span>
      <span className={styles.cardMeta}>
        <PriorityTag priority={project.priority} />
        <StatusChip status={project.status} />
        <DeadlineChip project={project} todayIso={todayIso} />
      </span>
      <span className={styles.cardNext}>
        {next ? (
          <>
            <span className={styles.cardNextLabel}>Next</span>
            <span className={styles.cardNextText}>
              {next.title.trim() || 'Untitled checkpoint'}
            </span>
          </>
        ) : (
          <span className={styles.cardNextLabel}>
            {project.roadmap.length ? 'Roadmap complete' : 'No roadmap yet'}
          </span>
        )}
      </span>
      <span className={styles.cardLog}>
        {lastNoteLabel(project, now)}
        {quiet ? ' · quiet for a while' : ''}
      </span>
    </button>
  );
}

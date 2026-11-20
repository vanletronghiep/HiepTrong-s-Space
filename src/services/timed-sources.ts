import { isRouteHidden } from '@/domain/feature-visibility';
import { buildZonedInstant } from '@/domain/time';
import { eventService } from './event-service';
import { projectService } from './project-service';
import { milestoneService } from './milestone-service';
import { achievementService } from './achievement-service';

export interface TimedSource {
  key: string;
  title: string;
  deadlineAt: string;
  targetUrl: string;
}

/** Read-only projection; date-only targets mean end of local day. */
export async function listTimedSources(): Promise<TimedSource[]> {
  const [events, projects, milestones, achievements] = await Promise.all([
    eventService.listEvents(),
    projectService.listProjects(),
    milestoneService.listMilestones(),
    achievementService.getAchievements(),
  ]);
  const sources: TimedSource[] = [];
  const add = (kind: string, id: string, title: string, date: string | null, route: string) => {
    if (!date) return;
    const deadlineAt = /^\d{4}-\d{2}-\d{2}$/.test(date) ? buildZonedInstant(date, '23:59') : date;
    if (!Number.isFinite(Date.parse(deadlineAt))) return;
    sources.push({
      key: `${kind}:${id}`,
      title,
      deadlineAt,
      targetUrl: `${route}?item=${encodeURIComponent(id)}`,
    });
  };
  // Ordinary events keep their reminder; weekly class series are not expanded into
  // per-occurrence reminders (new product behaviour would need owner approval).
  for (const e of events)
    if (e.kind !== 'class' && e.status !== 'canceled')
      add('event', e.id, e.title, e.startAt, '/events');
  for (const p of projects)
    if (p.finishedAt === null && p.status !== 'paused')
      add('project', p.id, p.title, p.deadlineAt, '/focus');
  // Reminders for hidden pages would link to a 404; they resume when the page is unhidden.
  if (!isRouteHidden('/milestones'))
    for (const m of milestones)
      if (m.status !== 'achieved') add('milestone', m.id, m.title, m.targetDate, '/milestones');
  if (!isRouteHidden('/achievements'))
    for (const a of achievements)
      if (a.reminderEnabled) add('achievement', a.id, a.title, a.futureDate, '/achievements');
  return sources;
}

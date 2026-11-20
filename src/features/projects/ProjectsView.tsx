'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Compass, Plus, RotateCcw } from 'lucide-react';
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from '@/client/queries/projects';
import {
  projectItemSchema,
  type PatchProjectInput,
  type ProjectItem,
  type ProjectPriority,
} from '@/contracts/project';
import { MOTION_DURATION, MOTION_EASE } from '@/design/motion';
import { applyDraftPatch, isFinished, sortFocuses } from '@/domain/project-domain';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';
import { usePageReady } from '@/features/transitions/TransitionProvider';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { FeatureThemeProvider, useFeatureTheme } from '@/ui/FeatureTheme';
import { Skeleton } from '@/ui/Skeleton';
import { useItemAnchor } from '@/ui/use-item-anchor';
import { FocusCard } from './FocusCard';
import { PriorityEmblem } from './FocusBits';
import { artSrc } from './focus-art';
import { FocusPanel } from './FocusPanel';
import { TierSwitch, type TierOption } from './TierSwitch';
import styles from './projects.module.css';

type Tier = 'all' | ProjectPriority;

const TIER_LABEL: Record<Tier, string> = {
  all: 'All',
  background: 'Background',
  active: 'Active',
  critical: 'Critical',
};
const TIER_ORDER: Tier[] = ['all', 'background', 'active', 'critical'];

export function ProjectsView() {
  const inheritedTheme = useFeatureTheme();
  const reduced = useReducedMotion();
  const { data: projects = [], isLoading, isError: loadFailed, refetch } = useProjects();
  usePageReady(!isLoading);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();
  const now = useMemo(() => new Date(), []);
  const todayIso = formatScheduledDate(now, DEFAULT_APP_TIMEZONE);

  const [tier, setTier] = useState<Tier>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  // A new focus stays in the panel, unsaved, until the owner saves it.
  const [draft, setDraftState] = useState<ProjectItem | null>(null);
  const draftRef = useRef<ProjectItem | null>(null);
  const setDraft = (next: ProjectItem | null) => {
    draftRef.current = next;
    setDraftState(next);
  };
  const [actionError, setActionError] = useState('');

  useItemAnchor(projects);

  const live = useMemo(() => projects.filter((project) => !isFinished(project)), [projects]);
  const finished = useMemo(() => projects.filter(isFinished), [projects]);
  const shown = useMemo(
    () => sortFocuses(live.filter((project) => tier === 'all' || project.priority === tier)),
    [live, tier],
  );
  const options: TierOption<Tier>[] = TIER_ORDER.map((key) => ({
    key,
    label: TIER_LABEL[key],
    count: key === 'all' ? live.length : live.filter((project) => project.priority === key).length,
    icon: key === 'all' ? undefined : <PriorityEmblem priority={key} size={16} />,
  }));

  const openProject = openId ? (projects.find((project) => project.id === openId) ?? null) : null;

  const closePanel = () => {
    const id = openId;
    setOpenId(null);
    if (id) requestAnimationFrame(() => document.getElementById(`item-${id}`)?.focus());
  };

  const patchProject = (id: string, patch: PatchProjectInput) => {
    setActionError('');
    updateMutation.mutate(
      { id, patch },
      {
        onError: (error) =>
          setActionError(
            error instanceof Error
              ? error.message
              : 'Could not save that change. Retry when ready.',
          ),
      },
    );
  };

  const startDraft = () => {
    setActionError('');
    const nowIso = new Date().toISOString();
    setDraft(
      projectItemSchema.parse({
        id: 'draft',
        title: '',
        priority: tier === 'all' ? 'active' : tier,
        createdAt: nowIso,
        updatedAt: nowIso,
      }),
    );
  };

  const patchDraft = (patch: PatchProjectInput) => {
    const current = draftRef.current;
    if (current) setDraft(applyDraftPatch(current, patch, new Date().toISOString()));
  };

  const saveDraft = async (closeAfter: boolean): Promise<string | null> => {
    const draft = draftRef.current;
    if (!draft) return null;
    try {
      const item = await createMutation.mutateAsync({
        title: draft.title.trim(),
        why: draft.why,
        priority: draft.priority,
        status: draft.status,
        deadlineAt: draft.deadlineAt,
        deadlinePhrase: draft.deadlinePhrase,
        roadmap: draft.roadmap,
      });
      setDraft(null);
      setOpenId(closeAfter ? null : item.id);
      return null;
    } catch (error) {
      return error instanceof Error
        ? error.message
        : 'Could not save this focus right now. Retry when ready.';
    }
  };

  const deleteFocus = (id: string) => {
    setActionError('');
    deleteMutation.mutate(id, {
      onSuccess: () => setOpenId(null),
      onError: (error) =>
        setActionError(
          error instanceof Error ? error.message : 'Could not delete this focus right now.',
        ),
    });
  };

  const content = (
    <div data-feature-theme={inheritedTheme ? undefined : 'project'} className={styles.pageStack}>
      <Image
        src="/visuals/project/auspicious-cloud-pillar.svg"
        alt=""
        aria-hidden="true"
        width={200}
        height={480}
        loading="eager"
        unoptimized
        className={styles.cloudPillarDecor}
      />

      <section className={styles.masthead} aria-labelledby="projects-page-heading">
        <div className={styles.mastheadText}>
          <div className={styles.eyebrow}>
            <Compass size={15} strokeWidth={1.6} aria-hidden="true" />
            <span>Life in Motion </span>
          </div>
          <h1 id="projects-page-heading" className={styles.displayTitle}>
            Current <span className={styles.displayTitleEmphasis}>focus</span>
          </h1>
          <p className={styles.mastheadSubtitle}>
            Where your attention goes, and how things move forward.
          </p>
        </div>
        <Image
          src={artSrc('ridge-and-rising-sun')}
          alt=""
          aria-hidden="true"
          width={480}
          height={300}
          loading="eager"
          unoptimized
          className={styles.mastheadArt}
        />
        <div className={styles.mastheadActions}>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} aria-hidden="true" />}
            onClick={startDraft}
          >
            New focus
          </Button>
        </div>
      </section>

      {loadFailed ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-tint-overdue-border bg-tint-overdue-bg px-4 py-3 text-[length:var(--fs-ui)] text-text-overdue"
        >
          <span>Could not load your focuses right now. Check connection or retry.</span>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} aria-hidden="true" />}
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {actionError ? (
        <div
          role="alert"
          className="rounded-card border border-tint-overdue-border bg-tint-overdue-bg px-4 py-3 text-[length:var(--fs-ui)] text-text-overdue"
        >
          {actionError}
        </div>
      ) : null}

      <TierSwitch label="Focus tier" options={options} value={tier} onChange={setTier} />
      <div className={styles.bambooRule} aria-hidden="true">
        <Image
          src={artSrc('bamboo-rule')}
          alt=""
          aria-hidden="true"
          width={720}
          height={34}
          unoptimized
        />
      </div>

      {isLoading && projects.length === 0 ? (
        <div className={styles.grid} aria-label="Loading focuses">
          <Skeleton className="h-44 w-full rounded-card" />
          <Skeleton className="h-44 w-full rounded-card" />
          <Skeleton className="h-44 w-full rounded-card" />
        </div>
      ) : shown.length === 0 ? (
        <div className={styles.emptyContainer}>
          {projects.length === 0 && !loadFailed ? (
            <Image
              src="/visuals/project/wooden-training-dummy.svg"
              alt=""
              aria-hidden="true"
              width={160}
              height={160}
              unoptimized
              className={styles.emptyDummy}
            />
          ) : null}
          <EmptyState
            title={
              loadFailed
                ? 'Focuses unavailable right now.'
                : projects.length === 0
                  ? 'Nothing in focus. Pick one thing to train on.'
                  : `No ${tier === 'all' ? '' : `${TIER_LABEL[tier].toLowerCase()} `}focuses right now.`
            }
            description={
              loadFailed
                ? 'Retry loading above once your connection is restored.'
                : projects.length === 0
                  ? 'Add a focus with a reason and a few checkpoints.'
                  : 'Try another tier.'
            }
            action={
              projects.length === 0 && !loadFailed ? (
                <Button variant="primary" size="sm" onClick={startDraft}>
                  New focus
                </Button>
              ) : tier !== 'all' ? (
                <Button variant="secondary" size="sm" onClick={() => setTier('all')}>
                  Show all
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className={styles.grid}>
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((project) => (
              <motion.div
                key={project.id}
                layout={reduced ? false : 'position'}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                transition={{ duration: reduced ? 0 : MOTION_DURATION.layout, ease: MOTION_EASE }}
              >
                <FocusCard project={project} now={now} todayIso={todayIso} onOpen={setOpenId} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {finished.length > 0 ? (
        <details className={styles.finishedList}>
          <summary>Finished ({finished.length})</summary>
          <ul>
            {finished.map((project) => (
              <li key={project.id}>
                <Image
                  src={artSrc('jade-stamp-check')}
                  alt=""
                  aria-hidden="true"
                  width={40}
                  height={40}
                  unoptimized
                  className={styles.finishedSeal}
                />
                <button
                  type="button"
                  id={`item-${project.id}`}
                  onClick={() => setOpenId(project.id)}
                >
                  {project.title.trim() || 'Untitled focus'}
                </button>
                <span>
                  {project.finishedAt
                    ? formatScheduledDate(project.finishedAt, DEFAULT_APP_TIMEZONE)
                    : ''}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className={styles.footerBand} aria-hidden="true">
        <Image
          src={artSrc('distant-mountains')}
          alt=""
          aria-hidden="true"
          width={960}
          height={140}
          unoptimized
        />
      </div>

      {draft ? (
        <FocusPanel
          key="draft"
          project={draft}
          now={now}
          todayIso={todayIso}
          isDraft
          onPatch={patchDraft}
          onSaveDraft={saveDraft}
          onDelete={() => setDraft(null)}
          onClose={() => setDraft(null)}
        />
      ) : openProject ? (
        <FocusPanel
          key={openProject.id}
          project={openProject}
          now={now}
          todayIso={todayIso}
          onPatch={(patch) => patchProject(openProject.id, patch)}
          onDelete={() => deleteFocus(openProject.id)}
          onClose={closePanel}
        />
      ) : null}
    </div>
  );

  if (inheritedTheme) return content;
  return <FeatureThemeProvider name="project">{content}</FeatureThemeProvider>;
}

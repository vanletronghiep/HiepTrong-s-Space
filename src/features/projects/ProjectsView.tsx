'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Code,
  Compass,
  ExternalLink,
  Plus,
  RotateCcw,
} from 'lucide-react';
import {
  clearEditorDraft,
  isEditorDraftStale,
  listSavedEditDraftRecordIds,
  loadEditorDraft,
  saveEditorDraft,
  type EditorDraftPayload,
} from '@/client/editor-drafts';
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from '@/client/queries/projects';
import type { ProjectItem, ProjectStatus } from '@/contracts/project';
import { computeProjectStats } from '@/domain/project-domain';
import { DEFAULT_APP_TIMEZONE, formatDisplayDate } from '@/domain/time';
import { Badge, type BadgeTone } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { cn } from '@/ui/cn';
import { ConfirmDialog } from '@/ui/Dialog';
import { EmptyState } from '@/ui/EmptyState';
import { DatePickerField } from '@/ui/DatePickerField';
import { FeatureThemeProvider, useFeatureTheme } from '@/ui/FeatureTheme';
import { FormattedNoteContent } from '@/ui/FormattedNoteContent';
import {
  LargeEditorDialog,
  LargeEditorTwoColumn,
  type DraftSaveOutcome,
} from '@/ui/LargeEditorDialog';
import { RichNoteEditor } from '@/ui/RichNoteEditor';
import { SelectField } from '@/ui/SelectField';
import { Skeleton } from '@/ui/Skeleton';
import { useItemAnchor } from '@/ui/use-item-anchor';
import {
  defaultProjectEditorValues,
  isProjectDraftValues,
  projectEditorCreateInput,
  projectEditorPatch,
  projectEditorValues,
  sameProjectEditorValues,
  type ProjectEditorValues,
} from './project-editor';
import styles from './projects.module.css';

const PROJECT_FORM_ID = 'project';
const PROJECT_EDITOR_DOM_FORM_ID = 'project-large-editor-form';

const STATUS_META: Record<ProjectStatus, { label: string; tone: BadgeTone; badgeClass?: string }> =
  {
    active: { label: 'Active', tone: 'general' },
    in_progress: { label: 'In progress', tone: 'due-soon' },
    completed: { label: 'Completed', tone: 'completed' },
    on_hold: { label: 'On hold', tone: 'optional', badgeClass: styles.statusBadgeOnHold },
  };

const FILTER_OPTIONS: readonly { key: 'all' | ProjectStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'on_hold', label: 'On hold' },
];

function formatDraftTimestamp(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    return 'recently';
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DEFAULT_APP_TIMEZONE,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms));
}

function formatTargetDate(deadlineAt: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadlineAt)) {
    return formatDisplayDate(`${deadlineAt}T12:00:00+07:00`, new Date(), DEFAULT_APP_TIMEZONE);
  }
  const parsed = Date.parse(deadlineAt);
  if (Number.isNaN(parsed)) {
    return deadlineAt;
  }
  return formatDisplayDate(new Date(parsed), new Date(), DEFAULT_APP_TIMEZONE);
}

function isSafeExternalUrl(raw: string | null | undefined): raw is string {
  if (!raw) {
    return false;
  }
  return /^https?:\/\//i.test(raw.trim());
}

export function ProjectsView() {
  const inheritedTheme = useFeatureTheme();
  const { data: projects = [], isLoading, isError: loadFailed, refetch } = useProjects();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const savingRef = useRef(false);
  const editorTitleInputRef = useRef<HTMLInputElement>(null);

  const [activeFilter, setActiveFilter] = useState<'all' | ProjectStatus>('all');
  const [actionError, setActionError] = useState('');
  const [pendingProgressId, setPendingProgressId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null);

  // Unified LargeEditorDialog + explicit local drafts state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<ProjectEditorValues>(() =>
    defaultProjectEditorValues(),
  );
  const [formValues, setFormValues] = useState<ProjectEditorValues>(() =>
    defaultProjectEditorValues(),
  );
  const [editorError, setEditorError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedDraft, setLoadedDraft] = useState<EditorDraftPayload<ProjectEditorValues> | null>(
    null,
  );
  const [draftSyncVersion, setDraftSyncVersion] = useState(0);

  useItemAnchor(projects);

  const refreshOrphanedDrafts = useCallback(() => {
    setDraftSyncVersion((v) => v + 1);
  }, []);

  const orphanedDraftIds = useMemo(() => {
    void draftSyncVersion;
    if (isLoading || loadFailed) {
      return [];
    }
    const ids = listSavedEditDraftRecordIds(PROJECT_FORM_ID);
    return ids.filter((id) => !projects.some((project) => project.id === id));
  }, [draftSyncVersion, isLoading, loadFailed, projects]);

  const stats = useMemo(() => computeProjectStats(projects), [projects]);

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'all') {
      return projects;
    }
    return projects.filter((project) => project.status === activeFilter);
  }, [activeFilter, projects]);

  const isEditorDirty = editorOpen && !sameProjectEditorValues(initialFormValues, formValues);

  const openCreateEditor = () => {
    const base = defaultProjectEditorValues();
    const existing = loadEditorDraft<ProjectEditorValues>(
      PROJECT_FORM_ID,
      null,
      isProjectDraftValues,
    );
    setEditingProject(null);
    setInitialFormValues(base);
    setFormValues(base);
    setEditorError('');
    setLoadedDraft(existing.ok ? existing.draft : null);
    setEditorOpen(true);
  };

  const openEditEditor = (project: ProjectItem) => {
    const base = projectEditorValues(project);
    const existing = loadEditorDraft<ProjectEditorValues>(
      PROJECT_FORM_ID,
      project.id,
      isProjectDraftValues,
    );
    setEditingProject(project);
    setInitialFormValues(base);
    setFormValues(base);
    setEditorError('');
    setLoadedDraft(existing.ok ? existing.draft : null);
    setEditorOpen(true);
  };

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingProject(null);
    setEditorError('');
    setLoadedDraft(null);
  }, []);

  const handleSaveDraft = (): DraftSaveOutcome => {
    const result = saveEditorDraft({
      formId: PROJECT_FORM_ID,
      recordId: editingProject?.id ?? null,
      recordUpdatedAt: editingProject?.updatedAt ?? null,
      values: formValues,
    });
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    setLoadedDraft(null);
    setInitialFormValues(formValues);
    refreshOrphanedDrafts();
    return {
      ok: true,
      message: `Draft saved locally (${formatDraftTimestamp(result.draft.savedAt)}).`,
    };
  };

  const submitEditor = useCallback(async () => {
    if (savingRef.current) {
      return;
    }
    const trimmedTitle = formValues.title.trim();
    if (!trimmedTitle) {
      setEditorError('Enter a project title.');
      editorTitleInputRef.current?.focus();
      return;
    }
    if (trimmedTitle.length > 200) {
      setEditorError('Project title must be 200 characters or fewer.');
      editorTitleInputRef.current?.focus();
      return;
    }
    if (
      !Number.isFinite(formValues.progressPercent) ||
      formValues.progressPercent < 0 ||
      formValues.progressPercent > 100
    ) {
      setEditorError('Progress must be between 0 and 100.');
      return;
    }

    savingRef.current = true;
    setIsSubmitting(true);
    setEditorError('');
    setActionError('');

    try {
      if (editingProject) {
        const patch = projectEditorPatch(editingProject, formValues);
        await updateMutation.mutateAsync({
          id: editingProject.id,
          patch,
        });
        clearEditorDraft(PROJECT_FORM_ID, editingProject.id);
      } else {
        await createMutation.mutateAsync(projectEditorCreateInput(formValues));
        clearEditorDraft(PROJECT_FORM_ID, null);
      }
      refreshOrphanedDrafts();
      closeEditor();
    } catch (error) {
      setEditorError(
        error instanceof Error
          ? error.message
          : 'Could not save this project. Your input is retained.',
      );
    } finally {
      savingRef.current = false;
      setIsSubmitting(false);
    }
  }, [
    closeEditor,
    createMutation,
    editingProject,
    formValues,
    refreshOrphanedDrafts,
    updateMutation,
  ]);

  const handleEditorSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitEditor();
  };

  useEffect(() => {
    if (!editorOpen || deleteTarget !== null) {
      return undefined;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void submitEditor();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteTarget, editorOpen, submitEditor]);

  const handleProgressChange = (project: ProjectItem, delta: number) => {
    if (pendingProgressId === project.id) {
      return;
    }
    const nextProgress = Math.max(0, Math.min(100, project.progressPercent + delta));
    const nextStatus =
      nextProgress === 100
        ? 'completed'
        : project.status === 'completed'
          ? 'in_progress'
          : project.status;
    setActionError('');
    setPendingProgressId(project.id);
    updateMutation.mutate(
      {
        id: project.id,
        patch: {
          progressPercent: nextProgress,
          status: nextStatus,
        },
      },
      {
        onError: (error) => {
          setActionError(
            error instanceof Error
              ? error.message
              : 'Could not update project progress right now. Retry when ready.',
          );
        },
        onSettled: () => {
          setPendingProgressId((current) => (current === project.id ? null : current));
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }
    const targetId = deleteTarget.id;
    setActionError('');
    deleteMutation.mutate(targetId, {
      onSuccess: () => {
        clearEditorDraft(PROJECT_FORM_ID, targetId);
        refreshOrphanedDrafts();
        setDeleteTarget(null);
        if (editingProject?.id === targetId) {
          closeEditor();
        }
      },
      onError: (error) => {
        setActionError(
          error instanceof Error
            ? error.message
            : 'Could not delete this project right now. Retry when ready.',
        );
        setDeleteTarget(null);
      },
    });
  };

  const handleDiscardOrphanedDrafts = () => {
    for (const orphanId of orphanedDraftIds) {
      clearEditorDraft(PROJECT_FORM_ID, orphanId);
    }
    refreshOrphanedDrafts();
  };

  const workspaceContent = (
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

      {/* Eastern Strategy Masthead */}
      <section className={styles.masthead} aria-labelledby="projects-page-heading">
        <Image
          src="/visuals/project/dragon-over-the-ridge.svg"
          alt=""
          aria-hidden="true"
          width={480}
          height={300}
          loading="eager"
          unoptimized
          className={styles.dragonMastheadArt}
        />
        <div className={styles.mastheadText}>
          <div className={styles.eyebrow}>
            <Compass size={15} strokeWidth={1.6} aria-hidden="true" />
            <span>Eastern strategy &amp; engineering</span>
          </div>
          <h1 id="projects-page-heading" className={styles.displayTitle}>
            In progress <span className={styles.displayTitleEmphasis}>projects</span>
          </h1>
          <p className={styles.mastheadSubtitle}>
            Keep active builds legible with clear next steps, blockers, and steady progress.
          </p>
        </div>

        <div className={styles.mastheadActions}>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} aria-hidden="true" />}
            onClick={openCreateEditor}
          >
            New project
          </Button>
        </div>
      </section>

      {loadFailed ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-tint-overdue-border bg-tint-overdue-bg px-4 py-3 text-[length:var(--fs-ui)] text-text-overdue"
        >
          <span>Could not load your projects right now. Check connection or retry.</span>
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

      {orphanedDraftIds.length > 0 ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ws-border bg-ws-accent-soft px-4 py-3 text-[length:var(--fs-small)] text-ws-text"
        >
          <span>
            {orphanedDraftIds.length === 1
              ? '1 saved local edit draft refers to a project that is no longer in your workspace.'
              : `${orphanedDraftIds.length} saved local edit drafts refer to projects no longer in your workspace.`}
          </span>
          <Button variant="secondary" size="sm" onClick={handleDiscardOrphanedDrafts}>
            Discard missing drafts
          </Button>
        </div>
      ) : null}

      {/* Overview Statistics */}
      <section className={styles.statsGrid} aria-label="Project statistics">
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Total projects</span>
        </div>
        <div className={styles.statCard}>
          <span className={cn(styles.statValue, styles.statValueAccent)}>{stats.activeCount}</span>
          <span className={styles.statLabel}>Active development</span>
        </div>
        <div className={styles.statCard}>
          <span className={cn(styles.statValue, styles.statValueCompleted)}>
            {stats.completedCount}
          </span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.averageProgress}%</span>
          <span className={styles.statLabel}>Average progress</span>
        </div>
      </section>

      {/* Filter Chips */}
      <div className={styles.controlsBar}>
        <div className={styles.filterGroup} role="group" aria-label="Project status filter">
          {FILTER_OPTIONS.map((option) => (
            <Chip
              key={option.key}
              active={activeFilter === option.key}
              onClick={() => setActiveFilter(option.key)}
              className={styles.filterChip}
            >
              {option.label}
            </Chip>
          ))}
        </div>
        <span className="text-[length:var(--fs-small)] text-ws-text-muted tabular-nums">
          Showing {filteredProjects.length} of {projects.length}
        </span>
      </div>

      {/* Cloud Scroll Divider */}
      <div className={styles.cloudScrollDividerWrap} aria-hidden="true">
        <Image
          src="/visuals/project/auspicious-cloud-scroll.svg"
          alt=""
          aria-hidden="true"
          width={720}
          height={100}
          loading="eager"
          unoptimized
          className={styles.cloudScrollDivider}
        />
      </div>

      {/* Projects Grid / Loading / Empty */}
      {isLoading && projects.length === 0 ? (
        <div className={styles.projectsGrid} aria-label="Loading projects">
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className={styles.emptyContainer}>
          <EmptyState
            title={
              loadFailed
                ? 'Projects unavailable right now.'
                : projects.length === 0
                  ? 'No projects in progress yet.'
                  : `No ${STATUS_META[activeFilter === 'all' ? 'active' : activeFilter].label.toLowerCase()} projects right now.`
            }
            description={
              loadFailed
                ? 'Retry loading above once your connection is restored.'
                : projects.length === 0
                  ? 'Create a project to track your overview, next meaningful step, blockers, and target date.'
                  : 'Try another status filter or view all projects.'
            }
            action={
              loadFailed ? (
                <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                  Retry
                </Button>
              ) : projects.length === 0 ? (
                <Button variant="primary" size="sm" onClick={openCreateEditor}>
                  New project
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setActiveFilter('all')}>
                  Show all projects
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className={styles.projectsGrid}>
          {filteredProjects.map((project) => {
            const statusMeta = STATUS_META[project.status];
            const isProgressPending = pendingProgressId === project.id;
            const hasRepoUrl = isSafeExternalUrl(project.repoUrl);
            const hasLiveUrl = isSafeExternalUrl(project.liveUrl);

            return (
              <article
                id={`item-${project.id}`}
                tabIndex={-1}
                key={project.id}
                className={styles.projectCard}
              >
                <div className={styles.projectCardTop}>
                  <div className={styles.cardHeaderRow}>
                    <h2 className={styles.cardTitle}>{project.title}</h2>
                    <Badge tone={statusMeta.tone} withDot className={statusMeta.badgeClass}>
                      {statusMeta.label}
                    </Badge>
                  </div>

                  {project.overview ? (
                    <FormattedNoteContent
                      value={project.overview}
                      className={styles.cardOverview}
                    />
                  ) : null}

                  {project.deadlineAt ? (
                    <div className={styles.deadlineLine}>
                      <Calendar size={14} className="text-ws-accent shrink-0" aria-hidden="true" />
                      <span>Target {formatTargetDate(project.deadlineAt)}</span>
                    </div>
                  ) : null}

                  {/* Progress Bar & Controls */}
                  <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                      <span className="text-ws-text-muted">Manual progress</span>
                      <div className={styles.progressControls}>
                        <button
                          type="button"
                          disabled={isProgressPending}
                          onClick={() => handleProgressChange(project, -5)}
                          aria-label={`Decrease progress for ${project.title} by 5%`}
                          className={styles.progressStepButton}
                        >
                          -5%
                        </button>
                        <span className={styles.progressPercent}>{project.progressPercent}%</span>
                        <button
                          type="button"
                          disabled={isProgressPending}
                          onClick={() => handleProgressChange(project, 5)}
                          aria-label={`Increase progress for ${project.title} by 5%`}
                          className={styles.progressStepButton}
                        >
                          +5%
                        </button>
                      </div>
                    </div>
                    <div
                      className={styles.progressBar}
                      role="progressbar"
                      aria-label={`${project.title} progress`}
                      aria-valuenow={project.progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={styles.progressFill}
                        style={{ transform: `scaleX(${project.progressPercent / 100})` }}
                      />
                    </div>
                  </div>

                  {/* Next Step */}
                  {project.nextStep ? (
                    <div className={styles.nextStepBox}>
                      <div className="flex items-center gap-1.5 text-ws-accent">
                        <ArrowRight size={13} aria-hidden="true" />
                        <span className={styles.nextStepLabel}>Next meaningful step</span>
                      </div>
                      <p className="text-ws-text font-medium [overflow-wrap:anywhere]">
                        {project.nextStep}
                      </p>
                    </div>
                  ) : null}

                  {/* Blocker */}
                  {project.blockers ? (
                    <div className={styles.blockerBox}>
                      <div className="flex items-center gap-1.5 text-text-overdue">
                        <AlertCircle size={13} aria-hidden="true" />
                        <span className={styles.blockerLabel}>Current blocker</span>
                      </div>
                      <FormattedNoteContent
                        value={project.blockers}
                        className="text-ws-text [overflow-wrap:anywhere]"
                      />
                    </div>
                  ) : null}

                  {/* Tech stack tags */}
                  {project.techStack.length > 0 ? (
                    <div className={styles.techTags}>
                      {project.techStack.map((tech) => (
                        <span key={tech} className={styles.techTag}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className={styles.cardFooter}>
                  <div className="flex flex-wrap items-center gap-3">
                    {hasRepoUrl ? (
                      <a
                        href={project.repoUrl!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[length:var(--fs-micro)] font-medium text-ws-accent hover:underline"
                      >
                        <Code size={13} aria-hidden="true" />
                        <span>Source</span>
                      </a>
                    ) : null}
                    {hasLiveUrl ? (
                      <a
                        href={project.liveUrl!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[length:var(--fs-micro)] font-medium text-ws-accent hover:underline"
                      >
                        <ExternalLink size={13} aria-hidden="true" />
                        <span>Launch</span>
                      </a>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${project.title}`}
                      className="text-text-overdue hover:bg-tint-overdue-bg"
                      onClick={() => setDeleteTarget(project)}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Edit details for ${project.title}`}
                      onClick={() => openEditEditor(project)}
                    >
                      Edit details
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Unified LargeEditorDialog + Two-Column Layout + Local Drafts */}
      <LargeEditorDialog
        open={editorOpen}
        onClose={closeEditor}
        eyebrow="Eastern strategy ledger"
        title={editingProject ? 'Edit project' : 'New project'}
        description="Update project scope, next meaningful step, blockers, and target schedule."
        formId={PROJECT_EDITOR_DOM_FORM_ID}
        isDirty={isEditorDirty}
        isSubmitting={isSubmitting}
        submitLabel={editingProject ? 'Save changes' : 'Create project'}
        submittingLabel={editingProject ? 'Saving…' : 'Creating…'}
        closeAriaLabel="Close project editor"
        initialFocusRef={editorTitleInputRef}
        errorMessage={editorError}
        draftRecovery={
          loadedDraft
            ? {
                savedAtLabel: formatDraftTimestamp(loadedDraft.savedAt),
                stale: Boolean(
                  editingProject && isEditorDraftStale(loadedDraft, editingProject.updatedAt),
                ),
                staleMessage:
                  'This project was updated after your local draft was saved. Review changes before saving.',
                onResume: () => {
                  setFormValues(loadedDraft.values);
                  setLoadedDraft(null);
                },
                onDiscard: () => {
                  clearEditorDraft(PROJECT_FORM_ID, editingProject?.id ?? null);
                  setLoadedDraft(null);
                  refreshOrphanedDrafts();
                },
              }
            : null
        }
        onSaveDraft={handleSaveDraft}
        footerActions={
          editingProject ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setDeleteTarget(editingProject)}
            >
              Delete project
            </Button>
          ) : null
        }
      >
        <form id={PROJECT_EDITOR_DOM_FORM_ID} noValidate onSubmit={handleEditorSubmit}>
          <LargeEditorTwoColumn
            primary={
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="project-editor-title"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Title
                  </label>
                  <input
                    ref={editorTitleInputRef}
                    id="project-editor-title"
                    type="text"
                    value={formValues.title}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, title: e.target.value }));
                      if (editorError) setEditorError('');
                    }}
                    placeholder="e.g. Go Game AI or Compiler"
                    className={cn(styles.editorControl, styles.editorControlInput)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    id="project-editor-overview-label"
                    htmlFor="project-editor-overview"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Overview
                  </label>
                  <RichNoteEditor
                    id="project-editor-overview"
                    ariaLabel="Overview"
                    value={formValues.overview}
                    onChange={(nextValue) =>
                      setFormValues((prev) => ({ ...prev, overview: nextValue }))
                    }
                    placeholder="What is this project and what outcome does it deliver?"
                    className="max-w-[66ch]"
                    minHeightClassName="min-h-[108px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="project-editor-next-step"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Next meaningful step
                  </label>
                  <input
                    id="project-editor-next-step"
                    type="text"
                    value={formValues.nextStep}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, nextStep: e.target.value }))
                    }
                    placeholder="The next concrete action to move this build forward"
                    className={cn(styles.editorControl, styles.editorControlInput)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="project-editor-blockers"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Current blockers
                  </label>
                  <RichNoteEditor
                    id="project-editor-blockers"
                    ariaLabel="Current blockers"
                    value={formValues.blockers}
                    onChange={(nextValue) =>
                      setFormValues((prev) => ({ ...prev, blockers: nextValue }))
                    }
                    placeholder="Dependencies, unknowns, or constraints currently blocking progress"
                    minHeightClassName="min-h-[84px]"
                  />
                </div>
              </>
            }
            metadata={
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="project-editor-status"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Status
                  </label>
                  <SelectField<ProjectStatus>
                    id="project-editor-status"
                    ariaLabel="Status"
                    value={formValues.status}
                    onChange={(nextStatus) =>
                      setFormValues((prev) => ({
                        ...prev,
                        status: nextStatus,
                      }))
                    }
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'in_progress', label: 'In progress' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'on_hold', label: 'On hold' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="project-editor-progress"
                      className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                    >
                      Progress (%)
                    </label>
                    <input
                      id="project-editor-progress"
                      type="number"
                      min={0}
                      max={100}
                      value={formValues.progressPercent}
                      onChange={(e) => {
                        const parsed = Number(e.target.value);
                        setFormValues((prev) => ({
                          ...prev,
                          progressPercent: Number.isNaN(parsed) ? 0 : parsed,
                        }));
                        if (editorError) setEditorError('');
                      }}
                      className={cn(
                        styles.editorControl,
                        styles.editorControlInput,
                        'tabular-nums',
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="project-editor-deadline"
                      className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                    >
                      Target date
                    </label>
                    <DatePickerField
                      id="project-editor-deadline"
                      mode="iso"
                      ariaLabel="Target date"
                      value={formValues.deadlineDate}
                      onChange={(nextDate) =>
                        setFormValues((prev) => ({ ...prev, deadlineDate: nextDate }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="project-editor-tech-stack"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Tech stack (comma-separated)
                  </label>
                  <input
                    id="project-editor-tech-stack"
                    type="text"
                    value={formValues.techStackText}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, techStackText: e.target.value }))
                    }
                    placeholder="e.g. TypeScript, Next.js, SQLite"
                    className={cn(styles.editorControl, styles.editorControlInput)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="project-editor-repo-url"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Repository URL
                  </label>
                  <input
                    id="project-editor-repo-url"
                    type="text"
                    value={formValues.repoUrl}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, repoUrl: e.target.value }))
                    }
                    placeholder="https://github.com/..."
                    className={cn(styles.editorControl, styles.editorControlInput)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="project-editor-live-url"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Live URL
                  </label>
                  <input
                    id="project-editor-live-url"
                    type="text"
                    value={formValues.liveUrl}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, liveUrl: e.target.value }))
                    }
                    placeholder="https://..."
                    className={cn(styles.editorControl, styles.editorControlInput)}
                  />
                </div>

                <Image
                  src="/visuals/project/jade-knot-talisman.svg"
                  alt=""
                  aria-hidden="true"
                  width={240}
                  height={240}
                  loading="eager"
                  unoptimized
                  className={styles.jadeEditorOrnament}
                />
              </>
            }
          />
        </form>
      </LargeEditorDialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        portal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete project?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” and any saved local draft for it will be permanently removed.`
            : ''
        }
        isSubmitting={deleteMutation.isPending}
      />
    </div>
  );

  if (inheritedTheme) {
    return workspaceContent;
  }

  return <FeatureThemeProvider name="project">{workspaceContent}</FeatureThemeProvider>;
}

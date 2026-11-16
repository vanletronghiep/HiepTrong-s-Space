'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { Calendar, Compass, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  clearEditorDraft,
  isEditorDraftStale,
  listSavedEditDraftRecordIds,
  loadEditorDraft,
  saveEditorDraft,
  type EditorDraftPayload,
} from '@/client/editor-drafts';
import {
  useCreateMilestone,
  useDeleteMilestone,
  useMilestones,
  useToggleLandmark,
  useUpdateMilestone,
} from '@/client/queries/milestones';
import type { MilestoneCategory, MilestoneItem, MilestoneStatus } from '@/contracts/milestone';
import { computeLandmarkProgress } from '@/domain/milestone-domain';
import { DEFAULT_APP_TIMEZONE, formatDisplayDate } from '@/domain/time';
import { Badge, type BadgeTone } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { Chip } from '@/ui/Chip';
import { cn } from '@/ui/cn';
import { ConfirmDialog } from '@/ui/Dialog';
import { EmptyState } from '@/ui/EmptyState';
import { FeatureThemeProvider, useFeatureTheme } from '@/ui/FeatureTheme';
import { DatePickerField } from '@/ui/DatePickerField';
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
  defaultMilestoneEditorValues,
  isMilestoneDraftValues,
  milestoneEditorCreateInput,
  milestoneEditorPatch,
  milestoneEditorValues,
  sameMilestoneEditorValues,
  type MilestoneEditorValues,
} from './milestone-editor';
import styles from './milestones.module.css';

const MILESTONE_FORM_ID = 'milestone';
const MILESTONE_EDITOR_DOM_FORM_ID = 'milestone-large-editor-form';

const STATUS_META: Record<MilestoneStatus, { label: string; tone: BadgeTone }> = {
  planned: { label: 'Planned', tone: 'normal' },
  in_progress: { label: 'In progress', tone: 'general' },
  achieved: { label: 'Achieved', tone: 'completed' },
};

const CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  personal: 'Personal',
  academic: 'Academic',
  career: 'Career',
  project: 'Project',
};

const STATUS_FILTERS: readonly { key: 'all' | MilestoneStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'planned', label: 'Planned' },
  { key: 'achieved', label: 'Achieved' },
];

const CATEGORY_FILTERS: readonly { key: 'all' | MilestoneCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'personal', label: 'Personal' },
  { key: 'academic', label: 'Academic' },
  { key: 'career', label: 'Career' },
  { key: 'project', label: 'Project' },
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

function formatTargetDate(targetDate: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return formatDisplayDate(`${targetDate}T12:00:00+07:00`, new Date(), DEFAULT_APP_TIMEZONE);
  }
  const parsed = Date.parse(targetDate);
  if (Number.isNaN(parsed)) {
    return targetDate;
  }
  return formatDisplayDate(new Date(parsed), new Date(), DEFAULT_APP_TIMEZONE);
}

export function MilestonesView() {
  const inheritedTheme = useFeatureTheme();
  const { data: milestones = [], isLoading, isError: loadFailed, refetch } = useMilestones();
  const createMutation = useCreateMilestone();
  const updateMutation = useUpdateMilestone();
  const toggleMutation = useToggleLandmark();
  const deleteMutation = useDeleteMilestone();

  const savingRef = useRef(false);
  const editorTitleInputRef = useRef<HTMLInputElement>(null);
  const editorTimeframeInputRef = useRef<HTMLInputElement>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | MilestoneStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MilestoneCategory>('all');
  const [actionError, setActionError] = useState('');
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [pendingLandmarkKey, setPendingLandmarkKey] = useState<string | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MilestoneItem | null>(null);

  // Unified LargeEditorDialog + explicit local drafts state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneItem | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<MilestoneEditorValues>(() =>
    defaultMilestoneEditorValues(),
  );
  const [formValues, setFormValues] = useState<MilestoneEditorValues>(() =>
    defaultMilestoneEditorValues(),
  );
  const [editorError, setEditorError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedDraft, setLoadedDraft] = useState<EditorDraftPayload<MilestoneEditorValues> | null>(
    null,
  );
  const [draftSyncVersion, setDraftSyncVersion] = useState(0);

  useItemAnchor(milestones);

  const refreshOrphanedDrafts = useCallback(() => {
    setDraftSyncVersion((v) => v + 1);
  }, []);

  const orphanedDraftIds = useMemo(() => {
    void draftSyncVersion;
    if (isLoading || loadFailed) {
      return [];
    }
    const ids = listSavedEditDraftRecordIds(MILESTONE_FORM_ID);
    return ids.filter((id) => !milestones.some((milestone) => milestone.id === id));
  }, [draftSyncVersion, isLoading, loadFailed, milestones]);

  const totalLandmarks = useMemo(
    () => milestones.reduce((sum, m) => sum + (m.landmarks?.length || 0), 0),
    [milestones],
  );
  const completedLandmarks = useMemo(
    () =>
      milestones.reduce((sum, m) => sum + (m.landmarks?.filter((l) => l.completed).length || 0), 0),
    [milestones],
  );
  const completionRate =
    totalLandmarks > 0 ? Math.round((completedLandmarks / totalLandmarks) * 100) : 0;

  const filteredMilestones = useMemo(
    () =>
      milestones.filter((milestone) => {
        if (statusFilter !== 'all' && milestone.status !== statusFilter) {
          return false;
        }
        if (categoryFilter !== 'all' && milestone.category !== categoryFilter) {
          return false;
        }
        return true;
      }),
    [categoryFilter, milestones, statusFilter],
  );

  const isEditorDirty = editorOpen && !sameMilestoneEditorValues(initialFormValues, formValues);

  const openCreateEditor = () => {
    const base = defaultMilestoneEditorValues();
    const existing = loadEditorDraft<MilestoneEditorValues>(
      MILESTONE_FORM_ID,
      null,
      isMilestoneDraftValues,
    );
    setEditingMilestone(null);
    setInitialFormValues(base);
    setFormValues(base);
    setEditorError('');
    setLoadedDraft(existing.ok ? existing.draft : null);
    setEditorOpen(true);
  };

  const openEditEditor = (milestone: MilestoneItem) => {
    const base = milestoneEditorValues(milestone);
    const existing = loadEditorDraft<MilestoneEditorValues>(
      MILESTONE_FORM_ID,
      milestone.id,
      isMilestoneDraftValues,
    );
    setEditingMilestone(milestone);
    setInitialFormValues(base);
    setFormValues(base);
    setEditorError('');
    setLoadedDraft(existing.ok ? existing.draft : null);
    setEditorOpen(true);
  };

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingMilestone(null);
    setEditorError('');
    setLoadedDraft(null);
  }, []);

  const handleSaveDraft = (): DraftSaveOutcome => {
    const result = saveEditorDraft({
      formId: MILESTONE_FORM_ID,
      recordId: editingMilestone?.id ?? null,
      recordUpdatedAt: editingMilestone?.updatedAt ?? null,
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
      setEditorError('Enter an ambition title.');
      editorTitleInputRef.current?.focus();
      return;
    }
    if (trimmedTitle.length > 200) {
      setEditorError('Ambition title must be 200 characters or fewer.');
      editorTitleInputRef.current?.focus();
      return;
    }
    if (!formValues.meaning.trim()) {
      setEditorError('Describe why this ambition is meaningful.');
      document.getElementById('milestone-editor-meaning')?.focus();
      return;
    }
    if (!formValues.timeframe.trim()) {
      setEditorError('Enter a timeframe for this milestone.');
      editorTimeframeInputRef.current?.focus();
      return;
    }

    savingRef.current = true;
    setIsSubmitting(true);
    setEditorError('');
    setActionError('');

    try {
      if (editingMilestone) {
        const patch = milestoneEditorPatch(editingMilestone, formValues);
        await updateMutation.mutateAsync({
          id: editingMilestone.id,
          patch,
        });
        clearEditorDraft(MILESTONE_FORM_ID, editingMilestone.id);
      } else {
        await createMutation.mutateAsync(milestoneEditorCreateInput(formValues));
        clearEditorDraft(MILESTONE_FORM_ID, null);
      }
      refreshOrphanedDrafts();
      closeEditor();
    } catch (error) {
      setEditorError(
        error instanceof Error
          ? error.message
          : 'Could not save this milestone. Your input is retained.',
      );
    } finally {
      savingRef.current = false;
      setIsSubmitting(false);
    }
  }, [
    closeEditor,
    createMutation,
    editingMilestone,
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

  const clearCardError = (milestoneId: string) => {
    setCardErrors((prev) => {
      if (!(milestoneId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[milestoneId];
      return next;
    });
  };

  const handleToggleLandmark = (milestoneId: string, landmarkId: string) => {
    const key = `${milestoneId}:${landmarkId}`;
    if (pendingLandmarkKey === key) {
      return;
    }
    clearCardError(milestoneId);
    setPendingLandmarkKey(key);
    toggleMutation.mutate(
      { milestoneId, landmarkId },
      {
        onError: (error) => {
          setCardErrors((prev) => ({
            ...prev,
            [milestoneId]:
              error instanceof Error
                ? error.message
                : 'Could not update landmark right now. Retry when ready.',
          }));
        },
        onSettled: () => {
          setPendingLandmarkKey((current) => (current === key ? null : current));
        },
      },
    );
  };

  const handleQuickStatusChange = (milestone: MilestoneItem, nextStatus: MilestoneStatus) => {
    if (nextStatus === milestone.status || pendingStatusId === milestone.id) {
      return;
    }
    clearCardError(milestone.id);
    setPendingStatusId(milestone.id);
    updateMutation.mutate(
      {
        id: milestone.id,
        patch: { status: nextStatus },
      },
      {
        onError: (error) => {
          setCardErrors((prev) => ({
            ...prev,
            [milestone.id]:
              error instanceof Error
                ? error.message
                : 'Could not update milestone status right now. Retry when ready.',
          }));
        },
        onSettled: () => {
          setPendingStatusId((current) => (current === milestone.id ? null : current));
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
        clearEditorDraft(MILESTONE_FORM_ID, targetId);
        clearCardError(targetId);
        refreshOrphanedDrafts();
        setDeleteTarget(null);
        if (editingMilestone?.id === targetId) {
          closeEditor();
        }
      },
      onError: (error) => {
        setActionError(
          error instanceof Error
            ? error.message
            : 'Could not delete this milestone right now. Retry when ready.',
        );
        setDeleteTarget(null);
      },
    });
  };

  const handleDiscardOrphanedDrafts = () => {
    for (const orphanId of orphanedDraftIds) {
      clearEditorDraft(MILESTONE_FORM_ID, orphanId);
    }
    refreshOrphanedDrafts();
  };

  const addLandmarkRow = () => {
    setFormValues((prev) => ({
      ...prev,
      landmarks: [
        ...prev.landmarks,
        {
          id: crypto.randomUUID(),
          title: '',
          completed: false,
          completedAt: null,
        },
      ],
    }));
  };

  const updateLandmarkRowTitle = (landmarkId: string, title: string) => {
    setFormValues((prev) => ({
      ...prev,
      landmarks: prev.landmarks.map((item) => (item.id === landmarkId ? { ...item, title } : item)),
    }));
  };

  const removeLandmarkRow = (landmarkId: string) => {
    setFormValues((prev) => ({
      ...prev,
      landmarks: prev.landmarks.filter((item) => item.id !== landmarkId),
    }));
  };

  const workspaceContent = (
    <div
      data-feature-theme={inheritedTheme ? undefined : 'annual-milestones'}
      className={styles.pageStack}
    >
      <Image
        src="/visuals/annual-milestones/victory-pennant-edge.svg"
        alt=""
        aria-hidden="true"
        width={200}
        height={480}
        loading="eager"
        unoptimized
        className={styles.pennantMarginDecor}
      />

      {/* Yearbook of Ambitions Masthead */}
      <header className={styles.masthead} aria-labelledby="milestones-page-heading">
        <Image
          src="/visuals/annual-milestones/hall-of-golden-years.svg"
          alt=""
          aria-hidden="true"
          width={480}
          height={300}
          loading="eager"
          unoptimized
          className={styles.mastheadHallArt}
        />

        <div className={styles.mastheadText}>
          <div className={styles.eyebrow}>
            <Compass size={15} strokeWidth={1.6} aria-hidden="true" />
            <span>Yearbook of ambitions</span>
          </div>
          <h1 id="milestones-page-heading" className={styles.displayTitle}>
            Annual Milestones
          </h1>
          <p className={styles.mastheadSubtitle}>
            Record long-horizon ambitions, track decisive landmarks, and capture quiet reflections
            across each year.
          </p>
        </div>

        <div className={styles.mastheadActions}>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} aria-hidden="true" />}
            onClick={openCreateEditor}
          >
            New milestone
          </Button>
        </div>
      </header>

      {loadFailed ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-tint-overdue-border bg-tint-overdue-bg px-4 py-3 text-[length:var(--fs-ui)] text-text-overdue"
        >
          <span>Could not load your milestones right now. Check connection or retry.</span>
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
              ? '1 saved local edit draft refers to a milestone that is no longer in your yearbook.'
              : `${orphanedDraftIds.length} saved local edit drafts refer to milestones no longer in your yearbook.`}
          </span>
          <Button variant="secondary" size="sm" onClick={handleDiscardOrphanedDrafts}>
            Discard missing drafts
          </Button>
        </div>
      ) : null}

      {/* Stationary 3-Card Trajectory Strip */}
      <section className={styles.statsGrid} aria-label="Yearbook trajectory">
        <div className={styles.statCard}>
          <span className={styles.statValue}>{milestones.length}</span>
          <span className={styles.statLabel}>Core ambitions</span>
        </div>
        <div className={styles.statCard}>
          <span className={cn(styles.statValue, styles.statValueCompleted)}>
            {completedLandmarks} / {totalLandmarks}
          </span>
          <span className={styles.statLabel}>Landmarks reached</span>
        </div>
        <div className={styles.statCard}>
          <span className={cn(styles.statValue, styles.statValueAccent)}>{completionRate}%</span>
          <span className={styles.statLabel}>Trajectory completed</span>
        </div>
      </section>

      {/* Filter & Chapter Controls */}
      <div className={styles.controlsBar}>
        <div className={styles.filterRow}>
          <div className={styles.filterCluster}>
            <div className={styles.filterGroup} role="group" aria-label="Status filter">
              <span className={styles.filterGroupLabel}>Status</span>
              {STATUS_FILTERS.map((option) => (
                <Chip
                  key={option.key}
                  active={statusFilter === option.key}
                  onClick={() => setStatusFilter(option.key)}
                  className={styles.filterChip}
                >
                  {option.label}
                </Chip>
              ))}
            </div>

            <div className={styles.filterGroup} role="group" aria-label="Category filter">
              <span className={styles.filterGroupLabel}>Category</span>
              {CATEGORY_FILTERS.map((option) => (
                <Chip
                  key={option.key}
                  active={categoryFilter === option.key}
                  onClick={() => setCategoryFilter(option.key)}
                  className={styles.filterChip}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </div>

          <span className="text-[length:var(--fs-small)] text-ws-text-muted tabular-nums">
            Showing {filteredMilestones.length} of {milestones.length}
          </span>
        </div>
      </div>

      {/* Milestone Folios / Loading / Empty */}
      {isLoading && milestones.length === 0 ? (
        <div className={styles.milestonesList} aria-label="Loading milestones">
          <Skeleton className="h-56 w-full rounded-card" />
          <Skeleton className="h-56 w-full rounded-card" />
        </div>
      ) : filteredMilestones.length === 0 ? (
        <div className={styles.emptyContainer}>
          <EmptyState
            title={
              loadFailed
                ? 'Milestones unavailable right now.'
                : milestones.length === 0
                  ? 'No milestones recorded yet.'
                  : 'No milestones match the active filters.'
            }
            description={
              loadFailed
                ? 'Retry loading above once your connection is restored.'
                : milestones.length === 0
                  ? 'Set a long-horizon ambition with meaningful landmarks to begin your yearbook.'
                  : 'Try another status or category chapter to view all ambitions.'
            }
            action={
              loadFailed ? (
                <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                  Retry
                </Button>
              ) : milestones.length === 0 ? (
                <Button variant="primary" size="sm" onClick={openCreateEditor}>
                  New milestone
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                >
                  Show all milestones
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className={styles.milestonesList}>
          {filteredMilestones.map((milestone) => {
            const progress = computeLandmarkProgress(milestone);
            const statusMeta = STATUS_META[milestone.status];
            const cardError = cardErrors[milestone.id];
            const completedCount = milestone.landmarks.filter((l) => l.completed).length;

            return (
              <article
                id={`item-${milestone.id}`}
                tabIndex={-1}
                key={milestone.id}
                data-achieved={milestone.status === 'achieved'}
                className={styles.milestoneCard}
              >
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardHeaderMain}>
                    <div className={styles.cardMetaLine}>
                      <span className={styles.timeframeBadge}>
                        <Calendar size={12} aria-hidden="true" />
                        <span>{milestone.timeframe}</span>
                      </span>
                      <span className={styles.categoryLabel}>
                        {CATEGORY_LABELS[milestone.category]}
                      </span>
                      {milestone.targetDate ? (
                        <span className={styles.targetDateLabel}>
                          Target {formatTargetDate(milestone.targetDate)}
                        </span>
                      ) : null}
                    </div>
                    <h2 className={styles.cardTitle}>{milestone.title}</h2>
                  </div>

                  <div className={styles.cardHeaderAside}>
                    <Badge tone={statusMeta.tone} withDot>
                      {statusMeta.label}
                    </Badge>
                    <span className={styles.progressReadout}>{progress}%</span>
                  </div>
                </div>

                {milestone.meaning ? (
                  <div className={styles.cardMeaning}>
                    <FormattedNoteContent value={milestone.meaning} />
                  </div>
                ) : null}

                {milestone.reflection ? (
                  <div className={styles.reflectionBox}>
                    <span className={styles.reflectionLabel}>Progress reflection</span>
                    <FormattedNoteContent
                      value={milestone.reflection}
                      className={styles.reflectionText}
                    />
                  </div>
                ) : null}

                {milestone.landmarks.length > 0 ? (
                  <div className={styles.landmarksSection}>
                    <div className={styles.landmarksHeader}>
                      <span>Landmarks toward this ambition</span>
                      <span className={styles.landmarksCount}>
                        {completedCount} of {milestone.landmarks.length} reached
                      </span>
                    </div>

                    <div className={styles.landmarksList}>
                      {milestone.landmarks.map((landmark) => {
                        const isLandmarkPending =
                          pendingLandmarkKey === `${milestone.id}:${landmark.id}`;
                        return (
                          <div key={landmark.id} className={styles.landmarkRow}>
                            <div className={styles.landmarkCheckboxTouch}>
                              <Checkbox
                                checked={landmark.completed}
                                disabled={isLandmarkPending}
                                aria-label={`Toggle landmark: ${landmark.title}`}
                                onCheckedChange={() =>
                                  handleToggleLandmark(milestone.id, landmark.id)
                                }
                              />
                            </div>
                            <span
                              className={cn(
                                styles.landmarkTitle,
                                landmark.completed && styles.landmarkTitleDone,
                              )}
                            >
                              {landmark.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {cardError ? (
                  <p
                    role="alert"
                    className="rounded-item border border-tint-overdue-border bg-tint-overdue-bg px-3.5 py-2 text-[length:var(--fs-small)] text-text-overdue"
                  >
                    {cardError}
                  </p>
                ) : null}

                <div className={styles.cardFooter}>
                  <div className={styles.statusControlGroup}>
                    <label
                      htmlFor={`milestone-status-${milestone.id}`}
                      className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted"
                    >
                      Status
                    </label>
                    <SelectField<MilestoneStatus>
                      id={`milestone-status-${milestone.id}`}
                      ariaLabel={`Update status for ${milestone.title}`}
                      size="sm"
                      value={milestone.status}
                      disabled={pendingStatusId === milestone.id}
                      onChange={(nextStatus) => handleQuickStatusChange(milestone, nextStatus)}
                      options={[
                        { value: 'planned', label: 'Planned' },
                        { value: 'in_progress', label: 'In progress' },
                        { value: 'achieved', label: 'Achieved' },
                      ]}
                      triggerClassName={styles.statusSelect}
                    />
                  </div>

                  <div className={styles.cardActionButtons}>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${milestone.title}`}
                      className="text-text-overdue hover:bg-tint-overdue-bg"
                      onClick={() => setDeleteTarget(milestone)}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Edit ${milestone.title}`}
                      onClick={() => openEditEditor(milestone)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Section Divider */}
      <div className={styles.streamerDividerWrap} aria-hidden="true">
        <Image
          src="/visuals/annual-milestones/celebration-streamer.svg"
          alt=""
          aria-hidden="true"
          width={720}
          height={100}
          loading="eager"
          unoptimized
          className={styles.streamerDivider}
        />
      </div>

      {/* Quiet Yearbook Colophon */}
      <footer className={styles.colophonFooter}>
        <p className={styles.colophonText}>
          Each year adds a chapter: steady landmarks turn long-horizon ambitions into lived history.
        </p>
        <Image
          src="/visuals/annual-milestones/honor-ribbon.svg"
          alt=""
          aria-hidden="true"
          width={240}
          height={240}
          loading="eager"
          unoptimized
          className={styles.colophonRibbon}
        />
      </footer>

      {/* Unified LargeEditorDialog + Two-Column Layout + Local Drafts */}
      <LargeEditorDialog
        open={editorOpen}
        onClose={closeEditor}
        eyebrow="Yearbook of ambitions"
        title={editingMilestone ? 'Edit milestone' : 'New milestone'}
        description="Define the ambition, why it matters, its landmarks, and target horizon."
        formId={MILESTONE_EDITOR_DOM_FORM_ID}
        isDirty={isEditorDirty}
        isSubmitting={isSubmitting}
        submitLabel={editingMilestone ? 'Save changes' : 'Create milestone'}
        submittingLabel={editingMilestone ? 'Saving…' : 'Creating…'}
        closeAriaLabel="Close milestone editor"
        initialFocusRef={editorTitleInputRef}
        errorMessage={editorError}
        draftRecovery={
          loadedDraft
            ? {
                savedAtLabel: formatDraftTimestamp(loadedDraft.savedAt),
                stale: Boolean(
                  editingMilestone && isEditorDraftStale(loadedDraft, editingMilestone.updatedAt),
                ),
                staleMessage:
                  'This milestone was updated after your local draft was saved. Review changes before saving.',
                onResume: () => {
                  setFormValues(loadedDraft.values);
                  setLoadedDraft(null);
                },
                onDiscard: () => {
                  clearEditorDraft(MILESTONE_FORM_ID, editingMilestone?.id ?? null);
                  setLoadedDraft(null);
                  refreshOrphanedDrafts();
                },
              }
            : null
        }
        onSaveDraft={handleSaveDraft}
        footerActions={
          editingMilestone ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setDeleteTarget(editingMilestone)}
            >
              Delete milestone
            </Button>
          ) : null
        }
      >
        <form id={MILESTONE_EDITOR_DOM_FORM_ID} noValidate onSubmit={handleEditorSubmit}>
          <LargeEditorTwoColumn
            primary={
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="milestone-editor-title"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Ambition title
                  </label>
                  <input
                    ref={editorTitleInputRef}
                    id="milestone-editor-title"
                    type="text"
                    value={formValues.title}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, title: e.target.value }));
                      if (editorError) setEditorError('');
                    }}
                    placeholder="e.g. Master Machine Learning Foundations"
                    className={cn(styles.editorControl, styles.editorControlInput)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="milestone-editor-meaning"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Meaning &amp; significance
                  </label>
                  <RichNoteEditor
                    id="milestone-editor-meaning"
                    ariaLabel="Meaning & significance"
                    value={formValues.meaning}
                    onChange={(nextValue) => {
                      setFormValues((prev) => ({ ...prev, meaning: nextValue }));
                      if (editorError) setEditorError('');
                    }}
                    placeholder="Why is this meaningful to you and your long-term journey?"
                    className="max-w-[66ch]"
                    minHeightClassName="min-h-[84px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="milestone-editor-reflection"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Progress reflection
                  </label>
                  <RichNoteEditor
                    id="milestone-editor-reflection"
                    ariaLabel="Progress reflection"
                    value={formValues.reflection}
                    onChange={(nextValue) =>
                      setFormValues((prev) => ({ ...prev, reflection: nextValue }))
                    }
                    placeholder="Where do things stand right now?"
                    className="max-w-[66ch]"
                    minHeightClassName="min-h-[96px]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[length:var(--fs-small)] font-medium text-ws-text">
                      Landmarks
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Plus size={14} aria-hidden="true" />}
                      onClick={addLandmarkRow}
                    >
                      Add landmark
                    </Button>
                  </div>

                  {formValues.landmarks.length === 0 ? (
                    <p className="text-[length:var(--fs-small)] text-ws-text-muted">
                      No landmarks added yet. Add concrete steps that mark progress toward this
                      ambition.
                    </p>
                  ) : (
                    <div className={styles.editorLandmarkList}>
                      {formValues.landmarks.map((landmark, index) => (
                        <div key={landmark.id} className={styles.editorLandmarkRow}>
                          <input
                            type="text"
                            aria-label={`Landmark ${index + 1} title`}
                            value={landmark.title}
                            onChange={(e) => updateLandmarkRowTitle(landmark.id, e.target.value)}
                            placeholder={`Landmark ${index + 1}`}
                            className={cn(
                              styles.editorControl,
                              styles.editorControlInput,
                              styles.editorLandmarkInput,
                            )}
                          />
                          {landmark.completed ? <Badge tone="completed">Reached</Badge> : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Remove landmark ${landmark.title || index + 1}`}
                            leftIcon={<Trash2 size={14} aria-hidden="true" />}
                            onClick={() => removeLandmarkRow(landmark.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            }
            metadata={
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="milestone-editor-timeframe"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Timeframe
                  </label>
                  <input
                    ref={editorTimeframeInputRef}
                    id="milestone-editor-timeframe"
                    type="text"
                    value={formValues.timeframe}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, timeframe: e.target.value }));
                      if (editorError) setEditorError('');
                    }}
                    placeholder="e.g. Year I (2026–2027)"
                    className={cn(styles.editorControl, styles.editorControlInput)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="milestone-editor-target-date"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Target date
                  </label>
                  <DatePickerField
                    id="milestone-editor-target-date"
                    mode="iso"
                    ariaLabel="Target date"
                    value={formValues.targetDate}
                    onChange={(nextDate) =>
                      setFormValues((prev) => ({ ...prev, targetDate: nextDate }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="milestone-editor-category"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Category
                  </label>
                  <SelectField<MilestoneCategory>
                    id="milestone-editor-category"
                    ariaLabel="Category"
                    value={formValues.category}
                    onChange={(nextCategory) =>
                      setFormValues((prev) => ({
                        ...prev,
                        category: nextCategory,
                      }))
                    }
                    options={[
                      { value: 'personal', label: 'Personal' },
                      { value: 'academic', label: 'Academic' },
                      { value: 'career', label: 'Career' },
                      { value: 'project', label: 'Project' },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="milestone-editor-status"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Status
                  </label>
                  <SelectField<MilestoneStatus>
                    id="milestone-editor-status"
                    ariaLabel="Status"
                    value={formValues.status}
                    onChange={(nextStatus) =>
                      setFormValues((prev) => ({
                        ...prev,
                        status: nextStatus,
                      }))
                    }
                    options={[
                      { value: 'planned', label: 'Planned' },
                      { value: 'in_progress', label: 'In progress' },
                      { value: 'achieved', label: 'Achieved' },
                    ]}
                  />
                </div>
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
        title="Delete milestone?"
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

  return <FeatureThemeProvider name="annual-milestones">{workspaceContent}</FeatureThemeProvider>;
}

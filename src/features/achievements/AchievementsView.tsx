'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { Award, Bell, Plus, RotateCcw } from 'lucide-react';
import {
  clearEditorDraft,
  isEditorDraftStale,
  listSavedEditDraftRecordIds,
  loadEditorDraft,
  saveEditorDraft,
  type EditorDraftPayload,
} from '@/client/editor-drafts';
import {
  useAchievements,
  useCreateAchievement,
  useDeleteAchievement,
  useUpdateAchievement,
} from '@/client/queries/achievements';
import type { AchievementEra, AchievementItem } from '@/contracts/achievement';
import { DEFAULT_APP_TIMEZONE } from '@/domain/time';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { cn } from '@/ui/cn';
import { ConfirmDialog } from '@/ui/Dialog';
import { EmptyState } from '@/ui/EmptyState';
import { FeatureThemeProvider, useFeatureTheme } from '@/ui/FeatureTheme';
import {
  LargeEditorDialog,
  LargeEditorTwoColumn,
  type DraftSaveOutcome,
} from '@/ui/LargeEditorDialog';
import { Skeleton } from '@/ui/Skeleton';
import { useItemAnchor } from '@/ui/use-item-anchor';
import {
  achievementEditorCreateInput,
  achievementEditorPatch,
  achievementEditorValues,
  defaultAchievementEditorValues,
  isAchievementDraftValues,
  sameAchievementValues,
  type AchievementEditorValues,
} from './achievement-editor';
import styles from './achievements.module.css';

const ACHIEVEMENT_FORM_ID = 'achievement';
const ACHIEVEMENT_EDITOR_DOM_FORM_ID = 'achievement-large-editor-form';

const ERAS: readonly { label: string; value: AchievementEra | 'all' }[] = [
  { label: 'All eras', value: 'all' },
  { label: 'University', value: 'university' },
  { label: 'High school', value: 'high_school' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Elementary', value: 'elementary' },
  { label: 'Upcoming contests', value: 'future_contest' },
];

const ERA_LABELS: Record<AchievementEra, string> = {
  elementary: 'Elementary',
  secondary: 'Secondary',
  high_school: 'High school',
  university: 'University',
  future_contest: 'Upcoming contest',
};

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

function formatFutureContestDate(futureDate: string | null): string | null {
  if (!futureDate) {
    return null;
  }
  const ms = /^\d{4}-\d{2}-\d{2}$/.test(futureDate)
    ? Date.parse(`${futureDate}T12:00:00+07:00`)
    : Date.parse(futureDate);
  if (Number.isNaN(ms)) {
    return futureDate;
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DEFAULT_APP_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ms));
}

export function AchievementsView() {
  const inheritedTheme = useFeatureTheme();
  const writeLocks = useRef(new Set<string>());
  const savingRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);

  const [selectedEra, setSelectedEra] = useState<AchievementEra | 'all'>('all');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [actionError, setActionError] = useState('');
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [pendingFeaturedId, setPendingFeaturedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AchievementItem | null>(null);

  // LargeEditorDialog + explicit local drafts state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AchievementItem | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<AchievementEditorValues>(() =>
    defaultAchievementEditorValues(),
  );
  const [formValues, setFormValues] = useState<AchievementEditorValues>(() =>
    defaultAchievementEditorValues(),
  );
  const [editorError, setEditorError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedDraft, setLoadedDraft] =
    useState<EditorDraftPayload<AchievementEditorValues> | null>(null);
  const [draftSyncVersion, setDraftSyncVersion] = useState(0);

  // Queries & Mutations
  const {
    data: achievements = [],
    isLoading,
    isError: loadFailed,
    refetch,
  } = useAchievements(selectedEra !== 'all' ? selectedEra : undefined);
  const createAchievement = useCreateAchievement();
  const updateAchievement = useUpdateAchievement();
  const deleteAchievement = useDeleteAchievement();

  // Focus anchor
  useItemAnchor(achievements);

  const refreshOrphanedDrafts = useCallback(() => {
    setDraftSyncVersion((v) => v + 1);
  }, []);

  const orphanedDraftIds = useMemo(() => {
    void draftSyncVersion;
    if (isLoading || loadFailed || selectedEra !== 'all') {
      return [];
    }
    const ids = listSavedEditDraftRecordIds(ACHIEVEMENT_FORM_ID);
    return ids.filter((id) => !achievements.some((item) => item.id === id));
  }, [achievements, draftSyncVersion, isLoading, loadFailed, selectedEra]);

  const featuredCount = useMemo(
    () => achievements.filter((item) => item.featured).length,
    [achievements],
  );
  const lessonsCount = useMemo(
    () => achievements.filter((item) => item.lessonsLearned.trim().length > 0).length,
    [achievements],
  );
  const upcomingCount = useMemo(
    () => achievements.filter((item) => item.era === 'future_contest').length,
    [achievements],
  );

  const isEditorDirty = editorOpen && !sameAchievementValues(initialFormValues, formValues);

  const openCreateEditor = () => {
    const base = defaultAchievementEditorValues();
    const existing = loadEditorDraft<AchievementEditorValues>(
      ACHIEVEMENT_FORM_ID,
      null,
      isAchievementDraftValues,
    );
    setEditingRecord(null);
    setInitialFormValues(base);
    setFormValues(base);
    setEditorError('');
    setLoadedDraft(existing.ok ? existing.draft : null);
    setEditorOpen(true);
  };

  const openEditEditor = (item: AchievementItem) => {
    const base = achievementEditorValues(item);
    const existing = loadEditorDraft<AchievementEditorValues>(
      ACHIEVEMENT_FORM_ID,
      item.id,
      isAchievementDraftValues,
    );
    setEditingRecord(item);
    setInitialFormValues(base);
    setFormValues(base);
    setEditorError('');
    setLoadedDraft(existing.ok ? existing.draft : null);
    setEditorOpen(true);
  };

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingRecord(null);
    setEditorError('');
    setLoadedDraft(null);
  }, []);

  const handleSaveDraft = (): DraftSaveOutcome => {
    const result = saveEditorDraft({
      formId: ACHIEVEMENT_FORM_ID,
      recordId: editingRecord?.id ?? null,
      recordUpdatedAt: null,
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
    if (!formValues.title.trim()) {
      setEditorError('Enter an achievement or contest title.');
      titleInputRef.current?.focus();
      return;
    }
    if (!formValues.year.trim()) {
      setEditorError('Enter a year or period for this record.');
      yearInputRef.current?.focus();
      return;
    }

    savingRef.current = true;
    setIsSubmitting(true);
    setEditorError('');
    setActionError('');

    try {
      if (editingRecord) {
        const patch = achievementEditorPatch(editingRecord, formValues);
        await updateAchievement.mutateAsync({
          id: editingRecord.id,
          patch,
        });
        clearEditorDraft(ACHIEVEMENT_FORM_ID, editingRecord.id);
      } else {
        await createAchievement.mutateAsync(achievementEditorCreateInput(formValues));
        clearEditorDraft(ACHIEVEMENT_FORM_ID, null);
      }
      refreshOrphanedDrafts();
      closeEditor();
    } catch (error) {
      setEditorError(
        error instanceof Error
          ? error.message
          : 'Could not save this record. Your input is retained.',
      );
    } finally {
      savingRef.current = false;
      setIsSubmitting(false);
    }
  }, [
    closeEditor,
    createAchievement,
    editingRecord,
    formValues,
    refreshOrphanedDrafts,
    updateAchievement,
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

  const clearCardError = (recordId: string) => {
    setCardErrors((prev) => {
      if (!(recordId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[recordId];
      return next;
    });
  };

  const handleToggleFeatured = async (item: AchievementItem) => {
    const lockKey = `featured:${item.id}`;
    if (writeLocks.current.has(lockKey) || pendingFeaturedId === item.id) {
      return;
    }
    writeLocks.current.add(lockKey);
    clearCardError(item.id);
    setPendingFeaturedId(item.id);
    try {
      await updateAchievement.mutateAsync({
        id: item.id,
        patch: { featured: !item.featured },
      });
    } catch (error) {
      setCardErrors((prev) => ({
        ...prev,
        [item.id]:
          error instanceof Error
            ? error.message
            : 'Could not update featured state right now. Retry when ready.',
      }));
    } finally {
      writeLocks.current.delete(lockKey);
      setPendingFeaturedId((current) => (current === item.id ? null : current));
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget || deleteAchievement.isPending) {
      return;
    }
    const targetId = deleteTarget.id;
    const lockKey = `delete:${targetId}`;
    if (writeLocks.current.has(lockKey)) {
      return;
    }
    writeLocks.current.add(lockKey);
    setActionError('');
    deleteAchievement.mutate(targetId, {
      onSuccess: () => {
        clearEditorDraft(ACHIEVEMENT_FORM_ID, targetId);
        clearCardError(targetId);
        refreshOrphanedDrafts();
        setDeleteTarget(null);
        if (editingRecord?.id === targetId) {
          closeEditor();
        }
      },
      onError: (error) => {
        setActionError(
          error instanceof Error
            ? error.message
            : 'Could not delete this record right now. Retry when ready.',
        );
        setDeleteTarget(null);
      },
      onSettled: () => {
        writeLocks.current.delete(lockKey);
      },
    });
  };

  const handleDiscardOrphanedDrafts = () => {
    for (const orphanId of orphanedDraftIds) {
      clearEditorDraft(ACHIEVEMENT_FORM_ID, orphanId);
    }
    refreshOrphanedDrafts();
  };

  const workspaceContent = (
    <div
      data-feature-theme={inheritedTheme ? undefined : 'personal-achievements'}
      className={styles.pageStack}
    >
      <Image
        src="/visuals/personal-achievements/acanthus-column-edge.svg"
        alt=""
        aria-hidden="true"
        width={200}
        height={480}
        loading="eager"
        unoptimized
        className={styles.columnMarginDecor}
      />

      {/* Roman Marble Gallery Masthead */}
      <header
        className={styles.masthead}
        data-feature-heading
        aria-labelledby="achievements-page-heading"
      >
        <Image
          src="/visuals/personal-achievements/marble-arcade.svg"
          alt=""
          aria-hidden="true"
          width={480}
          height={300}
          loading="eager"
          unoptimized
          className={styles.mastheadArcadeArt}
        />

        <div className={styles.mastheadText}>
          <div className={styles.eyebrow}>
            <Award size={15} strokeWidth={1.5} aria-hidden="true" />
            <span>Personal portfolio &amp; contest archive</span>
          </div>

          <h1 id="achievements-page-heading" className={styles.displayTitle}>
            Personal Achievements
          </h1>
          <p className={styles.mastheadSubtitle}>
            A retrospective gallery of competitions, academic milestones, and enduring lessons
            learned from elementary school through university and upcoming collegiate contests.
          </p>
        </div>
      </header>

      {loadFailed ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-tint-overdue-border bg-tint-overdue-bg px-4 py-3 text-[length:var(--fs-ui)] text-text-overdue"
        >
          <span>
            Could not load your achievements gallery right now. Check connection or retry.
          </span>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} strokeWidth={1.5} aria-hidden="true" />}
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
              ? '1 saved local edit draft refers to a record that is no longer in your gallery.'
              : `${orphanedDraftIds.length} saved local edit drafts refer to records no longer in your gallery.`}
          </span>
          <Button variant="secondary" size="sm" onClick={handleDiscardOrphanedDrafts}>
            Discard missing drafts
          </Button>
        </div>
      ) : null}

      {/* Stationary Summary Strip */}
      <section className={styles.statsGrid} aria-label="Gallery summary">
        <div className={styles.statCard}>
          <span className={styles.statValue}>{achievements.length}</span>
          <span className={styles.statLabel}>Total records</span>
        </div>
        <div className={styles.statCard}>
          <span className={cn(styles.statValue, styles.statValueAccent)}>{featuredCount}</span>
          <span className={styles.statLabel}>Featured plaques</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{lessonsCount}</span>
          <span className={styles.statLabel}>Lessons recorded</span>
        </div>
        <div className={styles.statCard}>
          <span className={cn(styles.statValue, styles.statValueAccent)}>{upcomingCount}</span>
          <span className={styles.statLabel}>Upcoming contests</span>
        </div>
      </section>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.filterChips} role="radiogroup" aria-label="Filter by era">
          {ERAS.map((era, index) => (
            <button
              key={era.value}
              type="button"
              className={cn(
                styles.filterChip,
                selectedEra === era.value && styles.filterChipActive,
              )}
              onClick={() => setSelectedEra(era.value)}
              onKeyDown={(event) => {
                const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
                const next =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? ERAS.length - 1
                      : step
                        ? (index + step + ERAS.length) % ERAS.length
                        : -1;
                if (next < 0) {
                  return;
                }
                event.preventDefault();
                setSelectedEra(ERAS[next]!.value);
                event.currentTarget.parentElement
                  ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
                  [next]?.focus();
              }}
              tabIndex={selectedEra === era.value ? 0 : -1}
              role="radio"
              aria-checked={selectedEra === era.value}
            >
              {era.label}
            </button>
          ))}
        </div>

        <div className={styles.rightControls}>
          <div className={styles.modeToggle} role="group" aria-label="Portfolio mode">
            <button
              type="button"
              className={cn(styles.modeToggleBtn, !isEditMode && styles.modeToggleBtnActive)}
              aria-pressed={!isEditMode}
              onClick={() => setIsEditMode(false)}
            >
              View mode
            </button>
            <button
              type="button"
              className={cn(styles.modeToggleBtn, isEditMode && styles.modeToggleBtnActive)}
              aria-pressed={isEditMode}
              onClick={() => setIsEditMode(true)}
            >
              Edit mode
            </button>
          </div>

          {isEditMode ? (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} strokeWidth={1.5} aria-hidden="true" />}
              onClick={openCreateEditor}
            >
              Add record
            </Button>
          ) : null}
        </div>
      </div>

      <p role="status" className="text-[length:var(--fs-small)] text-ws-text-muted">
        {isEditMode
          ? 'Edit mode: add records or use a record’s editing controls.'
          : 'View mode: browse your records and lessons.'}
      </p>

      {/* Roman Mosaic Section Divider */}
      <div className={styles.mosaicDividerWrap} aria-hidden="true">
        <Image
          src="/visuals/personal-achievements/roman-mosaic-band.svg"
          alt=""
          aria-hidden="true"
          width={720}
          height={100}
          loading="eager"
          unoptimized
          className={styles.mosaicDivider}
        />
      </div>

      {/* Achievements Gallery Grid */}
      <section aria-labelledby="gallery-heading">
        <h2 id="gallery-heading" className="sr-only">
          Achievements gallery
        </h2>

        {isLoading && achievements.length === 0 ? (
          <div className={styles.galleryGrid} aria-label="Loading achievements gallery">
            <Skeleton className="h-52 w-full rounded-card" />
            <Skeleton className="h-52 w-full rounded-card" />
          </div>
        ) : achievements.length === 0 ? (
          <div className={styles.emptyContainer}>
            <EmptyState
              title={
                loadFailed
                  ? 'Achievements unavailable right now.'
                  : selectedEra === 'all'
                    ? 'No records archived yet.'
                    : 'No records match the selected era.'
              }
              description={
                loadFailed
                  ? 'Retry loading above once your connection is restored.'
                  : selectedEra === 'all'
                    ? 'Inscribe a competition, academic distinction, or upcoming contest to open your marble gallery.'
                    : 'Choose another era or view all eras to inspect the full archive.'
              }
              action={
                loadFailed ? (
                  <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                    Retry
                  </Button>
                ) : selectedEra === 'all' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus size={14} strokeWidth={1.5} aria-hidden="true" />}
                    onClick={openCreateEditor}
                  >
                    Add first record
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setSelectedEra('all')}>
                    Show all eras
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className={styles.galleryGrid}>
            {achievements.map((item: AchievementItem) => {
              const formattedFutureDate =
                item.era === 'future_contest' ? formatFutureContestDate(item.futureDate) : null;
              const cardError = cardErrors[item.id];
              const isFeaturedPending = pendingFeaturedId === item.id;

              return (
                <article
                  id={`item-${item.id}`}
                  tabIndex={-1}
                  key={item.id}
                  data-featured={item.featured}
                  className={styles.achievementCard}
                >
                  <div className={styles.cardBodyStack}>
                    <div className={styles.cardHeaderLine}>
                      <div className={styles.cardBadges}>
                        <span className={styles.eraBadge}>{ERA_LABELS[item.era]}</span>
                        {item.featured ? (
                          <Badge tone="general">
                            <span className="inline-flex items-center gap-1">
                              <Award size={12} strokeWidth={1.5} aria-hidden="true" />
                              <span>Featured</span>
                            </span>
                          </Badge>
                        ) : null}
                      </div>
                      <span className={styles.yearLabel}>{item.year}</span>
                    </div>

                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    {item.organization ? (
                      <p className={styles.orgName}>{item.organization}</p>
                    ) : null}
                    {item.awardOrRole ? (
                      <div className={styles.awardRow}>
                        <span className={styles.awardPill}>{item.awardOrRole}</span>
                      </div>
                    ) : null}

                    {item.description ? (
                      <p className={styles.cardDesc}>{item.description}</p>
                    ) : null}
                  </div>

                  <div className={styles.cardFooterStack}>
                    {item.lessonsLearned ? (
                      <div className={styles.lessonsBox}>
                        <strong>Lesson learned: </strong>
                        <span>{item.lessonsLearned}</span>
                      </div>
                    ) : null}

                    {item.era === 'future_contest' ? (
                      <div className={styles.contestAlert}>
                        <Bell
                          size={14}
                          strokeWidth={1.5}
                          aria-hidden="true"
                          className={styles.contestAlertIcon}
                        />
                        <span>
                          {item.reminderEnabled
                            ? 'Connected to notification reminders'
                            : 'Notification reminder off'}
                          {' · '}
                          {formattedFutureDate
                            ? `Upcoming on ${formattedFutureDate}`
                            : 'Contest date to be scheduled'}
                        </span>
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

                    {isEditMode ? (
                      <div className={styles.editActionsRow}>
                        <Button
                          variant={item.featured ? 'secondary' : 'ghost'}
                          size="sm"
                          aria-pressed={item.featured}
                          aria-label={
                            item.featured ? `Unfeature ${item.title}` : `Feature ${item.title}`
                          }
                          disabled={isFeaturedPending}
                          onClick={() => void handleToggleFeatured(item)}
                        >
                          {item.featured ? 'Featured' : 'Feature'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          aria-label={`Edit ${item.title}`}
                          onClick={() => openEditEditor(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Delete ${item.title}`}
                          className="text-text-overdue hover:bg-tint-overdue-bg"
                          onClick={() => setDeleteTarget(item)}
                        >
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Quiet Gallery Colophon */}
      <footer className={styles.colophonFooter}>
        <p className={styles.colophonText}>
          Marble endures when paired with humility: every accolade keeps the lesson that shaped it.
        </p>
        <Image
          src="/visuals/personal-achievements/laurel-spray.svg"
          alt=""
          aria-hidden="true"
          width={240}
          height={240}
          loading="eager"
          unoptimized
          className={styles.colophonLaurel}
        />
      </footer>

      {/* Unified LargeEditorDialog + Two-Column Layout + Local Drafts */}
      <LargeEditorDialog
        open={editorOpen}
        onClose={closeEditor}
        eyebrow="Personal portfolio & contest archive"
        title={editingRecord ? 'Edit achievement or contest' : 'Add achievement or contest'}
        description="Record the title, era, standing, enduring lesson, and contest reminder settings."
        formId={ACHIEVEMENT_EDITOR_DOM_FORM_ID}
        isDirty={isEditorDirty}
        isSubmitting={isSubmitting}
        submitLabel={editingRecord ? 'Save changes' : 'Save record'}
        submittingLabel={editingRecord ? 'Saving…' : 'Saving…'}
        closeAriaLabel="Close achievement editor"
        initialFocusRef={titleInputRef}
        errorMessage={editorError}
        draftRecovery={
          loadedDraft
            ? {
                savedAtLabel: formatDraftTimestamp(loadedDraft.savedAt),
                stale: isEditorDraftStale(loadedDraft, null),
                onResume: () => {
                  setFormValues(loadedDraft.values);
                  setLoadedDraft(null);
                },
                onDiscard: () => {
                  clearEditorDraft(ACHIEVEMENT_FORM_ID, editingRecord?.id ?? null);
                  setLoadedDraft(null);
                  refreshOrphanedDrafts();
                },
              }
            : null
        }
        onSaveDraft={handleSaveDraft}
        footerActions={
          editingRecord ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setDeleteTarget(editingRecord)}
            >
              Delete record
            </Button>
          ) : null
        }
      >
        <form id={ACHIEVEMENT_EDITOR_DOM_FORM_ID} noValidate onSubmit={handleEditorSubmit}>
          <LargeEditorTwoColumn
            primary={
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="achievement-editor-title"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Title
                  </label>
                  <input
                    ref={titleInputRef}
                    id="achievement-editor-title"
                    type="text"
                    value={formValues.title}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, title: e.target.value }));
                      if (editorError) setEditorError('');
                    }}
                    placeholder="e.g., Regional Informatics Olympiad"
                    className={cn(styles.editorControl, styles.editorControlInput)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="achievement-editor-desc"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Description &amp; contest scope
                  </label>
                  <textarea
                    id="achievement-editor-desc"
                    rows={4}
                    value={formValues.description}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="What was the challenge, scope, or project?"
                    className={cn(
                      styles.editorControl,
                      styles.editorControlTextarea,
                      'max-w-[66ch]',
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="achievement-editor-lessons"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Key lesson learned
                  </label>
                  <textarea
                    id="achievement-editor-lessons"
                    rows={4}
                    value={formValues.lessonsLearned}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, lessonsLearned: e.target.value }))
                    }
                    placeholder="What insight or discipline stayed with you afterward?"
                    className={cn(
                      styles.editorControl,
                      styles.editorControlTextarea,
                      'max-w-[66ch]',
                    )}
                  />
                </div>
              </>
            }
            metadata={
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="achievement-editor-era"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Era
                  </label>
                  <select
                    id="achievement-editor-era"
                    value={formValues.era}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        era: e.target.value as AchievementEra,
                      }))
                    }
                    className={cn(styles.editorControl, styles.editorControlInput)}
                  >
                    <option value="university">University</option>
                    <option value="high_school">High school</option>
                    <option value="secondary">Secondary</option>
                    <option value="elementary">Elementary</option>
                    <option value="future_contest">Upcoming contest</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="achievement-editor-year"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Year
                  </label>
                  <input
                    ref={yearInputRef}
                    id="achievement-editor-year"
                    type="text"
                    value={formValues.year}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, year: e.target.value }));
                      if (editorError) setEditorError('');
                    }}
                    placeholder="e.g., 2025"
                    className={cn(styles.editorControl, styles.editorControlInput, 'tabular-nums')}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="achievement-editor-award"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Award / Standing
                  </label>
                  <input
                    id="achievement-editor-award"
                    type="text"
                    value={formValues.awardOrRole}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, awardOrRole: e.target.value }))
                    }
                    placeholder="e.g., First prize"
                    className={cn(styles.editorControl, styles.editorControlInput)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="achievement-editor-org"
                    className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                  >
                    Organization / Host
                  </label>
                  <input
                    id="achievement-editor-org"
                    type="text"
                    value={formValues.organization}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, organization: e.target.value }))
                    }
                    placeholder="e.g., University of Science"
                    className={cn(styles.editorControl, styles.editorControlInput)}
                  />
                </div>

                <div className={styles.checkboxTouchRow}>
                  <Checkbox
                    checked={formValues.featured}
                    aria-label="Featured in gallery"
                    onCheckedChange={(checked) =>
                      setFormValues((prev) => ({ ...prev, featured: checked }))
                    }
                  />
                  <span>Featured in gallery</span>
                </div>

                {formValues.era === 'future_contest' ? (
                  <>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="achievement-editor-future-date"
                        className="text-[length:var(--fs-small)] font-medium text-ws-text block"
                      >
                        Scheduled contest date
                      </label>
                      <input
                        id="achievement-editor-future-date"
                        type="date"
                        value={formValues.futureDate}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, futureDate: e.target.value }))
                        }
                        className={cn(
                          styles.editorControl,
                          styles.editorControlInput,
                          'tabular-nums',
                        )}
                      />
                    </div>

                    <div className={styles.checkboxTouchRow}>
                      <Checkbox
                        checked={formValues.reminderEnabled}
                        aria-label="Connect to shared notification system"
                        onCheckedChange={(checked) =>
                          setFormValues((prev) => ({ ...prev, reminderEnabled: checked }))
                        }
                      />
                      <span>Connect to shared notification system</span>
                    </div>
                  </>
                ) : null}
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
        title="Remove achievement record?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” and any saved local draft for it will be permanently removed.`
            : ''
        }
        confirmLabel="Remove"
        isSubmitting={deleteAchievement.isPending}
      />
    </div>
  );

  if (inheritedTheme) {
    return workspaceContent;
  }

  return (
    <FeatureThemeProvider name="personal-achievements">{workspaceContent}</FeatureThemeProvider>
  );
}

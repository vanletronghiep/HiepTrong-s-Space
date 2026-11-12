'use client';

import { useItemAnchor } from '@/ui/use-item-anchor';

import { Dialog } from '@/ui/Dialog';

import { useMemo, useState } from 'react';
import {
  Compass,
  Plus,
  X,
  CheckCircle2,
  Circle,
  Calendar,
} from 'lucide-react';
import {
  useMilestones,
  useCreateMilestone,
  useToggleLandmark,
  useDeleteMilestone,
} from '@/client/queries/milestones';
import type { MilestoneCategory, MilestoneItem } from '@/contracts/milestone';
import { computeLandmarkProgress } from '@/domain/milestone-domain';
import { Button } from '@/ui/Button';
import styles from './milestones.module.css';

export function MilestonesView() {
  const { data: milestones = [], isLoading, isError: loadFailed, refetch } = useMilestones();
  const createMutation = useCreateMilestone();
  const toggleMutation = useToggleLandmark();
  const deleteMutation = useDeleteMilestone();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneItem | null>(null);

  useItemAnchor(milestones);

  const totalLandmarks = useMemo(
    () => milestones.reduce((sum, m) => sum + (m.landmarks?.length || 0), 0),
    [milestones],
  );
  const completedLandmarks = useMemo(
    () =>
      milestones.reduce(
        (sum, m) => sum + (m.landmarks?.filter((l) => l.completed).length || 0),
        0,
      ),
    [milestones],
  );

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newTimeframe, setNewTimeframe] = useState('Year I (2026–2027)');
  const [newCategory, setNewCategory] = useState<MilestoneCategory>('personal');
  const [newReflection, setNewReflection] = useState('');
  const [newLandmarksInput, setNewLandmarksInput] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMeaning.trim()) return;

    const landmarks = newLandmarksInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((title) => ({
        id: crypto.randomUUID(),
        title,
        completed: false,
        completedAt: null,
      }));

    createMutation.mutate(
      {
        title: newTitle.trim(),
        meaning: newMeaning.trim(),
        category: newCategory,
        timeframe: newTimeframe.trim(),
        targetDate: null,
        status: 'in_progress',
        reflection: newReflection.trim() || null,
        landmarks,
        linkedProjectIds: [],
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setNewTitle('');
          setNewMeaning('');
          setNewReflection('');
          setNewLandmarksInput('');
        },
      },
    );
  };



  if (loadFailed) return <div role="alert">Could not load this space. <button type="button" onClick={() => void refetch()}>Retry</button></div>;

  return (
    <div className={styles.container}>
      {[createMutation, toggleMutation, deleteMutation].some(mutation => mutation.isError) && <p role="alert">The change could not be saved. Retry the action.</p>}
      <div className={styles.horizonGlow} aria-hidden="true" />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.eyebrow}>
            <Compass size={16} />
            <span>Horizon & Landmarks</span>
          </div>
          <h1 className={styles.title}>Milestone</h1>
        </div>

        <Button leftIcon={<Plus size={16} className="mr-1" />}
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="bg-ws-text hover:bg-text-accent text-white"
        >

          <span>New milestone</span>
        </Button>
      </header>

      {/* Overview Statistics */}
      <section className={styles.statsGrid} aria-label="Milestone statistics">
        <div className={styles.statCard}>
          <span className={styles.statValue}>{milestones.length}</span>
          <span className={styles.statLabel}>Core ambitions</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--text-completed)' }}>
            {completedLandmarks} / {totalLandmarks}
          </span>
          <span className={styles.statLabel}>Landmarks reached</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--cosmos-star)' }}>
            {totalLandmarks > 0 ? Math.round((completedLandmarks / totalLandmarks) * 100) : 0}%
          </span>
          <span className={styles.statLabel}>Trajectory completed</span>
        </div>
      </section>

      {/* Milestones List */}
      {isLoading ? (
        <div className="py-16 text-center text-ws-text-muted">Loading milestones…</div>
      ) : (
        <div className={styles.milestonesList}>
          {milestones.length === 0 ? (
            <div className="py-16 text-center text-ws-text-muted">
              No milestones recorded yet. Define an ambition to map your trajectory.
            </div>
          ) : (
            milestones.map((milestone) => {
              const progress = computeLandmarkProgress(milestone);

              return (
                <article id={`item-${milestone.id}`} tabIndex={-1} key={milestone.id} className={styles.milestoneCard}>
                  <div className={styles.cardHeaderRow}>
                    <div className="flex flex-col gap-1.5 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <span className={styles.timeframeBadge}>
                          <Calendar size={12} />
                          <span>{milestone.timeframe}</span>
                        </span>
                        <span className="text-xs text-ws-text-muted capitalize">
                          {milestone.category}
                        </span>
                      </div>
                      <h2 className={styles.cardTitle}>{milestone.title}</h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ws-text">{progress}%</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMilestone(milestone)}
                        className="text-xs text-ws-text-muted hover:text-ws-text"
                      >
                        Options
                      </Button>
                    </div>
                  </div>

                  <p className={styles.cardMeaning}>&ldquo;{milestone.meaning}&rdquo;</p>

                  {/* Reflection block */}
                  {milestone.reflection && (
                    <div className={styles.reflectionBox}>
                      <span className={styles.reflectionLabel}>Progress reflection</span>
                      <p className="text-ws-text">{milestone.reflection}</p>
                    </div>
                  )}

                  {/* Landmarks checklist */}
                  {milestone.landmarks.length > 0 && (
                    <div className={styles.landmarksSection}>
                      <div className={styles.landmarksHeader}>
                        <span>Landmarks toward this ambition</span>
                        <span className="text-xs text-ws-text-muted">
                          {milestone.landmarks.filter((l) => l.completed).length} of{' '}
                          {milestone.landmarks.length} reached
                        </span>
                      </div>

                      <div className={styles.landmarksList}>
                        {milestone.landmarks.map((landmark) => (
                          <div
                            key={landmark.id}
                            className={styles.landmarkItem}
                            onClick={() =>
                              toggleMutation.mutate({
                                milestoneId: milestone.id,
                                landmarkId: landmark.id,
                              })
                            }
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleMutation.mutate({
                                  milestoneId: milestone.id,
                                  landmarkId: landmark.id,
                                });
                              }
                            }}
                          >
                            {landmark.completed ? (
                              <CheckCircle2 size={16} className="text-text-completed shrink-0" />
                            ) : (
                              <Circle size={16} className="text-ws-text-muted shrink-0" />
                            )}
                            <span
                              className={`${styles.landmarkTitle} ${
                                landmark.completed ? styles.landmarkTitleDone : ''
                              }`}
                            >
                              {landmark.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

      {/* Delete / Options Modal */}
      {selectedMilestone && (
        <Dialog open portal className="max-h-[90svh] overflow-y-auto" title={selectedMilestone.title} onClose={() => setSelectedMilestone(null)}>
          {[createMutation, toggleMutation, deleteMutation].some(mutation => mutation.isError) && <p role="alert">Could not save. Your input is retained; retry.</p>}
          <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={() => setSelectedMilestone(null)}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>



            <p className="text-sm text-ws-text-muted">{selectedMilestone.meaning}</p>

            <div className="flex items-center justify-between pt-4 border-t border-ws-border">
              <Button
                variant="ghost"
                size="sm"
                className="text-text-overdue hover:bg-ws-accent-soft"
                onClick={() => {
                  deleteMutation.mutate(selectedMilestone.id);
                  setSelectedMilestone(null);
                }}
              >
                Delete milestone
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedMilestone(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Create Milestone Modal Dialog */}
      {isCreateOpen && (
        <Dialog open portal className="max-h-[90svh] overflow-y-auto" title="Set new ambition" onClose={() => setIsCreateOpen(false)}>
          {[createMutation, toggleMutation, deleteMutation].some(mutation => mutation.isError) && <p role="alert">Could not save. Your input is retained; retry.</p>}
          <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={() => setIsCreateOpen(false)}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>



            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="milestones-field-1" className="text-xs font-semibold text-ws-text">Ambition title</label>
                <input id="milestones-field-1"
                  type="text"
                  required
                  placeholder="e.g. Master Machine Learning Foundations"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="milestones-field-2" className="text-xs font-semibold text-ws-text">Meaning & significance</label>
                <textarea id="milestones-field-2"
                  rows={2}
                  required
                  placeholder="Why is this meaningful to you and your long-term journey?"
                  value={newMeaning}
                  onChange={(e) => setNewMeaning(e.target.value)}
                  className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="milestones-field-3" className="text-xs font-semibold text-ws-text">Timeframe</label>
                  <input id="milestones-field-3"
                    type="text"
                    required
                    placeholder="e.g. Year I, 2026, or Next 6 months"
                    value={newTimeframe}
                    onChange={(e) => setNewTimeframe(e.target.value)}
                    className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="milestones-field-4" className="text-xs font-semibold text-ws-text">Category</label>
                  <select id="milestones-field-4"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as MilestoneCategory)}
                    className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none"
                  >
                    <option value="personal">Personal</option>
                    <option value="academic">Academic</option>
                    <option value="career">Career</option>
                    <option value="project">Project</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="milestones-field-5" className="text-xs font-semibold text-ws-text">
                  Landmarks (one checkpoint per line)
                </label>
                <textarea id="milestones-field-5"
                  rows={3}
                  placeholder={`Pass Calculus midterm\nComplete PyTorch bot\nPublish writeup`}
                  value={newLandmarksInput}
                  onChange={(e) => setNewLandmarksInput(e.target.value)}
                  className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="milestones-field-6" className="text-xs font-semibold text-ws-text">Reflection</label>
                <textarea id="milestones-field-6"
                  rows={2}
                  placeholder="Where do things stand right now?"
                  value={newReflection}
                  onChange={(e) => setNewReflection(e.target.value)}
                  className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="bg-ws-text hover:bg-text-accent text-white"
                >
                  Save milestone
                </Button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
}

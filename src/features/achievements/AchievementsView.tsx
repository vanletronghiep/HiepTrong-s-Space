'use client';

import { Dialog } from '@/ui/Dialog';

import { useItemAnchor } from '@/ui/use-item-anchor';

import React, { useRef, useState, useId } from 'react';
import type { AchievementEra, AchievementItem } from '@/contracts/achievement';
import {
  useAchievements,
  useCreateAchievement,
  useDeleteAchievement,
} from '@/client/queries/achievements';
import styles from './achievements.module.css';

const ERAS: { label: string; value: AchievementEra | 'all' }[] = [
  { label: 'All eras', value: 'all' },
  { label: 'University', value: 'university' },
  { label: 'High school', value: 'high_school' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Upcoming contests', value: 'future_contest' },
];

export function AchievementsView() {
  const writeLocks = useRef(new Set<string>());
  const [selectedEra, setSelectedEra] = useState<AchievementEra | 'all'>('all');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state
  const [formTitle, setFormTitle] = useState<string>('');
  const [formEra, setFormEra] = useState<AchievementEra>('university');
  const [formYear, setFormYear] = useState<string>('2025');
  const [formAward, setFormAward] = useState<string>('');
  const [formOrg, setFormOrg] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formLessons, setFormLessons] = useState<string>('');
  const [formFutureDate, setFormFutureDate] = useState<string>('');
  const [formReminder, setFormReminder] = useState<boolean>(false);

  const titleInputId = useId();
  const eraSelectId = useId();
  const yearInputId = useId();
  const awardInputId = useId();
  const orgInputId = useId();
  const descInputId = useId();
  const lessonsInputId = useId();
  const futureDateInputId = useId();

  // Queries & Mutations
  const { data: achievements = [], isLoading, isError: loadFailed, refetch } = useAchievements(
    selectedEra !== 'all' ? selectedEra : undefined,
  );
  const createAchievement = useCreateAchievement();
  const deleteAchievement = useDeleteAchievement();

  // Focus anchor
  useItemAnchor(achievements);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formYear.trim()) return;

    if (writeLocks.current.has('createAchievement')) return;
    writeLocks.current.add('createAchievement');
    try {
      await createAchievement.mutateAsync({
        title: formTitle.trim(),
        era: formEra,
        year: formYear.trim(),
        awardOrRole: formAward.trim(),
        organization: formOrg.trim(),
        description: formDesc.trim(),
        lessonsLearned: formLessons.trim(),
        futureDate: formEra === 'future_contest' && formFutureDate ? formFutureDate : null,
        reminderEnabled: formReminder,
      });
    } catch {
      return;
    } finally {
      writeLocks.current.delete('createAchievement');
    }

    setShowAddModal(false);
    setFormTitle('');
    setFormAward('');
    setFormOrg('');
    setFormDesc('');
    setFormLessons('');
    setFormFutureDate('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Remove this achievement record?')) {
      deleteAchievement.mutate(id);
    }
  };



  if (loadFailed) return <div role="alert">Could not load this space. <button type="button" onClick={() => void refetch()}>Retry</button></div>;

  return (
    <div className={styles.container}>
      {[createAchievement, deleteAchievement].some(mutation => mutation.isError) && <p role="alert">The change could not be saved. Your input is retained; retry the action.</p>}
      {/* Portfolio Header */}
      <header className={styles.header}>
        <div className={styles.eyebrow}>
          <svg
            className={styles.eyebrowIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
          </svg>
          <span>Personal portfolio & contest archive</span>
        </div>

        <h1 className={styles.title}>Personal Achievements</h1>
        <p className={styles.description}>
          A retrospective gallery of competitions, academic milestones, and enduring lessons learned
          from elementary school through university and upcoming collegiate contests.
        </p>
      </header>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.filterChips} role="radiogroup" aria-label="Filter by era">
          {ERAS.map((era) => (
            <button
              key={era.value}
              type="button"
              className={`${styles.filterChip} ${selectedEra === era.value ? styles.filterChipActive : ''}`}
              onClick={() => setSelectedEra(era.value)}
              role="radio"
              aria-checked={selectedEra === era.value}
            >
              {era.label}
            </button>
          ))}
        </div>

        <div className={styles.rightControls}>
          {/* Mode Switcher */}
          <div className={styles.modeToggle} role="group" aria-label="Portfolio mode">
            <button
              type="button"
              className={`${styles.modeToggleBtn} ${!isEditMode ? styles.modeToggleBtnActive : ''}`}
              onClick={() => setIsEditMode(false)}
            >
              View mode
            </button>
            <button
              type="button"
              className={`${styles.modeToggleBtn} ${isEditMode ? styles.modeToggleBtnActive : ''}`}
              onClick={() => setIsEditMode(true)}
            >
              Edit mode
            </button>
          </div>

          {isEditMode && (
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setShowAddModal(true)}
            >
              <span>+ Add record</span>
            </button>
          )}
        </div>
      </div>

      {/* Achievements Gallery Grid */}
      <section aria-labelledby="gallery-heading">
        <h2 id="gallery-heading" className="sr-only">
          Achievements gallery
        </h2>

        {isLoading ? (
          <div style={{ color: 'var(--ws-text-muted)', fontSize: 'var(--text-xs)' }}>
            Loading portfolio gallery...
          </div>
        ) : achievements.length === 0 ? (
          <div style={{ color: 'var(--ws-text-muted)', fontSize: 'var(--text-xs)' }}>
            No records match the selected era.
          </div>
        ) : (
          <div className={styles.galleryGrid}>
            {achievements.map((item: AchievementItem) => (
              <article id={`item-${item.id}`} tabIndex={-1} key={item.id} className={styles.achievementCard}>
                <div>
                  <div className={styles.cardHeaderLine}>
                    <span className={styles.eraBadge}>{item.era.replace('_', ' ')}</span>
                    <span>{item.year}</span>
                  </div>

                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  {item.organization && (
                    <p className={styles.orgName}>{item.organization}</p>
                  )}
                  {item.awardOrRole && (
                    <div style={{ marginTop: '6px' }}>
                      <span className={styles.awardPill}>{item.awardOrRole}</span>
                    </div>
                  )}

                  <p className={styles.cardDesc}>{item.description}</p>
                </div>

                {item.lessonsLearned && (
                  <div className={styles.lessonsBox}>
                    <strong>Lesson learned: </strong>
                    <span>{item.lessonsLearned}</span>
                  </div>
                )}

                {item.era === 'future_contest' && (
                  <div className={styles.contestAlert}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span>
                      Connected to notification reminders · Upcoming on{' '}
                      {item.futureDate ? new Date(item.futureDate).toLocaleDateString() : '2026'}
                    </span>
                  </div>
                )}

                {isEditMode && (
                  <div className={styles.editActionsRow}>
                    <button
                      type="button"
                      className={styles.cardActionBtn}
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Add Achievement Record Modal */}
      {showAddModal && (
        <Dialog open portal title="Add achievement or contest" className="max-w-2xl max-h-[90svh] overflow-y-auto" onClose={() => setShowAddModal(false)}>
{[createAchievement, deleteAchievement].some(mutation => mutation.isError) && <p role="alert">Could not save. Your input is retained; retry.</p>}
          <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label htmlFor={titleInputId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Title
                </label>
                <input
                  id={titleInputId}
                  type="text"
                  required
                  className={styles.inputField}
                  placeholder="e.g., Regional Informatics Olympiad"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor={eraSelectId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    Era
                  </label>
                  <select
                    id={eraSelectId}
                    className={styles.selectField}
                    value={formEra}
                    onChange={(e) => setFormEra(e.target.value as AchievementEra)}
                  >
                    <option value="university">University</option>
                    <option value="high_school">High school</option>
                    <option value="secondary">Secondary</option>
                    <option value="elementary">Elementary</option>
                    <option value="future_contest">Upcoming contest</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={yearInputId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    Year
                  </label>
                  <input
                    id={yearInputId}
                    type="text"
                    required
                    className={styles.inputField}
                    placeholder="e.g., 2026"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor={awardInputId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    Award / Standing
                  </label>
                  <input
                    id={awardInputId}
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g., First prize"
                    value={formAward}
                    onChange={(e) => setFormAward(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor={orgInputId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    Organization / Host
                  </label>
                  <input
                    id={orgInputId}
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g., University of Science"
                    value={formOrg}
                    onChange={(e) => setFormOrg(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor={descInputId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Description & contest scope
                </label>
                <textarea
                  id={descInputId}
                  className={styles.textareaField}
                  style={{ minHeight: '60px' }}
                  placeholder="What was the challenge or project?"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor={lessonsInputId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Key lesson learned
                </label>
                <textarea
                  id={lessonsInputId}
                  className={styles.textareaField}
                  style={{ minHeight: '60px' }}
                  placeholder="What insight or wisdom was gained?"
                  value={formLessons}
                  onChange={(e) => setFormLessons(e.target.value)}
                />
              </div>

              {formEra === 'future_contest' && (
                <div>
                  <label htmlFor={futureDateInputId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    Scheduled contest date
                  </label>
                  <input
                    id={futureDateInputId}
                    type="date"
                    className={styles.inputField}
                    value={formFutureDate}
                    onChange={(e) => setFormFutureDate(e.target.value)}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: 'var(--text-xs)' }}>
                    <input
                      type="checkbox"
                      checked={formReminder}
                      onChange={(e) => setFormReminder(e.target.checked)}
                    />
                    <span>Connect to shared notification system</span>
                  </label>
                </div>
              )}

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={createAchievement.isPending}
                >
                  Save record
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
}


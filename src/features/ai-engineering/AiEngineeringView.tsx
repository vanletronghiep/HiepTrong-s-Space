'use client';

import React, { useState, useEffect } from 'react';
import type { AiNotionNote } from '@/contracts/ai-engineering';
import { useAiEngineeringData, useToggleAiTopic } from '@/client/queries/ai-engineering';
import styles from './ai-engineering.module.css';

export function AiEngineeringView() {
  const [activeNote, setActiveNote] = useState<AiNotionNote | null>(null);

  const { data, isLoading } = useAiEngineeringData();
  const toggleTopic = useToggleAiTopic();

  // Escape to close active note modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeNote) {
        setActiveNote(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNote]);

  const handleToggle = (stageId: string, topicId: string) => {
    toggleTopic.mutate({ stageId, topicId });
  };

  const roadmap = data?.roadmap ?? [];
  const notes = data?.notes ?? [];
  const stats = data?.stats;

  return (
    <div className={styles.container}>
      {/* Calm Technical Header */}
      <header className={styles.header}>
        <svg
          className={styles.neuralSvgBg}
          viewBox="0 0 300 150"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="40" cy="40" r="4" fill="currentColor" />
          <circle cx="120" cy="30" r="4" fill="currentColor" />
          <circle cx="200" cy="50" r="4" fill="currentColor" />
          <circle cx="80" cy="110" r="4" fill="currentColor" />
          <circle cx="180" cy="115" r="4" fill="currentColor" />
          <circle cx="260" cy="90" r="4" fill="currentColor" />
          <line x1="40" y1="40" x2="120" y2="30" opacity="0.4" />
          <line x1="120" y1="30" x2="200" y2="50" opacity="0.4" />
          <line x1="40" y1="40" x2="80" y2="110" opacity="0.4" />
          <line x1="120" y1="30" x2="180" y2="115" opacity="0.4" />
          <line x1="200" y1="50" x2="260" y2="90" opacity="0.4" />
          <line x1="80" y1="110" x2="180" y2="115" opacity="0.4" />
          <line x1="180" y1="115" x2="260" y2="90" opacity="0.4" />
        </svg>

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
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
          <span>AI systems & cognitive architectures</span>
        </div>

        <h1 className={styles.title}>AI Engineering</h1>
        <p className={styles.description}>
          Hiep&apos;s personal curriculum and research laboratory. Track mastery across foundations,
          transformer architectures, inference engineering, and autonomous agent loops.
        </p>
      </header>

      {/* Current Focus & Next Actionable Step */}
      <section aria-labelledby="focus-step-heading" className={styles.nextStepCard}>
        <div className={styles.nextStepEyebrow}>
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
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span>Current learning priority</span>
        </div>
        <h2 id="focus-step-heading" className={styles.nextStepTitle}>
          {stats?.currentFocusTopic ?? 'Transformer attention layers'}
        </h2>
        <p className={styles.nextStepText}>
          Next recommended step: {stats?.nextRecommendedStep ?? 'Complete derivation and benchmark implementation.'}
        </p>
      </section>

      {/* Career Roadmap Stages */}
      <section aria-labelledby="roadmap-heading" className={styles.roadmapSection}>
        <div className={styles.sectionHeader}>
          <h2 id="roadmap-heading" className={styles.sectionTitle}>
            Engineering roadmap
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ws-text-muted)' }}>
            {stats?.completedTopics ?? 0} of {stats?.totalTopics ?? 16} topics completed
          </span>
        </div>

        {isLoading ? (
          <div style={{ color: 'var(--ws-text-muted)', fontSize: 'var(--text-xs)' }}>
            Loading curriculum...
          </div>
        ) : (
          <div className={styles.stageGrid}>
            {roadmap.map((stage) => {
              const isActiveStage = stage.status === 'in_progress';
              const statusClass =
                stage.status === 'completed'
                  ? styles.statusCompleted
                  : stage.status === 'in_progress'
                    ? styles.statusInProgress
                    : styles.statusUpcoming;

              return (
                <div
                  key={stage.id}
                  className={`${styles.stageCard} ${isActiveStage ? styles.stageCardActive : ''}`}
                >
                  <div className={styles.stageTop}>
                    <span className={styles.stageOrder}>Stage {stage.order}</span>
                    <span className={`${styles.stageStatusPill} ${statusClass}`}>
                      {stage.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className={styles.stageTitle}>{stage.title}</h3>
                  <p className={styles.stageDesc}>{stage.description}</p>

                  <div className={styles.topicList}>
                    {stage.topics.map((t) => (
                      <label key={t.id} className={styles.topicItem}>
                        <input
                          type="checkbox"
                          className={styles.topicCheckbox}
                          checked={t.completed}
                          onChange={() => handleToggle(stage.id, t.id)}
                        />
                        <span className={t.completed ? styles.topicNameDone : ''}>
                          {t.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Imported Notion Notes */}
      <section aria-labelledby="notes-heading" className={styles.notesSection}>
        <div className={styles.sectionHeader}>
          <h2 id="notes-heading" className={styles.sectionTitle}>
            Imported Notion notes & research
          </h2>
        </div>

        <div className={styles.notesGrid}>
          {notes.map((note) => (
            <article
              key={note.id}
              className={styles.noteCard}
              onClick={() => setActiveNote(note)}
            >
              <div>
                <h3 className={styles.noteTitle}>{note.title}</h3>
                <p className={styles.noteSummary}>{note.summary}</p>
              </div>

              <div className={styles.noteFooter}>
                <span className={styles.notionLinkBadge}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  <span>Notion copy</span>
                </span>
                <span>
                  Synced{' '}
                  {new Date(note.lastSyncedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Note Reader Modal */}
      {activeNote && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-modal-title"
          onClick={() => setActiveNote(null)}
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 id="note-modal-title" style={{ fontSize: 'var(--text-base)', margin: 0 }}>
                {activeNote.title}
              </h2>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                onClick={() => setActiveNote(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ws-text-muted)' }}>
                  Topic: <strong>{activeNote.topic}</strong>
                </div>
              </div>

              <div
                style={{
                  background: 'color-mix(in srgb, var(--cosmos-lavender) 8%, var(--ws-bg))',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginBottom: '6px' }}>
                  Key takeaways:
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--text-xs)' }}>
                  {activeNote.keyTakeaways.map((t, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                {activeNote.readingContent}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <a
                href={activeNote.notionSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.notionOutboundBtn}
              >
                <span>Open original in Notion</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setActiveNote(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


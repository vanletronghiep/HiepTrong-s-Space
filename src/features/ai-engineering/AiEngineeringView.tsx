'use client';

import { usePageReady } from '@/features/transitions/TransitionProvider';
import React, { useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Compass,
  Cpu,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import { useAiEngineeringData, useToggleAiTopic } from '@/client/queries/ai-engineering';
import type { AiNotionNote, StageStatus } from '@/contracts/ai-engineering';
import { DEFAULT_APP_TIMEZONE } from '@/domain/time';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { cn } from '@/ui/cn';
import { Dialog } from '@/ui/Dialog';
import { FeatureEmptyState } from '@/ui/FeatureTheme';
import { Skeleton } from '@/ui/Skeleton';
import styles from './ai-engineering.module.css';

const STAGE_STATUS_META: Record<StageStatus, { label: string; icon: ReactNode }> = {
  completed: {
    label: 'Completed',
    icon: <CheckCircle2 size={12} strokeWidth={1.75} aria-hidden="true" />,
  },
  in_progress: {
    label: 'In progress',
    icon: <Sparkles size={12} strokeWidth={1.75} aria-hidden="true" />,
  },
  upcoming: {
    label: 'Upcoming',
    icon: <CircleDashed size={12} strokeWidth={1.75} aria-hidden="true" />,
  },
};

function formatNoteSyncDate(dateStr: string): string {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: DEFAULT_APP_TIMEZONE,
  }).format(parsed);
}

function renderInlineEmphasis(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts
    .filter((part) => part.length > 0)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={`${keyPrefix}-b-${index}`}>{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={`${keyPrefix}-t-${index}`}>{part}</React.Fragment>;
    });
}

function renderReadingBlocks(content: string, noteId: string): ReactNode[] {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, blockIndex) => {
    const blockKey = `${noteId}-block-${blockIndex}`;
    if (block.startsWith('### ')) {
      return (
        <h3 key={blockKey} className={styles.readerSubheading}>
          {block.slice(4).trim()}
        </h3>
      );
    }

    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length > 0 && lines.every((line) => line.startsWith('- '))) {
      return (
        <ul key={blockKey} className={styles.readerList}>
          {lines.map((line, lineIndex) => {
            const itemText = line.slice(2).trim();
            return (
              <li key={`${blockKey}-${itemText.slice(0, 24)}-${lineIndex}`}>
                {renderInlineEmphasis(itemText, `${blockKey}-${lineIndex}`)}
              </li>
            );
          })}
        </ul>
      );
    }

    return (
      <p key={blockKey} className={styles.readerParagraph}>
        {renderInlineEmphasis(block, blockKey)}
      </p>
    );
  });
}

export function AiEngineeringView() {
  const [activeNote, setActiveNote] = useState<AiNotionNote | null>(null);

  const { data, isLoading, isError: loadFailed, refetch } = useAiEngineeringData();
  usePageReady(!isLoading);
  const toggleTopic = useToggleAiTopic();

  const handleToggle = (stageId: string, topicId: string) => {
    toggleTopic.mutate({ stageId, topicId });
  };

  const roadmap = data?.roadmap ?? [];
  const notes = data?.notes ?? [];
  const stats = data?.stats;
  const totalTopics = stats?.totalTopics ?? 0;
  const completedTopics = stats?.completedTopics ?? 0;
  const activeStage = roadmap.find((stage) => stage.status === 'in_progress');
  const activeStageStatus = activeStage
    ? `Stage ${activeStage.order} · In progress`
    : roadmap.length > 0 && completedTopics === totalTopics && totalTopics > 0
      ? 'All stages completed'
      : 'Trail ready';

  return (
    <div className={styles.pageStack}>
      <Image
        src="/visuals/ai-engineering/ridge-trail-edge.svg"
        alt=""
        aria-hidden="true"
        width={200}
        height={480}
        loading="eager"
        unoptimized
        className={styles.ridgeEdgeDecor}
      />

      {/* Editorial Mist Trail Masthead */}
      <header
        data-feature-heading
        className={styles.masthead}
        aria-labelledby="ai-eng-page-heading"
      >
        <Image
          src="/visuals/ai-engineering/mist-layered-ridges.svg"
          alt=""
          aria-hidden="true"
          width={480}
          height={300}
          loading="eager"
          unoptimized
          className={styles.mastheadArt}
        />

        <div className={styles.mastheadText}>
          <div className={styles.eyebrow}>
            <Cpu size={14} strokeWidth={1.6} aria-hidden="true" />
            <span>AI systems &amp; cognitive architectures</span>
          </div>

          <h1 id="ai-eng-page-heading" className={styles.displayTitle}>
            AI <span className={styles.displayTitleEmphasis}>Engineering</span>
          </h1>
          <p className={styles.mastheadSubtitle}>
            Hiep&apos;s personal curriculum and research laboratory. Track mastery across
            foundations, transformer architectures, inference engineering, and autonomous agent
            loops.
          </p>
        </div>

        <div className={styles.trailMetrics} aria-label="Trail progress summary">
          <div className={styles.trailMetricPill}>
            <span className={styles.trailMetricValue}>
              {completedTopics} / {totalTopics}
            </span>
            <span className={styles.trailMetricLabel}>Topics completed</span>
          </div>
          <div className={styles.trailMetricPill}>
            <span className={styles.trailMetricValue}>{activeStageStatus}</span>
            <span className={styles.trailMetricLabel}>Active trail stage</span>
          </div>
        </div>
      </header>

      {loadFailed ? (
        <div role="alert" className={styles.alertBanner}>
          <span className={styles.alertMessageGroup}>
            <AlertTriangle size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>
              Could not load your AI Engineering trail right now. Check connection or retry.
            </span>
          </span>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} strokeWidth={1.6} aria-hidden="true" />}
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {!loadFailed ? (
        <>
          {/* Trailhead Priority Folio */}
          <section aria-labelledby="focus-step-heading" className={styles.priorityFolio}>
            <Image
              src="/visuals/ai-engineering/misty-footbridge.svg"
              alt=""
              aria-hidden="true"
              width={240}
              height={240}
              unoptimized
              className={styles.footbridgeArt}
            />

            <div className={styles.priorityContent}>
              <div className={styles.priorityEyebrow}>
                <Compass size={14} strokeWidth={1.6} aria-hidden="true" />
                <span>Current learning priority</span>
              </div>

              {isLoading ? (
                <div className="space-y-2 pt-1" aria-label="Loading current learning priority">
                  <Skeleton className="h-7 w-72 max-w-full rounded-sm" />
                  <Skeleton className="h-4 w-96 max-w-full rounded-sm" />
                </div>
              ) : (
                <>
                  <h2 id="focus-step-heading" className={styles.priorityTitle}>
                    {stats?.currentFocusTopic ?? 'No active focus topic'}
                  </h2>
                  <p className={styles.priorityText}>
                    Next recommended step:{' '}
                    {stats?.nextRecommendedStep ?? 'Choose a learning topic to plan the next step.'}
                  </p>
                </>
              )}
            </div>
          </section>

          {/* Curriculum Roadmap Stages */}
          <section aria-labelledby="roadmap-heading" className={styles.roadmapSection}>
            <div className={styles.sectionHeader}>
              <h2 id="roadmap-heading" className={styles.sectionTitle}>
                Engineering roadmap
              </h2>
              <span className={styles.sectionTally}>
                {completedTopics} of {totalTopics} topics completed
              </span>
            </div>

            {toggleTopic.isError ? (
              <p role="alert" className={styles.inlineAlert}>
                The change could not be saved. Your input is retained; retry the action.
              </p>
            ) : null}

            {isLoading ? (
              <div className={styles.stageGrid} aria-label="Loading curriculum">
                <Skeleton className="h-56 w-full rounded-card" />
                <Skeleton className="h-56 w-full rounded-card" />
              </div>
            ) : roadmap.length === 0 ? (
              <FeatureEmptyState
                title="No roadmap topics yet."
                description="Your saved curriculum will appear here."
              />
            ) : (
              <div className={styles.stageGrid}>
                {roadmap.map((stage) => {
                  const isActiveStage = stage.status === 'in_progress';
                  const statusMeta = STAGE_STATUS_META[stage.status];
                  const statusClass =
                    stage.status === 'completed'
                      ? cn(styles.statusCompleted, 'text-text-notif-completed')
                      : stage.status === 'in_progress'
                        ? styles.statusInProgress
                        : styles.statusUpcoming;

                  return (
                    <section
                      key={stage.id}
                      aria-labelledby={`stage-title-${stage.id}`}
                      className={cn(styles.stageCard, isActiveStage && styles.stageCardActive)}
                    >
                      <div className={styles.stageTop}>
                        <span className={styles.stageOrder}>Stage {stage.order}</span>
                        <span className={cn(styles.stageStatusPill, statusClass)}>
                          {statusMeta.icon}
                          <span>{statusMeta.label}</span>
                        </span>
                      </div>

                      <h3 id={`stage-title-${stage.id}`} className={styles.stageTitle}>
                        {stage.title}
                      </h3>
                      <p className={styles.stageDesc}>{stage.description}</p>

                      <div className={styles.topicList}>
                        {stage.topics.map((topic) => (
                          <div
                            key={topic.id}
                            className={cn(
                              styles.topicItem,
                              topic.completed && styles.topicItemDone,
                            )}
                          >
                            <Checkbox
                              checked={topic.completed}
                              onCheckedChange={() => handleToggle(stage.id, topic.id)}
                              aria-label={`Toggle topic ${topic.name}`}
                              disabled={toggleTopic.isPending}
                              className={styles.topicCheckbox}
                            />
                            <span
                              className={cn(
                                styles.topicName,
                                topic.completed && styles.topicNameDone,
                              )}
                            >
                              {topic.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </section>

          {/* Valley River Contours Divider */}
          <div className={styles.contourDivider} aria-hidden="true">
            <Image
              src="/visuals/ai-engineering/valley-river-contours.svg"
              alt=""
              aria-hidden="true"
              width={720}
              height={100}
              unoptimized
              className={styles.contourDividerArt}
            />
          </div>

          {/* Local Notes & Research Shelf */}
          <section aria-labelledby="notes-heading" className={styles.notesSection}>
            <div className={styles.sectionHeader}>
              <h2 id="notes-heading" className={styles.sectionTitle}>
                Local notes &amp; research
              </h2>
              <span className={styles.sectionTally}>
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </span>
            </div>

            {isLoading ? (
              <div className={styles.notesGrid} aria-label="Loading notes">
                <Skeleton className="h-44 w-full rounded-item" />
                <Skeleton className="h-44 w-full rounded-item" />
                <Skeleton className="h-44 w-full rounded-item" />
              </div>
            ) : notes.length === 0 ? (
              <FeatureEmptyState
                title="No local research notes yet."
                description="Synced notes along your learning trail will appear here."
              />
            ) : (
              <div className={styles.notesGrid}>
                {notes.map((note) => (
                  <article key={note.id} className={styles.noteCard}>
                    <div className={styles.noteCardBody}>
                      <span className={styles.noteTopicTag}>{note.topic}</span>
                      <h3 className={styles.noteTitle}>{note.title}</h3>
                      <p className={styles.noteSummary}>{note.summary}</p>
                    </div>

                    <div className={styles.noteFooter}>
                      <span className={styles.noteSyncMeta}>
                        Saved {formatNoteSyncDate(note.lastSyncedAt)}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        aria-label={`Read note: ${note.title}`}
                        rightIcon={<ArrowUpRight size={14} strokeWidth={1.6} aria-hidden="true" />}
                        onClick={() => setActiveNote(note)}
                      >
                        Read note
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}

      {/* Clean Note Reader Dialog */}
      {activeNote ? (
        <Dialog
          open
          portal
          title={activeNote.title}
          className="max-w-2xl max-h-[90svh] overflow-y-auto"
          onClose={() => setActiveNote(null)}
          footer={
            <>
              {activeNote.notionSourceUrl ? (
                <a
                  href={activeNote.notionSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.notionOutboundLink}
                >
                  <span>Open original in Notion</span>
                  <ExternalLink size={14} strokeWidth={1.6} aria-hidden="true" />
                </a>
              ) : null}
              <Button variant="secondary" onClick={() => setActiveNote(null)}>
                Close
              </Button>
            </>
          }
        >
          <div className={styles.readerBody}>
            <div className={styles.readerMeta}>
              <span>
                Topic: <strong className={styles.readerMetaTopic}>{activeNote.topic}</strong>
              </span>
              <span>Synced {formatNoteSyncDate(activeNote.lastSyncedAt)}</span>
            </div>

            {activeNote.keyTakeaways.length > 0 ? (
              <div className={styles.takeawaysBox}>
                <h3 className={styles.takeawaysHeading}>Key takeaways</h3>
                <ul className={styles.takeawaysList}>
                  {activeNote.keyTakeaways.map((takeaway) => (
                    <li key={`${activeNote.id}-${takeaway}`}>{takeaway}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className={styles.readerArticle}>
              {renderReadingBlocks(activeNote.readingContent, activeNote.id)}
            </div>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}

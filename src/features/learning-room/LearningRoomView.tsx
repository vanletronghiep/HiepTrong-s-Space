'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Check, Eye, EyeOff, Pause, Play, RotateCcw, Sprout } from 'lucide-react';
import Image from 'next/image';
import { useCreateLearningSession, useLearningRoomData } from '@/client/queries/learning-room';
import type { FocusMode } from '@/contracts/learning-room';
import { DEFAULT_APP_TIMEZONE } from '@/domain/time';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Dialog } from '@/ui/Dialog';
import { EmptyState } from '@/ui/EmptyState';
import { FormattedNoteContent } from '@/ui/FormattedNoteContent';
import { RichNoteEditor } from '@/ui/RichNoteEditor';
import { Skeleton } from '@/ui/Skeleton';
import styles from './learning-room.module.css';

const PRESETS: Record<FocusMode, { label: string; minutes: number }> = {
  pomodoro: { label: 'Pomodoro (25m)', minutes: 25 },
  deep_focus: { label: 'Deep focus (50m)', minutes: 50 },
  quick_review: { label: 'Quick review (15m)', minutes: 15 },
};

const SUBJECTS = ['Calculus I', 'CS160', 'CM102', 'Physics I', 'AI Engineering', 'General'];

function parseDateOnlyInAppTimezone(dateStr: string): Date | null {
  const isoCandidate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T12:00:00+07:00` : dateStr;
  const parsed = new Date(isoCandidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatChartWeekday(dateStr: string): string {
  const parsed = parseDateOnlyInAppTimezone(dateStr);
  if (!parsed) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: DEFAULT_APP_TIMEZONE,
  }).format(parsed);
}

function formatChartDate(dateStr: string): string {
  const parsed = parseDateOnlyInAppTimezone(dateStr);
  if (!parsed) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: DEFAULT_APP_TIMEZONE,
  }).format(parsed);
}

function formatSessionDate(startedAt: string): string {
  const parsed = new Date(startedAt);
  if (Number.isNaN(parsed.getTime())) return startedAt;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: DEFAULT_APP_TIMEZONE,
  }).format(parsed);
}

export function LearningRoomView() {
  const writeLocks = useRef(new Set<string>());
  const [selectedMode, setSelectedMode] = useState<FocusMode>('pomodoro');
  const [selectedSubject, setSelectedSubject] = useState<string>('Calculus I');
  const [intentionTitle, setIntentionTitle] = useState<string>('');
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  // Timer states
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);

  // Post session modal
  const [showReflectionModal, setShowReflectionModal] = useState<boolean>(false);
  const [reflectionNotes, setReflectionNotes] = useState<string>('');
  const [rating, setRating] = useState<number>(5);

  const subjectGroupLabelId = useId();
  const intentionInputId = useId();
  const reflectionRatingLabelId = useId();
  const reflectionTextareaId = useId();
  const firstStarRef = useRef<HTMLButtonElement>(null);

  // Queries & Mutations
  const { data, isLoading, isError: loadFailed, refetch } = useLearningRoomData();
  const createSession = useCreateLearningSession();

  const startedAt = useRef<number | null>(null);
  const finishedAt = useRef<number | null>(null);
  const pausedAt = useRef<number | null>(null);
  const pausedMs = useRef(0);
  const breakStartedAt = useRef<number | null>(null);
  const breakPausedMs = useRef(0);
  const deadline = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Switch mode
  const handleSelectMode = (mode: FocusMode) => {
    if (isActive) return;
    setSelectedMode(mode);
    const secs = PRESETS[mode].minutes * 60;
    setSecondsRemaining(secs);
    setTotalSeconds(secs);
    setIsBreak(false);
  };

  // Timer tick
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        if (now < deadline.current) {
          setSecondsRemaining(Math.ceil((deadline.current - now) / 1000));
          return;
        }
        if (!isBreak) {
          breakStartedAt.current = deadline.current;
          deadline.current += 5 * 60 * 1000;
          setIsBreak(true);
          setTotalSeconds(5 * 60);
          if (now < deadline.current) {
            setSecondsRemaining(Math.ceil((deadline.current - now) / 1000));
            return;
          }
        }
        clearInterval(timerRef.current!);
        finishedAt.current = deadline.current;
        setIsActive(false);
        setShowReflectionModal(true);
        setSecondsRemaining(0);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, isBreak, selectedMode]);

  const handleStart = () => {
    createSession.reset?.();
    startedAt.current = Date.now();
    finishedAt.current = null;
    pausedMs.current = 0;
    breakStartedAt.current = null;
    breakPausedMs.current = 0;
    pausedAt.current = null;
    deadline.current = Date.now() + secondsRemaining * 1000;
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    pausedAt.current = Date.now();
    setIsPaused(true);
  };

  const handleResume = () => {
    const pause = pausedAt.current === null ? 0 : Date.now() - pausedAt.current;
    pausedMs.current += pause;
    if (isBreak) breakPausedMs.current += pause;
    deadline.current += pause;
    pausedAt.current = null;
    setIsPaused(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setIsBreak(false);
    const secs = PRESETS[selectedMode].minutes * 60;
    setSecondsRemaining(secs);
    setTotalSeconds(secs);
  };

  const handleFinishEarly = () => {
    createSession.reset?.();
    finishedAt.current = Date.now();
    if (pausedAt.current !== null) {
      const pause = Date.now() - pausedAt.current;
      pausedMs.current += pause;
      if (isBreak) breakPausedMs.current += pause;
      pausedAt.current = null;
    }
    setIsActive(false);
    setIsPaused(false);
    setShowReflectionModal(true);
  };

  const handleSaveReflection = async () => {
    if (createSession.isPending) return;
    const end = finishedAt.current ?? Date.now();
    const start = startedAt.current ?? end;
    const breakMinutes =
      breakStartedAt.current === null
        ? 0
        : Math.max(0, (end - breakStartedAt.current - breakPausedMs.current) / 60000);
    const elapsedMinutes = Math.max(0, (end - start - pausedMs.current) / 60000 - breakMinutes);
    if (writeLocks.current.has('createSession')) return;
    writeLocks.current.add('createSession');
    try {
      await createSession.mutateAsync({
        title: intentionTitle.trim() || `${selectedSubject} - Focused session`,
        mode: selectedMode,
        targetSubject: selectedSubject,
        durationMinutes: Math.max(0.001, (end - start) / 60000),
        startedAt: new Date(start).toISOString(),
        completedAt: new Date(end).toISOString(),
        focusMinutes: elapsedMinutes,
        breakMinutes,
        pausedMinutes: pausedMs.current / 60000,
        reflectionNotes: reflectionNotes.trim(),
        rating,
        status: 'completed',
      });
    } catch {
      return;
    } finally {
      writeLocks.current.delete('createSession');
    }

    setShowReflectionModal(false);
    setReflectionNotes('');
    handleReset();
  };

  // Format MM:SS
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // SVG ring calculation
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = totalSeconds > 0 ? (totalSeconds - secondsRemaining) / totalSeconds : 0;
  const strokeDashoffset = circumference * (1 - progressPercent);

  const stats = data?.stats;
  const sessions = data?.sessions ?? [];
  const maxDailyMinutes = Math.max(60, ...(stats?.dailyHistory.map((h) => h.focusMinutes) ?? []));

  return (
    <div className={styles.pageStack}>
      <Image
        src="/visuals/learning-room/bamboo-screen-edge.svg"
        alt=""
        aria-hidden="true"
        width={200}
        height={480}
        loading="eager"
        unoptimized
        className={styles.bambooEdgeDecor}
      />

      {/* Editorial Bonsai Timer Sanctuary Masthead (hidden in quiet view) */}
      {!isZenMode && (
        <header className={styles.masthead} aria-labelledby="learning-page-heading">
          <Image
            src="/visuals/learning-room/bonsai-on-a-stone.svg"
            alt=""
            aria-hidden="true"
            width={480}
            height={300}
            loading="eager"
            unoptimized
            className={styles.bonsaiMastheadArt}
          />

          <div className={styles.mastheadText}>
            <div className={styles.eyebrow}>
              <Sprout size={14} strokeWidth={1.6} aria-hidden="true" />
              <span>Bonsai timer sanctuary · Deep work</span>
            </div>

            <h1 id="learning-page-heading" className={styles.displayTitle}>
              Learning <span className={styles.displayTitleEmphasis}>Room</span>
            </h1>
            <p className={styles.mastheadSubtitle}>
              A distraction-free space for deliberate study. Choose an intention, set your cadence,
              and immerse yourself in deep work.
            </p>
          </div>
        </header>
      )}

      {/* Non-blocking load failure banner: timer remains fully usable offline */}
      {loadFailed ? (
        <div role="alert" className={styles.alertBanner}>
          <span className={styles.alertMessageGroup}>
            <AlertTriangle size={16} strokeWidth={1.6} aria-hidden="true" />
            <span>
              Could not load past study history. The focus timer remains ready for offline study.
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

      {/* Main Focus Timer Sanctuary Card */}
      <section
        aria-labelledby="timer-heading"
        className={cn(styles.timerCard, isZenMode && styles.timerCardZen)}
      >
        <div className={styles.timerCardHeader}>
          <h2 id="timer-heading" className={styles.cardTitle}>
            {isBreak ? 'Short break' : 'Active focus session'}
          </h2>

          <Button
            variant="secondary"
            size="sm"
            pill
            className={styles.zenToggleBtn}
            aria-pressed={isZenMode}
            leftIcon={
              isZenMode ? (
                <Eye size={14} strokeWidth={1.6} aria-hidden="true" />
              ) : (
                <EyeOff size={14} strokeWidth={1.6} aria-hidden="true" />
              )
            }
            onClick={() => setIsZenMode(!isZenMode)}
          >
            {isZenMode ? 'Exit quiet view' : 'Quiet focus view'}
          </Button>
        </div>

        {/* Mode Selector (disabled during active timer) */}
        <div className={styles.modeTabs} role="group" aria-label="Session duration mode">
          {(Object.keys(PRESETS) as FocusMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={selectedMode === mode}
              className={cn(styles.modeTabBtn, selectedMode === mode && styles.modeTabBtnActive)}
              onClick={() => handleSelectMode(mode)}
              disabled={isActive}
            >
              {PRESETS[mode].label}
            </button>
          ))}
        </div>

        {/* Clock Ring + Enso Halo */}
        <div className={styles.clockWrapper}>
          <Image
            src="/visuals/learning-room/enso-and-pebble.svg"
            alt=""
            aria-hidden="true"
            width={360}
            height={360}
            unoptimized
            className={cn(styles.ensoHalo, isActive && !isPaused && styles.ensoHaloActive)}
          />

          <svg className={styles.timerSvgRing} viewBox="0 0 220 220" aria-hidden="true">
            <circle
              className={styles.timerTrack}
              cx="110"
              cy="110"
              r={radius}
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              className={styles.timerProgress}
              cx="110"
              cy="110"
              r={radius}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          <div className={styles.clockCenter}>
            <div
              className={styles.clockDigits}
              role="timer"
              aria-label="Time remaining"
              aria-live="off"
            >
              {timeFormatted}
            </div>
            <div className={styles.clockPhaseLabel} role="status">
              {showReflectionModal
                ? 'Session finished'
                : isPaused
                  ? 'Paused'
                  : isBreak
                    ? 'Rest & recharge'
                    : `${selectedSubject} · Focus`}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className={styles.timerControls}>
          {!isActive ? (
            <Button
              variant="primary"
              pill
              leftIcon={<Play size={16} strokeWidth={2} aria-hidden="true" />}
              onClick={handleStart}
            >
              Begin focus
            </Button>
          ) : isPaused ? (
            <>
              <Button
                variant="primary"
                pill
                leftIcon={<Play size={16} strokeWidth={2} aria-hidden="true" />}
                onClick={handleResume}
              >
                Resume
              </Button>
              <Button
                variant="secondary"
                pill
                leftIcon={<RotateCcw size={15} strokeWidth={1.8} aria-hidden="true" />}
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button
                variant="secondary"
                pill
                leftIcon={<Check size={15} strokeWidth={1.8} aria-hidden="true" />}
                onClick={handleFinishEarly}
              >
                Log &amp; finish
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                pill
                leftIcon={<Pause size={16} strokeWidth={2} aria-hidden="true" />}
                onClick={handlePause}
              >
                Pause
              </Button>
              <Button
                variant="secondary"
                pill
                leftIcon={<Check size={15} strokeWidth={1.8} aria-hidden="true" />}
                onClick={handleFinishEarly}
              >
                Log &amp; finish
              </Button>
            </>
          )}
        </div>

        {/* Intention & Subject picker */}
        {!isZenMode && (
          <div className={styles.intentionRow}>
            <div className={styles.subjectField}>
              <span id={subjectGroupLabelId} className={styles.intentionLabel}>
                Study subject
              </span>
              <div
                className={styles.subjectPills}
                role="group"
                aria-labelledby={subjectGroupLabelId}
              >
                {SUBJECTS.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    className={cn(
                      styles.subjectPill,
                      selectedSubject === sub && styles.subjectPillActive,
                    )}
                    aria-pressed={selectedSubject === sub}
                    onClick={() => setSelectedSubject(sub)}
                    disabled={isActive}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.intentionField}>
              <label htmlFor={intentionInputId} className={styles.intentionLabel}>
                Session intention
              </label>
              <input
                id={intentionInputId}
                type="text"
                className={styles.intentionInput}
                placeholder="What are you focusing on during this session?"
                value={intentionTitle}
                onChange={(e) => setIntentionTitle(e.target.value)}
                disabled={isActive}
              />
            </div>
          </div>
        )}
      </section>

      {/* Analytics & Logbook (hidden in quiet view) */}
      {!isZenMode && (
        <>
          <div className={styles.bambooDividerWrap} aria-hidden="true">
            <Image
              src="/visuals/learning-room/bamboo-interval.svg"
              alt=""
              aria-hidden="true"
              width={720}
              height={100}
              unoptimized
              className={styles.bambooDivider}
            />
          </div>

          {/* Stats Summary Cards */}
          <section aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="sr-only">
              Focus statistics
            </h2>
            {isLoading ? (
              <div className={styles.statsGrid} aria-label="Loading focus statistics">
                <Skeleton className="h-[84px] w-full rounded-item" />
                <Skeleton className="h-[84px] w-full rounded-item" />
                <Skeleton className="h-[84px] w-full rounded-item" />
                <Skeleton className="h-[84px] w-full rounded-item" />
              </div>
            ) : (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>
                    {Math.round(((stats?.totalFocusMinutes ?? 0) / 60) * 10) / 10} hrs
                  </div>
                  <div className={styles.statLabel}>Total focus time</div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statValue}>{stats?.completedSessions ?? 0}</div>
                  <div className={styles.statLabel}>Completed sessions</div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statValue}>
                    {stats?.streakDays ?? 0} {stats?.streakDays === 1 ? 'day' : 'days'}
                  </div>
                  <div className={styles.statLabel}>Study streak</div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statValue}>
                    {stats?.totalStudyMinutes
                      ? `${Math.round((stats.totalFocusMinutes / stats.totalStudyMinutes) * 100)}%`
                      : '100%'}
                  </div>
                  <div className={styles.statLabel}>Focus efficiency</div>
                </div>
              </div>
            )}
          </section>

          {/* Charts Row */}
          <section className={styles.analyticsRow} aria-labelledby="analytics-heading">
            {/* Daily History Bar Chart */}
            <div className={styles.chartCard}>
              <h3 id="analytics-heading" className={styles.cardTitle}>
                7-day study pattern
              </h3>

              {isLoading ? (
                <div className="space-y-2.5" aria-label="Loading 7-day study pattern">
                  <Skeleton className="h-32 w-full rounded-item" />
                  <Skeleton className="h-4 w-3/4 rounded-item" />
                </div>
              ) : !stats?.dailyHistory.length ? (
                <p className={styles.quietEmptyCue}>
                  Complete a session to trace your 7-day study cadence.
                </p>
              ) : (
                <ul className={styles.barChart} aria-label="7-day study pattern">
                  {stats.dailyHistory.map((d) => {
                    const heightPercent = Math.min(
                      100,
                      Math.round((d.focusMinutes / maxDailyMinutes) * 100),
                    );
                    const dayName = formatChartWeekday(d.date);
                    const fullDate = formatChartDate(d.date);
                    const roundedMinutes = Math.round(d.focusMinutes);

                    return (
                      <li
                        key={d.date}
                        className={styles.barCol}
                        title={`${fullDate} (${dayName}): ${roundedMinutes} focus mins`}
                      >
                        <span className={styles.barMinutes}>{roundedMinutes}m</span>
                        <div className={styles.barTrack} aria-hidden="true">
                          <div
                            className={styles.barPillar}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        <span className={styles.barLabel}>
                          {dayName}
                          <span className="sr-only"> ({fullDate})</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Subject Distribution */}
            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Subject distribution</h3>
              {isLoading ? (
                <div className="space-y-3" aria-label="Loading subject distribution">
                  <Skeleton className="h-6 w-full rounded-item" />
                  <Skeleton className="h-6 w-full rounded-item" />
                  <Skeleton className="h-6 w-4/5 rounded-item" />
                </div>
              ) : !stats?.subjectBreakdown.length ? (
                <p className={styles.quietEmptyCue}>
                  Subject distribution will appear after your first logged session.
                </p>
              ) : (
                <div className={styles.subjectList}>
                  {stats.subjectBreakdown.map((item) => (
                    <div key={item.subject} className={styles.subjectRow}>
                      <div className={styles.subjectMeta}>
                        <span>{item.subject}</span>
                        <span>
                          {Math.round(item.minutes)}m ({item.percentage}%)
                        </span>
                      </div>
                      <div className={styles.subjectBarTrack}>
                        <div
                          className={styles.subjectBarFill}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Recent History Feed */}
          <section className={styles.historyCard} aria-labelledby="history-heading">
            <h3 id="history-heading" className={styles.cardTitle}>
              Recent study sessions
            </h3>

            {isLoading ? (
              <div className="space-y-3" aria-label="Loading recent study sessions">
                <Skeleton className="h-16 w-full rounded-item" />
                <Skeleton className="h-16 w-full rounded-item" />
                <Skeleton className="h-16 w-full rounded-item" />
              </div>
            ) : sessions.length === 0 ? (
              <div role="status" className={styles.emptyStateWrap}>
                <EmptyState
                  compact
                  title="No recorded sessions yet."
                  description="Begin a focus timer above to log your first reflection."
                />
              </div>
            ) : (
              <div className={styles.historyList}>
                {sessions.slice(0, 5).map((s) => (
                  <div key={s.id} className={styles.historyItem}>
                    <div>
                      <h4 className={styles.historyTitle}>{s.title}</h4>
                      {s.reflectionNotes ? (
                        <FormattedNoteContent
                          value={s.reflectionNotes}
                          className={styles.historyNotes}
                        />
                      ) : null}
                      <div className={styles.historyMeta}>
                        <span>{s.targetSubject}</span>
                        <span aria-hidden="true">·</span>
                        <span>{Math.round(s.focusMinutes * 10) / 10} mins</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatSessionDate(s.startedAt)}</span>
                      </div>
                    </div>

                    <div
                      className={cn(styles.starRating, 'text-text-due-soon')}
                      aria-label={`Rating: ${s.rating} out of 5 stars`}
                    >
                      {'★'.repeat(s.rating)}
                      {'☆'.repeat(5 - s.rating)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Compact Session Reflection Dialog (NEVER expanded to LargeEditorDialog) */}
      {showReflectionModal && (
        <Dialog
          open
          portal
          initialFocusRef={firstStarRef}
          className="max-w-[440px] max-h-[90svh] overflow-y-auto"
          title="Session reflection"
          description="Capture your focus rating and key takeaways before saving to your logbook."
          onClose={() => void handleSaveReflection()}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  void handleSaveReflection();
                }}
              >
                Skip notes
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  void handleSaveReflection();
                }}
                disabled={createSession.isPending}
              >
                {createSession.isPending ? 'Saving...' : 'Save to logbook'}
              </Button>
            </>
          }
        >
          <div className={styles.reflectionForm}>
            <div>
              <p id={reflectionRatingLabelId} className={styles.fieldLabel}>
                How focused was your study time?
              </p>
              <div
                className={styles.ratingPicker}
                role="radiogroup"
                aria-labelledby={reflectionRatingLabelId}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    ref={star === 1 ? firstStarRef : undefined}
                    type="button"
                    className={cn(
                      styles.starBtn,
                      rating >= star && cn(styles.starBtnActive, 'text-text-due-soon'),
                    )}
                    onClick={() => setRating(star)}
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor={reflectionTextareaId} className={styles.fieldLabel}>
                Key insights or notes from this session:
              </label>
              <RichNoteEditor
                id={reflectionTextareaId}
                ariaLabel="Key insights or notes from this session:"
                placeholder="What did you learn? Which problems were solved?"
                value={reflectionNotes}
                onChange={setReflectionNotes}
                minHeightClassName="min-h-[96px]"
              />
            </div>

            {createSession.isError ? (
              <p role="alert" className={styles.inlineAlert}>
                Could not save this session. Your notes are retained; retry saving.
              </p>
            ) : null}
          </div>
        </Dialog>
      )}
    </div>
  );
}

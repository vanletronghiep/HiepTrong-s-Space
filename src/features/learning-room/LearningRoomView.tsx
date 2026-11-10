'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import type { FocusMode } from '@/contracts/learning-room';
import { useCreateLearningSession, useLearningRoomData } from '@/client/queries/learning-room';
import styles from './learning-room.module.css';

const PRESETS: Record<FocusMode, { label: string; minutes: number }> = {
  pomodoro: { label: 'Pomodoro (25m)', minutes: 25 },
  deep_focus: { label: 'Deep focus (50m)', minutes: 50 },
  quick_review: { label: 'Quick review (15m)', minutes: 15 },
};

const SUBJECTS = [
  'Calculus I',
  'CS160',
  'CM102',
  'Physics I',
  'AI Engineering',
  'General',
];

export function LearningRoomView() {
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

  const intentionInputId = useId();
  const reflectionTextareaId = useId();

  // Queries & Mutations
  const { data, isLoading } = useLearningRoomData();
  const createSession = useCreateLearningSession();

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
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsActive(false);
            if (!isBreak) {
              // Focus ended -> show reflection
              setShowReflectionModal(true);
            } else {
              // Break ended -> reset to focus
              setIsBreak(false);
              const secs = PRESETS[selectedMode].minutes * 60;
              setSecondsRemaining(secs);
              setTotalSeconds(secs);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, isBreak, selectedMode]);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
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
    setIsActive(false);
    setIsPaused(false);
    setShowReflectionModal(true);
  };

  const handleSaveReflection = async () => {
    const elapsedMinutes = Math.max(1, Math.round((totalSeconds - secondsRemaining) / 60));
    await createSession.mutateAsync({
      title: intentionTitle.trim() || `${selectedSubject} - Focused session`,
      mode: selectedMode,
      targetSubject: selectedSubject,
      durationMinutes: PRESETS[selectedMode].minutes,
      focusMinutes: elapsedMinutes,
      breakMinutes: 5,
      pausedMinutes: 0,
      reflectionNotes: reflectionNotes.trim(),
      rating,
      status: 'completed',
    });

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

  return (
    <div className={styles.container}>
      {/* Header (hidden in zen mode for deep calm) */}
      {!isZenMode && (
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
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Focused study sanctuary</span>
          </div>

          <h1 className={styles.title}>Learning Room</h1>
          <p className={styles.description}>
            A distraction-free space for deliberate study. Choose an intention, set your cadence, and
            immerse yourself in deep work.
          </p>
        </header>
      )}

      {/* Main Focus Timer Card */}
      <section
        aria-labelledby="timer-heading"
        className={`${styles.timerCard} ${isZenMode ? styles.timerCardZen : ''}`}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <h2 id="timer-heading" className={styles.cardTitle} style={{ margin: 0 }}>
            {isBreak ? 'Short break' : 'Active focus session'}
          </h2>

          <button
            type="button"
            className={styles.zenToggle}
            onClick={() => setIsZenMode(!isZenMode)}
            aria-pressed={isZenMode}
          >
            <span>{isZenMode ? 'Exit quiet view' : 'Quiet focus view'}</span>
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
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* Mode Selector (disabled during active timer) */}
        <div className={styles.modeTabs} role="tablist" aria-label="Session duration mode">
          {(Object.keys(PRESETS) as FocusMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={selectedMode === mode}
              className={`${styles.modeTabBtn} ${selectedMode === mode ? styles.modeTabBtnActive : ''}`}
              onClick={() => handleSelectMode(mode)}
              disabled={isActive}
            >
              {PRESETS[mode].label}
            </button>
          ))}
        </div>

        {/* Intention & Subject picker */}
        {!isZenMode && (
          <div className={styles.intentionRow}>
            <span className={styles.intentionLabel}>Study subject & intention:</span>
            <div className={styles.subjectPills}>
              {SUBJECTS.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  className={`${styles.subjectPill} ${selectedSubject === sub ? styles.subjectPillActive : ''}`}
                  onClick={() => setSelectedSubject(sub)}
                  disabled={isActive}
                >
                  {sub}
                </button>
              ))}
            </div>

            <input
              id={intentionInputId}
              type="text"
              className={styles.intentionInput}
              placeholder="What are you focusing on during this session?"
              value={intentionTitle}
              onChange={(e) => setIntentionTitle(e.target.value)}
              disabled={isActive}
              aria-label="Study session title"
            />
          </div>
        )}

        {/* Clock Ring */}
        <div className={styles.clockWrapper}>
          <svg className={styles.timerSvgRing} viewBox="0 0 220 220">
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
            <div className={styles.clockDigits}>{timeFormatted}</div>
            <div className={styles.clockPhaseLabel}>
              {isBreak ? 'Rest & Recharge' : `${selectedSubject} · Focus`}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className={styles.timerControls}>
          {!isActive ? (
            <button type="button" className={styles.primaryBtn} onClick={handleStart}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Begin focus</span>
            </button>
          ) : isPaused ? (
            <>
              <button type="button" className={styles.primaryBtn} onClick={handleResume}>
                <span>Resume</span>
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={handleReset}>
                <span>Reset</span>
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={handleFinishEarly}>
                <span>Log & finish</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.primaryBtn} onClick={handlePause}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                <span>Pause</span>
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={handleFinishEarly}>
                <span>Log & finish</span>
              </button>
            </>
          )}
        </div>
      </section>

      {/* Analytics & Stats (only shown outside zen mode) */}
      {!isZenMode && (
        <>
          {/* Stats Summary Cards */}
          <section aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="sr-only">
              Focus statistics
            </h2>
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
                <div className={styles.statValue}>{stats?.streakDays ?? 5} days</div>
                <div className={styles.statLabel}>Study streak</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {stats?.totalStudyMinutes
                    ? `${Math.round(((stats.totalFocusMinutes) / stats.totalStudyMinutes) * 100)}%`
                    : '100%'}
                </div>
                <div className={styles.statLabel}>Focus efficiency</div>
              </div>
            </div>
          </section>

          {/* Charts Row */}
          <section className={styles.analyticsRow} aria-labelledby="analytics-heading">
            {/* Daily History Bar Chart */}
            <div className={styles.chartCard}>
              <h3 id="analytics-heading" className={styles.cardTitle}>
                7-day study pattern
              </h3>

              <div className={styles.barChart}>
                {stats?.dailyHistory.map((d) => {
                  const maxMinutes = Math.max(
                    60,
                    ...(stats.dailyHistory.map((h) => h.focusMinutes)),
                  );
                  const heightPercent = Math.min(100, Math.round((d.focusMinutes / maxMinutes) * 100));
                  const dayName = new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' });

                  return (
                    <div key={d.date} className={styles.barCol}>
                      <div
                        className={styles.barPillar}
                        style={{ height: `${heightPercent}%` }}
                        title={`${d.date}: ${d.focusMinutes} focus mins`}
                      />
                      <span className={styles.barLabel}>{dayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subject Distribution */}
            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Subject distribution</h3>
              <div className={styles.subjectList}>
                {stats?.subjectBreakdown.map((item) => (
                  <div key={item.subject} className={styles.subjectRow}>
                    <div className={styles.subjectMeta}>
                      <span>{item.subject}</span>
                      <span>
                        {item.minutes}m ({item.percentage}%)
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
            </div>
          </section>

          {/* Recent History Feed */}
          <section className={styles.historyCard} aria-labelledby="history-heading">
            <h3 id="history-heading" className={styles.cardTitle}>
              Recent study sessions
            </h3>

            {isLoading ? (
              <div style={{ color: 'var(--ws-text-muted)', fontSize: 'var(--text-sm)' }}>
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ color: 'var(--ws-text-muted)', fontSize: 'var(--text-sm)' }}>
                No recorded sessions yet. Begin your first focus block above.
              </div>
            ) : (
              <div className={styles.historyList}>
                {sessions.slice(0, 5).map((s) => (
                  <div key={s.id} className={styles.historyItem}>
                    <div>
                      <h4 className={styles.historyTitle}>{s.title}</h4>
                      {s.reflectionNotes && (
                        <p className={styles.historyNotes}>{s.reflectionNotes}</p>
                      )}
                      <div className={styles.historyMeta}>
                        <span>{s.targetSubject}</span>
                        <span>·</span>
                        <span>{s.focusMinutes} mins</span>
                        <span>·</span>
                        <span>
                          {new Date(s.startedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className={styles.starRating} aria-label={`Rating: ${s.rating} stars`}>
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

      {/* Reflection & Logging Modal */}
      {showReflectionModal && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reflection-modal-title"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 id="reflection-modal-title" className={styles.modalTitle}>
                Session reflection
              </h3>
            </div>

            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: 'var(--text-xs)', color: 'var(--ws-text-muted)' }}>
                How focused was your study time?
              </p>
              <div className={styles.ratingPicker} role="radiogroup" aria-label="Rate your focus">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`${styles.starBtn} ${rating >= star ? styles.starBtnActive : ''}`}
                    onClick={() => setRating(star)}
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} star`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor={reflectionTextareaId}
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--ws-text-muted)',
                }}
              >
                Key insights or notes from this session:
              </label>
              <textarea
                id={reflectionTextareaId}
                className={styles.textarea}
                placeholder="What did you learn? Which problems were solved?"
                value={reflectionNotes}
                onChange={(e) => setReflectionNotes(e.target.value)}
              />
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  setShowReflectionModal(false);
                  handleReset();
                }}
              >
                Skip notes
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleSaveReflection}
                disabled={createSession.isPending}
              >
                {createSession.isPending ? 'Saving...' : 'Save to logbook'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


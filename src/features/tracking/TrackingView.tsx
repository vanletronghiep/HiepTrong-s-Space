'use client';

import { Dialog } from '@/ui/Dialog';

import { formatScheduledDate } from '@/domain/time';

import React, { useRef, useState, useId } from 'react';
import type { HabitCategory } from '@/contracts/tracking';
import {
  useCreateHabit,
  useLogScreenTime,
  useLogSleep,
  useToggleHabit,
  useTrackingData,
} from '@/client/queries/tracking';
import styles from './tracking.module.css';

export function TrackingView() {
  const writeLocks = useRef(new Set<string>());
  const todayStr = formatScheduledDate(new Date());

  // Modals state
  const [showAddHabit, setShowAddHabit] = useState<boolean>(false);
  const [showLogSleep, setShowLogSleep] = useState<boolean>(false);
  const [showLogScreenTime, setShowLogScreenTime] = useState<boolean>(false);

  // Add habit inputs
  const [habitTitle, setHabitTitle] = useState<string>('');
  const [habitCategory, setHabitCategory] = useState<HabitCategory>('routine');

  // Log sleep inputs
  const [sleepBedTime, setSleepBedTime] = useState<string>('23:00');
  const [sleepWakeTime, setSleepWakeTime] = useState<string>('06:30');
  const [sleepDuration, setSleepDuration] = useState<number>(7.5);
  const [sleepRating, setSleepRating] = useState<number>(5);
  const [sleepNotes, setSleepNotes] = useState<string>('');

  // Log screen time inputs
  const [scrProductive, setScrProductive] = useState<number>(240);
  const [scrLeisure, setScrLeisure] = useState<number>(60);
  const [scrNotes, setScrNotes] = useState<string>('');

  const habitTitleId = useId();
  const habitCategoryId = useId();
  const sleepBedTimeId = useId();
  const sleepWakeTimeId = useId();
  const sleepDurationId = useId();
  const sleepRatingId = useId();
  const sleepNotesId = useId();
  const scrProdId = useId();
  const scrLeisureId = useId();
  const scrNotesId = useId();

  // Queries & Mutations
  const { data, isLoading, isError: loadFailed, refetch } = useTrackingData();
  const toggleHabit = useToggleHabit();
  const createHabit = useCreateHabit();
  const logSleep = useLogSleep();
  const logScreenTime = useLogScreenTime();

  const handleToggleHabit = (habitId: string) => {
    toggleHabit.mutate({ habitId, date: todayStr });
  };

  const handleCreateHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;
    if (writeLocks.current.has('createHabit')) return;
    writeLocks.current.add('createHabit');
    try {
      await createHabit.mutateAsync({
        title: habitTitle.trim(),
        category: habitCategory,
        targetFrequency: 'daily',
      });
    } catch {
      return;
    } finally {
      writeLocks.current.delete('createHabit');
    }
    setHabitTitle('');
    setShowAddHabit(false);
  };

  const handleLogSleepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (writeLocks.current.has('logSleep')) return;
    writeLocks.current.add('logSleep');
    try {
      await logSleep.mutateAsync({
        date: todayStr,
        bedTime: sleepBedTime,
        wakeTime: sleepWakeTime,
        durationHours: Number(sleepDuration),
        qualityRating: Number(sleepRating),
        notes: sleepNotes.trim(),
      });
    } catch {
      return;
    } finally {
      writeLocks.current.delete('logSleep');
    }
    setShowLogSleep(false);
    setSleepNotes('');
  };

  const handleLogScreenTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = Number(scrProductive);
    const leis = Number(scrLeisure);
    if (writeLocks.current.has('logScreenTime')) return;
    writeLocks.current.add('logScreenTime');
    try {
      await logScreenTime.mutateAsync({
        date: todayStr,
        totalMinutes: prod + leis,
        productiveMinutes: prod,
        leisureMinutes: leis,
        notes: scrNotes.trim(),
      });
    } catch {
      return;
    } finally {
      writeLocks.current.delete('logScreenTime');
    }
    setShowLogScreenTime(false);
    setScrNotes('');
  };

  const habits = data?.habits ?? [];
  const sleepLogs = data?.sleepLogs ?? [];
  const screenTimeLogs = data?.screenTimeLogs ?? [];
  const stats = data?.stats;



  if (loadFailed) return <div role="alert">Could not load this space. <button type="button" onClick={() => void refetch()}>Retry</button></div>;

  return (
    <div className={styles.container}>
      {[toggleHabit, createHabit, logSleep, logScreenTime].some(mutation => mutation.isError) && <p role="alert">The change could not be saved. Retry the action.</p>}
      {/* Mindful Japanese Aesthetic Header */}
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
            <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Mindful daily rhythm · Kaizen</span>
        </div>

        <h1 className={styles.title}>Tracking</h1>
        <p className={styles.description}>
          Calm observation of daily rituals, sleep quality, and intentional screen balance. Designed for
          quiet self-reflection rather than rigid judgment.
        </p>

        <div className={styles.statsRow} style={{ marginTop: 'var(--space-4)' }}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats?.overallHabitCompletionRate ?? 0}%</div>
            <div className={styles.statLabel}>Today&apos;s habit progress</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats?.averageSleepHours ?? 0} hrs</div>
            <div className={styles.statLabel}>7-day average sleep</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats?.averageProductiveRatio ?? 0}%</div>
            <div className={styles.statLabel}>Productive screen ratio</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats?.activeStreakDays ?? 0} days</div>
            <div className={styles.statLabel}>Consistent discipline</div>
          </div>
        </div>
      </header>

      {/* Habits Checklist Section */}
      <section aria-labelledby="habits-heading" className={styles.habitsCard}>
        <div className={styles.sectionHeader}>
          <h2 id="habits-heading" className={styles.sectionTitle}>
            Daily habits checklist
          </h2>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setShowAddHabit(true)}
          >
            <span>+ Add new habit</span>
          </button>
        </div>

        {isLoading ? (
          <div style={{ color: 'var(--ws-text-muted)', fontSize: 'var(--text-xs)' }}>
            Loading habits...
          </div>
        ) : (
          <div className={styles.habitList}>
            {habits.map((habit) => {
              const isDone = habit.completedDates.includes(todayStr);
              return (
                <div
                  key={habit.id}
                  className={`${styles.habitRow} ${isDone ? styles.habitRowDone : ''}`}
                >
                  <div className={styles.habitLeft}>
                    <button
                      type="button"
                      className={`${styles.checkCircle} ${isDone ? styles.checkCircleDone : ''}`}
                      onClick={() => handleToggleHabit(habit.id)}
                      aria-label={`Toggle habit ${habit.title}`}
                      aria-pressed={isDone}
                    >
                      {isDone && '✓'}
                    </button>
                    <span
                      className={`${styles.habitTitle} ${isDone ? styles.habitTitleDone : ''}`}
                    >
                      {habit.title}
                    </span>
                  </div>

                  <div className={styles.habitRight}>
                    <span className={styles.categoryTag}>{habit.category}</span>
                    <span className={styles.streakPill}>
                      {habit.streakDays} {habit.streakDays === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Two Column Section: Sleep Tracker & Screen Time */}
      <div className={styles.twoColRow}>
        {/* Sleep Tracker */}
        <section aria-labelledby="sleep-heading" className={styles.panelCard}>
          <div className={styles.sectionHeader}>
            <h2 id="sleep-heading" className={styles.sectionTitle}>
              Sleep tracking & cycles
            </h2>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setShowLogSleep(true)}
            >
              <span>+ Log sleep</span>
            </button>
          </div>

          {/* 90-minute sleep cycle calculator callout */}
          <div className={styles.calcBox}>
            <strong>Optimal 90-minute sleep cycles:</strong>
            <span>
              If you fall asleep around 23:00, these are illustrative sleep durations, not guaranteed energy predictions:
            </span>
            <div className={styles.cycleChips}>
              <span className={styles.cycleChip}>05:00 (4 cycles · 6h)</span>
              <span className={styles.cycleChip}>06:30 (5 cycles · 7.5h)</span>
              <span className={styles.cycleChip}>08:00 (6 cycles · 9h)</span>
            </div>
          </div>

          <div className={styles.logList}>
            {sleepLogs.slice(0, 3).map((log) => (
              <div key={log.id} className={styles.logItem}>
                <div className={styles.logMain}>
                  <span className={styles.logDate}>
                    {new Date(log.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span style={{ color: 'var(--ws-text-muted)' }}>
                    {log.bedTime} → {log.wakeTime}
                  </span>
                  {log.notes && <span className={styles.logNotes}>{log.notes}</span>}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className={styles.logValue}>{log.durationHours} hrs</div>
                  <div style={{ color: 'var(--status-due-soon)', fontSize: '11px' }}>
                    {'★'.repeat(log.qualityRating)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Screen Time Balance */}
        <section aria-labelledby="screen-heading" className={styles.panelCard}>
          <div className={styles.sectionHeader}>
            <h2 id="screen-heading" className={styles.sectionTitle}>
              Screen time balance
            </h2>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setShowLogScreenTime(true)}
            >
              <span>+ Log hours</span>
            </button>
          </div>

          {screenTimeLogs[0] && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                <span>
                  Productive: <strong>{screenTimeLogs[0].productiveMinutes}m</strong>
                </span>
                <span>
                  Leisure: <strong>{screenTimeLogs[0].leisureMinutes}m</strong>
                </span>
              </div>

              <div className={styles.ratioBarTrack}>
                <div
                  className={styles.ratioBarProd}
                  style={{
                    width: `${Math.round(
                      (screenTimeLogs[0].productiveMinutes / screenTimeLogs[0].totalMinutes) * 100,
                    )}%`,
                  }}
                  title="Productive screen time"
                />
                <div
                  className={styles.ratioBarLeisure}
                  style={{
                    width: `${Math.round(
                      (screenTimeLogs[0].leisureMinutes / screenTimeLogs[0].totalMinutes) * 100,
                    )}%`,
                  }}
                  title="Leisure screen time"
                />
              </div>
            </div>
          )}

          <div className={styles.logList}>
            {screenTimeLogs.slice(0, 3).map((log) => (
              <div key={log.id} className={styles.logItem}>
                <div className={styles.logMain}>
                  <span className={styles.logDate}>
                    {new Date(log.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {log.notes && <span className={styles.logNotes}>{log.notes}</span>}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className={styles.logValue}>{Math.round((log.totalMinutes / 60) * 10) / 10} hrs</div>
                  <span style={{ color: 'var(--ws-text-muted)', fontSize: '11px' }}>
                    {Math.round((log.productiveMinutes / log.totalMinutes) * 100)}% deep work
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Add Habit Modal */}
      {showAddHabit && (
        <Dialog open portal title="Add daily habit" className="max-w-2xl max-h-[90svh] overflow-y-auto" onClose={() => setShowAddHabit(false)}>
{[toggleHabit, createHabit, logSleep, logScreenTime].some(mutation => mutation.isError) && <p role="alert">Could not save. Your input is retained; retry.</p>}
          <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>

            <form onSubmit={handleCreateHabitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label
                  htmlFor={habitTitleId}
                  style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}
                >
                  Habit title
                </label>
                <input
                  id={habitTitleId}
                  type="text"
                  required
                  className={styles.inputField}
                  placeholder="e.g., Evening meditation & reflection"
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor={habitCategoryId}
                  style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}
                >
                  Category
                </label>
                <select
                  id={habitCategoryId}
                  className={styles.selectField}
                  value={habitCategory}
                  onChange={(e) => setHabitCategory(e.target.value as HabitCategory)}
                >
                  <option value="routine">Routine</option>
                  <option value="health">Health</option>
                  <option value="learning">Learning</option>
                  <option value="mindfulness">Mindfulness</option>
                </select>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowAddHabit(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={createHabit.isPending}
                >
                  Save habit
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* Log Sleep Modal */}
      {showLogSleep && (
        <Dialog open portal title="Log night&apos;s sleep" className="max-w-2xl max-h-[90svh] overflow-y-auto" onClose={() => setShowLogSleep(false)}>
{[toggleHabit, createHabit, logSleep, logScreenTime].some(mutation => mutation.isError) && <p role="alert">Could not save. Your input is retained; retry.</p>}
          <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>

            <form onSubmit={handleLogSleepSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor={sleepBedTimeId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    Bedtime
                  </label>
                  <input
                    id={sleepBedTimeId}
                    type="time"
                    className={styles.inputField}
                    value={sleepBedTime}
                    onChange={(e) => setSleepBedTime(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor={sleepWakeTimeId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    Wake time
                  </label>
                  <input
                    id={sleepWakeTimeId}
                    type="time"
                    className={styles.inputField}
                    value={sleepWakeTime}
                    onChange={(e) => setSleepWakeTime(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor={sleepDurationId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    Hours slept
                  </label>
                  <input
                    id={sleepDurationId}
                    type="number"
                    step="0.5"
                    className={styles.inputField}
                    value={sleepDuration}
                    onChange={(e) => setSleepDuration(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label htmlFor={sleepRatingId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    Quality rating (1-5)
                  </label>
                  <input
                    id={sleepRatingId}
                    type="number"
                    min="1"
                    max="5"
                    className={styles.inputField}
                    value={sleepRating}
                    onChange={(e) => setSleepRating(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label htmlFor={sleepNotesId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Restfulness notes
                </label>
                <input
                  id={sleepNotesId}
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g., Felt energized upon waking"
                  value={sleepNotes}
                  onChange={(e) => setSleepNotes(e.target.value)}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowLogSleep(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={logSleep.isPending}
                >
                  Log sleep
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* Log Screen Time Modal */}
      {showLogScreenTime && (
        <Dialog open portal title="Log screen time hours" className="max-w-2xl max-h-[90svh] overflow-y-auto" onClose={() => setShowLogScreenTime(false)}>
{[toggleHabit, createHabit, logSleep, logScreenTime].some(mutation => mutation.isError) && <p role="alert">Could not save. Your input is retained; retry.</p>}
          <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>

            <form onSubmit={handleLogScreenTimeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor={scrProdId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    Productive (minutes)
                  </label>
                  <input
                    id={scrProdId}
                    type="number"
                    className={styles.inputField}
                    value={scrProductive}
                    onChange={(e) => setScrProductive(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label htmlFor={scrLeisureId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                    Leisure (minutes)
                  </label>
                  <input
                    id={scrLeisureId}
                    type="number"
                    className={styles.inputField}
                    value={scrLeisure}
                    onChange={(e) => setScrLeisure(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label htmlFor={scrNotesId} style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
                  Activities & context
                </label>
                <input
                  id={scrNotesId}
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g., Coding and essay research"
                  value={scrNotes}
                  onChange={(e) => setScrNotes(e.target.value)}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowLogScreenTime(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={logScreenTime.isPending}
                >
                  Log balance
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
}


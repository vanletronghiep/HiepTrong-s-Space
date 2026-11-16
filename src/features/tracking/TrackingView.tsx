'use client';

import React, { useId, useRef, useState } from 'react';
import { Leaf, Plus, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import {
  useCreateHabit,
  useLogScreenTime,
  useLogSleep,
  useToggleHabit,
  useTrackingData,
} from '@/client/queries/tracking';
import type { HabitCategory } from '@/contracts/tracking';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { cn } from '@/ui/cn';
import { Dialog } from '@/ui/Dialog';
import { FormattedNoteContent } from '@/ui/FormattedNoteContent';
import { RichNoteEditor } from '@/ui/RichNoteEditor';
import { SelectField, type SelectOption } from '@/ui/SelectField';
import { Skeleton } from '@/ui/Skeleton';
import { TimeFieldControl } from '@/ui/TimeFieldControl';
import styles from './tracking.module.css';

const HABIT_CATEGORY_OPTIONS: readonly SelectOption<HabitCategory>[] = [
  { value: 'routine', label: 'Routine' },
  { value: 'health', label: 'Health' },
  { value: 'learning', label: 'Learning' },
  { value: 'mindfulness', label: 'Mindfulness' },
];

const CATEGORY_LABELS: Record<HabitCategory, string> = {
  routine: 'Routine',
  health: 'Health',
  learning: 'Learning',
  mindfulness: 'Mindfulness',
};

function formatTrackingLogDate(dateStr: string): string {
  const isoCandidate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T12:00:00+07:00` : dateStr;
  const parsed = new Date(isoCandidate);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: DEFAULT_APP_TIMEZONE,
  }).format(parsed);
}

function computeRatioPercentages(
  totalMinutes: number,
  productiveMinutes: number,
  leisureMinutes: number,
) {
  if (totalMinutes <= 0) {
    return { productivePct: 0, leisurePct: 0 };
  }
  const productivePct = Math.max(
    0,
    Math.min(100, Math.round((productiveMinutes / totalMinutes) * 100)),
  );
  const leisurePct = Math.max(
    0,
    Math.min(100 - productivePct, Math.round((leisureMinutes / totalMinutes) * 100)),
  );
  return { productivePct, leisurePct };
}

export function TrackingView() {
  const writeLocks = useRef(new Set<string>());
  const todayStr = formatScheduledDate(new Date());

  // Modals state
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showLogSleep, setShowLogSleep] = useState(false);
  const [showLogScreenTime, setShowLogScreenTime] = useState(false);

  // Add habit inputs
  const [habitTitle, setHabitTitle] = useState('');
  const [habitCategory, setHabitCategory] = useState<HabitCategory>('routine');

  // Log sleep inputs
  const [sleepBedTime, setSleepBedTime] = useState('23:00');
  const [sleepWakeTime, setSleepWakeTime] = useState('06:30');
  const [sleepDuration, setSleepDuration] = useState('7.5');
  const [sleepRating, setSleepRating] = useState('5');
  const [sleepNotes, setSleepNotes] = useState('');

  // Log screen time inputs
  const [scrProductive, setScrProductive] = useState('240');
  const [scrLeisure, setScrLeisure] = useState('60');
  const [scrNotes, setScrNotes] = useState('');

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

  const openAddHabit = () => {
    createHabit.reset?.();
    setShowAddHabit(true);
  };

  const openLogSleep = () => {
    logSleep.reset?.();
    setShowLogSleep(true);
  };

  const openLogScreenTime = () => {
    logScreenTime.reset?.();
    setShowLogScreenTime(true);
  };

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
  const completedTodayCount = habits.filter((h) => h.completedDates.includes(todayStr)).length;
  const activeStreakDays = stats?.activeStreakDays ?? 0;
  const latestScreenLog = screenTimeLogs[0];
  const latestScreenRatios = latestScreenLog
    ? computeRatioPercentages(
        latestScreenLog.totalMinutes,
        latestScreenLog.productiveMinutes,
        latestScreenLog.leisureMinutes,
      )
    : null;

  return (
    <div className={styles.pageStack}>
      <Image
        src="/visuals/tracking/climbing-thyme-edge.svg"
        alt=""
        aria-hidden="true"
        width={200}
        height={480}
        loading="eager"
        unoptimized
        className={styles.thymeEdgeDecor}
      />

      {/* Editorial Herbal Tea Sanctuary Masthead */}
      <header className={styles.masthead} aria-labelledby="tracking-page-heading">
        <Image
          src="/visuals/tracking/herbal-tea-ritual.svg"
          alt=""
          aria-hidden="true"
          width={480}
          height={300}
          loading="eager"
          unoptimized
          className={styles.teaMastheadArt}
        />

        <div className={styles.mastheadText}>
          <div className={styles.eyebrow}>
            <Leaf size={14} strokeWidth={1.6} aria-hidden="true" />
            <span>Mindful daily rhythm · Kaizen</span>
          </div>

          <h1 id="tracking-page-heading" className={styles.displayTitle}>
            Tracking <span className={styles.displayTitleEmphasis}>sanctuary</span>
          </h1>
          <p className={styles.mastheadSubtitle}>
            Calm observation of daily rituals, sleep quality, and intentional screen balance.
            Designed for quiet self-reflection rather than rigid judgment.
          </p>
        </div>
      </header>

      {loadFailed ? (
        <div role="alert" className={styles.alertBanner}>
          <span>Could not load your tracking rhythm right now. Check connection or retry.</span>
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

      {/* Concise 4-metric 7-day & today rhythm strip */}
      <section aria-label="7-day and today rhythm" className={styles.rhythmStrip}>
        <div className={styles.rhythmCard}>
          <div className={styles.rhythmValue}>{stats?.overallHabitCompletionRate ?? 0}%</div>
          <div className={styles.rhythmLabel}>Today&apos;s habit progress</div>
        </div>
        <div className={styles.rhythmCard}>
          <div className={styles.rhythmValue}>{stats?.averageSleepHours ?? 0} hrs</div>
          <div className={styles.rhythmLabel}>7-day average sleep</div>
        </div>
        <div className={styles.rhythmCard}>
          <div className={styles.rhythmValue}>{stats?.averageProductiveRatio ?? 0}%</div>
          <div className={styles.rhythmLabel}>Productive screen ratio</div>
        </div>
        <div className={styles.rhythmCard}>
          <div className={styles.rhythmValue}>
            {activeStreakDays} {activeStreakDays === 1 ? 'day' : 'days'}
          </div>
          <div className={styles.rhythmLabel}>Consistent discipline</div>
        </div>
      </section>

      {/* Calm Asymmetric Sanctuary Workspace */}
      <div className={styles.sanctuaryGrid}>
        {/* Primary Daily Habits Checklist Folio */}
        <section aria-labelledby="habits-heading" className={styles.folioSurface}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 id="habits-heading" className={styles.sectionTitle}>
                Daily habits checklist
              </h2>
              {habits.length > 0 ? (
                <span className={styles.todayTally}>
                  {completedTodayCount} / {habits.length} today
                </span>
              ) : null}
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} strokeWidth={1.6} aria-hidden="true" />}
              onClick={openAddHabit}
            >
              Add new habit
            </Button>
          </div>

          {toggleHabit.isError ? (
            <p role="alert" className={styles.inlineAlert}>
              Could not update this habit check-in. Please try again.
            </p>
          ) : null}

          {isLoading ? (
            <div className="space-y-2.5" aria-label="Loading habits">
              <Skeleton className="h-12 w-full rounded-item" />
              <Skeleton className="h-12 w-full rounded-item" />
              <Skeleton className="h-12 w-full rounded-item" />
            </div>
          ) : habits.length === 0 ? (
            <div className={styles.emptySpot} role="status">
              <Image
                src="/visuals/tracking/garden-watering-can.svg"
                alt=""
                aria-hidden="true"
                width={320}
                height={280}
                unoptimized
                className={styles.emptyWateringCan}
              />
              <h3 className={styles.emptyTitle}>Begin a daily ritual.</h3>
              <p className={styles.emptyCopy}>Add a habit using the button above.</p>
            </div>
          ) : (
            <div className={styles.habitList}>
              {habits.map((habit) => {
                const isDone = habit.completedDates.includes(todayStr);
                return (
                  <div
                    key={habit.id}
                    className={cn(styles.habitRow, isDone && styles.habitRowDone)}
                  >
                    <div className={styles.habitLeft}>
                      <Checkbox
                        checked={isDone}
                        onCheckedChange={() => handleToggleHabit(habit.id)}
                        aria-label={`Toggle habit ${habit.title}`}
                        disabled={toggleHabit.isPending}
                        className={styles.habitCheckbox}
                      />
                      <span className={cn(styles.habitTitle, isDone && styles.habitTitleDone)}>
                        {habit.title}
                      </span>
                    </div>

                    <div className={styles.habitRight}>
                      <span className={styles.categoryBadge}>
                        {CATEGORY_LABELS[habit.category]}
                      </span>
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

        {/* Supporting Column: Sleep & Screen Time Balance */}
        <div className={styles.supportColumn}>
          {/* Sleep Tracking & Cycles */}
          <section aria-labelledby="sleep-heading" className={styles.supportSurface}>
            <div className={styles.sectionHeader}>
              <h2 id="sleep-heading" className={styles.sectionTitle}>
                Sleep tracking &amp; cycles
              </h2>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus size={15} strokeWidth={1.6} aria-hidden="true" />}
                onClick={openLogSleep}
              >
                Log sleep
              </Button>
            </div>

            <div className={styles.cycleBox}>
              <strong className={styles.cycleHeading}>Optimal 90-minute sleep cycles</strong>
              <span className={styles.cycleNote}>
                If you fall asleep around 23:00, these are illustrative sleep durations, not
                guaranteed energy predictions:
              </span>
              <div className={styles.cycleChips}>
                <span className={styles.cycleChip}>05:00 · 4 cycles · 6h</span>
                <span className={styles.cycleChip}>06:30 · 5 cycles · 7.5h</span>
                <span className={styles.cycleChip}>08:00 · 6 cycles · 9h</span>
              </div>
            </div>

            {sleepLogs.length === 0 ? (
              <p className={styles.quietEmptyCue}>
                No sleep entries logged yet. Record last night&apos;s rest to trace your 7-day
                rhythm.
              </p>
            ) : (
              <div className={styles.logList}>
                {sleepLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className={styles.logItem}>
                    <div className={styles.logMain}>
                      <span className={styles.logDate}>{formatTrackingLogDate(log.date)}</span>
                      <span className={styles.logTimeRange}>
                        {log.bedTime} → {log.wakeTime}
                      </span>
                      {log.notes ? (
                        <FormattedNoteContent value={log.notes} className={styles.logNotes} />
                      ) : null}
                    </div>

                    <div className={styles.logMeta}>
                      <div className={styles.logValue}>{log.durationHours} hrs</div>
                      <div
                        className={cn(styles.starRating, 'text-text-due-soon')}
                        aria-label={`${log.qualityRating} out of 5 stars`}
                      >
                        {'★'.repeat(log.qualityRating)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className={styles.teaDividerWrap} aria-hidden="true">
            <Image
              src="/visuals/tracking/tea-steam-rule.svg"
              alt=""
              aria-hidden="true"
              width={720}
              height={100}
              unoptimized
              className={styles.teaDivider}
            />
          </div>

          {/* Screen Time Balance */}
          <section aria-labelledby="screen-heading" className={styles.supportSurface}>
            <div className={styles.sectionHeader}>
              <h2 id="screen-heading" className={styles.sectionTitle}>
                Screen time balance
              </h2>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus size={15} strokeWidth={1.6} aria-hidden="true" />}
                onClick={openLogScreenTime}
              >
                Log hours
              </Button>
            </div>

            {latestScreenLog && latestScreenRatios ? (
              <div className={styles.ratioSummary}>
                <div className={styles.ratioLabels}>
                  <span>
                    Productive: <strong>{latestScreenLog.productiveMinutes}m</strong>
                  </span>
                  <span>
                    Leisure: <strong>{latestScreenLog.leisureMinutes}m</strong>
                  </span>
                </div>

                <div className={styles.ratioBarTrack}>
                  <div
                    className={styles.ratioBarProd}
                    style={{ width: `${latestScreenRatios.productivePct}%` }}
                    title="Productive screen time"
                  />
                  <div
                    className={styles.ratioBarLeisure}
                    style={{ width: `${latestScreenRatios.leisurePct}%` }}
                    title="Leisure screen time"
                  />
                </div>
              </div>
            ) : null}

            {screenTimeLogs.length === 0 ? (
              <p className={styles.quietEmptyCue}>
                No screen balance logs yet. Log productive and leisure minutes to see your focus
                ratio.
              </p>
            ) : (
              <div className={styles.logList}>
                {screenTimeLogs.slice(0, 3).map((log) => {
                  const { productivePct } = computeRatioPercentages(
                    log.totalMinutes,
                    log.productiveMinutes,
                    log.leisureMinutes,
                  );
                  return (
                    <div key={log.id} className={styles.logItem}>
                      <div className={styles.logMain}>
                        <span className={styles.logDate}>{formatTrackingLogDate(log.date)}</span>
                        {log.notes ? (
                          <FormattedNoteContent value={log.notes} className={styles.logNotes} />
                        ) : null}
                      </div>

                      <div className={styles.logMeta}>
                        <div className={styles.logValue}>
                          {Math.round((log.totalMinutes / 60) * 10) / 10} hrs
                        </div>
                        <span className={styles.logSubtleMeta}>{productivePct}% deep work</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Quiet Botanical Footer */}
      <footer className={styles.sanctuaryFooter}>
        <p className={styles.footerNote}>
          Small unhurried check-ins keep your daily rhythm visible across a rolling 7-day window.
        </p>
        <Image
          src="/visuals/tracking/mint-herbarium.svg"
          alt=""
          aria-hidden="true"
          width={240}
          height={240}
          unoptimized
          className={styles.mintCornerAccent}
        />
      </footer>

      {/* Add Habit Modal */}
      {showAddHabit ? (
        <Dialog
          open
          portal
          title="Add daily habit"
          className="max-w-[440px] max-h-[90svh] overflow-y-auto"
          onClose={() => setShowAddHabit(false)}
        >
          <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            {createHabit.isError ? (
              <p role="alert" className={styles.inlineAlert}>
                Could not save this habit. Your input is retained; retry.
              </p>
            ) : null}

            <form onSubmit={handleCreateHabitSubmit} className={styles.formStack}>
              <div>
                <label htmlFor={habitTitleId} className={styles.fieldLabel}>
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
                <label htmlFor={habitCategoryId} className={styles.fieldLabel}>
                  Category
                </label>
                <SelectField
                  id={habitCategoryId}
                  value={habitCategory}
                  onChange={setHabitCategory}
                  options={HABIT_CATEGORY_OPTIONS}
                />
              </div>

              <div className={styles.modalFooter}>
                <Button variant="secondary" size="sm" onClick={() => setShowAddHabit(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={createHabit.isPending}>
                  Save habit
                </Button>
              </div>
            </form>
          </div>
        </Dialog>
      ) : null}

      {/* Log Sleep Modal */}
      {showLogSleep ? (
        <Dialog
          open
          portal
          title="Log night's sleep"
          className="max-w-[440px] max-h-[90svh] overflow-y-auto"
          onClose={() => setShowLogSleep(false)}
        >
          <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            {logSleep.isError ? (
              <p role="alert" className={styles.inlineAlert}>
                Could not save sleep entry. Your input is retained; retry.
              </p>
            ) : null}

            <form onSubmit={handleLogSleepSubmit} className={styles.formStack}>
              <div className={styles.formGridTwo}>
                <div>
                  <label htmlFor={sleepBedTimeId} className={styles.fieldLabel}>
                    Bedtime
                  </label>
                  <TimeFieldControl
                    id={sleepBedTimeId}
                    value={sleepBedTime}
                    onChange={setSleepBedTime}
                  />
                </div>
                <div>
                  <label htmlFor={sleepWakeTimeId} className={styles.fieldLabel}>
                    Wake time
                  </label>
                  <TimeFieldControl
                    id={sleepWakeTimeId}
                    value={sleepWakeTime}
                    onChange={setSleepWakeTime}
                  />
                </div>
              </div>

              <div className={styles.formGridTwo}>
                <div>
                  <label htmlFor={sleepDurationId} className={styles.fieldLabel}>
                    Hours slept
                  </label>
                  <input
                    id={sleepDurationId}
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    required
                    className={styles.inputField}
                    value={sleepDuration}
                    onChange={(e) => setSleepDuration(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor={sleepRatingId} className={styles.fieldLabel}>
                    Quality rating (1-5)
                  </label>
                  <input
                    id={sleepRatingId}
                    type="number"
                    min="1"
                    max="5"
                    required
                    className={styles.inputField}
                    value={sleepRating}
                    onChange={(e) => setSleepRating(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  id={`${sleepNotesId}-label`}
                  htmlFor={sleepNotesId}
                  className={styles.fieldLabel}
                >
                  Restfulness notes
                </label>
                <RichNoteEditor
                  id={sleepNotesId}
                  ariaLabelledBy={`${sleepNotesId}-label`}
                  placeholder="e.g., Felt energized upon waking"
                  value={sleepNotes}
                  onChange={setSleepNotes}
                  minHeightClassName="min-h-[84px]"
                />
              </div>

              <div className={styles.modalFooter}>
                <Button variant="secondary" size="sm" onClick={() => setShowLogSleep(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={logSleep.isPending}>
                  Log sleep
                </Button>
              </div>
            </form>
          </div>
        </Dialog>
      ) : null}

      {/* Log Screen Time Modal */}
      {showLogScreenTime ? (
        <Dialog
          open
          portal
          title="Log screen time hours"
          className="max-w-[440px] max-h-[90svh] overflow-y-auto"
          onClose={() => setShowLogScreenTime(false)}
        >
          <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            {logScreenTime.isError ? (
              <p role="alert" className={styles.inlineAlert}>
                Could not save screen balance. Your input is retained; retry.
              </p>
            ) : null}

            <form onSubmit={handleLogScreenTimeSubmit} className={styles.formStack}>
              <div className={styles.formGridTwo}>
                <div>
                  <label htmlFor={scrProdId} className={styles.fieldLabel}>
                    Productive (minutes)
                  </label>
                  <input
                    id={scrProdId}
                    type="number"
                    min="0"
                    max="1440"
                    required
                    className={styles.inputField}
                    value={scrProductive}
                    onChange={(e) => setScrProductive(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor={scrLeisureId} className={styles.fieldLabel}>
                    Leisure (minutes)
                  </label>
                  <input
                    id={scrLeisureId}
                    type="number"
                    min="0"
                    max="1440"
                    required
                    className={styles.inputField}
                    value={scrLeisure}
                    onChange={(e) => setScrLeisure(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  id={`${scrNotesId}-label`}
                  htmlFor={scrNotesId}
                  className={styles.fieldLabel}
                >
                  Activities &amp; context
                </label>
                <RichNoteEditor
                  id={scrNotesId}
                  ariaLabelledBy={`${scrNotesId}-label`}
                  placeholder="e.g., Coding and essay research"
                  value={scrNotes}
                  onChange={setScrNotes}
                  minHeightClassName="min-h-[84px]"
                />
              </div>

              <div className={styles.modalFooter}>
                <Button variant="secondary" size="sm" onClick={() => setShowLogScreenTime(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={logScreenTime.isPending}
                >
                  Log balance
                </Button>
              </div>
            </form>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Pause, Play, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import {
  getFocusRitualDay,
  getStudyPlanConfigRaw,
  setFocusRitualDay,
  setStudyPlanConfigRaw,
} from '@/client/preferences';
import { useCreateLearningSession, useLearningRoomData } from '@/client/queries/learning-room';
import { useProjects } from '@/client/queries/projects';
import { useCompleteTask, useTasks } from '@/client/queries/tasks';
import { buildStudyPlan, planConfigFor, summarizePlan } from '@/domain/study-plan';
import { runTotals } from '@/domain/study-session';
import { DEFAULT_APP_TIMEZONE, formatScheduledDate } from '@/domain/time';
import { usePageReady } from '@/features/transitions/TransitionProvider';
import { Button } from '@/ui/Button';
import { FormattedNoteContent } from '@/ui/FormattedNoteContent';
import { EmptyState } from '@/ui/EmptyState';
import { cn } from '@/ui/cn';
import { ClearMemory } from './ClearMemory';
import { FocusStats } from './FocusStats';
import { FREE_SESSION_NAME, clock, useFocusSession } from './FocusSessionProvider';
import { LeavePanel } from './LeavePanel';
import { PlanLine, compactMinutes, elapsedPlanMinutes } from './PlanLine';
import { QuietView } from './QuietView';
import { SessionComplete } from './SessionComplete';
import { SetupPanel, type DurationInputs } from './SetupPanel';
import { StartRitual } from './StartRitual';
import { TimerRing } from './TimerRing';
import styles from './focus-room.module.css';

const BREAK_IDEAS = [
  'Stand up and look at something far away for twenty seconds.',
  'Drink some water and loosen your shoulders.',
  'Take five slow breaths before the next block.',
  'Stretch your wrists and neck. Your thoughts are parked below.',
];

const DEFAULT_INPUTS: DurationInputs = { hours: '2', minutes: '00', focus: '25' };

function toInputs(totalMinutes: number, focusMinutes: number): DurationInputs {
  return {
    hours: String(Math.floor(totalMinutes / 60)),
    minutes: String(totalMinutes % 60).padStart(2, '0'),
    focus: String(focusMinutes),
  };
}

function loadInputs(): DurationInputs {
  const raw = getStudyPlanConfigRaw();
  if (!raw) return DEFAULT_INPUTS;
  try {
    const saved = JSON.parse(raw) as { totalMinutes?: unknown; focusMinutes?: unknown };
    if (typeof saved.totalMinutes !== 'number' || typeof saved.focusMinutes !== 'number') {
      return DEFAULT_INPUTS;
    }
    const config = planConfigFor(saved.totalMinutes, saved.focusMinutes);
    return toInputs(config.totalMinutes, config.focusMinutes);
  } catch {
    return DEFAULT_INPUTS;
  }
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

export function FocusRoomView() {
  const session = useFocusSession();
  const { run, phase } = session;
  const writeLocks = useRef(new Set<string>());

  const [inputs, setInputs] = useState<DurationInputs>(DEFAULT_INPUTS);
  const [pickedTaskId, setPickedTaskId] = useState('');
  const [starting, setStarting] = useState(false);
  const [commitmentsDone, setCommitmentsDone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [thoughtDraft, setThoughtDraft] = useState('');
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [markTaskDone, setMarkTaskDone] = useState(false);

  const { data, isLoading, isError: loadFailed, refetch } = useLearningRoomData();
  usePageReady(!isLoading);
  const createSession = useCreateLearningSession();
  const completeTask = useCompleteTask();
  const { data: activeTasks = [] } = useTasks({ status: 'active' });
  const { data: focuses = [] } = useProjects();

  useEffect(() => {
    setInputs(loadInputs());
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-hide-scrollbar', '');
    return () => document.documentElement.removeAttribute('data-hide-scrollbar');
  }, []);

  const todayKey = formatScheduledDate(new Date());
  const todayTasks = useMemo(
    () =>
      activeTasks
        .filter((task) => task.scheduledDate === todayKey)
        .sort((a, b) => Date.parse(a.deadlineAt) - Date.parse(b.deadlineAt))
        .map((task) => ({ id: task.id, title: task.title })),
    [activeTasks, todayKey],
  );

  const typedTotal = (Number(inputs.hours) || 0) * 60 + (Number(inputs.minutes) || 0);
  const typedFocus = Number(inputs.focus) || 0;
  const config = useMemo(() => planConfigFor(typedTotal, typedFocus), [typedTotal, typedFocus]);
  const plan = useMemo(() => buildStudyPlan(config), [config]);
  const planSummary = summarizePlan(plan);

  const commitInputs = () => {
    setInputs(toInputs(config.totalMinutes, config.focusMinutes));
    setStudyPlanConfigRaw(
      JSON.stringify({ totalMinutes: config.totalMinutes, focusMinutes: config.focusMinutes }),
    );
  };

  const activeTaskId = run ? session.taskId : pickedTaskId;
  const selectedTask = activeTasks.find((task) => task.id === activeTaskId) ?? null;
  const linkedFocus = selectedTask
    ? (focuses.find((focus) => focus.linkedTaskIds.includes(selectedTask.id)) ?? null)
    : null;
  const setupName =
    activeTasks.find((task) => task.id === pickedTaskId)?.title ?? FREE_SESSION_NAME;
  const displayName = run ? session.name.trim() || FREE_SESSION_NAME : setupName;

  const quietActive = session.isRunning && session.quiet;
  const inBreak = phase ? phase.kind !== 'focus' : false;
  const phaseMinutes = phase?.minutes ?? 0;
  const phaseProgress = phaseMinutes > 0 ? 1 - session.secondsRemaining / (phaseMinutes * 60) : 0;
  const runPlan = run ? run.plan : plan;
  const totalPlanMinutes = summarizePlan(runPlan).totalMinutes;
  const elapsedMinutes = run
    ? elapsedPlanMinutes(run.plan, run.phaseIdx, session.secondsRemaining, session.isEnded)
    : 0;
  const focusBlockTotal = summarizePlan(runPlan).focusBlocks;
  const focusBlockNow = run
    ? run.plan.slice(0, run.phaseIdx + 1).filter((item) => item.kind === 'focus').length
    : 0;
  const blockLine = inBreak ? 'Break' : `Focus block ${focusBlockNow} of ${focusBlockTotal}`;

  const { holdAlerts } = session;
  useEffect(() => {
    holdAlerts(leaving);
    return () => holdAlerts(false);
  }, [leaving, holdAlerts]);

  useEffect(() => {
    if (!quietActive) setLeaving(false);
  }, [quietActive]);

  const totals = run && session.isEnded ? runTotals(run) : null;
  const plannedFocus = run ? summarizePlan(run.plan).focusMinutes : 0;
  const endedEarly = totals ? totals.focusMinutes + 0.05 < plannedFocus : false;
  const blocksDone =
    run && session.isEnded
      ? run.plan
          .slice(0, endedEarly ? run.phaseIdx : run.plan.length)
          .filter((item) => item.kind === 'focus').length
      : 0;
  const stats = data?.stats;
  const streakAfter = stats
    ? stats.todayFocusMinutes > 0
      ? stats.streakDays
      : stats.streakDays + 1
    : 1;

  const handleBegin = () => {
    setCommitmentsDone(getFocusRitualDay() === todayKey);
    setStarting(true);
  };

  const handleStart = () => {
    setStarting(false);
    setFocusRitualDay(todayKey);
    createSession.reset?.();
    session.begin(plan, { name: setupName, taskId: pickedTaskId });
  };

  const handleReset = () => {
    session.reset();
    setThoughtDraft('');
    setMarkTaskDone(false);
  };

  const handleSaveReflection = async () => {
    if (createSession.isPending || !run || run.endedAt === null || !totals) return;
    if (writeLocks.current.has('createSession')) return;
    writeLocks.current.add('createSession');
    const title = displayName;
    try {
      await createSession.mutateAsync({
        title,
        mode: 'pomodoro',
        targetSubject: linkedFocus?.title ?? 'General',
        relatedTaskId: selectedTask?.id ?? null,
        relatedProjectId: linkedFocus?.id ?? null,
        durationMinutes: totals.durationMinutes,
        startedAt: new Date(run.startedAt).toISOString(),
        completedAt: new Date(run.endedAt).toISOString(),
        focusMinutes: totals.focusMinutes,
        breakMinutes: totals.breakMinutes,
        pausedMinutes: totals.pausedMinutes,
        reflectionNotes: notes.trim(),
        rating,
        status: 'completed',
        focusIntervals: run.focusSpans.map(([start, end]) => ({
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
        })),
      });
    } catch {
      writeLocks.current.delete('createSession');
      return;
    }
    writeLocks.current.delete('createSession');

    if (markTaskDone && selectedTask) {
      try {
        await completeTask.mutateAsync(selectedTask.id);
      } catch {
        // The session is saved; completing the task can be retried from the task list.
      }
    }
    setNotes('');
    setRating(5);
    handleReset();
  };

  const sessions = data?.sessions ?? [];
  const breakIdea = BREAK_IDEAS[(run?.phaseIdx ?? 0) % BREAK_IDEAS.length];

  // Quiet mode is the whole screen: nothing of the page stays in the tab order behind it.
  if (quietActive && run) {
    return (
      <>
        <QuietView
          name={displayName}
          blockLine={blockLine}
          clockText={clock(session.secondsRemaining)}
          phaseLabel="Focus"
          progress={phaseProgress}
          plan={run.plan}
          elapsedMinutes={elapsedMinutes}
          totalMinutes={totalPlanMinutes}
          paused={session.isPaused}
          muted={session.muted}
          onPauseToggle={session.isPaused ? session.resume : session.pause}
          onToggleMute={() => session.setMuted(!session.muted)}
          onExit={() => setLeaving(true)}
          onParkThought={session.addThought}
        />
        {leaving ? (
          <LeavePanel
            blockLeft={clock(session.secondsRemaining)}
            elapsedMinutes={elapsedMinutes}
            totalMinutes={totalPlanMinutes}
            onContinue={() => setLeaving(false)}
            onExit={() => {
              setLeaving(false);
              session.setQuiet(false);
            }}
          />
        ) : null}
      </>
    );
  }

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

      <header className={styles.masthead}>
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
        <h1 className={styles.pageTitle}>Focus Room</h1>
      </header>

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

      <section className={styles.timerCard} aria-label="Timer">
        {!run ? (
          <SetupPanel
            inputs={inputs}
            onInputs={setInputs}
            onCommit={commitInputs}
            plan={plan}
            focusMinutes={config.focusMinutes}
            totalMinutes={planSummary.totalMinutes}
            blocks={planSummary.focusBlocks}
            tasks={todayTasks}
            taskId={pickedTaskId}
            onPickTask={setPickedTaskId}
            sessionName={setupName}
            muted={session.muted}
            onToggleMute={() => session.setMuted(!session.muted)}
            onBegin={handleBegin}
          />
        ) : (
          <div className={styles.running}>
            <div className={styles.runningHead}>
              <div className={styles.runningName}>
                <h2 className={styles.runningTitle}>{displayName}</h2>
                <p className={styles.runningBlock}>{blockLine}</p>
              </div>
              {session.isRunning ? (
                <Button variant="secondary" size="sm" pill onClick={() => session.setQuiet(true)}>
                  Enter quiet mode
                </Button>
              ) : null}
            </div>

            <TimerRing progress={phaseProgress} tone={inBreak ? 'break' : 'focus'}>
              <span className={styles.ringDigits} role="timer" aria-label="Time remaining">
                {clock(session.secondsRemaining)}
              </span>
              <span className={styles.ringPhase} role="status">
                {session.isEnded
                  ? 'Session finished'
                  : session.isPaused
                    ? 'Paused'
                    : inBreak
                      ? 'Rest & recharge'
                      : 'Focus'}
              </span>
            </TimerRing>

            <div className={styles.controls}>
              {session.isPaused ? (
                <>
                  <Button
                    variant="primary"
                    pill
                    leftIcon={<Play size={16} strokeWidth={2} aria-hidden="true" />}
                    onClick={session.resume}
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
                </>
              ) : session.isRunning ? (
                <Button
                  variant="primary"
                  pill
                  leftIcon={<Pause size={16} strokeWidth={2} aria-hidden="true" />}
                  onClick={session.pause}
                >
                  Pause
                </Button>
              ) : null}
              {session.isRunning ? (
                <Button
                  variant="secondary"
                  pill
                  leftIcon={<Check size={15} strokeWidth={1.8} aria-hidden="true" />}
                  onClick={session.finishEarly}
                >
                  Log &amp; finish
                </Button>
              ) : null}
            </div>

            <div className={styles.runningLine}>
              <PlanLine plan={runPlan} elapsedMinutes={elapsedMinutes} />
              <p className={styles.quietTimes}>
                <span>{compactMinutes(elapsedMinutes)} done</span>
                <span>{compactMinutes(Math.max(0, totalPlanMinutes - elapsedMinutes))} left</span>
              </p>
            </div>

            {session.isRunning && inBreak ? (
              <div className={styles.breakCard}>
                <Image
                  src="/visuals/learning-room/meditation-cushion.svg"
                  alt=""
                  aria-hidden="true"
                  width={96}
                  height={96}
                  unoptimized
                  className={styles.breakArt}
                />
                <div>
                  <p className={styles.breakTitle}>
                    {phase?.kind === 'long' ? 'Long break' : 'Short break'} · {phaseMinutes} minutes
                  </p>
                  <p className={styles.breakText}>{breakIdea}</p>
                </div>
              </div>
            ) : null}

            {session.isRunning ? (
              <div className={styles.thoughtsBox}>
                <form
                  className={styles.thoughtForm}
                  onSubmit={(event) => {
                    event.preventDefault();
                    session.addThought(thoughtDraft);
                    setThoughtDraft('');
                  }}
                >
                  <label htmlFor="focus-room-thought" className="sr-only">
                    Park a thought
                  </label>
                  <input
                    id="focus-room-thought"
                    className={styles.textInput}
                    placeholder="Park a thought for later"
                    value={thoughtDraft}
                    onChange={(event) => setThoughtDraft(event.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={!thoughtDraft.trim()}
                  >
                    Park
                  </Button>
                </form>
                {session.thoughts.length > 0 ? (
                  <ul className={styles.thoughtList} aria-label="Parked thoughts">
                    {session.thoughts.map((thought, index) => (
                      <li key={`${index}-${thought}`}>{thought}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </section>

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

      <FocusStats stats={stats} isLoading={isLoading} today={todayKey} />

      <section className={styles.historyCard} aria-labelledby="history-heading">
        <h3 id="history-heading" className={styles.panelTitle}>
          Recent sessions
        </h3>
        {isLoading ? (
          <div className={styles.historyList} aria-label="Loading recent study sessions" />
        ) : sessions.length === 0 ? (
          <div role="status" className={styles.emptyStateWrap}>
            <EmptyState compact title="No recorded sessions yet." />
          </div>
        ) : (
          <div className={styles.historyList}>
            {sessions.slice(0, 5).map((item) => (
              <div key={item.id} className={styles.historyItem}>
                <div>
                  <h4 className={styles.historyTitle}>{item.title}</h4>
                  {item.reflectionNotes ? (
                    <FormattedNoteContent
                      value={item.reflectionNotes}
                      className={styles.historyNotes}
                    />
                  ) : null}
                  <div className={styles.historyMeta}>
                    <span>{item.targetSubject}</span>
                    <span aria-hidden="true">·</span>
                    <span>{Math.round(item.focusMinutes * 10) / 10} mins</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatSessionDate(item.startedAt)}</span>
                  </div>
                </div>
                <div
                  className={cn(styles.starRating, 'text-text-due-soon')}
                  aria-label={`Rating: ${item.rating} out of 5 stars`}
                >
                  {'★'.repeat(item.rating)}
                  {'☆'.repeat(5 - item.rating)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ClearMemory />

      {starting ? (
        <StartRitual
          commitmentsDone={commitmentsDone}
          onCancel={() => setStarting(false)}
          onStart={handleStart}
        />
      ) : null}

      {session.isEnded && totals ? (
        <SessionComplete
          endedEarly={endedEarly}
          focusMinutes={totals.focusMinutes}
          blocksDone={blocksDone}
          blocksTotal={focusBlockTotal}
          streakDays={streakAfter}
          rating={rating}
          onRating={setRating}
          notes={notes}
          onNotes={setNotes}
          thoughts={session.thoughts}
          taskTitle={selectedTask?.title ?? null}
          markDone={markTaskDone}
          onMarkDone={setMarkTaskDone}
          saving={createSession.isPending}
          failed={createSession.isError}
          onSave={() => void handleSaveReflection()}
        />
      ) : null}
    </div>
  );
}

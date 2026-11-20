'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { playPhaseSound } from '@/client/focus-sound';
import {
  getActiveStudySessionRaw,
  getFocusSoundMuted,
  setActiveStudySessionRaw,
  setFocusSoundMuted,
} from '@/client/preferences';
import { useTabTitle, type TabTitleAlert } from '@/client/tab-title';
import type { PlanPhase } from '@/domain/study-plan';
import {
  advanceRun,
  finishRunEarly,
  parseStudyRun,
  pauseRun,
  remainingSeconds,
  resumeRun,
  startRun,
  type StudyRun,
} from '@/domain/study-session';
import { useTransitionRouter } from '@/features/transitions/TransitionProvider';
import { FocusNotification, type FocusNotificationItem } from './FocusNotification';

export const FOCUS_ROOM_HREF = '/focus-room';
export const FREE_SESSION_NAME = 'Free session';

interface SavedSession {
  run: StudyRun;
  name: string;
  taskId: string;
  thoughts: string[];
}

function loadSavedSession(): SavedSession | null {
  const raw = getActiveStudySessionRaw();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SavedSession>;
    const run = parseStudyRun(parsed.run);
    if (!run) return null;
    return {
      run,
      name: typeof parsed.name === 'string' ? parsed.name : '',
      taskId: typeof parsed.taskId === 'string' ? parsed.taskId : '',
      thoughts: Array.isArray(parsed.thoughts)
        ? parsed.thoughts.filter((t): t is string => typeof t === 'string')
        : [],
    };
  } catch {
    return null;
  }
}

export function clock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export interface BeginOptions {
  name: string;
  taskId: string;
}

export interface FocusSessionValue {
  run: StudyRun | null;
  /** Epoch milliseconds of the last tick. */
  now: number;
  name: string;
  taskId: string;
  thoughts: string[];
  /** Quiet mode: the full-screen focus view. It starts with every focus block. */
  quiet: boolean;
  muted: boolean;
  isRunning: boolean;
  isPaused: boolean;
  isEnded: boolean;
  phase: PlanPhase | null;
  secondsRemaining: number;
  begin: (plan: PlanPhase[], options: BeginOptions) => void;
  pause: () => void;
  resume: () => void;
  finishEarly: () => void;
  reset: () => void;
  addThought: (text: string) => void;
  setQuiet: (quiet: boolean) => void;
  setMuted: (muted: boolean) => void;
  /** While true, phase changes stay silent: no sound, toast or title flash. */
  holdAlerts: (hold: boolean) => void;
}

const FocusSessionContext = createContext<FocusSessionValue | null>(null);

export function useFocusSession(): FocusSessionValue {
  const value = useContext(FocusSessionContext);
  if (!value) throw new Error('useFocusSession must be used within a FocusSessionProvider');
  return value;
}

/** Same as `useFocusSession`, but `null` outside the provider (for shell pieces under test). */
export function useOptionalFocusSession(): FocusSessionValue | null {
  return useContext(FocusSessionContext);
}

export function FocusSessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useTransitionRouter();

  const [run, setRun] = useState<StudyRun | null>(null);
  const runRef = useRef<StudyRun | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [name, setName] = useState('');
  const [taskId, setTaskId] = useState('');
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [quiet, setQuiet] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [alert, setAlert] = useState<TabTitleAlert | null>(null);
  const [notification, setNotification] = useState<FocusNotificationItem | null>(null);
  const held = useRef(false);
  const mutedRef = useRef(false);
  const alertCount = useRef(0);
  const onFocusRoom = pathname === FOCUS_ROOM_HREF;
  const onFocusRoomRef = useRef(onFocusRoom);
  const nameRef = useRef(name);

  useEffect(() => {
    onFocusRoomRef.current = onFocusRoom;
    nameRef.current = name;
  }, [onFocusRoom, name]);

  const commitRun = useCallback((next: StudyRun | null) => {
    runRef.current = next;
    setRun(next);
  }, []);

  // Restore the sound preference and any running session after a refresh.
  useEffect(() => {
    const isMuted = getFocusSoundMuted();
    mutedRef.current = isMuted;
    setMutedState(isMuted);
    const saved = loadSavedSession();
    if (!saved) return;
    const current = Date.now();
    setNow(current);
    const resumed = advanceRun(saved.run, current).run;
    commitRun(resumed);
    setName(saved.name);
    setTaskId(saved.taskId);
    setThoughts(saved.thoughts);
    const phase = resumed.plan[resumed.phaseIdx];
    setQuiet(resumed.endedAt === null && phase?.kind === 'focus');
  }, [commitRun]);

  // Keep the saved copy of a running session in step with it.
  useEffect(() => {
    if (run === null) return;
    setActiveStudySessionRaw(JSON.stringify({ run, name, taskId, thoughts }));
  }, [run, name, taskId, thoughts]);

  const announce = useCallback((result: StudyRun) => {
    const finished = result.endedAt !== null;
    const next = result.plan[result.phaseIdx];
    const label = nameRef.current.trim() || FREE_SESSION_NAME;
    const awayFromRoom = !onFocusRoomRef.current;
    setQuiet(!finished && next?.kind === 'focus');
    if (held.current) return;

    if (!mutedRef.current) playPhaseSound(next?.kind === 'focus' && !finished ? 'focus' : 'break');

    alertCount.current += 1;
    const title = finished
      ? `(1) Session done · ${label}`
      : next?.kind === 'focus'
        ? `(1) Back to focus · ${label}`
        : `(1) Time for a break · ${next?.minutes ?? 0} min`;
    setAlert({ text: title, key: alertCount.current });

    setNotification(
      finished
        ? {
            id: alertCount.current,
            kind: 'done',
            title: 'Session complete',
            body: label,
            actionLabel: awayFromRoom ? 'Open Focus Room' : undefined,
          }
        : next?.kind === 'focus'
          ? {
              id: alertCount.current,
              kind: 'focus',
              title: 'Back to focus',
              body: label,
              actionLabel: awayFromRoom ? 'Return to focus' : undefined,
            }
          : {
              id: alertCount.current,
              kind: 'break',
              title: 'Time for a break',
              body: `${next?.minutes ?? 0} minutes. Stand up and stretch.`,
            },
    );
  }, []);

  const isRunning = run !== null && run.endedAt === null;
  const isPaused = run?.pausedAt != null;

  // Timer tick: walks through phases, even after a long sleep.
  useEffect(() => {
    if (!isRunning || isPaused) return undefined;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      const previous = runRef.current;
      if (!previous) return;
      const result = advanceRun(previous, current);
      if (!result.changed) return;
      commitRun(result.run);
      announce(result.run);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, isPaused, commitRun, announce]);

  const begin = useCallback(
    (plan: PlanPhase[], options: BeginOptions) => {
      const current = Date.now();
      setNow(current);
      setName(options.name);
      setTaskId(options.taskId);
      setThoughts([]);
      setAlert(null);
      setNotification(null);
      commitRun(startRun(plan, current));
      setQuiet(true);
      if (!mutedRef.current) playPhaseSound('focus');
    },
    [commitRun],
  );

  const pause = useCallback(() => {
    const current = Date.now();
    setNow(current);
    if (runRef.current) commitRun(pauseRun(runRef.current, current));
  }, [commitRun]);

  const resume = useCallback(() => {
    const current = Date.now();
    setNow(current);
    if (runRef.current) commitRun(resumeRun(runRef.current, current));
  }, [commitRun]);

  const finishEarly = useCallback(() => {
    const current = Date.now();
    setNow(current);
    if (runRef.current) commitRun(finishRunEarly(runRef.current, current));
    setQuiet(false);
  }, [commitRun]);

  const reset = useCallback(() => {
    commitRun(null);
    setThoughts([]);
    setAlert(null);
    setNotification(null);
    setQuiet(false);
    setActiveStudySessionRaw(null);
  }, [commitRun]);

  const addThought = useCallback((text: string) => {
    const trimmed = text.trim();
    if (trimmed) setThoughts((previous) => [...previous, trimmed]);
  }, []);

  const setMuted = useCallback((next: boolean) => {
    mutedRef.current = next;
    setMutedState(next);
    setFocusSoundMuted(next);
  }, []);

  const holdAlerts = useCallback((hold: boolean) => {
    held.current = hold;
  }, []);

  const phase = run ? (run.plan[run.phaseIdx] ?? null) : null;
  const inBreak = phase ? phase.kind !== 'focus' : false;
  const secondsRemaining = run ? remainingSeconds(run, now) : 0;
  const label = name.trim() || FREE_SESSION_NAME;
  const isEnded = run !== null && run.endedAt !== null;

  useTabTitle({
    title: !run
      ? null
      : isEnded
        ? `Done · ${label}`
        : isPaused
          ? `❚❚ Paused · ${label}`
          : `${inBreak ? '☕' : '▶'} ${clock(secondsRemaining)} · ${inBreak ? 'Break' : label}`,
    alert,
  });

  const dismissNotification = useCallback(() => setNotification(null), []);
  const openFocusRoom = useCallback(() => {
    setNotification(null);
    router.push(FOCUS_ROOM_HREF);
  }, [router]);

  const value = useMemo<FocusSessionValue>(
    () => ({
      run,
      now,
      name,
      taskId,
      thoughts,
      quiet,
      muted,
      isRunning,
      isPaused,
      isEnded,
      phase,
      secondsRemaining,
      begin,
      pause,
      resume,
      finishEarly,
      reset,
      addThought,
      setQuiet,
      setMuted,
      holdAlerts,
    }),
    [
      run,
      now,
      name,
      taskId,
      thoughts,
      quiet,
      muted,
      isRunning,
      isPaused,
      isEnded,
      phase,
      secondsRemaining,
      begin,
      pause,
      resume,
      finishEarly,
      reset,
      addThought,
      setMuted,
      holdAlerts,
    ],
  );

  return (
    <FocusSessionContext.Provider value={value}>
      {children}
      <FocusNotification
        item={notification}
        onDismiss={dismissNotification}
        onAction={openFocusRoom}
      />
    </FocusSessionContext.Provider>
  );
}

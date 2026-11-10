import { randomUUID } from 'node:crypto';
import type {
  CreateHabitInput,
  HabitItem,
  LogScreenTimeInput,
  LogSleepInput,
  ScreenTimeLog,
  SleepLog,
  TrackingData,
} from '@/contracts/tracking';
import { JsonFileStore } from '@/services/storage/json-store';

interface StoredTrackingState {
  id: string;
  habits: HabitItem[];
  sleepLogs: SleepLog[];
  screenTimeLogs: ScreenTimeLog[];
}

const todayStr = new Date().toISOString().slice(0, 10);
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const twoDaysAgoStr = new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10);

const initialHabits: HabitItem[] = [
  {
    id: 'habit-1',
    title: 'Morning calisthenics & stretching (20 mins)',
    category: 'health',
    targetFrequency: 'daily',
    streakDays: 6,
    completedDates: [twoDaysAgoStr, yesterdayStr, todayStr],
    active: true,
  },
  {
    id: 'habit-2',
    title: 'Calculus I & Physics problem solving set',
    category: 'learning',
    targetFrequency: 'daily',
    streakDays: 8,
    completedDates: [twoDaysAgoStr, yesterdayStr, todayStr],
    active: true,
  },
  {
    id: 'habit-3',
    title: 'Code commit on Go Game engine or personal projects',
    category: 'learning',
    targetFrequency: 'daily',
    streakDays: 5,
    completedDates: [twoDaysAgoStr, yesterdayStr],
    active: true,
  },
  {
    id: 'habit-4',
    title: 'Physical book reading (20 pages)',
    category: 'mindfulness',
    targetFrequency: 'daily',
    streakDays: 4,
    completedDates: [twoDaysAgoStr, yesterdayStr],
    active: true,
  },
  {
    id: 'habit-5',
    title: 'Evening device shutdown 30m before sleep',
    category: 'routine',
    targetFrequency: 'daily',
    streakDays: 3,
    completedDates: [twoDaysAgoStr, yesterdayStr],
    active: true,
  },
];

const initialSleepLogs: SleepLog[] = [
  {
    id: 'sleep-1',
    date: todayStr,
    bedTime: '23:30',
    wakeTime: '07:00',
    durationHours: 7.5,
    qualityRating: 5,
    sleepDebtMinutes: 0,
    notes: 'Deep restful sleep, woke up naturally without alarm shock.',
  },
  {
    id: 'sleep-2',
    date: yesterdayStr,
    bedTime: '23:45',
    wakeTime: '06:45',
    durationHours: 7.0,
    qualityRating: 4,
    sleepDebtMinutes: 30,
    notes: 'Slightly later bedtime due to code debugging, but clear morning energy.',
  },
  {
    id: 'sleep-3',
    date: twoDaysAgoStr,
    bedTime: '23:15',
    wakeTime: '07:15',
    durationHours: 8.0,
    qualityRating: 5,
    sleepDebtMinutes: 0,
    notes: 'Full recovery sleep. Perfect REM cycle alignment.',
  },
];

const initialScreenTimeLogs: ScreenTimeLog[] = [
  {
    id: 'scr-1',
    date: todayStr,
    totalMinutes: 320,
    productiveMinutes: 260,
    leisureMinutes: 60,
    notes: 'APCS coding, learning room focus session, and architecture writing.',
  },
  {
    id: 'scr-2',
    date: yesterdayStr,
    totalMinutes: 360,
    productiveMinutes: 290,
    leisureMinutes: 70,
    notes: 'Go Game engine algorithms and calculus homework.',
  },
  {
    id: 'scr-3',
    date: twoDaysAgoStr,
    totalMinutes: 300,
    productiveMinutes: 240,
    leisureMinutes: 60,
    notes: 'Lecture slides review and reading.',
  },
];

const trackingStore = new JsonFileStore<StoredTrackingState>('tracking-data.json', [
  {
    id: 'singleton-tracking-state',
    habits: initialHabits,
    sleepLogs: initialSleepLogs,
    screenTimeLogs: initialScreenTimeLogs,
  },
]);

export class TrackingService {
  private async getState(): Promise<StoredTrackingState> {
    const list = await trackingStore.getAll();
    if (list[0]) return list[0];
    const defaultState: StoredTrackingState = {
      id: 'singleton-tracking-state',
      habits: initialHabits,
      sleepLogs: initialSleepLogs,
      screenTimeLogs: initialScreenTimeLogs,
    };
    await trackingStore.save(defaultState);
    return defaultState;
  }

  async getTrackingData(): Promise<TrackingData> {
    const state = await this.getState();
    const today = new Date().toISOString().slice(0, 10);

    const completedToday = state.habits.filter((h) => h.completedDates.includes(today)).length;
    const rate = state.habits.length > 0 ? Math.round((completedToday / state.habits.length) * 100) : 0;

    const avgSleep =
      state.sleepLogs.length > 0
        ? Math.round(
            (state.sleepLogs.reduce((acc, s) => acc + s.durationHours, 0) / state.sleepLogs.length) *
              10,
          ) / 10
        : 7.5;

    const totalProd = state.screenTimeLogs.reduce((acc, s) => acc + s.productiveMinutes, 0);
    const totalTime = state.screenTimeLogs.reduce((acc, s) => acc + s.totalMinutes, 0);
    const prodRatio = totalTime > 0 ? Math.round((totalProd / totalTime) * 100) : 80;

    return {
      habits: state.habits,
      sleepLogs: state.sleepLogs,
      screenTimeLogs: state.screenTimeLogs,
      stats: {
        overallHabitCompletionRate: rate,
        averageSleepHours: avgSleep,
        averageProductiveRatio: prodRatio,
        activeStreakDays: 6,
      },
    };
  }

  async toggleHabit(habitId: string, date: string): Promise<HabitItem | null> {
    const state = await this.getState();
    const habit = state.habits.find((h) => h.id === habitId);
    if (!habit) return null;

    const index = habit.completedDates.indexOf(date);
    if (index >= 0) {
      habit.completedDates.splice(index, 1);
      habit.streakDays = Math.max(0, habit.streakDays - 1);
    } else {
      habit.completedDates.push(date);
      habit.streakDays += 1;
    }

    await trackingStore.save(state);
    return habit;
  }

  async createHabit(input: CreateHabitInput): Promise<HabitItem> {
    const state = await this.getState();
    const newHabit: HabitItem = {
      id: `habit-${randomUUID().slice(0, 8)}`,
      title: input.title,
      category: input.category ?? 'routine',
      targetFrequency: input.targetFrequency ?? 'daily',
      streakDays: 0,
      completedDates: [],
      active: true,
    };

    state.habits.push(newHabit);
    await trackingStore.save(state);
    return newHabit;
  }

  async logSleep(input: LogSleepInput): Promise<SleepLog> {
    const state = await this.getState();
    const newLog: SleepLog = {
      id: `sleep-${randomUUID().slice(0, 8)}`,
      date: input.date,
      bedTime: input.bedTime,
      wakeTime: input.wakeTime,
      durationHours: input.durationHours,
      qualityRating: input.qualityRating ?? 4,
      sleepDebtMinutes: Math.max(0, Math.round((8 - input.durationHours) * 60)),
      notes: input.notes ?? '',
    };

    state.sleepLogs.unshift(newLog);
    await trackingStore.save(state);
    return newLog;
  }

  async logScreenTime(input: LogScreenTimeInput): Promise<ScreenTimeLog> {
    const state = await this.getState();
    const newLog: ScreenTimeLog = {
      id: `scr-${randomUUID().slice(0, 8)}`,
      date: input.date,
      totalMinutes: input.totalMinutes,
      productiveMinutes: input.productiveMinutes,
      leisureMinutes: input.leisureMinutes,
      notes: input.notes ?? '',
    };

    state.screenTimeLogs.unshift(newLog);
    await trackingStore.save(state);
    return newLog;
  }
}

export const trackingService = new TrackingService();


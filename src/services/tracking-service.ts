import { formatScheduledDate, shiftScheduledDate } from '@/domain/time';
import { consecutiveDays } from '@/domain/activity-days';
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

const trackingStore = new JsonFileStore<StoredTrackingState>('tracking-data.json');

export class TrackingService {
  private async getState(): Promise<StoredTrackingState> {
    const list = await trackingStore.getAll();
    if (list[0]) return list[0];
    const defaultState: StoredTrackingState = {
      id: 'singleton-tracking-state',
      habits: [],
      sleepLogs: [],
      screenTimeLogs: [],
    };
    return defaultState;
  }

  async getTrackingData(): Promise<TrackingData> {
    const state = await this.getState();
    const today = formatScheduledDate(new Date());
    const from = shiftScheduledDate(today, -6);
    const sleepWindow = state.sleepLogs.filter(log => log.date >= from && log.date <= today);
    const screenWindow = state.screenTimeLogs.filter(log => log.date >= from && log.date <= today);
    state.habits = state.habits.map(h => ({ ...h, streakDays: consecutiveDays(h.completedDates, today) }));

    const completedToday = state.habits.filter((h) => h.completedDates.includes(today)).length;
    const rate = state.habits.length > 0 ? Math.round((completedToday / state.habits.length) * 100) : 0;

    const avgSleep =
      sleepWindow.length > 0
        ? Math.round(
            (sleepWindow.reduce((acc, s) => acc + s.durationHours, 0) / sleepWindow.length) *
              10,
          ) / 10
        : 0;

    const totalProd = screenWindow.reduce((acc, s) => acc + s.productiveMinutes, 0);
    const totalTime = screenWindow.reduce((acc, s) => acc + s.totalMinutes, 0);
    const prodRatio = totalTime > 0 ? Math.round((totalProd / totalTime) * 100) : 0;

    return {
      habits: state.habits,
      sleepLogs: state.sleepLogs,
      screenTimeLogs: state.screenTimeLogs,
      stats: {
        overallHabitCompletionRate: rate,
        averageSleepHours: avgSleep,
        averageProductiveRatio: prodRatio,
        activeStreakDays: consecutiveDays(state.habits.flatMap(h => h.completedDates), today),
      },
    };
  }

  async toggleHabit(habitId: string, date: string): Promise<HabitItem | null> {
    return trackingStore.update(await this.getState(), (state) => {
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

      habit.streakDays = consecutiveDays(habit.completedDates, formatScheduledDate(new Date()));
      return habit;
    });
  }

  async createHabit(input: CreateHabitInput): Promise<HabitItem> {
    return trackingStore.update(await this.getState(), (state) => {
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
      return newHabit;
    });
  }

  async logSleep(input: LogSleepInput): Promise<SleepLog> {
    return trackingStore.update(await this.getState(), (state) => {
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
      return newLog;
    });
  }

  async logScreenTime(input: LogScreenTimeInput): Promise<ScreenTimeLog> {
    return trackingStore.update(await this.getState(), (state) => {
      const newLog: ScreenTimeLog = {
        id: `scr-${randomUUID().slice(0, 8)}`,
        date: input.date,
        totalMinutes: input.totalMinutes,
        productiveMinutes: input.productiveMinutes,
        leisureMinutes: input.leisureMinutes,
        notes: input.notes ?? '',
      };

      state.screenTimeLogs.unshift(newLog);
      return newLog;
    });
  }
}

export const trackingService = new TrackingService();


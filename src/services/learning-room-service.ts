import { formatScheduledDate } from '@/domain/time';
import { consecutiveDays } from '@/domain/activity-days';
import { randomUUID } from 'node:crypto';
import type {
  CreateLearningSessionInput,
  LearningRoomStats,
  LearningSession,
} from '@/contracts/learning-room';
import { JsonFileStore } from '@/services/storage/json-store';

const sessionStore = new JsonFileStore<LearningSession>('learning-room-sessions.json');

export class LearningRoomService {
  async getSessions(): Promise<LearningSession[]> {
    const list = await sessionStore.getAll();
    return [...list].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
  }

  async createSession(input: CreateLearningSessionInput): Promise<LearningSession> {
    const now = new Date().toISOString();

    const newSession: LearningSession = {
      id: `lr-${randomUUID().slice(0, 8)}`,
      title: input.title,
      mode: input.mode ?? 'pomodoro',
      targetSubject: input.targetSubject ?? 'General',
      relatedProjectId: input.relatedProjectId ?? null,
      relatedTaskId: input.relatedTaskId ?? null,
      startedAt: input.startedAt ?? new Date(Date.parse(now) - ((input.focusMinutes ?? 0) + (input.breakMinutes ?? 0) + (input.pausedMinutes ?? 0)) * 60000).toISOString(),
      completedAt: input.completedAt ?? now,
      durationMinutes: input.durationMinutes ?? 25,
      focusMinutes: input.focusMinutes ?? 0,
      breakMinutes: input.breakMinutes ?? 0,
      pausedMinutes: input.pausedMinutes ?? 0,
      status: input.status ?? 'completed',
      reflectionNotes: input.reflectionNotes ?? '',
      rating: input.rating ?? 4,
    };

    await sessionStore.save(newSession);
    return newSession;
  }

  async getStats(): Promise<LearningRoomStats> {
    const sessions = await this.getSessions();
    const completed = sessions.filter((s) => s.status === 'completed');

    const totalFocusMinutes = completed.reduce((sum, s) => sum + (s.focusMinutes || 0), 0);
    const totalPausedMinutes = completed.reduce((sum, s) => sum + (s.pausedMinutes || 0), 0);
    const totalStudyMinutes = completed.reduce(
      (sum, s) => sum + (s.focusMinutes || 0) + (s.breakMinutes || 0),
      0,
    );

    // Subject breakdown
    const subjectMap: Record<string, number> = {};
    for (const s of completed) {
      const sub = s.targetSubject || 'General';
      subjectMap[sub] = (subjectMap[sub] || 0) + s.focusMinutes;
    }

    const subjectBreakdown = Object.entries(subjectMap)
      .map(([subject, minutes]) => ({
        subject,
        minutes,
        percentage: totalFocusMinutes > 0 ? Math.round((minutes / totalFocusMinutes) * 100) : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    // Last 7 days history
    const dailyMap: Record<string, { focus: number; break: number; count: number }> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = formatScheduledDate(d);
      dailyMap[dateKey] = { focus: 0, break: 0, count: 0 };
    }

    for (const s of completed) {
      const dateKey = formatScheduledDate(s.startedAt);
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].focus += s.focusMinutes;
        dailyMap[dateKey].break += s.breakMinutes;
        dailyMap[dateKey].count += 1;
      }
    }

    const dailyHistory = Object.entries(dailyMap).map(([date, data]) => ({
      date,
      focusMinutes: data.focus,
      breakMinutes: data.break,
      sessionCount: data.count,
    }));

    return {
      totalFocusMinutes,
      totalStudyMinutes,
      totalPausedMinutes,
      totalSessions: sessions.length,
      completedSessions: completed.length,
      streakDays: consecutiveDays(completed.map(s => formatScheduledDate(s.startedAt)), formatScheduledDate(new Date())),
      subjectBreakdown,
      dailyHistory,
    };
  }
}

export const learningRoomService = new LearningRoomService();

import { randomUUID } from 'node:crypto';
import type {
  CreateLearningSessionInput,
  LearningRoomStats,
  LearningSession,
} from '@/contracts/learning-room';
import { JsonFileStore } from '@/services/storage/json-store';

const initialSessions: LearningSession[] = [
  {
    id: 'lr-seed-1',
    title: 'Calculus I - Derivatives and limits problem set',
    mode: 'pomodoro',
    targetSubject: 'Calculus I',
    relatedProjectId: null,
    relatedTaskId: null,
    startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2 + 1500000).toISOString(),
    durationMinutes: 25,
    focusMinutes: 25,
    breakMinutes: 5,
    pausedMinutes: 0,
    status: 'completed',
    reflectionNotes: 'Solved 8 derivative chain rule problems. Concept is solid.',
    rating: 5,
  },
  {
    id: 'lr-seed-2',
    title: 'CS160 - Go game engine board representation in C++',
    mode: 'deep_focus',
    targetSubject: 'CS160',
    relatedProjectId: 'proj-gogame',
    relatedTaskId: null,
    startedAt: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2 + 10200000).toISOString(),
    durationMinutes: 50,
    focusMinutes: 50,
    breakMinutes: 10,
    pausedMinutes: 2,
    status: 'completed',
    reflectionNotes: 'Implemented 19x19 board array and liberty checking logic.',
    rating: 5,
  },
  {
    id: 'lr-seed-3',
    title: 'Physics I - Rotational kinematics and moment of inertia',
    mode: 'pomodoro',
    targetSubject: 'Physics I',
    relatedProjectId: null,
    relatedTaskId: null,
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86400000 + 1500000).toISOString(),
    durationMinutes: 25,
    focusMinutes: 25,
    breakMinutes: 5,
    pausedMinutes: 1,
    status: 'completed',
    reflectionNotes: 'Clarified parallel axis theorem with textbook problems.',
    rating: 4,
  },
  {
    id: 'lr-seed-4',
    title: 'AI Engineering - Transformer attention heads architecture review',
    mode: 'deep_focus',
    targetSubject: 'AI Engineering',
    relatedProjectId: 'proj-agent-core',
    relatedTaskId: null,
    startedAt: new Date(Date.now() - 86400000 + 7200000).toISOString(),
    completedAt: new Date(Date.now() - 86400000 + 10200000).toISOString(),
    durationMinutes: 50,
    focusMinutes: 48,
    breakMinutes: 10,
    pausedMinutes: 2,
    status: 'completed',
    reflectionNotes: 'Read Vaswani et al. Section 3. Key takeaway: multi-head projection spaces.',
    rating: 5,
  },
  {
    id: 'lr-seed-5',
    title: 'CM102 - Scientific presentation slides drafting',
    mode: 'quick_review',
    targetSubject: 'CM102',
    relatedProjectId: null,
    relatedTaskId: null,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    durationMinutes: 15,
    focusMinutes: 15,
    breakMinutes: 0,
    pausedMinutes: 0,
    status: 'completed',
    reflectionNotes: 'Outlined 5 core slides for next week presentation.',
    rating: 4,
  },
];

const sessionStore = new JsonFileStore<LearningSession>(
  'learning-room-sessions.json',
  initialSessions,
);

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
      startedAt: now,
      completedAt: now,
      durationMinutes: input.durationMinutes ?? 25,
      focusMinutes: input.focusMinutes ?? input.durationMinutes ?? 25,
      breakMinutes: input.breakMinutes ?? 5,
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
      const dateKey = d.toISOString().slice(0, 10);
      dailyMap[dateKey] = { focus: 0, break: 0, count: 0 };
    }

    for (const s of completed) {
      const dateKey = s.startedAt.slice(0, 10);
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
      streakDays: 5,
      subjectBreakdown,
      dailyHistory,
    };
  }
}

export const learningRoomService = new LearningRoomService();
